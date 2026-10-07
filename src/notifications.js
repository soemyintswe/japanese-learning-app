// src/notifications.js — in-app realtime notifications (FCM မလို; app ပွင့်နေတုန်း)
// ta'm: chat unread (lastReadAt per user) + pending approvals (admin)
//   + 📣 broadcast notices + 📖 new lessons/assignments + 📝 new submissions (staff)
//   + 🏅 graded (student) + ⏰ due-soon assignments (student, computed)
// Bell badge + panel + one-tap actions + openChat/openTeaching (navRef) + web document.title count.
// LIMIT (free tier): NO background push — everything fires while app is open.
// True FCM push needs Blaze (Cloud Functions) + native build = roadmap (see HANDOVER).
import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { Platform } from 'react-native';
import { createNavigationContainerRef } from '@react-navigation/native';
import { collection, query, where, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { db } from './firebase';

export const navRef = createNavigationContainerRef();
const ADMIN_EMAIL = 'soemyintswe@gmail.com';
const READ_KEY = '@japanese_notif_read_v1';

const Ctx = createContext(null);
export const useNotifications = () => useContext(Ctx);

function otherName(c, uid) {
  const otherId = (c.members || []).find((m) => m !== uid);
  if (c.memberNames && otherId && c.memberNames[otherId]) return c.memberNames[otherId];
  return c.type === 'group' ? (c.name || 'Group') : 'Chat';
}

function parseDue(s) {
  if (!s) return 0;
  const m = String(s).match(/(\d{4})[^\d]?(\d{1,2})[^\d]?(\d{1,2})/);
  if (!m) return 0;
  const t = Date.parse(`${m[1]}-${String(m[2]).padStart(2, '0')}-${String(m[3]).padStart(2, '0')}`);
  return Number.isNaN(t) ? 0 : t;
}

export function NotificationProvider({ user, children }) {
  const [chats, setChats] = useState([]);
  const [pending, setPending] = useState([]);
  const [notices, setNotices] = useState([]);
  const [assigns, setAssigns] = useState([]);
  const [subs, setSubs] = useState([]); // staff: all recent / student: own (listener differs)
  const [panelOpen, setPanelOpen] = useState(false);
  const [readMap, setReadMap] = useState({});
  const isAdmin = (user?.email || '').toLowerCase() === ADMIN_EMAIL.toLowerCase() || user?.role === 'admin';
  const isStaff = isAdmin || user?.role === 'teacher';

  // last-read markers (per device)
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(READ_KEY);
        if (raw) setReadMap(JSON.parse(raw) || {});
      } catch (e) {}
    })();
  }, []);

  const stampRead = async (keys) => {
    const now = new Date().toISOString();
    const next = { ...readMap };
    keys.forEach((k) => { next[k] = now; });
    setReadMap(next);
    try {
      await AsyncStorage.setItem(READ_KEY, JSON.stringify(next));
    } catch (e) {}
  };

  useEffect(() => {
    if (!user?.uid) {
      setChats([]);
      setPending([]);
      setNotices([]);
      setAssigns([]);
      setSubs([]);
      setPanelOpen(false);
      return;
    }
    const cleanups = [];
    cleanups.push(onSnapshot(
      query(collection(db, 'chats'), where('members', 'array-contains', user.uid)),
      (snap) => {
        const arr = [];
        snap.forEach((d) => arr.push({ id: d.id, ...d.data() }));
        setChats(arr);
      },
      () => {}
    ));
    cleanups.push(onSnapshot(
      collection(db, 'notices'),
      (snap) => {
        const arr = [];
        snap.forEach((d) => arr.push({ id: d.id, ...d.data() }));
        arr.sort((a, b) => String(b.at || '').localeCompare(String(a.at || '')));
        setNotices(arr.slice(0, 20));
      },
      () => {}
    ));
    cleanups.push(onSnapshot(
      collection(db, 'assignments'),
      (snap) => {
        const arr = [];
        snap.forEach((d) => arr.push({ id: d.id, ...d.data() }));
        arr.sort((a, b) => String(b.at || '').localeCompare(String(a.at || '')));
        setAssigns(arr.slice(0, 50));
      },
      () => {}
    ));
    if (isStaff) {
      // school scale: submissions few; photos make docs heavy — slice latest 100 client-side
      cleanups.push(onSnapshot(
        collection(db, 'submissions'),
        (snap) => {
          const arr = [];
          snap.forEach((d) => arr.push({ id: d.id, ...d.data() }));
          arr.sort((a, b) => String(b.at || '').localeCompare(String(a.at || '')));
          setSubs(arr.slice(0, 100));
        },
        () => {}
      ));
    } else {
      cleanups.push(onSnapshot(
        query(collection(db, 'submissions'), where('uid', '==', user.uid)),
        (snap) => {
          const arr = [];
          snap.forEach((d) => arr.push({ id: d.id, ...d.data() }));
          setSubs(arr);
        },
        () => {}
      ));
    }
    let unsubPending = null;
    if (isAdmin) {
      unsubPending = onSnapshot(
        query(collection(db, 'users'), where('status', '==', 'pending')),
        (snap) => {
          const arr = [];
          snap.forEach((d) => arr.push({ id: d.id, ...d.data() }));
          setPending(arr);
        },
        () => {}
      );
    } else {
      setPending([]);
    }
    return () => {
      cleanups.forEach((u) => { try { u(); } catch (e) {} });
      if (unsubPending) unsubPending();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.uid, isAdmin, isStaff]);

  // panel ဖွင့်ကြည့်ရင် notices/teaching/subs/grades read-mark (chats/pending/due = ကိုယ်ပိုင် logic)
  useEffect(() => {
    if (panelOpen) stampRead(['notices', 'teaching', 'subs', 'grades']);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [panelOpen]);

  const unread = useMemo(() => {
    if (!user?.uid) return [];
    return chats
      .filter((c) => {
        const lm = c.lastMessage;
        if (!lm || !lm.text) return false;
        if (lm.byUid && lm.byUid === user.uid) return false; // ကိုယ်ပို့တာ
        const readAt = (c.lastReadAt && c.lastReadAt[user.uid]) || '';
        if (!lm.byUid && !readAt) return false; // အဟောင်း msgs: default read (false badge ကာကွယ်)
        return String(c.updatedAt || '') > String(readAt || '');
      })
      .map((c) => ({
        id: c.id,
        title: c.type === 'group' ? (c.name || 'Group') : otherName(c, user.uid),
        preview: (c.lastMessage.by ? c.lastMessage.by + ': ' : '') + c.lastMessage.text,
        at: c.lastMessage.at || c.updatedAt,
      }))
      .sort((a, b) => String(b.at || '').localeCompare(String(a.at || '')));
  }, [chats, user?.uid]);

  const newNotices = useMemo(() => {
    const since = readMap.notices || '';
    return notices
      .filter((n) => String(n.at || '') > String(since))
      .map((n) => ({ id: n.id, title: n.title || '', preview: n.body || '', at: n.at || '' }));
  }, [notices, readMap]);

  const newAssigns = useMemo(() => {
    if (!user?.uid) return [];
    const since = readMap.teaching || '';
    return assigns
      .filter((a) => String(a.at || '') > String(since) && (a.by || '') !== user.uid)
      .map((a) => ({ id: a.id, title: a.title || '', preview: `${a.level || ''}${a.due ? ' · ⏰ ' + a.due : ''}`, at: a.at || '' }));
  }, [assigns, readMap, user?.uid]);

  const newSubs = useMemo(() => {
    if (!isStaff || !user?.uid) return [];
    const since = readMap.subs || '';
    return subs
      .filter((s) => String(s.at || '') > String(since) && (s.uid || '') !== user.uid)
      .map((s) => ({
        id: s.id, assignmentId: s.assignmentId || '',
        title: s.name || s.uid || '', preview: String(s.text || '').slice(0, 80), at: s.at || '',
      }));
  }, [subs, readMap, isStaff, user?.uid]);

  const graded = useMemo(() => {
    if (isStaff || !user?.uid) return [];
    const since = readMap.grades || '';
    return subs
      .filter((s) => {
        const g = s.gradedAt || '';
        const hasScore = String(s.score ?? s.grade ?? '').trim() !== '';
        return hasScore && String(g) > String(since);
      })
      .map((s) => {
        const a = assigns.find((x) => x.id === s.assignmentId);
        return ({
          id: s.id, assignmentId: s.assignmentId || '',
          title: a ? a.title : (s.assignmentId || ''),
          preview: `🏅 ${String(s.score ?? s.grade ?? '').trim()}${s.slevel ? ' [' + s.slevel + ']' : ''}${s.feedback ? ' — ' + s.feedback : ''}`,
          at: s.gradedAt || s.at || '',
        });
      });
  }, [subs, readMap, isStaff, user?.uid, assigns]);

  const dueSoon = useMemo(() => {
    if (isStaff || !user?.uid) return [];
    const now = Date.now();
    const done = new Set(subs.map((s) => s.assignmentId));
    return assigns
      .filter((a) => {
        const t = parseDue(a.due);
        if (!t || done.has(a.id)) return false;
        const diff = t - now;
        return diff < 3 * 24 * 3600 * 1000; // 3 ရက်အတွင်း + overdue (diff<0 ပါ)
      })
      .map((a) => ({
        id: a.id, title: a.title || '',
        preview: `⏰ ${a.due}${parseDue(a.due) < now ? ' — overdue!' : ''}`,
        at: a.due || '',
      }))
      .sort((a, b) => String(a.at).localeCompare(String(b.at)));
  }, [assigns, subs, isStaff, user?.uid]);

  const assignTitle = (id) => {
    const a = assigns.find((x) => x.id === id);
    return a ? a.title : id;
  };

  const count = unread.length + (isAdmin ? pending.length : 0)
    + newNotices.length + newAssigns.length + newSubs.length + graded.length + dueSoon.length;

  // web tab title badge
  useEffect(() => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      document.title = count > 0 ? `(${count}) Japanese Study Planner` : 'Japanese Study Planner';
    }
  }, [count]);

  const openChat = (chatId) => {
    setPanelOpen(false);
    try {
      if (navRef.isReady()) navRef.navigate('Community', { seg: 'chats', openChatId: chatId });
    } catch (e) {}
  };

  const openTeaching = () => {
    stampRead(['teaching', 'subs', 'grades']);
    setPanelOpen(false);
    try {
      if (navRef.isReady()) navRef.navigate('Teaching');
    } catch (e) {}
  };

  const markChatRead = async (chatId) => {
    if (!user?.uid) return;
    try {
      await updateDoc(doc(db, 'chats', chatId), {
        [`lastReadAt.${user.uid}`]: new Date().toISOString(),
      });
    } catch (e) {}
  };

  const approveUser = async (uid) => {
    try {
      await updateDoc(doc(db, 'users', uid), { status: 'active' });
      return true;
    } catch (e) {
      return false;
    }
  };

  const disableUser = async (uid) => {
    try {
      await updateDoc(doc(db, 'users', uid), { status: 'disabled' });
      return true;
    } catch (e) {
      return false;
    }
  };

  return (
    <Ctx.Provider
      value={{
        unread, pending, isAdmin, isStaff, count, panelOpen, setPanelOpen,
        openChat, openTeaching, markChatRead, approveUser, disableUser,
        newNotices, newAssigns, newSubs, graded, dueSoon, assignTitle,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

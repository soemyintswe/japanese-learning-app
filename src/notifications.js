// src/notifications.js — in-app realtime notifications (FCM မလို; app ပွင့်နေတုန်း)
// ta'm: chat unread (lastReadAt per user) + pending approvals (admin)
// Bell badge + panel + one-tap approve + openChat (navRef) + web document.title count.
import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { Platform } from 'react-native';
import { createNavigationContainerRef } from '@react-navigation/native';
import { collection, query, where, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { db } from './firebase';

export const navRef = createNavigationContainerRef();
const ADMIN_EMAIL = 'soemyintswe@gmail.com';

const Ctx = createContext(null);
export const useNotifications = () => useContext(Ctx);

function otherName(c, uid) {
  const otherId = (c.members || []).find((m) => m !== uid);
  if (c.memberNames && otherId && c.memberNames[otherId]) return c.memberNames[otherId];
  return c.type === 'group' ? (c.name || 'Group') : 'Chat';
}

export function NotificationProvider({ user, children }) {
  const [chats, setChats] = useState([]);
  const [pending, setPending] = useState([]);
  const [panelOpen, setPanelOpen] = useState(false);
  const isAdmin = (user?.email || '').toLowerCase() === ADMIN_EMAIL.toLowerCase() || user?.role === 'admin';

  useEffect(() => {
    if (!user?.uid) {
      setChats([]);
      setPending([]);
      setPanelOpen(false);
      return;
    }
    const unsubChats = onSnapshot(
      query(collection(db, 'chats'), where('members', 'array-contains', user.uid)),
      (snap) => {
        const arr = [];
        snap.forEach((d) => arr.push({ id: d.id, ...d.data() }));
        setChats(arr);
      },
      () => {}
    );
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
      unsubChats();
      if (unsubPending) unsubPending();
    };
  }, [user?.uid, isAdmin]);

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

  const count = unread.length + (isAdmin ? pending.length : 0);

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
      value={{ unread, pending, isAdmin, count, panelOpen, setPanelOpen, openChat, markChatRead, approveUser, disableUser }}
    >
      {children}
    </Ctx.Provider>
  );
}

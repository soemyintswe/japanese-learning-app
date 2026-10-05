// src/presence.js — Firestore heartbeat presence (Active/idle/offline)
// Design: app ပွင့်နေရင် 60s တိုင်း lastSeenAt ရေး; touch/mouse/keyboard လှုပ်ရင် lastActiveAt ရေး.
//   active  = seen <3min AND active <10min
//   idle    = seen <15min (ဖွင့်ထားပေမယ့် မလှုပ် / background)
//   offline = seen >15min (ပိတ်/heartbeat ရပ်)
// NOTE: Realtime Database onDisconnect မဟုတ် — 1~3 မိနစ် နောက်ကျနိုင်တယ် (school app အတွက် လုံလောက်).
import { useEffect } from 'react';
import { Platform } from 'react-native';
import { doc, setDoc } from 'firebase/firestore';
import { db } from './firebase';

let currentUid = null;
let lastTouchWrite = 0;

export function markActiveNow() {
  if (!currentUid) return;
  const now = Date.now();
  if (now - lastTouchWrite < 30000) return; // 30s throttle (write စရိတ် သက်သာအောင်)
  lastTouchWrite = now;
  setDoc(doc(db, 'users', currentUid), { lastActiveAt: new Date(now).toISOString() }, { merge: true }).catch(() => {});
}

export function usePresence(user) {
  useEffect(() => {
    currentUid = user?.uid || null;
    if (!user?.uid) return;
    const beat = () => {
      setDoc(doc(db, 'users', user.uid), { lastSeenAt: new Date().toISOString() }, { merge: true }).catch(() => {});
    };
    beat();
    const timer = setInterval(beat, 60000);
    // Web: mouse/keyboard လှုပ်တာ ဖမ်း (native က App root onTouchStart က ဖမ်းမယ်)
    let webCleanup = null;
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      const h = () => markActiveNow();
      ['mousemove', 'keydown', 'click'].forEach((ev) => document.addEventListener(ev, h, { passive: true }));
      webCleanup = () => ['mousemove', 'keydown', 'click'].forEach((ev) => document.removeEventListener(ev, h));
    }
    return () => {
      clearInterval(timer);
      if (webCleanup) webCleanup();
      currentUid = null;
    };
  }, [user?.uid]);
}

export function presenceOf(u, nowTs) {
  const now = nowTs || Date.now();
  const seen = u && u.lastSeenAt ? Date.parse(u.lastSeenAt) : 0;
  const act = u && u.lastActiveAt ? Date.parse(u.lastActiveAt) : 0;
  if (!seen || Number.isNaN(seen) || now - seen > 15 * 60 * 1000) return 'offline';
  if (now - seen > 3 * 60 * 1000) return 'idle';
  if (!act || Number.isNaN(act) || now - act > 10 * 60 * 1000) return 'idle';
  return 'active';
}

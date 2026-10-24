// Anonymous, device-scoped guest counts for the admin Community report.
import { collection, doc, onSnapshot, setDoc } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { db } from './firebase';

const GUEST_ID_KEY = '@japanese_guest_report_id_v1';
let lastActiveWrite = 0;

async function getGuestId() {
  let id = await AsyncStorage.getItem(GUEST_ID_KEY);
  if (!id) {
    id = `g_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 14)}`;
    await AsyncStorage.setItem(GUEST_ID_KEY, id);
  }
  return id;
}

export async function recordGuestSession() {
  try {
    const id = await getGuestId();
    const now = new Date().toISOString();
    await setDoc(doc(db, 'guestSessions', id), {
      lastSeenAt: now,
      lastActiveAt: now,
    }, { merge: true });
  } catch (e) {
    // Guest mode remains available if the optional report write is offline/denied.
    console.warn('Guest session report write failed', e?.code || e?.message || e);
  }
}

export async function heartbeatGuestSession() {
  try {
    const id = await getGuestId();
    await setDoc(doc(db, 'guestSessions', id), { lastSeenAt: new Date().toISOString() }, { merge: true });
  } catch (e) {
    console.warn('Guest session heartbeat failed', e?.code || e?.message || e);
  }
}

export async function markGuestActive() {
  const now = Date.now();
  if (now - lastActiveWrite < 30000) return;
  lastActiveWrite = now;
  try {
    const id = await getGuestId();
    await setDoc(doc(db, 'guestSessions', id), { lastActiveAt: new Date().toISOString() }, { merge: true });
  } catch (e) {
    console.warn('Guest activity report failed', e?.code || e?.message || e);
  }
}

export function subscribeGuestSessions(onSnapshotUpdate, onError) {
  return onSnapshot(
    collection(db, 'guestSessions'),
    onSnapshotUpdate,
    onError,
  );
}

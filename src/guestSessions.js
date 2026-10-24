// Anonymous, device-scoped guest counts for the admin Community report.
import { collection, doc, onSnapshot, serverTimestamp, setDoc } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { db } from './firebase';

const GUEST_ID_KEY = '@japanese_guest_report_id_v1';

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
    await setDoc(doc(db, 'guestSessions', id), {
      lastSeenAt: serverTimestamp(),
    }, { merge: true });
  } catch (e) {
    // Guest mode remains available if the optional report write is offline/denied.
  }
}

export function subscribeGuestCount(onCount, onError) {
  return onSnapshot(
    collection(db, 'guestSessions'),
    (snapshot) => onCount(snapshot.size),
    onError,
  );
}

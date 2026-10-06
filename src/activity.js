// src/activity.js — admin/staff action audit trail (usage ACTIVITY LOG)
// Writes: activity/{autoId} { byUid, by (email prefix), action, target, detail, at }
// Reads: staff only (see firestore.rules). Viewer lives in TeacherScreen (admin section).
// Fail-silent by design — logging must NEVER break the action itself.
import { collection, addDoc } from 'firebase/firestore';
import { db } from './firebase';

export async function logActivity(byUser, action, target, detail) {
  try {
    await addDoc(collection(db, 'activity'), {
      byUid: byUser?.uid || '',
      by: (byUser?.email || '').split('@')[0] || (byUser?.name || ''),
      action: String(action || ''),
      target: String(target || ''),
      detail: String(detail || ''),
      at: new Date().toISOString(),
    });
  } catch (e) {
    console.log('logActivity skipped:', e?.code || e?.message);
  }
}

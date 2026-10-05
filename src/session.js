// src/session.js — Firebase Auth user → Firestore profile resolve
// App.js (refresh restore) + AuthScreen (login/register) နှစ်ခုလုံး ဒါကို သုံးတယ်
//
// နောက်ခံ: Admin က "User အသစ်ထည့်မည်" နဲ့ ဖန်တီးပေးတာက Firestore doc သက်သက်ပါ
// (Firebase Auth login အကောင့် မပါဘူး — ဥပမာ soemyintswe1964@gmail.com)။
// ဒါကြောင့် ကျောင်းသား Email/Google နဲ့ ပထမဆုံး ဝင်မှ:
//   1) users/{uid} doc ကို အရင်ရှာမယ် (ရှိရင် သုံးမယ်)
//   2) မရှိရင် email တူတဲ့ placeholder doc (user_xxx) ကို ရှာပြီး
//      role/status/name ကို ဆက်ခံမယ် + uid doc အသစ်ရေးမယ် + placeholder အဟောင်း ရှင်းမယ်
//   3) Admin email ဆို ACTIVE အမြဲ
import { doc, getDoc, setDoc, collection, query, where, getDocs, deleteDoc } from 'firebase/firestore';
import { db } from './firebase';

export const ADMIN_EMAIL = 'soemyintswe@gmail.com';

// Profile form fields (Community → My Profile) — adopt/create မှာ သယ်သွားမယ်
export const PROFILE_FIELDS = ['phone', 'birthdate', 'gender', 'education', 'jlpt', 'bio', 'photoURL', 'isPublic', 'testedLevel'];

export const PROFILE_DEFAULTS = {
  phone: '', birthdate: '', gender: '', education: '', jlpt: '',
  bio: '', photoURL: null, isPublic: true, testedLevel: '',
};

async function findProfilesByEmail(email) {
  const out = [];
  if (!email) return out;
  const tried = new Set();
  for (const v of [email, email.toLowerCase()]) {
    if (tried.has(v)) continue;
    tried.add(v);
    const snap = await getDocs(query(collection(db, 'users'), where('email', '==', v)));
    snap.forEach((d) => {
      if (!out.some((u) => u.id === d.id)) out.push({ id: d.id, ...d.data() });
    });
  }
  return out;
}

export async function resolveUserProfile(fbUser, defaultName) {
  const email = fbUser.email || '';
  const isAdmin = email.toLowerCase() === ADMIN_EMAIL.toLowerCase();
  let profile = {
    name: defaultName || fbUser.displayName || (email.includes('@') ? email.split('@')[0] : 'User'),
    role: isAdmin ? 'teacher' : 'student',
    status: isAdmin ? 'active' : 'pending',
  };
  let firestoreOk = true;

  try {
    const ref = doc(db, 'users', fbUser.uid);
    const snap = await getDoc(ref);
    if (snap.exists()) {
      const d = snap.data();
      profile = {
        name: d.name || profile.name,
        role: String(d.role || profile.role).toLowerCase(),
        status: String(d.status || profile.status).toLowerCase(),
      };
    } else {
      // uid doc မရှိရင် — Admin ကြိုဖန်တီးပေးထားတဲ့ placeholder ကို email နဲ့ ရှာမယ်
      let placeholder = null;
      try {
        const matches = (await findProfilesByEmail(email)).filter((u) => u.id !== fbUser.uid);
        placeholder = matches.find((u) => String(u.id).startsWith('user_')) || matches[0] || null;
      } catch (qErr) {
        console.log('Placeholder lookup failed:', qErr.message);
        throw qErr;
      }
      const extras = { ...PROFILE_DEFAULTS };
      if (placeholder) {
        profile = {
          name: placeholder.name || profile.name,
          role: String(placeholder.role || profile.role).toLowerCase(),
          status: String(placeholder.status || profile.status).toLowerCase(),
        };
        PROFILE_FIELDS.forEach((f) => {
          if (placeholder[f] !== undefined && placeholder[f] !== null && placeholder[f] !== '') {
            extras[f] = placeholder[f];
          }
        });
      }
      if (fbUser.photoURL && !extras.photoURL) extras.photoURL = fbUser.photoURL;
      await setDoc(ref, {
        uid: fbUser.uid,
        name: profile.name,
        email,
        role: profile.role,
        status: profile.status,
        createdAt: new Date().toISOString(),
        ...extras,
        ...(placeholder ? { migratedFrom: placeholder.id } : {}),
      }, { merge: true });
      // နာမည်တူ placeholder အဟောင်း (user_*) တွေ ရှင်းမယ် — admin list ထပ်မပေါ်အောင်
      if (placeholder) {
        const olds = (await findProfilesByEmail(email)).filter(
          (u) => u.id !== fbUser.uid && String(u.id).startsWith('user_')
        );
        for (const o of olds) {
          try {
            await deleteDoc(doc(db, 'users', o.id));
          } catch (e) {
            console.log('Cleanup placeholder failed:', e.message);
          }
        }
      }
    }
    // Admin email ဆို ACTIVE အမြဲ (အရင် version PENDING ကျန်ခဲ့တာ auto-ပြင်)
    if (isAdmin && profile.status !== 'active') {
      profile.status = 'active';
      if (!profile.role) profile.role = 'teacher';
      try {
        await setDoc(ref, { status: 'active', role: profile.role }, { merge: true });
      } catch (e) {
        console.log('Admin auto-activate failed:', e.message);
      }
    }
  } catch (e) {
    console.error('resolveUserProfile error:', e.code || e.message);
    firestoreOk = false;
  }

  return { ...profile, isAdmin, firestoreOk, photoURL: fbUser.photoURL || null };
}

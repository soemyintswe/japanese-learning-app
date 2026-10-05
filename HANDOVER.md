# Japanese Learning App — Maintenance Handover (ထိန်းသိမ်းရေး လွှဲပြောင်းမှတ်တမ်း)

> ဖတ်သူ: နောက်ဆက်တွဲ ပြင်မယ့် developer / AI assistant
> နောက်ဆုံး update: 2026-10-05 (maintenance session by Muse Spark via OpenCode)
> Repo: https://github.com/soemyintswe/japanese-learning-app (branch: `main`)
> Live site: https://japanese-mksedu.web.app
> Firebase project: `japanese-mksedu`

---

## 1. Project အကျဉ်းချုပ်

JLPT N5→N1 ကျောင်းသားများအတွက် Study Planner + LMS app.

- **Frontend:** React Native + Expo SDK ~57, React 19, React Navigation (Bottom Tabs), react-native-web
- **Backend:** Firebase Authentication (Email/Password + Google), Cloud Firestore (`users` collection), Firebase Hosting
- **Local persistence:** `@react-native-async-storage/async-storage` (planner/notes/dictionary-custom/quiz-custom/app-language)
- **Deploy:** `npx expo export --platform web --output-dir dist` → `firebase deploy --only hosting` (public dir = `dist/`, SPA rewrite `** → /index.html`)

## 2. File Map (ဘယ် file က ဘာလုပ်လဲ)

```
App.js                        # Root: session restore, Tab.Navigator + linking, HomeScreen, LanguageProvider wrap
app.json                      # Expo config (slug japanese-mksedu, android package, web metro)
firebase.json                 # Hosting config (public=dist, SPA rewrite, font CORS headers)
firestore.rules               # ⭐ Firestore Security Rules — Console မှာ Publish လုပ်ရမယ် (sec 4)
.firebaserc                   # default project = japanese-mksedu
.env.example                  # Firebase env template (.env ဖန်တီးသုံးရန်, .env က gitignore)
src/firebase.js               # Firebase init (web/native persistence + popupRedirectResolver)
src/session.js                # ⭐ Auth user → profile resolve (uid doc → email placeholder adopt → admin auto-active)
src/LanguageContext.js        # ⭐ Global my/en/jp + AsyncStorage persist
components/AppHeader.js       # ⭐ စာမျက်နှာတိုင်း header (title + lang ၃ ခု + profile pic/name + logout)
components/AppIcon.js         # Ionicons အစား emoji map (web font tofu fix)
components/AuthScreen.js      # Login / Email-register / Google / password-reset + inline error banner + Enter submit
components/DictionaryScreen.js# အဘိဓာန် (base dict + custom AsyncStorage, CRUD, 3-lang chrome)
components/PlannerScreen.js   # Calendar + morning/evening checklist + notes (AsyncStorage, 3-lang)
components/NotesScreen.js     # Notes CRUD (AsyncStorage, 3-lang chrome)
components/QAScreen.js        # Quiz + add/edit (Option4 + correct picker, AsyncStorage, 3-lang)
components/TeacherScreen.js   # ⭐ Admin user table (approve/disable, role-picker modal, delete, tooltips) + bio + share + change-password
components/dictionaryData/    # N5 nouns/verbs, N3, N2, N1 modules + fullDictionary.js (sample 9) + index.js (merge)
HANDOVER.md                   # ဒီမှတ်တမ်း
```

`*- Copy*.js`, `Backups/`, `app - Copy.json`, `firebase - Copy.json` = **အဟောင်း backup များ — app က မသုံးပါ** (sec 8 roadmap: ဖျက်သင့်တယ်, password အဟောင်း ပါဝင်နေ ⚠️).

## 3. Data Model — Firestore `users` collection

Doc ID 2 မျိုး: (a) Firebase Auth UID (login ဝင်ပြီးသူများ — canonical), (b) `user_<timestamp>` (Admin ကြိုဖန်တီးပေးတဲ့ placeholder, login credential မပါ).

```js
{
  uid: string, name: string, email: string,      // email: manual doc များ lowercase
  role: 'student' | 'teacher' | 'admin',        // lowercase သုံးရမယ် (code က .toLowerCase() normalise လုပ်တယ်)
  status: 'active' | 'pending' | 'disabled',
  createdAt: ISO string, migratedFrom?: string, note?: string
}
```

- **Login rule:** non-admin email + `status !== 'active'` → signOut + pending notice. Admin email (`soemyintswe@gmail.com`, `src/session.js: ADMIN_EMAIL`) → အမြဲ active (auto-fix).
- **Placeholder adoption** (`resolveUserProfile`): uid doc မရှိရင် email တူ `user_*` doc က role/status/name ဆက်ခံ → uid doc ရေး → placeholder အဟောင်း auto-delete. ဒါကြောင့် Admin ကြိုဖန်တီးပေးထားတဲ့ ACTIVE ကျောင်းသား Email-register လုပ်ရုံနဲ့ တန်း login ရတယ်.

## 4. Firebase Console Checklist (မဖြစ်မနေ)

1. **Authentication → Sign-in method:** Email/Password ✅ Enabled, Google ✅ Enabled
2. **Authentication → Settings → Authorized domains:** `japanese-mksedu.web.app` (auto), `localhost` (default) ပါရမယ်. Custom domain ထပ်သုံးရင် Add domain.
3. **Authentication → Users:** login credential ရှိသူများသာ ပေါ်မယ်. **Firestore doc ရှိတိုင်း Auth user မဟုတ်** — သတိထား!
4. **Firestore → Rules:** `firestore.rules` အတိုင်း ကူးထည့် → **Publish** (signed-in read; create ကိုယ့် uid+ကိုယ့် email; update staff/ကိုယ်တိုင်-name-only; delete staff/ကိုယ့်-email).
   Rules မထုတ်ရင် login/register/admin-approve အားလုံး `permission-denied` ဖြစ်မယ် (app က error ပြပေးတယ်).
5. **Firestore → Data:** `users` collection. Index အထူးမလို (`where email ==` single-field only).

## 5. Runbook — run / build / deploy

```powershell
npm install
npx expo start --web        # dev (http://localhost:8081)
npx expo export --platform web --output-dir dist
firebase deploy --only hosting
```

- Deploy ပြီးတိုင်း browser မှာ **Ctrl+F5** (cache အဟောင်း!) — user တွေကို မှာရမယ်.
- `dist/` နဲ့ `.expo/` က gitignore (deploy artifact commit မလုပ်).
- Auth users စစ်ရန် (read-only): `firebase auth:export $env:TEMP\auth.json` → ပြီးရင် **ဖျက်ပစ်** (hash ပါတယ်).

## 6. ဒီ Maintenance Session မှာ ပြင်ခဲ့သမျှ (Changelog)

### 6.1 လုံခြုံရေး (critical)
- `AuthScreen` hardcoded admin password (`***REMOVED***`) **ဖျက်ပစ်** → Firebase Email Auth အစစ်သုံး. ⚠️ password က git history + `AuthScreen - Copy.js` ထဲ ကျန်နေ → **compromised သဘောထား, Admin Auth password ကို Console မှာ rotate လုပ်ရန်** (sec 8).
- Firestore မှာ plaintext `password` သိမ်းတာ ရပ် (`TeacherScreen.handleCreateUser` — profile သက်သက်).
- Fake login (username မှန်သမျှ ဝင်) → `signInWithEmailAndPassword` + status check.
- Fake change-password (Alert သက်သက်) → `updatePassword` အစစ်.
- `firestore.rules` အသစ် + `.env.example` (config hardcode → `EXPO_PUBLIC_*`).

### 6.2 Data persistence
- Planner / Notes / Dictionary-custom / Quiz-custom / app-language → AsyncStorage (reload/device မပျောက်).
- Dictionary: `fullDictionary.js` (9) + modular N5/N3/N2/N1 merge + dedupe.
- QAScreen modal: Option 4 input + correct-answer picker + validation (အရင် Option1 အမြဲအမှန် bug).

### 6.3 Web hosting fixes
- **Icon tofu** (`web.app` လေးထောင့်တုံး): `@expo/vector-icons` font load မဖြစ် → emoji (`AppIcon.js` + Emoji replaces, 6 screens). dist မှာ font မပါတော့.
- **Google `auth/argument-error`:** `initializeAuth` မှာ `popupRedirectResolver` မပါလို့ popup/redirect **အစကတည်းက ဘယ်တော့မှ မရ** → `browserPopupRedirectResolver` ထည့် (`src/firebase.js`). SDK source (`_withDefaultResolver`) နဲ့ သက်သေပြု fix.
- Popup-blocked → `signInWithRedirect` fallback + `getRedirectResult` mount effect.

### 6.4 Auth UX
- `Alert.alert` → **inline error/info banner** (web Alert လွတ်တတ်) — မှားရင် code + မြန်မာရှင်းချက်အမြဲပြ.
- **Email self-register** အသစ် (Name/Email/Password≥6) + placeholder adopt → ACTIVE placeholder က တန်း login ရ.
- Password-reset button (`sendPasswordResetEmail`). ⚠️ Firebase က အကောင့်မရှိလည်း "ပို့ပြီးပြီ" ပြတယ် (anti-probing) — email မရောက်ရင် Auth user မရှိလို့များတယ်.
- Enter key = submit (Email/Password/Register fields). Specific messages: invalid-credential/user-not-found/invalid-email/operation-not-allowed/user-disabled/network/too-many-requests + Firestore-rules hint.
- **Refresh logout fix:** `onAuthStateChanged` session restore + splash ("ပြန်ဝင်နေပါတယ်…") + pending notice. **Logout = `signOut` အပြီးဖြတ်** (restore ပြန်မဝင်အောင်).
- **Back button:** `linking` (tab→URL) — back = tab ချင်းရွှေ့, refresh = tab မပျောက်.

### 6.5 Admin panel (`TeacherScreen`)
- Action buttons hover-tooltip (web) + long-press (phone) + legend + busy `…` + detailed errors (permission-denied → Rules guidance).
- **🔄 cycle ဖြုတ် → Role-picker modal** (Student/Teacher/Admin မြင်ရ + ရွေးမှပြောင်း; မှားနှိပ်ကာကွယ်) + role case-normalize.
- ကိုယ့် Admin PENDING auto-ACTIVE (login/restore/panel-fetch ၃ နေရာ) + `(ကိုယ်)` highlight.
- Manual create: password field ဖြုတ် (Auth credential မဖန်တီးကြောင်း note).

### 6.6 Global header + i18n
- `AppHeader` 6 screens: title + **မြန်မာ|English|日本語** + **profile pic (Google photoURL / initial avatar) + name + 🚪logout** (+ `action` slot: ➕ buttons).
- `LanguageContext` global sync + persist. Home/Dictionary/Notes/Quiz-modal/Teacher(admin+bio+dialogs) full my/en/jp. Tab titles Burmese ထား.

## 7. Lesson Learned (နောင် AI/dev သတိထားရန်)

1. `initializeAuth` on **web** MUST include `popupRedirectResolver: browserPopupRedirectResolver` — မပါရင် popup/redirect = `auth/argument-error` (အစကတည်းက မရခဲ့တာ).
2. `sendPasswordResetEmail` succeeds silently for non-existent emails — "ပို့ပြီးပြီ" ≠ ရောက်တယ်.
3. Firestore doc ≠ Auth account — Admin manual-create က login မရ. `auth:export` နဲ့ တိုက်စစ်.
4. Web Alert unreliable → inline banners. `getAuth` fallback try/catch ထား.
5. Role/status strings: lowercase normalise everywhere (badge, isAdmin, rules compare).
6. Deploy → Ctrl+F5 (user + ကိုယ်တိုင်).

## 8. Roadmap (ရှေ့ဆက်)

- [ ] **P0 — Secret cleanup:** `*- Copy.js`, `Backups/`, Copy json များ repo က ဖျက် (password အဟောင်းပါ) + git history consideration + Admin Auth password rotate + Firestore `users` ထဲ password field ကျန်ရင် ရှင်း.
- [ ] **P0 — Rules publish verify:** Console Rules = `firestore.rules` ဟုတ်/မဟုတ် တိုက်စစ်.
- [ ] P1 — README `Google Drive Backup` ကြေညာချက်: code မရှိ → ဖြုတ် သို့မဟုတ် implement (Drive API + export/import JSON).
- [ ] P1 — N4 dictionary content (N4 file မရှိ), words အရေအတွက် တိုး.
- [ ] P1 — Home progress အစစ် (planner completion % တွက်; အခု 80→85% အတု).
- [ ] P2 — Tests (quiz scoring, resolveUserProfile, role guard) + EAS build (Android package `com.mksedu.japanesestudyplanner` ready) + `expo-status-bar` plugin cleanup note (app.json).
- [ ] P2 — Bottom tab titles i18n, QA question bank Firestore sync (ယခု local only), teacher question moderation flow.
- [ ] P3 — Deps update (Expo 57→latest), `requirements.txt` (Python, irrelevant) ဖြုတ်/ပြင်.

## 9. Common Recipes

| လုပ်ချင်တာ | ဘယ်လို |
|---|---|
| ကျောင်းသား approve | Admin panel → ✅ (ACTIVE) |
| Role ပေး | 🔄 → modal ရွေး → သိမ်း |
| User ကြိုဖွင့် | 👤➕ (name+email+role; ACTIVE default) → ကျောင်းသား Email/Google register → auto-adopt |
| ကိုယ် PENDING ဖြစ်နေ | Logout → login ပြန်ဝင် (auto-fix) |
| Rules ထုတ် | Console Firestore→Rules→`firestore.rules` paste→Publish |
| Deploy | `npx expo export --platform web --output-dir dist` → `firebase deploy --only hosting` → Ctrl+F5 |
| Auth user စစ် | `firebase auth:export $env:TEMP\a.json` → စစ် → **ဖျက်** |
| Password မေ့ (Auth user ရှိ) | Login → "Password သတ်မှတ်ရန် email ပို့မယ်" |
| Password မေ့ (Auth user မရှိ) | Email Register အသစ်လုပ် (placeholder ACTIVE ဆို တန်းရ) |

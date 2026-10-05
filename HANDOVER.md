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
components/dictionaryData/    # ~1300 trilingual words: n5_nouns(267)/n5_verbs(112)/n5_adjectives(100)/n5_others(107)/n4_words(280)/n3(198)/n2(143)/n1(89) + fullDictionary.js (sample 9 w/ images) + index.js (merge/dedupe/normalizeImportEntry). Validated: scripts Temp count_dict.py + dupe_detail.py + dedupe_files.py + sanity_dict.py (0 dupes, readings present) + check_quiz.py.
# Schema: {id, japanese, reading(kana), myanmar, english, pos, level}. Old rows may use {hiragana}/{icon} — UI handles both.
# Coverage aligned with standard JLPT lists (ref: OpenJLPT CC BY-SA 4.0 — Myanmar glosses are original, not copied).
# Import accepts app format AND OpenJLPT format {word,reading,meanings[],level} (myanmar=''). Deps: expo-file-system/-sharing/-document-picker/-clipboard.
components/quizData/      # Level banks N5(42)/N4(32)/N3(28)/N2(22)/N1(20) = 144 Qs {id,level,skill,question,speakText?,passage?,options[],correctIndex,explanation,mediaUrl?} + index (pools/shuffle/unlock logic). skills: vocab/grammar/reading/listening. Deps: expo-speech (TTS listening/model), expo-av (speaking record/playback).
components/materialsSeed.js: 24 verified starter links (ALL YT handles live-checked; dead replaced with @nihongo-no-jikan + beginner playlist) + 🌱 one-tap seed (dedupe by title, staff only). Policy: verify-before-add (webfetch alive check), no dead links.
# Chat copy: message Text selectable (web drag + native) + select-mode 📋 button (expo-clipboard, joined lines). Bot messages selectable too. Note: native long-press also enters delete-select — copy via 📋 recommended there.
components/BotPanel.js    # Offline rule-based bot: dict lookup (800w), quiz/skill launch callbacks, grammar tips, level guide, small talk. No API key.
# QAScreen modes: Quiz(levels+locks+best/unlock70%+placement75%→assessedLevel, progress AsyncStorage) | Skills(listening TTS/reading/writing-input/speaking record+self-mark) | Bot. Custom Qs now have level+mediaUrl. Video: question.mediaUrl → 🎬 button (Linking).
# Dictionary UX: tap-expand cards (full meaning+level desc+edit/delete), Level chips long-press/ⓘ = JLPT guide, N-badge tap = level info, 🔊 TTS playback per word (expo-speech ja, collapsed row + expanded detail; all roles). Video files bundled in app = roadmap (YouTube-link method available now).
# Notifications (no FCM — app-open only): src/notifications.js NotificationProvider (chats array-contains listener + pending==pending admin listener, unread via lastReadAt map, navRef) + components/NotificationPanel.js (unread→open thread; pending→one-tap Approve/Disable) + AppHeader 🔔 badge + web document.title count. Community marks read on open/send (byUid in lastMessage). Old msgs w/o byUid default read.
# Voice messages (async conversation): Community thread 🎤 toggle record (30s cap) → base64 → chats/{id}/media/{m} → message {audioId,dur} → ▶️/⏹️ playback. src/voiceChat.js platform-split (LESSON: expo-av/expo-file-system web paths fragile — web uses native MediaRecorder+HTMLAudio directly with real mic prompt; native keeps expo-av+cache file). Silence guard blob<2KB → warn, don't send. Measured duration (not private API).
# Chat delete (single/multi/all + attachments): long-press own/admin/creator msg → delete; select mode (☑️+count+delete); 🧹 clear-all (creator/admin, resets lastMessage); 📎 attachments (image/audio/video/file ≤500KB raw, else Drive link; media {kind,file,name,mime}; images→viewer modal, audio→voice path, video/other→system open). Whole-chat delete now cleans subcollections. Rules: messages/media delete = own/staff/chatOwner. Typing indicator: typing.{uid}={at,name} throttled 3s, cleared on send/leave, shown <8s. Rules: media/* like messages/*. Live WebRTC calls REJECTED for now (needs EAS dev build — kills Expo Go testing, no web support, TURN server cost, safeguarding; revisit if native-first + budget).
# Community tab (👥): People directory (search+presence dot+role/JLPT, tap=profile modal+DM) | Chats (DM deterministic dm_a_b + groups, realtime onSnapshot, send/delete, route openChatId) | My Profile (name/phone/birthdate/gender/education/jlpt/bio/isPublic-toggle + avatar base64→Firestore photoURL, NO Storage) | Reports admin (active-now count, presence/role/gender/age/edu/JLPT/tested bars). Presence: src/presence.js heartbeat 60s (seen) + touch/mouse/key (active); active<3m/idle<15m/offline. Rules: firestore.rules publish (users open-read signed-in; chats: get-if-missing-or-member [DM create check needs get on missing doc!], list member-only, messages no-edit; materials read-all/write-staff; settings read-all/write-staff). storage.rules FILE EXISTS BUT UNUSED — Firebase Storage needs Blaze/paid plan (console shows Upgrade), so avatars use base64-in-Firestore instead (quality 0.4, ~700KB cap, ~school scale OK). Console: publish firestore.rules only. Deps: expo-image-picker. Privacy: isPublic toggle (default public); phone/birthdate → admin/self only.
# Bottom tabs follow language (tabT my/en/jp in App.js). AppHeader avatar tap → Community profile seg (route params; own=edit form, others=modal).
# Home progress is REAL (was fake 80→85% hardcode): reads PlannerScreen AsyncStorage (YYYY-M-D → morning/evening checks /10 slots), mount + tab-focus + pull-refresh recompute, 0% when empty. Shows pct + done/total.
# LESSON (2026-10): blank tab = usually missing import (MaterialsScreen used <ScrollView> without importing → ReferenceError → blank). Babel does NOT catch this. Prevention: JSX identifier scan (Temp scan_jsx.py — fix named-import regex false positives) before deploy.
# Login has NO role picker (removed — self-declared roles were UX friction + privilege risk). Role (admin/teacher/student) resolves purely from Firestore profile via resolveUserProfile; new registrations default student (admin email → teacher); Admin assigns roles in panel.
# Web Alert.alert() is a NO-OP in react-native-web (static alert(){}) — caused ALL invisible confirms (admin approve etc.). Fix: src/webAlertPolyfill.js (window.confirm map, imported in App.js) as safety net + components/ConfirmModal.js for TeacherScreen approve/disable/delete/role-save/create/password flows. Other screens still rely on polyfill.
# Community blank root cause: Google.useAuthRequest throws at render when OAuth IDs unconfigured (invariantClientId) — fixed by DriveSection lazy-mount (hook runs only if driveConfigured()) + SectionErrorBoundary.
# Dictionary RBAC: shared dataset — staff(teacher/admin) CRUD/import, students view+export only (🔒 view-only hint). Notes/Quiz customs stay personal.
# Teacher bio → Firestore settings/teacherBio (staff edit modal, all read; fallback static). Rules += settings/* (read signed-in, write staff).
# Materials 📚 tab: shared teacher Drive library — Firestore `materials` {title,desc,level,type,url,createdBy*} (teacher pastes Anyone-with-link Drive URL from THEIR Drive app; NO Drive API). Staff manage, all read. Deps: none. Modal web fix (ScrollView + minHeight desc). components/materialsSeed.js: 12 public starter links (TaeKim/Jisho/Tofugu/NHK/Erin/YT/JLPT/Forvo/Anki) + 🌱 one-tap seed (dedupe by title).
# Teacher Drive organization (no auto-folder by app — manual once): Drive folder "MKS Materials" → Share Anyone-with-link Viewer → files/images/audio/video inside (Drive native preview) → paste file/folder link into 📚. API auto-folder possible but rejected (OAuth drive.file scope + verification overhead vs 30s manual setup).
# Materials in-app viewer: resolveViewer() — YouTube ID → youtube-nocookie?/embed (WebView), Drive file ID → /file/d/preview embed (video/audio/pdf/docs/images), direct mp3/mp4 → expo-av Video (native controls), else external browser. Deps: react-native-webview (iframe on web), expo-av Video. External fallback button always shown.
# Teacher Drive upload (100GB Gmail): src/teacherDrive.js useTeacherDrive — OAuth drive.file scope (teacher only, lazy-mounted). Flow: connect 100GB Gmail → ensure "MKS Materials" folder (+Anyone reader) → pick any file (≤100MB) → multipart upload → Anyone-reader on file → webViewLink auto-fills material entry (title/type). Quota/owner = teacher's Drive. Students only open links (no auth). Same OAuth client IDs as backup; teacher account must be tester (Testing mode). UI: MaterialsScreen add-modal TeacherUploadSection (staff only).
# Drive backup (personal): src/driveBackup.js useDriveBackup — Google OAuth (expo-auth-session/providers/google + expo-crypto + expo-web-browser) scope drive.appdata ONLY (hidden folder, no clutter). Backup keys: planner/notes/dict-custom/qa-custom/quiz-progress/lang (+uid/email/meta). Upload multipart, list latest, restore→AsyncStorage.multiSet (restart app after). Token in-memory (401→reconnect). Owner setup: Google Cloud OAuth client IDs → .env (WEB/ANDROID/IOS), authorized origin web.app+localhost:8081, consent Testing + testers (≤100, no verification). Teacher-centralized Drive backup via API = REJECTED (permissions/privacy/quota; Firestore already central). Deps: expo-auth-session, expo-crypto, expo-web-browser.
HANDOVER.md                   # ဒီမှတ်တမ်း
```

Code backup copies (`*- Copy.js`, `*- Copy.json`, `Backups/*.js`) = **2026-10-05 မှာ ဖျက်ပြီးပြီ** (obsolete + password အဟောင်းပါနေလို့; git history sec 8 ကြည့်). `Backups/` ထဲ ပုံ 5 ပုံ (IMG_*.jpg, Weekly Study.*) သာ user ဆန္ဒအရ local မှာ ထားထား — `.gitignore` (`Backups/`, `*Copy*`) ကြောင့် commit မဝင်ပါ.

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
- `AuthScreen` hardcoded admin password **ဖျက်ပစ်** (literal string history purge လုပ်) → Firebase Email Auth အစစ်သုံး. ⚠️ password က git history + `AuthScreen - Copy.js` ထဲ ကျန်နေ → **compromised သဘောထား, Admin Auth password ကို Console မှာ rotate လုပ်ရန်** (sec 8).
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

- [x] **P0 — Secret cleanup (local, 2026-10-05):** local Copy files ဖျက်ပြီးပြီ. history purge ပြီးပြီ (2026-10-05, `git filter-branch` tree-filter + `push --force`; verify `git log --all -S` empty ✅; safety bundle: local Temp `pre-purge-backup.bundle`) — တကယ့် credential မဟုတ် (client-side အတုသက်သက်) ပေမယ့် တခြားနေရာ (Gmail etc.) မှာ **ထပ်သုံးနေရင် အခု ချက်ချင်း ပြောင်း** + history purge စဉ်းစား (`git filter-repo` + force-push). Firestore `users` ထဲ password field ကျန်ရင် ရှင်း.
- [ ] **P0 — Rules publish verify:** Console Rules = `firestore.rules` ဟုတ်/မဟုတ် တိုက်စစ်.
- [ ] P1 — README `Google Drive Backup` ကြေညာချက်: code မရှိ → ဖြုတ် သို့မဟုတ် implement (Drive API + export/import JSON).
- [x] P1 — Dictionary data (2026-10-05): ~800 trilingual + level filter + import/export + reading/pos edit. ကျန်: words ဆက်တိုး (OpenJLPT bulk import via app Import), N3-N1 Myanmar refine (teacher review).
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

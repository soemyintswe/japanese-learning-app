# Japanese Learning App — Maintenance Handover (ထိန်းသိမ်းရေး လွှဲပြောင်းမှတ်တမ်း)

> ဖတ်သူ: နောက်ဆက်တွဲ ပြင်မယ့် developer / AI assistant
> နောက်ဆုံး update: 2026-10-06 (teaching module MVP + activity log built & deployed, by Muse Spark via OpenCode)
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
src/activity.js               # Activity log helper: logActivity(user, action, target, detail) → activity/{autoId} (fail-silent)
src/LanguageContext.js        # ⭐ Global my/en/jp + AsyncStorage persist
components/AppHeader.js       # ⭐ စာမျက်နှာတိုင်း header (title + lang ၃ ခု + profile pic/name + logout)
components/AppIcon.js         # Ionicons အစား emoji map (web font tofu fix)
components/AuthScreen.js      # Login / Email-register / Google / password-reset + inline error banner + Enter submit
components/DictionaryScreen.js# အဘိဓာန် (base dict + custom AsyncStorage, CRUD, 3-lang chrome)
components/PlannerScreen.js   # Calendar + morning/evening checklist + notes (AsyncStorage, 3-lang)
components/NotesScreen.js     # Notes CRUD (AsyncStorage, 3-lang chrome)
components/QAScreen.js        # Quiz + add/edit (Option4 + correct picker, AsyncStorage, 3-lang)
components/TeacherScreen.js   # ⭐ Admin user table (approve/disable, role-picker modal, delete, tooltips) + bio + share + change-password + 📋 activity viewer (latest 50) + horizontal-scroll table (minWidth 660, mobile)
components/TeachingScreen.js  # 📖 Teaching module MVP: lessons + assignments + submissions/grading (staff CRUD, student submit-once, single-field queries only — no composite index) + TeachErrorBoundary (white-screen guard) + 🌱 samples seed
components/dictionaryData/    # ~1330 trilingual words: n5_nouns(274)/n5_verbs(113)/n5_adjectives(100)/n5_others(107)/n4_words(285)/n3(208)/n2(148)/n1(96) + fullDictionary.js (sample 9 w/ images) + index.js (merge/dedupe/normalizeImportEntry). Validated: scripts Temp count_dict.py + dupe_detail.py + dedupe_files.py + sanity_dict.py (0 dupes, readings present) + check_quiz.py.
# Coverage aligned with standard JLPT lists (ref: OpenJLPT CC BY-SA 4.0 — Myanmar glosses are original, not copied). OpenJLPT totals for reference: N5 662 / N4 632 / N3 1784 / N2 1793 / N1 3463 (8,334 words). Our coverage ≈ N5 88% / N4 45% / N3 12% / N2 8% / N1 3% — N3-N1 gaps remain (bulk import via app Import + teacher Myanmar review).
# Schema: {id, japanese, reading(kana), myanmar, english, pos, level}. Old rows may use {hiragana}/{icon} — UI handles both.
# Coverage aligned with standard JLPT lists (ref: OpenJLPT CC BY-SA 4.0 — Myanmar glosses are original, not copied).
# Import accepts app format AND OpenJLPT format {word,reading,meanings[],level} (myanmar=''). Deps: expo-file-system/-sharing/-document-picker/-clipboard.
components/quizData/      # Level banks N5(45)/N4(35)/N3(31)/N2(25)/N1(23) = 159 Qs {id,level,skill,question,speakText?,passage?,options[],correctIndex,explanation,mediaUrl?} + index (pools/shuffle/unlock logic). skills: vocab/grammar/reading/listening. Deps: expo-speech (TTS listening/model), expo-av (speaking record/playback). All questions original (not copied from exam or sites).
components/materialsSeed.js: 29 verified starter links (24 original + 5 added 2026-10-06, ALL webfetch alive-checked that day: Tadoku free graded readers + PracticeJLPT + NihonTorii + JLPTPass + MinnaNihongo) + 🌱 one-tap seed (dedupe by title, staff only). Policy: verify-before-add (webfetch alive check), no dead links. Tadoku content = LINK ONLY (CC BY-NC-ND 4.0, no-derivatives — never copy text into app).
# Chat copy: message Text selectable (web drag + native) + select-mode 📋 button (expo-clipboard, joined lines). Bot messages selectable too. Note: native long-press also enters delete-select — copy via 📋 recommended there.
components/BotPanel.js    # Offline rule-based bot: dict lookup (~1330w), quiz/skill launch callbacks, grammar tips, level guide, 9 small-talk intents + MY data (planner/notes/scores) + SHARED data (library/members/profile via Firestore). user prop wired from QAScreen. No API key. LIMIT: pattern-match only, open chat = roadmap.
# QAScreen modes: Quiz(levels+locks+best/unlock70%+placement75%→assessedLevel, progress AsyncStorage) | Skills(listening TTS/reading/writing-input/speaking record+self-mark) | Bot. Custom Qs now have level+mediaUrl. Video: question.mediaUrl → 🎬 button (Linking).
# Dictionary UX: tap-expand cards (full meaning+level desc+edit/delete), Level chips long-press/ⓘ = JLPT guide, N-badge tap = level info, 🔊 TTS playback per word (expo-speech ja, collapsed row + expanded detail; all roles).
# Dictionary auto-playlist: ▶️All (current filter snapshot) / ▶️From-here (expanded card) + repeat 1x/2x/3x (JP repeats; MM/EN explain once) + JP/MM/EN toggles + mini-player (pause/resume/next/stop + i/n). Per-word speech: JP word → MM composed ("X。reading。 မြန်မာလို Y。") → EN ("X means Y."). Voices auto-detected via getAvailableVoicesAsync (missing → toggle disabled; empty list → assume all OK). Manual 🔊 stops playlist. Follow-along: playing card highlighted (purple border) + auto-scroll (scrollToIndex, try/catch) — listen + read together. Video files bundled in app = roadmap (YouTube-link method available now).
# Notifications (no FCM — app-open only): src/notifications.js NotificationProvider (chats array-contains listener + pending==pending admin listener, unread via lastReadAt map, navRef) + components/NotificationPanel.js (unread→open thread; pending→one-tap Approve/Disable) + AppHeader 🔔 badge + web document.title count. Community marks read on open/send (byUid in lastMessage). Old msgs w/o byUid default read.
# Voice messages (async conversation): Community thread 🎤 toggle record (30s cap) → base64 → chats/{id}/media/{m} → message {audioId,dur} → ▶️/⏹️ playback. src/voiceChat.js platform-split (LESSON: expo-av/expo-file-system web paths fragile — web uses native MediaRecorder+HTMLAudio directly with real mic prompt; native keeps expo-av+cache file). Silence guard blob<2KB → warn, don't send. Measured duration (not private API).
# SUSTAINABILITY AUDIT (2026): P0 — (1) deleted users resurrect → FIXED via banned/{uid} + email check in resolveUserProfile (fail-open on check error) + TeacherScreen writes ban on delete + Banned section + Unban; true Auth delete still needs Admin SDK (roadmap). (2) single super-admin email = bus factor — MITIGATED: any role-admin is full admin (promote 2nd admin in panel: Role → ADMIN); break-glass = Firebase Console owner (document who). Super-admin email constant in rules (isSuperAdmin) + src/session ADMIN_EMAIL — change both if rotating. P1 — (3) users docs readable by ALL signed-in incl. phone/birthdate (UI hides, rules don't; fix = split public/private collections) [DEFERRED — App Check/split/migration]; (4) no Firestore backup/DR → FIXED: Admin 📥 one-click JSON export (users/chats-last100/materials/settings/banned; photos/voice omitted for size; web download / native share); (5) no App Check + unrestricted API key [DEFERRED]; (6) no Privacy Policy → FIXED: src/privacyPolicy.js shared (AuthScreen consent modal + PUBLIC /privacy page, no login; OAuth branding: home=https://japanese-mksedu.web.app privacy=https://japanese-mksedu.web.app/privacy); (7) default weak password policy, no admin MFA [DEFERRED — console-side]. P2 — (8) presence heartbeat 60s/user write fan-out cost at scale (throttle to 2-3min or RTDB); (9) voice/attachment base64 in Firestore (storage+read cost; Storage blocked by Blaze); (10) npm audit 36 vulns (21 high, mostly transitive dev); group member-add has no invite consent. P3 — staging project, error monitoring, Expo upgrades. Spark quotas fine at school scale (Firestore 1GB/50K reads/20K writes/day; Hosting 10GB + 360MB/day). NOTE: firebase deploy sometimes fails with "resolving hosting target" assertion — retry with explicit `-P japanese-mksedu` flag (worked).
# Chat delete (single/multi/all + attachments): long-press own/admin/creator msg → delete; select mode (☑️+count+delete); 🧹 clear-all (creator/admin, resets lastMessage); 📎 attachments (image/audio/video/file ≤500KB raw, else Drive link; media {kind,file,name,mime}; images→viewer modal, audio→voice path, video/other→system open). Whole-chat delete now cleans subcollections. Rules: messages/media delete = own/staff/chatOwner. Typing indicator: typing.{uid}={at,name} throttled 3s, cleared on send/leave, shown <8s. Rules: media/* like messages/*. Live WebRTC calls REJECTED for now (needs EAS dev build — kills Expo Go testing, no web support, TURN server cost, safeguarding; revisit if native-first + budget).
# Community tab (👥): People directory (search+presence dot+role/JLPT, tap=profile modal+DM) | Chats (DM deterministic dm_a_b + groups, realtime onSnapshot, send/delete, route openChatId) | My Profile (name/phone/birthdate/gender/education/jlpt/bio/isPublic-toggle + avatar base64→Firestore photoURL, NO Storage) | Reports admin (active-now count, presence/role/gender/age/edu/JLPT/tested bars). Presence: src/presence.js heartbeat 60s (seen) + touch/mouse/key (active); active<3m/idle<15m/offline. Rules: firestore.rules publish (users open-read signed-in; chats: get-if-missing-or-member [DM create check needs get on missing doc!], list member-only, messages no-edit; materials read-all/write-staff; settings read-all/write-staff).
# RBAC hierarchy (Admin အမြင့်ဆုံး): isSuperAdmin()=ADMIN_EMAIL + role admin > teacher > student. users create: staff any-doc BUT admin-role grant needs admin; self-reg own-uid+own-email. update: admin docs touchable only by admin; admin-role grant only by admin; self = name-only. delete: admin docs only by admin. App tab + Home teacher-link include role admin (exact 'teacher' match hid panel after self-promote — fixed). Teachers manage students/materials/dictionary but cannot touch admin role/docs. storage.rules FILE EXISTS BUT UNUSED — Firebase Storage needs Blaze/paid plan (console shows Upgrade), so avatars use base64-in-Firestore instead (quality 0.4, ~700KB cap, ~school scale OK). Console: publish firestore.rules only. Deps: expo-image-picker. Privacy: isPublic toggle (default public); phone/birthdate → admin/self only.
# Bottom tabs follow language (tabT my/en/jp in App.js). AppHeader avatar tap → Community profile seg (route params; own=edit form, others=modal).
# Home progress is REAL (was fake 80→85% hardcode): reads PlannerScreen AsyncStorage (YYYY-M-D → morning/evening checks /10 slots), mount + tab-focus + pull-refresh recompute, 0% when empty. Shows pct + done/total.
# LESSON (2026-10): blank tab = usually missing import (MaterialsScreen used <ScrollView> without importing → ReferenceError → blank). Babel does NOT catch this. Prevention: JSX identifier scan (Temp scan_jsx.py — fix named-import regex false positives) before deploy.
# Login has NO role picker (removed — self-declared roles were UX friction + privilege risk). Role (admin/teacher/student) resolves purely from Firestore profile via resolveUserProfile; new registrations default student (admin email → teacher); Admin assigns roles in panel.
# Admin audit trail: approve/disable/role/reset stamp lastActionBy (+lastActionAt) on user docs; Admin column in User Management shows acting admin (email prefix); deletes write banned.by; banned rows show by-line. No extra rules needed (staff update covers).
# Admin table: Created column (createdAt YYYY-MM-DD, — if missing) + tap-to-sort headers (name/role/status/created, ▲▼). Mobile-narrow fix: table wrapped in horizontal ScrollView + minWidth 660 rows (up/down = outer vertical scroll). ✅ BUILT 2026-10-06: usage ACTIVITY LOG (activity/{autoId} via src/activity.js, 8 admin actions hooked, rules append-only + staff-read, viewer in TeacherScreen admin section, 3-lang) + TEACHING module MVP (collections: lessons{title,body,level,mediaUrl,by,byName,at} + assignments{title,desc,level,due,by,byName,at} + submissions{id=assignmentId_uid,assignmentId,uid,name,text,link,grade,feedback,at,gradedBy,gradedAt}; 📖 Class tab for ALL roles (/teaching); staff composes individual assignments (due date text), students submit once (resubmit=update), staff grades per submission; rules deployed via CLI). Next (optional): group-targeted assignments (targets[]), rich media submit, grade stats.
# User lifecycle (admin-driven credentials): TeacherScreen creates REAL Auth accounts via SECONDARY app instance (initializeApp+name, createUserWithEmailAndPassword, signOut+deleteApp — main admin session untouched) + temp password (expo-crypto MKS-XXXXXXXX, shown ONCE in delivery card, NEVER stored in Firestore) + profile {active, mustChangePassword:true}. Delivery: Copy / mailto: / sms: links (admin sends from own apps; NO server email/SMS — Twilio etc = roadmap). Admin 🔑 reset per row: sendPasswordResetEmail + flag; user-not-found placeholder → offer Auth-create+migrate+credentials. Force gate: App.js renders ForceChangePassword when mustChangePassword && hasPassword(providerData); updatePassword → clear flag → enter; requires-recent-login → logout+relogin path. session.js returns mustChangePassword+hasPassword; AuthScreen payloads carry them. Table 🔑 badge marks flagged users. LIMIT (client SDK): cannot SET another user's password — reset uses Firebase reset email (user sets own), Admin-SDK/Cloud-Function alternative = roadmap.
# Web Alert.alert() is a NO-OP in react-native-web (static alert(){}) — caused ALL invisible confirms (admin approve etc.). Fix: src/webAlertPolyfill.js (window.confirm map, imported in App.js) as safety net + components/ConfirmModal.js for TeacherScreen approve/disable/delete/role-save/create/password flows. Other screens still rely on polyfill.
# Community blank root cause: Google.useAuthRequest throws at render when OAuth IDs unconfigured (invariantClientId) — fixed by DriveSection lazy-mount (hook runs only if driveConfigured()) + SectionErrorBoundary.
# Dictionary RBAC: shared dataset — staff(teacher/admin) CRUD/import, students view+export only (🔒 view-only hint). Notes/Quiz customs stay personal.
# Teacher bio → Firestore settings/teacherBio (staff edit modal, all read; fallback static). Rules += settings/* (read signed-in, write staff).
# Materials 📚 tab: shared teacher Drive library — Firestore `materials` {title,desc,level,type,url,createdBy*} (teacher pastes Anyone-with-link Drive URL from THEIR Drive app; NO Drive API). Staff manage, all read. Deps: none. Modal web fix (ScrollView + minHeight desc). components/materialsSeed.js: 12 public starter links (TaeKim/Jisho/Tofugu/NHK/Erin/YT/JLPT/Forvo/Anki) + 🌱 one-tap seed (dedupe by title).
# Teacher Drive organization (no auto-folder by app — manual once): Drive folder "MKS Materials" → Share Anyone-with-link Viewer → files/images/audio/video inside (Drive native preview) → paste file/folder link into 📚. API auto-folder possible but rejected (OAuth drive.file scope + verification overhead vs 30s manual setup).
# Materials in-app viewer: resolveViewer() — YouTube ID → youtube-nocookie?/embed (WebView), Drive file ID → /file/d/preview embed (video/audio/pdf/docs/images), direct mp3/mp4 → expo-av Video (native controls), else external browser. Deps: react-native-webview (iframe on web), expo-av Video. External fallback button always shown.
# Essay & Songs reader (components/essayData.js): 5 original essays (N5x3/N4x2: 家族/休み/買い物 + 夢/雨の季節) + 5 songs (4 traditional PD + ふるさと verse-1 added 2026-10-06; PD 1914, lyricist d.1947/composer d.1941 — NO copyrighted lyrics ever; もみじ avoided — lyricist d.1959, PD only 2029). Schema {id,title,kind,level,lines:[{ja,reading,mm}]}. Materials tab segment: list → reader (tap line = play from there, ▶️ play all JA→MM per line, highlight + auto-scroll, ⏹️ stop; stops on back/mode-switch/unmount).
# Teacher Drive upload (100GB Gmail): src/teacherDrive.js useTeacherDrive — OAuth drive.file scope (teacher only, lazy-mounted). Flow: connect 100GB Gmail → ensure "MKS Materials" folder (+Anyone reader) → pick any file (≤100MB) → multipart upload → Anyone-reader on file → webViewLink auto-fills material entry (title/type). Quota/owner = teacher's Drive. Students only open links (no auth). Same OAuth client IDs as backup; teacher account must be tester (Testing mode). UI: MaterialsScreen add-modal TeacherUploadSection (staff only).
# DATA RESIDENCY (owner decision): Firestore = primary DB for ALL app data (NOT in Drive, by design). Drive holds FILES only: (1) shared materials → 100GB Gmail Drive — uploader = connected Google account, so mks.edu.services@gmail.com MUST register/login in-app + approve + set Teacher role (test-users entry is NOT an app account); (2) personal backups → each user's OWN Drive appDataFolder.
# Drive backup (personal): src/driveBackup.js useDriveBackup — Google OAuth (expo-auth-session/providers/google + expo-crypto + expo-web-browser) scope drive.appdata ONLY (hidden folder, no clutter). Backup keys: planner/notes/dict-custom/qa-custom/quiz-progress/lang (+uid/email/meta). Upload multipart, list latest, restore→AsyncStorage.multiSet (restart app after). Token in-memory (401→reconnect). Owner setup (2026, REQUIRED for activation): Google Cloud Console → SAME project (japanese-mksedu) → APIs&Services → enable Drive API → OAuth consent (External, Testing + tester Gmails incl. teacher 100GB account) → Credentials → OAuth client ID (Web app) with Authorized JS origin https://japanese-mksedu.web.app (+http://localhost:8081 dev) AND Authorized redirect URIs https://japanese-mksedu.web.app/community (+http://localhost:8081/community dev) — NO trailing tricks; then paste Client ID here → .env EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID → export+deploy. Teacher-centralized Drive backup via API = REJECTED (permissions/privacy/quota; Firestore already central). Deps: expo-auth-session, expo-crypto, expo-web-browser.
# Web redirect is FIXED to <origin>/community (getDriveRedirectUri/getTeacherRedirectUri) because Google matches redirect EXACTLY and Drive UI lives in Community/Profile; teacher upload: connect FIRST (pick/upload hidden until connected — redirect reload wipes picked file otherwise).
# Drive OAuth LIVE (2026): owner created dedicated Web client (ID in local .env only, gitignored — see .env.example). driveConfigured()/teacherDriveConfigured() check PLATFORM-APPROPRIATE id only (wrong-platform/undefined IDs make Google.useAuthRequest THROW at render → blank screen; missing → setup notice). Android/iOS clients NOT created yet — needed ONLY for native builds/Expo-Go testing (Expo Go Android: package host.exp.exponent + Expo SHA-1; standalone: own package + SHA-1); web users unaffected.
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

### 6.7 Content round 4 (2026-10-06) — Dictionary +35 / Quiz +15 / Library +5 / Essays&Songs +3
- **Dictionary 1296→1331** (65 candidates dupe-checked → 30 already present, 35 new, ID-collision 0, final dupe 0): N5 nouns +7 (切手/封筒/消防署/水族館/遊園地/神社/お寺) + verb +1 (払う); N4 +5 (遠慮/承知/結婚式/退院/診察); N3 +10 (頑固/謙虚/積極的/消極的/具体的/抽象的/効果的/効率的/必然/偶然); N2 +5 (憂鬱/倹約/浪費/仲裁/権威); N1 +7 (邂逅/黎明/黄昏/刹那/永劫/混沌/虚無). Level refs = OpenJLPT assignments, Myanmar/English glosses original.
- **Quiz 144→159** (all original, 3/level): N5 n5q43-45 / N4 n4q33-35 / N3 n3q29-31 / N2 n2q23-25 / N1 n1q21-23 (vocab+grammar+reading/listening mix, new words cross-linked: 切手/診察/具体的/倹約・浪費/邂逅・混沌).
- **Library seed 24→29** (all 5 webfetch alive-checked 2026-10-06): Tadoku free graded readers (LINK ONLY — CC BY-NC-ND) + PracticeJLPT + NihonTorii + JLPTPass (N2 partial/N1 soon — noted in desc) + MinnaNihongo.
- **Essays 3→5, Songs 4→5**: es04 買い物 (N5, original) + es05 雨の季節 (N4, original, Myanmar rainy season) + sg05 ふるさと verse-1 (PD 1914). もみじ deliberately NOT added (lyricist d.1959 → PD 2029).
- **Bot small-talk + app-data (uncommitted work finished)**: greeting regex bug (Thai garbage + `history`→hi false-positive) fixed; 9 small-talk intents (နေကောင်း/ဘာလုပ်နေ/ဗိုက်ဆာ/ပင်ပန်း/ရယ်/ချစ်/အသက်/ဘယ်မှာ/ရာသီဥတု) placed before quiz/grammar so never swallowed; fallback now honest (open chat = roadmap, needs AI API); `user` prop wired from QAScreen. LIMIT restated: true free chat impossible offline — pattern-match only.

### 6.8 Teaching module MVP + Activity log (2026-10-06) — BUILT & DEPLOYED
- **Activity log**: `src/activity.js` (fail-silent) + 8 admin hooks (create/reset/migrate/role/approve-disable/unban/delete) + `activity` rules (create signed-in, read staff, append-only) + viewer in TeacherScreen (latest 50, 3-lang). Rules deployed via CLI (`firebase deploy --only firestore:rules` — compiled OK), so Console manual paste NOT needed this time.
- **Teaching MVP**: `components/TeachingScreen.js` (~400 lines, my/en/jp) + 📖 Class tab for ALL roles (`/teaching`, icon 📖, tabT 3-lang in App.js). Staff: lessons/assignments CRUD modal (level + mediaUrl/due) + per-submission grade/feedback. Students: read + submit-once (`{assignmentId}_{uid}` merge). Queries single-field only (staff: where assignmentId==; student: where uid== + client filter) — NO composite index needed. logActivity on create/edit/delete/submit/grade.
- Verify: `expo export` clean (676 modules) → hosting deployed → `https://japanese-mksedu.web.app` (Ctrl+F5). LIMITS: assignments are whole-class only (no per-student/group targets[] yet); submissions text+link only (no file upload — use Drive link in link field); grades are free-text.

### 6.9 Teaching round-2 (2026-10-06) — targets + photo submit + grade stats
- **Assignment targets** (`target/targetLevel/targetUids` on assignment docs; old docs = all): staff picks whole-class | JLPT level (N5-N1) | specific students (checkbox from users directory, students only, max 100). Student list auto-filters (level read from own profile `jlpt||testedLevel`; unknown level → shown). List + detail show 🎯 tag. No rules change, no composite index (same single-field queries).
- **Photo submit**: student can attach 1 photo (expo-image-picker, quality 0.4, base64 cap ~500KB → reject with message) stored as `photo` data-uri on submission doc; shown in own view + staff grading view. Same base64-in-Firestore pattern as avatars (cost note P2-9 applies; Storage still Blaze-blocked).
- **Grade stats** (staff, per assignment): submitted / graded / avg-of-numeric / pending counts, computed client-side.
- Safety: `git tag pre-round5` before edits (rollback = `git reset --hard pre-round5` + redeploy); export caught 1 brace error pre-deploy, fixed, re-export clean → hosting deployed → pushed. No `firestore.rules` change this round (rules deploy skipped).

### 6.10 Teaching fix round (2026-10-06) — spinner + blank screen + samples
- **Bug 1 — spinner ကြာ**: `fetchAll` が queries 4-5 ခု sequential + staff ဆို `users` **အကုန်လုံး (photoURL base64 ~MBs)** ကို mount/refresh/open/save တိုင်း ဆွဲနေလို့. Fix: lessons+assignments `Promise.all` parallel; users directory → editor ဖွင့်မှ lazy-load + **photoURL မသိမ်း (id/name/email/role only)**; own level → mount-once effect; + 15s loading safety timeout (spinner အမြဲမလည်).
- **Bug 2 — Assignments နှိပ်ရင် white screen**: render throw တက်ရင် boundary မရှိလို့ tab တခုလုံး ဖြူသွားတာ. Fix: `TeachErrorBoundary` (class, inline error + 🔄 Retry, `key={seg}`) + `safeArr` guards (lessons/assigns/subs/opened/targetUids). Exact throw line မမျိုးနိုင်ခဲ့ (local repro မရ) — ဒါပေမယ့် ဖြစ်နိုင်ခြေလမ်းအားလုံး ကာကွယ် + boundary ခံ → header/tabs ဘယ်တော့မှ မပျောက်။
- **Samples (staff 🌱 one-tap, fixed IDs, skip-existing)**: `components/teachingSeed.js` — lessons 3 (あ-row + self-intro pattern + te-form作り方, all original) + assignments 3 (seed_a1 all/N5 self-intro ✍️ + seed_a2 N5-level family + seed_a3 N4-level diary). Empty-state မှာ staff only 🌱 button. Seeding logs activity.
- Verify: export clean (677 modules) → hosting deployed → pushed. Ctrl+F5 ပြီး `/teaching` ပြန်စမ်းရန်။

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

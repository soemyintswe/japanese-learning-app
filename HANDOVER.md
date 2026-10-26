# Japanese Learning App — Maintenance Handover (ထိန်းသိမ်းရေး လွှဲပြောင်းမှတ်တမ်း)

> ဖတ်သူ: နောက်ဆက်တွဲ ပြင်မယ့် developer / AI assistant
> နောက်ဆုံး update: 2026-10-26 (TTS, QA moderation/sync, Jest coverage, EAS readiness)
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
src/session.js                # ⭐ Auth user → profile resolve (uid doc → email placeholder adopt → admin auto-active) + withRetry (transient 3× backoff; permission-denied fail-fast) + classifyResolveError (rules vs network)
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
components/TeachingScreen.js  # 📖 Teaching module MVP: lessons + assignments + submissions/grading (staff CRUD, student submit-once, single-field queries only — no composite index) + TeachErrorBoundary (white-screen guard) + 🌱 samples seed + 📥📤 export/import (staff import)
components/HelpScreen.js      # 🆘 App usage guide (my/en/jp, 13 sections: login→tips, incl Kana), 🆘 Help tab for all roles (/help)
components/KanaScreen.js      # あ 五十音表 (base46 + 濁音25 + 拗音24 + っ/ん/ー), tap→🔊 TTS+romaji+mm gloss, ひらがな⇄カタカナ toggle, ✍書き順 stroke-order modal (sequential reveal + start①/end● markers + direction arrow + ✋ practice trace w/ finger-mouse, KanjiVG), offline/guest, hidden tab /kana (☰ More ထဲက)
components/kanaStrokes.json   # 150 kana stroke paths (hiragana+katakana incl 小書き/濁音) from KanjiVG, CC BY-SA 3.0 — kanjivg.tagaini.net (attribution in screen footer). Regen: scripts/fetch_kana_strokes.js (jsDelivr, lowercase hex)
scripts/                      # Maintenance utilities: fetch_kana_strokes.js (KanjiVG → kanaStrokes.json; NOTE: regex must be \sd=" not d=" — bare d= matches inside id=" and saves IDs), i18n_check.js (my/en/jp key parity), i18n_lang.js (lang-content audit). Run from repo root: node scripts/i18n_check.js
AI_CONTENT_PROMPT.md          # ⭐ Other-AI bulk content prompt (copy-paste EN+MM) + 5 JSON schemas (A words / B quiz / C library / D essays / E teaching) + import paths + copyright policy
components/dictionaryData/    # ~1340 trilingual words: n5_nouns(274)/n5_verbs(113)/n5_adjectives(100)/n5_others(107)/n4_words(285)/n3(213)/n2(153)/n1(96) + fullDictionary.js (sample 9 w/ images) + index.js (merge/dedupe/normalizeImportEntry). Validated: scripts Temp count_dict.py + dupe_detail.py + dedupe_files.py + sanity_dict.py (0 dupes, readings present) + check_quiz.py.
# Coverage aligned with standard JLPT lists (ref: OpenJLPT CC BY-SA 4.0 — Myanmar glosses are original, not copied). OpenJLPT totals for reference: N5 662 / N4 632 / N3 1784 / N2 1793 / N1 3463 (8,334 words). Our coverage ≈ N5 88% / N4 45% / N3 12% / N2 8% / N1 3% — N3-N1 gaps remain (bulk import via app Import + teacher Myanmar review).
# Schema: {id, japanese, reading(kana), myanmar, english, pos, level}. Old rows may use {hiragana}/{icon} — UI handles both.
# Import accepts app format AND OpenJLPT format {word,reading,meanings[],level} (myanmar=''). Deps: expo-file-system/-sharing/-document-picker/-clipboard.
components/quizData/      # Level banks N5(48)/N4(38)/N3(34)/N2(28)/N1(26) = 174 Qs {id,level,skill,question,speakText?,passage?,options[],correctIndex,explanation,mediaUrl?,points?} + index (pools/shuffle/unlock logic + SCORING rules export). skills: vocab/grammar/reading/listening. Deps: expo-speech (TTS listening/model), expo-av (speaking record/playback). All questions original (not copied from exam or sites).
components/materialsSeed.js: 29 verified starter links (24 original + 5 added 2026-10-06, ALL webfetch alive-checked that day: Tadoku free graded readers + PracticeJLPT + NihonTorii + JLPTPass + MinnaNihongo) + 🌱 one-tap seed (dedupe by title, staff only). Policy: verify-before-add (webfetch alive check), no dead links. Tadoku content = LINK ONLY (CC BY-NC-ND 4.0, no-derivatives — never copy text into app). Historical note: initial seed was 12 links (see §6.x Materials) — superseded by 29.
# Chat copy: message Text selectable (web drag + native) + select-mode 📋 button (expo-clipboard, joined lines). Bot messages selectable too. Note: native long-press also enters delete-select — copy via 📋 recommended there.
components/BotPanel.js    # Offline rule-based bot: dict lookup (~1330w), quiz/skill launch callbacks, grammar tips, level guide, 9 small-talk intents + MY data (planner/notes/scores) + SHARED data (library/members/profile via Firestore). user prop wired from QAScreen. No API key. LIMIT: pattern-match only, open chat = roadmap.
# QAScreen modes: Quiz(levels+locks+best/unlock70%+placement75%→assessedLevel, progress AsyncStorage) | 🎲 Random 10 (unlocked-levels mix, no best-write) | ✋ Hand-pick browser (search+level filter+☑️, start picked shuffled) | Skills(listening TTS/reading/writing-input/speaking record+self-mark) | Bot. Scoring: points-aware (q.points||1, results show earned/total + %). Rules line in menu + SCORING export (quizData/index). Custom Qs now have level+mediaUrl. Video: question.mediaUrl → 🎬 button (Linking).
# Dictionary UX: tap-expand cards (full meaning+level desc+edit/delete), Level chips long-press/ⓘ = JLPT guide, N-badge tap = level info, 🔊 TTS playback per word (expo-speech ja, collapsed row + expanded detail; all roles).
# Dictionary auto-playlist: ▶️All (current filter snapshot) / ▶️From-here (expanded card) + repeat 1x/2x/3x (JP repeats; MM/EN explain once) + JP/MM/EN toggles + mini-player (pause/resume/next/stop + i/n). Per-word speech: JP word → MM composed ("X。reading。 မြန်မာလို Y。") → EN ("X means Y."). Voices auto-detected via getAvailableVoicesAsync (missing → toggle disabled; empty list → assume all OK). Manual 🔊 stops playlist. Follow-along: playing card highlighted (purple border) + auto-scroll (scrollToIndex, try/catch) — listen + read together. Video files bundled in app = roadmap (YouTube-link method available now).
# Notifications (no FCM — app-open only): src/notifications.js NotificationProvider (chats array-contains listener + pending==pending admin listener + 📣 notices + assignments + submissions/staff-or-own + unread via lastReadAt map AND AsyncStorage READ_KEY, navRef openChat/openTeaching) + components/NotificationPanel.js (unread→open thread; pending→one-tap Approve/Disable; 📣📖📝🏅⏰ sections) + AppHeader 🔔 badge + web document.title count. Community marks read on open/send (byUid in lastMessage). Old msgs w/o byUid default read. LIMIT: everything fires while app open — true background push needs Blaze (Functions) + native build (expo-notifications web-unsupported) = roadmap.
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
# Admin table: Created column (createdAt YYYY-MM-DD, — if missing) + tap-to-sort headers (name/role/status/created, ▲▼). Mobile-narrow fix: horizontal ScrollView + minWidth 660 rows (up/down = outer vertical scroll). ⚠️ LESSON 2026-10-06: horizontal ScrollView lays MULTIPLE children side-by-side (row) — header+rows merged into one line! MUST wrap in a SINGLE wrapper View (minWidth 660, vertical stack) inside it + flexGrow:1 content container. Fixed same day, verified via screenshot report. ✅ BUILT 2026-10-06: usage ACTIVITY LOG (activity/{autoId} via src/activity.js, 8 admin actions hooked, rules append-only + staff-read, viewer in TeacherScreen admin section, 3-lang) + TEACHING module MVP (collections: lessons{title,body,level,mediaUrl,by,byName,at} + assignments{title,desc,level,due,by,byName,at} + submissions{id=assignmentId_uid,assignmentId,uid,name,text,link,grade,feedback,at,gradedBy,gradedAt}; 📖 Class tab for ALL roles (/teaching); staff composes individual assignments (due date text), students submit once (resubmit=update), staff grades per submission; rules deployed via CLI). Next (optional): group-targeted assignments (targets[]), rich media submit, grade stats.
# User lifecycle (admin-driven credentials): TeacherScreen creates REAL Auth accounts via SECONDARY app instance (initializeApp+name, createUserWithEmailAndPassword, signOut+deleteApp — main admin session untouched) + temp password (expo-crypto MKS-XXXXXXXX, shown ONCE in delivery card, NEVER stored in Firestore) + profile {active, mustChangePassword:true}. Delivery: Copy / mailto: / sms: links (admin sends from own apps; NO server email/SMS — Twilio etc = roadmap). Admin 🔑 reset per row: sendPasswordResetEmail + flag; user-not-found placeholder → offer Auth-create+migrate+credentials. Force gate: App.js renders ForceChangePassword when mustChangePassword && hasPassword(providerData); updatePassword → clear flag → enter; requires-recent-login → logout+relogin path. session.js returns mustChangePassword+hasPassword; AuthScreen payloads carry them. Table 🔑 badge marks flagged users. LIMIT (client SDK): cannot SET another user's password — reset uses Firebase reset email (user sets own), Admin-SDK/Cloud-Function alternative = roadmap.
# Web Alert.alert() is a NO-OP in react-native-web (static alert(){}) — caused ALL invisible confirms (admin approve etc.). Fix: src/webAlertPolyfill.js (window.confirm map, imported in App.js) as safety net + components/ConfirmModal.js for TeacherScreen approve/disable/delete/role-save/create/password flows. Other screens still rely on polyfill.
# Community blank root cause: Google.useAuthRequest throws at render when OAuth IDs unconfigured (invariantClientId) — fixed by DriveSection lazy-mount (hook runs only if driveConfigured()) + SectionErrorBoundary.
# Dictionary RBAC: shared dataset — staff(teacher/admin) CRUD/import, students view+export only (🔒 view-only hint). Notes/Quiz customs stay personal.
# Teacher bio → Firestore settings/teacherBio (staff edit modal, all read; fallback static). Rules += settings/* (read signed-in, write staff).
# Materials 📚 tab: shared teacher Drive library — Firestore `materials` {title,desc,level,type,url,createdBy*} (teacher pastes Anyone-with-link Drive URL from THEIR Drive app; NO Drive API). Staff manage, all read. Deps: none. Modal web fix (ScrollView + minHeight desc). components/materialsSeed.js: 29 verified starter links + 🌱 one-tap seed (dedupe by title).
# Teacher Drive organization (no auto-folder by app — manual once): Drive folder "MKS Materials" → Share Anyone-with-link Viewer → files/images/audio/video inside (Drive native preview) → paste file/folder link into 📚. API auto-folder possible but rejected (OAuth drive.file scope + verification overhead vs 30s manual setup).
# Materials in-app viewer: resolveViewer() — YouTube ID → youtube-nocookie?/embed (WebView), Drive file ID → /file/d/preview embed (video/audio/pdf/docs/images), direct mp3/mp4 → expo-av Video (native controls), else external browser. Deps: react-native-webview (iframe on web), expo-av Video. External fallback button always shown.
# Essay & Songs reader (components/essayData.js): 5 original essays (N5x3/N4x2: 家族/休み/買い物 + 夢/雨の季節) + 5 songs (4 traditional PD + ふるさと verse-1 added 2026-10-06; PD 1914, lyricist d.1947/composer d.1941 — NO copyrighted lyrics ever; もみじ avoided — lyricist d.1959, PD only 2029). Schema {id,title,kind,level,lines:[{ja,reading,mm}]}. Materials tab segment: list → reader (tap line = play from there, ▶️ play all JA→MM per line, highlight + auto-scroll, ⏹️ stop; stops on back/mode-switch/unmount).
# Teacher Drive upload (100GB Gmail): src/teacherDrive.js useTeacherDrive — OAuth drive.file scope (teacher only, lazy-mounted). Flow: connect 100GB Gmail → ensure "MKS Materials" folder (+Anyone reader) → pick any file (≤100MB) → upload → Anyone-reader on file → webViewLink auto-fills material entry (title/type). Upload split: ≤5MB multipart, >5MB resumable session (Google multipart limit 5MB — bigger via multipart = "Invalid upload request" 400; fixed 2026-10-06). Quota/owner = teacher's Drive. Students only open links (no auth). Same OAuth client IDs as backup; teacher account must be tester (Testing mode). UI: MaterialsScreen add-modal TeacherUploadSection (staff only).
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

### Android APK build + public download

- `app.json` EAS project ID / owner နှင့် `android.package` ကို မပြောင်းဘဲ ထားရန်.
- First installable APK build (EAS account login လုပ်ပြီး project access ရှိရမည်):

```powershell
npx eas-cli build --platform android --profile preview
```

- EAS ပြီးဆုံးသည့်အခါ build page မှ `.apk` ကို download လုပ်ပါ။ Version tag အသစ် (ဥပမာ `v1.0.0`) ဖြင့် GitHub Release အသစ်ဖန်တီးပြီး APK ကို asset အဖြစ်တင်ပါ။ More ထဲက link က `/releases/latest` သို့ သွားမည်.
- Release cleanup ကို အရင် dry-run လုပ်ပါ: `.\scripts\keep_latest_release.ps1`. စာရင်းစစ်ပြီးနောက်မှသာ `.\scripts\keep_latest_release.ps1 -Apply` သုံးပါ။ ဒီ command က latest အပြင် published release နှင့် tag များကို အပြီးဖျက်သည်; draft များကို ချန်ထားသည်။ လိုအပ်သည်မှာ `gh auth login` နှင့် repo write permission.

## 6. ဒီ Maintenance Session မှာ ပြင်ခဲ့သမျှ (Changelog)

> အစဉ်လိုက်: 6.1 → 6.32 (2026-10-06 အတွင်း rounds; 6.11–6.21 ကို ပြင်ဆင်ပြီးမှ chronological ပြန်စီခဲ့သည် 2026-10-23)

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

### 6.11 Export/Import all 5 areas + AI bulk prompt (2026-10-06)
- **Audit**: Dictionary ✅ (ရှိ) / Quiz customs ❌ / Library ❌ / Essays ❌ / Teaching ❌ → ၄ ခု ထပ်ဆောက်. Pattern = Dictionary flow (web download + native share + clipboard fallback; paste + file pick).
- **Quiz customs** (QAScreen ✏️ section): 📥📤 buttons + import modal; validate {question, options≥2, correctIndex in range, level}; dedupe question+options; customs auto-merge into level pools (`levelPool`) → import-တာနဲ့ quiz မှာ တန်းပေါ်.
- **Library** (MaterialsScreen seg toolbar): 📥 staff-only (validate https, dupe title+url, addDoc) + 📤 everyone; seedBtn count 24→29 corrected.
- **Essays custom** (personal AsyncStorage `@japanese_essays_custom_v1`): reader merges `[...ESSAYS, ...customEssays]` (same schema → TTS reader auto-works); 📥 (validate lines[].ja) + 📤 everyone.
- **Teaching** (Class header): 📥 staff-only (`{lessons, assignments}`, same-id skip, level/target sanitize) + 📤 everyone; activity-logged.
- **`AI_CONTENT_PROMPT.md`** (NEW, committable): copy-paste prompt (EN+MM) + 5 schemas with examples + import paths + copyright rules (no copied lyrics/exams/textbooks; Tadoku link-only; OpenJLPT level-refs). Owner flow: other-AI JSON → 📥 import → quick check (kana readings? original MM? levels?) → done. No code deploy needed for bulk adds.
- **Content top-up (bounded)**: dict +10 (N3: 辛抱/率直/快適/退屈/謙遜 + N2: 賢明/愚か/大胆/臆病/頑丈; 切実 dropped — dupe). Dict total 1331→1341, dupes 0.
- Verify: export clean → hosting deploy → push. Ctrl+F5.

### 6.12 Teaching round-3 — lesson targets + resubmit + score/level grading (2026-10-06)
- **Lessons targetable**: editor target picker (all/level/students) + save + student auto-filter + 🎯 tag — assignments နည်းတူ. Old lesson docs (no target) = everyone.
- **Resubmit**: `{assignmentId}_{uid}` merge already allowed it, but stale grade stayed — now resubmit clears grade/feedback/score/slevel + `assign.resubmit` log + dedicated message (needs re-grade notice).
- **Score + level**: grading form = numeric score (0-100, numeric keyboard) + level chips (—/N5-N1) + feedback; saved as {score, slevel} (old `grade` text kept as fallback display + stats parse). Student sees `🏅 85 [N4]`. Stats avg uses scores.
- Prompt Schema E updated (lesson target + grading note). Verify: export clean → hosting deploy → push. Ctrl+F5.

### 6.13 Root error boundary (2026-10-06) — /teaching white-screen report
- Symptom: `/teaching` fully white (no header/tabs) right after round-3 deploy. Static audit of TeachingScreen render path found no throw (empty lists render fine) — cause unconfirmed (possibly stale bundle or transient).
- Fix: `RootErrorBoundary` in App.js (wraps Main) — any screen crash now shows ⚠️ + error text + 🔄 Reload instead of white screen. Next diagnosis = error-text screenshot from user.
- Verify: export clean → hosting deploy → push. User to Ctrl+F5 and retest; also confirm other tabs OK (distinguishes route crash vs bundle-wide).

### 6.14 Teaching white-screen root cause FOUND (2026-10-06)
- Boundary caught it: `Cannot read properties of null (reading 'target')`. Cause = round-2 target-picker UI used `modal.target` / `modal.targetUids` / `modal.targetLevel` WITHOUT `?.` — Modal children mount even when `modal=null`, so first render threw immediately (whole app white, all routes).
- Fix: all render-path modal reads → `modal?.x` (saveItem already guarded by `if (!modal) return`). Grep-audited remaining `modal.` uses — safe (handlers only).
- LESSON: Modal content ALWAYS renders (even visible=false) — every modal-state read in JSX MUST use `?.`. Same class of bug as 6.10 (blank tab).
- Verify: export clean (677) → hosting deploy → push. Ctrl+F5 → /teaching.

### 6.15 Samples +6 + Help tab (2026-10-06)
- **Teaching seeds 3+3→6+6** (fixed IDs, skip-existing): lessons +3 (カタカナ/N5 + Numbers&counters/N5 + 〜たい/N4) + assignments +3 (コンビニ katakana hunt/all + 値段 reading/N5-level + 〜たい作文/N4-level). 🌱 label updated; log text updated.
- **HelpScreen + 🆘 Help tab** (all roles, `/help`, my/en/jp): 12 sections — login/roles, language, Home, Dictionary, Planner, Notes, Quiz, People, Library, Class, Teacher/Admin, Tips. Static (no Firestore, no new deps).
- Verify: export clean (677) → hosting deploy → push. Ctrl+F5.

### 6.16 Notifications round (2026-10-06) — broadcast + teaching + due + login
- **Honest scope**: user asked for push (updates/logins/lessons/study/due). TRUE push (app-closed, scheduled) = IMPOSSIBLE on free tier: needs Blaze plan (Cloud Functions triggers+scheduler) + native build (expo-notifications has no web support) + FCM service-worker plumbing. Roadmap; built the max possible on free tier (app-open realtime).
- **📣 Broadcast** (`notices` collection, rules read-all/write-staff, CLI-deployed): TeacherScreen admin 📣 form (title+body) → all users bell+panel (latest 20). Use for app-update notes + announcements. Activity-logged.
- **📖/📝/🏅 Teaching events**: new lessons/assignments (not own) → bell; new submissions → staff bell (latest 100 slice — photo docs heavy, noted); graded → student bell with score. Tap → opens 📖 Class. Read-marks in AsyncStorage (panel open marks read).
- **⏰ Due reminders**: student assignments with parseable due within 3d OR overdue + unsubmitted → bell + panel (tap → Class). Due free-text `YYYY-MM-DD` (garbage ignored).
- **Login events**: `user.login` logged once/session in App.js (bell မတီး — admin sees in activity viewer; avoids bell spam).
- Files: src/notifications.js (rewrite), NotificationPanel.js (5 sections + 3-lang), TeacherScreen (form+keys+addDoc), App.js (useRef guard), firestore.rules (notices).
- Verify: export clean (678) → rules deploy (compiled OK) → hosting deploy → push. Ctrl+F5. First bell appears on next event (open panel once to baseline read-marks).

### 6.17 Seeds +10 → 11+11 (2026-10-06)
- Lessons +5 (あいさつ/N5 + これそれあれどれ/N5 + ないで・なくてもいい/N4 + ことができる/N4 + ようになる/N3) + assignments +5 (あいさつ日記/all + これ探し/N5 + ない作文/N4 + できる紹介/N4 + ようになった/N3). All original, cross-linked (Seed L↔A). Fixed IDs (skip-existing — old seeds untouched). 🌱 label 11+11.
- Verify: export clean (678) → hosting deploy → push. Ctrl+F5 → 📖 Class → 🌱.

### 6.18 Seed button visibility fix (2026-10-06)
- Bug: 🌱 seed button rendered ONLY in empty state (`list.length===0`) — after first seed (3+3), new seeds (→11+11) had no way in (skip-existing logic was fine, button unreachable).
- Fix: staff-only 🌱 button pinned in seg row (always visible), same `seedSamples` (skip-existing — safe to tap anytime).
- Verify: export clean → hosting deploy → push. Ctrl+F5 → 🌱 tap → +10 appear.

### 6.19 Bottom bar 10→6 + ☰ More menu (2026-10-06)
- Problem: 10 tabs → ~36px each on 360px mobile (customer review: ပြူးပြဲ/cramped).
- Fix: visible bar = Home/Dictionary/Quiz/Class/People/More; Planner/Notes/Library/Help/Teacher hidden via `tabBarButton: () => null` (navigate + deep-links `/planner` etc. keep working; Home quick links untouched).
- `components/MoreScreen.js` (NEW, my/en/jp, role-aware Teacher row) + App.js (More route `/more`, tabT, ☰ icon).
- Safety: `git tag pre-moremenu` (rollback = reset-hard + redeploy). No data/rules changes.
- Verify: export clean (679) → hosting deploy → push. Ctrl+F5 → 6-tab bar → ☰ → all reachable.

### 6.20 Home Quick Access — all menus (2026-10-06)
- Home showed only Dictionary/Planner/Notes/Quiz (+Teacher). Added: People/Library/Class/Help cards (2-col rows) + full-width ☰ More card (hidden-tabs gateway). homeT +5 keys × 3 langs.
- Verify: export clean → hosting deploy → push. Ctrl+F5 → Home.

### 6.21 Quiz bank + scoring rules + random/pick modes (2026-10-06)
- **Bank 159→174** (all original, 3/level): N5 n5q46-48 / N4 n4q36-38 / N3 n3q32-34 / N2 n2q26-28 / N1 n1q24-26 (new dict words cross-linked: 封筒/払う/結婚式/謙虚/曖昧/偶然/大胆/賢明/浪費/黄昏/邂逅).
- **SCORING export** (quizData/index): pointsPerQ 1, roundSize 10, passPractice 70, passPlacement 75. Engine points-aware (`q.points||1`, results earned/total + %; banks all 1pt → same display).
- **🎲 Random 10**: unlocked-levels mixed pool, shuffled slice 10, no best-write. **✋ Hand-pick**: bank+customs browser (search + level chips + ☑️, max 200 shown, count + clear + start shuffled).
- Rules line in quiz menu (3-lang). Bulk more via AI prompt Schema B → Quiz 📥.
- Verify: export clean (679) → hosting deploy → push. Ctrl+F5 → Quiz.

### 6.22 Auth reliability + approve-notify (2026-10-06)
- **Root cause of false "Firestore Rules" error**: `resolveUserProfile` collapsed EVERY exception (incl. flaky-mobile network timeouts) into one `firestoreOk=false` → UI always blamed Rules. Rules were fine (CLI-deployed, compiled OK).
- **Fix** (no rules change): `withRetry` (transient codes + offline/fetch/timeout msgs, 3 tries, 800ms backoff; `permission-denied` fail-fast) on uid-get/email-query/uid-create + `firestoreError` passthrough + `classifyResolveError` → UI shows **network-retry message** vs **true rules guidance** (AuthScreen login/register/Google + App.js restore). Register path now checks `firestoreOk` explicitly (was: success message even when profile write failed → un-approvable ghost).
- **Register email lowercased** (rules `email==token.email` case-sensitive compare hardening; login untouched to protect old mixed-case accounts).
- **Approve → notify card**: ✅ approve opens delivery card (`approved` mode: copy/mailto/sms with login link). Client CANNOT send email server-side (no SMTP/Functions on free tier) — admin forwards from own mail app (Copy/Email/SMS buttons). User keeps THEIR registered password (mustChangePassword NOT set on this path — no forced change, as requested).
- **Google-register flow (verified, no code needed)**: approve → 🔑 reset sends Firebase email → user sets OWN password via link → `mustChangePassword` flag → force-change gate on entry (hasPassword now true). Admin CANNOT set another user's password (Firebase client-SDK hard limit — reset-email IS the mechanism). Keeping the assigned password without changing: allowed (gate only forces a screen, user may reuse? — gate requires updatePassword call; reusing same string technically passes. Noted, no change).
- Verify: export clean (679) → hosting deploy → push. Ctrl+F5. Test: airplane-mode login → network message (not rules); new register → pending → approve → creds card → mailto → same-password login.

### 6.23 Google-approve email gap (2026-10-06)
- Report: Google-registered user approved, but NO confirmation email arrived. Re-checked: TWO gaps — (1) bell-panel one-tap Approve never surfaced any mail step (table ✅ approve already opens delivery card since 6.22); (2) approved text only covered Email-register (wrong for Google users: they need the Google button, no password).
- Fix (no backend email possible on free tier — stated honestly): panel pending rows gained ✉️ button (mailto with trilingual approval body: Email→own password / Google→Google button + login link); table `credApproved` corrected to cover BOTH register kinds.
- Verify: export clean → hosting deploy → push. Ctrl+F5. Flow: Google register → pending → Admin approve (table card OR panel + ✉️) → user gets approval mail → Google-button login, no password needed.

### 6.24 Google→password choice link (2026-10-06)
- Request: ask Google-approved users (Google-direct vs Email+Password?) + user-chosen password + admin reset/auto-generate + email.
- Honest limits: (1) Admin CANNOT generate/set another user's password (Firebase client-SDK hard limit — no exception). "Auto-generate + email" by admin = impossible; the mechanism IS Firebase reset email (auto-sent, user picks OWN password via link — also works for Google-only accounts, adding the password provider). (2) No server email (free tier) — mailto pattern as before.
- Built (token-light): login screen new link under Google button (3-lang `gwWantPw`): Google user types email → taps → reset email → sets OWN password → Email+Password login works alongside Google. Existing 🔑 reset + mustChange gate + approval mail text already cover the rest — verified, no changes needed there.
- Verify: export clean (679) → hosting deploy → push. Ctrl+F5. Test: Google account → link → reset mail → set password → login with it.

### 6.25 Delete 2-tier: rejoin vs permanent ban (2026-10-06)
- Problem: EVERY delete wrote a hard ban (uid+email) → deleted users could NEVER re-register. Requested: re-register allowed (PENDING → approve → login), plus optional never-allow.
- **Delete flow**: 🗑️ → confirm → policy choice: `✅ ဖျက် (ပြန်ဝင်ခွင့်ပြု)` sets `banned.allowRejoin=true` / `⛔ ဖျက် (အပြီးပိတ်)` omits flag (=permanent, old docs stay permanent). ConfirmModal `onCancel` now wired through (was silently swallowed — permanent path needed it). Banned list shows ↩️/⛔ per row. Audit: `user.delete-rejoin` vs `user.delete-ban`.
- **session**: ban check collects uid+email(case×2) ban docs → ANY doc without flag = hard block; all-flagged = proceed + self-delete own rejoin docs after profile resolve (best-effort).
- **Rules** (`banned` delete): admin OR (signed-in + `allowRejoin==true` + own-uid OR own-email-lower-match). CLI-deployed (compiled OK) — Console paste NOT needed. No other rule touched.
- Verify: export clean (678) → rules deploy → hosting deploy → push. Ctrl+F5. Test: delete(JV Two, allow) → same email register → PENDING → approve → login ✅; delete(ban) → register → ⛔ stays.

### 6.26 Quota/perf: users snapshot + messages limit (2026-10-06)
- `CommunityScreen`: `onSnapshot(collection(users))` → **one-time `getDocs` + 5min interval + 🔄 button** in search row. (Realtime listener re-read ALL 100 user docs on every presence heartbeat → read explosion on Spark 50K/day.)
- Messages listener: added `limitToLast(100)` (was loading entire chat history then client-slicing).
- `notifications.js` chats/notices/assigns listeners left as-is (per-user chats small; notices/assigns few docs).
- Verify: export clean → hosting deploy → push. Ctrl+F5. People tab: 🔄 refresh + presence dots still work (≤5min stale OK).

### 6.27 Guest mode + offline cache (B+A, 2026-10-06)
- **Guest**: AuthScreen "🎮 Continue as Guest" → `GUEST_KEY` AsyncStorage + `GUEST_USER {uid:null,isGuest:true}`. Tabs: Home/Dictionary/Quiz/More(+Planner/Notes/Help) only — Teaching/Community/Materials screens မပါ. Home banner explains login လိုတဲ့ feature. 🚪 = guest ထွက် → login screen. Real login ဝင်ရင် guest flag auto-clear. Refresh မှာ guest ပြန်ဝင် (flag). Server reads = 0 (presence/notif listeners skip uid-null).
- **Offline cache (A)**: `initializeFirestore(..., { localCache: persistentLocalCache() })` — web=IndexedDB, RN=AsyncStorage-based (firebase v12). ဖတ်ဖူးတဲ့ data cache → offline ဖတ်ရင် cache ကနေ; writes က online ပြန်ရောက်မှ sync. Fallback = default memory cache.
- Verify: export clean (679) → hosting deploy → push. Ctrl+F5. Test: logout → Guest → quiz/dict/planner/notes အကုန် work; 🚪 → login → full tabs ပြန်ပေါ်.

### 6.28 Login UI cleanup + creds modal simplify (2026-10-06)
- **AuthScreen login**: duplicate reset link (၂ ခုစလုံး reset email ပို့) ဖြုတ် — 1 ခုပဲ. Long texts တိုတောင်း: `🔑 Password မေ့ပါသလား?`, `G Google ဖြင့် ဝင်ရန်`. Register step labels (name/pw/register button/or) trilingual ပြောင်း (အရင် Myanmar hardcode). Guest button ကို login/register နှစ်ခုစလုံးအောက် ပြ.
- **TeacherScreen creds modal**: 📋Copy / ✉️Email (mailto→Outlook ဖွင့်) / 💬SMS ခလုတ် ၃ ခု ဖြုတ် — info card + OK ပဲ. Firebase reset email (noreply@…) ကပဲ သုံး. `credText/copyCreds/sendCredsMail/sendCredsSms` + Clipboard import ဖြုတ်.
- Verify: export clean (678) → hosting deploy → push. Ctrl+F5. Login page: ရှင်း, Guest button ပေါ်, language switch အကုန်ပြောင်း, reset link ၁ ခုပဲ.

### 6.29 Kana 五十音 screen + pronunciation lessons (2026-10-06)
- **Gap**: app မှာ ဂျပန်အခြေခံ (အက္ခရာပုံ/အသံထွက်) လုံးဝ မပါ — teaching seed က Tofugu link ပဲ. Stroke-order animation (Option 2) က bundleကြီး+native/web test လို → ချန် (next round candidate).
- **NEW `components/KanaScreen.js`**: 五十音表 — base 46 (あ〜わ行) + 濁音/半濁音 25 (が〜ぱ行) + 拗音 24 (きゃ/しゃ/ちゃ/じゃ…) + っ/ん/ー အထူး. Cell နှိပ် → 🔊 TTS (expo-speech ja, rate 0.8) + romaji + မြန်မာအသံနှိုင်း triple data. ひらがな⇄カタカナ toggle (code +0x60), row လိုက် 🔊 speak, selected detail card. Trilingual, local data only → offline/guest အလုပ်လုပ်, quota 0.
- **App.js**: hidden tab `Kana` (`tabBarButton: () => null`, `/kana` deep-link), tabT Kana labels, guest ပါ ဝင်နိုင်. **MoreScreen**: "あ ဂျပန်အက္ခရာ" menu item (menu ထိပ်ဆုံး, all roles/guest).
- **teachingSeed**: lesson seed ၂ ခု ထည့် — `seed_l12` っ・ん・ー (sokuon/nasal/long vowel), `seed_l13` ゃゅょ 拗音 + ち/つ/ふ အသံ (my/en/jp ရှင်းလင်း).
- Verify: export clean → hosting deploy → push. Ctrl+F5 → ☰ More → あ Kana → cell နှိပ် အသံထွက်, toggle ပြောင်း, lesson ၂ ခု Teaching ထဲ ပေါ် (staff 🌱 seed).

### 6.30 書き順 stroke-order animation (Option 2) (2026-10-06)
- **Deps**: `react-native-svg` 15.15.4 (expo install). **NEW `components/kanaStrokes.json`** (7.7KB): KanjiVG stroke paths 150 kana (あ〜ん/ア〜ン + ゃゅょ/っ + 濁音/半濁音) — script `scripts/fetch_kana_strokes.js` (jsDelivr CDN, lowercase hex; PS Invoke-WebRequest က slow/rate-limit ကြောင့် node fetch ပြောင်း; 2026-10-23 Temp ကနေ repo scripts/ ထဲ ပြောင်းပြီး).
- **KanaScreen stroke modal**: detail card ထဲ "✍ ရေးပုံ (書き順)" button (data ရှိမှ ပေါ်) → Modal: 109×109 SVG, stroke အဆင့်ဆင့် reveal 650ms/step (အနီ = ရေးပြီး, အပြာနီလေး = လက်ရှိ, မီးခိုး = ရေးရန်), step counter, 🔊, ▶ replay (playKey effect restart), ✕ close, KanjiVG CC BY-SA attribution footer. Combo (きゃ) → main kana (き); ー → no data → button hidden.
- Data က bundled (network 0, offline/guest OK). Bundle 2.8→2.9MB.
- Verify: export clean → hosting deploy → push `d54fdc6`+1. Ctrl+F5 → ☰ More → あ Kana → あ ရွေး → ✍ → strokes အစဉ်လိုက်ပေါ်, ▶ replay, カタカナ toggle မှာပါ အလုပ်လုပ်.

### 6.31 Home Quick Access + Kana, header mobile parity, logout icon (2026-10-06)
- **Quick Access (App.js HomeScreen)**: Kana ထည့် + rows ပြန်ချိန် — အားလုံး: [Dictionary|あ Kana], [Planner|Notes], [Quiz|Help]; non-guest: [People|Library], [Class full]; staff: [Teacher full]; အားလုံး: [More full]. Guest ၆ card / login ၉ card (role-ပေါ်သာ ကွာ — mobile/desktop တူညီ). `homeT.kana` ×3.
- **AppHeader mobile/desktop parity**: header `flexWrap: 'wrap'` + title `minWidth: 110` — narrow screen မှာ lang/bell/profile/logout ခလုတ်တွေ off-screen မကျ (wrap လာမယ်); desktop တစ်ကြောင်းအတိုင်းပဲ (layout မပြောင်း).
- **Logout icon**: `⏻` (U+23FB — font fallback မှာ လေးဒေါင့်/tilted ပေါ်) → `🚪` (guest banner text နဲ့ တူညီ, emoji font everywhere OK).
- Verify: export clean → hosting deploy → push. Ctrl+F5 → Home: Kana card ပေါ်; mobile width ချုံ့ → header ခလုတ်အပြည့်; logout icon 🚪 ပုံမှန်.

### 6.32 Kana sticky detail + UI language sweep (2026-10-06)
- **KanaScreen layout**: toggle + hint + selected-char detail box ကို **pinned top** (`fixedTop` View, scroll မလုပ်) — စာလုံးအကြီး အမြဲတမ်း မြင်ရ; အောက် chart (五十音 sections) ပဲ ScrollView မှာ scroll. Row 🔊 duplicate (JSX + t နှစ်ခုလုံး 🔊) ဖြုတ်.
- **i18n audit (auto scripts `scripts/i18n_check.js` + `scripts/i18n_lang.js` — run from repo root: `node scripts/i18n_check.js`)**: key parity my/en/jp = **ပြည့်စုံ (0 ပျောက်)** — blank button မရှိ. en/jp blocks ထဲ Myanmar **0**. ကျန်တာ: `my:` block ထဲ full-English chrome → ပြင်ပြီး:
  - QAScreen: title/tabQuiz/tabSkills/tabBot (မေးခွန်း/ကျွမ်းကျင်မှု/ဘော့), qLevel အဆင့်, o3/o4 (မဖြည့်လည်းရ), **video/videoUrl keys ×3 langs အသစ်** (🎬 Video/Video URL static ကို t.video ပြောင်း)
  - Notes header, NotificationPanel title (အသိပေးချက်များ), TeacherScreen headerAdmin/adminTitle (User စီမံခန့်ခွဲမှု), Materials mLevel/mUrl, Community stActive/stIdle/stOffline+activeNow, More libraryD, Teaching segAssign(တာဝန်ပေးစာ)/level/fLevel/fMedia/targetLevel/fLink/impTitle, **TeachErrorBoundary Retry** (retryLabel prop + teachT.retry ×3)
  - မပြင်ရသေး: loanword-in-Myanmar (Login/Password/Chat/Import/JSON — ရည်ရွယ်ချက်ရှိ), KanjiVG attribution (copyright credit — ဘာသာမပြောင်း), AuthScreen 'Email:' label.
- Verify: export clean → hosting deploy → push. Ctrl+F5 → Kana: detail box ပုံသေ + chart scroll; my mode: QA tab/title Myanmar; retry/video labels ဘာသာပေါ်.

### 6.33 Stroke modal fix + start/end markers + practice trace (2026-10-24)
- **Bug — canvas ဗလာ (stroke data အမှား)**: `scripts/fetch_kana_strokes.js` regex `d="…"` က SVG ထဲ `id="kvg:…"` ရှိ `d="` ကို အရင် ဖမ်း → kanaStrokes.json ထဲ **stroke ID မဟုတ် path data** တွေ (150/150 wrong) ရောက် → Path render မလုပ် → modal canvas ဖြူ. Fix: `/\sd="…"/` (space-prefixed d) + regen (jsDelivr 403 rate-limit ကြောင့် missing 5 (サノホリヲ) ကို retry script နဲ့ ဖြည့်). **150/150, 437 paths, bad=0**.
- **`pathInfo(d)` parser** (KanaScreen): M/C/Q/L/H/V/Z absolute+relative ကို walk → {start, end, unit-dir at start} (initial control-point vector). Node-tested 437/437 valid. **Start marker** = 🟢 ဂဏန်းပါ circle (①②③ = စဉ်လိုက်), **end marker** = 🔴 ●, **direction arrow** = 🔵 stroke စရာကနေ 16-unit အရှည် arrowhead — revealed stroke တိုင်းအတွက် (hot = လက်ရှိဆွဲနေသော stroke က blue, ကျန် pale blue).
- **✍ လေ့ကျင့် practice mode**: toggle button (blue when on) → PanResponder overlay — finger/mouse နဲ့ canvas ပေါ် guide stroke ပေါ် လိုက်ဆွဲ (blue #1565C0, opacity 0.75); px→viewBox (109-unit) ပြောင်း; point dedupe (0.4 threshold); release → stroke အပြီးသတ်; 🧹 ဖျက် button (trace ရှိမှ ပေါ်). Modal close/kana ပြောင်းရင် auto-clear. Toggles/clear buttons wrap (flexWrap) — mobile 4-button row overflow မရှိ.
- **i18n**: legend/practice/practiceOn/clear keys ×3 langs; i18n_check parity ✅ (0 missing). Hint line = practice ဖွင့်ရင် practiceOn hint, ပိတ်ရင် strokeHint.
- Verify: export clean (2.9MB) → `pathInfo` node test 437/437 → hosting deploy → push. Ctrl+F5 → Kana → あ → ✍ → strokes အစဉ်ပေါ် + စ/ဆုံး marker + arrow; ✋ နဲ့ လိုက်ဆွဲ → blue trace; 🧹 clear.

### 6.34 Kana stroke UI touch/text polish + notification badge parity (2026-10-25)
- **Mobile canvas zoom**: canvas `touchAction: 'pinch-zoom'` allows standard two-finger browser zoom while practice drawing continues through the single-finger PanResponder.
- **Stroke start labels**: remove green circle backgrounds; render only readable blue text numbers, offset ~15px from the starting point so labels do not cover the path.
- **Text selection**: disable selection on the large reference kana and stroke step, legend, hint, and attribution text to prevent highlighting during drawing.
- **Notification counts**: derive badge count and modal category counts from the same role-filtered fetched category counts. Staff submissions and student graded/due categories follow the same visibility rules as the panel.
- **Release**: `npx expo export --platform web --output-dir dist` completed (2.9MB web bundle); Firebase Hosting deployed to `https://japanese-mksedu.web.app`. GitHub push: commit `eebe1be` (`Fix kana stroke UI and notification counts`) pushed to `origin/main`.
- Verify: `git diff --check` clean; refresh the site (Ctrl+F5) and check Kana → stroke modal, pinch zoom on mobile, and admin notification badge/category totals.

### 6.35 Guest session count in Community Reports (2026-10-25)
- **Guest tracking**: app records a device-scoped anonymous session ID on Guest entry/restore, updates `lastSeenAt` every minute, and updates `lastActiveAt` on interaction. Clearing local app storage creates a new guest device ID.
- **Admin report**: Community → Reports shows three single-line summaries: registered users, guest users, and their combined totals. Each row includes active/idle/offline/total; guest sessions use the same presence thresholds as registered users. Burmese, English, Japanese labels are available.
- **Firestore rules**: `guestSessions/{sessionId}` permits only ISO-string presence fields; reads/deletes are admin-only. Signed-out and signed-in clients can write their own device-generated session document (rules cannot verify anonymous device ownership). Rules/Hosting are redeployed after this update.
- **Privacy/limits**: no guest name, email, UID, or browsing path is collected. Counts represent devices/browsers that entered Guest mode, not verified people; clearing app storage can count the same person again. Guest reporting needs a network connection; offline/local guest learning still works.
- Verify: web export and Firestore rules compile/deploy; refresh while in Guest mode and confirm the anonymous record appears; admin Report shows separate and combined counts.

### 6.36 Report total icons + mobile browser speech note (2026-10-25)
- **Report totals**: add 👤, 🎮, and 👥 before registered, guest, and combined total labels.
- **Kana audio**: web uses `expo-speech` and delegates to browser/device speech synthesis (`language: 'ja'`); Japanese voice availability and Web Speech behavior vary by browser/WebView. Chrome works in reported mobile setup; Bing app's embedded browser may not expose a Japanese speech voice. Suggest opening the page in Chrome or checking Android Settings → Text-to-speech output for an installed Japanese voice.

### 6.37 Kana speech-unavailable help (2026-10-25)
- Kana speech checks browser speech synthesis and Japanese voice availability. Missing API/voice or speech error shows a one-time localized alert with Bing → Chrome and Android Japanese Text-to-speech setup steps. Native `expo-speech` error callback uses the same guidance.

### 6.38 Maintenance: TTS, quiz moderation, tests, and EAS prep (2026-10-26)
- **Work plan recorded before implementation** in §8. No audio files were added; Kana continues to use Web Speech API / `expo-speech`.
- **Kana TTS:** web now waits briefly for asynchronously loaded browser voices, then requires a Japanese voice; native checks `Speech.getAvailableVoicesAsync()`. Missing API/voice and playback errors show the existing one-time localized alert. MY/EN/JP guidance covers Android Text-to-speech voice installation and switching from Bing/Viber/Facebook in-app browsers to Chrome.
- **Question bank:** static bundled banks remain the fallback. `src/quizBankSync.js` optionally loads approved Firestore questions and the current user's submissions. New questions/imports are submitted with `status: pending`; teachers/admins can approve or reject in QA. Only approved questions are visible to other users. `firestore.rules` now limits submissions and moderation accordingly. **Publish the updated rules in Firebase Console before enabling this on the live app.** No MP3/Cloud Storage usage.
- **Tests:** added Jest/Expo setup and 7 unit tests for weighted quiz scoring/unlock, profile defaults/adoption/`resolveUserProfile`, and `isAdmin`/`isTeacher`/`isSuperAdmin`.
- **Expo/EAS:** Android package remains `com.mksedu.japanesestudyplanner`. Added development/preview/production profiles in `eas.json`, installed required `expo-font` and `expo-splash-screen` plugins, moved splash settings to the supported plugin, converted mislabeled JPEG assets to actual PNG, removed unused `expo-status-bar`, and aligned SDK-compatible package versions. `expo-doctor` passes 20/21 checks; remaining advisory is that `expo-av` is marked unmaintained, but it is still used for recording/playback. EAS project ID and owner are now present in `app.json` (see §6.39).
- **Verification:** `npm test -- --runInBand` ✅ (3 suites / 7 tests); `node scripts/i18n_check.js` ✅; `npx expo export --platform web --output-dir dist` ✅ (2.9 MB); `npx expo config --type public` ✅; `git diff --check` ✅. `npx expo-doctor` reports only the `expo-av` maintenance advisory above.

### 6.39 Android APK download and release retention (2026-10-26)
- **More screen:** added a Burmese/English/Japanese accessible link card to `https://github.com/soemyintswe/japanese-learning-app/releases/latest`. Users can download the APK attached to the latest published release after an owner uploads one.
- **EAS APK profile:** `eas.json` preview now explicitly sets `android.buildType: apk` while retaining internal distribution. Build command: `npx eas-cli build --platform android --profile preview`. First build may prompt to create/manage the Android signing keystore; complete that prompt using the EAS account that owns the linked project. See Expo's [APK build guide](https://docs.expo.dev/build-reference/apk/).
- **Release retention:** added `scripts/keep_latest_release.ps1`, which defaults to dry-run, preserves GitHub's `isLatest` release (or falls back to the newest stable published release), and lists other published releases/tags for cleanup. Use `-Apply` only after reviewing: it permanently deletes those releases/assets and tags; drafts are preserved. Requires authenticated GitHub CLI (`gh auth login`) and repository write access.
- **First release flow:** build the APK; download it from the EAS build page; create a versioned GitHub Release and attach the APK. The in-app latest-release URL then resolves to it.
- **Verification:** `npx eas-cli config --platform android --profile preview` resolves the linked project and confirms `distribution: internal` + `buildType: apk`; `npx expo config --type public`, `node scripts/i18n_check.js`, `npm test -- --runInBand` (7 tests), web export (2.9 MB), PowerShell parser check, and `git diff --check` all pass. No EAS build or release cleanup was run; user confirms no APK has been built yet. The EAS CLI reports no variables configured in its `preview` environment; configure any required build-time `EXPO_PUBLIC_*` values there (notably Android Google Drive OAuth ID if that integration is needed in the APK).

### 6.40 Publish the supplied EAS APK build link (2026-10-26)
- **Home:** prominent red `Download Android APK` card immediately below the app header, translated MY/EN/JP, opens the supplied EAS build page. The More-screen APK link now opens the same build page instead of GitHub Releases.
- **Hosting target:** Firebase project/site `japanese-mksedu`; `japanese.mksedu.asia` responded HTTP 200 before and after deploy.
- **Verification:** `node scripts/i18n_check.js`, `npm test -- --runInBand` (7 passed), `npx expo export --platform web --output-dir dist` (2.9 MB), `npx expo config --type public`, and `git diff --check` passed. The live custom domain served the new app JS bundle containing build ID `58adfdf7-0ef4-4a4e-bb63-1cbbfd50a018` (homepage and JS HTTP 200).
- **Deploy:** `npx firebase-tools deploy --only hosting --project japanese-mksedu --non-interactive` completed; Firebase Hosting released the new version to `https://japanese-mksedu.web.app`, also served through `https://japanese.mksedu.asia`.

### 6.41 Login screen redesign (2026-10-26)
- **Layout:** centered responsive card with account and guest tabs; app logo/title stays in the header and MY/EN/JP switcher sits at the upper right. Guest view explains offline features and preserves the guest entry callback.
- **Account view:** username/email and password with eye toggle, Google sign-in, consent checkbox and policy link, login/reset actions, and email/Google registration choices. Existing authentication handlers are preserved.
- **APK:** prominent trilingual download button below the card opens the supplied EAS build page.
- **Verification:** i18n parity, existing Jest suite (7 tests), web export, and `git diff --check` pass.

### 6.42 Publish and push login redesign (2026-10-26)
- **Hosting:** exported web app deployed to Firebase project `japanese-mksedu`. The requested custom domain and app bundle returned HTTP 200; the live bundle contains the Account/Guest tabs and supplied EAS APK build ID.
- **Source control:** changes for the previously requested app maintenance, APK download, and login redesign are pushed to GitHub `main`; unrelated pre-existing untracked `components/AdminDashboard.js` and `src/analytics.js` are excluded.
- **Checks:** i18n parity, 7 Jest tests, Expo web export, and diff checks passed before deploy/push.

## 7. Lesson Learned (နောင် AI/dev သတိထားရန်)

1. `initializeAuth` on **web** MUST include `popupRedirectResolver: browserPopupRedirectResolver` — မပါရင် popup/redirect = `auth/argument-error` (အစကတည်းက မရခဲ့တာ).
2. `sendPasswordResetEmail` succeeds silently for non-existent emails — "ပို့ပြီးပြီ" ≠ ရောက်တယ်.
3. Firestore doc ≠ Auth account — Admin manual-create က login မရ. `auth:export` နဲ့ တိုက်စစ်.
4. Web Alert unreliable → inline banners. `getAuth` fallback try/catch ထား.
5. Role/status strings: lowercase normalise everywhere (badge, isAdmin, rules compare).
6. Deploy → Ctrl+F5 (user + ကိုယ်တိုင်).

## 8. Roadmap (ရှေ့ဆက်)

### 2026-10-26 Durable APK release plan
- [ ] Bump the user-facing version and auto-increment the Android version code for the next preview build.
- [ ] Point the in-app APK buttons to GitHub Releases latest, which avoids EAS artifact expiry.
- [ ] Test/export/push the release source, build the APK on EAS, upload it to a versioned GitHub Release, then deploy the durable download link.

### 2026-10-26 Login screen redesign plan
- [x] Preserve existing login/register/Google/privacy flows while moving them into a centered card with account and guest tabs.
- [x] Move title/logo and MY/EN/JP switcher to a compact header; add the supplied APK download link below the card.
- [x] Check i18n parity, tests, web export, and diff whitespace; record results.

### 2026-10-26 APK link + Hosting publish plan
- [x] Put a prominent, trilingual Android APK link on the homepage and point the More-screen link to the supplied EAS build page.
- [x] Verify Expo web export and existing tests/i18n; confirm the Firebase Hosting project/site and the requested custom domain.
- [x] Deploy the updated `dist/` to the `japanese-mksedu` Firebase project and record the deployment result.

### 2026-10-26 Maintenance plan (လုပ်ဆောင်ရန်အစီအစဉ်)
- [x] **APK link:** add a trilingual, accessible link in More to the latest GitHub Release.
- [x] **EAS APK:** set `preview.android.buildType` to `apk` and record the exact first-build command.
- [x] **Release cleanup:** add a dry-run-first script that retains the newest published release and can explicitly remove older releases/tags.
- [x] **Verification:** i18n parity, Expo config, tests, web export, script syntax, and diff whitespace checks pass.
- [x] **P0 TTS:** improve device/browser detection and localized guidance; no audio files/storage.
- [x] **P2 QA bank:** optional Firestore sync with local fallback and teacher/admin moderation. Live use requires publishing updated `firestore.rules`.
- [x] **P2 tests:** add and run focused Jest tests for scoring, profile resolve/adoption, and role checks.
- [x] **P2 EAS config:** validate package/config, add profiles, fix Expo config/dependency issues. EAS account/project linking remains a setup step before a cloud build.
- [x] **Verification:** i18n parity and web export pass; Expo doctor's only remaining advisory is active `expo-av` maintenance status.

- [x] **P0 — Secret cleanup (local, 2026-10-05):** local Copy files ဖျက်ပြီးပြီ. history purge ပြီးပြီ (2026-10-05, `git filter-branch` tree-filter + `push --force`; verify `git log --all -S` empty ✅; safety bundle: local Temp `pre-purge-backup.bundle`) — တကယ့် credential မဟုတ် (client-side အတုသက်သက်) ပေမယ့် တခြားနေရာ (Gmail etc.) မှာ **ထပ်သုံးနေရင် အခု ချက်ချင်း ပြောင်း** + history purge စဉ်းစား (`git filter-repo` + force-push). Firestore `users` ထဲ password field ကျန်ရင် ရှင်း.
- [ ] **P0 — Rules publish verify:** Console Rules = `firestore.rules` ဟုတ်/မဟုတ် တိုက်စစ်.
- [x] P1 — Home progress REAL (2026-10-06, §Home progress line + Quick Access round): planner completion % from AsyncStorage, mount/tab-focus/pull-refresh; 0% when empty (was fake 80→85% hardcode).
- [x] P1 — Bottom tab titles i18n (tabT my/en/jp in App.js, incl Kana labels + hidden-tab navigate).
- [x] P2 — Jest tests (quiz scoring, `resolveUserProfile`/adoption, RBAC) pass (2026-10-26). EAS preview profile resolves the linked project and produces APK configuration; no APK has been built yet. EAS project ID and owner are set in `app.json`. `expo-status-bar` removed (unused).
- [x] P2 — Optional QA question bank Firestore sync and teacher/admin moderation implemented (2026-10-26); **publish `firestore.rules` in Firebase Console** before live use.
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

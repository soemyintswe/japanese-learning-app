import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, TextInput, TouchableOpacity, Pressable, Alert, Share, RefreshControl, ActivityIndicator, Modal, Platform, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Admin table ထဲက icon ခလုတ်များ —
// Web မှာ mouse တင်ရင် စာတမ်းလေး (tooltip) ပေါ်မယ်၊
// ဖုန်းမှာ ဖိထားရင် (long-press) ရှင်းလင်းချက် ပေါ်မယ်။
function ActionBtn({ emoji, bg, tip, onPress, disabled }) {
  const [hover, setHover] = useState(false);
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      onHoverIn={() => setHover(true)}
      onHoverOut={() => setHover(false)}
      onLongPress={() => Alert.alert('ဒီခလုတ်က ဘာလုပ်တာလဲ?', tip)}
      style={[styles.smallBtn, { backgroundColor: bg, opacity: disabled ? 0.45 : 1 }]}
    >
      <Text style={{ fontSize: 12 }}>{disabled ? '…' : emoji}</Text>
      {hover && Platform.OS === 'web' && (
        <View style={styles.tooltip}>
          <Text style={styles.tooltipText}>{tip}</Text>
        </View>
      )}
    </Pressable>
  );
}

function firestoreErrorMsg(error, actionName) {
  if (error?.code === 'permission-denied' || (error?.message || '').includes('permission')) {
    return actionName + ' မရပါ — Firestore Rules ခွင့်မပြုလို့ပါ。\n\nFirebase Console > Firestore Database > Rules tab မှာ project ထဲက firestore.rules file အတိုင်း ကူးထည့်ပြီး Publish လုပ်ပေးပါ။';
  }
  return actionName + ' မအောင်မြင်ပါ။ (' + (error?.code || error?.message || 'unknown') + ')';
}

// Firebase ချိတ်ဆက်မှု
import { db, auth, firebaseConfig } from '../src/firebase';
import { collection, getDocs, doc, setDoc, getDoc, updateDoc, deleteDoc, query, orderBy, limit } from 'firebase/firestore';
import * as ExpoSharing from 'expo-sharing';
import { initializeApp, deleteApp } from 'firebase/app';
import {
  updatePassword, getAuth, createUserWithEmailAndPassword,
  signOut, sendPasswordResetEmail,
} from 'firebase/auth';
import * as Crypto from 'expo-crypto';
import * as Clipboard from 'expo-clipboard';
import { useLanguage } from '../src/LanguageContext';
import AppHeader from './AppHeader';
import ConfirmModal from './ConfirmModal';

const teacherT = {
  my: {
    headerAdmin: '🛡️ Admin Panel & User Management', headerUser: '🎓 ကျောင်းသား/ဆရာ ဧရိယာ',
    adminTitle: '🛡️ ADMIN - User Management', addUser: 'User အသစ်ထည့်မည်',
    sub: 'Register လုပ်ထားသူများကို Approve လုပ်ရန်၊ Role ပြောင်းရန်နှင့် စီမံရန်',
    legend: 'ခလုတ် အဓိပ္ပာယ် — ✅/🔒 = ဖွင့်/ပိတ် (Approve/Disable)\n🔄 = Role ရွေးမယ် (နှိပ်ရင် Student/Teacher/Admin စာရင်း ပေါ်မယ်)\n🗑️ = အကောင့် အပြီးဖျက်\n(Web မှာ ခလုတ်ပေါ် mouse တင်ရင် စာတမ်းပေါ်မယ်၊ ဖုန်းမှာ ဖိထားရင် ရှင်းချက်ပေါ်မယ်)',
    thName: 'အမည် / Email', thRole: 'Role', thStatus: 'Status', thBy: 'Admin', thCreated: 'တည်ဆောက်ရက်', thActions: 'Actions',
    empty: 'Firestore တွင် ယခုလက်ရှိ User စာရင်း မရှိသေးပါ။', me: ' (ကိုယ်)',
    statusActive: 'အသုံးပြုခွင့် ဖွင့်ပေးလိုက်ပါပြီ (ACTIVE)။', statusDisabled: 'အသုံးပြုခွင့် ပိတ်လိုက်ပါပြီ (DISABLED)။',
    nonAdminTitle: 'အကောင့် အခြေအနေ', nonAdminBody: 'သင်၏အကောင့်မှာ ကျောင်းသား/ဆရာ အကောင့်ဖြစ်ပါသည်။ Admin လုပ်ဆောင်ချက်များကို ကြည့်ရှုခွင့်မရှိပါ။',
    bioTitle: 'ဆရာ့ ကိုယ်ရေးအကျဉ်းနှင့် အရည်အချင်းများ',
    bioName: 'ဦးစိုးမြင့်ဆွေ (U Soe Myint Swe)',
    bioDegreesV: 'B.Sc (Physics), Dip. in Education, MKS Edu Services Founder',
    bioExpertiseV: 'Japanese Language (JLPT N3/N4/N5), Python Automation, Educational Management',
    bioExpV: '၂၅ နှစ်ကျော် အစိုးရနှင့် ပညာရေးဝန်ဆောင်မှု လုပ်ငန်းအတွေ့အကြုံရှိသူ။',
    bioContactV: 'soemyintswe@gmail.com | Yangon, Myanmar',
    bioDegrees: 'ဘွဲ့/ပညာအရည်အချင်း:', bioExpertise: 'ကျွမ်းကျင်မှု:', bioExp: 'အတွေ့အကြုံ:', bioContact: 'ဆက်သွယ်ရန်:',
    shareTitle: 'App ကို မျှဝေသုံးစွဲရန်', shareSub: 'ဤ Study Planner အက်ပ်ကို အခြားသူများထံ မျှဝေရန် နှိပ်ပါ',
    pwTitle: '🔑 စကားဝှက် ပြင်ဆင်ရန် (Change Password)', oldPw: 'စကားဝှက်ဟောင်း (Old Password):', newPw: 'စကားဝှက်အသစ် (New Password):',
    changeBtn: 'စကားဝှက် ပြောင်းလဲမည်',
    createTitle: '👤 User အသစ် ထည့်သွင်းခြင်း', nameLabel: 'အမည် (Full Name):', emailLabel: 'Email:',
    createNote: 'Auth အကောင့် + ကနဦး password တကယ် ဖန်တီးပေးမယ် — user က ပထမ login မှာ ကိုယ့်ဘာသာ ပြောင်းရမယ်။ ဖန်တီးပြီးရင် login အချက်အလက် ကတ် ပေါ်မယ် (Copy/Email/SMS နဲ့ ပို့ပါ)။',
    roleLabel: 'Role သတ်မှတ်ရန်:', cancel: 'ပယ်ဖျက်မည်', create: 'ဖန်တီးမည်',
    roleModalTitle: '🔄 Role ရွေးချယ်ရန်', roleFor: 'အတွက် Role ရွေးပါ — လက်ရှိ:', current: '(လက်ရှိ)', saveRole: 'သိမ်းဆည်းမည်',
    rStudent: 'STUDENT', rTeacher: 'TEACHER', rAdmin: 'ADMIN',
    rStudentD: 'မေးခွန်းဖြေ၊ Planner/Notes သုံးမယ်', rTeacherD: 'မေးခွန်းထည့်/ပြင်၊ သင်ကြားရေး စီမံမယ်', rAdminD: 'User အကုန် + Role + Status စီမံမယ်',
    tipToggleActive: 'အသုံးပြုခွင့် ပိတ်မယ် (DISABLE) — ဒီအကောင့် Login ဝင်မရတော့ပါ',
    tipTogglePending: 'အသုံးပြုခွင့် ဖွင့်မယ် (APPROVE/ACTIVE) — Login ဝင်လို့ရပြီ',
    tipRole: 'Role ရွေးမယ်', tipDelete: 'အကောင့်ကို Firestore ထဲက အပြီးဖျက်မယ် (Delete) — ပြန်မရပါ!',
    ok: 'အောင်မြင်သည် ✅', err: 'အမှား',
    errFetch: 'User စာရင်း ဆွဲထုတ်ရာတွင် အမှားရှိသည်: ',
    errCreateFill: 'အမည် နှင့် Email ကို ဖြည့်သွင်းပါ။', createdTail: 'ကို အောင်မြင်စွာ ဖန်တီးပြီးပါပြီ။', userWord: 'User',
    roleQ: 'Role ပြောင်းလဲရန်', roleTo: '၏ Role ကို', roleChangedTo: 'သို့ ပြောင်းမည်မှာ သေချာပါသလား?', noDo: 'မလုပ်ပါ', yesSave: 'သိမ်းမည်',
    statusQ: 'အသုံးပြုခွင့် (Status) ပြောင်းလဲရန်', statusConfirm: 'အတည်ပြုမည်',
    delQ: 'သတိပေးချက် ⚠️️', delConfirm: 'အကောင့်ကို စနစ်ထဲမှ လုံးဝ ဖျက်ပစ်ရန် သေချာပါသလား?', noDel: 'မဖျက်ပါ', yesDel: 'ဖျက်မည်', deleted: 'User အကောင့်ကို ဖျက်ပစ်ပြီးပါပြီ။',
    pwShort: 'Password အသစ်ကို အနည်းဆုံး ၆ လုံး ဖြည့်ပါ။', pwLoginFirst: 'Google/Email နဲ့ Login ဝင်ထားမှ Password ပြောင်းလို့ရပါတယ်။',
    pwDone: 'သင်၏ Password ကို Firebase မှာ တကယ်ပြောင်းပြီးပါပြီ။', pwRecent: 'လုံခြုံရေးအရ Logout လုပ်ပြီး Login ပြန်ဝင်ပြီးမှ ပြောင်းပါ။', pwFail: 'မအောင်မြင်ပါ',
    okBtn: 'အိုကေ',
    phoneLabel: 'ဖုန်း (SMS ပို့ရန်, optional):', tempPwLabel: 'ကနဦး Password (6+ လုံး, 🎲 နှိပ် auto):',
    credTitle: '📨 Login အချက်အလက် ပို့ရန်', credLink: 'Link', credFirst: 'ပထမ login မှာ password ပြောင်းရမယ်',
    credResetNote: 'Password reset link ပို့ပြီးပြီ — user က link ကနေ password သတ်မှတ်ပြီး ဝင်ရင် ထပ်ပြောင်းရမယ်',
    credHint: 'Copy / Email app / SMS နဲ့ user ထံ ပို့ပါ (temp password ကို ဒီမှာပဲ မြင်ရမယ် — နောက်မပြတော့ဘူး)',
    credCopy: 'ကူးမယ်', credCopied: 'ကူးပြီးပါပြီ ✅',
    resetTitle: '🔑 Password Reset', resetConfirm: 'အတွက် password reset လုပ်မလား? (reset email ပို့ + နောက် login မှာ password ပြောင်းခိုင်းမယ်)',
    resetGo: 'Reset လုပ်မည်', resetNoAuth: 'မှာ Auth အကောင့် မရှိသေးဘူး — temp password နဲ့ login အသစ် ဖန်တီးပေးမလား?',
    resetCreateGo: 'ဖန်တီးပေးမည်',
    tipReset: 'Password reset — reset email ပို့ + နောက် login မှာ ပြောင်းခိုင်း',
    backupBtn: 'Backup', backupDone: 'Backup သိမ်းပြီးပါပြီ ✅',
    bannedTitle: '⛔ ပိတ်ထားသောအကောင့်များ', bannedEmpty: 'ပိတ်ထားတာ မရှိပါ။',
    unbanQ: 'ပြန်ဖွင့်ပေးမလား?', unbanMsg: 'ပိတ်ထားမှုကို ရုပ်သိမ်းပြီး ပြန် register/login ဝင်ခွင့်ပေးမယ်။',
    unbanGo: 'ပြန်ဖွင့်မည်', unbannedOk: 'ပြန်ဖွင့်ပြီးပါပြီ ✅ — အကောင့်အသစ်မှတ်ပုံတင်/ဝင်နိုင်ပြီ။',
    errPwShort: 'Password အနည်းဆုံး ၆ လုံး ဖြစ်ရမယ်။',
    errEmailInvalid: 'Email ပုံစံမှားနေပါတယ်။',
    errExists: 'ဤ Email နဲ့ Auth အကောင့်ရှိပြီးသား — Login ဝင်ခိုင်း သို့မဟုတ် 🔑 Reset သုံးပါ။',
    errOpNotAllowed: 'Firebase Console → Authentication → Email/Password → Enable လုပ်ပေးပါ။',
    bioEdit: '✏️ ပြင်ဆင်ရန်',
    bioModalTitle: 'ဆရာ့ ကိုယ်ရေးအကျဉ်း ပြင်ဆင်ရန်',
    bioFName: 'အမည်:', bioFDeg: 'ဘွဲ့/ပညာအရည်အချင်း:', bioFExpertise: 'ကျွမ်းကျင်မှု:', bioFExp: 'အတွေ့အကြုံ:', bioFContact: 'ဆက်သွယ်ရန်:',
    bioSaved: 'ကိုယ်ရေးအကျဉ်း သိမ်းပြီးပါပြီ ✅',
  },
  en: {
    headerAdmin: '🛡️ Admin Panel & User Management', headerUser: '🎓 Student/Teacher Area',
    adminTitle: '🛡️ ADMIN - User Management', addUser: 'Add New User',
    sub: 'Approve registrations, change roles and manage users',
    legend: 'Buttons — ✅/🔒 = Approve/Disable\n🔄 = Pick role (Student/Teacher/Admin list)\n🗑️ = Delete account permanently\n(Web: hover for tips, phone: long-press)',
    thName: 'Name / Email', thRole: 'Role', thStatus: 'Status', thBy: 'Admin', thCreated: 'Created', thActions: 'Actions',
    empty: 'No users in Firestore yet.', me: ' (you)',
    statusActive: 'Access enabled (ACTIVE).', statusDisabled: 'Access disabled (DISABLED).',
    nonAdminTitle: 'Account Status', nonAdminBody: 'Your account is a student/teacher account. Admin features are not visible to you.',
    bioTitle: 'Teacher Profile & Qualifications',
    bioName: 'U Soe Myint Swe',
    bioDegreesV: 'B.Sc (Physics), Dip. in Education, MKS Edu Services Founder',
    bioExpertiseV: 'Japanese Language (JLPT N3/N4/N5), Python Automation, Educational Management',
    bioExpV: '25+ years in government and education services.',
    bioContactV: 'soemyintswe@gmail.com | Yangon, Myanmar',
    bioDegrees: 'Degrees:', bioExpertise: 'Expertise:', bioExp: 'Experience:', bioContact: 'Contact:',
    shareTitle: 'Share the App', shareSub: 'Tap to share this Study Planner app with others',
    pwTitle: '🔑 Change Password', oldPw: 'Old Password:', newPw: 'New Password:',
    changeBtn: 'Change Password',
    createTitle: '👤 Add New User', nameLabel: 'Full Name:', emailLabel: 'Email:',
    createNote: 'Creates a real Auth account + initial password — user must change it on first login. A delivery card appears after creation.',
    roleLabel: 'Set role:', cancel: 'Cancel', create: 'Create',
    roleModalTitle: '🔄 Pick a Role', roleFor: 'Pick a role for', current: '(current)', saveRole: 'Save',
    rStudent: 'STUDENT', rTeacher: 'TEACHER', rAdmin: 'ADMIN',
    rStudentD: 'Answer quizzes, use Planner/Notes', rTeacherD: 'Add/edit questions, manage teaching', rAdminD: 'Manage all users, roles and status',
    tipToggleActive: 'Disable access (DISABLED) — cannot log in anymore',
    tipTogglePending: 'Enable access (APPROVE/ACTIVE) — can log in now',
    tipRole: 'Pick a role', tipDelete: 'Permanently delete from Firestore — cannot be undone!',
    ok: 'Success ✅', err: 'Error',
    errFetch: 'Failed to load user list: ',
    errCreateFill: 'Please fill in name and email.', createdTail: ' created successfully.', userWord: 'User',
    roleQ: 'Change Role', roleTo: "'s role to", roleChangedTo: '?', noDo: 'Cancel', yesSave: 'Save',
    statusQ: 'Change Access Status', statusConfirm: 'Confirm',
    delQ: 'Warning ⚠️️', delConfirm: 'Permanently delete this account from the system?', noDel: 'No', yesDel: 'Delete', deleted: 'User account deleted.',
    pwShort: 'New password must be at least 6 characters.', pwLoginFirst: 'Please log in with Google/Email first.',
    pwDone: 'Your password has been changed in Firebase.', pwRecent: 'For security, log out and log in again first.', pwFail: 'Failed',
    okBtn: 'OK',
    phoneLabel: 'Phone (for SMS, optional):', tempPwLabel: 'Initial password (6+, 🎲 auto):',
    credTitle: '📨 Send Login Info', credLink: 'Link', credFirst: 'must change password on first login',
    credResetNote: 'Reset email sent — user sets password via link, then must change again on entry',
    credHint: 'Send via Copy / Email app / SMS (temp password shown only here)',
    credCopy: 'Copy', credCopied: 'Copied ✅',
    resetTitle: '🔑 Password Reset', resetConfirm: 'Reset password? (sends reset email + forces change on next login)',
    resetGo: 'Reset', resetNoAuth: 'has no Auth account yet — create login with temp password now?',
    resetCreateGo: 'Create it',
    tipReset: 'Password reset — send reset email + force change',
    backupBtn: 'Backup', backupDone: 'Backup saved ✅',
    bannedTitle: '⛔ Banned accounts', bannedEmpty: 'None banned.',
    unbanQ: 'Unban?', unbanMsg: 'Lift the ban — they can register/log in again.',
    unbanGo: 'Unban', unbannedOk: 'Unbanned ✅',
    errPwShort: 'Password must be at least 6 characters.',
    errEmailInvalid: 'Invalid email format.',
    errExists: 'Auth account already exists — ask them to log in, or use 🔑 Reset.',
    errOpNotAllowed: 'Firebase Console → Authentication → enable Email/Password.',
    bioEdit: '✏️ Edit',
    bioModalTitle: 'Edit Teacher Profile',
    bioFName: 'Name:', bioFDeg: 'Degrees:', bioFExpertise: 'Expertise:', bioFExp: 'Experience:', bioFContact: 'Contact:',
    bioSaved: 'Profile saved ✅',
  },
  jp: {
    headerAdmin: '🛡️ 管理者パネル・ユーザー管理', headerUser: '🎓 学生・先生エリア',
    adminTitle: '🛡️ ADMIN - ユーザー管理', addUser: '新規ユーザー追加',
    sub: '登録の承認、ロールの変更、ユーザー管理',
    legend: 'ボタン — ✅/🔒 = 有効化/無効化\n🔄 = ロール選択（Student/Teacher/Admin)\n🗑️ = アカウント完全削除\n(Web: ホバーで説明、スマホ: 長押し)',
    thName: '名前 / Email', thRole: 'ロール', thStatus: 'ステータス', thBy: '担当', thCreated: '作成日', thActions: '操作',
    empty: 'Firestoreにユーザーがまだいません。', me: '（あなた）',
    statusActive: '利用を有効化しました（ACTIVE）。', statusDisabled: '利用を無効化しました（DISABLED）。',
    nonAdminTitle: 'アカウント状態', nonAdminBody: 'あなたのアカウントは学生・先生用です。管理者機能は表示されません。',
    bioTitle: '先生のプロフィール・資格',
    bioName: 'ウー・ソー・ミン・スエ',
    bioDegreesV: '物理学学士、教育ディプロマ、MKS Edu Services 創設者',
    bioExpertiseV: '日本語（JLPT N3/N4/N5）、Python自動化、教育管理',
    bioExpV: '政府・教育サービスで25年以上の経験。',
    bioContactV: 'soemyintswe@gmail.com | ヤンゴン、ミャンマー',
    bioDegrees: '学位・学歴:', bioExpertise: '専門:', bioExp: '経験:', bioContact: '連絡先:',
    shareTitle: 'アプリを共有', shareSub: 'このスタディプランナーを他の人に共有するにはタップ',
    pwTitle: '🔑 パスワード変更', oldPw: '古いパスワード:', newPw: '新しいパスワード:',
    changeBtn: 'パスワードを変更',
    createTitle: '👤 新規ユーザー追加', nameLabel: '氏名:', emailLabel: 'Email:',
    createNote: 'Auth＋初期パスワードを作成 — 初回に変更必須。',
    roleLabel: 'ロール設定:', cancel: 'キャンセル', create: '作成',
    roleModalTitle: '🔄 ロール選択', roleFor: 'のロールを選択 — 現在:', current: '（現在）', saveRole: '保存',
    rStudent: 'STUDENT', rTeacher: 'TEACHER', rAdmin: 'ADMIN',
    rStudentD: 'クイズ解答、プランナー・ノート利用', rTeacherD: '問題の追加・編集、指導管理', rAdminD: '全ユーザー・ロール・状態の管理',
    tipToggleActive: '利用を無効化（DISABLE）— ログインできなくなります',
    tipTogglePending: '利用を有効化（APPROVE/ACTIVE）— ログイン可能になります',
    tipRole: 'ロールを選択', tipDelete: 'Firestoreから完全削除 — 元に戻せません！',
    ok: '成功 ✅', err: 'エラー',
    errFetch: 'ユーザー一覧の取得に失敗: ',
    errCreateFill: '名前とEmailを入力してください。', createdTail: 'を作成しました。', userWord: 'ユーザー',
    roleQ: 'ロール変更', roleTo: 'のロールを', roleChangedTo: 'にしますか？', noDo: 'やめる', yesSave: '保存',
    statusQ: '利用状態の変更', statusConfirm: '確定',
    delQ: '警告 ⚠️️', delConfirm: 'このアカウントをシステムから完全に削除しますか？', noDel: 'やめる', yesDel: '削除', deleted: 'ユーザーアカウントを削除しました。',
    pwShort: '新しいパスワードは6文字以上にしてください。', pwLoginFirst: 'Google/Emailでログインしてから変更してください。',
    pwDone: 'Firebaseでパスワードを変更しました。', pwRecent: 'セキュリティのため再ログインしてください。', pwFail: '失敗',
    okBtn: 'OK',
    phoneLabel: '電話（SMS用、任意）:', tempPwLabel: '初期パスワード（6文字以上、🎲自動）:',
    credTitle: '📨 ログイン情報送信', credLink: 'リンク', credFirst: '初回ログイン時に変更必須',
    credResetNote: 'リセットメール送信済み — リンクで設定後、入場時に再変更',
    credHint: 'コピー/メール/SMSで送信（仮パスはここでのみ表示）',
    credCopy: 'コピー', credCopied: 'コピー ✅',
    resetTitle: '🔑 リセット', resetConfirm: 'リセットしますか？',
    resetGo: '実行', resetNoAuth: 'Authなし — 仮パスで新規作成しますか？',
    resetCreateGo: '作成',
    tipReset: 'パスワードリセット',
    backupBtn: 'Backup', backupDone: '保存 ✅',
    bannedTitle: '⛔ 停止中', bannedEmpty: 'なし。',
    unbanQ: '解除しますか？', unbanMsg: '再登録可能にします。',
    unbanGo: '解除', unbannedOk: '解除 ✅',
    errPwShort: '6文字以上。',
    errEmailInvalid: '形式エラー。',
    errExists: '既存あり — ログインか🔑リセットを。',
    errOpNotAllowed: 'ConsoleでEmail/Passwordを有効に。',
    bioEdit: '✏️ 編集',
    bioModalTitle: '先生プロフィール編集',
    bioFName: '名前:', bioFDeg: '学位・学歴:', bioFExpertise: '専門:', bioFExp: '経験:', bioFContact: '連絡先:',
    bioSaved: '保存しました ✅',
  },
};

export default function TeacherScreen({ currentUser, onLogout, navigation }) {
  const goProfile = () => { try { navigation.navigate('Community', { seg: 'profile' }); } catch (e) {} };
  const { lang } = useLanguage();
  const t = teacherT[lang] || teacherT.my;
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [usersList, setUsersList] = useState([]);

  // Admin အီးမေးလ် သတ်မှတ်ချက်
  const ADMIN_EMAIL = 'soemyintswe@gmail.com'; 
  const isAdmin = currentUser?.email === ADMIN_EMAIL || currentUser?.role === 'admin';

  // User အသစ် (Auth + temp password) ဖန်တီးရန် State များ
  const [modalVisible, setModalVisible] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newRole, setNewRole] = useState('student');
  const [newTempPw, setNewTempPw] = useState('');
  const [showTempPw, setShowTempPw] = useState(false);
  // ပို့ရန် credentials card: {name, email, phone, tempPw?, resetLinkSent?}
  const [creds, setCreds] = useState(null);

  const APP_LOGIN_URL = 'https://japanese-mksedu.web.app';

  // ဖတ်ရလွယ် temp password: MKS-XXXXXXXX (ambiguous chars ဖယ်)
  const genTempPassword = async () => {
    const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
    try {
      const bytes = await Crypto.getRandomBytesAsync(8);
      let s = '';
      for (let i = 0; i < 8; i++) s += chars[bytes[i] % chars.length];
      return 'MKS-' + s;
    } catch (e) {
      let s = '';
      for (let i = 0; i < 8; i++) s += chars[Math.floor(Math.random() * chars.length)];
      return 'MKS-' + s;
    }
  };

  const credText = (c) => (
    `Japanese Study Planner — Login\n${t.credLink || 'Link'}: ${APP_LOGIN_URL}\nEmail: ${c.email}\n` +
    (c.tempPw ? `Password: ${c.tempPw}\n(${t.credFirst || ''})` : `${t.credResetNote || ''}`)
  );

  const copyCreds = async () => {
    if (!creds) return;
    try {
      await Clipboard.setStringAsync(credText(creds));
      showInfo(t.ok, t.credCopied || 'Copied ✅');
    } catch (e) {
      showInfo(t.err, String(e.message || e));
    }
  };

  const sendCredsMail = () => {
    if (!creds) return;
    const url = `mailto:${encodeURIComponent(creds.email)}?subject=${encodeURIComponent('Japanese Study Planner — Login')}&body=${encodeURIComponent(credText(creds))}`;
    Linking.openURL(url).catch(() => {});
  };

  const sendCredsSms = () => {
    if (!creds || !creds.phone) return;
    const url = `sms:${encodeURIComponent(creds.phone)}?body=${encodeURIComponent(credText(creds))}`;
    Linking.openURL(url).catch(() => {});
  };

  const [oldPassword, setOldPassword] = useState('');
  const [newPass, setNewPass] = useState('');
  const [showOldPass, setShowOldPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);

  // ခလုတ်နှိပ်နေတုန်း (loading) ဘယ်အတန်းလဲ မှတ်ထားရန် — ခလုတ်အလုပ်လုပ်နေမှန်း သိသာအောင်
  const [busyId, setBusyId] = useState(null);
  // Sorting: header နှိပ် →-same key ဆို asc/desc လှည့်
  const [sortKey, setSortKey] = useState(null);
  const [sortDir, setSortDir] = useState('asc');
  const sortedUsers = (() => {
    if (!sortKey) return usersList;
    const arr = [...usersList];
    const get = (u) => {
      if (sortKey === 'name') return (u.name || u.username || '').toLowerCase();
      if (sortKey === 'role') return (u.role || '').toLowerCase();
      if (sortKey === 'status') return (u.status || '').toLowerCase();
      if (sortKey === 'created') return u.createdAt || '';
      return '';
    };
    arr.sort((a, b) => {
      const r = String(get(a)).localeCompare(String(get(b)));
      return sortDir === 'asc' ? r : -r;
    });
    return arr;
  })();
  const shortDate = (iso) => {
    if (!iso) return '—';
    const s = String(iso).slice(0, 10);
    return /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : '—';
  };

  // In-app confirm/info dialog (web Alert.alert is NO-OP → custom modal)
  // {title, message, confirmText?, cancelText?, danger?, onConfirm?} — confirmText မပါရင် info mode (OK သက်သက်)
  const [confirm, setConfirm] = useState(null);
  const showInfo = (title, message) => setConfirm({ title, message, info: true });

  // Teacher bio — Firestore settings/teacherBio (staff ပြင်/ဖြည့်, အားလုံးကြည့်)
  const DEFAULT_BIO = {
    name: 'ဦးစိုးမြင့်ဆွေ (U Soe Myint Swe)',
    degrees: 'B.Sc (Physics), Dip. in Education, MKS Edu Services Founder',
    expertise: 'Japanese Language (JLPT N3/N4/N5), Python Automation, Educational Management',
    experience: '၂၅ နှစ်ကျော် အစိုးရနှင့် ပညာရေးဝန်ဆောင်မှု လုပ်ငန်းအတွေ့အကြုံရှိသူ။',
    contact: 'soemyintswe@gmail.com | Yangon, Myanmar',
  };
  const [bio, setBio] = useState(DEFAULT_BIO);
  const [bioModal, setBioModal] = useState(false);
  const [bioForm, setBioForm] = useState(DEFAULT_BIO);
  const canEditBio = isAdmin || currentUser?.role === 'teacher';

  useEffect(() => {
    (async () => {
      try {
        const snap = await getDoc(doc(db, 'settings', 'teacherBio'));
        if (snap.exists()) setBio({ ...DEFAULT_BIO, ...snap.data() });
      } catch (e) {
        console.log('Load bio:', e.message);
      }
    })();
  }, []);

  const openBioEdit = () => {
    setBioForm({ ...bio });
    setBioModal(true);
  };

  const saveBio = async () => {
    if (!canEditBio) return;
    try {
      const data = {
        name: (bioForm.name || '').trim() || DEFAULT_BIO.name,
        degrees: (bioForm.degrees || '').trim(),
        expertise: (bioForm.expertise || '').trim(),
        experience: (bioForm.experience || '').trim(),
        contact: (bioForm.contact || '').trim(),
        updatedAt: new Date().toISOString(),
        updatedBy: currentUser?.email || '',
      };
      await setDoc(doc(db, 'settings', 'teacherBio'), data, { merge: true });
      setBio({ ...DEFAULT_BIO, ...data });
      setBioModal(false);
      showInfo(t.ok, t.bioSaved);
    } catch (e) {
      showInfo(t.err, firestoreErrorMsg(e, t.bioModalTitle));
    }
  };

  // Firestore မှ Users စာရင်းများကို ဆွဲထုတ်ခြင်း
  const fetchUsersFromFirestore = async (silent) => {
    if (!isAdmin) return;
    try {
      if (!silent) setLoading(true);

      // db မှန်ကန်မှုရှိမရှိ စစ်ဆေးခြင်း
      if (!db) {
        throw new Error('Firestore (db) is not initialized properly.');
      }

      const querySnapshot = await getDocs(collection(db, 'users'));
      const users = [];
      querySnapshot.forEach((document) => {
        users.push({ id: document.id, ...document.data() });
      });

      // ကိုယ့် Admin email နဲ့ PENDING ဖြစ်ကျန်နေတဲ့ doc ရှိရင် ACTIVE အဖြစ် auto-ပြင်မယ်
      // (အရင် version မှာ PENDING နဲ့ ကျန်ခဲ့လို့ ကိုယ့်အကောင့်မှာ PENDING ပြနေတာ)
      const adminDocs = users.filter(
        (u) => (u.email || '').toLowerCase() === ADMIN_EMAIL.toLowerCase() && u.status !== 'active'
      );
      for (const ad of adminDocs) {
        try {
          await updateDoc(doc(db, 'users', ad.id), { status: 'active', role: ad.role || 'teacher' });
          ad.status = 'active';
          ad.role = ad.role || 'teacher';
        } catch (e) {
          console.log('Auto-activate admin failed:', e.message);
        }
      }

      setUsersList(users);
    } catch (error) {
      console.error('Error fetching users: ', error);
      if (!silent) showInfo(t.err, t.errFetch + error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchUsersFromFirestore();
    } else {
      setLoading(false);
    }
  }, [isAdmin]);

  const onRefresh = () => {
    setRefreshing(true);
    if (isAdmin) {
      fetchUsersFromFirestore();
    } else {
      setRefreshing(false);
    }
  };

  // User အသစ် + ကနဦး password — secondary app နဲ့ Auth ဖန်တီး (admin session မထိခိုက်စေဘူး)
  // Password ကို Firestore မှာ လုံးဝ မသိမ်း — temp pw ကို admin က user ထံ တိုက်ရိုက်ပို့မယ်
  const handleCreateUser = async () => {
    if (!isAdmin) return;
    const emailLower = newEmail.trim().toLowerCase();
    if (!newName.trim() || !emailLower || !emailLower.includes('@')) {
      showInfo(t.err, t.errCreateFill);
      return;
    }
    if (!newTempPw.trim() || newTempPw.trim().length < 6) {
      showInfo(t.err, t.errPwShort);
      return;
    }

    let secApp = null;
    try {
      setLoading(true);

      if (!db) {
        throw new Error('Firestore (db) is not initialized properly.');
      }

      // 1) Firebase Auth account ဖန်တီး (secondary app — admin login မပျက်)
      secApp = initializeApp(firebaseConfig, 'admin-sec-' + Date.now());
      const secAuth = getAuth(secApp);
      const cred = await createUserWithEmailAndPassword(secAuth, emailLower, newTempPw.trim());
      const uid = cred.user.uid;
      try { await signOut(secAuth); } catch (e) {}
      try { await deleteApp(secApp); secApp = null; } catch (e) {}

      // 2) Firestore profile (active + force-change flag)
      await setDoc(doc(db, 'users', uid), {
        uid,
        name: newName.trim(),
        email: emailLower,
        phone: newPhone.trim(),
        role: newRole,
        status: 'active',
        mustChangePassword: true,
        tempIssuedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        createdBy: currentUser?.email || '',
      });

      // 3) ပို့ရန် credentials card
      setCreds({
        name: newName.trim(), email: emailLower, phone: newPhone.trim(),
        tempPw: newTempPw.trim(), resetLinkSent: false,
      });
      setNewName('');
      setNewEmail('');
      setNewPhone('');
      setNewTempPw('');
      setNewRole('student');
      setModalVisible(false);
      fetchUsersFromFirestore(true);
    } catch (error) {
      console.error('Create User Error:', error.code, error.message);
      if (secApp) {
        try { await deleteApp(secApp); } catch (e) {}
      }
      if (error.code === 'auth/email-already-in-use') {
        showInfo(t.err, t.errExists);
      } else if (error.code === 'auth/invalid-email') {
        showInfo(t.err, t.errEmailInvalid);
      } else if (error.code === 'auth/weak-password') {
        showInfo(t.err, t.errPwShort);
      } else if (error.code === 'auth/operation-not-allowed') {
        showInfo(t.err, t.errOpNotAllowed);
      } else {
        showInfo(t.err, error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  // Admin password reset — client SDK နဲ့ သူများ password တိုက်ရိုက် SET မရ
  // → Firebase reset email + mustChange flag. Auth မရှိတဲ့ placeholder ဆို Auth အသစ် ဖန်တီးပေး.
  const handleAdminReset = (usr) => {
    if (!isAdmin || !usr) return;
    setConfirm({
      title: t.resetTitle,
      message: `"${usr.name || usr.email || ''}" — ${t.resetConfirm}`,
      confirmText: t.resetGo,
      cancelText: t.noDo,
      onConfirm: async () => {
        setBusyId(usr.id);
        try {
          await sendPasswordResetEmail(auth, usr.email);
          await updateDoc(doc(db, 'users', usr.id), {
            mustChangePassword: true,
            lastActionBy: currentUser?.email || '',
            lastActionAt: new Date().toISOString(),
          });
          setCreds({
            name: usr.name || '', email: usr.email || '', phone: usr.phone || '',
            tempPw: '', resetLinkSent: true,
          });
          fetchUsersFromFirestore(true);
        } catch (error) {
          if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-email') {
            // Auth မရှိသေးတဲ့ placeholder → Auth အသစ် + migrate
            setConfirm({
              title: t.resetTitle,
              message: `"${usr.name || usr.email || ''}" — ${t.resetNoAuth}`,
              confirmText: t.resetCreateGo,
              cancelText: t.noDo,
              onConfirm: async () => { await convertPlaceholder(usr); },
            });
          } else {
            setConfirm({ title: t.err, message: String(error.message || error), info: true });
          }
        } finally {
          setBusyId(null);
        }
      },
    });
  };

  // Placeholder (Auth မရှိ) → temp password နဲ့ Auth ဖန်တီး + profile migrate + credentials
  const convertPlaceholder = async (usr) => {
    const tempPw = await genTempPassword();
    let secApp = null;
    setBusyId(usr.id);
    try {
      secApp = initializeApp(firebaseConfig, 'admin-sec-' + Date.now());
      const secAuth = getAuth(secApp);
      const cred = await createUserWithEmailAndPassword(secAuth, (usr.email || '').trim().toLowerCase(), tempPw);
      const uid = cred.user.uid;
      try { await signOut(secAuth); } catch (e) {}
      try { await deleteApp(secApp); secApp = null; } catch (e) {}

      const oldSnap = await getDoc(doc(db, 'users', usr.id));
      const old = oldSnap.exists() ? oldSnap.data() : {};
      await setDoc(doc(db, 'users', uid), {
        uid,
        name: old.name || usr.name || '',
        email: (usr.email || '').trim().toLowerCase(),
        phone: old.phone || '',
        role: (old.role || 'student').toLowerCase(),
        status: 'active',
        mustChangePassword: true,
        tempIssuedAt: new Date().toISOString(),
        createdAt: old.createdAt || new Date().toISOString(),
        migratedFrom: usr.id,
        createdBy: currentUser?.email || '',
      });
      try { await deleteDoc(doc(db, 'users', usr.id)); } catch (e) {}
      setCreds({
        name: old.name || usr.name || '', email: (usr.email || '').trim().toLowerCase(),
        phone: old.phone || '', tempPw, resetLinkSent: false,
      });
      fetchUsersFromFirestore(true);
    } catch (error) {
      if (secApp) {
        try { await deleteApp(secApp); } catch (e) {}
      }
      if (error.code === 'auth/email-already-in-use') {
        setConfirm({ title: t.err, message: t.errExists, info: true });
      } else {
        setConfirm({ title: t.err, message: String(error.message || error), info: true });
      }
    } finally {
      setBusyId(null);
    }
  };

  // Role ရွေးချယ်မှု Modal အတွက် state — လှည့်ပြောင်းခလုတ် (cycle) အစား
  // ရွေးချယ်စရာအကုန် မြင်ရတဲ့ dropdown ပုံစံ (Modal) သုံးမယ်:
  // မှားနှိပ်မိလို့ Role လွှဲသွားတဲ့ ပြဿနာ မရှိတော့ဘူး။
  const [roleModalVisible, setRoleModalVisible] = useState(false);
  const [roleTarget, setRoleTarget] = useState(null); // {id, name, email, role}
  const [rolePick, setRolePick] = useState('student');

  const ROLE_INFO = {
    student: { emoji: '🎓', label: t.rStudent, desc: t.rStudentD },
    teacher: { emoji: '👨‍🏫', label: t.rTeacher, desc: t.rTeacherD },
    admin: { emoji: '🛡️', label: t.rAdmin, desc: t.rAdminD },
  };

  // 🔄 နှိပ်ရင် Modal ဖွင့်မယ် (လှည့်မပြောင်းတော့ဘူး)
  const handleChangeRole = (userId, currentRole, userName) => {
    if (!isAdmin) return;
    setRoleTarget({ id: userId, name: userName, role: (currentRole || 'student').toLowerCase() });
    setRolePick((currentRole || 'student').toLowerCase());
    setRoleModalVisible(true);
  };

  // Modal ထဲက Role ကို တကယ် သိမ်းမယ်
  const handleSaveRole = async () => {
    if (!roleTarget) return;
    if (rolePick === roleTarget.role) {
      setRoleModalVisible(false);
      return; // မပြောင်းဘူး — အပို write မလုပ်ဘူး
    }
    setBusyId(roleTarget.id);
    try {
      await updateDoc(doc(db, 'users', roleTarget.id), {
        role: rolePick,
        lastActionBy: currentUser?.email || '',
        lastActionAt: new Date().toISOString(),
      });
      showInfo(t.ok, '"' + (roleTarget.name || t.userWord) + '" ' + t.roleTo + ' ' + ROLE_INFO[rolePick].label);
      setRoleModalVisible(false);
      setRoleTarget(null);
      fetchUsersFromFirestore(true);
    } catch (error) {
      showInfo(t.err, firestoreErrorMsg(error, t.roleQ));
    } finally {
      setBusyId(null);
    }
  };

  // User ၏ အသုံးပြုခွင့် Status ကို ပြောင်းလဲခြင်း (in-app confirm modal)
  const handleToggleStatus = (userId, currentStatus, userName) => {
    if (!isAdmin) return;
    const newStatus = currentStatus === 'active' ? 'disabled' : 'active';
    const statusText = newStatus === 'active' ? t.statusActive : t.statusDisabled;

    setConfirm({
      title: t.statusQ,
      message: '"' + (userName || t.userWord) + '" — ' + statusText,
      confirmText: t.statusConfirm,
      cancelText: t.noDo,
      danger: newStatus !== 'active',
      onConfirm: async () => {
        setBusyId(userId);
        try {
          await updateDoc(doc(db, 'users', userId), {
            status: newStatus,
            lastActionBy: currentUser?.email || '',
            lastActionAt: new Date().toISOString(),
          });
          setConfirm({ title: t.ok, message: statusText, info: true });
          fetchUsersFromFirestore(true);
        } catch (error) {
          setConfirm({ title: t.err, message: firestoreErrorMsg(error, t.statusQ), info: true });
        } finally {
          setBusyId(null);
        }
      },
    });
  };

  // User အကောင့်ကို ဖျက်ခြင်း (in-app confirm modal)
  const [bannedList, setBannedList] = useState([]);
  const [showBanned, setShowBanned] = useState(false);
  const [exporting, setExporting] = useState(false);

  // 📥 Admin one-click full backup (DR) — users/chats(last100 msgs, no voice)/materials/settings/banned.
  // Photos (base64) + voice clips omitted for size (note in file).
  const handleBackupAll = async () => {
    if (!isAdmin || exporting) return;
    setExporting(true);
    try {
      const noBig = (o) => {
        const c = { ...o };
        if (typeof c.photoURL === 'string' && c.photoURL.startsWith('data:')) c.photoURL = '(base64-avatar-omitted)';
        return c;
      };
      const us = await getDocs(collection(db, 'users'));
      const users = [];
      us.forEach((d) => users.push(noBig({ id: d.id, ...d.data() })));
      const cs = await getDocs(collection(db, 'chats'));
      const chats = [];
      for (const c of cs.docs) {
        const cd = { id: c.id, ...c.data() };
        try {
          const ms = await getDocs(query(collection(db, 'chats', c.id, 'messages'), orderBy('at', 'desc'), limit(100)));
          const arr = [];
          ms.forEach((m) => arr.push({ id: m.id, ...m.data() }));
          cd.messages = arr.reverse();
        } catch (e) {
          cd.messages = [];
        }
        chats.push(cd);
      }
      const ms2 = await getDocs(collection(db, 'materials'));
      const materials = [];
      ms2.forEach((d) => materials.push({ id: d.id, ...d.data() }));
      let teacherBio = null;
      try {
        const bs = await getDoc(doc(db, 'settings', 'teacherBio'));
        if (bs.exists()) teacherBio = bs.data();
      } catch (e) {}
      const bn = await getDocs(collection(db, 'banned'));
      const banned = [];
      bn.forEach((d) => banned.push({ id: d.id, ...d.data() }));
      const payload = JSON.stringify({
        app: 'JapaneseStudyPlanner-backup', version: 1,
        exportedAt: new Date().toISOString(), exportedBy: currentUser?.email || '',
        note: 'photos(base64) and voice clips omitted for size',
        counts: { users: users.length, chats: chats.length, materials: materials.length, banned: banned.length },
        users, chats, materials, settings: { teacherBio }, banned,
      }, null, 2);
      const fileName = `mks-backup-${new Date().toISOString().slice(0, 10)}.json`;
      if (Platform.OS === 'web' && typeof document !== 'undefined') {
        const blob = new Blob([payload], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 5000);
      } else {
        const FS = require('expo-file-system');
        const file = new FS.File(FS.Paths.cache, fileName);
        const writable = file.writableStream();
        const writer = writable.getWriter();
        await writer.write(new TextEncoder().encode(payload));
        await writer.close();
        if (await ExpoSharing.isAvailableAsync()) {
          await ExpoSharing.shareAsync(file.uri, { mimeType: 'application/json', dialogTitle: 'Backup' });
        } else {
          throw new Error('share-unavailable');
        }
      }
      showInfo(t.ok, `${t.backupDone || ''} (${users.length}/${chats.length}/${materials.length})`);
    } catch (e) {
      showInfo(t.err, String(e.message || e));
    } finally {
      setExporting(false);
    }
  };

  const fetchBanned = async () => {
    if (!isAdmin) return;
    try {
      const snap = await getDocs(collection(db, 'banned'));
      const arr = [];
      snap.forEach((d) => arr.push({ id: d.id, ...d.data() }));
      setBannedList(arr);
    } catch (e) {}
  };

  useEffect(() => {
    if (isAdmin) fetchBanned();
  }, [isAdmin]);

  const handleUnban = (b) => {
    setConfirm({
      title: t.unbanQ || t.delQ,
      message: `"${b.name || b.email || ''}" — ${t.unbanMsg || ''}`,
      confirmText: t.unbanGo || t.yesDel,
      cancelText: t.noDel,
      onConfirm: async () => {
        try {
          await deleteDoc(doc(db, 'banned', b.id));
          setConfirm({ title: t.ok, message: t.unbannedOk || '', info: true });
          fetchBanned();
        } catch (error) {
          setConfirm({ title: t.err, message: firestoreErrorMsg(error, t.delQ), info: true });
        }
      },
    });
  };

  const handleDeleteUser = (userId, userName) => {
    if (!isAdmin) return;
    setConfirm({
      title: t.delQ,
      message: '"' + (userName || t.userWord) + '" ' + t.delConfirm,
      confirmText: t.yesDel,
      cancelText: t.noDel,
      danger: true,
      onConfirm: async () => {
        setBusyId(userId);
        try {
          // profile doc + ban record (Auth account cannot be deleted client-side —
          // ban blocks re-login AND re-register with same email)
          const target = usersList.find((u) => u.id === userId) || {};
          await deleteDoc(doc(db, 'users', userId));
          try {
            await setDoc(doc(db, 'banned', userId), {
              uid: userId,
              name: target.name || userName || '',
              email: (target.email || '').toLowerCase(),
              at: new Date().toISOString(),
              by: currentUser?.email || '',
            });
          } catch (e) {}
          setConfirm({ title: t.ok, message: t.deleted, info: true });
          fetchUsersFromFirestore(true);
          fetchBanned();
        } catch (error) {
          setConfirm({ title: t.err, message: firestoreErrorMsg(error, t.delQ), info: true });
        } finally {
          setBusyId(null);
        }
      },
    });
  };

  const onShareApp = async () => {
    try {
      await Share.share({
        message: 'Japanese Study Planner အက်ပ်ကို အသုံးပြု၍ ဂျပန်စာလေ့လာမှုကို စနစ်တကျ စီမံကြပါစို့! Download link: https://mksedudoc.web.app',
      });
    } catch (error) {
      showInfo('Error', error.message);
    }
  };

  // Firebase Auth အစစ်ဖြင့် Password ပြောင်းခြင်း
  const handleChangePassword = async () => {
    if (!newPass.trim() || newPass.trim().length < 6) {
      showInfo(t.err, t.pwShort);
      return;
    }
    try {
      if (!auth.currentUser) {
        showInfo(t.err, t.pwLoginFirst);
        return;
      }
      await updatePassword(auth.currentUser, newPass.trim());
      showInfo(t.ok, t.pwDone);
      setOldPassword('');
      setNewPass('');
    } catch (e) {
      console.error('Change password error', e.message);
      showInfo(
        t.pwFail,
        e.code === 'auth/requires-recent-login'
          ? t.pwRecent
          : e.message
      );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <AppHeader title={isAdmin ? t.headerAdmin : t.headerUser} user={currentUser} onLogout={onLogout} onProfilePress={goProfile} />

      <ScrollView 
        contentContainerStyle={styles.scrollContainer}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {isAdmin ? (
          <View style={styles.adminCard}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <Text style={[styles.cardTitle, { color: '#D32F2F', flex: 1 }]}>{t.adminTitle}</Text>

              <TouchableOpacity style={[styles.addUserBtnHeader, { backgroundColor: '#455A64', marginRight: 6 }]} onPress={handleBackupAll} disabled={exporting}>
                <Text style={styles.addUserBtnText}>{exporting ? '…' : `📥 ${t.backupBtn || 'Backup'}`}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.addUserBtnHeader} onPress={() => setModalVisible(true)}>
                <Text style={{ fontSize: 14, color: '#FFF', marginRight: 4 }}>👤➕</Text>
                <Text style={styles.addUserBtnText}>{t.addUser}</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.subText}>{t.sub}</Text>
            <Text style={[styles.subText, { marginTop: -8, backgroundColor: '#FFF', padding: 8, borderRadius: 6 }]}>
              {t.legend}
            </Text>

            {/* ဇယားခေါင်းစဉ်တန်း — နှိပ်ရင် sort (▲▼) */}
            <View style={styles.tableHeaderRow}>
              {[
                { k: 'name', label: t.thName, flex: 2, align: 'left' },
                { k: 'role', label: t.thRole, flex: 1, align: 'center' },
                { k: 'status', label: t.thStatus, flex: 1, align: 'center' },
                { k: 'by', label: t.thBy, flex: 1, align: 'center', noSort: true },
                { k: 'created', label: t.thCreated, flex: 1.1, align: 'center' },
              ].map((h) => (
                <TouchableOpacity
                  key={h.k}
                  style={{ flex: h.flex, alignItems: h.align === 'center' ? 'center' : 'flex-start' }}
                  disabled={h.noSort}
                  onPress={() => {
                    if (h.noSort) return;
                    if (sortKey !== h.k) {
                      setSortKey(h.k);
                      setSortDir('asc');
                    } else {
                      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
                    }
                  }}
                >
                  <Text style={[styles.thText, h.align === 'right' && { textAlign: 'right' }]}>
                    {h.label}{!h.noSort && sortKey === h.k ? (sortDir === 'asc' ? ' ▲' : ' ▼') : ''}
                  </Text>
                </TouchableOpacity>
              ))}
              <Text style={[styles.thText, { flex: 1.2, textAlign: 'right' }]}>{t.thActions}</Text>
            </View>

            {loading && usersList.length === 0 ? (
              <ActivityIndicator size="small" color="#D32F2F" style={{ marginVertical: 20 }} />
            ) : usersList.length === 0 ? (
              <View style={styles.emptyTableContainer}>
                <Text style={styles.noDataText}>{t.empty}</Text>
              </View>
            ) : (
              sortedUsers.map((usr) => {
                const status = (usr.status || 'pending').toLowerCase();
                const role = (usr.role || 'student').toLowerCase();
                const isMe = (usr.email || '').toLowerCase() === (currentUser?.email || '').toLowerCase();
                const busy = busyId === usr.id;

                return (
                  <View key={usr.id} style={[styles.tableRowItem, isMe && { backgroundColor: '#FFF8E1', borderRadius: 6 }]}>
                    <View style={{ flex: 2, marginRight: 4 }}>
                      <Text style={styles.studentName}>
                        {usr.name || usr.username || 'No Name'}{isMe ? t.me : ''}{usr.mustChangePassword ? ' 🔑' : ''}
                      </Text>
                      <Text style={styles.studentDate}>{usr.email || 'N/A'}</Text>
                    </View>

                    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                      <Text style={[styles.badge, role === 'admin' ? styles.bgAdmin : role === 'teacher' ? styles.bgTeacher : styles.bgStudent]}>
                        {role.toUpperCase()}
                      </Text>
                    </View>

                    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                      <Text style={[styles.badge, status === 'active' ? styles.bgActive : styles.bgPending]}>
                        {status.toUpperCase()}
                      </Text>
                    </View>

                    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                      <Text style={styles.byText} numberOfLines={1}>
                        {(usr.lastActionBy || usr.createdBy) ? String(usr.lastActionBy || usr.createdBy).split('@')[0] : '—'}
                      </Text>
                    </View>

                    <View style={{ flex: 1.1, alignItems: 'center', justifyContent: 'center' }}>
                      <Text style={styles.byText} numberOfLines={1}>{shortDate(usr.createdAt)}</Text>
                    </View>

                    <View style={styles.actionColumn}>
                      <ActionBtn
                        emoji={status === 'active' ? '🔒' : '✅'}
                        bg={status === 'active' ? '#E53935' : '#2E7D32'}
                        tip={status === 'active' ? t.tipToggleActive : t.tipTogglePending}
                        disabled={busy}
                        onPress={() => handleToggleStatus(usr.id, status, usr.name || usr.username)}
                      />

                      <ActionBtn
                        emoji="🔄"
                        bg="#1976D2"
                        tip={t.tipRole + ' — ' + role.toUpperCase()}
                        disabled={busy}
                        onPress={() => handleChangeRole(usr.id, role, usr.name || usr.username)}
                      />

                      <ActionBtn
                        emoji="🔑"
                        bg="#6A1B9A"
                        tip={t.tipReset}
                        disabled={busy}
                        onPress={() => handleAdminReset(usr)}
                      />

                      <ActionBtn
                        emoji="🗑️"
                        bg="#D32F2F"
                        tip={t.tipDelete}
                        disabled={busy}
                        onPress={() => handleDeleteUser(usr.id, usr.name || usr.username)}
                      />
                    </View>
                  </View>
                );
              })
            )}

            {/* ⛔ Banned list + Unban */}
            <TouchableOpacity
              style={{ flexDirection: 'row', alignItems: 'center', marginTop: 12 }}
              onPress={() => setShowBanned(!showBanned)}
            >
              <Text style={[styles.cardTitle, { color: '#333', marginBottom: 0 }]}>
                {showBanned ? '▼' : '▶'} {t.bannedTitle} ({bannedList.length})
              </Text>
            </TouchableOpacity>
            {showBanned && (
              bannedList.length === 0 ? (
                <Text style={styles.noDataText}>{t.bannedEmpty}</Text>
              ) : (
                bannedList.map((b) => (
                  <View key={b.id} style={[styles.tableRowItem, { backgroundColor: '#F5F5F5', borderRadius: 6, paddingHorizontal: 6 }]}>
                    <View style={{ flex: 2, marginRight: 4 }}>
                      <Text style={styles.studentName}>{b.name || 'No Name'}</Text>
                      <Text style={styles.studentDate}>{b.email || 'N/A'}{b.by ? ` · by ${String(b.by).split('@')[0]}` : ''}</Text>
                    </View>
                    <TouchableOpacity
                      style={[styles.addUserBtnHeader, { backgroundColor: '#2E7D32' }]}
                      onPress={() => handleUnban(b)}
                    >
                      <Text style={styles.addUserBtnText}>{t.unbanGo}</Text>
                    </TouchableOpacity>
                  </View>
                ))
              )
            )}
          </View>
        ) : (
          <View style={styles.card}>
            <View style={styles.cardHeaderRow}>
              <Text style={{ fontSize: 22 }}>ℹ️</Text>
              <Text style={styles.cardTitle}>{t.nonAdminTitle}</Text>
            </View>
            <Text style={styles.bioText}>{t.nonAdminBody}</Text>
          </View>
        )}

        {/* ဆရာ့ ကိုယ်ရေးအကျဉ်း — Firestore settings/teacherBio (ဆရာ/Admin ပြင်/ဖြည့်, အားလုံးကြည့်) */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Text style={{ fontSize: 22 }}>🎖️</Text>
            <Text style={[styles.cardTitle, { flex: 1 }]}>{t.bioTitle}</Text>
            {canEditBio && (
              <TouchableOpacity style={styles.bioEditBtn} onPress={openBioEdit}>
                <Text style={styles.bioEditText}>{t.bioEdit}</Text>
              </TouchableOpacity>
            )}
          </View>
          <Text style={styles.bioName}>{bio.name}</Text>
          {!!bio.degrees && (
            <Text style={styles.bioText}><Text style={styles.bold}>{t.bioDegrees}</Text> {bio.degrees}</Text>
          )}
          {!!bio.expertise && (
            <Text style={styles.bioText}><Text style={styles.bold}>{t.bioExpertise}</Text> {bio.expertise}</Text>
          )}
          {!!bio.experience && (
            <Text style={styles.bioText}><Text style={styles.bold}>{t.bioExp}</Text> {bio.experience}</Text>
          )}
          {!!bio.contact && (
            <Text style={styles.bioText}><Text style={styles.bold}>{t.bioContact}</Text> {bio.contact}</Text>
          )}
        </View>

        {/* App မျှဝေရန် Banner */}
        <TouchableOpacity style={styles.shareBanner} onPress={onShareApp}>
          <Text style={{ fontSize: 24, color: '#FFF' }}>📤</Text>
          <View style={{ marginLeft: 12, flex: 1 }}>
            <Text style={styles.shareBannerTitle}>{t.shareTitle}</Text>
            <Text style={styles.shareBannerSub}>{t.shareSub}</Text>
          </View>
        </TouchableOpacity>

        {/* Password ပြောင်းလဲခြင်း ကဏ္ဍ */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t.pwTitle}</Text>

          <Text style={styles.label}>{t.oldPw}</Text>
          <View style={styles.passwordContainer}>
            <TextInput 
              style={styles.passwordInput} 
              placeholder="Old Password" 
              placeholderTextColor="#999"
              value={oldPassword} 
              onChangeText={setOldPassword} 
              secureTextEntry={!showOldPass} 
            />
            <TouchableOpacity onPress={() => setShowOldPass(!showOldPass)} style={styles.eyeIcon}>
              <Text style={{ fontSize: 20 }}>{showOldPass ? '🙈' : '👁️'}</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.label}>{t.newPw}</Text>
          <View style={styles.passwordContainer}>
            <TextInput 
              style={styles.passwordInput} 
              placeholder="New Password" 
              placeholderTextColor="#999"
              value={newPass} 
              onChangeText={setNewPass} 
              secureTextEntry={!showNewPass} 
            />
            <TouchableOpacity onPress={() => setShowNewPass(!showNewPass)} style={styles.eyeIcon}>
              <Text style={{ fontSize: 20 }}>{showNewPass ? '🙈' : '👁️'}</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.changePassBtn} onPress={handleChangePassword}>
            <Text style={styles.changePassBtnText}>{t.changeBtn}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* User အသစ်ဖန်တီးသည့် Modal Form */}
      {isAdmin && (
        <Modal visible={modalVisible} animationType="slide" transparent={true}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>{t.createTitle}</Text>

              <Text style={styles.label}>{t.nameLabel}</Text>
              <TextInput style={styles.modalInput} placeholder="Mg Mg" placeholderTextColor="#999" value={newName} onChangeText={setNewName} />

              <Text style={styles.label}>{t.emailLabel}</Text>
              <TextInput style={styles.modalInput} placeholder="user@gmail.com" placeholderTextColor="#999" value={newEmail} onChangeText={setNewEmail} autoCapitalize="none" keyboardType="email-address" />

              <Text style={styles.label}>{t.phoneLabel}</Text>
              <TextInput style={styles.modalInput} placeholder="09xxxxxxxxx" placeholderTextColor="#999" value={newPhone} onChangeText={setNewPhone} keyboardType="phone-pad" />

              <Text style={styles.label}>{t.tempPwLabel}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <TextInput
                  style={[styles.modalInput, { flex: 1, marginBottom: 0 }]}
                  placeholder="MKS-XXXXXXXX" placeholderTextColor="#999"
                  value={newTempPw} onChangeText={setNewTempPw}
                  secureTextEntry={!showTempPw} autoCapitalize="none"
                />
                <TouchableOpacity
                  style={[styles.saveModalBtn, { marginLeft: 8, backgroundColor: '#6A1B9A' }]}
                  onPress={async () => setNewTempPw(await genTempPassword())}
                >
                  <Text style={{ color: '#FFF', fontWeight: 'bold' }}>🎲</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setShowTempPw(!showTempPw)} style={{ padding: 8 }}>
                  <Text style={{ fontSize: 18 }}>{showTempPw ? '🙈' : '👁️'}</Text>
                </TouchableOpacity>
              </View>

              <Text style={{ fontSize: 11, color: '#666', marginTop: 6 }}>
                {t.createNote}
              </Text>

              <Text style={styles.label}>{t.roleLabel}</Text>
              <View style={styles.roleSelectRow}>
                {['student', 'teacher', 'admin'].map((r) => (
                  <TouchableOpacity 
                    key={r} 
                    style={[styles.roleOptionBtn, newRole === r && styles.roleOptionActive]}
                    onPress={() => setNewRole(r)}
                  >
                    <Text style={[styles.roleOptionText, newRole === r && { color: '#FFF' }]}>{r.toUpperCase()}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.modalBtnRow}>
                <TouchableOpacity style={styles.cancelModalBtn} onPress={() => setModalVisible(false)}>
                  <Text style={{ color: '#555', fontWeight: 'bold', fontFamily: Platform.OS === 'ios' ? 'Myanmar Sangam MN' : 'sans-serif' }}>{t.cancel}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.saveModalBtn} onPress={handleCreateUser}>
                  <Text style={{ color: '#FFF', fontWeight: 'bold', fontFamily: Platform.OS === 'ios' ? 'Myanmar Sangam MN' : 'sans-serif' }}>{t.create}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}

      {/* Role ရွေးချယ်မှု Modal (dropdown အစား — Web/ဖုန်း နှစ်ခုလုံး ရတယ်) */}
      {isAdmin && (
        <Modal visible={roleModalVisible} animationType="slide" transparent={true}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>{t.roleModalTitle}</Text>
              <Text style={{ fontSize: 12, color: '#666', textAlign: 'center', marginBottom: 12 }}>
                "{roleTarget?.name || t.userWord}" ({roleTarget?.email || ''}){'\n'}{t.roleFor} {(roleTarget?.role || '').toUpperCase()}
              </Text>

              {['student', 'teacher', 'admin'].map((r) => {
                const info = ROLE_INFO[r];
                const selected = rolePick === r;
                const isCurrent = roleTarget?.role === r;
                return (
                  <TouchableOpacity
                    key={r}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      borderWidth: 2,
                      borderColor: selected ? '#1976D2' : '#DDD',
                      backgroundColor: selected ? '#E3F2FD' : '#FAFAFA',
                      borderRadius: 10,
                      padding: 12,
                      marginBottom: 8,
                    }}
                    onPress={() => setRolePick(r)}
                  >
                    <Text style={{ fontSize: 26, marginRight: 10 }}>{info.emoji}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 14, fontWeight: 'bold', color: selected ? '#1976D2' : '#333' }}>
                        {info.label}{isCurrent ? ' ' + t.current : ''}
                      </Text>
                      <Text style={{ fontSize: 11, color: '#666', marginTop: 2 }}>{info.desc}</Text>
                    </View>
                    <Text style={{ fontSize: 20 }}>{selected ? '✅' : '⬜'}</Text>
                  </TouchableOpacity>
                );
              })}

              <View style={styles.modalBtnRow}>
                <TouchableOpacity style={styles.cancelModalBtn} onPress={() => { setRoleModalVisible(false); setRoleTarget(null); }}>
                  <Text style={{ color: '#555', fontWeight: 'bold', fontFamily: Platform.OS === 'ios' ? 'Myanmar Sangam MN' : 'sans-serif' }}>{t.cancel}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.saveModalBtn} onPress={handleSaveRole}>
                  <Text style={{ color: '#FFF', fontWeight: 'bold', fontFamily: Platform.OS === 'ios' ? 'Myanmar Sangam MN' : 'sans-serif' }}>{t.saveRole}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}

      {/* Bio edit modal (ဆရာ/Admin) */}
      {canEditBio && (
        <Modal visible={bioModal} animationType="slide" transparent={true}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>{t.bioModalTitle}</Text>

              <Text style={styles.label}>{t.bioFName}</Text>
              <TextInput style={styles.modalInput} value={bioForm.name} onChangeText={(v) => setBioForm({ ...bioForm, name: v })} placeholderTextColor="#999" />

              <Text style={styles.label}>{t.bioFDeg}</Text>
              <TextInput style={styles.modalInput} value={bioForm.degrees} onChangeText={(v) => setBioForm({ ...bioForm, degrees: v })} placeholderTextColor="#999" />

              <Text style={styles.label}>{t.bioFExpertise}</Text>
              <TextInput style={[styles.modalInput, { height: 60, textAlignVertical: 'top' }]} value={bioForm.expertise} onChangeText={(v) => setBioForm({ ...bioForm, expertise: v })} placeholderTextColor="#999" multiline={true} />

              <Text style={styles.label}>{t.bioFExp}</Text>
              <TextInput style={[styles.modalInput, { height: 60, textAlignVertical: 'top' }]} value={bioForm.experience} onChangeText={(v) => setBioForm({ ...bioForm, experience: v })} placeholderTextColor="#999" multiline={true} />

              <Text style={styles.label}>{t.bioFContact}</Text>
              <TextInput style={styles.modalInput} value={bioForm.contact} onChangeText={(v) => setBioForm({ ...bioForm, contact: v })} placeholderTextColor="#999" />

              <View style={styles.modalBtnRow}>
                <TouchableOpacity style={styles.cancelModalBtn} onPress={() => setBioModal(false)}>
                  <Text style={{ color: '#555', fontWeight: 'bold', fontFamily: Platform.OS === 'ios' ? 'Myanmar Sangam MN' : 'sans-serif' }}>{t.cancel}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.saveModalBtn} onPress={saveBio}>
                  <Text style={{ color: '#FFF', fontWeight: 'bold', fontFamily: Platform.OS === 'ios' ? 'Myanmar Sangam MN' : 'sans-serif' }}>{t.saveRole}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}

      {/* Confirm / info dialog (Alert.alert အစား) */}
      <ConfirmModal
        visible={!!confirm}
        title={confirm?.title}
        message={confirm?.message}
        confirmText={confirm?.info ? null : confirm?.confirmText}
        cancelText={confirm?.info ? t.okBtn : confirm?.cancelText}
        danger={!!confirm?.danger}
        busy={!!busyId}
        onConfirm={async () => { if (confirm?.onConfirm) await confirm.onConfirm(); }}
        onCancel={() => { if (!busyId) setConfirm(null); }}
      />

      {/* 📨 Login credentials delivery card (copy / Email app / SMS) */}
      <Modal visible={!!creds} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{t.credTitle}</Text>
            {!!creds && (
              <>
                <View style={styles.credBox}>
                  <Text style={styles.credLine}>👤 {creds.name}</Text>
                  <Text style={styles.credLine}>🔗 {APP_LOGIN_URL}</Text>
                  <Text style={styles.credLine}>📧 {creds.email}</Text>
                  {!!creds.tempPw && (
                    <Text style={[styles.credLine, styles.credPw]}>🔑 {creds.tempPw}</Text>
                  )}
                  {!!creds.resetLinkSent && (
                    <Text style={styles.credNote}>{t.credResetNote}</Text>
                  )}
                </View>
                <Text style={styles.credHint}>{t.credHint}</Text>
                <View style={{ flexDirection: 'row', marginTop: 10 }}>
                  <TouchableOpacity style={[styles.saveModalBtn, { flex: 1, backgroundColor: '#455A64' }]} onPress={copyCreds}>
                    <Text style={{ color: '#FFF', fontWeight: 'bold' }}>📋 {t.credCopy}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.saveModalBtn, { flex: 1, marginLeft: 8, backgroundColor: '#1976D2' }]} onPress={sendCredsMail}>
                    <Text style={{ color: '#FFF', fontWeight: 'bold' }}>✉️ Email</Text>
                  </TouchableOpacity>
                  {!!creds.phone && (
                    <TouchableOpacity style={[styles.saveModalBtn, { flex: 1, marginLeft: 8, backgroundColor: '#2E7D32' }]} onPress={sendCredsSms}>
                      <Text style={{ color: '#FFF', fontWeight: 'bold' }}>💬 SMS</Text>
                    </TouchableOpacity>
                  )}
                </View>
                <TouchableOpacity style={[styles.saveModalBtn, { marginTop: 10, alignItems: 'center' }]} onPress={() => setCreds(null)}>
                  <Text style={{ color: '#FFF', fontWeight: 'bold' }}>{t.okBtn}</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  headerPlanner: { paddingHorizontal: 20, paddingVertical: 12, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#EFEFEF' },
  headerTitleText: { fontSize: 17, fontWeight: 'bold', color: '#333', fontFamily: Platform.OS === 'ios' ? 'Myanmar Sangam MN' : 'sans-serif' },
  scrollContainer: { padding: 15 },
  card: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 18, marginBottom: 15, elevation: 3 },
  adminCard: { backgroundColor: '#FFF5F5', borderWidth: 1, borderColor: '#FFCDD2', borderRadius: 12, padding: 18, marginBottom: 15, elevation: 3 },
  cardHeaderRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  cardTitle: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 6, fontFamily: Platform.OS === 'ios' ? 'Myanmar Sangam MN' : 'sans-serif' },
  subText: { fontSize: 11, color: '#666', marginBottom: 12, fontFamily: Platform.OS === 'ios' ? 'Myanmar Sangam MN' : 'sans-serif' },
  tableHeaderRow: { flexDirection: 'row', backgroundColor: '#FFEBEE', paddingVertical: 8, paddingHorizontal: 6, borderRadius: 6, marginBottom: 6 },
  thText: { fontSize: 11, fontWeight: 'bold', color: '#C62828', fontFamily: Platform.OS === 'ios' ? 'Myanmar Sangam MN' : 'sans-serif' },
  tableRowItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 4, borderBottomWidth: 1, borderBottomColor: '#FFCDD2' },
  emptyTableContainer: { padding: 20, alignItems: 'center' },
  bioEditBtn: { backgroundColor: '#E3F2FD', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6, marginLeft: 8 },
  bioEditText: { color: '#1976D2', fontSize: 11, fontWeight: 'bold' },
  bioName: { fontSize: 17, fontWeight: 'bold', color: '#D32F2F', marginBottom: 6, fontFamily: Platform.OS === 'ios' ? 'Myanmar Sangam MN' : 'sans-serif' },
  bioText: { fontSize: 13, color: '#555', marginBottom: 4, lineHeight: 18, fontFamily: Platform.OS === 'ios' ? 'Myanmar Sangam MN' : 'sans-serif' },
  bold: { fontWeight: 'bold', color: '#333', fontFamily: Platform.OS === 'ios' ? 'Myanmar Sangam MN' : 'sans-serif' },
  shareBanner: { backgroundColor: '#1976D2', borderRadius: 12, padding: 16, flexDirection: 'row', alignItems: 'center', marginBottom: 15, elevation: 2 },
  shareBannerTitle: { color: '#FFF', fontSize: 15, fontWeight: 'bold', fontFamily: Platform.OS === 'ios' ? 'Myanmar Sangam MN' : 'sans-serif' },
  shareBannerSub: { color: '#E3F2FD', fontSize: 12, marginTop: 2, fontFamily: Platform.OS === 'ios' ? 'Myanmar Sangam MN' : 'sans-serif' },
  label: { fontSize: 13, fontWeight: '600', color: '#555', marginBottom: 5, marginTop: 8, fontFamily: Platform.OS === 'ios' ? 'Myanmar Sangam MN' : 'sans-serif' },
  passwordContainer: { flexDirection: 'row', borderWidth: 1, borderColor: '#DDD', borderRadius: 8, alignItems: 'center', backgroundColor: '#FAFAFA', marginBottom: 10 },
  passwordInput: { flex: 1, paddingHorizontal: 12, paddingVertical: 8, fontSize: 14, color: '#333', fontFamily: Platform.OS === 'ios' ? 'Myanmar Sangam MN' : 'sans-serif' },
  eyeIcon: { padding: 10 },
  changePassBtn: { backgroundColor: '#1976D2', paddingVertical: 12, borderRadius: 8, alignItems: 'center', marginTop: 15 },
  changePassBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 14, fontFamily: Platform.OS === 'ios' ? 'Myanmar Sangam MN' : 'sans-serif' },
  addUserBtnHeader: { flexDirection: 'row', backgroundColor: '#D32F2F', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6, alignItems: 'center' },
  addUserBtnText: { color: '#FFF', fontSize: 11, fontWeight: 'bold', fontFamily: Platform.OS === 'ios' ? 'Myanmar Sangam MN' : 'sans-serif' },
  studentName: { fontSize: 13, fontWeight: 'bold', color: '#333', fontFamily: Platform.OS === 'ios' ? 'Myanmar Sangam MN' : 'sans-serif' },
  studentDate: { fontSize: 10, color: '#666', marginTop: 2, fontFamily: Platform.OS === 'ios' ? 'Myanmar Sangam MN' : 'sans-serif' },
  byText: { fontSize: 10, color: '#888', textAlign: 'center', fontFamily: Platform.OS === 'ios' ? 'Myanmar Sangam MN' : 'sans-serif' },
  badge: { fontSize: 9, fontWeight: 'bold', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, overflow: 'hidden', color: '#FFF', textAlign: 'center', fontFamily: Platform.OS === 'ios' ? 'Myanmar Sangam MN' : 'sans-serif' },
  bgAdmin: { backgroundColor: '#D32F2F' },
  bgTeacher: { backgroundColor: '#E65100' },
  bgStudent: { backgroundColor: '#1976D2' },
  bgActive: { backgroundColor: '#2E7D32' },
  bgPending: { backgroundColor: '#F57C00' },
  actionColumn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', flex: 1.2 },
  smallBtn: { width: 26, height: 26, borderRadius: 4, marginRight: 4, justifyContent: 'center', alignItems: 'center', position: 'relative', overflow: 'visible' },
  deleteUserBtn: { width: 26, height: 26, backgroundColor: '#D32F2F', borderRadius: 4, justifyContent: 'center', alignItems: 'center' },
  tooltip: { position: 'absolute', bottom: 30, right: 0, backgroundColor: '#333', paddingHorizontal: 8, paddingVertical: 5, borderRadius: 6, minWidth: 140, maxWidth: 200, zIndex: 999 },
  tooltipText: { color: '#FFF', fontSize: 11, lineHeight: 15 },
  noDataText: { fontSize: 12, color: '#888', textAlign: 'center', fontFamily: Platform.OS === 'ios' ? 'Myanmar Sangam MN' : 'sans-serif' },
  modalOverlay: { flex: 1, justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.5)', padding: 20 },
  modalContent: { backgroundColor: '#FFF', borderRadius: 12, padding: 20, elevation: 5 },
  modalTitle: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 10, textAlign: 'center', fontFamily: Platform.OS === 'ios' ? 'Myanmar Sangam MN' : 'sans-serif' },
  modalInput: { borderWidth: 1, borderColor: '#DDD', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, fontSize: 14, backgroundColor: '#FAFAFA', marginBottom: 5, fontFamily: Platform.OS === 'ios' ? 'Myanmar Sangam MN' : 'sans-serif' },
  credBox: { backgroundColor: '#F5F5F5', borderRadius: 8, padding: 12, borderWidth: 1, borderColor: '#DDD' },
  credLine: { fontSize: 13, color: '#333', marginBottom: 4 },
  credPw: { fontSize: 16, fontWeight: 'bold', color: '#C62828' },
  credNote: { fontSize: 11, color: '#666', marginTop: 6, lineHeight: 16 },
  credHint: { fontSize: 11, color: '#666', marginTop: 10, lineHeight: 16 },
  roleSelectRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 5, marginBottom: 15 },
  roleOptionBtn: { flex: 1, paddingVertical: 8, borderWidth: 1, borderColor: '#DDD', borderRadius: 6, alignItems: 'center', marginHorizontal: 3 },
  roleOptionActive: { backgroundColor: '#1976D2', borderColor: '#1976D2' },
  roleOptionText: { fontSize: 11, fontWeight: 'bold', color: '#555', fontFamily: Platform.OS === 'ios' ? 'Myanmar Sangam MN' : 'sans-serif' },
  modalBtnRow: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 10 },
  cancelModalBtn: { paddingVertical: 10, paddingHorizontal: 15, marginRight: 10, justifyContent: 'center' },
  saveModalBtn: { backgroundColor: '#D32F2F', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 8, justifyContent: 'center' }
});
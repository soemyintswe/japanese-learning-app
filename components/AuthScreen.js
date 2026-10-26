import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator, Modal, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  sendPasswordResetEmail,
  signOut,
} from 'firebase/auth';
import { auth } from '../src/firebase';
import { resolveUserProfile, classifyResolveError } from '../src/session';
import { useLanguage } from '../src/LanguageContext';
import { POLICY } from '../src/privacyPolicy';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CONSENT_KEY = '@japanese_privacy_consent_v1';
const APK_BUILD_URL = 'https://expo.dev/accounts/soemyintswe/projects/japanese-mksedu/builds/58adfdf7-0ef4-4a4e-bb63-1cbbfd50a018';

const translations = {
  my: {
    title: 'ဂျပန်စာ လေ့လာမှု စီမံစနစ်',
    login: 'အကောင့်ဝင်ရန် (Login)',
    register: 'အကောင့်အသစ် ဖန်တီးရန် (Register)',
    student: '🎓 ကျောင်းသား',
    teacher: '👨‍🏫 ဆရာ (Admin)',
    username: 'Email (Username သက်သက်နဲ့ မရပါ):',
    password: 'စကားဝှက် (Password):',
    name: 'အမည်ပြည့်စုံ (Full Name):',
    phone: 'ဖုန်းနံပါတ် (Phone Number):',
    loginBtn: 'ဝင်ရောက်မည် (Login)',
    googleRegisterBtn: 'Google အကောင့်ဖြင့် Register လုပ်မည်',
    gwWantPw: 'Google နဲ့ဖွင့်ထားပြီး Email+Password နဲ့ပါ ဝင်ချင်လား? (အပေါ် Email ရိုက်ပြီး နှိပ်ပါ — link ကနေ ကိုယ့် password ကိုယ်သတ်)',
    noAccount: 'အကောင့်မရှိသေးဘူးလား? အသစ်စာရင်းသွင်းရန်',
    hasAccount: 'အကောင့်ရှိပြီးသားလား? Login သို့ ပြန်သွားရန်',
    guestBtn: '🎮 Guest အဖြစ် လေ့လာရန် (Login မလို)',
    guestHint: 'Quiz · အဘိဓာန် · အချိန်ဇယား · မှတ်စု — offline သုံးလို့ရ. Chat/Class အတွက် account လိုအပ်ပါတယ်.',
    resetLink: '🔑 Password မေ့ပါသလား? Reset email ပို့မည်',
    googleBtn: 'G  Google ဖြင့် ဝင်ရန်',
    sending: 'Email ပို့နေပါတယ်…',
    policyNeed: '☑️ Privacy Policy ကို ဖတ်၍ သဘောတူပါ',
    regNameLabel: 'အမည် (Name):',
    regPwLabel: 'Password (အနည်းဆုံး ၆ လုံး):',
    regBtn: '📧 Email နဲ့ Register လုပ်မည်',
    orText: '— သို့မဟုတ် —',
    regNote: 'Email နဲ့ Register လုပ်ပါ — အကောင့် တကယ် ဖွင့်ပေးမယ် (Admin အတည်ပြုပြီးမှ ဝင်နိုင်မည်)',
    accountTab: '👤 အကောင့်ဝင်ရန်', guestTab: '🎮 ဧည့်သည်အဖြစ်', viewPolicy: 'Privacy Policy ကိုကြည့်ရန်',
    registerEmailAction: 'Email ဖြင့် စာရင်းသွင်းရန်', guestTitle: 'အကောင့်မလိုဘဲ လေ့လာပါ',
    apkBtn: 'Android APK ဒေါင်းလုဒ်လုပ်ရန်', apkDesc: 'နောက်ဆုံး App ကို EAS မှ ရယူပါ',
  },
  en: {
    title: 'Japanese Study Planner',
    login: 'Sign In (Login)',
    register: 'Create New Account (Register)',
    student: '🎓 Student',
    teacher: '👨‍🏫 Teacher (Admin)',
    username: 'Username or Email:',
    password: 'Password:',
    name: 'Full Name:',
    phone: 'Phone Number:',
    loginBtn: 'Login',
    googleRegisterBtn: 'Register with Google',
    gwWantPw: 'Google account but want Email+Password too? (type email above, tap — set your own password via link)',
    noAccount: "Don't have an account? Sign Up",
    hasAccount: 'Already have an account? Sign In',
    guestBtn: '🎮 Continue as Guest (no login)',
    guestHint: 'Quiz · Dictionary · Planner · Notes work offline. Chat/Class needs an account.',
    resetLink: '🔑 Forgot password? Send reset email',
    googleBtn: 'G  Continue with Google',
    sending: 'Sending email…',
    policyNeed: '☑️ Please agree to the Privacy Policy',
    regNameLabel: 'Name:',
    regPwLabel: 'Password (min 6 chars):',
    regBtn: '📧 Register with Email',
    orText: '— or —',
    regNote: 'Register with your Email (Requires Admin Approval)',
    accountTab: '👤 Account User Login', guestTab: '🎮 Guest User Login', viewPolicy: 'View Privacy Policy',
    registerEmailAction: 'Register with Email', guestTitle: 'Learn without an account',
    apkBtn: 'Download Android APK', apkDesc: 'Get the latest app from EAS',
  },
  jp: {
    title: '日本語スタディプランナー',
    login: 'ログイン',
    register: 'アカウント作成',
    student: '🎓 学生',
    teacher: '👨‍🏫 先生 (管理者)',
    username: 'ユーザー名またはメール:',
    password: 'パスワード:',
    name: '氏名:',
    phone: '電話番号:',
    loginBtn: 'ログインする',
    googleRegisterBtn: 'Googleで登録',
    gwWantPw: 'Google登録済みでメール+パスワードも使いたい? (上欄に入力してタップ — リンクで設定)',
    noAccount: 'アカウントをお持ちではありませんか？',
    hasAccount: 'すでにアカウントをお持ちですか？',
    guestBtn: '🎮 ゲストとして続ける (ログイン不要)',
    guestHint: 'クイズ・辞書・プランナー・ノートはオフラインOK. チャット/授業はアカウント必要.',
    resetLink: '🔑 パスワードをお忘れですか? リセットメール送信',
    googleBtn: 'G  Googleで続行',
    sending: 'メール送信中…',
    policyNeed: '☑️ プライバシーポリシーに同意してください',
    regNameLabel: '氏名:',
    regPwLabel: 'パスワード (6文字以上):',
    regBtn: '📧 メールで登録',
    orText: '— または —',
    regNote: 'メールで登録（管理者の承認が必要）',
    accountTab: '👤 アカウントでログイン', guestTab: '🎮 ゲストで利用', viewPolicy: 'プライバシーポリシーを見る',
    registerEmailAction: 'メールで登録', guestTitle: 'アカウントなしで学習',
    apkBtn: 'Android APK をダウンロード', apkDesc: 'EAS から最新アプリを入手',
  }
};

export default function AuthScreen({ onLoginSuccess, notice, onGuest }) {
  const { lang, setLang } = useLanguage();
  const t = translations[lang] || translations.my;

  const [step, setStep] = useState('login');
  const [authTab, setAuthTab] = useState('account');

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Web Alert က လွတ်သွားတတ်လို့ error/info ကို screen ပေါ်မှာ တိုက်ရိုက် ပြပေးမယ် —
  // မှားရင် မှားကြောင်း အမြဲ မြင်ရမယ်
  const [errorMsg, setErrorMsg] = useState('');
  const [infoMsg, setInfoMsg] = useState('');
  const [consent, setConsent] = useState(false);
  const [policyVisible, setPolicyVisible] = useState(false);
  const policy = POLICY[lang] || POLICY.my;

  useEffect(() => {
    (async () => {
      try {
        const v = await AsyncStorage.getItem(CONSENT_KEY);
        if (v === 'yes') setConsent(true);
      } catch (e) {}
    })();
  }, []);

  const needConsent = () => {
    if (consent) return false;
    showError('⚠️ ' + policy.need);
    setPolicyVisible(true);
    return true;
  };

  const agreePolicy = async () => {
    try {
      await AsyncStorage.setItem(CONSENT_KEY, 'yes');
    } catch (e) {}
    setConsent(true);
    setPolicyVisible(false);
    clearMsg();
  };

  const toggleConsent = async () => {
    const next = !consent;
    setConsent(next);
    try { await AsyncStorage.setItem(CONSENT_KEY, next ? 'yes' : 'no'); } catch (e) {}
    if (next) clearMsg();
  };

  const renderConsent = () => (
    <View style={styles.consentRow}>
      <TouchableOpacity onPress={toggleConsent} accessibilityRole="checkbox" accessibilityState={{ checked: consent }} style={styles.checkbox}>
        <Text style={styles.checkboxMark}>{consent ? '☑' : '□'}</Text>
      </TouchableOpacity>
      <View style={{ flex: 1 }}>
        <Text style={styles.consentText}>{policy.consent}</Text>
        <TouchableOpacity onPress={() => setPolicyVisible(true)}>
          <Text style={styles.policyLink}>{t.viewPolicy}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // App.js က ပို့တဲ့ notice (ဥပမာ pending approve စောင့်နေတာ) ကို ပြမယ်
  useEffect(() => {
    if (notice) setInfoMsg(notice);
  }, [notice]);

  const showError = (msg) => {
    setInfoMsg('');
    setErrorMsg(msg);
  };
  const showInfo = (msg) => {
    setErrorMsg('');
    setInfoMsg(msg);
  };
  const clearMsg = () => {
    setErrorMsg('');
    setInfoMsg('');
  };

  // resolveUserProfile ပျက်ရင်: rules-အစစ် vs network-ခဏ — စာသား ခွဲပြ
  // (အရင် code က အမှားမှန်သမျှ "Rules" လို့ ပြလို့ mobile-network ချို့ယွင်းမှုပါ rules-မှားထင်နေတာ)
  const RULES_MSG = 'Firestore Rules ကြောင့် profile ဖတ်မရပါ (permission-denied)။ Firebase Console > Firestore > Rules မှာ firestore.rules file အတိုင်း Publish လုပ်ပေးပါ။';
  const NET_MSG = 'အင်တာနက်/ဆာဗာ ချိတ်ဆက်မှု မကောင်းလို့ profile ဖတ်မရပါ။ WiFi/Data စစ်ပြီး Login/Register ပြန်နှိပ်ပါ (အကောင့်/data မပျက်)။';
  const resolveFailMsg = (p) => (classifyResolveError(p) === 'rules' ? RULES_MSG : NET_MSG);

  // Google redirect နဲ့ ပြန်လာရင် (popup block ခံရသူတွေ) ဒီမှာ ရလဒ် ဖမ်းမယ်
  useEffect(() => {
    (async () => {
      try {
        const result = await getRedirectResult(auth);
        if (result && result.user) {
          await processGoogleUser(result.user);
        }
      } catch (err) {
        console.error('Redirect result error:', err.code, err.message);
        showError(friendlyGoogleError(err));
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const friendlyGoogleError = (err) => {
    const host = typeof window !== 'undefined' && window.location ? window.location.hostname : '';
    if (err.code === 'auth/popup-closed-by-user') {
      return 'Google window ကို ပိတ်လိုက်လို့ မပြီးသေးပါ — Google ခလုတ် ထပ်နှိပ်ပြီး အဆုံးထိ လုပ်ပေးပါ။';
    }
    if (err.code === 'auth/cancelled-popup-request') {
      return 'ခဏစောင့်ပြီး Google ခလုတ် တစ်ချက်တည်း နှိပ်ပါ။';
    }
    if (err.code === 'auth/popup-blocked') {
      return 'Browser က popup ပိတ်ထားလို့ Google စာမျက်နှာကို တိုက်ရိုက်ပို့ပေးနေပါတယ်…';
    }
    if (err.code === 'auth/unauthorized-domain') {
      return 'ဒီ domain (' + (host || 'unknown') + ') ကို Firebase မှာ ခွင့်မပြုထားလို့ပါ။ Firebase Console > Authentication > Settings > Authorized domains မှာ ' + (host || 'ဒီ domain') + ' ကို Add domain လုပ်ပေးပါ။';
    }
    if (err.code === 'auth/operation-not-allowed') {
      return 'Firebase Console မှာ Google login ပိတ်ထားလို့ပါ။ Authentication > Sign-in method > Google > Enable လုပ်ပေးပါ။';
    }
    if (err.code === 'auth/network-request-failed') {
      return 'အင်တာနက် ချိတ်ဆက်မှု မရပါ။ WiFi/Data စစ်ပြီး ပြန်နှိပ်ပါ။';
    }
    if (err.code === 'auth/argument-error') {
      return 'App version အဟောင်း (cache) သုံးနေလို့ Google login ပြင်ဆင်ချက်မပါသေးတာပါ။ Browser မှာ Ctrl+F5 နှိပ်ပြီး အသစ်ပြန်ယူပါ။ ပြီးရင် Google ခလုတ် ထပ်နှိပ်ပါ။';
    }
    return 'Google login မအောင်မြင်ပါ။ (' + (err.code || err.message || 'unknown') + ')';
  };

  // Email + Password ဖြင့် Firebase Auth အစစ်ဖြင့် Login ဝင်ခြင်း
  // Firestore users/{uid} မှာ status=active ဖြစ်မှသာ ဝင်ခွင့်ပေးမယ်
  const handleAuthAction = async () => {
    if (step !== 'login') return;
    if (needConsent()) return;

    const loginEmail = (email.trim() || username.trim()).trim();
    if (!loginEmail || !password.trim()) {
      showError('Email နှင့် Password ဖြည့်ပါ။');
      return;
    }
    // Firebase က Email ပုံစံမှသာ လက်ခံပါတယ် — username သက်သက် (ဥပမာ mgmg) နဲ့ ဝင်မရပါ
    if (!loginEmail.includes('@')) {
      showError('Email နဲ့ ဝင်ပါ 📧 — အခုလုံခြုံရေးအတွက် Email အပြည့်အစုံ (ဥပမာ user@gmail.com) နဲ့မှ ဝင်လို့ရပါမယ်။');
      return;
    }

    clearMsg();
    setLoading(true);
    try {
      const cred = await signInWithEmailAndPassword(auth, loginEmail, password);
      const fbUser = cred.user;

      // Firestore profile resolve (uid doc → email placeholder adopt → admin auto-active)
      const p = await resolveUserProfile(fbUser);

      if (p.banned) {
        await signOut(auth);
        showError('⛔ ဤအကောင့်ကို ပိတ်ထားပြီးပါပြီ (Admin ဆုံးဖြတ်)။ Admin ကို ဆက်သွယ်ပါ။');
        return;
      }

      if (!p.isAdmin && p.status !== 'active') {
        await signOut(auth);
        showInfo(
          p.firestoreOk
            ? 'ခွင့်ပြုချက် စောင့်ဆိုင်းဆဲ ⏳ — သင်၏အကောင့်ကို Admin မှ အတည်ပြုပေးရန် (Active လုပ်ရန်) လိုအပ်နေပါသေးသည်။'
            : resolveFailMsg(p)
        );
        return;
      }

      showInfo('အောင်မြင်စွာ ဝင်ရောက်ပြီးပါပြီ ✅');
      onLoginSuccess({ name: p.name, role: p.role, email: fbUser.email, uid: fbUser.uid, photoURL: p.photoURL || fbUser.photoURL || null, lang });
    } catch (err) {
      console.error('Login Error:', err.code, err.message);
      let msg = err.message;
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-password') {
        msg = 'Email သို့မဟုတ် Password မှားနေပါတယ်။\n\n• Google နဲ့ပဲ ဖွင့်ထားတဲ့ အကောင့် (password မသတ်မှတ်ရသေးဘူး) ဆို — အောက် "Password သတ်မှတ်ရန် email ပို့မယ်" ကို နှိပ်�ြီး password အရင်သတ်မှတ်ပါ။\n• အရင် code အဟောင်းထဲက password အတုက Firebase password အစစ်မဟုတ်လို့ သုံးမရတော့ပါ။';
      } else if (err.code === 'auth/user-not-found') {
        msg = 'ဤ Email နဲ့ အကောင့်မရှိသေးပါ။ အောက် "အသစ်စာရင်းသွင်းရန်" ကို နှိပ်ပြီး Email နဲ့ Register အရင်လုပ်ပါ (သို့မဟုတ် Google နဲ့ Register လုပ်ပါ)။';
      } else if (err.code === 'auth/invalid-email') {
        msg = 'Email ပုံစံမှားနေပါတယ် (ဥပမာ user@gmail.com လို့ ရိုက်ပါ)။';
      } else if (err.code === 'auth/operation-not-allowed') {
        msg = 'Firebase Console မှာ Email/Password login ပိတ်ထားလို့ပါ။\n\nFirebase Console > Authentication > Sign-in method > Email/Password > Enable လုပ်ပေးပါ။';
      } else if (err.code === 'auth/user-disabled') {
        msg = 'ဤအကောင့်ကို Admin က ပိတ်ထားပါတယ် (disabled)။ Admin ကို ဆက်သွယ်ပါ။';
      } else if (err.code === 'auth/network-request-failed') {
        msg = 'အင်တာနက် ချိတ်ဆက်မှု မရပါ။ WiFi/Data စစ်ပြီး ပြန်ဝင်ပါ။';
      } else if (err.code === 'auth/too-many-requests') {
        msg = 'ခဏခဏ မှားနှိပ်လို့ ခေတ္တပိတ်ထားပါတယ်။ ခေတ္တစောင့်ပြီး ပြန်ဝင်ပါ။';
      } else {
        msg = 'Login မအောင်မြင်ပါ။ (' + (err.code || err.message || 'unknown') + ')';
      }
      showError('❌ ' + msg);
    } finally {
      setLoading(false);
    }
  };

  // Password မရှိသေးသူ / မေ့နေသူ အတွက်: Reset email ပို့ပြီး password အသစ် သတ်မှတ်ခိုင်းမယ်
  // (Google နဲ့ပဲ ဖွင့်ထားတဲ့ အကောင့် — Providers မှာ G သက်သက်ပြနေတာ — ကို
  // Email/Password နဲ့ပါ ဝင်လို့ရအောင် လုပ်ပေးတဲ့ တရားဝင်နည်း)
  const [resetSending, setResetSending] = useState(false);
  const handlePasswordReset = async () => {
    const resetEmail = (email.trim() || username.trim()).trim();
    if (!resetEmail || !resetEmail.includes('@')) {
      showError('Email ဖြည့်ပါ 📧 — အပေါ် Email box မှာ password သတ်မှတ်ချင်တဲ့ Email ကို အရင်ရိုက်ပါ။');
      return;
    }
    clearMsg();
    setResetSending(true);
    try {
      await sendPasswordResetEmail(auth, resetEmail);
      showInfo(
        'Email ပို့ပြီးပါပြီ ✉️ — ' + resetEmail + ' ကို password သတ်မှတ်ရန် link ပို့လိုက်ပါပြီ。Gmail Inbox (Spam လည်း ကြည့်ပါ) ထဲက link နှိပ်ပြီး password အသစ် သတ်မှတ်ပါ။'
      );
    } catch (err) {
      console.error('Reset Error:', err.code, err.message);
      let msg = err.message;
      if (err.code === 'auth/user-not-found') {
        msg = 'ဤ Email နဲ့ Firebase login အကောင့်မရှိသေးပါ။ "အသစ်စာရင်းသွင်းရန်" ကို နှိပ်ပြီး Email နဲ့ Register အရင်လုပ်ပါ။ (မှတ်ချက်: Firebase က လုံခြုံရေးအရ အကောင့်မရှိရင်တောင် "ပို့ပြီးပြီ" လို့ ပြတတ်ပါတယ်)';
      } else if (err.code === 'auth/invalid-email') {
        msg = 'Email ပုံစံမှားနေပါတယ်။';
      } else {
        msg = 'Reset email ပို့မရပါ။ (' + (err.code || err.message || 'unknown') + ')';
      }
      showError(msg);
    } finally {
      setResetSending(false);
    }
  };

  // Email နဲ့ ကိုယ်တိုင် Register (Login အကောင့် တကယ် ဖွင့်ပေးတာ) —
  // Admin က Firestore မှာ ကြိုဖန်တီးပေးထားတဲ့ placeholder (role/status) ရှိရင် ဆက်ခံမယ်၊
  // မရှိရင် student + pending နဲ့ စောင့်မယ် (Admin approve မှ ဝင်ရမယ်)
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regLoading, setRegLoading] = useState(false);

  const handleEmailRegister = async () => {
    if (needConsent()) return;
    const name = regName.trim();
    const rEmail = regEmail.trim().toLowerCase(); // Rules email-compare တိကျအောင် lowercase အမြဲ
    if (!name) {
      showError('အမည် (Name) ဖြည့်ပါ။');
      return;
    }
    if (!rEmail || !rEmail.includes('@')) {
      showError('Email ပုံစံမှန်အောင် ဖြည့်ပါ (ဥပမာ user@gmail.com)။');
      return;
    }
    if (!regPassword || regPassword.length < 6) {
      showError('Password အနည်းဆုံး ၆ လုံး ဖြည့်ပါ။');
      return;
    }
    clearMsg();
    setRegLoading(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, rEmail, regPassword);
      const fbUser = cred.user;
      const p = await resolveUserProfile(fbUser, name);
      // displayName မှတ်ထားမယ် (နောက် login မှာ နာမည်ပေါ်အောင်)
      try {
        await updateProfile(fbUser, { displayName: name });
      } catch (e) {}

      if (p.banned) {
        await signOut(auth);
        showError('⛔ ဤအကောင့်ကို ပိတ်ထားပြီးပါပြီ (Admin ဆုံးဖြတ်)။ Admin ကို ဆက်သွယ်ပါ။');
        return;
      }

      if (!p.firestoreOk) {
        await signOut(auth);
        showError('❌ ' + resolveFailMsg(p));
        return;
      }

      if (!p.isAdmin && p.status !== 'active') {
        await signOut(auth);
        showInfo('Register အောင်မြင်ပါပြီ ✅ — Admin အတည်ပြုရန် (Active လုပ်ရန်) စောင့်နေပါတယ် ⏳။ Approve ပြီးရင် မှတ်ပုံတင်ထားတဲ့ Email + Password အတိုင်း Login ဝင်လို့ရပြီ (ပြောင်းစရာမလို)။');
        setRegName('');
        setRegEmail('');
        setRegPassword('');
        return;
      }
      showInfo('Register + Login အောင်မြင်ပါပြီ ✅ (' + p.name + ')');
      if (onLoginSuccess) {
      onLoginSuccess({ name: p.name, role: p.role, email: fbUser.email, uid: fbUser.uid, photoURL: p.photoURL || fbUser.photoURL || null, mustChangePassword: !!p.mustChangePassword, hasPassword: !!p.hasPassword, lang });
      }
    } catch (err) {
      console.error('Email register error:', err.code, err.message);
      let msg = err.message;
      if (err.code === 'auth/email-already-in-use') {
        msg = 'ဤ Email နဲ့ အကောင့်ရှိပြီးသားပါ — Login ဘက်က ဝင်ပါ။ Password မေ့နေရင် "Password သတ်မှတ်ရန် email ပို့မယ်" ကို သုံးပါ။';
      } else if (err.code === 'auth/invalid-email') {
        msg = 'Email ပုံစံမှားနေပါတယ်။';
      } else if (err.code === 'auth/weak-password') {
        msg = 'Password အားနည်းပါတယ် — အနည်းဆုံး ၆ လုံး ထားပါ။';
      } else if (err.code === 'auth/operation-not-allowed') {
        msg = 'Firebase Console မှာ Email/Password register ပိတ်ထားလို့ပါ။ Authentication > Sign-in method > Email/Password > Enable လုပ်ပေးပါ။';
      } else if (err.code === 'auth/network-request-failed') {
        msg = 'အင်တာနက် ချိတ်ဆက်မှု မရပါ။';
      } else {
        msg = 'Register မအောင်မြင်ပါ။ (' + (err.code || err.message || 'unknown') + ')';
      }
      showError('❌ ' + msg);
    } finally {
      setRegLoading(false);
    }
  };

  // Google user ရပြီးရင် Firestore profile စစ်ပြီး ဝင်ခွင့်ပေးမယ် (popup / redirect နှစ်ခုလုံး ဒါကိုသုံးတယ်)
  const processGoogleUser = async (user) => {
    const p = await resolveUserProfile(user);

    if (p.banned) {
      await signOut(auth);
      showError('⛔ ဤအကောင့်ကို ပိတ်ထားပြီးပါပြီ (Admin ဆုံးဖြတ်)။ Admin ကို ဆက်သွယ်ပါ။');
      return;
    }

    if (!p.isAdmin && p.status !== 'active') {
      await signOut(auth);
      showInfo(
        p.firestoreOk
          ? 'ခွင့်ပြုချက် စောင့်ဆိုင်းဆဲ ⏳ — သင်၏အကောင့်ကို Admin မှ အတည်ပြုပေးရန် (Active လုပ်ရန်) လိုအပ်နေပါသေးသည်။ ကျေးဇူးပြု၍ ခေတ္တစောင့်ဆိုင်းပါ။'
          : resolveFailMsg(p)
      );
      return;
    }

    showInfo('အောင်မြင်စွာ ဝင်ရောက်ပြီးပါပြီ ✅ (' + p.name + ')');
    if (onLoginSuccess) {
      onLoginSuccess({
        name: p.name,
        role: p.role,
        email: user.email,
        uid: user.uid,
        photoURL: p.photoURL || user.photoURL || null,
        mustChangePassword: !!p.mustChangePassword,
        hasPassword: (user.providerData || []).some((x) => x && x.providerId === 'password'),
        lang
      });
    }
  };

  // Google ဖြင့် Register / ဝင်ရောက်ခြင်း နှင့် Status စစ်ဆေးခြင်း
  // NOTE: signInWithPopup က Web (browser) မှာသာ အလုပ်လုပ်ပါတယ်။
  const handleGoogleRegister = async () => {
    if (needConsent()) return;
    if (Platform.OS !== 'web') {
      showError('Web မှာသာ ရပါတယ် 🌐 — Google Login က ဖုန်း App (Expo Go) မှာ တိုက်ရိုက်မရသေးပါ။ ကွန်ပျူတာ Browser (https://japanese-mksedu.web.app) ကနေ ဝင်ပါ၊ သို့မဟုတ် Email + Password နဲ့ Login ဝင်ပါ။');
      return;
    }
    clearMsg();
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      await processGoogleUser(result.user);
    } catch (err) {
      console.error('Google Register Error:', err.code, err.message);
      // Popup block ခံရရင် Google စာမျက်နှာကို တိုက်ရိုက်ပို့ပေးမယ် (redirect) —
      // ပြန်လာရင် အပေါ် getRedirectResult က ဆက်လုပ်ပေးမယ်
      if (err.code === 'auth/popup-blocked') {
        showInfo('Browser က popup ပိတ်ထားလို့ Google စာမျက်နှာသို့ ပို့ပေးနေပါတယ်…');
        try {
          await signInWithRedirect(auth, new GoogleAuthProvider());
          return;
        } catch (rErr) {
          showError(friendlyGoogleError(rErr));
        }
      } else {
        showError('❌ ' + friendlyGoogleError(err));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
          <View style={styles.brandHeader}>
            <View style={styles.brandLockup}>
              <Text style={styles.brandLogo}>🎓</Text>
              <Text style={styles.brandTitle}>{t.title}</Text>
            </View>
            <View style={styles.langRow}>
              {['my', 'en', 'jp'].map((l) => (
                <TouchableOpacity 
                  key={l} 
                  style={[styles.langBtn, lang === l && styles.langBtnActive]} 
                  onPress={() => setLang(l)}
                >
                  <Text style={[styles.langText, lang === l && styles.langTextActive]}>
                    {l === 'my' ? 'မြန်မာ' : l === 'en' ? 'English' : '日本語'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.card}>
            <View style={styles.authTabs}>
              <TouchableOpacity
                accessibilityRole="tab"
                accessibilityState={{ selected: authTab === 'account' }}
                style={[styles.authTab, authTab === 'account' && styles.authTabActive]}
                onPress={() => setAuthTab('account')}
              >
                <Text style={[styles.authTabText, authTab === 'account' && styles.authTabTextActive]}>{t.accountTab}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                accessibilityRole="tab"
                accessibilityState={{ selected: authTab === 'guest' }}
                style={[styles.authTab, authTab === 'guest' && styles.authTabActive]}
                onPress={() => setAuthTab('guest')}
              >
                <Text style={[styles.authTabText, authTab === 'guest' && styles.authTabTextActive]}>{t.guestTab}</Text>
              </TouchableOpacity>
            </View>

            {/* Error / Info message banner — မှားရင် မှားကြောင်း ဒီမှာ အမြဲ ပြမယ် */}
            {!!errorMsg && (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{errorMsg}</Text>
              </View>
            )}
            {!!infoMsg && (
              <View style={styles.infoBox}>
                <Text style={styles.infoText}>{infoMsg}</Text>
              </View>
            )}

            {authTab === 'account' && step === 'login' && (
              <>
                <Text style={styles.label}>{t.username}</Text>
                <TextInput
                  style={styles.input}
                  placeholder="user@gmail.com"
                  value={username}
                  onChangeText={setUsername}
                  placeholderTextColor="#999"
                  autoCapitalize="none"
                  keyboardType="email-address"
                  returnKeyType="done"
                  onSubmitEditing={handleAuthAction}
                />

                <Text style={styles.label}>{t.password}</Text>
                <View style={styles.passwordContainer}>
                  <TextInput
                    style={styles.passwordInput}
                    placeholder="Password"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    placeholderTextColor="#999"
                    returnKeyType="done"
                    onSubmitEditing={handleAuthAction}
                  />
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                    <Text style={{ fontSize: 20 }}>{showPassword ? '🙈' : '👁️'}</Text>
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  style={styles.googleButton}
                  onPress={handleGoogleRegister}
                  disabled={loading}
                >
                  {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.googleButtonText}>{t.googleBtn}</Text>}
                </TouchableOpacity>

                {renderConsent()}

                <TouchableOpacity style={styles.submitBtn} onPress={handleAuthAction} disabled={loading}>
                  {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitBtnText}>{t.loginBtn}</Text>}
                </TouchableOpacity>

                <TouchableOpacity onPress={handlePasswordReset} disabled={resetSending} style={styles.resetLinkButton}>
                  <Text style={styles.switchText}>{resetSending ? t.sending : t.resetLink}</Text>
                </TouchableOpacity>

                <View style={styles.registerDivider}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.registerPrompt}>{t.noAccount}</Text>
                  <View style={styles.dividerLine} />
                </View>
                <View style={styles.registerActions}>
                  <TouchableOpacity style={styles.emailRegisterButton} onPress={() => setStep('register')}>
                    <Text style={styles.emailRegisterText}>{t.registerEmailAction}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.googleRegisterButton} onPress={handleGoogleRegister} disabled={loading}>
                    <Text style={styles.googleRegisterText}>{t.googleRegisterBtn}</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}

            {authTab === 'account' && step === 'register' && (
              <>
                <Text style={styles.subtitle}>{t.register}</Text>

                <Text style={styles.instructionText}>
                  {t.regNote}
                </Text>

                <Text style={styles.label}>{t.regNameLabel}</Text>
                <TextInput
                  style={styles.input}
                  placeholder="ဥပမာ - Mg Mg"
                  value={regName}
                  onChangeText={setRegName}
                  placeholderTextColor="#999"
                  returnKeyType="next"
                />

                <Text style={styles.label}>Email:</Text>
                <TextInput
                  style={styles.input}
                  placeholder="user@gmail.com"
                  value={regEmail}
                  onChangeText={setRegEmail}
                  placeholderTextColor="#999"
                  autoCapitalize="none"
                  keyboardType="email-address"
                  returnKeyType="next"
                />

                <Text style={styles.label}>{t.regPwLabel}</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Password"
                  value={regPassword}
                  onChangeText={setRegPassword}
                  placeholderTextColor="#999"
                  secureTextEntry={true}
                  returnKeyType="done"
                  onSubmitEditing={handleEmailRegister}
                />

                {renderConsent()}

                <TouchableOpacity
                  style={[styles.submitBtn, { backgroundColor: '#2E7D32' }]}
                  onPress={handleEmailRegister}
                  disabled={regLoading}
                >
                  {regLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitBtnText}>{t.regBtn}</Text>}
                </TouchableOpacity>

                <Text style={[styles.instructionText, { marginTop: 12 }]}>
                  {t.orText}
                </Text>

                <TouchableOpacity
                  style={styles.googleButton}
                  onPress={handleGoogleRegister}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.googleButtonText}>{t.googleRegisterBtn}</Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity onPress={() => setStep('login')} style={{ marginTop: 20, alignItems: 'center' }}>
                  <Text style={styles.switchText}>{t.hasAccount}</Text>
                </TouchableOpacity>
              </>
            )}

            {authTab === 'guest' && (
              <View style={styles.guestPanel}>
                <Text style={styles.guestIcon}>🎮</Text>
                <Text style={styles.guestTitle}>{t.guestTitle}</Text>
                <Text style={styles.guestHint}>{t.guestHint}</Text>
                {onGuest && (
                  <TouchableOpacity style={styles.guestBtn} onPress={onGuest} disabled={loading}>
                    <Text style={styles.guestBtnText}>{t.guestBtn}</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>

          <TouchableOpacity
            style={styles.apkDownloadButton}
            onPress={() => Linking.openURL(APK_BUILD_URL).catch(() => {})}
            activeOpacity={0.86}
            accessibilityRole="link"
            accessibilityLabel={`${t.apkBtn}. ${t.apkDesc}`}
          >
            <Text style={styles.apkDownloadIcon}>⬇️</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.apkDownloadTitle}>{t.apkBtn}</Text>
              <Text style={styles.apkDownloadDesc}>{t.apkDesc}</Text>
            </View>
            <Text style={styles.apkDownloadArrow}>›</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* 🔒 Privacy Policy modal */}
      <Modal visible={policyVisible} animationType="slide" transparent={true}>
        <View style={styles.policyOverlay}>
          <View style={styles.policyBox}>
            <Text style={styles.policyTitle}>{policy.title}</Text>
            <ScrollView style={{ maxHeight: 320 }}>
              <Text style={styles.policyBody}>{policy.body}</Text>
            </ScrollView>
            <View style={{ flexDirection: 'row', marginTop: 14 }}>
              <TouchableOpacity
                style={[styles.policyBtn, { backgroundColor: '#E0E0E0', marginRight: 6 }]}
                onPress={() => setPolicyVisible(false)}
              >
                <Text style={[styles.policyBtnText, { color: '#333' }]}>{policy.close}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.policyBtn, { backgroundColor: '#2E7D32', marginLeft: 6 }]}
                onPress={agreePolicy}
              >
                <Text style={styles.policyBtnText}>{policy.agree}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F5F9' },
  scrollContainer: { flexGrow: 1, justifyContent: 'center', alignSelf: 'center', width: '100%', maxWidth: 540, paddingHorizontal: 18, paddingVertical: 22 },
  brandHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', marginBottom: 16 },
  brandLockup: { flexDirection: 'row', alignItems: 'center', flex: 1, minWidth: 145, marginRight: 10 },
  brandLogo: { fontSize: 32, marginRight: 9 },
  brandTitle: { flexShrink: 1, fontSize: 16, fontWeight: '800', color: '#252B36', fontFamily: Platform.OS === 'ios' ? 'Myanmar Sangam MN' : 'sans-serif' },
  langRow: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center' },
  langBtn: { paddingHorizontal: 8, paddingVertical: 6, borderWidth: 1, borderColor: '#D8DDE6', borderRadius: 8, marginLeft: 5, backgroundColor: '#FFF' },
  langBtnActive: { backgroundColor: '#C62828', borderColor: '#C62828' },
  langText: { fontSize: 10, color: '#596273', fontWeight: '700', fontFamily: Platform.OS === 'ios' ? 'Myanmar Sangam MN' : 'sans-serif' },
  langTextActive: { color: '#FFF' },
  card: { width: '100%', backgroundColor: '#FFFFFF', borderRadius: 20, padding: 20, borderWidth: 1, borderColor: '#E7EAF0', elevation: 5, shadowColor: '#172033', shadowOpacity: 0.08, shadowRadius: 18, shadowOffset: { width: 0, height: 8 } },
  authTabs: { flexDirection: 'row', padding: 4, backgroundColor: '#F0F2F6', borderRadius: 13, marginBottom: 17 },
  authTab: { flex: 1, minHeight: 44, paddingHorizontal: 6, paddingVertical: 8, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  authTabActive: { backgroundColor: '#FFF', elevation: 2, shadowColor: '#172033', shadowOpacity: 0.08, shadowRadius: 4, shadowOffset: { width: 0, height: 2 } },
  authTabText: { color: '#667085', fontSize: 12, fontWeight: '700', textAlign: 'center', fontFamily: Platform.OS === 'ios' ? 'Myanmar Sangam MN' : 'sans-serif' },
  authTabTextActive: { color: '#B71C1C' },
  subtitle: { fontSize: 16, fontWeight: '800', color: '#252B36', textAlign: 'center', marginBottom: 4, fontFamily: Platform.OS === 'ios' ? 'Myanmar Sangam MN' : 'sans-serif' },
  label: { fontSize: 12, fontWeight: '700', color: '#414A59', marginBottom: 5, marginTop: 10, fontFamily: Platform.OS === 'ios' ? 'Myanmar Sangam MN' : 'sans-serif' },
  input: { minHeight: 44, borderWidth: 1, borderColor: '#DCE1E9', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 9, fontSize: 14, color: '#263141', backgroundColor: '#FBFCFE', fontFamily: Platform.OS === 'ios' ? 'Myanmar Sangam MN' : 'sans-serif' },
  passwordContainer: { flexDirection: 'row', borderWidth: 1, borderColor: '#DCE1E9', borderRadius: 10, alignItems: 'center', backgroundColor: '#FBFCFE', minHeight: 44 },
  passwordInput: { flex: 1, paddingHorizontal: 12, paddingVertical: 8, fontSize: 14, color: '#263141', fontFamily: Platform.OS === 'ios' ? 'Myanmar Sangam MN' : 'sans-serif' },
  eyeIcon: { minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  googleButton: { minHeight: 44, flexDirection: 'row', backgroundColor: '#FFF', borderWidth: 1, borderColor: '#DCE1E9', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginTop: 13 },
  googleButtonText: { color: '#374151', fontSize: 13, fontWeight: '700', fontFamily: Platform.OS === 'ios' ? 'Myanmar Sangam MN' : 'sans-serif' },
  consentRow: { flexDirection: 'row', alignItems: 'flex-start', marginTop: 14 },
  checkbox: { width: 30, minHeight: 30, alignItems: 'flex-start', justifyContent: 'center' },
  checkboxMark: { fontSize: 21, color: '#B71C1C' },
  consentText: { color: '#4B5563', fontSize: 12, lineHeight: 18, fontFamily: Platform.OS === 'ios' ? 'Myanmar Sangam MN' : 'sans-serif' },
  policyLink: { color: '#1769AA', fontSize: 11, fontWeight: '700', marginTop: 3, fontFamily: Platform.OS === 'ios' ? 'Myanmar Sangam MN' : 'sans-serif' },
  submitBtn: { backgroundColor: '#C62828', minHeight: 46, paddingVertical: 12, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginTop: 13 },
  submitBtnText: { color: '#FFF', fontWeight: '800', fontSize: 14, fontFamily: Platform.OS === 'ios' ? 'Myanmar Sangam MN' : 'sans-serif' },
  resetLinkButton: { marginTop: 12, minHeight: 34, alignItems: 'center', justifyContent: 'center' },
  switchText: { color: '#1769AA', fontSize: 12, fontWeight: '700', textAlign: 'center', fontFamily: Platform.OS === 'ios' ? 'Myanmar Sangam MN' : 'sans-serif' },
  registerDivider: { flexDirection: 'row', alignItems: 'center', marginTop: 12, marginBottom: 9 },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#E7EAF0' },
  registerPrompt: { color: '#707989', fontSize: 11, paddingHorizontal: 8, textAlign: 'center', fontFamily: Platform.OS === 'ios' ? 'Myanmar Sangam MN' : 'sans-serif' },
  registerActions: { flexDirection: 'row', justifyContent: 'space-between' },
  emailRegisterButton: { width: '48.5%', minHeight: 42, paddingHorizontal: 6, borderRadius: 9, backgroundColor: '#F7F8FA', borderWidth: 1, borderColor: '#DCE1E9', alignItems: 'center', justifyContent: 'center' },
  emailRegisterText: { color: '#3E4857', fontSize: 11, fontWeight: '700', textAlign: 'center', fontFamily: Platform.OS === 'ios' ? 'Myanmar Sangam MN' : 'sans-serif' },
  googleRegisterButton: { width: '48.5%', minHeight: 42, paddingHorizontal: 6, borderRadius: 9, backgroundColor: '#F7F8FA', borderWidth: 1, borderColor: '#DCE1E9', alignItems: 'center', justifyContent: 'center' },
  googleRegisterText: { color: '#3E4857', fontSize: 11, fontWeight: '700', textAlign: 'center', fontFamily: Platform.OS === 'ios' ? 'Myanmar Sangam MN' : 'sans-serif' },
  guestPanel: { alignItems: 'center', paddingTop: 7, paddingBottom: 4 },
  guestIcon: { fontSize: 42, marginBottom: 7 },
  guestTitle: { color: '#252B36', fontSize: 17, fontWeight: '800', textAlign: 'center', fontFamily: Platform.OS === 'ios' ? 'Myanmar Sangam MN' : 'sans-serif' },
  guestHint: { fontSize: 13, lineHeight: 20, color: '#596273', marginTop: 9, textAlign: 'center', fontFamily: Platform.OS === 'ios' ? 'Myanmar Sangam MN' : 'sans-serif' },
  guestBtn: { width: '100%', minHeight: 48, marginTop: 20, padding: 12, borderRadius: 10, backgroundColor: '#1769AA', alignItems: 'center', justifyContent: 'center' },
  guestBtnText: { fontSize: 14, fontWeight: '800', color: '#FFF', fontFamily: Platform.OS === 'ios' ? 'Myanmar Sangam MN' : 'sans-serif' },
  apkDownloadButton: { minHeight: 60, marginTop: 14, paddingHorizontal: 15, paddingVertical: 11, borderRadius: 13, backgroundColor: '#B71C1C', flexDirection: 'row', alignItems: 'center', elevation: 3, shadowColor: '#7F1D1D', shadowOpacity: 0.18, shadowRadius: 8, shadowOffset: { width: 0, height: 4 } },
  apkDownloadIcon: { fontSize: 24, marginRight: 12 },
  apkDownloadTitle: { color: '#FFF', fontSize: 14, fontWeight: '800', fontFamily: Platform.OS === 'ios' ? 'Myanmar Sangam MN' : 'sans-serif' },
  apkDownloadDesc: { color: '#FFCDD2', fontSize: 11, marginTop: 2, fontFamily: Platform.OS === 'ios' ? 'Myanmar Sangam MN' : 'sans-serif' },
  apkDownloadArrow: { color: '#FFF', fontSize: 25, marginLeft: 8 },
  instructionText: { fontSize: 11, color: '#667085', textAlign: 'center', marginBottom: 10, lineHeight: 17, fontFamily: Platform.OS === 'ios' ? 'Myanmar Sangam MN' : 'sans-serif' },
  errorBox: { backgroundColor: '#FFF1F1', borderWidth: 1, borderColor: '#F1B5B5', borderRadius: 10, padding: 11, marginBottom: 8 },
  errorText: { color: '#A52222', fontSize: 12, lineHeight: 18 },
  infoBox: { backgroundColor: '#EFF7FF', borderWidth: 1, borderColor: '#B8D7F4', borderRadius: 10, padding: 11, marginBottom: 8 },
  infoText: { color: '#145A8D', fontSize: 12, lineHeight: 18 },
  policyOverlay: { flex: 1, justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.55)', padding: 20 },
  policyBox: { backgroundColor: '#FFF', borderRadius: 16, padding: 18 },
  policyTitle: { fontSize: 15, fontWeight: 'bold', textAlign: 'center', marginBottom: 10 },
  policyBody: { fontSize: 12, color: '#333', lineHeight: 19 },
  policyBtn: { flex: 1, paddingVertical: 10, borderRadius: 9, alignItems: 'center' },
  policyBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 13 },
});

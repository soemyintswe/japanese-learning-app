import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator, Modal } from 'react-native';
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
import { resolveUserProfile } from '../src/session';
import { useLanguage } from '../src/LanguageContext';
import { POLICY } from '../src/privacyPolicy';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CONSENT_KEY = '@japanese_privacy_consent_v1';

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
    noAccount: 'အကောင့်မရှိသေးဘူးလား? အသစ်စာရင်းသွင်းရန်',
    hasAccount: 'အကောင့်ရှိပြီးသားလား? Login သို့ ပြန်သွားရန်',
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
    noAccount: "Don't have an account? Sign Up",
    hasAccount: 'Already have an account? Sign In',
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
    noAccount: 'アカウントをお持ちではありませんか？',
    hasAccount: 'すでにアカウントをお持ちですか？',
  }
};

export default function AuthScreen({ onLoginSuccess, notice }) {
  const { lang, setLang } = useLanguage();
  const t = translations[lang] || translations.my;

  const [step, setStep] = useState('login');

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
            : 'Firestore Rules ကြောင့် profile ဖတ်မရပါ။ Firebase Console > Firestore > Rules မှာ firestore.rules file အတိုင်း ထည့်ပေးပါ။'
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
    const rEmail = regEmail.trim();
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

      if (!p.isAdmin && p.status !== 'active') {
        await signOut(auth);
        showInfo('Register အောင်မြင်ပါပြီ ✅ — Admin အတည်ပြုရန် (Active လုပ်ရန်) စောင့်နေပါတယ် ⏳။ Approve ပြီးရင် Login ဝင်လို့ရပြီ။');
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
          : 'Firestore Rules ကြောင့် profile ဖတ်မရပါ။ Firebase Console > Firestore > Rules မှာ firestore.rules file အတိုင်း ထည့်ပေးပါ။'
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
          <View style={styles.card}>
            {/* Language Switcher */}
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

            <Text style={{ fontSize: 40, textAlign: 'center', marginBottom: 8 }}>🎓</Text>
            <Text style={styles.title}>{t.title}</Text>

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

            {step === 'login' && (
              <>
                <Text style={styles.subtitle}>{t.login}</Text>
                {/* Role မရွေးခိုင်းတော့ — login ဝင်တဲ့ user ရဲ့ Firestore profile (role/status) ကနေ
                    Admin/Teacher/Student အလိုအလျောက် ခွဲမယ် (resolveUserProfile) */}

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
                  style={{ flexDirection: 'row', alignItems: 'center', marginTop: 10 }}
                  onPress={() => setPolicyVisible(true)}
                >
                  <TouchableOpacity onPress={async () => {
                    const v = !consent;
                    setConsent(v);
                    try {
                      await AsyncStorage.setItem(CONSENT_KEY, v ? 'yes' : 'no');
                    } catch (e) {}
                    if (v) clearMsg();
                  }}>
                    <Text style={{ fontSize: 18 }}>{consent ? '☑️' : '⬜'}</Text>
                  </TouchableOpacity>
                  <Text style={[styles.switchText, { marginLeft: 6, flex: 1 }]} onPress={() => setPolicyVisible(true)}>
                    {policy.consent}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.submitBtn} onPress={handleAuthAction}>
                  {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitBtnText}>{t.loginBtn}</Text>}
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handlePasswordReset}
                  disabled={resetSending}
                  style={{ marginTop: 10, alignItems: 'center' }}
                >
                  <Text style={styles.switchText}>
                    {resetSending ? 'Email ပို့နေပါတယ်...' : '🔑 Password မရှိသေးလား / မေ့နေလား? Password သတ်မှတ်ရန် email ပို့မယ်'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.googleButton} 
                  onPress={handleGoogleRegister}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <>
                      <Text style={{ fontSize: 16, color: '#fff', fontWeight: 'bold', marginRight: 8 }}>G</Text>
                      <Text style={styles.googleButtonText}>Google အကောင့်ဖြင့် ဝင်မည် / Register လုပ်မည်</Text>
                    </>
                  )}
                </TouchableOpacity>

                <TouchableOpacity onPress={() => setStep('register')} style={{ marginTop: 15, alignItems: 'center' }}>
                  <Text style={styles.switchText}>{t.noAccount}</Text>
                </TouchableOpacity>
              </>
            )}

            {step === 'register' && (
              <>
                <Text style={styles.subtitle}>{t.register}</Text>

                <Text style={styles.instructionText}>
                  {lang === 'my' ? 'Email နဲ့ Register လုပ်ပါ — အကောင့် တကယ် ဖွင့်ပေးမယ် (Admin အတည်ပြုပြီးမှ ဝင်နိုင်မည်)' : 'Register with your Email (Requires Admin Approval)'}
                </Text>

                <Text style={styles.label}>အမည် (Name):</Text>
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

                <Text style={styles.label}>Password (အနည်းဆုံး ၆ လုံး):</Text>
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

                <TouchableOpacity
                  style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}
                  onPress={() => setPolicyVisible(true)}
                >
                  <TouchableOpacity onPress={async () => {
                    const v = !consent;
                    setConsent(v);
                    try {
                      await AsyncStorage.setItem(CONSENT_KEY, v ? 'yes' : 'no');
                    } catch (e) {}
                    if (v) clearMsg();
                  }}>
                    <Text style={{ fontSize: 18 }}>{consent ? '☑️' : '⬜'}</Text>
                  </TouchableOpacity>
                  <Text style={[styles.switchText, { marginLeft: 6, flex: 1 }]} onPress={() => setPolicyVisible(true)}>
                    {policy.consent}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.submitBtn, { backgroundColor: '#2E7D32' }]}
                  onPress={handleEmailRegister}
                  disabled={regLoading}
                >
                  {regLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitBtnText}>📧 Email နဲ့ Register လုပ်မည်</Text>}
                </TouchableOpacity>

                <Text style={[styles.instructionText, { marginTop: 12 }]}>
                  — သို့မဟုတ် —
                </Text>

                <TouchableOpacity
                  style={styles.googleButton}
                  onPress={handleGoogleRegister}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <>
                      <Text style={{ fontSize: 16, color: '#fff', fontWeight: 'bold', marginRight: 8 }}>G</Text>
                      <Text style={styles.googleButtonText}>{t.googleRegisterBtn}</Text>
                    </>
                  )}
                </TouchableOpacity>

                <TouchableOpacity onPress={() => setStep('login')} style={{ marginTop: 20, alignItems: 'center' }}>
                  <Text style={styles.switchText}>{t.hasAccount}</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
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
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  scrollContainer: { flexGrow: 1, justifyContent: 'center', padding: 20 },
  card: { backgroundColor: '#FFFFFF', borderRadius: 15, padding: 20, elevation: 4 },
  langRow: { flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 8 },
  langBtn: { paddingHorizontal: 6, paddingVertical: 2, borderWidth: 1, borderColor: '#DDD', borderRadius: 4, marginLeft: 4 },
  langBtnActive: { backgroundColor: '#D32F2F', borderColor: '#D32F2F' },
  langText: { fontSize: 10, color: '#666', fontWeight: 'bold', fontFamily: Platform.OS === 'ios' ? 'Myanmar Sangam MN' : 'sans-serif' },
  langTextActive: { color: '#FFF' },
  title: { fontSize: 16, fontWeight: 'bold', color: '#333', textAlign: 'center', marginBottom: 4, fontFamily: Platform.OS === 'ios' ? 'Myanmar Sangam MN' : 'sans-serif' },
  subtitle: { fontSize: 13, fontWeight: '600', color: '#555', textAlign: 'center', marginBottom: 10, fontFamily: Platform.OS === 'ios' ? 'Myanmar Sangam MN' : 'sans-serif' },
  roleRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  roleBtn: { flex: 1, paddingVertical: 6, borderWidth: 1, borderColor: '#DDD', borderRadius: 6, alignItems: 'center', marginRight: 4 },
  roleBtnActive: { backgroundColor: '#D32F2F', borderColor: '#D32F2F' },
  roleText: { fontSize: 11, fontWeight: 'bold', color: '#666', fontFamily: Platform.OS === 'ios' ? 'Myanmar Sangam MN' : 'sans-serif' },
  roleTextActive: { color: '#FFF' },
  label: { fontSize: 11, fontWeight: '600', color: '#555', marginBottom: 2, marginTop: 6, fontFamily: Platform.OS === 'ios' ? 'Myanmar Sangam MN' : 'sans-serif' },
  input: { borderWidth: 1, borderColor: '#DDD', borderRadius: 6, paddingHorizontal: 10, paddingVertical: 6, fontSize: 12, color: '#333', backgroundColor: '#FAFAFA', fontFamily: Platform.OS === 'ios' ? 'Myanmar Sangam MN' : 'sans-serif' },
  passwordContainer: { flexDirection: 'row', borderWidth: 1, borderColor: '#DDD', borderRadius: 6, alignItems: 'center', backgroundColor: '#FAFAFA' },
  passwordInput: { flex: 1, paddingHorizontal: 10, paddingVertical: 6, fontSize: 12, color: '#333', fontFamily: Platform.OS === 'ios' ? 'Myanmar Sangam MN' : 'sans-serif' },
  eyeIcon: { padding: 8 },
  submitBtn: { backgroundColor: '#D32F2F', paddingVertical: 10, borderRadius: 6, alignItems: 'center', marginTop: 12 },
  submitBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 13, fontFamily: Platform.OS === 'ios' ? 'Myanmar Sangam MN' : 'sans-serif' },
  googleButton: { flexDirection: 'row', backgroundColor: '#4285F4', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 6, alignItems: 'center', justifyContent: 'center', marginTop: 15, elevation: 2 },
  googleButtonText: { color: '#fff', fontSize: 12, fontWeight: '600', fontFamily: Platform.OS === 'ios' ? 'Myanmar Sangam MN' : 'sans-serif' },
  instructionText: { fontSize: 11, color: '#666', textAlign: 'center', marginBottom: 10, fontFamily: Platform.OS === 'ios' ? 'Myanmar Sangam MN' : 'sans-serif' },
  switchText: { color: '#1976D2', fontSize: 11, fontWeight: '600', fontFamily: Platform.OS === 'ios' ? 'Myanmar Sangam MN' : 'sans-serif' },
  errorBox: { backgroundColor: '#FFEBEE', borderWidth: 1, borderColor: '#EF9A9A', borderRadius: 8, padding: 10, marginTop: 8, marginBottom: 4 },
  errorText: { color: '#C62828', fontSize: 12, lineHeight: 17 },
  infoBox: { backgroundColor: '#E3F2FD', borderWidth: 1, borderColor: '#90CAF9', borderRadius: 8, padding: 10, marginTop: 8, marginBottom: 4 },
  infoText: { color: '#1565C0', fontSize: 12, lineHeight: 17 },
  policyOverlay: { flex: 1, justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.55)', padding: 20 },
  policyBox: { backgroundColor: '#FFF', borderRadius: 12, padding: 18 },
  policyTitle: { fontSize: 15, fontWeight: 'bold', textAlign: 'center', marginBottom: 10 },
  policyBody: { fontSize: 12, color: '#333', lineHeight: 19 },
  policyBtn: { flex: 1, paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
  policyBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 13 },
});
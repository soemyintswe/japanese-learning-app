// components/ForceChangePassword.js — ကနဦး password နဲ့ ဝင်လာသူ blocking gate
// Admin ပေးတဲ့ temp password → user ကိုယ်တိုင် စိတ်ကြိုက် password ပြောင်း → flag ရှင်း → app ဝင်
import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, ActivityIndicator, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { updatePassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../src/firebase';
import { useLanguage } from '../src/LanguageContext';

const t = {
  my: {
    title: '🔑 Password အသစ် သတ်မှတ်ပါ', sub: 'Admin ပေးထားတဲ့ ကနဦး password နဲ့ ဝင်ထားပါတယ်။\nဆက်သုံးဖို့ ကိုယ့်စိတ်ကြိုက် password ပြောင်းရမယ်။',
    nl: 'Password အသစ် (၆ လုံးအထက်):', cf: 'ထပ်ရိုက်ပါ (အတည်ပြု):',
    go: 'ပြောင်းပြီး ဆက်သုံးမည်', logout: 'Logout ထွက်မည်',
    errFill: 'Password အသစ် ၂ ခုလုံး ဖြည့်ပါ။', errLen: 'အနည်းဆုံး ၆ လုံး ဖြစ်ရမယ်။',
    errMatch: '၂ ခု တူညီမှု မရှိဘူး — ပြန်ရိုက်ပါ။', done: 'ပြောင်းပြီးပါပြီ ✅',
    recent: 'Session ကြာနေလို့: Logout → ကနဦး password နဲ့ Login ပြန်ဝင် → ဒီမှာ ပြောင်းပါ။',
  },
  en: {
    title: '🔑 Set a New Password', sub: 'You logged in with an admin-issued initial password.\nSet your own password to continue.',
    nl: 'New password (6+ chars):', cf: 'Confirm:',
    go: 'Change & Continue', logout: 'Log Out',
    errFill: 'Fill both fields.', errLen: 'Minimum 6 characters.',
    errMatch: 'Passwords do not match.', done: 'Changed ✅',
    recent: 'Session too old: log out → log back in with the initial password → change here.',
  },
  jp: {
    title: '🔑 新パスワード設定', sub: '初期パスワードでログイン中。\n続けるには変更が必要。',
    nl: '新しいパスワード（6文字以上）:', cf: '確認:',
    go: '変更して続ける', logout: 'ログアウト',
    errFill: '両方入力。', errLen: '6文字以上。',
    errMatch: '不一致。', done: '変更 ✅',
    recent: '再ログインしてから変更してください。',
  },
};

export default function ForceChangePassword({ user, onChanged, onLogout }) {
  const { lang } = useLanguage();
  const x = t[lang] || t.my;
  const [pw1, setPw1] = useState('');
  const [pw2, setPw2] = useState('');
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [isErr, setIsErr] = useState(false);

  const submit = async () => {
    if (!pw1.trim() || !pw2.trim()) {
      setIsErr(true); setMsg(x.errFill); return;
    }
    if (pw1.trim().length < 6) {
      setIsErr(true); setMsg(x.errLen); return;
    }
    if (pw1.trim() !== pw2.trim()) {
      setIsErr(true); setMsg(x.errMatch); return;
    }
    setLoading(true);
    try {
      const cu = auth.currentUser;
      if (!cu) {
        setIsErr(true); setMsg(x.recent); return;
      }
      await updatePassword(cu, pw1.trim());
      try {
        await setDoc(doc(db, 'users', user.uid), { mustChangePassword: false }, { merge: true });
      } catch (e) {}
      setIsErr(false); setMsg(x.done);
      setTimeout(() => { if (onChanged) onChanged(); }, 600);
    } catch (e) {
      setIsErr(true);
      setMsg(e.code === 'auth/requires-recent-login' ? x.recent : String(e.message || e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.card}>
        <Text style={{ fontSize: 44, textAlign: 'center' }}>🔑</Text>
        <Text style={styles.title}>{x.title}</Text>
        <Text style={styles.sub}>{x.sub}</Text>
        {!!msg && (
          <View style={[styles.msgBox, isErr ? styles.errBox : styles.okBox]}>
            <Text style={[styles.msgText, isErr ? styles.errText : styles.okText]}>{msg}</Text>
          </View>
        )}
        <Text style={styles.label}>{x.nl}</Text>
        <TextInput
          style={styles.input} value={pw1} onChangeText={setPw1}
          placeholder="••••••" placeholderTextColor="#999"
          secureTextEntry={!show} autoCapitalize="none"
        />
        <Text style={styles.label}>{x.cf}</Text>
        <TextInput
          style={styles.input} value={pw2} onChangeText={setPw2}
          placeholder="••••••" placeholderTextColor="#999"
          secureTextEntry={!show} autoCapitalize="none"
          returnKeyType="done" onSubmitEditing={submit}
        />
        <TouchableOpacity onPress={() => setShow(!show)} style={{ marginTop: 8, alignItems: 'center' }}>
          <Text style={styles.showText}>{show ? '🙈' : '👁️'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.goBtn} onPress={submit} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.goText}>{x.go}</Text>}
        </TouchableOpacity>
        <TouchableOpacity onPress={onLogout} style={{ marginTop: 14, alignItems: 'center' }}>
          <Text style={styles.outText}>{x.logout}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA', justifyContent: 'center', padding: 20 },
  card: { backgroundColor: '#FFF', borderRadius: 15, padding: 22, elevation: 4 },
  title: { fontSize: 17, fontWeight: 'bold', textAlign: 'center', marginVertical: 8, fontFamily: Platform.OS === 'ios' ? 'Myanmar Sangam MN' : 'sans-serif' },
  sub: { fontSize: 12, color: '#666', textAlign: 'center', lineHeight: 18, marginBottom: 8 },
  msgBox: { borderWidth: 1, borderRadius: 8, padding: 10, marginTop: 8 },
  errBox: { backgroundColor: '#FFEBEE', borderColor: '#EF9A9A' },
  okBox: { backgroundColor: '#E8F5E9', borderColor: '#A5D6A7' },
  msgText: { fontSize: 12, lineHeight: 17 },
  errText: { color: '#C62828' },
  okText: { color: '#2E7D32' },
  label: { fontSize: 12, fontWeight: '600', color: '#555', marginTop: 10, marginBottom: 4 },
  input: { borderWidth: 1, borderColor: '#DDD', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 9, fontSize: 15, backgroundColor: '#FAFAFA' },
  showText: { fontSize: 20 },
  goBtn: { backgroundColor: '#D32F2F', paddingVertical: 12, borderRadius: 8, alignItems: 'center', marginTop: 14 },
  goText: { color: '#FFF', fontWeight: 'bold', fontSize: 14 },
  outText: { color: '#1976D2', fontSize: 12, fontWeight: '600' },
});

import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const translations = {
  my: {
    title: 'ဂျပန်စာ လေ့လာမှု စီမံစနစ်',
    login: 'အကောင့်ဝင်ရန် (Login)',
    register: 'အကောင့်အသစ် ဖန်တီးရန်',
    student: '🎓 ကျောင်းသား',
    teacher: '👨‍🏫 ဆရာ (Admin)',
    username: 'Username သို့မဟုတ် Email:',
    password: 'စကားဝှက် (Password):',
    name: 'အမည်ပြည့်စုံ (Full Name):',
    phone: 'ဖုန်းနံပါတ် (Phone Number):',
    loginBtn: 'ဝင်ရောက်မည် (Login)',
    registerBtn: 'အကောင့်စာရင်းသွင်းမည်',
    noAccount: 'အကောင့်မရှိသေးဘူးလား? အသစ်စာရင်းသွင်းရန်',
    hasAccount: 'အကောင့်ရှိပြီးသားလား? Login သို့ ပြန်သွားရန်',
  },
  en: {
    title: 'Japanese Study Planner',
    login: 'Sign In (Login)',
    register: 'Create New Account',
    student: '🎓 Student',
    teacher: '👨‍🏫 Teacher (Admin)',
    username: 'Username or Email:',
    password: 'Password:',
    name: 'Full Name:',
    phone: 'Phone Number:',
    loginBtn: 'Login',
    registerBtn: 'Register',
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
    registerBtn: '登録する',
    noAccount: 'アカウントをお持ちではありませんか？',
    hasAccount: 'すでにアカウントをお持ちですか？',
  }
};

export default function AuthScreen({ onLoginSuccess }) {
  const [lang, setLang] = useState('my');
  const t = translations[lang];

  const [step, setStep] = useState('login');
  const [role, setRole] = useState('student');
  
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleAuthAction = () => {
    if (step === 'login') {
      if ((username === 'soemyintswe@gmail.com' || email === 'soemyintswe@gmail.com') && password === '***REMOVED***') {
        onLoginSuccess({ name: 'ဦးစိုးမြင့်ဆွေ (Admin)', role: 'teacher', email: 'soemyintswe@gmail.com', lang });
        return;
      }
      if ((!username.trim() && !email.trim()) || !password.trim()) {
        Alert.alert('Error', 'Please fill in all required fields.');
        return;
      }
      onLoginSuccess({ name: username || 'User', role, email: email || 'user@gmail.com', lang });
    } 
    else if (step === 'register') {
      if (!username.trim() || !name.trim() || !email.trim() || !phone.trim() || !password.trim()) {
        Alert.alert('Error', 'Please fill in all fields.');
        return;
      }
      Alert.alert('Success', `Account created successfully!\nTemp Password: ${password}`);
      setStep('login');
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

            <Ionicons name="school" size={40} color="#D32F2F" style={{ alignSelf: 'center', marginBottom: 8 }} />
            <Text style={styles.title}>{t.title}</Text>

            {step === 'login' && (
              <>
                <Text style={styles.subtitle}>{t.login}</Text>
                
                <View style={styles.roleRow}>
                  <TouchableOpacity style={[styles.roleBtn, role === 'student' && styles.roleBtnActive]} onPress={() => setRole('student')}>
                    <Text style={[styles.roleText, role === 'student' && styles.roleTextActive]}>{t.student}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.roleBtn, role === 'teacher' && styles.roleBtnActive]} onPress={() => setRole('teacher')}>
                    <Text style={[styles.roleText, role === 'teacher' && styles.roleTextActive]}>{t.teacher}</Text>
                  </TouchableOpacity>
                </View>

                <Text style={styles.label}>{t.username}</Text>
                <TextInput style={styles.input} placeholder="username / soemyintswe@gmail.com" value={username} onChangeText={setUsername} />

                <Text style={styles.label}>{t.password}</Text>
                <View style={styles.passwordContainer}>
                  <TextInput 
                    style={styles.passwordInput} 
                    placeholder="Password" 
                    value={password} 
                    onChangeText={setPassword} 
                    secureTextEntry={!showPassword} 
                  />
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                    <Ionicons name={showPassword ? "eye-off" : "eye"} size={20} color="#666" />
                  </TouchableOpacity>
                </View>

                <TouchableOpacity style={styles.submitBtn} onPress={handleAuthAction}>
                  <Text style={styles.submitBtnText}>{t.loginBtn}</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => setStep('register')} style={{ marginTop: 15, alignItems: 'center' }}>
                  <Text style={styles.switchText}>{t.noAccount}</Text>
                </TouchableOpacity>
              </>
            )}

            {step === 'register' && (
              <>
                <Text style={styles.subtitle}>{t.register}</Text>

                <Text style={styles.label}>{t.name}</Text>
                <TextInput style={styles.input} placeholder="Full Name" value={name} onChangeText={setName} />

                <Text style={styles.label}>Username:</Text>
                <TextInput style={styles.input} placeholder="Username" value={username} onChangeText={setUsername} />

                <Text style={styles.label}>Email:</Text>
                <TextInput style={styles.input} placeholder="email@gmail.com" value={email} onChangeText={setEmail} />

                <Text style={styles.label}>{t.phone}</Text>
                <TextInput style={styles.input} placeholder="09xxxxxxxxx" value={phone} onChangeText={setPhone} />

                <Text style={styles.label}>{t.password}</Text>
                <View style={styles.passwordContainer}>
                  <TextInput 
                    style={styles.passwordInput} 
                    placeholder="Password" 
                    value={password} 
                    onChangeText={setPassword} 
                    secureTextEntry={!showPassword} 
                  />
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                    <Ionicons name={showPassword ? "eye-off" : "eye"} size={20} color="#666" />
                  </TouchableOpacity>
                </View>

                <TouchableOpacity style={styles.submitBtn} onPress={handleAuthAction}>
                  <Text style={styles.submitBtnText}>{t.registerBtn}</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => setStep('login')} style={{ marginTop: 15, alignItems: 'center' }}>
                  <Text style={styles.switchText}>{t.hasAccount}</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
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
  langText: { fontSize: 10, color: '#666', fontWeight: 'bold' },
  langTextActive: { color: '#FFF' },
  title: { fontSize: 16, fontWeight: 'bold', color: '#333', textAlign: 'center', marginBottom: 4 },
  subtitle: { fontSize: 13, fontWeight: '600', color: '#555', textAlign: 'center', marginBottom: 10 },
  roleRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  roleBtn: { flex: 1, paddingVertical: 6, borderWidth: 1, borderColor: '#DDD', borderRadius: 6, alignItems: 'center', marginRight: 4 },
  roleBtnActive: { backgroundColor: '#D32F2F', borderColor: '#D32F2F' },
  roleText: { fontSize: 11, fontWeight: 'bold', color: '#666' },
  roleTextActive: { color: '#FFF' },
  label: { fontSize: 11, fontWeight: '600', color: '#555', marginBottom: 2, marginTop: 6 },
  input: { borderWidth: 1, borderColor: '#DDD', borderRadius: 6, paddingHorizontal: 10, paddingVertical: 6, fontSize: 12, color: '#333', backgroundColor: '#FAFAFA' },
  passwordContainer: { flexDirection: 'row', borderWidth: 1, borderColor: '#DDD', borderRadius: 6, alignItems: 'center', backgroundColor: '#FAFAFA' },
  passwordInput: { flex: 1, paddingHorizontal: 10, paddingVertical: 6, fontSize: 12, color: '#333' },
  eyeIcon: { padding: 8 },
  submitBtn: { backgroundColor: '#D32F2F', paddingVertical: 10, borderRadius: 6, alignItems: 'center', marginTop: 12 },
  submitBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 13 },
  switchText: { color: '#1976D2', fontSize: 11, fontWeight: '600' }
});
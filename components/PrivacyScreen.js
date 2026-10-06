// components/PrivacyScreen.js — PUBLIC privacy page (no login needed)
// URL: https://japanese-mksedu.web.app/privacy (for Google OAuth branding)
import React from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLanguage, LANGS } from '../src/LanguageContext';
import { POLICY } from '../src/privacyPolicy';

export default function PrivacyScreen() {
  const { lang, setLang } = useLanguage();
  const p = POLICY[lang] || POLICY.my;
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.inner}>
        <Text style={{ fontSize: 40, textAlign: 'center' }}>🌸</Text>
        <Text style={styles.app}>Japanese Study Planner (MKS Edu)</Text>
        <View style={styles.langRow}>
          {LANGS.map((l) => (
            <TouchableOpacity
              key={l.code}
              style={[styles.langBtn, lang === l.code && styles.langBtnActive]}
              onPress={() => setLang(l.code)}
            >
              <Text style={[styles.langText, lang === l.code && styles.langTextActive]}>{l.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={styles.card}>
          <Text style={styles.title}>{p.title}</Text>
          <Text style={styles.body}>{p.body}</Text>
        </View>
        <Text style={styles.contact}>Contact: soemyintswe@gmail.com · Yangon, Myanmar</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  inner: { padding: 20, maxWidth: 720, width: '100%', alignSelf: 'center' },
  app: { fontSize: 16, fontWeight: 'bold', textAlign: 'center', marginVertical: 6, color: '#D32F2F' },
  langRow: { flexDirection: 'row', justifyContent: 'center', marginBottom: 12 },
  langBtn: { paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: '#DDD', borderRadius: 6, marginHorizontal: 3, backgroundColor: '#FFF' },
  langBtnActive: { backgroundColor: '#D32F2F', borderColor: '#D32F2F' },
  langText: { fontSize: 11, color: '#666', fontWeight: 'bold' },
  langTextActive: { color: '#FFF' },
  card: { backgroundColor: '#FFF', borderRadius: 12, padding: 20, elevation: 2 },
  title: { fontSize: 16, fontWeight: 'bold', textAlign: 'center', marginBottom: 12 },
  body: { fontSize: 13, color: '#333', lineHeight: 21, fontFamily: Platform.OS === 'ios' ? 'Myanmar Sangam MN' : 'sans-serif' },
  contact: { fontSize: 11, color: '#888', textAlign: 'center', marginTop: 14 },
});

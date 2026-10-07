// MoreScreen — ☰ overflow menu (bottom bar 6 tabs only: Home/Dictionary/Quiz/Class/People/More)
// Hidden-from-bar screens (Planner/Notes/Library/Help + Teacher for staff) live here.
// Navigation + deep-linking (/planner etc.) keep working — tabs are hidden via tabBarButton, not removed.
import React from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLanguage } from '../src/LanguageContext';
import AppHeader from './AppHeader';

const moreT = {
  my: {
    title: '☰ မီနူး',
    planner: 'အချိန်ဇယား', plannerD: 'နေ့စဉ်အစီအစဉ် + တိုးတက်မှု',
    notes: 'မှတ်စု', notesD: 'ကိုယ်ပိုင်မှတ်စုများ',
    library: 'စာကြည့်', libraryD: 'Teacher Drive + Essays',
    help: 'အကူအညီ', helpD: 'အသုံးပြုနည်း လမ်းညွှန်',
    teacher: 'ဆရာ့အပိုင်း', teacherD: 'User စီမံခန့်ခွဲမှု (staff)',
  },
  en: {
    title: '☰ More',
    planner: 'Planner', plannerD: 'Daily plan + progress',
    notes: 'Notes', notesD: 'Personal memos',
    library: 'Library', libraryD: 'Teacher Drive + Essays',
    help: 'Help', helpD: 'How-to guide',
    teacher: 'Teacher', teacherD: 'User management (staff)',
  },
  jp: {
    title: '☰ メニュー',
    planner: 'プランナー', plannerD: '計画＋進捗',
    notes: 'ノート', notesD: 'メモ',
    library: '資料', libraryD: 'Drive＋作文',
    help: 'ヘルプ', helpD: '使い方',
    teacher: '先生', teacherD: '管理 (staff)',
  },
};

const ICONS = { Planner: '📅', Notes: '📝', Library: '📚', Help: '🆘', Teacher: '🎓' };

export default function MoreScreen({ user, onLogout, navigation }) {
  const { lang } = useLanguage();
  const t = moreT[lang] || moreT.my;
  const goProfile = () => { try { navigation.navigate('Community', { seg: 'profile' }); } catch (e) {} };
  const isStaff = user?.role === 'teacher' || user?.role === 'admin';

  const items = [
    { name: 'Planner', title: t.planner, desc: t.plannerD },
    { name: 'Notes', title: t.notes, desc: t.notesD },
    { name: 'Library', title: t.library, desc: t.libraryD },
    { name: 'Help', title: t.help, desc: t.helpD },
  ];
  if (isStaff) items.push({ name: 'Teacher', title: t.teacher, desc: t.teacherD });

  return (
    <SafeAreaView style={styles.container}>
      <AppHeader title={t.title} user={user} onLogout={onLogout} onProfilePress={goProfile} />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {items.map((it) => (
          <TouchableOpacity
            key={it.name}
            style={styles.card}
            onPress={() => { try { navigation.navigate(it.name); } catch (e) {} }}
            activeOpacity={0.8}
          >
            <Text style={{ fontSize: 28, marginRight: 12 }}>{ICONS[it.name]}</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>{it.title}</Text>
              <Text style={styles.desc}>{it.desc}</Text>
            </View>
            <Text style={{ fontSize: 18, color: '#D32F2F' }}>›</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  scroll: { padding: 12 },
  card: { backgroundColor: '#FFF', borderRadius: 10, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: '#EEE', flexDirection: 'row', alignItems: 'center' },
  title: { fontSize: 15, fontWeight: 'bold', color: '#333' },
  desc: { fontSize: 11, color: '#888', marginTop: 2 },
});

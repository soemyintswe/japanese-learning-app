import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, RefreshControl, ImageBackground, Platform, ActivityIndicator } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from './src/firebase';
import { resolveUserProfile } from './src/session';
import { LanguageProvider, useLanguage } from './src/LanguageContext';
import AppHeader from './components/AppHeader';

// Web back/refresh မှာ tab မပျောက်အောင် URL နဲ့ ချိတ်မယ်
// (ဥပမာ အဘိဓာန် tab → /dictionary) — browser back နှိပ်ရင် tab ချင်း ရွှေ့မယ်
const linking = {
  prefixes: [],
  config: {
    screens: {
      Home: '',
      Dictionary: 'dictionary',
      Planner: 'planner',
      Notes: 'notes',
      QA: 'qa',
      Teacher: 'teacher',
    },
  },
};

// Modules များ
import AuthScreen from './components/AuthScreen';
import DictionaryScreen from './components/DictionaryScreen';
import PlannerScreen from './components/PlannerScreen';
import NotesScreen from './components/NotesScreen';
import TeacherScreen from './components/TeacherScreen';
import QAScreen from './components/QAScreen';

const homeT = {
  my: {
    progress: 'ယနေ့ လေ့လာမှု တိုးတက်မှု', done: 'ပြီးမြောက်ပြီး', quick: 'အမြန်ဝင်ရောက်ရန် နေရာများ',
    dict: 'အဘိဓာန်', planner: 'အချိန်ဇယား', notes: 'မှတ်စုများ', qa: 'မေးခွန်းဖြေရန်', teacher: 'ဆရာ့အပိုင်းနှင့် အက်ဒမင်',
  },
  en: {
    progress: "Today's Study Progress", done: 'Completed', quick: 'Quick Access',
    dict: 'Dictionary', planner: 'Planner', notes: 'Notes', qa: 'Quiz', teacher: 'Teacher & Admin',
  },
  jp: {
    progress: '今日の学習進捗', done: '完了', quick: 'クイックアクセス',
    dict: '辞書', planner: 'プランナー', notes: 'ノート', qa: 'クイズ', teacher: '先生・管理者',
  },
};

function HomeScreen({ navigation, user, onLogout }) {
  const [refreshing, setRefreshing] = useState(false);
  const [progress, setProgress] = useState('၈၀%');
  const { lang } = useLanguage();
  const t = homeT[lang] || homeT.my;

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      setProgress('၈၅%');
      setRefreshing(false);
    }, 800);
  };

  return (
    <ImageBackground
      source={require('./assets/splash.png')}
      style={styles.backgroundImage}
      blurRadius={3}
    >
      <View style={styles.overlayContainer}>
        <SafeAreaView style={styles.homeContainer}>
          <AppHeader title="🌸 Japanese Study Planner" user={user} onLogout={onLogout} />

          <ScrollView 
            contentContainerStyle={styles.scrollContainer} 
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          >
            {/* Progress Card */}
            <View style={styles.glassCard}>
              <Text style={styles.cardTitle}>{t.progress}</Text>
              <View style={styles.progressRow}>
                <View>
                  <Text style={styles.progressNumber}>{progress}</Text>
                  <Text style={styles.progressSubText}>{t.done}</Text>
                </View>
                <Text style={{fontSize: 30}}>📊</Text>
              </View>
            </View>

            <Text style={styles.sectionTitle}>{t.quick}</Text>

            {/* Quick Links Grid */}
            <View style={styles.quickLinksRow}>
              <TouchableOpacity style={styles.quickCard} onPress={() => navigation.navigate('Dictionary')}>
                <Text style={{fontSize: 24}}>📚</Text>
                <Text style={styles.quickCardText}>{t.dict}</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.quickCard} onPress={() => navigation.navigate('Planner')}>
                <Text style={{fontSize: 24}}>📅</Text>
                <Text style={styles.quickCardText}>{t.planner}</Text>
              </TouchableOpacity>
            </View>

            <View style={[styles.quickLinksRow, { marginTop: 10 }]}>
              <TouchableOpacity style={styles.quickCard} onPress={() => navigation.navigate('Notes')}>
                <Text style={{fontSize: 24}}>📝</Text>
                <Text style={styles.quickCardText}>{t.notes}</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.quickCard} onPress={() => navigation.navigate('QA')}>
                <Text style={{fontSize: 24}}>❓</Text>
                <Text style={styles.quickCardText}>{t.qa}</Text>
              </TouchableOpacity>
            </View>

            {/* Teacher Section Link (Only for Teacher/Admin) */}
            {user?.role === 'teacher' && (
              <View style={[styles.quickLinksRow, { marginTop: 10 }]}>
                <TouchableOpacity style={[styles.quickCard, { width: '100%' }]} onPress={() => navigation.navigate('Teacher')}>
                  <Text style={{fontSize: 24}}>🎓</Text>
                  <Text style={styles.quickCardText}>{t.teacher}</Text>
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>
        </SafeAreaView>
      </View>
    </ImageBackground>
  );
}

const Tab = createBottomTabNavigator();

function Main() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [notice, setNotice] = useState('');

  // Refresh နှိပ်လည်း Firebase session ကျန်နေရင် အလိုအလျောက် ပြန်ဝင်မယ် —
  // အရင် user ကို state မှာပဲ သိမ်းထားလို့ refresh လုပ်တိုင်း logout ထွက်သွားတာ ဒါကြောင့်
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (fbUser) => {
      try {
        if (!fbUser) {
          setUser(null);
          return;
        }
        const p = await resolveUserProfile(fbUser);
        if (!p.isAdmin && p.status !== 'active') {
          await signOut(auth);
          setUser(null);
          setNotice(
            p.firestoreOk
              ? 'သင်၏အကောင့်ကို Admin အတည်ပြုရန် စောင့်နေပါတယ် ⏳ (ACTIVE ဖြစ်မှ ဝင်လို့ရမယ်)'
              : 'Firestore Rules ကြောင့် profile ဖတ်မရပါ။ Firebase Console > Firestore > Rules မှာ firestore.rules file အတိုင်း ထည့်ပေးပါ။'
          );
          return;
        }
        setUser({ name: p.name, role: p.role, email: fbUser.email, uid: fbUser.uid, photoURL: p.photoURL || null });
      } finally {
        setAuthLoading(false);
      }
    });
    return unsub;
  }, []);

  // Logout နှိပ်ရင် Firebase session ကိုပါ အပြီးဖြတ်မယ် (မဟုတ်ရင် auto-restore က ပြန်ဝင်သွားမယ်)
  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (e) {}
    setUser(null);
    setNotice('');
  };

  if (authLoading) {
    return (
      <SafeAreaProvider>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFF' }}>
          <Text style={{ fontSize: 48 }}>🎓</Text>
          <ActivityIndicator size="large" color="#D32F2F" style={{ marginTop: 12 }} />
          <Text style={{ marginTop: 8, color: '#666' }}>ပြန်ဝင်နေပါတယ်…</Text>
        </View>
      </SafeAreaProvider>
    );
  }

  if (!user) {
    return (
      <SafeAreaProvider>
        <AuthScreen
          notice={notice}
          onLoginSuccess={(userData) => { setNotice(''); setUser(userData); }}
        />
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <NavigationContainer linking={linking}>
        <Tab.Navigator
          screenOptions={({ route }) => ({
            headerShown: false,
            tabBarIcon: ({ focused }) => {
              let iconSymbol = '🏠';
              if (route.name === 'Home') iconSymbol = '🏠';
              else if (route.name === 'Dictionary') iconSymbol = '📚';
              else if (route.name === 'Planner') iconSymbol = '📅';
              else if (route.name === 'Notes') iconSymbol = '📝';
              else if (route.name === 'QA') iconSymbol = '❓';
              else if (route.name === 'Teacher') iconSymbol = '🎓';
              return <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.6 }}>{iconSymbol}</Text>;
            },
            tabBarActiveTintColor: '#D32F2F',
            tabBarInactiveTintColor: 'gray',
          })}
        >
          <Tab.Screen name="Home" options={{ title: 'ပင်မ' }}>
            {(props) => <HomeScreen {...props} user={user} onLogout={handleLogout} />}
          </Tab.Screen>
          <Tab.Screen name="Dictionary" options={{ title: 'အဘိဓာန်' }}>
            {(props) => <DictionaryScreen {...props} user={user} onLogout={handleLogout} />}
          </Tab.Screen>
          <Tab.Screen name="Planner" options={{ title: 'အချိန်ဇယား' }}>
            {(props) => <PlannerScreen {...props} user={user} onLogout={handleLogout} />}
          </Tab.Screen>
          <Tab.Screen name="Notes" options={{ title: 'မှတ်စု' }}>
            {(props) => <NotesScreen {...props} user={user} onLogout={handleLogout} />}
          </Tab.Screen>
          <Tab.Screen name="QA" options={{ title: 'မေးခွန်း' }}>
            {(props) => <QAScreen {...props} user={user} onLogout={handleLogout} />}
          </Tab.Screen>
          
          {/* Teacher Tab ကို Teacher Role ရှိမှသာပြသမည် */}
          {user?.role === 'teacher' && (
            <Tab.Screen name="Teacher" options={{ title: 'ဆရာ့အပိုင်း' }}>
              {(props) => <TeacherScreen {...props} currentUser={user} onLogout={handleLogout} />}
            </Tab.Screen>
          )}
        </Tab.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <Main />
    </LanguageProvider>
  );
}

const styles = StyleSheet.create({
  backgroundImage: { flex: 1, width: '100%', height: '100%' },
  overlayContainer: { flex: 1, backgroundColor: 'rgba(255, 255, 255, 0.88)' },
  homeContainer: { flex: 1 },
  headerHome: { paddingHorizontal: 15, paddingVertical: 12, backgroundColor: 'rgba(255,255,255,0.9)', borderBottomWidth: 1, borderBottomColor: '#EFEFEF', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  logoutIconBtn: { padding: 6, backgroundColor: '#FFEBEE', borderRadius: 20 },
  appMainTitle: { fontSize: 15, fontWeight: 'bold', color: '#D32F2F', marginBottom: 2, fontFamily: Platform.OS === 'ios' ? 'Myanmar Sangam MN' : 'sans-serif' },
  appSubTitle: { fontSize: 11, color: '#666', fontFamily: Platform.OS === 'ios' ? 'Myanmar Sangam MN' : 'sans-serif' },
  scrollContainer: { padding: 12 },
  glassCard: { backgroundColor: 'rgba(255,255,255,0.95)', borderRadius: 10, padding: 15, marginBottom: 12, elevation: 2, borderWidth: 1, borderColor: '#EEE' },
  cardTitle: { fontSize: 13, fontWeight: '600', color: '#333', marginBottom: 6, fontFamily: Platform.OS === 'ios' ? 'Myanmar Sangam MN' : 'sans-serif' },
  progressRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  progressNumber: { fontSize: 20, fontWeight: 'bold', color: '#D32F2F' },
  progressSubText: { fontSize: 11, color: '#666', fontFamily: Platform.OS === 'ios' ? 'Myanmar Sangam MN' : 'sans-serif' },
  sectionTitle: { fontSize: 13, fontWeight: 'bold', color: '#333', marginBottom: 8, marginTop: 4, fontFamily: Platform.OS === 'ios' ? 'Myanmar Sangam MN' : 'sans-serif' },
  quickLinksRow: { flexDirection: 'row', justifyContent: 'space-between' },
  quickCard: { backgroundColor: 'rgba(255,255,255,0.95)', width: '48%', padding: 12, borderRadius: 8, alignItems: 'center', elevation: 2, borderWidth: 1, borderColor: '#EEE' },
  quickCardText: { marginTop: 4, fontSize: 12, fontWeight: 'bold', color: '#333', fontFamily: Platform.OS === 'ios' ? 'Myanmar Sangam MN' : 'sans-serif' },
});
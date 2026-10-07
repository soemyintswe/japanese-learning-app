import './src/webAlertPolyfill';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, RefreshControl, ImageBackground, Platform, ActivityIndicator } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { NavigationContainer, useFocusEffect } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from './src/firebase';
import { resolveUserProfile } from './src/session';
import { logActivity } from './src/activity';
import { LanguageProvider, useLanguage } from './src/LanguageContext';
import { usePresence, markActiveNow } from './src/presence';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Planner storage key (PlannerScreen နဲ့ အတူတူ) + subject slots (မနက် 5 + ည 5)
const PLANNER_KEY = '@japanese_planner_v1';
const PLANNER_SLOTS = 10;

// တကယ့် data ကနေ ယနေ့ တိုးတက်မှု တွက် — data မရှိရင် 0% (အတုမပြ)
async function computeTodayProgress() {
  try {
    const now = new Date();
    const key = `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`;
    const raw = await AsyncStorage.getItem(PLANNER_KEY);
    if (!raw) return { pct: 0, done: 0, total: PLANNER_SLOTS };
    const all = JSON.parse(raw);
    const day = all[key];
    if (!day) return { pct: 0, done: 0, total: PLANNER_SLOTS };
    let done = 0;
    ['morning', 'evening'].forEach((s) => {
      const sess = day[s] || {};
      Object.keys(sess).forEach((k) => { if (sess[k]) done += 1; });
    });
    done = Math.min(done, PLANNER_SLOTS);
    return { pct: Math.round((done / PLANNER_SLOTS) * 100), done, total: PLANNER_SLOTS };
  } catch (e) {
    return { pct: 0, done: 0, total: PLANNER_SLOTS };
  }
}
import { NotificationProvider, navRef } from './src/notifications';
import NotificationPanel from './components/NotificationPanel';
import ForceChangePassword from './components/ForceChangePassword';
import PrivacyScreen from './components/PrivacyScreen';
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
      Community: 'community',
      Materials: 'materials',
      Teaching: 'teaching',
      Help: 'help',
      More: 'more',
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
import CommunityScreen from './components/CommunityScreen';
import MaterialsScreen from './components/MaterialsScreen';
import TeachingScreen from './components/TeachingScreen';
import HelpScreen from './components/HelpScreen';
import MoreScreen from './components/MoreScreen';

const homeT = {
  my: {
    progress: 'ယနေ့ လေ့လာမှု တိုးတက်မှု', done: 'ပြီးမြောက်ပြီး', quick: 'အမြန်ဝင်ရောက်ရန် နေရာများ',
    dict: 'အဘိဓာန်', planner: 'အချိန်ဇယား', notes: 'မှတ်စုများ', qa: 'မေးခွန်းဖြေရန်', teacher: 'ဆရာ့အပိုင်းနှင့် အက်ဒမင်',
    people: 'အဖွဲ့', library: 'စာကြည့်', klass: 'သင်ခန်း', help: 'အကူအညီ', more: 'မီနူး',
  },
  en: {
    progress: "Today's Study Progress", done: 'Completed', quick: 'Quick Access',
    dict: 'Dictionary', planner: 'Planner', notes: 'Notes', qa: 'Quiz', teacher: 'Teacher & Admin',
    people: 'People', library: 'Library', klass: 'Class', help: 'Help', more: 'More',
  },
  jp: {
    progress: '今日の学習進捗', done: '完了', quick: 'クイックアクセス',
    dict: '辞書', planner: 'プランナー', notes: 'ノート', qa: 'クイズ', teacher: '先生・管理者',
    people: '仲間', library: '資料', klass: '授業', help: 'ヘルプ', more: 'メニュー',
  },
};

// Bottom tab labels — ရွေးထားတဲ့ ဘာသာစကားအလိုက် ပြောင်းမယ်
const tabT = {
  my: { Home: 'ပင်မ', Dictionary: 'အဘိဓာန်', Planner: 'အချိန်ဇယား', Notes: 'မှတ်စု', QA: 'မေးခွန်း', Community: 'အဖွဲ့', Materials: 'စာကြည့်', Teaching: 'သင်ခန်း', Help: 'အကူအညီ', More: 'မီနူး', Teacher: 'ဆရာ့အပိုင်း' },
  en: { Home: 'Home', Dictionary: 'Dictionary', Planner: 'Planner', Notes: 'Notes', QA: 'Quiz', Community: 'People', Materials: 'Library', Teaching: 'Class', Help: 'Help', More: 'More', Teacher: 'Teacher' },
  jp: { Home: 'ホーム', Dictionary: '辞書', Planner: 'プランナー', Notes: 'ノート', QA: 'クイズ', Community: '仲間', Materials: '資料', Teaching: '授業', Help: 'ヘルプ', More: 'メニュー', Teacher: '先生' },
};

function HomeScreen({ navigation, user, onLogout }) {
  const goProfile = () => { try { navigation.navigate('Community', { seg: 'profile' }); } catch (e) {} };
  const [refreshing, setRefreshing] = useState(false);
  const [progress, setProgress] = useState({ pct: 0, done: 0, total: PLANNER_SLOTS });
  const { lang } = useLanguage();
  const t = homeT[lang] || homeT.my;

  const reloadProgress = useCallback(async () => {
    const p = await computeTodayProgress();
    setProgress(p);
  }, []);

  useEffect(() => { reloadProgress(); }, [reloadProgress]);
  // တခြား tab က ပြန်လာတိုင်း ပြန်တွက် (planner မှာ အမှတ်ခြစ်လာရင် Home မှာ ပေါ်)
  useFocusEffect(useCallback(() => { reloadProgress(); }, [reloadProgress]));

  const onRefresh = async () => {
    setRefreshing(true);
    await reloadProgress();
    setRefreshing(false);
  };

  return (
    <ImageBackground
      source={require('./assets/splash.png')}
      style={styles.backgroundImage}
      blurRadius={3}
    >
      <View style={styles.overlayContainer}>
        <SafeAreaView style={styles.homeContainer}>
          <AppHeader title="🌸 Japanese Study Planner" user={user} onLogout={onLogout} onProfilePress={goProfile} />

          <ScrollView 
            contentContainerStyle={styles.scrollContainer} 
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          >
            {/* Progress Card — တကယ့် planner data (အတုမဟုတ်) */}
            <View style={styles.glassCard}>
              <Text style={styles.cardTitle}>{t.progress}</Text>
              <View style={styles.progressRow}>
                <View>
                  <Text style={styles.progressNumber}>{progress.pct}%</Text>
                  <Text style={styles.progressSubText}>{t.done} ({progress.done}/{progress.total})</Text>
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

            <View style={[styles.quickLinksRow, { marginTop: 10 }]}>
              <TouchableOpacity style={styles.quickCard} onPress={() => navigation.navigate('Community')}>
                <Text style={{fontSize: 24}}>👥</Text>
                <Text style={styles.quickCardText}>{t.people}</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.quickCard} onPress={() => navigation.navigate('Materials')}>
                <Text style={{fontSize: 24}}>📚</Text>
                <Text style={styles.quickCardText}>{t.library}</Text>
              </TouchableOpacity>
            </View>

            <View style={[styles.quickLinksRow, { marginTop: 10 }]}>
              <TouchableOpacity style={styles.quickCard} onPress={() => navigation.navigate('Teaching')}>
                <Text style={{fontSize: 24}}>📖</Text>
                <Text style={styles.quickCardText}>{t.klass}</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.quickCard} onPress={() => navigation.navigate('Help')}>
                <Text style={{fontSize: 24}}>🆘</Text>
                <Text style={styles.quickCardText}>{t.help}</Text>
              </TouchableOpacity>
            </View>

            {/* Teacher Section Link (teacher + admin — admin အမြင့်ဆုံး, tab ပျောက်မသွားအောင်) */}
            {(user?.role === 'teacher' || user?.role === 'admin') && (
              <View style={[styles.quickLinksRow, { marginTop: 10 }]}>
                <TouchableOpacity style={[styles.quickCard, { width: '100%' }]} onPress={() => navigation.navigate('Teacher')}>
                  <Text style={{fontSize: 24}}>🎓</Text>
                  <Text style={styles.quickCardText}>{t.teacher}</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* More menu — hidden tabs (Planner/Notes/Library/Help/Teacher) gateway */}
            <View style={[styles.quickLinksRow, { marginTop: 10 }]}>
              <TouchableOpacity style={[styles.quickCard, { width: '100%' }]} onPress={() => navigation.navigate('More')}>
                <Text style={{fontSize: 24}}>☰</Text>
                <Text style={styles.quickCardText}>{t.more}</Text>
              </TouchableOpacity>
            </View>
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
  const loggedRef = useRef(null); // login event — session တစ်ခုကို ၁ ခါ log (activity viewer)
  const { lang } = useLanguage();
  const tt = tabT[lang] || tabT.my;

  // Presence heartbeat (Active/idle/offline) — login ဝင်ထားမှ အလုပ်လုပ်မယ်
  usePresence(user);

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
        if (p.banned) {
          await signOut(auth);
          setUser(null);
          setNotice('⛔ ဤအကောင့်ကို ပိတ်ထားပြီးပါပြီ (Admin ဆုံးဖြတ်)။');
          return;
        }
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
        setUser({ name: p.name, role: p.role, email: fbUser.email, uid: fbUser.uid, photoURL: p.photoURL || null, mustChangePassword: !!p.mustChangePassword, hasPassword: !!p.hasPassword });
        // login event (bell မတီး — activity viewer မှာ admin ကြည့်)
        if (loggedRef.current !== fbUser.uid) {
          loggedRef.current = fbUser.uid;
          logActivity({ uid: fbUser.uid, email: fbUser.email, name: p.name }, 'user.login', fbUser.email || '', '');
        }
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
    loggedRef.current = null;
    setUser(null);
    setNotice('');
  };

  // Public privacy page (login မလို — Google OAuth branding အတွက်)
  if (Platform.OS === 'web' && typeof window !== 'undefined'
    && window.location.pathname.replace(/\/$/, '') === '/privacy') {
    return (
      <SafeAreaProvider>
        <PrivacyScreen />
      </SafeAreaProvider>
    );
  }

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

  // 🔑 Force password change gate — ကနဦး password နဲ့ ဝင်လာသူ (password provider ရှိမှ)
  if (user.mustChangePassword && user.hasPassword !== false) {
    return (
      <SafeAreaProvider>
        <ForceChangePassword
          user={user}
          onChanged={() => setUser({ ...user, mustChangePassword: false })}
          onLogout={handleLogout}
        />
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      {/* root touch → presence lastActiveAt (native); web က document listeners က ဖမ်းမယ် */}
      <View style={{ flex: 1 }} onTouchStart={markActiveNow}>
      <NotificationProvider user={user}>
      <NavigationContainer ref={navRef} linking={linking}>
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
              else if (route.name === 'Community') iconSymbol = '👥';
              else if (route.name === 'Materials') iconSymbol = '📚';
              else if (route.name === 'Teaching') iconSymbol = '📖';
              else if (route.name === 'Help') iconSymbol = '🆘';
              else if (route.name === 'More') iconSymbol = '☰';
              else if (route.name === 'Teacher') iconSymbol = '🎓';
              return <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.6 }}>{iconSymbol}</Text>;
            },
            tabBarActiveTintColor: '#D32F2F',
            tabBarInactiveTintColor: 'gray',
          })}
        >
          {/* Visible bar (6): Home/Dictionary/Quiz/Class/People/More — rest hidden but navigable */}
          <Tab.Screen name="Home" options={{ title: tt.Home }}>
            {(props) => <HomeScreen {...props} user={user} onLogout={handleLogout} />}
          </Tab.Screen>
          <Tab.Screen name="Dictionary" options={{ title: tt.Dictionary }}>
            {(props) => <DictionaryScreen {...props} user={user} onLogout={handleLogout} />}
          </Tab.Screen>
          <Tab.Screen name="QA" options={{ title: tt.QA }}>
            {(props) => <QAScreen {...props} user={user} onLogout={handleLogout} />}
          </Tab.Screen>
          <Tab.Screen name="Teaching" options={{ title: tt.Teaching }}>
            {(props) => <TeachingScreen {...props} user={user} onLogout={handleLogout} />}
          </Tab.Screen>
          <Tab.Screen name="Community" options={{ title: tt.Community }}>
            {(props) => <CommunityScreen {...props} user={user} onLogout={handleLogout} />}
          </Tab.Screen>
          <Tab.Screen name="More" options={{ title: tt.More }}>
            {(props) => <MoreScreen {...props} user={user} onLogout={handleLogout} />}
          </Tab.Screen>

          {/* Hidden from bar (☰ More menu ထဲက ဝင်) — navigate + deep-link မပျက် */}
          <Tab.Screen name="Planner" options={{ title: tt.Planner, tabBarButton: () => null }}>
            {(props) => <PlannerScreen {...props} user={user} onLogout={handleLogout} />}
          </Tab.Screen>
          <Tab.Screen name="Notes" options={{ title: tt.Notes, tabBarButton: () => null }}>
            {(props) => <NotesScreen {...props} user={user} onLogout={handleLogout} />}
          </Tab.Screen>
          <Tab.Screen name="Materials" options={{ title: tt.Materials, tabBarButton: () => null }}>
            {(props) => <MaterialsScreen {...props} user={user} onLogout={handleLogout} />}
          </Tab.Screen>
          <Tab.Screen name="Help" options={{ title: tt.Help, tabBarButton: () => null }}>
            {(props) => <HelpScreen {...props} user={user} onLogout={handleLogout} />}
          </Tab.Screen>

          {/* Teacher — teacher + admin only, bar မှာ မပြ (☰ Menu ထဲက ဝင်) */}
          {(user?.role === 'teacher' || user?.role === 'admin') && (
            <Tab.Screen name="Teacher" options={{ title: tt.Teacher, tabBarButton: () => null }}>
              {(props) => <TeacherScreen {...props} currentUser={user} onLogout={handleLogout} />}
            </Tab.Screen>
          )}
        </Tab.Navigator>
      </NavigationContainer>
      <NotificationPanel />
      </NotificationProvider>
      </View>
    </SafeAreaProvider>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <RootErrorBoundary>
        <Main />
      </RootErrorBoundary>
    </LanguageProvider>
  );
}

// App-level safety net — ဘယ် screen crash ဖြစ်ဖြစ် white screen မပြဘဲ
// error စာသား + reload ပြမယ် (diagnosis အတွက် screenshot ပို့ခိုင်း)
class RootErrorBoundary extends React.Component {
  constructor(p) { super(p); this.state = { err: null }; }
  static getDerivedStateFromError(e) { return { err: String((e && e.message) || e) }; }
  render() {
    if (this.state.err) {
      return (
        <SafeAreaProvider>
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, backgroundColor: '#FFF' }}>
            <Text style={{ fontSize: 48 }}>⚠️</Text>
            <Text style={{ marginTop: 12, fontWeight: 'bold', color: '#C62828', textAlign: 'center' }}>App error / အမှားတစ်ခု ဖြစ်နေပါတယ်</Text>
            <Text style={{ marginTop: 8, color: '#555', textAlign: 'center' }}>{this.state.err}</Text>
            <Text style={{ marginTop: 8, color: '#555', textAlign: 'center' }}>ဒီ screen ကို screenshot ရိုက်ပို့ပေးပါ 🙏</Text>
            <TouchableOpacity
              style={{ marginTop: 16, backgroundColor: '#D32F2F', borderRadius: 8, paddingHorizontal: 20, paddingVertical: 12 }}
              onPress={() => {
                this.setState({ err: null });
                try {
                  if (Platform.OS === 'web' && typeof window !== 'undefined') window.location.reload();
                } catch (e) {}
              }}
            >
              <Text style={{ color: '#FFF', fontWeight: 'bold' }}>🔄 Reload</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaProvider>
      );
    }
    return this.props.children;
  }
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
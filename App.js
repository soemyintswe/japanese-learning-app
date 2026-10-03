import React, { useState } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, RefreshControl, ImageBackground } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

// Modules များ
import AuthScreen from './components/AuthScreen';
import DictionaryScreen from './components/DictionaryScreen';
import PlannerScreen from './components/PlannerScreen';
import NotesScreen from './components/NotesScreen';
import TeacherScreen from './components/TeacherScreen';
import QAScreen from './components/QAScreen';

function HomeScreen({ navigation, user, onLogout }) {
  const [refreshing, setRefreshing] = useState(false);
  const [progress, setProgress] = useState('၈၀%');

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
          {/* Header */}
          <View style={styles.headerHome}>
            <View>
              <Text style={styles.appMainTitle}>🌸 Japanese Study Planner</Text>
              <Text style={styles.appSubTitle}>ကြိုဆိုပါတယ်၊ {user?.name || 'User'}</Text>
            </View>
            <TouchableOpacity onPress={onLogout} style={styles.logoutIconBtn}>
              <Ionicons name="log-out-outline" size={20} color="#D32F2F" />
            </TouchableOpacity>
          </View>

          <ScrollView 
            contentContainerStyle={styles.scrollContainer} 
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          >
            {/* Progress Card */}
            <View style={styles.glassCard}>
              <Text style={styles.cardTitle}>ယနေ့ လေ့လာမှု တိုးတက်မှု</Text>
              <View style={styles.progressRow}>
                <View>
                  <Text style={styles.progressNumber}>{progress}</Text>
                  <Text style={styles.progressSubText}>ပြီးမြောက်ပြီး</Text>
                </View>
                <Ionicons name="stats-chart" size={35} color="#D32F2F" />
              </View>
            </View>

            <Text style={styles.sectionTitle}>အမြန်ဝင်ရောက်ရန် နေရာများ</Text>
            
            {/* Quick Links Grid */}
            <View style={styles.quickLinksRow}>
              <TouchableOpacity style={styles.quickCard} onPress={() => navigation.navigate('Dictionary')}>
                <Ionicons name="book" size={24} color="#D32F2F" />
                <Text style={styles.quickCardText}>အဘိဓာန်</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.quickCard} onPress={() => navigation.navigate('Planner')}>
                <Ionicons name="calendar" size={24} color="#1976D2" />
                <Text style={styles.quickCardText}>အချိန်ဇယား</Text>
              </TouchableOpacity>
            </View>

            <View style={[styles.quickLinksRow, { marginTop: 10 }]}>
              <TouchableOpacity style={styles.quickCard} onPress={() => navigation.navigate('Notes')}>
                <Ionicons name="document-text" size={24} color="#388E3C" />
                <Text style={styles.quickCardText}>မှတ်စုများ</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.quickCard} onPress={() => navigation.navigate('QA')}>
                <Ionicons name="help-circle" size={24} color="#F57C00" />
                <Text style={styles.quickCardText}>မေးခွန်းဖြေရန်</Text>
              </TouchableOpacity>
            </View>

            <View style={[styles.quickLinksRow, { marginTop: 10 }]}>
              <TouchableOpacity style={[styles.quickCard, { width: '100%' }]} onPress={() => navigation.navigate('Teacher')}>
                <Ionicons name="school" size={24} color="#7B1FA2" />
                <Text style={styles.quickCardText}>ဆရာ့အပိုင်းနှင့် အက်ဒမင်</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </SafeAreaView>
      </View>
    </ImageBackground>
  );
}

const Tab = createBottomTabNavigator();

export default function App() {
  const [user, setUser] = useState(null);

  if (!user) {
    return (
      <SafeAreaProvider>
        <AuthScreen onLoginSuccess={(userData) => setUser(userData)} />
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Tab.Navigator
          screenOptions={({ route }) => ({
            headerShown: false,
            tabBarIcon: ({ focused, color, size }) => {
              let iconName;
              if (route.name === 'Home') iconName = focused ? 'home' : 'home-outline';
              else if (route.name === 'Dictionary') iconName = focused ? 'book' : 'book-outline';
              else if (route.name === 'Planner') iconName = focused ? 'calendar' : 'calendar-outline';
              else if (route.name === 'Notes') iconName = focused ? 'document-text' : 'document-text-outline';
              else if (route.name === 'QA') iconName = focused ? 'help-circle' : 'help-circle-outline';
              else if (route.name === 'Teacher') iconName = focused ? 'school' : 'school-outline';
              return <Ionicons name={iconName} size={size} color={color} />;
            },
            tabBarActiveTintColor: '#D32F2F',
            tabBarInactiveTintColor: 'gray',
          })}
        >
          <Tab.Screen name="Home" options={{ title: 'ပင်မ' }}>
            {(props) => <HomeScreen {...props} user={user} onLogout={() => setUser(null)} />}
          </Tab.Screen>
          <Tab.Screen name="Dictionary" component={DictionaryScreen} options={{ title: 'အဘိဓာန်' }} />
          <Tab.Screen name="Planner" component={PlannerScreen} options={{ title: 'အချိန်ဇယား' }} />
          <Tab.Screen name="Notes" component={NotesScreen} options={{ title: 'မှတ်စု' }} />
          <Tab.Screen name="QA" component={QAScreen} options={{ title: 'မေးခွန်း' }} />
          <Tab.Screen name="Teacher">
            {(props) => <TeacherScreen {...props} currentUser={user} />}
          </Tab.Screen>
        </Tab.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  backgroundImage: { flex: 1, width: '100%', height: '100%' },
  overlayContainer: { flex: 1, backgroundColor: 'rgba(255, 255, 255, 0.88)' },
  homeContainer: { flex: 1 },
  headerHome: { paddingHorizontal: 15, paddingVertical: 12, backgroundColor: 'rgba(255,255,255,0.9)', borderBottomWidth: 1, borderBottomColor: '#EFEFEF', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  logoutIconBtn: { padding: 6, backgroundColor: '#FFEBEE', borderRadius: 20 },
  appMainTitle: { fontSize: 15, fontWeight: 'bold', color: '#D32F2F', marginBottom: 2 },
  appSubTitle: { fontSize: 11, color: '#666' },
  scrollContainer: { padding: 12 },
  glassCard: { backgroundColor: 'rgba(255,255,255,0.95)', borderRadius: 10, padding: 15, marginBottom: 12, elevation: 2, borderWidth: 1, borderColor: '#EEE' },
  cardTitle: { fontSize: 13, fontWeight: '600', color: '#333', marginBottom: 6 },
  progressRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  progressNumber: { fontSize: 20, fontWeight: 'bold', color: '#D32F2F' },
  progressSubText: { fontSize: 11, color: '#666' },
  sectionTitle: { fontSize: 13, fontWeight: 'bold', color: '#333', marginBottom: 8, marginTop: 4 },
  quickLinksRow: { flexDirection: 'row', justifyContent: 'space-between' },
  quickCard: { backgroundColor: 'rgba(255,255,255,0.95)', width: '48%', padding: 12, borderRadius: 8, alignItems: 'center', elevation: 2, borderWidth: 1, borderColor: '#EEE' },
  quickCardText: { marginTop: 4, fontSize: 12, fontWeight: 'bold', color: '#333' },
});
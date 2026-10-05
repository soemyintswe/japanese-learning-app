import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, ImageBackground, TextInput, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLanguage } from '../src/LanguageContext';
import AppHeader from './AppHeader';

const PLANNER_KEY = '@japanese_planner_v1';

// ဘာသာစကားအလိုက် စာသားများ (မြန်မာ၊ အင်္ဂလိပ်၊ ဂျပန်)
const translations = {
  my: {
    title: 'လေ့လာမှုအချိန်ဇယား (Study Planner)',
    months: ['ဇန်နဝါရီ', 'ဖေဖော်ဝါရီ', 'မတ်', 'ဧပြီ', 'မေ', 'ဇွန်', 'ဇူလိုင်', 'သြဂုတ်', 'စက်တင်ဘာ', 'အောက်တိုဘာ', 'နိုဝင်ဘာ', 'ဒီဇင်ဘာ'],
    daysShort: ['နွေ', 'လာ', 'ဂါ', 'ဟူး', 'တေး', 'ကြာ', 'နေ'],
    selectedDateText: 'ရွေးချယ်ထားသော ရက်စွဲ - ',
    morningTitle: 'မနက်ပိုင်း (Morning Study)',
    eveningTitle: 'ညနေပိုင်း (Evening Study)',
    notesTitle: 'မှတ်စု (Notes)',
    notesPlaceholder: 'ဤရက်အတွက် မှတ်စုများ ရေးရန်...',
    subjects: ['ဝေါဟာရ (Goi / Vocabulary)', 'ကန်ဂျီ (Kanji)', 'သဒ္ဒါ (Grammar)', 'နားထောင်ခြင်း (Listening)', 'ဖတ်ရှုခြင်း (Reading)']
  },
  en: {
    title: 'Study Planner',
    months: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
    daysShort: ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'],
    selectedDateText: 'Selected Date - ',
    morningTitle: 'Morning Study',
    eveningTitle: 'Evening Study',
    notesTitle: 'Notes',
    notesPlaceholder: 'Write notes for this date...',
    subjects: ['Goi / Vocabulary', 'Kanji', 'Grammar', 'Listening', 'Reading']
  },
  jp: {
    title: 'スタディプランナー',
    months: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'],
    daysShort: ['日', '月', '火', '水', '木', '金', '土'],
    selectedDateText: '選択した日付 - ',
    morningTitle: '朝の勉強 (Morning)',
    eveningTitle: '夜の勉強 (Evening)',
    notesTitle: 'ノート (Notes)',
    notesPlaceholder: 'この日のメモを入力...',
    subjects: ['語彙 (Vocabulary)', '漢字 (Kanji)', '文法 (Grammar)', '聴解 (Listening)', '読解 (Reading)']
  }
};

export default function PlannerScreen({ user, onLogout, navigation }) {
  const goProfile = () => { try { navigation.navigate('Community', { seg: 'profile' }); } catch (e) {} };
  const { lang } = useLanguage();
  const t = translations[lang] || translations.my;

  const currentDate = new Date();
  const [currentYear, setCurrentYear] = useState(currentDate.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(currentDate.getMonth());
  const [selectedDay, setSelectedDay] = useState(currentDate.getDate());

  // ရက်စွဲတစ်ခုချင်းစီအလိုက် Checklists နဲ့ Notes များကို သိမ်းဆည်းရန် State
  // Format key: "YYYY-MM-DD" — ဖုန်းထဲမှာ သိမ်းထားလို့ App ပိတ်လည်း မပျောက်ပါ
  const dateKey = `${currentYear}-${currentMonth + 1}-${selectedDay}`;
  const [plannerData, setPlannerData] = useState({});

  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem(PLANNER_KEY);
        if (saved) setPlannerData(JSON.parse(saved));
      } catch (e) { console.log('Load planner error', e.message); }
    })();
  }, []);

  useEffect(() => {
    AsyncStorage.setItem(PLANNER_KEY, JSON.stringify(plannerData)).catch(() => {});
  }, [plannerData]);

  // လက်ရှိရွေးထားတဲ့ရက်အတွက် Data ရယူရန် (မရှိသေးရင် Default အလွတ်ပြန်မည်)
  const currentDayData = plannerData[dateKey] || {
    morning: {},
    evening: {},
    note: ''
  };

  // Checkbox နှိပ်သည့်အခါ
  const toggleCheck = (session, subjectIndex) => {
    const updatedSession = { 
      ...currentDayData[session], 
      [subjectIndex]: !currentDayData[session][subjectIndex] 
    };
    setPlannerData({
      ...plannerData,
      [dateKey]: {
        ...currentDayData,
        [session]: updatedSession
      }
    });
  };

  // Note ရေးသည့်အခါ
  const updateNote = (text) => {
    setPlannerData({
      ...plannerData,
      [dateKey]: {
        ...currentDayData,
        note: text
      }
    });
  };

  // လတစ်လရဲ့ ပထမရက်နဲ့ စုစုပေါင်းရက်
  const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay();
  const totalDays = new Date(currentYear, currentMonth + 1, 0).getDate();

  const changeMonth = (direction) => {
    let newMonth = currentMonth + direction;
    let newYear = currentYear;
    if (newMonth > 11) { newMonth = 0; newYear += 1; } 
    else if (newMonth < 0) { newMonth = 11; newYear -= 1; }
    setCurrentMonth(newMonth);
    setCurrentYear(newYear);
    setSelectedDay(1);
  };

  const daysArray = [];
  for (let i = 0; i < firstDayIndex; i++) daysArray.push(null);
  for (let i = 1; i <= totalDays; i++) daysArray.push(i);

  return (
    <ImageBackground 
      source={require('../assets/splash.png')} 
      style={styles.backgroundImage}
      blurRadius={3}
    >
      <View style={styles.overlayContainer}>
        <SafeAreaView style={styles.container}>
          
          <AppHeader title={t.title} user={user} onLogout={onLogout} onProfilePress={goProfile} />

          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            
            {/* 1. Calendar Grid Card */}
            <View style={styles.calendarCard}>
              <View style={styles.monthNavRow}>
                <Text style={styles.monthYearText}>{t.months[currentMonth]} {currentYear}</Text>
                <View style={styles.navButtons}>
                  <TouchableOpacity onPress={() => changeMonth(-1)} style={styles.navBtn}>
                    <Text style={{ fontSize: 16 }}>◀</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => changeMonth(1)} style={styles.navBtn}>
                    <Text style={{ fontSize: 16 }}>▶</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.weekDaysRow}>
                {t.daysShort.map((day, index) => (
                  <Text key={index} style={styles.weekDayText}>{day}</Text>
                ))}
              </View>

              <View style={styles.gridContainer}>
                {daysArray.map((item, index) => {
                  const isSelected = item === selectedDay;
                  return (
                    <TouchableOpacity
                      key={index}
                      style={[styles.dayCell, item === null && styles.emptyCell, isSelected && styles.selectedDayCell]}
                      disabled={item === null}
                      onPress={() => setSelectedDay(item)}
                    >
                      {item !== null && (
                        <Text style={[styles.dayText, isSelected && styles.selectedDayText]}>{item}</Text>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* 2. Selected Date Info Header */}
            <View style={styles.infoCard}>
              <Text style={{ fontSize: 18 }}>📅</Text>
              <Text style={styles.infoText}>
                {t.selectedDateText} <Text style={{fontWeight: 'bold', color: '#D32F2F'}}>{selectedDay} {t.months[currentMonth]} {currentYear}</Text>
              </Text>
            </View>

            {/* 3. Morning Study Checklist */}
            <View style={styles.sectionCard}>
              <Text style={styles.sectionHeaderTitle}>☀️ {t.morningTitle}</Text>
              {t.subjects.map((sub, idx) => {
                const isChecked = !!currentDayData.morning[idx];
                return (
                  <TouchableOpacity key={idx} style={styles.checkRow} onPress={() => toggleCheck('morning', idx)}>
                    <Text style={[styles.checkLabel, isChecked && styles.checkedText]}>{sub}</Text>
                    <Text style={{ fontSize: 22 }}>{isChecked ? '☑️' : '⬜'}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* 4. Evening Study Checklist */}
            <View style={styles.sectionCard}>
              <Text style={styles.sectionHeaderTitle}>🌙 {t.eveningTitle}</Text>
              {t.subjects.map((sub, idx) => {
                const isChecked = !!currentDayData.evening[idx];
                return (
                  <TouchableOpacity key={idx} style={styles.checkRow} onPress={() => toggleCheck('evening', idx)}>
                    <Text style={[styles.checkLabel, isChecked && styles.checkedText]}>{sub}</Text>
                    <Text style={{ fontSize: 22 }}>{isChecked ? '☑️' : '⬜'}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* 5. Notes Section */}
            <View style={[styles.sectionCard, {marginBottom: 25}]}>
              <Text style={styles.sectionHeaderTitle}>📝 {t.notesTitle}</Text>
              <TextInput
                style={styles.notesInput}
                multiline={true}
                placeholder={t.notesPlaceholder}
                placeholderTextColor="#999"
                value={currentDayData.note}
                onChangeText={updateNote}
              />
            </View>

          </ScrollView>
        </SafeAreaView>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  backgroundImage: { flex: 1, width: '100%', height: '100%' },
  overlayContainer: { flex: 1, backgroundColor: 'rgba(255, 255, 255, 0.90)' },
  container: { flex: 1 },
  headerRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingHorizontal: 12, 
    paddingVertical: 10,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderBottomWidth: 1,
    borderBottomColor: '#EEE'
  },
  headerTitle: { fontSize: 14, fontWeight: 'bold', color: '#333', fontFamily: Platform.OS === 'ios' ? 'Myanmar Sangam MN' : 'sans-serif' },
  
  langContainer: { flexDirection: 'row', backgroundColor: '#EEE', borderRadius: 6, padding: 2 },
  langBtn: { paddingHorizontal: 7, paddingVertical: 3, borderRadius: 4 },
  langBtnActive: { backgroundColor: '#D32F2F' },
  langText: { fontSize: 10, fontWeight: '600', color: '#666', fontFamily: Platform.OS === 'ios' ? 'Myanmar Sangam MN' : 'sans-serif' },
  langTextActive: { color: '#FFF' },

  scrollContent: { padding: 10 },
  
  calendarCard: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    elevation: 2,
  },
  monthNavRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  monthYearText: { fontSize: 15, fontWeight: 'bold', color: '#222', fontFamily: Platform.OS === 'ios' ? 'Myanmar Sangam MN' : 'sans-serif' },
  navButtons: { flexDirection: 'row' },
  navBtn: { padding: 5, backgroundColor: '#F0F0F0', borderRadius: 15, marginLeft: 5 },
  
  weekDaysRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    paddingBottom: 4,
  },
  weekDayText: { width: '14.28%', textAlign: 'center', fontSize: 11, fontWeight: 'bold', color: '#666', fontFamily: Platform.OS === 'ios' ? 'Myanmar Sangam MN' : 'sans-serif' },

  gridContainer: { flexDirection: 'row', flexWrap: 'wrap' },
  dayCell: {
    width: '14.28%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 1,
  },
  emptyCell: { backgroundColor: 'transparent' },
  selectedDayCell: {
    backgroundColor: '#D32F2F',
    borderRadius: 18,
  },
  dayText: { fontSize: 13, color: '#333', fontWeight: '500', fontFamily: Platform.OS === 'ios' ? 'Myanmar Sangam MN' : 'sans-serif' },
  selectedDayText: { color: '#FFF', fontWeight: 'bold' },

  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.95)',
    padding: 10,
    borderRadius: 8,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#EEE',
  },
  infoText: { marginLeft: 6, fontSize: 12, color: '#333', fontFamily: Platform.OS === 'ios' ? 'Myanmar Sangam MN' : 'sans-serif' },

  sectionCard: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 10,
    padding: 12,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#EEE',
    elevation: 1,
  },
  sectionHeaderTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    paddingBottom: 4,
    fontFamily: Platform.OS === 'ios' ? 'Myanmar Sangam MN' : 'sans-serif'
  },
  checkRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 0.5,
    borderBottomColor: '#F9F9F9',
  },
  checkLabel: { fontSize: 12, color: '#444', fontFamily: Platform.OS === 'ios' ? 'Myanmar Sangam MN' : 'sans-serif' },
  checkedText: { textDecorationLine: 'line-through', color: '#888' },

  notesInput: {
    backgroundColor: '#FAFAFA',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 6,
    padding: 8,
    height: 70,
    textAlignVertical: 'top',
    fontSize: 12,
    color: '#333',
    fontFamily: Platform.OS === 'ios' ? 'Myanmar Sangam MN' : 'sans-serif'
  }
});
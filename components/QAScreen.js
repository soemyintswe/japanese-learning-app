import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, TextInput, Modal, Alert, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLanguage } from '../src/LanguageContext';
import AppHeader from './AppHeader';

const QA_KEY = '@japanese_qa_custom_v1';

const qaTranslations = {
  my: {
    title: '📝 ဂျပန်စာ မေးခွန်းနှင့် အဖြေ (Quiz)', add: 'မေးခွန်းအသစ်ထည့်ရန်', submit: 'အဖြေစစ်ဆေးမည်', score: 'သင့်ရဲ့ ရမှတ်ရလဒ်', retry: 'ပြန်လည် ဖြေဆိုမည်',
    editQ: 'မေးခွန်း ပြင်ဆင်ရန်', newQ: 'မေးခွန်းအသစ် ထည့်ရန်',
    qLabel: 'မေးခွန်း (Question):', qPh: 'မေးခွန်းရေးရန်...',
    o1: 'အဖြေ (Option 1):', o1Ph: 'အဖြေ ၁', o2: 'အဖြေ (Option 2):', o2Ph: 'အဖြေ ၂',
    o3: 'အဖြေ (Option 3 - ရွေးချယ်ရန်):', o3Ph: 'အဖြေ ၃',
    o4: 'အဖြေ (Option 4 - ရွေးချယ်ရန်):', o4Ph: 'အဖြေ ၄ (မဖြည့်လည်းရတယ်)',
    pickCorrect: 'အမှန်အဖြေ ရွေးပါ (Correct Answer):',
    cancel: 'ပယ်ဖျက်မည်', save: 'သိမ်းဆည်းမည်',
    errFill: 'မေးခွန်းနှင့် အဖြေအနည်းဆုံး ၂ ခုကို ဖြည့်သွင်းပါ။',
    delTitle: 'သတိပေးချက်', delMsg: 'ဤမေးခွန်းကို ဖျက်ရန် သေချာပါသလား?', no: 'မဖျက်ပါ', yes: 'ဖျက်မည်',
  },
  en: {
    title: '📝 Japanese Q&A Quiz', add: 'Add New Question', submit: 'Submit Answers', score: 'Your Quiz Score', retry: 'Retry Quiz',
    editQ: 'Edit Question', newQ: 'Add New Question',
    qLabel: 'Question:', qPh: 'Write a question...',
    o1: 'Answer (Option 1):', o1Ph: 'Correct answer', o2: 'Answer (Option 2):', o2Ph: 'Wrong answer',
    o3: 'Answer (Option 3 - optional):', o3Ph: 'Wrong answer',
    o4: 'Answer (Option 4 - optional):', o4Ph: 'Wrong answer (optional)',
    pickCorrect: 'Pick the correct answer:',
    cancel: 'Cancel', save: 'Save',
    errFill: 'Please fill in the question and at least 2 answers.',
    delTitle: 'Warning', delMsg: 'Delete this question?', no: 'No', yes: 'Delete',
  },
  jp: {
    title: '📝 日本語クイズと回答', add: '新しい質問を追加', submit: '回答を提出する', score: 'クイズ結果', retry: 'もう一度挑戦',
    editQ: '質問を編集', newQ: '新しい質問を追加',
    qLabel: '質問:', qPh: '質問を書く...',
    o1: '答え (選択肢1):', o1Ph: '正解', o2: '答え (選択肢2):', o2Ph: '不正解',
    o3: '答え (選択肢3・任意):', o3Ph: '不正解',
    o4: '答え (選択肢4・任意):', o4Ph: '不正解（任意）',
    pickCorrect: '正解を選択:',
    cancel: 'キャンセル', save: '保存',
    errFill: '質問と答えを2つ以上入力してください。',
    delTitle: '確認', delMsg: 'この質問を削除しますか？', no: 'いいえ', yes: '削除',
  }
};

export default function QAScreen({ user, onLogout }) {
  const { lang } = useLanguage();
  const t = qaTranslations[lang] || qaTranslations.my;

  const [questions, setQuestions] = useState([
    {
      id: '1',
      question: '1. "勉強 (Benkyou)" ၏ အဓိပ္ပာယ်မှာ အဘယ်နည်း။',
      options: ['စာကျက်သည် / လေ့လာသည်', 'ကျောင်းသွားသည်', 'ထမင်းစားသည်', 'သူငယ်ချင်း'],
      correctIndex: 0,
    },
    {
      id: '2',
      question: '2. "先生 (Sensei)" ၏ အဓိပ္ပာယ်မှာ အဘယ်နည်း။',
      options: ['ကျောင်းသား', 'ဆရာ / ဆရာမ', 'ကားမောင်းသူ', 'ဆရာဝန်'],
      correctIndex: 1,
    },
  ]);

  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);

  // ကိုယ်တိုင်ထည့်တဲ့ မေးခွန်းတွေ မပျောက်အောင် သိမ်းမယ်
  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem(QA_KEY);
        if (saved) {
          const custom = JSON.parse(saved);
          if (Array.isArray(custom) && custom.length > 0) {
            setQuestions((prev) => [...prev, ...custom.filter((c) => !prev.some((p) => p.id === c.id))]);
          }
        }
      } catch (e) { console.log('Load QA error', e.message); }
    })();
  }, []);

  // Modal State for Add/Edit
  const [modalVisible, setModalVisible] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [qText, setQText] = useState('');
  const [opt1, setOpt1] = useState('');
  const [opt2, setOpt2] = useState('');
  const [opt3, setOpt3] = useState('');
  const [opt4, setOpt4] = useState('');
  const [correctIdx, setCorrectIdx] = useState(0);

  const handleSaveQuestion = () => {
    if (!qText.trim() || !opt1.trim() || !opt2.trim()) {
      Alert.alert('⚠️', t.errFill);
      return;
    }

    const newOptions = [opt1, opt2, opt3, opt4].filter(o => o.trim() !== '');
    if (correctIdx >= newOptions.length) {
      Alert.alert('⚠️', t.errFill);
      return;
    }

    let next;
    if (editingId) {
      next = questions.map(q => q.id === editingId ? { ...q, question: qText, options: newOptions, correctIndex: correctIdx } : q);
      setEditingId(null);
    } else {
      const newQ = {
        id: Date.now().toString(),
        question: qText,
        options: newOptions,
        correctIndex: correctIdx,
      };
      next = [...questions, newQ];
    }
    setQuestions(next);
    // default ၂ ခုကလွဲပြီး ကျန်တာ custom အဖြစ် သိမ်းမယ်
    const custom = next.filter((q) => !['1', '2'].includes(q.id));
    AsyncStorage.setItem(QA_KEY, JSON.stringify(custom)).catch(() => {});

    setQText(''); setOpt1(''); setOpt2(''); setOpt3(''); setOpt4(''); setCorrectIdx(0);
    setModalVisible(false);
  };

  const handleEditQuestion = (item) => {
    setEditingId(item.id);
    setQText(item.question);
    setOpt1(item.options[0] || '');
    setOpt2(item.options[1] || '');
    setOpt3(item.options[2] || '');
    setOpt4(item.options[3] || '');
    setCorrectIdx(item.correctIndex);
    setModalVisible(true);
  };

  const handleDeleteQuestion = (id) => {
    Alert.alert(t.delTitle, t.delMsg, [
      { text: t.no, style: 'cancel' },
      { text: t.yes, style: 'destructive', onPress: () => setQuestions(questions.filter(q => q.id !== id)) }
    ]);
  };

  const handleSelectOption = (qId, optIndex) => {
    if (submitted) return;
    setSelectedAnswers({ ...selectedAnswers, [qId]: optIndex });
  };

  const handleSubmitQuiz = () => {
    let currentScore = 0;
    questions.forEach((q) => {
      if (selectedAnswers[q.id] === q.correctIndex) {
        currentScore += 1;
      }
    });
    setScore(currentScore);
    setSubmitted(true);
  };

  return (
    <SafeAreaView style={styles.container}>
      <AppHeader
        title={t.title}
        user={user}
        onLogout={onLogout}
        action={
          <TouchableOpacity style={styles.addButton} onPress={() => { setEditingId(null); setQText(''); setOpt1(''); setOpt2(''); setOpt3(''); setOpt4(''); setModalVisible(true); }}>
            <Text style={{ fontSize: 18, color: '#FFF' }}>➕</Text>
          </TouchableOpacity>
        }
      />

      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {submitted && (
          <View style={styles.scoreCard}>
            <Text style={{ fontSize: 35, marginBottom: 6 }}>🏆</Text>
            <Text style={styles.scoreTitle}>{t.score}</Text>
            <Text style={styles.scoreNumber}>{score} / {questions.length}</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={() => { setSelectedAnswers({}); setSubmitted(false); }}>
              <Text style={styles.retryBtnText}>{t.retry}</Text>
            </TouchableOpacity>
          </View>
        )}

        {questions.map((q) => (
          <View key={q.id} style={styles.questionCard}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <Text style={styles.questionText}>{q.question}</Text>
              <View style={{ flexDirection: 'row' }}>
                <TouchableOpacity onPress={() => handleEditQuestion(q)} style={{ marginRight: 10 }}>
                  <Text style={{ fontSize: 18 }}>✏️</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleDeleteQuestion(q.id)}>
                  <Text style={{ fontSize: 18 }}>🗑️</Text>
                </TouchableOpacity>
              </View>
            </View>
            
            {q.options.map((opt, optIndex) => {
              const isSelected = selectedAnswers[q.id] === optIndex;
              let btnStyle = styles.optionBtn;
              let textStyle = styles.optionText;

              if (submitted) {
                if (optIndex === q.correctIndex) {
                  btnStyle = [styles.optionBtn, styles.correctOpt];
                  textStyle = [styles.optionText, styles.correctText];
                } else if (isSelected) {
                  btnStyle = [styles.optionBtn, styles.wrongOpt];
                  textStyle = [styles.optionText, styles.wrongText];
                }
              } else if (isSelected) {
                btnStyle = [styles.optionBtn, styles.selectedOpt];
                textStyle = [styles.optionText, styles.selectedText];
              }

              return (
                <TouchableOpacity key={optIndex} style={btnStyle} onPress={() => handleSelectOption(q.id, optIndex)}>
                  <Text style={textStyle}>{opt}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        ))}

        {!submitted && (
          <TouchableOpacity style={styles.submitQuizBtn} onPress={handleSubmitQuiz}>
            <Text style={styles.submitQuizBtnText}>{t.submit}</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* Add/Edit Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{editingId ? t.editQ : t.newQ}</Text>
            
            <Text style={styles.label}>{t.qLabel}</Text>
            <TextInput style={styles.input} value={qText} onChangeText={setQText} placeholder={t.qPh} placeholderTextColor="#999" />

            <Text style={styles.label}>{t.o1}</Text>
            <TextInput style={styles.input} value={opt1} onChangeText={setOpt1} placeholder={t.o1Ph} placeholderTextColor="#999" />

            <Text style={styles.label}>{t.o2}</Text>
            <TextInput style={styles.input} value={opt2} onChangeText={setOpt2} placeholder={t.o2Ph} placeholderTextColor="#999" />

            <Text style={styles.label}>{t.o3}</Text>
            <TextInput style={styles.input} value={opt3} onChangeText={setOpt3} placeholder={t.o3Ph} placeholderTextColor="#999" />

            <Text style={styles.label}>{t.o4}</Text>
            <TextInput style={styles.input} value={opt4} onChangeText={setOpt4} placeholder={t.o4Ph} placeholderTextColor="#999" />

            <Text style={styles.label}>{t.pickCorrect}</Text>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 }}>
              {[opt1, opt2, opt3, opt4].map((o, idx) => {
                if (!o.trim()) return null;
                const active = correctIdx === idx;
                return (
                  <TouchableOpacity
                    key={idx}
                    style={[styles.lvlBtn || styles.correctPickBtn, { flex: 1, marginHorizontal: 3, paddingVertical: 8, borderWidth: 1, borderColor: active ? '#4CAF50' : '#DDD', borderRadius: 6, alignItems: 'center', backgroundColor: active ? '#E8F5E9' : '#FAFAFA' }]}
                    onPress={() => setCorrectIdx(idx)}
                  >
                    <Text style={{ fontSize: 12, fontWeight: 'bold', color: active ? '#2E7D32' : '#666' }}>Option {idx + 1}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={styles.modalActionRow}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalVisible(false)}>
                <Text style={styles.cancelBtnText}>{t.cancel}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleSaveQuestion}>
                <Text style={styles.saveBtnText}>{t.save}</Text>
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
  header: { paddingHorizontal: 15, paddingVertical: 12, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#EFEFEF', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerTitleText: { fontSize: 15, fontWeight: 'bold', color: '#333', fontFamily: Platform.OS === 'ios' ? 'Myanmar Sangam MN' : 'sans-serif' },
  langRow: { flexDirection: 'row', marginRight: 8 },
  langBtn: { paddingHorizontal: 5, paddingVertical: 2, borderWidth: 1, borderColor: '#DDD', borderRadius: 4, marginLeft: 3 },
  langBtnActive: { backgroundColor: '#D32F2F', borderColor: '#D32F2F' },
  langText: { fontSize: 10, color: '#666', fontWeight: 'bold', fontFamily: Platform.OS === 'ios' ? 'Myanmar Sangam MN' : 'sans-serif' },
  langTextActive: { color: '#FFF' },
  addButton: { backgroundColor: '#D32F2F', padding: 6, borderRadius: 6, justifyContent: 'center', alignItems: 'center' },
  scrollContainer: { padding: 15 },
  scoreCard: { backgroundColor: '#FFF8E1', borderRadius: 12, padding: 15, alignItems: 'center', marginBottom: 15, elevation: 2 },
  scoreTitle: { fontSize: 14, fontWeight: 'bold', color: '#333', fontFamily: Platform.OS === 'ios' ? 'Myanmar Sangam MN' : 'sans-serif' },
  scoreNumber: { fontSize: 26, fontWeight: 'bold', color: '#F57C00', marginVertical: 4 },
  retryBtn: { backgroundColor: '#F57C00', paddingHorizontal: 15, paddingVertical: 6, borderRadius: 6 },
  retryBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 12, fontFamily: Platform.OS === 'ios' ? 'Myanmar Sangam MN' : 'sans-serif' },
  questionCard: { backgroundColor: '#FFFFFF', borderRadius: 10, padding: 14, marginBottom: 12, elevation: 2 },
  questionText: { fontSize: 14, fontWeight: 'bold', color: '#333', flex: 1, marginRight: 8, fontFamily: Platform.OS === 'ios' ? 'Myanmar Sangam MN' : 'sans-serif' },
  optionBtn: { borderWidth: 1, borderColor: '#DDD', borderRadius: 6, padding: 10, marginBottom: 6, backgroundColor: '#FAFAFA' },
  optionText: { fontSize: 13, color: '#333', fontFamily: Platform.OS === 'ios' ? 'Myanmar Sangam MN' : 'sans-serif' },
  selectedOpt: { backgroundColor: '#E3F2FD', borderColor: '#1976D2' },
  selectedText: { color: '#1976D2', fontWeight: 'bold', fontFamily: Platform.OS === 'ios' ? 'Myanmar Sangam MN' : 'sans-serif' },
  correctOpt: { backgroundColor: '#E8F5E9', borderColor: '#4CAF50' },
  correctText: { color: '#2E7D32', fontWeight: 'bold', fontFamily: Platform.OS === 'ios' ? 'Myanmar Sangam MN' : 'sans-serif' },
  wrongOpt: { backgroundColor: '#FFEBEE', borderColor: '#EF5350' },
  wrongText: { color: '#C62828', fontWeight: 'bold', fontFamily: Platform.OS === 'ios' ? 'Myanmar Sangam MN' : 'sans-serif' },
  submitQuizBtn: { backgroundColor: '#D32F2F', paddingVertical: 12, borderRadius: 8, alignItems: 'center', marginTop: 10, marginBottom: 20 },
  submitQuizBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 14, fontFamily: Platform.OS === 'ios' ? 'Myanmar Sangam MN' : 'sans-serif' },
  modalOverlay: { flex: 1, justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.6)', padding: 20 },
  modalContent: { backgroundColor: '#FFF', borderRadius: 12, padding: 20, elevation: 5 },
  modalTitle: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 12, textAlign: 'center', fontFamily: Platform.OS === 'ios' ? 'Myanmar Sangam MN' : 'sans-serif' },
  label: { fontSize: 12, fontWeight: '600', color: '#555', marginBottom: 4, marginTop: 6, fontFamily: Platform.OS === 'ios' ? 'Myanmar Sangam MN' : 'sans-serif' },
  input: { borderWidth: 1, borderColor: '#DDD', borderRadius: 6, paddingHorizontal: 10, paddingVertical: 6, fontSize: 13, color: '#333', backgroundColor: '#FAFAFA', fontFamily: Platform.OS === 'ios' ? 'Myanmar Sangam MN' : 'sans-serif' },
  modalActionRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 15 },
  cancelBtn: { flex: 1, paddingVertical: 8, backgroundColor: '#E0E0E0', borderRadius: 6, alignItems: 'center', marginRight: 6 },
  cancelBtnText: { color: '#333', fontWeight: 'bold', fontSize: 12, fontFamily: Platform.OS === 'ios' ? 'Myanmar Sangam MN' : 'sans-serif' },
  saveBtn: { flex: 1, paddingVertical: 8, backgroundColor: '#D32F2F', borderRadius: 6, alignItems: 'center', marginLeft: 6 },
  saveBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 12, fontFamily: Platform.OS === 'ios' ? 'Myanmar Sangam MN' : 'sans-serif' }
});
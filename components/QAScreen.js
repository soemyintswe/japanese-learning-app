import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, TextInput, Modal, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const qaTranslations = {
  my: { title: '📝 ဂျပန်စာ မေးခွန်းနှင့် အဖြေ (Quiz)', add: 'မေးခွန်းအသစ်ထည့်ရန်', submit: 'အဖြေစစ်ဆေးမည်', score: 'သင့်ရဲ့ ရမှတ်ရလဒ်', retry: 'ပြန်လည် ဖြေဆိုမည်' },
  en: { title: '📝 Japanese Q&A Quiz', add: 'Add New Question', submit: 'Submit Answers', score: 'Your Quiz Score', retry: 'Retry Quiz' },
  jp: { title: '📝 日本語クイズと回答', add: '新しい質問を追加', submit: '回答を提出する', score: 'クイズ結果', retry: 'もう一度挑戦' }
};

export default function QAScreen() {
  const [lang, setLang] = useState('my');
  const t = qaTranslations[lang];

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
      Alert.alert('အမှား', 'မေးခွန်းနှင့် အဖြေအနည်းဆုံး ၂ ခုကို ဖြည့်သွင်းပါ။');
      return;
    }

    const newOptions = [opt1, opt2, opt3, opt4].filter(o => o.trim() !== '');

    if (editingId) {
      setQuestions(questions.map(q => q.id === editingId ? { ...q, question: qText, options: newOptions, correctIndex: correctIdx } : q));
      setEditingId(null);
    } else {
      const newQ = {
        id: Date.now().toString(),
        question: qText,
        options: newOptions,
        correctIndex: correctIdx,
      };
      setQuestions([...questions, newQ]);
    }

    setQText(''); setOpt1(''); setOpt2(''); setOpt3(''); setOpt4('');
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
    Alert.alert('သတိပေးချက်', 'ဤမေးခွန်းကို ဖျက်ရန် သေချာပါသလား?', [
      { text: 'မဖျက်ပါ', style: 'cancel' },
      { text: 'ဖျက်မည်', style: 'destructive', onPress: () => setQuestions(questions.filter(q => q.id !== id)) }
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
      <View style={styles.header}>
        <Text style={styles.headerTitleText}>{t.title}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={styles.langRow}>
            {['my', 'en', 'jp'].map(l => (
              <TouchableOpacity key={l} style={[styles.langBtn, lang === l && styles.langBtnActive]} onPress={() => setLang(l)}>
                <Text style={[styles.langText, lang === l && styles.langTextActive]}>{l.toUpperCase()}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity style={styles.addButton} onPress={() => { setEditingId(null); setQText(''); setOpt1(''); setOpt2(''); setOpt3(''); setOpt4(''); setModalVisible(true); }}>
            <Ionicons name="add" size={18} color="#FFF" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {submitted && (
          <View style={styles.scoreCard}>
            <Ionicons name="trophy" size={35} color="#F57C00" style={{ marginBottom: 6 }} />
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
                  <Ionicons name="create-outline" size={18} color="#1976D2" />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleDeleteQuestion(q.id)}>
                  <Ionicons name="trash-outline" size={18} color="#D32F2F" />
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
            <Text style={styles.modalTitle}>{editingId ? 'မေးခွန်း ပြင်ဆင်ရန်' : 'မေးခွန်းအသစ် ထည့်ရန်'}</Text>
            
            <Text style={styles.label}>မေးခွန်း (Question):</Text>
            <TextInput style={styles.input} value={qText} onChangeText={setQText} placeholder="မေးခွန်းရေးရန်..." />

            <Text style={styles.label}>အဖြေ (Option 1 - အမှန်):</Text>
            <TextInput style={styles.input} value={opt1} onChangeText={setOpt1} placeholder="မှန်ကန်သော အဖြေ" />

            <Text style={styles.label}>အဖြေ (Option 2):</Text>
            <TextInput style={styles.input} value={opt2} onChangeText={setOpt2} placeholder="အမှားအဖြေ" />

            <Text style={styles.label}>အဖြေ (Option 3 - ရွေးချယ်ရန်):</Text>
            <TextInput style={styles.input} value={opt3} onChangeText={setOpt3} placeholder="အမှားအဖြေ" />

            <View style={styles.modalActionRow}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalVisible(false)}>
                <Text style={styles.cancelBtnText}>ပယ်ဖျက်မည်</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleSaveQuestion}>
                <Text style={styles.saveBtnText}>သိမ်းဆည်းမည်</Text>
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
  headerTitleText: { fontSize: 15, fontWeight: 'bold', color: '#333' },
  langRow: { flexDirection: 'row', marginRight: 8 },
  langBtn: { paddingHorizontal: 5, paddingVertical: 2, borderWidth: 1, borderColor: '#DDD', borderRadius: 4, marginLeft: 3 },
  langBtnActive: { backgroundColor: '#D32F2F', borderColor: '#D32F2F' },
  langText: { fontSize: 10, color: '#666', fontWeight: 'bold' },
  langTextActive: { color: '#FFF' },
  addButton: { backgroundColor: '#D32F2F', padding: 6, borderRadius: 6, justifyContent: 'center', alignItems: 'center' },
  scrollContainer: { padding: 15 },
  scoreCard: { backgroundColor: '#FFF8E1', borderRadius: 12, padding: 15, alignItems: 'center', marginBottom: 15, elevation: 2 },
  scoreTitle: { fontSize: 14, fontWeight: 'bold', color: '#333' },
  scoreNumber: { fontSize: 26, fontWeight: 'bold', color: '#F57C00', marginVertical: 4 },
  retryBtn: { backgroundColor: '#F57C00', paddingHorizontal: 15, paddingVertical: 6, borderRadius: 6 },
  retryBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 12 },
  questionCard: { backgroundColor: '#FFFFFF', borderRadius: 10, padding: 14, marginBottom: 12, elevation: 2 },
  questionText: { fontSize: 14, fontWeight: 'bold', color: '#333', flex: 1, marginRight: 8 },
  optionBtn: { borderWidth: 1, borderColor: '#DDD', borderRadius: 6, padding: 10, marginBottom: 6, backgroundColor: '#FAFAFA' },
  optionText: { fontSize: 13, color: '#333' },
  selectedOpt: { backgroundColor: '#E3F2FD', borderColor: '#1976D2' },
  selectedText: { color: '#1976D2', fontWeight: 'bold' },
  correctOpt: { backgroundColor: '#E8F5E9', borderColor: '#4CAF50' },
  correctText: { color: '#2E7D32', fontWeight: 'bold' },
  wrongOpt: { backgroundColor: '#FFEBEE', borderColor: '#EF5350' },
  wrongText: { color: '#C62828', fontWeight: 'bold' },
  submitQuizBtn: { backgroundColor: '#D32F2F', paddingVertical: 12, borderRadius: 8, alignItems: 'center', marginTop: 10, marginBottom: 20 },
  submitQuizBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 14 },
  modalOverlay: { flex: 1, justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.6)', padding: 20 },
  modalContent: { backgroundColor: '#FFF', borderRadius: 12, padding: 20, elevation: 5 },
  modalTitle: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 12, textAlign: 'center' },
  label: { fontSize: 12, fontWeight: '600', color: '#555', marginBottom: 4, marginTop: 6 },
  input: { borderWidth: 1, borderColor: '#DDD', borderRadius: 6, paddingHorizontal: 10, paddingVertical: 6, fontSize: 13, color: '#333', backgroundColor: '#FAFAFA' },
  modalActionRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 15 },
  cancelBtn: { flex: 1, paddingVertical: 8, backgroundColor: '#E0E0E0', borderRadius: 6, alignItems: 'center', marginRight: 6 },
  cancelBtnText: { color: '#333', fontWeight: 'bold', fontSize: 12 },
  saveBtn: { flex: 1, paddingVertical: 8, backgroundColor: '#D32F2F', borderRadius: 6, alignItems: 'center', marginLeft: 6 },
  saveBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 12 }
});
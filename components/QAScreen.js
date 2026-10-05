import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, TextInput, Modal, Alert, Platform, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Speech from 'expo-speech';
import { Audio } from 'expo-av';
import { useLanguage } from '../src/LanguageContext';
import AppHeader from './AppHeader';
import BotPanel from './BotPanel';
import { QUIZ_BANK, QUIZ_LEVELS, UNLOCK_SCORE, PLACE_PASS, PLACE_Q_PER_LEVEL, sampleQuestions, shuffle, isLevelUnlocked } from './quizData/index';
import { fullDictionary as dictWords } from './dictionaryData/index';

const QA_KEY = '@japanese_qa_custom_v1';
const PROG_KEY = '@japanese_quiz_progress_v1';

const qaT = {
  my: {
    title: '📝 Quiz & Skills', tabQuiz: '📝 Quiz', tabSkills: '🎧 Skills', tabBot: '🤖 Bot',
    chooseLevel: 'အဆင့်ရွေးပြီး Quiz ဖြေပါ', unlockNeed: 'အရင်အဆင့် 70%+ ရမှ ပွင့်မယ် 🔒',
    best: 'အကောင်းဆုံး', assessed: 'သင့်အဆင့်', notAssessed: 'မစစ်ရသေးပါ',
    placementBtn: '📊 Level Check (အဆင့်စစ်မယ်)', placementDesc: 'N5→N1 တစ်ဆင့် 4 လုံးစီ — အောင်တဲ့ အမြင့်ဆုံးအဆင့် သတ်မှတ်ပေးမယ်',
    start: 'စမည်', retry: 'ပြန်ဖြေမည်', backLevels: '← အဆင့်များ', submit: 'အဖြေစစ်ဆေးမည်',
    score: 'ရမှတ်', unlocked: '🎉 နောက်အဆင့် ပွင့်သွားပြီ!', locked: '🔒 လော့ခ်ကျနေပါတယ်',
    assessedIs: 'သင့်အဆင့်:', keepGoing: 'ဆက်ကြိုးစားပါ 💪',
    skillsTitle: '4 Skills လေ့ကျင့်ခန်း',
    skListening: '🎧 Listening', skListeningD: 'အသံနားထောင် → ရွေးပါ (TTS)',
    skReading: '📖 Reading', skReadingD: 'စာပိုဒ်ဖတ် → ဖြေပါ',
    skWriting: '✍️ Writing', skWritingD: 'kana ရိုက်ထည့် → စစ်မယ်',
    skSpeaking: '🎤 Speaking', skSpeakingD: 'Model နားထောင် → record → ပြန်နားထောင်',
    playModel: '🔊 Model နားထောင်ရန်', playQ: '🔊 မေးခွန်းနားထောင်ရန်', stop: '⏹️ ရပ်',
    listenHint: '🎧 အသံနားထောင်ပြီး အဖြေရွေးပါ',
    typeReading: 'အသံထွက် (kana) ရိုက်ထည့်ပါ:', check: 'စစ်မည်', next: 'နောက်တစ်ခု →',
    correct: '✅ မှန်ပါတယ်!', wrong: '❌ မှားပါတယ်',
    answerIs: 'အမှန်မှာ:',
    record: '🎤 Record စမည်', stopRec: '⏹️ Record ရပ်မည်', playMine: '▶️ ကိုယ့်အသံ နားထောင်မည်',
    gotIt: '⭕ ရပြီ', retryIt: '❌ ထပ်လုပ်မယ်',
    selfScore: 'ကိုယ့်ဘာသာ အမှတ် (self-check)',
    practiceNote: 'Speaking は採点なし — ကိုယ့်ဘာသာ ပြန်နားထောင်ပြီး တိုးတက်မှု စစ်ပါ',
    customTitle: 'ကိုယ်တိုင်ထည့်ထားတဲ့ မေးခွန်းများ',
    addQ: 'မေးခွန်းထည့်ရန်', editQ: 'မေးခွန်း ပြင်ဆင်ရန်',
    qLabel: 'မေးခွန်း:', qPh: 'မေးခွန်းရေးရန်...',
    o1: 'အဖြေ 1:', o2: 'အဖြေ 2:', o3: 'အဖြေ 3 (optional):', o4: 'အဖြေ 4 (optional):',
    pickCorrect: 'အမှန် ရွေးပါ:', qLevel: 'Level:', cancel: 'ပယ်ဖျက်မည်', save: 'သိမ်းမည်',
    errFill: 'မေးခွန်း + အဖြေ ၂ ခု ဖြည့်ပါ။',
    delTitle: 'သတိပေးချက်', delMsg: 'ဖျက်ရန် သေချာလား?', no: 'မဖျက်ပါ', yes: 'ဖျက်မည်',
    passBadge: 'အောင် ✅', failBadge: 'မအောင်',
    micNeed: '🎤 Microphone ခွင့်ပြုချက် လိုပါတယ် — Settings မှာ ဖွင့်ပေးပါ။',
    ttsFail: 'အသံထွက်မရပါ (device TTS မရှိ) — စာဖတ်ပြီး လေ့ကျင့်ပါ။',
  },
  en: {
    title: '📝 Quiz & Skills', tabQuiz: '📝 Quiz', tabSkills: '🎧 Skills', tabBot: '🤖 Bot',
    chooseLevel: 'Pick a level', unlockNeed: 'Score 70%+ on previous level to unlock 🔒',
    best: 'Best', assessed: 'Your level', notAssessed: 'Not tested',
    placementBtn: '📊 Level Check', placementDesc: '4 questions per level N5→N1 — awards your highest passed level',
    start: 'Start', retry: 'Retry', backLevels: '← Levels', submit: 'Submit Answers',
    score: 'Score', unlocked: '🎉 Next level unlocked!', locked: '🔒 Locked',
    assessedIs: 'Your level:', keepGoing: 'Keep going 💪',
    skillsTitle: '4-Skills Practice',
    skListening: '🎧 Listening', skListeningD: 'Listen (TTS) → choose',
    skReading: '📖 Reading', skReadingD: 'Read passage → answer',
    skWriting: '✍️ Writing', skWritingD: 'Type the kana → check',
    skSpeaking: '🎤 Speaking', skSpeakingD: 'Listen model → record → compare',
    playModel: '🔊 Play model', playQ: '🔊 Play question', stop: '⏹️ Stop',
    listenHint: '🎧 Listen, then choose',
    typeReading: 'Type the reading (kana):', check: 'Check', next: 'Next →',
    correct: '✅ Correct!', wrong: '❌ Wrong',
    answerIs: 'Answer:',
    record: '🎤 Start recording', stopRec: '⏹️ Stop', playMine: '▶️ Play mine',
    gotIt: '⭕ Got it', retryIt: '❌ Retry',
    selfScore: 'Self-check score',
    practiceNote: 'Speaking is unscored — listen back and judge yourself',
    customTitle: 'My Questions',
    addQ: 'Add Question', editQ: 'Edit Question',
    qLabel: 'Question:', qPh: 'Write a question...',
    o1: 'Answer 1:', o2: 'Answer 2:', o3: 'Answer 3 (optional):', o4: 'Answer 4 (optional):',
    pickCorrect: 'Pick correct:', qLevel: 'Level:', cancel: 'Cancel', save: 'Save',
    errFill: 'Fill question + 2 answers.',
    delTitle: 'Warning', delMsg: 'Delete?', no: 'No', yes: 'Delete',
    passBadge: 'PASS ✅', failBadge: '—',
    micNeed: '🎤 Microphone permission needed — enable in Settings.',
    ttsFail: 'No TTS voice on device — read instead.',
  },
  jp: {
    title: '📝 クイズ＆技能', tabQuiz: '📝 クイズ', tabSkills: '🎧 技能', tabBot: '🤖 Bot',
    chooseLevel: 'レベルを選ぶ', unlockNeed: '前のレベルで70%以上で解放 🔒',
    best: '最高', assessed: 'あなたのレベル', notAssessed: '未測定',
    placementBtn: '📊 レベルチェック', placementDesc: 'N5→N1各4問 — 合格した最高レベルを認定',
    start: '開始', retry: 'もう一度', backLevels: '← レベル', submit: '回答する',
    score: 'スコア', unlocked: '🎉 次レベル解放！', locked: '🔒 ロック中',
    assessedIs: 'あなたのレベル:', keepGoing: '頑張って 💪',
    skillsTitle: '4技能練習',
    skListening: '🎧 聴解', skListeningD: '聞く（TTS）→ 選ぶ',
    skReading: '📖 読解', skReadingD: '文章を読む → 答える',
    skWriting: '✍️ 作文・書く', skWritingD: 'かなを入力 → チェック',
    skSpeaking: '🎤 会話', skSpeakingD: 'モデルを聞く → 録音 → 比べる',
    playModel: '🔊 モデル再生', playQ: '🔊 問題再生', stop: '⏹️ 停止',
    listenHint: '🎧 聞いてから選ぶ',
    typeReading: '読み（かな）を入力:', check: 'チェック', next: '次へ →',
    correct: '✅ 正解！', wrong: '❌ 不正解',
    answerIs: '正解:',
    record: '🎤 録音開始', stopRec: '⏹️ 停止', playMine: '▶️ 自分を再生',
    gotIt: '⭕ できた', retryIt: '❌ もう一度',
    selfScore: 'セルフチェック',
    practiceNote: 'スピーキングは採点なし — 自分で聞いて判断',
    customTitle: '自作問題',
    addQ: '問題追加', editQ: '問題編集',
    qLabel: '質問:', qPh: '質問を書く...',
    o1: '答え1:', o2: '答え2:', o3: '答え3（任意）:', o4: '答え4（任意）:',
    pickCorrect: '正解選択:', qLevel: 'レベル:', cancel: 'キャンセル', save: '保存',
    errFill: '質問＋答え2つを入力。',
    delTitle: '確認', delMsg: '削除しますか？', no: 'いいえ', yes: '削除',
    passBadge: '合格 ✅', failBadge: '—',
    micNeed: '🎤 マイク許可が必要です。',
    ttsFail: 'TTS音声がありません。',
  }
};

const ORDER = ['N5', 'N4', 'N3', 'N2', 'N1'];

export default function QAScreen({ user, onLogout, navigation }) {
  const { lang } = useLanguage();
  const t = qaT[lang] || qaT.my;

  const [tab, setTab] = useState('quiz'); // quiz | skills | bot
  const [quizView, setQuizView] = useState('levels'); // levels | round
  const [skillsView, setSkillsView] = useState('menu'); // menu | round | writing | speaking

  const [progress, setProgress] = useState({ best: {}, attempts: {}, assessed: null });
  const [round, setRound] = useState(null); // {kind,title,level,skill,questions}
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);

  // customs (my questions)
  const [customs, setCustoms] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [qText, setQText] = useState('');
  const [opt1, setOpt1] = useState('');
  const [opt2, setOpt2] = useState('');
  const [opt3, setOpt3] = useState('');
  const [opt4, setOpt4] = useState('');
  const [correctIdx, setCorrectIdx] = useState(0);
  const [qLevel, setQLevel] = useState('N5');
  const [qMedia, setQMedia] = useState('');

  // writing flow
  const [wWords, setWWords] = useState([]);
  const [wIdx, setWIdx] = useState(0);
  const [wInput, setWInput] = useState('');
  const [wFeedback, setWFeedback] = useState(null); // {ok, answer}
  const [wScore, setWScore] = useState(0);

  // speaking flow
  const [sItems, setSItems] = useState([]);
  const [sIdx, setSIdx] = useState(0);
  const [recording, setRecording] = useState(null);
  const [myAudio, setMyAudio] = useState(null);
  const [sMarks, setSMarks] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        const c = await AsyncStorage.getItem(QA_KEY);
        if (c) {
          const arr = JSON.parse(c);
          if (Array.isArray(arr)) setCustoms(arr.map((q) => ({ ...q, level: q.level || 'N5', skill: 'custom' })));
        }
        const p = await AsyncStorage.getItem(PROG_KEY);
        if (p) {
          const pj = JSON.parse(p);
          setProgress({ best: pj.best || {}, attempts: pj.attempts || {}, assessed: pj.assessed || null });
        }
      } catch (e) {}
    })();
    return () => { try { Speech.stop(); } catch (e) {} };
  }, []);

  useEffect(() => {
    AsyncStorage.setItem(PROG_KEY, JSON.stringify(progress)).catch(() => {});
  }, [progress]);

  useEffect(() => {
    AsyncStorage.setItem(QA_KEY, JSON.stringify(customs.filter((q) => q.custom !== false))).catch(() => {});
  }, [customs]);

  const speak = (text) => {
    try {
      Speech.stop();
      Speech.speak(text, { language: 'ja', rate: 0.9 });
    } catch (e) {
      Alert.alert('⚠️', t.ttsFail);
    }
  };

  // ---------- round engine ----------
  const startRound = (questions, meta) => {
    Speech.stop();
    setRound({ questions: shuffle(questions), ...meta });
    setSelectedAnswers({});
    setSubmitted(false);
    setScore(0);
    if (meta.tab === 'skills') { setTab('skills'); setSkillsView('round'); }
    else { setTab('quiz'); setQuizView('round'); }
  };

  const levelPool = (level) => {
    const bank = QUIZ_BANK[level] || [];
    const mine = customs.filter((q) => (q.level || 'N5') === level);
    return [...bank, ...mine];
  };

  const startLevelQuiz = (level) => {
    if (!isLevelUnlocked(level, progress)) {
      Alert.alert(t.locked, t.unlockNeed);
      return;
    }
    const pool = levelPool(level);
    if (pool.length === 0) return;
    startRound(pool.slice(0, 10), { kind: 'practice', title: `${level} Quiz`, level });
  };

  const startPlacement = () => {
    let qs = [];
    ORDER.forEach((lv) => { qs = qs.concat(sampleQuestions(lv, PLACE_Q_PER_LEVEL)); });
    if (qs.length === 0) return;
    startRound(qs, { kind: 'placement', title: t.placementBtn });
  };

  const startSkillRound = (skill) => {
    const openLevels = ORDER.filter((lv) => isLevelUnlocked(lv, progress));
    let pool = [];
    openLevels.forEach((lv) => { pool = pool.concat((QUIZ_BANK[lv] || []).filter((q) => q.skill === skill)); });
    if (pool.length === 0) pool = levelPool('N5');
    startRound(pool.slice(0, 8), { kind: 'skill', title: skill === 'listening' ? t.skListening : t.skReading, skill, tab: 'skills' });
  };

  const handleSelectOption = (qId, optIndex) => {
    if (submitted) return;
    setSelectedAnswers({ ...selectedAnswers, [qId]: optIndex });
  };

  const handleSubmit = () => {
    const qs = round.questions;
    let s = 0;
    qs.forEach((q) => { if (selectedAnswers[q.id] === q.correctIndex) s += 1; });
    setScore(s);
    setSubmitted(true);
    const pct = qs.length ? Math.round((s / qs.length) * 100) : 0;

    if (round.kind === 'practice' && round.level) {
      const lv = round.level;
      setProgress((prev) => ({
        ...prev,
        best: { ...prev.best, [lv]: Math.max(prev.best[lv] || 0, pct) },
        attempts: { ...prev.attempts, [lv]: (prev.attempts[lv] || 0) + 1 },
      }));
    } else if (round.kind === 'placement') {
      // level တစ်ခုချင်း % တွက် → အဆက်မပြတ် အောင်တဲ့ အမြင့်ဆုံး = assessed
      const per = {};
      ORDER.forEach((lv) => {
        const lqs = qs.filter((q) => q.level === lv);
        const ok = lqs.filter((q) => selectedAnswers[q.id] === q.correctIndex).length;
        per[lv] = lqs.length ? Math.round((ok / lqs.length) * 100) : 0;
      });
      let awarded = null;
      for (const lv of ORDER) {
        if ((per[lv] || 0) >= PLACE_PASS) awarded = lv;
        else break;
      }
      setProgress((prev) => {
        const cur = prev.assessed ? ORDER.indexOf(prev.assessed) : -1;
        const nw = awarded ? ORDER.indexOf(awarded) : -1;
        return { ...prev, assessed: nw > cur ? awarded : prev.assessed };
      });
      setRound((r) => ({ ...r, perLevel: per, awarded }));
    }
  };

  // ---------- writing ----------
  const startWriting = () => {
    Speech.stop();
    const lv = progress.assessed || 'N5';
    const pool = (dictWords || []).filter((w) => (w.level === lv || w.level === 'N5') && (w.reading || w.hiragana));
    const picks = shuffle(pool).slice(0, 10);
    if (picks.length === 0) return;
    setWWords(picks); setWIdx(0); setWInput(''); setWFeedback(null); setWScore(0);
    setTab('skills'); setSkillsView('writing');
  };

  const checkWriting = () => {
    const w = wWords[wIdx];
    const ans = (w.reading || w.hiragana || '').trim();
    const ok = wInput.trim() === ans;
    setWFeedback({ ok, answer: ans });
    if (ok) setWScore(wScore + 1);
  };

  // ---------- speaking ----------
  const startSpeaking = () => {
    Speech.stop();
    const lv = progress.assessed || 'N5';
    const pool = (QUIZ_BANK[lv] || []).concat((QUIZ_BANK.N5 || []).slice(0, 4));
    const picks = shuffle(pool).slice(0, 8);
    if (picks.length === 0) return;
    setSItems(picks); setSIdx(0); setMyAudio(null); setSMarks([]);
    setRecording(null);
    setTab('skills'); setSkillsView('speaking');
  };

  const startRec = async () => {
    try {
      const perm = await Audio.requestPermissionsAsync();
      if (!perm.granted) {
        Alert.alert('⚠️', t.micNeed);
        return;
      }
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
      const rec = new Audio.Recording();
      await rec.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      await rec.startAsync();
      setRecording(rec);
      setMyAudio(null);
    } catch (e) {
      Alert.alert('⚠️', t.micNeed);
    }
  };

  const stopRec = async () => {
    if (!recording) return;
    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setMyAudio(uri);
    } catch (e) {}
    setRecording(null);
  };

  const playMine = async () => {
    if (!myAudio) return;
    try {
      const { sound } = await Audio.Sound.createAsync({ uri: myAudio });
      await sound.playAsync();
    } catch (e) {}
  };

  // ---------- customs CRUD ----------
  const openAdd = () => {
    setEditingId(null); setQText(''); setOpt1(''); setOpt2(''); setOpt3(''); setOpt4(''); setCorrectIdx(0); setQLevel('N5'); setQMedia('');
    setModalVisible(true);
  };

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
      next = customs.map(q => q.id === editingId
        ? { ...q, question: qText, options: newOptions, correctIndex: correctIdx, level: qLevel, mediaUrl: qMedia.trim() }
        : q);
      setEditingId(null);
    } else {
      next = [...customs, {
        id: 'cq_' + Date.now().toString(36),
        question: qText, options: newOptions, correctIndex: correctIdx,
        level: qLevel, skill: 'custom', custom: true, mediaUrl: qMedia.trim(),
      }];
    }
    setCustoms(next);
    setQText(''); setOpt1(''); setOpt2(''); setOpt3(''); setOpt4(''); setCorrectIdx(0); setQMedia('');
    setModalVisible(false);
  };

  const handleEditQuestion = (item) => {
    setEditingId(item.id);
    setQText(item.question);
    setOpt1(item.options[0] || ''); setOpt2(item.options[1] || '');
    setOpt3(item.options[2] || ''); setOpt4(item.options[3] || '');
    setCorrectIdx(item.correctIndex || 0);
    setQLevel(item.level || 'N5');
    setQMedia(item.mediaUrl || '');
    setModalVisible(true);
  };

  const handleDeleteQuestion = (id) => {
    Alert.alert(t.delTitle, t.delMsg, [
      { text: t.no, style: 'cancel' },
      { text: t.yes, style: 'destructive', onPress: () => setCustoms(customs.filter(q => q.id !== id)) }
    ]);
  };

  // ---------- render helpers ----------
  const renderMcqRound = () => {
    const qs = round.questions;
    const pct = qs.length ? Math.round((score / qs.length) * 100) : 0;
    return (
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => { Speech.stop(); round.tab === 'skills' ? setSkillsView('menu') : setQuizView('levels'); setRound(null); }}
          >
            <Text style={styles.backBtnText}>{t.backLevels}</Text>
          </TouchableOpacity>
          <Text style={[styles.roundTitle, { flex: 1 }]}>{round.title}</Text>
        </View>

        {submitted && (
          <View style={styles.scoreCard}>
            <Text style={{ fontSize: 35 }}>🏆</Text>
            <Text style={styles.scoreTitle}>{t.score}</Text>
            <Text style={styles.scoreNumber}>{score} / {qs.length} ({pct}%)</Text>
            {round.kind === 'practice' && pct >= UNLOCK_SCORE && <Text style={styles.unlockText}>{t.unlocked}</Text>}
            {round.kind === 'practice' && pct < UNLOCK_SCORE && <Text style={styles.keepText}>{t.keepGoing} ({UNLOCK_SCORE}%+ → unlock)</Text>}
            {round.kind === 'placement' && (
              <Text style={styles.scoreTitle}>
                {round.awarded ? `${t.assessedIs} ${round.awarded} ${t.passBadge}` : `${t.assessedIs} —`}
              </Text>
            )}
            <View style={{ flexDirection: 'row', marginTop: 8 }}>
              <TouchableOpacity style={styles.retryBtn} onPress={() => { setSelectedAnswers({}); setSubmitted(false); setScore(0); }}>
                <Text style={styles.retryBtnText}>{t.retry}</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {qs.map((q) => (
          <View key={q.id} style={styles.questionCard}>
            {q.skill === 'reading' && !!q.passage && (
              <View style={styles.passageBox}>
                <Text style={styles.passageText}>{q.passage}</Text>
              </View>
            )}
            {q.skill === 'listening' ? (
              <View style={{ marginBottom: 8 }}>
                <Text style={styles.questionText}>{t.listenHint}</Text>
                <View style={{ flexDirection: 'row', marginTop: 8 }}>
                  <TouchableOpacity style={styles.playBtn} onPress={() => speak(q.speakText || q.question)}>
                    <Text style={styles.playBtnText}>{t.playQ}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.playBtn, { backgroundColor: '#888', marginLeft: 8 }]} onPress={() => { try { Speech.stop(); } catch (e) {} }}>
                    <Text style={styles.playBtnText}>{t.stop}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <Text style={[styles.questionText, { marginBottom: 8 }]}>{q.question}</Text>
            )}

            {!!q.mediaUrl && (
              <TouchableOpacity
                style={[styles.playBtn, { backgroundColor: '#C62828', marginBottom: 8, alignSelf: 'flex-start' }]}
                onPress={() => Linking.openURL(q.mediaUrl).catch(() => {})}
              >
                <Text style={styles.playBtnText}>🎬 Video</Text>
              </TouchableOpacity>
            )}
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
            {submitted && !!q.explanation && (
              <Text style={styles.explainText}>💡 {q.explanation}</Text>
            )}
          </View>
        ))}

        {!submitted && (
          <TouchableOpacity style={styles.submitQuizBtn} onPress={handleSubmit}>
            <Text style={styles.submitQuizBtnText}>{t.submit}</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    );
  };

  const renderQuizHome = () => (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      {/* assessed badge */}
      <View style={styles.levelCard}>
        <Text style={styles.levelCardTitle}>📊 {t.assessed}: {progress.assessed || t.notAssessed}</Text>
        <Text style={styles.levelCardSub}>{t.placementDesc}</Text>
        <TouchableOpacity style={styles.placeBtn} onPress={startPlacement}>
          <Text style={styles.placeBtnText}>{t.placementBtn}</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>{t.chooseLevel}</Text>
      {ORDER.map((lv) => {
        const unlocked = isLevelUnlocked(lv, progress);
        const best = progress.best[lv] || 0;
        const count = levelPool(lv).length;
        return (
          <TouchableOpacity
            key={lv}
            style={[styles.levelRow, !unlocked && styles.levelLocked]}
            onPress={() => startLevelQuiz(lv)}
          >
            <View style={styles.levelBadge}>
              <Text style={styles.levelBadgeText}>{lv}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.levelName}>{lv} Quiz ({count})</Text>
              <Text style={styles.levelSub}>{unlocked ? `${t.best}: ${best}%` : t.unlockNeed}</Text>
            </View>
            <Text style={{ fontSize: 22 }}>{unlocked ? (best >= UNLOCK_SCORE ? '🏅' : '▶️') : '🔒'}</Text>
          </TouchableOpacity>
        );
      })}

      {/* customs */}
      <View style={[styles.levelCard, { marginTop: 12 }]}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={styles.levelCardTitle}>✏️ {t.customTitle} ({customs.length})</Text>
          <TouchableOpacity style={styles.addButton} onPress={openAdd}>
            <Text style={{ fontSize: 16, color: '#FFF' }}>➕</Text>
          </TouchableOpacity>
        </View>
        {customs.map((q) => (
          <View key={q.id} style={styles.customRow}>
            <Text style={[styles.customQ, { flex: 1 }]} numberOfLines={2}>
              [{q.level || 'N5'}] {q.question}
            </Text>
            <TouchableOpacity onPress={() => handleEditQuestion(q)} style={{ marginHorizontal: 8 }}>
              <Text style={{ fontSize: 16 }}>✏️</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleDeleteQuestion(q.id)}>
              <Text style={{ fontSize: 16 }}>🗑️</Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>
    </ScrollView>
  );

  const renderSkillsMenu = () => {
    const skills = [
      { k: 'listening', title: t.skListening, desc: t.skListeningD, color: '#7B1FA2' },
      { k: 'reading', title: t.skReading, desc: t.skReadingD, color: '#1976D2' },
      { k: 'writing', title: t.skWriting, desc: t.skWritingD, color: '#2E7D32' },
      { k: 'speaking', title: t.skSpeaking, desc: t.skSpeakingD, color: '#E65100' },
    ];
    return (
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Text style={styles.sectionTitle}>{t.skillsTitle}</Text>
        {skills.map((s) => (
          <TouchableOpacity
            key={s.k}
            style={[styles.skillCard, { borderLeftColor: s.color }]}
            onPress={() => {
              if (s.k === 'writing') startWriting();
              else if (s.k === 'speaking') startSpeaking();
              else startSkillRound(s.k);
            }}
          >
            <Text style={styles.skillTitle}>{s.title}</Text>
            <Text style={styles.skillDesc}>{s.desc}</Text>
          </TouchableOpacity>
        ))}
        <Text style={styles.practiceNote}>{t.practiceNote}</Text>
      </ScrollView>
    );
  };

  const renderWriting = () => {
    if (wWords.length === 0) return null;
    const done = wIdx >= wWords.length;
    if (done) {
      const pct = Math.round((wScore / wWords.length) * 100);
      return (
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <View style={styles.scoreCard}>
            <Text style={{ fontSize: 35 }}>✍️</Text>
            <Text style={styles.scoreTitle}>{t.score}</Text>
            <Text style={styles.scoreNumber}>{wScore} / {wWords.length} ({pct}%)</Text>
            <View style={{ flexDirection: 'row', marginTop: 8 }}>
              <TouchableOpacity style={styles.retryBtn} onPress={startWriting}>
                <Text style={styles.retryBtnText}>{t.retry}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.retryBtn, { backgroundColor: '#888', marginLeft: 8 }]} onPress={() => setSkillsView('menu')}>
                <Text style={styles.retryBtnText}>{t.backLevels}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      );
    }
    const w = wWords[wIdx];
    return (
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <TouchableOpacity style={[styles.backBtn, { alignSelf: 'flex-start', marginBottom: 10 }]} onPress={() => setSkillsView('menu')}>
          <Text style={styles.backBtnText}>{t.backLevels}</Text>
        </TouchableOpacity>
        <View style={styles.questionCard}>
          <Text style={styles.progressText}>{wIdx + 1} / {wWords.length}</Text>
          <Text style={[styles.japaneseTextBig, { textAlign: 'center', marginVertical: 12 }]}>{w.japanese}</Text>
          <Text style={{ textAlign: 'center', color: '#666', marginBottom: 8 }}>🇲🇲 {w.myanmar} · 🇬🇧 {w.english}</Text>
          <Text style={styles.label}>{t.typeReading}</Text>
          <TextInput
            style={styles.input}
            value={wInput}
            onChangeText={(v) => { setWInput(v); setWFeedback(null); }}
            placeholder="せんせい"
            placeholderTextColor="#999"
            autoCapitalize="none"
            returnKeyType="done"
            onSubmitEditing={() => { if (!wFeedback) checkWriting(); }}
          />
          {wFeedback && (
            <Text style={[styles.feedback, wFeedback.ok ? styles.feedbackOk : styles.feedbackNo]}>
              {wFeedback.ok ? t.correct : `${t.wrong} ${t.answerIs} ${wFeedback.answer}`}
            </Text>
          )}
          <View style={{ flexDirection: 'row', marginTop: 12 }}>
            {!wFeedback ? (
              <TouchableOpacity style={styles.submitQuizBtn} onPress={checkWriting}>
                <Text style={styles.submitQuizBtnText}>{t.check}</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.submitQuizBtn}
                onPress={() => { setWIdx(wIdx + 1); setWInput(''); setWFeedback(null); }}
              >
                <Text style={styles.submitQuizBtnText}>{t.next}</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </ScrollView>
    );
  };

  const renderSpeaking = () => {
    if (sItems.length === 0) return null;
    const done = sIdx >= sItems.length;
    if (done) {
      const ok = sMarks.filter(Boolean).length;
      return (
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <View style={styles.scoreCard}>
            <Text style={{ fontSize: 35 }}>🎤</Text>
            <Text style={styles.scoreTitle}>{t.selfScore}</Text>
            <Text style={styles.scoreNumber}>⭕ {ok} / {sItems.length}</Text>
            <Text style={styles.practiceNote}>{t.practiceNote}</Text>
            <View style={{ flexDirection: 'row', marginTop: 8 }}>
              <TouchableOpacity style={styles.retryBtn} onPress={startSpeaking}>
                <Text style={styles.retryBtnText}>{t.retry}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.retryBtn, { backgroundColor: '#888', marginLeft: 8 }]} onPress={() => setSkillsView('menu')}>
                <Text style={styles.retryBtnText}>{t.backLevels}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      );
    }
    const item = sItems[sIdx];
    const speakText = item.speakText || item.question;
    return (
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <TouchableOpacity style={[styles.backBtn, { alignSelf: 'flex-start', marginBottom: 10 }]} onPress={() => { Speech.stop(); setSkillsView('menu'); }}>
          <Text style={styles.backBtnText}>{t.backLevels}</Text>
        </TouchableOpacity>
        <View style={styles.questionCard}>
          <Text style={styles.progressText}>{sIdx + 1} / {sItems.length}</Text>
          <Text style={[styles.japaneseTextBig, { textAlign: 'center', marginVertical: 8 }]}>{speakText}</Text>
          <TouchableOpacity style={styles.playBtn} onPress={() => speak(speakText)}>
            <Text style={styles.playBtnText}>{t.playModel}</Text>
          </TouchableOpacity>
          <View style={{ flexDirection: 'row', marginTop: 10 }}>
            {!recording ? (
              <TouchableOpacity style={[styles.playBtn, { backgroundColor: '#D32F2F' }]} onPress={startRec}>
                <Text style={styles.playBtnText}>{t.record}</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={[styles.playBtn, { backgroundColor: '#555' }]} onPress={stopRec}>
                <Text style={styles.playBtnText}>🔴 {t.stopRec}</Text>
              </TouchableOpacity>
            )}
            {!!myAudio && (
              <TouchableOpacity style={[styles.playBtn, { backgroundColor: '#2E7D32', marginLeft: 8 }]} onPress={playMine}>
                <Text style={styles.playBtnText}>{t.playMine}</Text>
              </TouchableOpacity>
            )}
          </View>
          {!!myAudio && !recording && (
            <View style={{ flexDirection: 'row', marginTop: 12 }}>
              <TouchableOpacity
                style={[styles.submitQuizBtn, { backgroundColor: '#2E7D32' }]}
                onPress={() => { setSMarks([...sMarks, true]); setSIdx(sIdx + 1); setMyAudio(null); }}
              >
                <Text style={styles.submitQuizBtnText}>{t.gotIt}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.submitQuizBtn, { backgroundColor: '#888', marginLeft: 8 }]}
                onPress={() => { setSMarks([...sMarks, false]); setSIdx(sIdx + 1); setMyAudio(null); }}
              >
                <Text style={styles.submitQuizBtnText}>{t.retryIt}</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <AppHeader title={t.title} user={user} onLogout={onLogout} />

      {/* Mode tabs */}
      <View style={styles.modeRow}>
        {[
          { k: 'quiz', label: t.tabQuiz },
          { k: 'skills', label: t.tabSkills },
          { k: 'bot', label: t.tabBot },
        ].map((m) => (
          <TouchableOpacity
            key={m.k}
            style={[styles.modeBtn, tab === m.k && styles.modeBtnActive]}
            onPress={() => { Speech.stop(); setTab(m.k); }}
          >
            <Text style={[styles.modeText, tab === m.k && styles.modeTextActive]}>{m.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {tab === 'quiz' && (quizView === 'levels' || !round ? renderQuizHome() : renderMcqRound())}
      {tab === 'skills' && (
        skillsView === 'menu' ? renderSkillsMenu()
        : skillsView === 'writing' ? renderWriting()
        : skillsView === 'speaking' ? renderSpeaking()
        : renderMcqRound()
      )}
      {tab === 'bot' && (
        <BotPanel
          lang={lang}
          onStartQuiz={(lv) => startLevelQuiz(lv)}
          onStartPlacement={startPlacement}
          onStartSkill={(sk) => {
            if (sk === 'writing') startWriting();
            else if (sk === 'speaking') startSpeaking();
            else startSkillRound(sk);
          }}
          onNavigate={(tabName) => { if (navigation) navigation.navigate(tabName); }}
        />
      )}

      {/* Custom Add/Edit Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{editingId ? t.editQ : t.addQ}</Text>

            <Text style={styles.label}>{t.qLabel}</Text>
            <TextInput style={styles.input} value={qText} onChangeText={setQText} placeholder={t.qPh} placeholderTextColor="#999" />

            <Text style={styles.label}>{t.o1}</Text>
            <TextInput style={styles.input} value={opt1} onChangeText={setOpt1} placeholder="..." placeholderTextColor="#999" />

            <Text style={styles.label}>{t.o2}</Text>
            <TextInput style={styles.input} value={opt2} onChangeText={setOpt2} placeholder="..." placeholderTextColor="#999" />

            <Text style={styles.label}>{t.o3}</Text>
            <TextInput style={styles.input} value={opt3} onChangeText={setOpt3} placeholder="..." placeholderTextColor="#999" />

            <Text style={styles.label}>{t.o4}</Text>
            <TextInput style={styles.input} value={opt4} onChangeText={setOpt4} placeholder="..." placeholderTextColor="#999" />

            <Text style={styles.label}>{t.pickCorrect}</Text>
            <View style={{ flexDirection: 'row', marginTop: 4 }}>
              {[opt1, opt2, opt3, opt4].map((o, idx) => {
                if (!o.trim()) return null;
                const active = correctIdx === idx;
                return (
                  <TouchableOpacity
                    key={idx}
                    style={[{ flex: 1, marginHorizontal: 3, paddingVertical: 8, borderWidth: 1, borderColor: active ? '#4CAF50' : '#DDD', borderRadius: 6, alignItems: 'center', backgroundColor: active ? '#E8F5E9' : '#FAFAFA' }]}
                    onPress={() => setCorrectIdx(idx)}
                  >
                    <Text style={{ fontSize: 12, fontWeight: 'bold', color: active ? '#2E7D32' : '#666' }}>#{idx + 1}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={styles.label}>{t.qLevel}</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 4 }}>
              {QUIZ_LEVELS.map((lv) => (
                <TouchableOpacity
                  key={lv}
                  style={[styles.lvlChip, qLevel === lv && styles.lvlChipActive]}
                  onPress={() => setQLevel(lv)}
                >
                  <Text style={[styles.lvlChipText, qLevel === lv && styles.lvlChipTextActive]}>{lv}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>🎬 Video URL (optional):</Text>
            <TextInput
              style={styles.input}
              value={qMedia}
              onChangeText={setQMedia}
              placeholder="https://youtube.com/..."
              placeholderTextColor="#999"
              autoCapitalize="none"
            />

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
  scrollContainer: { padding: 15 },
  sectionTitle: { fontSize: 14, fontWeight: 'bold', color: '#333', marginBottom: 10, fontFamily: Platform.OS === 'ios' ? 'Myanmar Sangam MN' : 'sans-serif' },
  modeRow: { flexDirection: 'row', backgroundColor: '#FFF', paddingVertical: 8, paddingHorizontal: 12, borderBottomWidth: 1, borderBottomColor: '#EEE' },
  modeBtn: { flex: 1, paddingVertical: 7, borderRadius: 18, alignItems: 'center', marginHorizontal: 3, backgroundColor: '#F0F0F0' },
  modeBtnActive: { backgroundColor: '#D32F2F' },
  modeText: { fontSize: 12, fontWeight: 'bold', color: '#666' },
  modeTextActive: { color: '#FFF' },
  levelCard: { backgroundColor: '#FFF', borderRadius: 12, padding: 15, marginBottom: 12, elevation: 2, borderWidth: 1, borderColor: '#EEE' },
  levelCardTitle: { fontSize: 14, fontWeight: 'bold', color: '#333' },
  levelCardSub: { fontSize: 11, color: '#666', marginTop: 4, lineHeight: 16 },
  placeBtn: { backgroundColor: '#7B1FA2', paddingVertical: 10, borderRadius: 8, alignItems: 'center', marginTop: 10 },
  placeBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 13 },
  levelRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderRadius: 10, padding: 12, marginBottom: 8, elevation: 1, borderWidth: 1, borderColor: '#EEE' },
  levelLocked: { opacity: 0.65 },
  levelBadge: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#D32F2F', justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  levelBadgeText: { color: '#FFF', fontWeight: 'bold', fontSize: 13 },
  levelName: { fontSize: 14, fontWeight: 'bold', color: '#333' },
  levelSub: { fontSize: 11, color: '#666', marginTop: 2 },
  addButton: { backgroundColor: '#D32F2F', padding: 8, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  customRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderTopWidth: 1, borderTopColor: '#F0F0F0' },
  customQ: { fontSize: 12, color: '#333' },
  roundTitle: { fontSize: 15, fontWeight: 'bold', color: '#333' },
  backBtn: { backgroundColor: '#EEE', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6, marginRight: 8 },
  backBtnText: { fontSize: 12, color: '#333', fontWeight: 'bold' },
  scoreCard: { backgroundColor: '#FFF8E1', borderRadius: 12, padding: 15, alignItems: 'center', marginBottom: 15, elevation: 2 },
  scoreTitle: { fontSize: 14, fontWeight: 'bold', color: '#333', fontFamily: Platform.OS === 'ios' ? 'Myanmar Sangam MN' : 'sans-serif' },
  scoreNumber: { fontSize: 26, fontWeight: 'bold', color: '#F57C00', marginVertical: 4 },
  unlockText: { fontSize: 13, color: '#2E7D32', fontWeight: 'bold', marginTop: 4 },
  keepText: { fontSize: 12, color: '#888', marginTop: 4 },
  retryBtn: { backgroundColor: '#F57C00', paddingHorizontal: 15, paddingVertical: 6, borderRadius: 6 },
  retryBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 12, fontFamily: Platform.OS === 'ios' ? 'Myanmar Sangam MN' : 'sans-serif' },
  questionCard: { backgroundColor: '#FFFFFF', borderRadius: 10, padding: 14, marginBottom: 12, elevation: 2 },
  questionText: { fontSize: 14, fontWeight: 'bold', color: '#333', fontFamily: Platform.OS === 'ios' ? 'Myanmar Sangam MN' : 'sans-serif' },
  passageBox: { backgroundColor: '#F5F5F5', borderRadius: 8, padding: 10, marginBottom: 10, borderLeftWidth: 3, borderLeftColor: '#1976D2' },
  passageText: { fontSize: 13, color: '#333', lineHeight: 20 },
  optionBtn: { borderWidth: 1, borderColor: '#DDD', borderRadius: 6, padding: 10, marginBottom: 6, backgroundColor: '#FAFAFA' },
  optionText: { fontSize: 13, color: '#333', fontFamily: Platform.OS === 'ios' ? 'Myanmar Sangam MN' : 'sans-serif' },
  selectedOpt: { backgroundColor: '#E3F2FD', borderColor: '#1976D2' },
  selectedText: { color: '#1976D2', fontWeight: 'bold' },
  correctOpt: { backgroundColor: '#E8F5E9', borderColor: '#4CAF50' },
  correctText: { color: '#2E7D32', fontWeight: 'bold' },
  wrongOpt: { backgroundColor: '#FFEBEE', borderColor: '#EF5350' },
  wrongText: { color: '#C62828', fontWeight: 'bold' },
  explainText: { fontSize: 12, color: '#555', marginTop: 6, backgroundColor: '#FFFDE7', padding: 8, borderRadius: 6, lineHeight: 17 },
  submitQuizBtn: { backgroundColor: '#D32F2F', paddingVertical: 12, borderRadius: 8, alignItems: 'center', marginTop: 10, marginBottom: 20, flex: 1 },
  submitQuizBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 14 },
  playBtn: { backgroundColor: '#7B1FA2', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, alignItems: 'center' },
  playBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 12 },
  skillCard: { backgroundColor: '#FFF', borderRadius: 10, padding: 15, marginBottom: 10, borderLeftWidth: 5, elevation: 1 },
  skillTitle: { fontSize: 15, fontWeight: 'bold', color: '#333' },
  skillDesc: { fontSize: 12, color: '#666', marginTop: 4 },
  practiceNote: { fontSize: 11, color: '#888', textAlign: 'center', marginTop: 8, lineHeight: 16 },
  progressText: { fontSize: 12, color: '#888', fontWeight: 'bold' },
  japaneseTextBig: { fontSize: 28, fontWeight: 'bold', color: '#D32F2F' },
  label: { fontSize: 12, fontWeight: '600', color: '#555', marginBottom: 4, marginTop: 8 },
  input: { borderWidth: 1, borderColor: '#DDD', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 9, fontSize: 15, color: '#333', backgroundColor: '#FAFAFA' },
  feedback: { fontSize: 14, fontWeight: 'bold', marginTop: 10, textAlign: 'center' },
  feedbackOk: { color: '#2E7D32' },
  feedbackNo: { color: '#C62828' },
  lvlChip: { paddingHorizontal: 12, paddingVertical: 5, borderWidth: 1, borderColor: '#DDD', borderRadius: 14, marginRight: 6, marginBottom: 6 },
  lvlChipActive: { backgroundColor: '#D32F2F', borderColor: '#D32F2F' },
  lvlChipText: { fontSize: 11, fontWeight: 'bold', color: '#666' },
  lvlChipTextActive: { color: '#FFF' },
  modalOverlay: { flex: 1, justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.6)', padding: 20 },
  modalContent: { backgroundColor: '#FFF', borderRadius: 12, padding: 20, elevation: 5, maxHeight: '92%' },
  modalTitle: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 12, textAlign: 'center' },
  modalActionRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 15 },
  cancelBtn: { flex: 1, paddingVertical: 8, backgroundColor: '#E0E0E0', borderRadius: 6, alignItems: 'center', marginRight: 6 },
  cancelBtnText: { color: '#333', fontWeight: 'bold', fontSize: 12 },
  saveBtn: { flex: 1, paddingVertical: 8, backgroundColor: '#D32F2F', borderRadius: 6, alignItems: 'center', marginLeft: 6 },
  saveBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 12 },
});

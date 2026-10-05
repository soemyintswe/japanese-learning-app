import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, FlatList, TouchableOpacity, Modal, Alert, Image, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { iconNameToEmoji } from './AppIcon';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Sharing from 'expo-sharing';
import * as Clipboard from 'expo-clipboard';
import { useLanguage } from '../src/LanguageContext';
import AppHeader from './AppHeader';
import { dictionaryDatabase } from './dictionaryData/fullDictionary';
import { fullDictionary as modularDictionary, LEVELS, POS_LIST, normalizeImportEntry } from './dictionaryData/index';

const dictT = {
  my: {
    header: '📖 ဂျပန်-မြန်မာ-အင်္ဂလိပ် အဘိဓာန်', add: 'အသစ်', search: 'စကားလုံး ရှာရန်',
    total: 'လုံး', all: 'အားလုံး', editTitle: 'စကားလုံး ပြင်ဆင်ရန်', newTitle: 'စကားလုံးအသစ် ထည့်ရန်',
    jpLabel: 'ဂျပန်စကားလုံး (Japanese):', jpPh: 'ဥပမာ - 先生',
    readingLabel: 'အသံထွက် (Reading/kana):', readingPh: 'ဥပမာ - せんせい',
    myLabel: 'မြန်မာအဓိပ္ပာယ် (Myanmar):', myPh: 'ဥပမာ - ဆရာ',
    enLabel: 'အင်္ဂလိပ်အဓိပ္ပာယ် (English):', enPh: 'ဥပမာ - Teacher',
    posLabel: 'စကားလုံးအမျိုးအစား (POS):',
    level: 'အဆင့် (Level):', cancel: 'ပယ်ဖျက်မည်', save: 'သိမ်းဆည်းမည်',
    errFill: 'ဂျပန်စကားလုံးနှင့် အဓိပ္ပာယ် (မြန်မာ/အင်္ဂလိပ်) အနည်းဆုံးတစ်ခုခု ဖြည့်ပါ။',
    delTitle: 'သတိပေးချက်', delMsg: 'ဤစကားလုံးကို ဖျက်ရန် သေချာပါသလား?',
    no: 'မဖျက်ပါ', yes: 'ဖျက်မည်',
    importBtn: '📥', exportBtn: '📤',
    impTitle: '📥 စကားလုံး Import လုပ်ရန်', impHelp: 'ကိုယ့် JSON file ရွေးပါ၊ သို့မဟုတ် JSON paste လုပ်ပါ။\nApp format + OpenJLPT format ၂ မျိုးလုံး ရတယ်။',
    impFile: '📁 File ရွေးမယ်', impPh: '[{"japanese":"先生","reading":"せんせい","myanmar":"ဆရာ","english":"Teacher","level":"N5"}] ...',
    impDo: 'ထည့်သွင်းမည်', impOk: 'Import ပြီးပါပြီ ✅', impNone: 'ထည့်စရာ အသစ်မတွေ့ပါ (အားလုံး ထပ်နေတယ်)။',
    impInvalid: 'JSON ပုံစံမှားနေပါတယ် — array သို့မဟုတ် {words:[...]} ဖြစ်ရမယ်။',
    expTitle: '📤 စကားလုံး Export (Backup) လုပ်ရန်',
    expAll: 'အားလုံး (base + ကိုယ်ထည့်ထားတာ)', expCustom: 'ကိုယ်ထည့်ထားတာသာ',
    expDo: 'Export လုပ်မည်', expDone: 'Export ပြီးပါပြီ ✅', expCopied: 'Clipboard မှာ ကူးပြီးပါပြီ ✅ (Share မရလို့)',
    tapHint: '💡 စကားလုံးကတ်ကို နှိပ်ရင် အဓိပ္ပာယ်အပြည့်အစုံ ဖြန့်ကြည့်လို့ရပါတယ်',
    levelInfoTitle: '🎚️ JLPT Level အဓိပ္ပာယ်',
    levelInfoAll: 'စုစုပေါင်း စကားလုံး',
    levelInfo: {
      N5: 'N5 — အခြေခံအဆင့်: နေ့စဉ်သုံး အရိုးရှင်းဆုံး စကားလုံး/သဒ္ဒါ (အစပြု သင်ယူသူများ)',
      N4: 'N4 — အခြေခံအထက်: နေ့စဉ်ဘဝုံး စကားလုံးများ (N5 ပြီးသူများ)',
      N3: 'N3 — အလယ်အလတ်: သတင်းစာအခြေခံ + နေ့စဉ်စကားပြော ကျယ်ပြန့်လာ',
      N2: 'N2 — အလယ်အလတ်အထက်: အလုပ်/ကျောင်းသုံး စကားလုံး (ဂျပန်အလုပ်လျှောက်ရန် လိုအပ်ချက်)',
      N1: 'N1 — အမြင့်ဆုံး: သတင်းစာ/စာပေ/အစီရင်ခံစာ အဆင့် စကားလုံး',
    },
    detailMeaning: 'အဓိပ္ပာယ်', detailReading: 'အသံထွက်', detailPos: 'အမျိုးအစား', detailLevel: 'အဆင့်',
    editWord: '✏️ ပြင်မည်', deleteWord: '🗑️ ဖျက်မည်',
  },
  en: {
    header: '📖 Japanese-Myanmar-English Dictionary', add: 'New', search: 'Search words',
    total: 'words', all: 'All', editTitle: 'Edit Word', newTitle: 'Add New Word',
    jpLabel: 'Japanese:', jpPh: 'e.g. 先生',
    readingLabel: 'Reading (kana):', readingPh: 'e.g. せんせい',
    myLabel: 'Myanmar meaning:', myPh: 'e.g. Teacher (MM)',
    enLabel: 'English meaning:', enPh: 'e.g. Teacher',
    posLabel: 'Part of speech (POS):',
    level: 'Level:', cancel: 'Cancel', save: 'Save',
    errFill: 'Please fill in the Japanese word and at least one meaning.',
    delTitle: 'Warning', delMsg: 'Are you sure to delete this word?',
    no: 'No', yes: 'Delete',
    importBtn: '📥', exportBtn: '📤',
    impTitle: '📥 Import Words', impHelp: 'Pick your JSON file or paste JSON.\nBoth app format and OpenJLPT format work.',
    impFile: '📁 Pick File', impPh: '[{"japanese":"...","reading":"...","myanmar":"...","english":"...","level":"N5"}] ...',
    impDo: 'Import', impOk: 'Import done ✅', impNone: 'Nothing new (all duplicates).',
    impInvalid: 'Invalid JSON — must be an array or {words:[...]}.',
    expTitle: '📤 Export (Backup) Words',
    expAll: 'All (base + mine)', expCustom: 'Mine only',
    expDo: 'Export', expDone: 'Export done ✅', expCopied: 'Copied to clipboard ✅ (Share unavailable)',
    tapHint: '💡 Tap a word card to expand full details',
    levelInfoTitle: '🎚️ JLPT Level Guide',
    levelInfoAll: 'Total words',
    levelInfo: {
      N5: 'N5 — Beginner: simplest everyday words & grammar (start here)',
      N4: 'N4 — Elementary: daily-life words (after N5)',
      N3: 'N3 — Intermediate: broader daily + news basics',
      N2: 'N2 — Upper-intermediate: work/study words (often required for jobs)',
      N1: 'N1 — Advanced: newspapers, literature & reports',
    },
    detailMeaning: 'Meaning', detailReading: 'Reading', detailPos: 'Type', detailLevel: 'Level',
    editWord: '✏️ Edit', deleteWord: '🗑️ Delete',
  },
  jp: {
    header: '📖 日・ミャンマー・英辞書', add: '新規', search: '単語を検索',
    total: '語', all: 'すべて', editTitle: '単語を編集', newTitle: '新しい単語を追加',
    jpLabel: '日本語:', jpPh: '例 - 先生',
    readingLabel: '読み（かな）:', readingPh: '例 - せんせい',
    myLabel: 'ミャンマー語の意味:', myPh: '例 - 先生 (MM)',
    enLabel: '英語の意味:', enPh: '例 - Teacher',
    posLabel: '品詞 (POS):',
    level: 'レベル:', cancel: 'キャンセル', save: '保存',
    errFill: '日本語の単語と意味を少なくとも1つ入力してください。',
    delTitle: '確認', delMsg: 'この単語を削除しますか？',
    no: 'いいえ', yes: '削除',
    importBtn: '📥', exportBtn: '📤',
    impTitle: '📥 単語インポート', impHelp: 'JSONファイルを選択するか、JSONを貼り付け。\nアプリ形式・OpenJLPT形式どちらも可。',
    impFile: '📁 ファイル選択', impPh: '[{"japanese":"...","reading":"...","myanmar":"...","english":"...","level":"N5"}] ...',
    impDo: 'インポート', impOk: 'インポート完了 ✅', impNone: '新規なし（すべて重複）。',
    impInvalid: 'JSON形式が正しくありません。',
    expTitle: '📤 単語エクスポート（バックアップ）',
    expAll: 'すべて', expCustom: '自分の分のみ',
    expDo: 'エクスポート', expDone: 'エクスポート完了 ✅', expCopied: 'クリップボードにコピー ✅',
    tapHint: '💡 カードをタップで詳細表示',
    levelInfoTitle: '🎚️ JLPTレベル案内',
    levelInfoAll: '総単語数',
    levelInfo: {
      N5: 'N5 — 初級：最も基本的な日常語・文法（ここから）',
      N4: 'N4 — 初級上：日常生活の語彙（N5の次）',
      N3: 'N3 — 中級：日常＋新聞基礎まで拡大',
      N2: 'N2 — 中上級：仕事・留学に必要な語彙',
      N1: 'N1 — 上級：新聞・文学・レポートレベル',
    },
    detailMeaning: '意味', detailReading: '読み', detailPos: '品詞', detailLevel: 'レベル',
    editWord: '✏️ 編集', deleteWord: '🗑️ 削除',
  },
};

const DICT_CUSTOM_KEY = '@japanese_dict_custom_v1';

// Sample + modular lists merge + dedupe (same word+reading+gloss once)
const baseDictionary = (() => {
  const combined = [...(dictionaryDatabase || []), ...(modularDictionary || [])];
  const seen = new Set();
  return combined.filter((w) => {
    const key = `${w.japanese}||${w.reading || w.hiragana || ''}||${w.myanmar}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
})();

const POS_EMOJI = {
  noun: '📦', verb: '🏃', 'adj-i': '✨', 'adj-na': '✨', adverb: '💨',
  pronoun: '👤', conjunction: '🔗', expression: '💬', number: '🔢',
};
const posEmoji = (pos) => POS_EMOJI[pos] || '📚';
const readingOf = (item) => item.reading || item.hiragana || '';

export default function DictionaryScreen({ user, onLogout }) {
  const { lang } = useLanguage();
  const t = dictT[lang] || dictT.my;
  const [searchQuery, setSearchQuery] = useState('');
  const [levelFilter, setLevelFilter] = useState('All');
  const [data, setData] = useState(baseDictionary);

  // ကိုယ်တိုင်ထည့်/import လုပ်ထားတာတွေ ဖုန်းထဲမှာ သိမ်းမယ်
  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem(DICT_CUSTOM_KEY);
        if (saved) {
          const custom = JSON.parse(saved);
          if (Array.isArray(custom) && custom.length > 0) {
            setData([...custom, ...baseDictionary]);
          }
        }
      } catch (e) { console.log('Load dict error', e.message); }
    })();
  }, []);

  const persistCustom = (all) => {
    const custom = all.filter((w) => !baseDictionary.some((b) => b.id === w.id));
    AsyncStorage.setItem(DICT_CUSTOM_KEY, JSON.stringify(custom)).catch(() => {});
  };

  const isCustom = (w) => !baseDictionary.some((b) => b.id === w.id);

  const [modalVisible, setModalVisible] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [jp, setJp] = useState('');
  const [reading, setReading] = useState('');
  const [my, setMy] = useState('');
  const [en, setEn] = useState('');
  const [pos, setPos] = useState('noun');
  const [level, setLevel] = useState('N5');

  // Import / Export states
  const [impVisible, setImpVisible] = useState(false);
  const [impText, setImpText] = useState('');
  const [expVisible, setExpVisible] = useState(false);
  const [expScope, setExpScope] = useState('all');

  // နှိပ်ပြီး ဖြန့်ကြည့်ရန် (expanded card)
  const [expandedId, setExpandedId] = useState(null);

  // Level အဓိပ္ပာယ် ပြရန် — chip ဖိထား (long-press) သို့မဟုတ် ⓘ နှိပ်
  const showLevelInfo = (lv) => {
    if (lv === 'All') {
      const lines = LEVELS.map((l) => `• ${t.levelInfo[l]} (${levelCounts[l] || 0})`).join('\n\n');
      Alert.alert(t.levelInfoTitle, `${t.levelInfoAll}: ${data.length}\n\n${lines}`);
    } else {
      Alert.alert(`🎚️ ${lv}`, `${t.levelInfo[lv] || ''}\n\n(${lv}: ${levelCounts[lv] || 0} ${t.total})`);
    }
  };

  const openAdd = () => {
    setEditingId(null); setJp(''); setReading(''); setMy(''); setEn(''); setPos('noun'); setLevel('N5');
    setModalVisible(true);
  };

  // Search (JP + kana + MM + EN) + Level filter
  const filteredData = data.filter(item => {
    if (levelFilter !== 'All' && item.level !== levelFilter) return false;
    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;
    return (
      (item.japanese && item.japanese.toLowerCase().includes(q)) ||
      (readingOf(item) && readingOf(item).toLowerCase().includes(q)) ||
      (item.myanmar && item.myanmar.includes(searchQuery.trim())) ||
      (item.english && item.english.toLowerCase().includes(q))
    );
  });

  const levelCounts = {};
  data.forEach((w) => { levelCounts[w.level] = (levelCounts[w.level] || 0) + 1; });

  const handleSaveWord = () => {
    if (!jp.trim() || (!my.trim() && !en.trim())) {
      Alert.alert('⚠️', t.errFill);
      return;
    }

    let next;
    if (editingId) {
      next = data.map(item => item.id === editingId
        ? { ...item, japanese: jp.trim(), reading: reading.trim(), myanmar: my.trim(), english: en.trim() || 'N/A', pos, level }
        : item);
      setEditingId(null);
    } else {
      const newItem = {
        id: 'c_' + Date.now().toString(36),
        japanese: jp.trim(),
        reading: reading.trim(),
        myanmar: my.trim(),
        english: en.trim() || 'N/A',
        pos, level,
      };
      next = [newItem, ...data];
    }
    setData(next);
    persistCustom(next);

    setJp(''); setReading(''); setMy(''); setEn('');
    setModalVisible(false);
  };

  const handleEdit = (item) => {
    setEditingId(item.id);
    setJp(item.japanese || '');
    setReading(readingOf(item));
    setMy(item.myanmar || '');
    setEn(item.english || '');
    setPos(item.pos || 'noun');
    setLevel(item.level || 'N5');
    setModalVisible(true);
  };

  const handleDelete = (id) => {
    Alert.alert(t.delTitle, t.delMsg, [
      { text: t.no, style: 'cancel' },
      {
        text: t.yes, style: 'destructive', onPress: () => {
          const next = data.filter(item => item.id !== id);
          setData(next);
          persistCustom(next);
        }
      }
    ]);
  };

  // ---------- Import ----------
  const doImportFromText = (text) => {
    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch (e) {
      Alert.alert('⚠️', t.impInvalid);
      return;
    }
    const arr = Array.isArray(parsed) ? parsed : parsed.words;
    if (!Array.isArray(arr)) {
      Alert.alert('⚠️', t.impInvalid);
      return;
    }
    const existing = new Set(data.map((w) => `${w.japanese}||${readingOf(w)}||${w.myanmar}`));
    const fresh = [];
    arr.forEach((e, idx) => {
      const n = normalizeImportEntry(e, idx);
      if (!n) return;
      const key = `${n.japanese}||${n.reading}||${n.myanmar}`;
      if (existing.has(key)) return;
      existing.add(key);
      fresh.push(n);
    });
    if (fresh.length === 0) {
      Alert.alert('ℹ️', t.impNone);
      return;
    }
    const next = [...fresh, ...data];
    setData(next);
    persistCustom(next);
    setImpText('');
    setImpVisible(false);
    Alert.alert('✅', `${t.impOk} (+${fresh.length})`);
  };

  const handlePickFile = async () => {
    try {
      const DP = require('expo-document-picker');
      const res = await DP.getDocumentAsync({ type: ['application/json', 'text/plain'], copyToCacheDirectory: true });
      if (res.canceled) return;
      const uri = res.assets && res.assets[0] ? res.assets[0].uri : null;
      if (!uri) return;
      // file:// + web blob: URL နှစ်ခုလုံး fetch() နဲ့ ဖတ်လို့ရတယ်
      const resp = await fetch(uri);
      const text = await resp.text();
      setImpText(text);
    } catch (e) {
      Alert.alert('⚠️', String(e.message || e));
    }
  };

  // ---------- Export ----------
  const handleExport = async () => {
    const words = expScope === 'custom' ? data.filter(isCustom) : data;
    const payload = JSON.stringify({
      app: 'JapaneseStudyPlanner-dict', version: 1,
      exportedAt: new Date().toISOString(), count: words.length, words,
    }, null, 2);
    const fileName = `japanese-dict-${expScope}-${words.length}words.json`;
    try {
      if (Platform.OS === 'web' && typeof document !== 'undefined') {
        // Web: browser download
        const blob = new Blob([payload], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 5000);
        Alert.alert('✅', `${t.expDone} (${words.length})`);
      } else {
        // Native: file ရေး → Share sheet
        const FS = require('expo-file-system');
        const file = new FS.File(FS.Paths.cache, fileName);
        const writable = file.writableStream();
        const writer = writable.getWriter();
        await writer.write(new TextEncoder().encode(payload));
        await writer.close();
        const canShare = await Sharing.isAvailableAsync();
        if (canShare) {
          await Sharing.shareAsync(file.uri, { mimeType: 'application/json', dialogTitle: t.expTitle });
        } else {
          throw new Error('share-unavailable');
        }
        Alert.alert('✅', `${t.expDone} (${words.length})`);
      }
    } catch (e) {
      // Fallback: clipboard ကူး
      try {
        await Clipboard.setStringAsync(payload);
        Alert.alert('✅', `${t.expCopied} (${words.length})`);
      } catch (e2) {
        Alert.alert('⚠️', String((e && e.message) || e));
      }
    } finally {
      setExpVisible(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <AppHeader
        title={t.header}
        user={user}
        onLogout={onLogout}
        action={
          <View style={{ flexDirection: 'row' }}>
            <TouchableOpacity style={[styles.addBtn, { backgroundColor: '#1976D2', marginRight: 6 }]} onPress={() => setImpVisible(true)}>
              <Text style={styles.addBtnText}>{t.importBtn}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.addBtn, { backgroundColor: '#388E3C', marginRight: 6 }]} onPress={() => setExpVisible(true)}>
              <Text style={styles.addBtnText}>{t.exportBtn}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.addBtn} onPress={openAdd}>
              <Text style={{ fontSize: 16, color: '#FFF' }}>➕</Text>
              <Text style={styles.addBtnText}> {t.add}</Text>
            </TouchableOpacity>
          </View>
        }
      />

      {/* Search Input */}
      <View style={styles.searchContainer}>
        <Text style={{ fontSize: 18, color: '#888', marginRight: 8 }}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder={`${t.search} (${filteredData.length}/${data.length} ${t.total})...`}
          placeholderTextColor="#888"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Level filter chips — နှိပ် = filter, ဖိထား = အဓိပ္ပာယ် */}
      <View style={styles.filterRow}>
        {['All', ...LEVELS].map((lv) => (
          <TouchableOpacity
            key={lv}
            style={[styles.filterChip, levelFilter === lv && styles.filterChipActive]}
            onPress={() => setLevelFilter(lv)}
            onLongPress={() => showLevelInfo(lv)}
            delayLongPress={400}
          >
            <Text style={[styles.filterText, levelFilter === lv && styles.filterTextActive]}>
              {lv === 'All' ? t.all : lv} ({lv === 'All' ? data.length : (levelCounts[lv] || 0)})
            </Text>
          </TouchableOpacity>
        ))}
        <TouchableOpacity style={[styles.filterChip, styles.infoChip]} onPress={() => showLevelInfo('All')}>
          <Text style={styles.filterText}>ⓘ</Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.tapHint}>{t.tapHint}</Text>

      {/* Optimized FlatList */}
      <FlatList
        data={filteredData}
        keyExtractor={(item) => item.id.toString()}
        initialNumToRender={10}
        maxToRenderPerBatch={10}
        windowSize={5}
        contentContainerStyle={styles.listContainer}
        renderItem={({ item }) => {
          const expanded = expandedId === item.id;
          return (
            <TouchableOpacity
              style={[styles.cardItem, expanded && styles.cardItemExpanded]}
              onPress={() => setExpandedId(expanded ? null : item.id)}
              activeOpacity={0.85}
            >
              {item.image ? (
                <Image source={{ uri: item.image }} style={styles.wordImage} />
              ) : (
                <View style={styles.iconBox}>
                  <Text style={{ fontSize: 20 }}>{iconNameToEmoji(item.icon, posEmoji(item.pos))}</Text>
                </View>
              )}

              <View style={{ flex: 1, marginLeft: 10 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' }}>
                  <Text style={[styles.japaneseText, expanded && styles.japaneseTextBig]}>{item.japanese}</Text>
                  <TouchableOpacity
                    style={styles.badge}
                    onPress={() => showLevelInfo(item.level || 'All')}
                    onLongPress={() => showLevelInfo(item.level || 'All')}
                  >
                    <Text style={styles.badgeText}>{item.level || '?'} ⓘ</Text>
                  </TouchableOpacity>
                  {!!item.pos && (
                    <View style={[styles.badge, { backgroundColor: '#E3F2FD', marginLeft: 4 }]}>
                      <Text style={[styles.badgeText, { color: '#1976D2' }]}>{item.pos}</Text>
                    </View>
                  )}
                </View>
                {!!readingOf(item) && (
                  <Text style={[styles.readingText, expanded && styles.readingTextBig]}>
                    {t.detailReading}: {readingOf(item)}
                  </Text>
                )}
                {!expanded ? (
                  <>
                    <Text style={styles.myanmarText} numberOfLines={1}>🇲🇲 {item.myanmar || '—'}</Text>
                    <Text style={styles.englishText} numberOfLines={1}>🇬🇧 {item.english}</Text>
                    <Text style={styles.expandHint}>▼</Text>
                  </>
                ) : (
                  <View style={styles.detailBox}>
                    <Text style={styles.detailLabel}>{t.detailMeaning}</Text>
                    <Text style={styles.detailMM}>🇲🇲 {item.myanmar || '—'}</Text>
                    <Text style={styles.detailEN}>🇬🇧 {item.english || '—'}</Text>
                    <Text style={styles.detailMeta}>{t.detailLevel}: {item.level} — {t.levelInfo[item.level] || ''}</Text>
                    <View style={styles.detailActions}>
                      <TouchableOpacity style={styles.detailBtn} onPress={() => handleEdit(item)}>
                        <Text style={styles.detailBtnText}>{t.editWord}</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={[styles.detailBtn, { backgroundColor: '#FFEBEE' }]} onPress={() => handleDelete(item.id)}>
                        <Text style={[styles.detailBtnText, { color: '#C62828' }]}>{t.deleteWord}</Text>
                      </TouchableOpacity>
                    </View>
                    <Text style={styles.expandHint}>▲</Text>
                  </View>
                )}
              </View>

              {!expanded && (
                <View style={{ flexDirection: 'row' }}>
                  <TouchableOpacity onPress={() => handleEdit(item)} style={{ marginRight: 12 }}>
                    <Text style={{ fontSize: 18 }}>✏️</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleDelete(item.id)}>
                    <Text style={{ fontSize: 18 }}>🗑️</Text>
                  </TouchableOpacity>
                </View>
              )}
            </TouchableOpacity>
          );
        }}
      />

      {/* Add/Edit Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{editingId ? t.editTitle : t.newTitle}</Text>

            <Text style={styles.label}>{t.jpLabel}</Text>
            <TextInput style={styles.input} value={jp} onChangeText={setJp} placeholder={t.jpPh} placeholderTextColor="#999" />

            <Text style={styles.label}>{t.readingLabel}</Text>
            <TextInput style={styles.input} value={reading} onChangeText={setReading} placeholder={t.readingPh} placeholderTextColor="#999" />

            <Text style={styles.label}>{t.myLabel}</Text>
            <TextInput style={styles.input} value={my} onChangeText={setMy} placeholder={t.myPh} placeholderTextColor="#999" />

            <Text style={styles.label}>{t.enLabel}</Text>
            <TextInput style={styles.input} value={en} onChangeText={setEn} placeholder={t.enPh} placeholderTextColor="#999" />

            <Text style={styles.label}>{t.posLabel}</Text>
            <View style={styles.posRow}>
              {POS_LIST.map((p) => (
                <TouchableOpacity key={p} style={[styles.posChip, pos === p && styles.posChipActive]} onPress={() => setPos(p)}>
                  <Text style={[styles.posText, pos === p && styles.posTextActive]}>{p}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>{t.level}</Text>
            <View style={styles.levelRow}>
              {LEVELS.map(lvl => (
                <TouchableOpacity key={lvl} style={[styles.lvlBtn, level === lvl && styles.lvlBtnActive]} onPress={() => setLevel(lvl)}>
                  <Text style={[styles.lvlText, level === lvl && styles.lvlTextActive]}>{lvl}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.modalActionRow}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalVisible(false)}><Text style={styles.cancelBtnText}>{t.cancel}</Text></TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleSaveWord}><Text style={styles.saveBtnText}>{t.save}</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Import Modal */}
      <Modal visible={impVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{t.impTitle}</Text>
            <Text style={styles.helpText}>{t.impHelp}</Text>
            <TouchableOpacity style={[styles.saveBtn, { backgroundColor: '#1976D2', paddingVertical: 10, borderRadius: 6, alignItems: 'center', marginBottom: 8 }]} onPress={handlePickFile}>
              <Text style={styles.saveBtnText}>{t.impFile}</Text>
            </TouchableOpacity>
            <TextInput
              style={[styles.input, { height: 140, textAlignVertical: 'top' }]}
              value={impText}
              onChangeText={setImpText}
              placeholder={t.impPh}
              placeholderTextColor="#999"
              multiline={true}
            />
            <View style={styles.modalActionRow}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => { setImpVisible(false); setImpText(''); }}><Text style={styles.cancelBtnText}>{t.cancel}</Text></TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={() => doImportFromText(impText)}><Text style={styles.saveBtnText}>{t.impDo}</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Export Modal */}
      <Modal visible={expVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{t.expTitle}</Text>
            {['all', 'custom'].map((s) => (
              <TouchableOpacity
                key={s}
                style={[styles.scopeRow, expScope === s && styles.scopeRowActive]}
                onPress={() => setExpScope(s)}
              >
                <Text style={{ fontSize: 20 }}>{expScope === s ? '✅' : '⬜'}</Text>
                <Text style={styles.scopeText}>
                  {s === 'all' ? `${t.expAll} (${data.length})` : `${t.expCustom} (${data.filter(isCustom).length})`}
                </Text>
              </TouchableOpacity>
            ))}
            <View style={styles.modalActionRow}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setExpVisible(false)}><Text style={styles.cancelBtnText}>{t.cancel}</Text></TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleExport}><Text style={styles.saveBtnText}>{t.expDo}</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  addBtn: { backgroundColor: '#D32F2F', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6 },
  addBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 11, fontFamily: Platform.OS === 'ios' ? 'Myanmar Sangam MN' : 'sans-serif' },
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', margin: 12, marginBottom: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: '#DDD' },
  searchInput: { flex: 1, fontSize: 13, color: '#333', fontFamily: Platform.OS === 'ios' ? 'Myanmar Sangam MN' : 'sans-serif' },
  filterRow: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 12, paddingBottom: 6 },
  filterChip: { paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: '#DDD', borderRadius: 14, marginRight: 6, marginBottom: 6, backgroundColor: '#FFF' },
  filterChipActive: { backgroundColor: '#D32F2F', borderColor: '#D32F2F' },
  filterText: { fontSize: 11, color: '#666', fontWeight: 'bold' },
  filterTextActive: { color: '#FFF' },
  infoChip: { backgroundColor: '#E3F2FD', borderColor: '#90CAF9' },
  tapHint: { fontSize: 10, color: '#999', paddingHorizontal: 14, paddingBottom: 4 },
  cardItemExpanded: { borderColor: '#D32F2F', borderWidth: 1 },
  japaneseTextBig: { fontSize: 20 },
  readingTextBig: { fontSize: 13, color: '#555' },
  expandHint: { fontSize: 10, color: '#BBB', textAlign: 'center', marginTop: 2 },
  detailBox: { marginTop: 8, backgroundColor: '#FAFAFA', borderRadius: 8, padding: 10, borderWidth: 1, borderColor: '#EEE' },
  detailLabel: { fontSize: 10, fontWeight: 'bold', color: '#999', marginBottom: 4 },
  detailMM: { fontSize: 14, color: '#222', lineHeight: 20, fontFamily: Platform.OS === 'ios' ? 'Myanmar Sangam MN' : 'sans-serif' },
  detailEN: { fontSize: 13, color: '#555', fontStyle: 'italic', marginTop: 4 },
  detailMeta: { fontSize: 11, color: '#666', marginTop: 8, lineHeight: 16 },
  detailActions: { flexDirection: 'row', marginTop: 10 },
  detailBtn: { flex: 1, backgroundColor: '#E3F2FD', borderRadius: 6, paddingVertical: 8, alignItems: 'center', marginRight: 6 },
  detailBtnText: { color: '#1976D2', fontWeight: 'bold', fontSize: 12 },
  listContainer: { paddingHorizontal: 12, paddingBottom: 20 },
  cardItem: { backgroundColor: '#FFFFFF', borderRadius: 10, padding: 12, marginBottom: 8, flexDirection: 'row', alignItems: 'center', elevation: 2 },
  wordImage: { width: 45, height: 45, borderRadius: 8, backgroundColor: '#EEE' },
  iconBox: { width: 45, height: 45, backgroundColor: '#FFEBEE', borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  japaneseText: { fontSize: 14, fontWeight: 'bold', color: '#D32F2F', marginRight: 8, fontFamily: Platform.OS === 'ios' ? 'Myanmar Sangam MN' : 'sans-serif' },
  readingText: { fontSize: 11, color: '#888', marginTop: 1 },
  myanmarText: { fontSize: 12, color: '#333', marginTop: 2, fontFamily: Platform.OS === 'ios' ? 'Myanmar Sangam MN' : 'sans-serif' },
  englishText: { fontSize: 11, color: '#666', fontStyle: 'italic', fontFamily: Platform.OS === 'ios' ? 'Myanmar Sangam MN' : 'sans-serif' },
  badge: { backgroundColor: '#FFEBEE', paddingHorizontal: 5, paddingVertical: 1, borderRadius: 4 },
  badgeText: { color: '#D32F2F', fontSize: 9, fontWeight: 'bold', fontFamily: Platform.OS === 'ios' ? 'Myanmar Sangam MN' : 'sans-serif' },
  modalOverlay: { flex: 1, justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.6)', padding: 15 },
  modalContent: { backgroundColor: '#FFF', borderRadius: 12, padding: 18, elevation: 5, maxHeight: '92%' },
  modalTitle: { fontSize: 14, fontWeight: 'bold', color: '#333', marginBottom: 12, textAlign: 'center', fontFamily: Platform.OS === 'ios' ? 'Myanmar Sangam MN' : 'sans-serif' },
  helpText: { fontSize: 11, color: '#666', marginBottom: 8, lineHeight: 16 },
  label: { fontSize: 11, fontWeight: '600', color: '#555', marginBottom: 3, marginTop: 6, fontFamily: Platform.OS === 'ios' ? 'Myanmar Sangam MN' : 'sans-serif' },
  input: { borderWidth: 1, borderColor: '#DDD', borderRadius: 6, paddingHorizontal: 10, paddingVertical: 6, fontSize: 12, color: '#333', backgroundColor: '#FAFAFA', fontFamily: Platform.OS === 'ios' ? 'Myanmar Sangam MN' : 'sans-serif' },
  posRow: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 4 },
  posChip: { paddingHorizontal: 9, paddingVertical: 4, borderWidth: 1, borderColor: '#DDD', borderRadius: 12, marginRight: 5, marginBottom: 5, backgroundColor: '#FFF' },
  posChipActive: { backgroundColor: '#1976D2', borderColor: '#1976D2' },
  posText: { fontSize: 10, color: '#666', fontWeight: 'bold' },
  posTextActive: { color: '#FFF' },
  levelRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  lvlBtn: { paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: '#DDD', borderRadius: 4 },
  lvlBtnActive: { backgroundColor: '#D32F2F', borderColor: '#D32F2F' },
  lvlText: { fontSize: 11, color: '#666', fontWeight: 'bold', fontFamily: Platform.OS === 'ios' ? 'Myanmar Sangam MN' : 'sans-serif' },
  lvlTextActive: { color: '#FFF' },
  modalActionRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 },
  cancelBtn: { flex: 1, paddingVertical: 8, backgroundColor: '#E0E0E0', borderRadius: 6, alignItems: 'center', marginRight: 6 },
  cancelBtnText: { color: '#333', fontWeight: 'bold', fontSize: 11, fontFamily: Platform.OS === 'ios' ? 'Myanmar Sangam MN' : 'sans-serif' },
  saveBtn: { flex: 1, paddingVertical: 8, backgroundColor: '#D32F2F', borderRadius: 6, alignItems: 'center', marginLeft: 6 },
  saveBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 11, fontFamily: Platform.OS === 'ios' ? 'Myanmar Sangam MN' : 'sans-serif' },
  scopeRow: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#DDD', borderRadius: 8, padding: 10, marginBottom: 8, backgroundColor: '#FAFAFA' },
  scopeRowActive: { borderColor: '#388E3C', backgroundColor: '#E8F5E9' },
  scopeText: { marginLeft: 8, fontSize: 12, color: '#333', fontWeight: '600' },
});

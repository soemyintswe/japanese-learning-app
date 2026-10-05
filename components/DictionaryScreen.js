import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, FlatList, TouchableOpacity, Modal, Alert, Image, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AppIcon, { iconNameToEmoji } from './AppIcon';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLanguage } from '../src/LanguageContext';
import AppHeader from './AppHeader';

const dictT = {
  my: {
    header: '📖 ဂျပန်-မြန်မာ-အင်္ဂလိပ် အဘိဓာန်', add: 'အသစ်ထည့်ရန်', search: 'စကားလုံး ရှာရန်',
    total: 'လုံး', editTitle: 'စကားလုံး ပြင်ဆင်ရန်', newTitle: 'စကားလုံးအသစ် ထည့်ရန်',
    jpLabel: 'ဂျပန်စကားလုံး (Japanese):', jpPh: 'ဥပမာ - 先生',
    myLabel: 'မြန်မာအဓိပ္ပာယ် (Myanmar):', myPh: 'ဥပမာ - ဆရာ',
    enLabel: 'အင်္ဂလိပ်အဓိပ္ပာယ် (English):', enPh: 'ဥပမာ - Teacher',
    level: 'အဆင့် (Level):', cancel: 'ပယ်ဖျက်မည်', save: 'သိမ်းဆည်းမည်',
    errFill: 'ဂျပန်စကားလုံးနှင့် မြန်မာအဓိပ္ပာယ်ကို ဖြည့်သွင်းပါ။',
    delTitle: 'သတိပေးချက်', delMsg: 'ဤစကားလုံးကို ဖျက်ရန် သေချာပါသလား?',
    no: 'မဖျက်ပါ', yes: 'ဖျက်မည်',
  },
  en: {
    header: '📖 Japanese-Myanmar-English Dictionary', add: 'Add New', search: 'Search words',
    total: 'words', editTitle: 'Edit Word', newTitle: 'Add New Word',
    jpLabel: 'Japanese:', jpPh: 'e.g. 先生',
    myLabel: 'Myanmar meaning:', myPh: 'e.g. Teacher (MM)',
    enLabel: 'English meaning:', enPh: 'e.g. Teacher',
    level: 'Level:', cancel: 'Cancel', save: 'Save',
    errFill: 'Please fill in the Japanese word and Myanmar meaning.',
    delTitle: 'Warning', delMsg: 'Are you sure to delete this word?',
    no: 'No', yes: 'Delete',
  },
  jp: {
    header: '📖 日・ミャンマー・英辞書', add: '新規追加', search: '単語を検索',
    total: '語', editTitle: '単語を編集', newTitle: '新しい単語を追加',
    jpLabel: '日本語:', jpPh: '例 - 先生',
    myLabel: 'ミャンマー語の意味:', myPh: '例 - 先生 (MM)',
    enLabel: '英語の意味:', enPh: '例 - Teacher',
    level: 'レベル:', cancel: 'キャンセル', save: '保存',
    errFill: '日本語の単語とミャンマー語の意味を入力してください。',
    delTitle: '確認', delMsg: 'この単語を削除しますか？',
    no: 'いいえ', yes: '削除',
  },
};
import { dictionaryDatabase } from './dictionaryData/fullDictionary';
import { fullDictionary as modularDictionary } from './dictionaryData/index';

const DICT_CUSTOM_KEY = '@japanese_dict_custom_v1';

// Sample ၉ လုံး + N5/N3/N2/N1 modular list ကို ပေါင်းပြီး id ထပ်နေတာ ဖယ်မယ်
const baseDictionary = (() => {
  const combined = [...(dictionaryDatabase || []), ...(modularDictionary || [])];
  const seen = new Set();
  return combined.filter((w) => {
    const key = `${w.japanese}-${w.myanmar}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
})();

export default function DictionaryScreen({ user, onLogout }) {
  const { lang } = useLanguage();
  const t = dictT[lang] || dictT.my;
  const [searchQuery, setSearchQuery] = useState('');
  const [data, setData] = useState(baseDictionary);

  // ကိုယ်တိုင်ထည့်ထားတဲ့ စကားလုံးတွေကို ဖုန်းထဲမှာ သိမ်းမယ်
  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem(DICT_CUSTOM_KEY);
        if (saved) {
          const custom = JSON.parse(saved);
          setData([...custom, ...baseDictionary]);
        }
      } catch (e) { console.log('Load dict error', e.message); }
    })();
  }, []);

  const persistCustom = (all) => {
    const custom = all.filter((w) => !baseDictionary.some((b) => b.id === w.id));
    AsyncStorage.setItem(DICT_CUSTOM_KEY, JSON.stringify(custom)).catch(() => {});
  };
  
  const [modalVisible, setModalVisible] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [jp, setJp] = useState('');
  const [my, setMy] = useState('');
  const [en, setEn] = useState('');
  const [level, setLevel] = useState('N5');

  // ပေါ့ပါးမြန်ဆန်သော Search Filtering
  const filteredData = data.filter(item => {
    const q = searchQuery.toLowerCase();
    return (
      (item.japanese && item.japanese.toLowerCase().includes(q)) ||
      (item.myanmar && item.myanmar.includes(q)) ||
      (item.english && item.english.toLowerCase().includes(q))
    );
  });

  const handleSaveWord = () => {
    if (!jp.trim() || !my.trim()) {
      Alert.alert('⚠️', t.errFill);
      return;
    }

    let next;
    if (editingId) {
      next = data.map(item => item.id === editingId ? { ...item, japanese: jp, myanmar: my, english: en, level } : item);
      setEditingId(null);
    } else {
      const newItem = {
        id: Date.now().toString(),
        japanese: jp,
        myanmar: my,
        english: en || 'N/A',
        level,
        image: 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?q=80&w=200&auto=format&fit=crop',
        icon: 'book'
      };
      next = [newItem, ...data];
    }
    setData(next);
    persistCustom(next);

    setJp(''); setMy(''); setEn('');
    setModalVisible(false);
  };

  const handleEdit = (item) => {
    setEditingId(item.id);
    setJp(item.japanese);
    setMy(item.myanmar);
    setEn(item.english);
    setLevel(item.level);
    setModalVisible(true);
  };

  const handleDelete = (id) => {
    Alert.alert(t.delTitle, t.delMsg, [
      { text: t.no, style: 'cancel' },
      { text: t.yes, style: 'destructive', onPress: () => {
        const next = data.filter(item => item.id !== id);
        setData(next);
        persistCustom(next);
      }}
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <AppHeader
        title={t.header}
        user={user}
        onLogout={onLogout}
        action={
          <TouchableOpacity style={styles.addBtn} onPress={() => { setEditingId(null); setJp(''); setMy(''); setEn(''); setModalVisible(true); }}>
            <Text style={{ fontSize: 16, color: '#FFF' }}>➕</Text>
            <Text style={styles.addBtnText}> {t.add}</Text>
          </TouchableOpacity>
        }
      />

      {/* Search Input */}
      <View style={styles.searchContainer}>
        <Text style={{ fontSize: 18, color: '#888', marginRight: 8 }}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder={`${t.search} (${data.length} ${t.total})...`}
          placeholderTextColor="#888"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Optimized FlatList */}
      <FlatList
        data={filteredData}
        keyExtractor={(item) => item.id.toString()}
        initialNumToRender={10}
        maxToRenderPerBatch={10}
        windowSize={5}
        contentContainerStyle={styles.listContainer}
        renderItem={({ item }) => (
          <View style={styles.cardItem}>
            {item.image ? (
              <Image source={{ uri: item.image }} style={styles.wordImage} />
            ) : (
              <View style={styles.iconBox}>
                <Text style={{ fontSize: 20 }}>{iconNameToEmoji(item.icon || 'book', '📚')}</Text>
              </View>
            )}

            <View style={{ flex: 1, marginLeft: 10 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={styles.japaneseText}>{item.japanese}</Text>
                <View style={styles.badge}><Text style={styles.badgeText}>{item.level}</Text></View>
              </View>
              <Text style={styles.myanmarText}>🇲🇲 {item.myanmar}</Text>
              <Text style={styles.englishText}>🇬🇧 {item.english}</Text>
            </View>

            <View style={{ flexDirection: 'row' }}>
              <TouchableOpacity onPress={() => handleEdit(item)} style={{ marginRight: 12 }}>
                <Text style={{ fontSize: 18 }}>✏️</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleDelete(item.id)}>
                <Text style={{ fontSize: 18 }}>🗑️</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />

      {/* Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{editingId ? t.editTitle : t.newTitle}</Text>

            <Text style={styles.label}>{t.jpLabel}</Text>
            <TextInput style={styles.input} value={jp} onChangeText={setJp} placeholder={t.jpPh} placeholderTextColor="#999" />

            <Text style={styles.label}>{t.myLabel}</Text>
            <TextInput style={styles.input} value={my} onChangeText={setMy} placeholder={t.myPh} placeholderTextColor="#999" />

            <Text style={styles.label}>{t.enLabel}</Text>
            <TextInput style={styles.input} value={en} onChangeText={setEn} placeholder={t.enPh} placeholderTextColor="#999" />

            <Text style={styles.label}>{t.level}</Text>
            <View style={styles.levelRow}>
              {['N5', 'N4', 'N3', 'N2', 'N1'].map(lvl => (
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  header: { paddingHorizontal: 15, paddingVertical: 12, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#EFEFEF', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerTitleText: { fontSize: 13, fontWeight: 'bold', color: '#333', fontFamily: Platform.OS === 'ios' ? 'Myanmar Sangam MN' : 'sans-serif' },
  addBtn: { backgroundColor: '#D32F2F', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6 },
  addBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 11, fontFamily: Platform.OS === 'ios' ? 'Myanmar Sangam MN' : 'sans-serif' },
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', margin: 12, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: '#DDD' },
  searchInput: { flex: 1, fontSize: 13, color: '#333', fontFamily: Platform.OS === 'ios' ? 'Myanmar Sangam MN' : 'sans-serif' },
  listContainer: { paddingHorizontal: 12, paddingBottom: 20 },
  cardItem: { backgroundColor: '#FFFFFF', borderRadius: 10, padding: 12, marginBottom: 8, flexDirection: 'row', alignItems: 'center', elevation: 2 },
  wordImage: { width: 45, height: 45, borderRadius: 8, backgroundColor: '#EEE' },
  iconBox: { width: 45, height: 45, backgroundColor: '#FFEBEE', borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  japaneseText: { fontSize: 14, fontWeight: 'bold', color: '#D32F2F', marginRight: 8, fontFamily: Platform.OS === 'ios' ? 'Myanmar Sangam MN' : 'sans-serif' },
  myanmarText: { fontSize: 12, color: '#333', marginTop: 2, fontFamily: Platform.OS === 'ios' ? 'Myanmar Sangam MN' : 'sans-serif' },
  englishText: { fontSize: 11, color: '#666', fontStyle: 'italic', fontFamily: Platform.OS === 'ios' ? 'Myanmar Sangam MN' : 'sans-serif' },
  badge: { backgroundColor: '#FFEBEE', paddingHorizontal: 5, paddingVertical: 1, borderRadius: 4 },
  badgeText: { color: '#D32F2F', fontSize: 9, fontWeight: 'bold', fontFamily: Platform.OS === 'ios' ? 'Myanmar Sangam MN' : 'sans-serif' },
  modalOverlay: { flex: 1, justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.6)', padding: 15 },
  modalContent: { backgroundColor: '#FFF', borderRadius: 12, padding: 18, elevation: 5 },
  modalTitle: { fontSize: 14, fontWeight: 'bold', color: '#333', marginBottom: 12, textAlign: 'center', fontFamily: Platform.OS === 'ios' ? 'Myanmar Sangam MN' : 'sans-serif' },
  label: { fontSize: 11, fontWeight: '600', color: '#555', marginBottom: 3, marginTop: 6, fontFamily: Platform.OS === 'ios' ? 'Myanmar Sangam MN' : 'sans-serif' },
  input: { borderWidth: 1, borderColor: '#DDD', borderRadius: 6, paddingHorizontal: 10, paddingVertical: 6, fontSize: 12, color: '#333', backgroundColor: '#FAFAFA', fontFamily: Platform.OS === 'ios' ? 'Myanmar Sangam MN' : 'sans-serif' },
  levelRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  lvlBtn: { paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: '#DDD', borderRadius: 4 },
  lvlBtnActive: { backgroundColor: '#D32F2F', borderColor: '#D32F2F' },
  lvlText: { fontSize: 11, color: '#666', fontWeight: 'bold', fontFamily: Platform.OS === 'ios' ? 'Myanmar Sangam MN' : 'sans-serif' },
  lvlTextActive: { color: '#FFF' },
  modalActionRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 },
  cancelBtn: { flex: 1, paddingVertical: 8, backgroundColor: '#E0E0E0', borderRadius: 6, alignItems: 'center', marginRight: 6 },
  cancelBtnText: { color: '#333', fontWeight: 'bold', fontSize: 11, fontFamily: Platform.OS === 'ios' ? 'Myanmar Sangam MN' : 'sans-serif' },
  saveBtn: { flex: 1, paddingVertical: 8, backgroundColor: '#D32F2F', borderRadius: 6, alignItems: 'center', marginLeft: 6 },
  saveBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 11, fontFamily: Platform.OS === 'ios' ? 'Myanmar Sangam MN' : 'sans-serif' }
});
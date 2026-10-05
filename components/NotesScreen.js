import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, FlatList, TouchableOpacity, Modal, Alert, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLanguage } from '../src/LanguageContext';
import AppHeader from './AppHeader';

const notesT = {
  my: {
    header: '🌸 Study Notes & Memos', add: 'မှတ်စုအသစ်',
    editTitle: 'မှတ်စု ပြင်ဆင်ရန်', newTitle: 'မှတ်စုအသစ် ရေးရန်',
    titleLabel: 'မှတ်စုခေါင်းစဉ် (Title):', titlePh: 'ဥပမာ - N3 Grammar Notes',
    contentLabel: 'အကြောင်းအရာ (Content):', contentPh: 'မှတ်စု အသေးစိတ် ရေးရန်...',
    cancel: 'ပယ်ဖျက်မည်', save: 'သိမ်းဆည်းမည်', update: 'ပြင်ဆင်မည်',
    errFill: 'ကျေးဇူးပြု၍ မှတ်စုခေါင်းစဉ်နှင့် အကြောင်းအရာကို ဖြည့်သွင်းပါ။',
    delTitle: 'သတိပေးချက်', delMsg: 'ဤမှတ်စုကို ဖျက်ရန် သေချာပါသလား?',
    no: 'မဖျက်ပါ', yes: 'ဖျက်မည်',
  },
  en: {
    header: '🌸 Study Notes & Memos', add: 'New Note',
    editTitle: 'Edit Note', newTitle: 'Write New Note',
    titleLabel: 'Title:', titlePh: 'e.g. N3 Grammar Notes',
    contentLabel: 'Content:', contentPh: 'Write note details...',
    cancel: 'Cancel', save: 'Save', update: 'Update',
    errFill: 'Please fill in the title and content.',
    delTitle: 'Warning', delMsg: 'Are you sure to delete this note?',
    no: 'No', yes: 'Delete',
  },
  jp: {
    header: '🌸 学習ノート・メモ', add: '新規メモ',
    editTitle: 'メモを編集', newTitle: '新しいメモを書く',
    titleLabel: 'タイトル:', titlePh: '例 - N3文法ノート',
    contentLabel: '内容:', contentPh: 'メモの詳細を書く...',
    cancel: 'キャンセル', save: '保存', update: '更新',
    errFill: 'タイトルと内容を入力してください。',
    delTitle: '確認', delMsg: 'このメモを削除しますか？',
    no: 'いいえ', yes: '削除',
  },
};

const NOTES_KEY = '@japanese_notes_v1';
const DEFAULT_NOTES = [
  { id: '1', title: 'JLPT N3 Grammar', content: '- ~te iru (လုပ်လက်စ အခြေအနေ)\n- ~te aru (ပြုလုပ်ပြီးစီးထားသော အခြေအနေ)' },
  { id: '2', title: 'Kanji Daily List', content: '1. 勉強 (Benkyou) - လေ့လာသည်\n2. 先生 (Sensei) - ဆရာ' },
];

export default function NotesScreen({ user, onLogout, navigation }) {
  const goProfile = () => { try { navigation.navigate('Community', { seg: 'profile' }); } catch (e) {} };
  const { lang } = useLanguage();
  const t = notesT[lang] || notesT.my;
  const [notes, setNotes] = useState(DEFAULT_NOTES);

  // App ပိတ်ပြီး ပြန်ဖွင့်လည်း မပျောက်အောင် ဖုန်းထဲမှာ သိမ်းမယ်
  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem(NOTES_KEY);
        if (saved) setNotes(JSON.parse(saved));
      } catch (e) { console.log('Load notes error', e.message); }
    })();
  }, []);

  useEffect(() => {
    AsyncStorage.setItem(NOTES_KEY, JSON.stringify(notes)).catch(() => {});
  }, [notes]);

  const [modalVisible, setModalVisible] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');

  const handleSaveNote = () => {
    if (!noteTitle.trim() || !noteContent.trim()) {
      Alert.alert('⚠️', t.errFill);
      return;
    }

    if (editingId) {
      setNotes(notes.map(item => item.id === editingId ? { ...item, title: noteTitle, content: noteContent } : item));
      setEditingId(null);
    } else {
      const newNote = {
        id: Date.now().toString(),
        title: noteTitle,
        content: noteContent,
      };
      setNotes([newNote, ...notes]);
    }

    setNoteTitle('');
    setNoteContent('');
    setModalVisible(false);
  };

  const handleEditNote = (item) => {
    setEditingId(item.id);
    setNoteTitle(item.title);
    setNoteContent(item.content);
    setModalVisible(true);
  };

  const handleDeleteNote = (id) => {
    Alert.alert(t.delTitle, t.delMsg, [
      { text: t.no, style: 'cancel' },
      { text: t.yes, style: 'destructive', onPress: () => setNotes(notes.filter(item => item.id !== id)) }
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <AppHeader
        title={t.header}
        user={user}
        onLogout={onLogout}
        onProfilePress={goProfile}
        action={
          <TouchableOpacity style={styles.addButton} onPress={() => { setEditingId(null); setNoteTitle(''); setNoteContent(''); setModalVisible(true); }}>
            <Text style={{ fontSize: 20, color: '#FFF' }}>➕</Text>
            <Text style={styles.addButtonText}> {t.add}</Text>
          </TouchableOpacity>
        }
      />

      <FlatList
        data={notes}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        renderItem={({ item }) => (
          <View style={styles.noteCard}>
            <View style={styles.noteHeaderRow}>
              <Text style={styles.noteCardTitle}>{item.title}</Text>
              <View style={styles.actionIconsRow}>
                <TouchableOpacity onPress={() => handleEditNote(item)} style={{ marginRight: 12 }}>
                  <Text style={{ fontSize: 20 }}>✏️</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleDeleteNote(item.id)}>
                  <Text style={{ fontSize: 20 }}>🗑️</Text>
                </TouchableOpacity>
              </View>
            </View>
            <Text style={styles.noteCardContent} numberOfLines={3}>{item.content}</Text>
          </View>
        )}
      />

      {/* မှတ်စုထည့်ရန်/ပြင်ရန် Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{editingId ? t.editTitle : t.newTitle}</Text>

            <Text style={styles.label}>{t.titleLabel}</Text>
            <TextInput style={styles.input} value={noteTitle} onChangeText={setNoteTitle} placeholder={t.titlePh} placeholderTextColor="#999" />

            <Text style={styles.label}>{t.contentLabel}</Text>
            <TextInput
              style={[styles.input, { height: 120, textAlignVertical: 'top' }]}
              value={noteContent}
              onChangeText={setNoteContent}
              placeholder={t.contentPh}
              placeholderTextColor="#999"
              multiline={true}
            />

            <View style={styles.modalActionRow}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalVisible(false)}>
                <Text style={styles.cancelBtnText}>{t.cancel}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleSaveNote}>
                <Text style={styles.saveBtnText}>{editingId ? t.update : t.save}</Text>
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
  headerPlanner: { paddingHorizontal: 20, paddingVertical: 12, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#EFEFEF', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerTitleText: { fontSize: 17, fontWeight: 'bold', color: '#333', fontFamily: Platform.OS === 'ios' ? 'Myanmar Sangam MN' : 'sans-serif' },
  addButton: { backgroundColor: '#388E3C', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  addButtonText: { color: '#FFF', fontWeight: 'bold', fontSize: 13, fontFamily: Platform.OS === 'ios' ? 'Myanmar Sangam MN' : 'sans-serif' },
  listContainer: { padding: 15 },
  noteCard: { backgroundColor: '#FFFFFF', borderRadius: 10, padding: 15, marginBottom: 12, borderLeftWidth: 4, borderLeftColor: '#388E3C', elevation: 2 },
  noteHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  noteCardTitle: { fontSize: 16, fontWeight: 'bold', color: '#333', fontFamily: Platform.OS === 'ios' ? 'Myanmar Sangam MN' : 'sans-serif' },
  actionIconsRow: { flexDirection: 'row' },
  noteCardContent: { fontSize: 14, color: '#555', lineHeight: 20, fontFamily: Platform.OS === 'ios' ? 'Myanmar Sangam MN' : 'sans-serif' },
  modalOverlay: { flex: 1, justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.6)', padding: 20 },
  modalContent: { backgroundColor: '#FFF', borderRadius: 15, padding: 20, elevation: 5 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 15, textAlign: 'center', fontFamily: Platform.OS === 'ios' ? 'Myanmar Sangam MN' : 'sans-serif' },
  label: { fontSize: 13, fontWeight: '600', color: '#555', marginBottom: 5, marginTop: 10, fontFamily: Platform.OS === 'ios' ? 'Myanmar Sangam MN' : 'sans-serif' },
  input: { borderWidth: 1, borderColor: '#DDD', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, fontSize: 14, color: '#333', backgroundColor: '#FAFAFA', fontFamily: Platform.OS === 'ios' ? 'Myanmar Sangam MN' : 'sans-serif' },
  modalActionRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 20 },
  cancelBtn: { flex: 1, paddingVertical: 10, backgroundColor: '#E0E0E0', borderRadius: 8, alignItems: 'center', marginRight: 8 },
  cancelBtnText: { color: '#333', fontWeight: 'bold', fontSize: 14, fontFamily: Platform.OS === 'ios' ? 'Myanmar Sangam MN' : 'sans-serif' },
  saveBtn: { flex: 1, paddingVertical: 10, backgroundColor: '#388E3C', borderRadius: 8, alignItems: 'center', marginLeft: 8 },
  saveBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 14, fontFamily: Platform.OS === 'ios' ? 'Myanmar Sangam MN' : 'sans-serif' }
});
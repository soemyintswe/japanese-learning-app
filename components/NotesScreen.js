import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, FlatList, TouchableOpacity, Modal, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

export default function NotesScreen() {
  const [notes, setNotes] = useState([
    { id: '1', title: 'JLPT N3 Grammar', content: '- ~te iru (လုပ်လက်စ အခြေအနေ)\n- ~te aru (ပြုလုပ်ပြီးစီးထားသော အခြေအနေ)' },
    { id: '2', title: 'Kanji Daily List', content: '1. 勉強 (Benkyou) - လေ့လာသည်\n2. 先生 (Sensei) - ဆရာ' },
  ]);

  const [modalVisible, setModalVisible] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');

  const handleSaveNote = () => {
    if (!noteTitle.trim() || !noteContent.trim()) {
      Alert.alert('အမှား', 'ကျေးဇူးပြု၍ မှတ်စုခေါင်းစဉ်နှင့် အကြောင်းအရာကို ဖြည့်သွင်းပါ။');
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
    Alert.alert('သတိပေးချက်', 'ဤမှတ်စုကို ဖျက်ရန် သေချာပါသလား?', [
      { text: 'မဖျက်ပါ', style: 'cancel' },
      { text: 'ဖျက်မည်', style: 'destructive', onPress: () => setNotes(notes.filter(item => item.id !== id)) }
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerPlanner}>
        <Text style={styles.headerTitleText}>🌸 Study Notes & Memos</Text>
        <TouchableOpacity style={styles.addButton} onPress={() => { setEditingId(null); setNoteTitle(''); setNoteContent(''); setModalVisible(true); }}>
          <Ionicons name="add" size={22} color="#FFF" />
          <Text style={styles.addButtonText}> မှတ်စုအသစ်</Text>
        </TouchableOpacity>
      </View>

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
                  <Ionicons name="create-outline" size={20} color="#1976D2" />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleDeleteNote(item.id)}>
                  <Ionicons name="trash-outline" size={20} color="#D32F2F" />
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
            <Text style={styles.modalTitle}>{editingId ? 'မှတ်စု ပြင်ဆင်ရန်' : 'မှတ်စုအသစ် ရေးရန်'}</Text>
            
            <Text style={styles.label}>မှတ်စုခေါင်းစဉ် (Title):</Text>
            <TextInput style={styles.input} value={noteTitle} onChangeText={setNoteTitle} placeholder="ဥပမာ - N3 Grammar Notes" />

            <Text style={styles.label}>အကြောင်းအရာ (Content):</Text>
            <TextInput 
              style={[styles.input, { height: 120, textAlignVertical: 'top' }]} 
              value={noteContent} 
              onChangeText={setNoteContent} 
              placeholder="မှတ်စု အသေးစိတ် ရေးရန်..." 
              multiline={true} 
            />

            <View style={styles.modalActionRow}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalVisible(false)}>
                <Text style={styles.cancelBtnText}>ပယ်ဖျက်မည်</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleSaveNote}>
                <Text style={styles.saveBtnText}>{editingId ? 'ပြင်ဆင်မည်' : 'သိမ်းဆည်းမည်'}</Text>
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
  headerTitleText: { fontSize: 17, fontWeight: 'bold', color: '#333' },
  addButton: { backgroundColor: '#388E3C', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  addButtonText: { color: '#FFF', fontWeight: 'bold', fontSize: 13 },
  listContainer: { padding: 15 },
  noteCard: { backgroundColor: '#FFFFFF', borderRadius: 10, padding: 15, marginBottom: 12, borderLeftWidth: 4, borderLeftColor: '#388E3C', elevation: 2 },
  noteHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  noteCardTitle: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  actionIconsRow: { flexDirection: 'row' },
  noteCardContent: { fontSize: 14, color: '#555', lineHeight: 20 },
  modalOverlay: { flex: 1, justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.6)', padding: 20 },
  modalContent: { backgroundColor: '#FFF', borderRadius: 15, padding: 20, elevation: 5 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 15, textAlign: 'center' },
  label: { fontSize: 13, fontWeight: '600', color: '#555', marginBottom: 5, marginTop: 10 },
  input: { borderWidth: 1, borderColor: '#DDD', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, fontSize: 14, color: '#333', backgroundColor: '#FAFAFA' },
  modalActionRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 20 },
  cancelBtn: { flex: 1, paddingVertical: 10, backgroundColor: '#E0E0E0', borderRadius: 8, alignItems: 'center', marginRight: 8 },
  cancelBtnText: { color: '#333', fontWeight: 'bold', fontSize: 14 },
  saveBtn: { flex: 1, paddingVertical: 10, backgroundColor: '#388E3C', borderRadius: 8, alignItems: 'center', marginLeft: 8 },
  saveBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 14 }
});
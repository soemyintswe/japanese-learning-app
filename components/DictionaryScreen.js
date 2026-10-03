import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, FlatList, TouchableOpacity, Modal, Alert, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { dictionaryDatabase } from './dictionaryData/fullDictionary';

export default function DictionaryScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [data, setData] = useState(dictionaryDatabase || []);
  
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
      Alert.alert('အမှား', 'ဂျပန်စကားလုံးနှင့် မြန်မာအဓိပ္ပာယ်ကို ဖြည့်သွင်းပါ။');
      return;
    }

    if (editingId) {
      setData(data.map(item => item.id === editingId ? { ...item, japanese: jp, myanmar: my, english: en, level } : item));
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
      setData([newItem, ...data]);
    }

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
    Alert.alert('သတိပေးချက်', 'ဤစကားလုံးကို ဖျက်ရန် သေချာပါသလား?', [
      { text: 'မဖျက်ပါ', style: 'cancel' },
      { text: 'ဖျက်မည်', style: 'destructive', onPress: () => setData(data.filter(item => item.id !== id)) }
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitleText}>📖 ဂျပန်-မြန်မာ-အင်္ဂလိပ် အဘိဓာန်</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => { setEditingId(null); setJp(''); setMy(''); setEn(''); setModalVisible(true); }}>
          <Ionicons name="add" size={18} color="#FFF" />
          <Text style={styles.addBtnText}> အသစ်ထည့်ရန်</Text>
        </TouchableOpacity>
      </View>

      {/* Search Input */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={18} color="#888" style={{ marginRight: 8 }} />
        <TextInput
          style={styles.searchInput}
          placeholder={`စကားလုံး ရှာရန် (စုစုပေါင်း ${data.length} လုံး)...`}
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
                <Ionicons name={item.icon || 'book'} size={20} color="#D32F2F" />
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
                <Ionicons name="create-outline" size={18} color="#1976D2" />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleDelete(item.id)}>
                <Ionicons name="trash-outline" size={18} color="#D32F2F" />
              </TouchableOpacity>
            </View>
          </View>
        )}
      />

      {/* Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{editingId ? 'စကားလုံး ပြင်ဆင်ရန်' : 'စကားလုံးအသစ် ထည့်ရန်'}</Text>
            
            <Text style={styles.label}>ဂျပန်စကားလုံး (Japanese):</Text>
            <TextInput style={styles.input} value={jp} onChangeText={setJp} placeholder="ဥပမာ - 先生" />

            <Text style={styles.label}>မြန်မာအဓိပ္ပာယ် (Myanmar):</Text>
            <TextInput style={styles.input} value={my} onChangeText={setMy} placeholder="ဥပမာ - ဆရာ" />

            <Text style={styles.label}>အင်္ဂလိပ်အဓိပ္ပာယ် (English):</Text>
            <TextInput style={styles.input} value={en} onChangeText={setEn} placeholder="ဥပမာ - Teacher" />

            <Text style={styles.label}>အဆင့် (Level):</Text>
            <View style={styles.levelRow}>
              {['N5', 'N4', 'N3', 'N2', 'N1'].map(lvl => (
                <TouchableOpacity key={lvl} style={[styles.lvlBtn, level === lvl && styles.lvlBtnActive]} onPress={() => setLevel(lvl)}>
                  <Text style={[styles.lvlText, level === lvl && styles.lvlTextActive]}>{lvl}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.modalActionRow}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalVisible(false)}><Text style={styles.cancelBtnText}>ပယ်ဖျက်မည်</Text></TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleSaveWord}><Text style={styles.saveBtnText}>သိမ်းဆည်းမည်</Text></TouchableOpacity>
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
  headerTitleText: { fontSize: 13, fontWeight: 'bold', color: '#333' },
  addBtn: { backgroundColor: '#D32F2F', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6 },
  addBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 11 },
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', margin: 12, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: '#DDD' },
  searchInput: { flex: 1, fontSize: 13, color: '#333' },
  listContainer: { paddingHorizontal: 12, paddingBottom: 20 },
  cardItem: { backgroundColor: '#FFFFFF', borderRadius: 10, padding: 12, marginBottom: 8, flexDirection: 'row', alignItems: 'center', elevation: 2 },
  wordImage: { width: 45, height: 45, borderRadius: 8, backgroundColor: '#EEE' },
  iconBox: { width: 45, height: 45, backgroundColor: '#FFEBEE', borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  japaneseText: { fontSize: 14, fontWeight: 'bold', color: '#D32F2F', marginRight: 8 },
  myanmarText: { fontSize: 12, color: '#333', marginTop: 2 },
  englishText: { fontSize: 11, color: '#666', fontStyle: 'italic' },
  badge: { backgroundColor: '#FFEBEE', paddingHorizontal: 5, paddingVertical: 1, borderRadius: 4 },
  badgeText: { color: '#D32F2F', fontSize: 9, fontWeight: 'bold' },
  modalOverlay: { flex: 1, justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.6)', padding: 15 },
  modalContent: { backgroundColor: '#FFF', borderRadius: 12, padding: 18, elevation: 5 },
  modalTitle: { fontSize: 14, fontWeight: 'bold', color: '#333', marginBottom: 12, textAlign: 'center' },
  label: { fontSize: 11, fontWeight: '600', color: '#555', marginBottom: 3, marginTop: 6 },
  input: { borderWidth: 1, borderColor: '#DDD', borderRadius: 6, paddingHorizontal: 10, paddingVertical: 6, fontSize: 12, color: '#333', backgroundColor: '#FAFAFA' },
  levelRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  lvlBtn: { paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: '#DDD', borderRadius: 4 },
  lvlBtnActive: { backgroundColor: '#D32F2F', borderColor: '#D32F2F' },
  lvlText: { fontSize: 11, color: '#666', fontWeight: 'bold' },
  lvlTextActive: { color: '#FFF' },
  modalActionRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 },
  cancelBtn: { flex: 1, paddingVertical: 8, backgroundColor: '#E0E0E0', borderRadius: 6, alignItems: 'center', marginRight: 6 },
  cancelBtnText: { color: '#333', fontWeight: 'bold', fontSize: 11 },
  saveBtn: { flex: 1, paddingVertical: 8, backgroundColor: '#D32F2F', borderRadius: 6, alignItems: 'center', marginLeft: 6 },
  saveBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 11 }
});
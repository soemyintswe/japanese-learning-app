// components/NotificationPanel.js — 🔔 panel: unread chats + pending approvals (one-tap)
import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Modal, ScrollView, ActivityIndicator, Platform } from 'react-native';
import { useLanguage } from '../src/LanguageContext';
import { useNotifications } from '../src/notifications';

const nT = {
  my: {
    title: '🔔 Notifications', chats: '💬 စာအသစ်များ', pending: '👤 Approve စောင့်နေသူများ',
    emptyAll: 'အသစ်ဘာမှမရှိပါ ✅', emptyChats: '—', view: 'ကြည့်မည် →',
    approve: '✅ Approve', disable: '🚫 Disable', done: 'ပြီးပါပြီ ✅', fail: 'မအောင်မြင်ပါ',
    close: 'ပိတ်မည်',
  },
  en: {
    title: '🔔 Notifications', chats: '💬 New messages', pending: '👤 Pending approvals',
    emptyAll: 'All caught up ✅', emptyChats: '—', view: 'Open →',
    approve: '✅ Approve', disable: '🚫 Disable', done: 'Done ✅', fail: 'Failed',
    close: 'Close',
  },
  jp: {
    title: '🔔 通知', chats: '💬 新着', pending: '👤 承認待ち',
    emptyAll: 'なし ✅', emptyChats: '—', view: '開く →',
    approve: '✅ 承認', disable: '🚫 無効', done: '完了 ✅', fail: '失敗',
    close: '閉じる',
  },
};

export default function NotificationPanel() {
  const { lang } = useLanguage();
  const t = nT[lang] || nT.my;
  const notif = useNotifications();
  const [busyId, setBusyId] = useState(null);
  const [doneId, setDoneId] = useState(null);

  if (!notif) return null;
  const { unread, pending, isAdmin, panelOpen, setPanelOpen, openChat, approveUser, disableUser } = notif;

  const act = async (uid, fn) => {
    setBusyId(uid);
    setDoneId(null);
    const ok = await fn(uid);
    setBusyId(null);
    if (ok) setDoneId(uid + ':ok');
    else setDoneId(uid + ':fail');
  };

  return (
    <Modal visible={!!panelOpen} animationType="slide" transparent={true}>
      <View style={styles.overlay}>
        <View style={styles.box}>
          <View style={styles.headRow}>
            <Text style={styles.title}>{t.title}</Text>
            <TouchableOpacity onPress={() => setPanelOpen(false)} style={styles.closeBtn}>
              <Text style={{ fontSize: 16 }}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={{ maxHeight: 420 }}>
            <Text style={styles.secTitle}>{t.chats} ({unread.length})</Text>
            {unread.length === 0 && <Text style={styles.empty}>{t.emptyChats}</Text>}
            {unread.map((c) => (
              <TouchableOpacity key={c.id} style={styles.row} onPress={() => openChat(c.id)}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.rowTitle} numberOfLines={1}>💬 {c.title}</Text>
                  <Text style={styles.rowSub} numberOfLines={2}>{c.preview}</Text>
                </View>
                <Text style={styles.viewText}>{t.view}</Text>
              </TouchableOpacity>
            ))}

            {isAdmin && (
              <>
                <Text style={[styles.secTitle, { marginTop: 12 }]}>{t.pending} ({pending.length})</Text>
                {pending.length === 0 && <Text style={styles.empty}>{t.emptyChats}</Text>}
                {pending.map((u) => (
                  <View key={u.id} style={styles.row}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.rowTitle} numberOfLines={1}>
                        {u.name || 'No Name'} <Text style={styles.rowSub}>({u.email || ''})</Text>
                      </Text>
                      <Text style={styles.rowSub}>{(u.role || 'student').toUpperCase()} • PENDING</Text>
                      {doneId === u.id + ':ok' && <Text style={styles.doneText}>{t.done}</Text>}
                      {doneId === u.id + ':fail' && <Text style={styles.failText}>{t.fail}</Text>}
                    </View>
                    <View style={{ flexDirection: 'row', marginLeft: 6 }}>
                      <TouchableOpacity
                        style={[styles.actBtn, { backgroundColor: '#2E7D32' }]}
                        disabled={busyId === u.id}
                        onPress={() => act(u.id, approveUser)}
                      >
                        {busyId === u.id ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.actText}>{t.approve}</Text>}
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.actBtn, { backgroundColor: '#E53935', marginLeft: 6 }]}
                        disabled={busyId === u.id}
                        onPress={() => act(u.id, disableUser)}
                      >
                        <Text style={styles.actText}>{t.disable}</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </>
            )}

            {!isAdmin && unread.length === 0 && (
              <Text style={[styles.empty, { marginTop: 12 }]}>{t.emptyAll}</Text>
            )}
            {isAdmin && unread.length === 0 && pending.length === 0 && (
              <Text style={[styles.empty, { marginTop: 12 }]}>{t.emptyAll}</Text>
            )}
          </ScrollView>

          <TouchableOpacity style={styles.closeBar} onPress={() => setPanelOpen(false)}>
            <Text style={styles.closeBarText}>{t.close}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-start', backgroundColor: 'rgba(0,0,0,0.5)', padding: 16, paddingTop: 70 },
  box: { backgroundColor: '#FFF', borderRadius: 14, padding: 14, maxHeight: '80%', elevation: 5 },
  headRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  title: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  closeBtn: { padding: 6, backgroundColor: '#F0F0F0', borderRadius: 16 },
  secTitle: { fontSize: 13, fontWeight: 'bold', color: '#D32F2F', marginBottom: 6 },
  empty: { fontSize: 12, color: '#999' },
  row: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FAFAFA', borderRadius: 8, padding: 10, marginBottom: 6, borderWidth: 1, borderColor: '#EEE' },
  rowTitle: { fontSize: 13, fontWeight: 'bold', color: '#333' },
  rowSub: { fontSize: 11, color: '#666', marginTop: 2 },
  viewText: { fontSize: 12, color: '#1976D2', fontWeight: 'bold', marginLeft: 8 },
  actBtn: { paddingHorizontal: 10, paddingVertical: 7, borderRadius: 7, justifyContent: 'center' },
  actText: { color: '#FFF', fontWeight: 'bold', fontSize: 11 },
  doneText: { color: '#2E7D32', fontSize: 11, fontWeight: 'bold', marginTop: 2 },
  failText: { color: '#C62828', fontSize: 11, fontWeight: 'bold', marginTop: 2 },
  closeBar: { backgroundColor: '#EEE', borderRadius: 8, paddingVertical: 9, alignItems: 'center', marginTop: 10 },
  closeBarText: { color: '#333', fontWeight: 'bold', fontSize: 13 },
});

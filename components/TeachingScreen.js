// TeachingScreen — သင်ကြားရေး module (MVP)
// Staff (teacher/admin): lessons + assignments ရေး/ပြင်/ဖျက်, submissions အမှတ်ပေး
// Student: lessons ဖတ်, assignments ကြည့် + အဖြေတင် (တစ်ယောက် တစ်ပုဒ် — resubmit = update)
// Collections: lessons{title,body,level,mediaUrl,by,byName,at} /
//   assignments{title,desc,level,due,by,byName,at} /
//   submissions{assignmentId,uid,name,text,link,grade,feedback,at,gradedBy,gradedAt}
// Rules: lessons/assignments read-all/write-staff; submissions own-or-staff (see firestore.rules).
// Queries use SINGLE-field filters only (no composite index needed).
import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, TextInput, TouchableOpacity, ActivityIndicator, RefreshControl, Linking, Alert, Modal, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { collection, getDocs, doc, setDoc, deleteDoc, query, orderBy, where } from 'firebase/firestore';
import { db } from '../src/firebase';
import { logActivity } from '../src/activity';
import { useLanguage } from '../src/LanguageContext';
import AppHeader from './AppHeader';

const teachT = {
  my: {
    title: '📖 သင်ခန်းစာများ', segLessons: 'သင်ခန်းစာ', segAssign: 'Assignment',
    empty: 'မရှိသေးပါ။', by: 'သူ', at: '', level: 'Level', media: '🎬 ဗီဒီယို/လင့်ခ်ဖွင့်',
    add: '➕ အသစ်ထည့်မည်', edit: 'ပြင်မည်', del: 'ဖျက်မည်', save: 'သိမ်းမည်', cancel: 'မလုပ်တော့',
    fTitle: 'ခေါင်းစဉ်:', fBody: 'စာသား:', fLevel: 'Level (N5~N1 / All):', fMedia: 'Media link (YouTube/Drive, optional):',
    fDesc: 'ရှင်းလင်းချက်:', fDue: 'နောက်ဆုံးရက် (ဥပမာ 2026-10-20):',
    submit: 'အဖြေတင်မည်', fAnswer: 'အဖြေ:', fLink: 'Link (optional):', submitted: 'တင်ပြီးပါပြီ ✅',
    grade: 'အမှတ်:', feedback: 'မှတ်ချက်:', gradeSave: 'အမှတ်ပေးမည်',
    noGrade: 'အမှတ်မပေးရသေး', subs: 'တင်ထားသူများ', delQ: 'ဖျက်မှာလား?', yesDel: 'ဖျက်မည်', noDel: 'မလုပ်တော့',
    errFill: 'ခေါင်းစဉ်ဖြည့်ပါ။', back: '◀ ပြန်သွားမည်',
  },
  en: {
    title: '📖 Lessons & Class', segLessons: 'Lessons', segAssign: 'Assignments',
    empty: 'Nothing yet.', by: 'By', at: '', level: 'Level', media: '🎬 Open video/link',
    add: '➕ Add new', edit: 'Edit', del: 'Delete', save: 'Save', cancel: 'Cancel',
    fTitle: 'Title:', fBody: 'Body:', fLevel: 'Level (N5~N1 / All):', fMedia: 'Media link (YouTube/Drive, optional):',
    fDesc: 'Description:', fDue: 'Due date (e.g. 2026-10-20):',
    submit: 'Submit answer', fAnswer: 'Answer:', fLink: 'Link (optional):', submitted: 'Submitted ✅',
    grade: 'Grade:', feedback: 'Feedback:', gradeSave: 'Grade it',
    noGrade: 'Not graded yet', subs: 'Submissions', delQ: 'Delete?', yesDel: 'Delete', noDel: 'Cancel',
    errFill: 'Title is required.', back: '◀ Back',
  },
  jp: {
    title: '📖 授業', segLessons: 'レッスン', segAssign: '課題',
    empty: 'まだありません。', by: '', at: '', level: 'レベル', media: '🎬 動画/リンクを開く',
    add: '➕ 新規', edit: '編集', del: '削除', save: '保存', cancel: 'キャンセル',
    fTitle: 'タイトル:', fBody: '本文:', fLevel: 'レベル (N5~N1 / All):', fMedia: 'メディアリンク (任意):',
    fDesc: '説明:', fDue: '締切 (例 2026-10-20):',
    submit: '提出する', fAnswer: '回答:', fLink: 'リンク (任意):', submitted: '提出済み ✅',
    grade: '評価:', feedback: 'コメント:', gradeSave: '採点する',
    noGrade: '未採点', subs: '提出一覧', delQ: '削除しますか?', yesDel: '削除', noDel: 'キャンセル',
    errFill: 'タイトルを入力してください。', back: '◀ 戻る',
  },
};

const LEVELS = ['All', 'N5', 'N4', 'N3', 'N2', 'N1'];

export default function TeachingScreen({ user, onLogout, navigation }) {
  const { lang } = useLanguage();
  const t = teachT[lang] || teachT.my;
  const isStaff = user?.role === 'teacher' || user?.role === 'admin';
  const goProfile = () => { try { navigation.navigate('Community', { seg: 'profile' }); } catch (e) {} };

  const [seg, setSeg] = useState('lessons');
  const [lessons, setLessons] = useState([]);
  const [assigns, setAssigns] = useState([]);
  const [subs, setSubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [openId, setOpenId] = useState(null); // opened lesson/assignment id
  // editor modal (lesson or assignment)
  const [modal, setModal] = useState(null); // {kind:'lesson'|'assign', id?, title, body/desc, level, media/due}
  const [busy, setBusy] = useState(false);
  // student submit form
  const [answer, setAnswer] = useState('');
  const [answerLink, setAnswerLink] = useState('');
  // grading form per submission
  const [gradeMap, setGradeMap] = useState({}); // {subId: {grade, feedback}}

  const fetchAll = async (silent) => {
    if (!silent) setLoading(true);
    try {
      const lq = await getDocs(query(collection(db, 'lessons'), orderBy('at', 'desc')));
      const la = [];
      lq.forEach((d) => la.push({ id: d.id, ...d.data() }));
      setLessons(la);
      const aq = await getDocs(query(collection(db, 'assignments'), orderBy('at', 'desc')));
      const aa = [];
      aq.forEach((d) => aa.push({ id: d.id, ...d.data() }));
      setAssigns(aq);
      if (user?.uid) {
        // single-field queries only (no composite index):
        // staff → all subs of open assignment; student → own subs only
        let sq;
        if (isStaff && openId) {
          sq = await getDocs(query(collection(db, 'submissions'), where('assignmentId', '==', openId)));
        } else {
          sq = await getDocs(query(collection(db, 'submissions'), where('uid', '==', user.uid)));
        }
        const sa = [];
        sq.forEach((d) => sa.push({ id: d.id, ...d.data() }));
        if (!isStaff) {
          const filtered = openId ? sa.filter((s) => s.assignmentId === openId) : sa;
          setSubs(filtered);
        } else {
          setSubs(sa);
        }
      }
    } catch (e) {
      console.log('Teaching fetch:', e?.code || e?.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchAll(false); }, []);
  // staff opens an assignment → reload its submissions
  useEffect(() => { if (openId) fetchAll(true); }, [openId]);

  const onRefresh = () => { setRefreshing(true); fetchAll(false); };

  const openEditor = (kind, item) => {
    setModal({
      kind, id: item?.id || null,
      title: item?.title || '',
      text: item ? (item.body || item.desc || '') : '',
      level: item?.level || 'All',
      extra: item ? (item.mediaUrl || item.due || '') : '',
    });
  };

  const saveItem = async () => {
    if (!isStaff || !modal) return;
    if (!modal.title.trim()) { Alert.alert(t.errFill); return; }
    setBusy(true);
    try {
      const col = modal.kind === 'lesson' ? 'lessons' : 'assignments';
      const id = modal.id || (col[0] + Date.now().toString(36));
      const base = {
        title: modal.title.trim(),
        level: LEVELS.includes(modal.level) ? modal.level : 'All',
        by: user?.uid || '', byName: user?.name || user?.email || '',
        at: new Date().toISOString(),
      };
      const payload = modal.kind === 'lesson'
        ? { ...base, body: modal.text.trim(), mediaUrl: modal.extra.trim() }
        : { ...base, desc: modal.text.trim(), due: modal.extra.trim() };
      await setDoc(doc(db, col, id), payload, { merge: true });
      logActivity(user, modal.kind + (modal.id ? '.edit' : '.create'), modal.title.trim(), '');
      setModal(null);
      fetchAll(true);
    } catch (e) {
      Alert.alert('Error', String(e?.code || e?.message));
    } finally {
      setBusy(false);
    }
  };

  const delItem = (kind, item) => {
    if (!isStaff) return;
    Alert.alert(t.delQ, `"${item.title}"`, [
      { text: t.noDel, style: 'cancel' },
      {
        text: t.yesDel, style: 'destructive',
        onPress: async () => {
          try {
            await deleteDoc(doc(db, kind === 'lesson' ? 'lessons' : 'assignments', item.id));
            logActivity(user, kind + '.delete', item.title || item.id, '');
            if (openId === item.id) setOpenId(null);
            fetchAll(true);
          } catch (e) {
            Alert.alert('Error', String(e?.code || e?.message));
          }
        },
      },
    ]);
  };

  const submitAnswer = async (assign) => {
    if (!user?.uid || !answer.trim()) { Alert.alert(t.errFill); return; }
    setBusy(true);
    try {
      const sid = `${assign.id}_${user.uid}`;
      await setDoc(doc(db, 'submissions', sid), {
        assignmentId: assign.id, uid: user.uid, name: user.name || user.email || '',
        text: answer.trim(), link: answerLink.trim(),
        at: new Date().toISOString(),
      }, { merge: true });
      logActivity(user, 'assign.submit', assign.title || assign.id, '');
      setAnswer('');
      setAnswerLink('');
      Alert.alert(t.submitted);
      fetchAll(true);
    } catch (e) {
      Alert.alert('Error', String(e?.code || e?.message));
    } finally {
      setBusy(false);
    }
  };

  const saveGrade = async (sub) => {
    if (!isStaff) return;
    const g = gradeMap[sub.id] || {};
    setBusy(true);
    try {
      await setDoc(doc(db, 'submissions', sub.id), {
        grade: (g.grade || '').trim(), feedback: (g.feedback || '').trim(),
        gradedBy: user?.email || '', gradedAt: new Date().toISOString(),
      }, { merge: true });
      logActivity(user, 'assign.grade', sub.name || sub.uid, (g.grade || '').trim());
      fetchAll(true);
    } catch (e) {
      Alert.alert('Error', String(e?.code || e?.message));
    } finally {
      setBusy(false);
    }
  };

  const list = seg === 'lessons' ? lessons : assigns;
  const opened = openId ? list.find((x) => x.id === openId) : null;
  const openedSubs = openId ? subs.filter((s) => s.assignmentId === openId) : [];
  const mySub = !isStaff && opened ? openedSubs[0] : null;

  return (
    <SafeAreaView style={styles.container}>
      <AppHeader
        title={t.title}
        user={user}
        onLogout={onLogout}
        onProfilePress={goProfile}
        action={isStaff && !opened ? (
          <TouchableOpacity style={styles.addBtn} onPress={() => openEditor(seg === 'lessons' ? 'lesson' : 'assign', null)}>
            <Text style={styles.addBtnText}>{t.add}</Text>
          </TouchableOpacity>
        ) : null}
      />
      <View style={styles.segRow}>
        {['lessons', 'assignments'].map((s) => (
          <TouchableOpacity
            key={s}
            style={[styles.segBtn, seg === s && styles.segActive]}
            onPress={() => { setSeg(s); setOpenId(null); }}
          >
            <Text style={[styles.segText, seg === s && styles.segTextActive]}>
              {s === 'lessons' ? t.segLessons : t.segAssign}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {loading ? (
          <ActivityIndicator size="large" color="#D32F2F" style={{ marginTop: 30 }} />
        ) : opened ? (
          <View style={styles.card}>
            <TouchableOpacity onPress={() => setOpenId(null)}>
              <Text style={styles.backBtn}>{t.back}</Text>
            </TouchableOpacity>
            <Text style={styles.itemTitle}>{opened.title}</Text>
            <Text style={styles.meta}>
              [{opened.level || 'All'}]{opened.byName ? ` · ${t.by} ${opened.byName}` : ''}{opened.due ? ` · ⏰ ${opened.due}` : ''}
            </Text>
            <Text style={styles.body}>{opened.body || opened.desc || ''}</Text>
            {!!opened.mediaUrl && (
              <TouchableOpacity style={styles.mediaBtn} onPress={() => Linking.openURL(opened.mediaUrl).catch(() => {})}>
                <Text style={styles.mediaText}>{t.media}</Text>
              </TouchableOpacity>
            )}
            {isStaff && (
              <View style={styles.rowBtns}>
                <TouchableOpacity style={styles.editBtn} onPress={() => openEditor(seg === 'lessons' ? 'lesson' : 'assign', opened)}>
                  <Text style={styles.btnText}>{t.edit}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.delBtn} onPress={() => delItem(seg === 'lessons' ? 'lesson' : 'assign', opened)}>
                  <Text style={styles.btnText}>{t.del}</Text>
                </TouchableOpacity>
              </View>
            )}

            {seg === 'assignments' && !isStaff && (
              <View style={styles.subBox}>
                <Text style={styles.label}>{t.fAnswer}</Text>
                <TextInput
                  style={[styles.input, { minHeight: 70, textAlignVertical: 'top' }]}
                  value={answer}
                  onChangeText={setAnswer}
                  multiline
                  placeholder="…"
                  placeholderTextColor="#999"
                />
                <Text style={styles.label}>{t.fLink}</Text>
                <TextInput style={styles.input} value={answerLink} onChangeText={setAnswerLink} placeholder="https://…" placeholderTextColor="#999" />
                <TouchableOpacity style={styles.saveBtn} onPress={() => submitAnswer(opened)} disabled={busy}>
                  <Text style={styles.btnText}>{t.submit}</Text>
                </TouchableOpacity>
                {!!mySub && (
                  <View style={styles.gradedBox}>
                    <Text style={styles.body}>{mySub.text}</Text>
                    <Text style={styles.meta}>
                      {mySub.grade ? `🏅 ${mySub.grade}` : `⏳ ${t.noGrade}`}{mySub.feedback ? ` — ${mySub.feedback}` : ''}
                    </Text>
                  </View>
                )}
              </View>
            )}

            {seg === 'assignments' && isStaff && (
              <View style={styles.subBox}>
                <Text style={styles.label}>{t.subs} ({openedSubs.length})</Text>
                {openedSubs.length === 0 && <Text style={styles.meta}>{t.empty}</Text>}
                {openedSubs.map((s) => (
                  <View key={s.id} style={styles.gradedBox}>
                    <Text style={styles.itemTitle}>{s.name || s.uid}</Text>
                    <Text style={styles.body}>{s.text || ''}</Text>
                    {!!s.link && (
                      <TouchableOpacity onPress={() => Linking.openURL(s.link).catch(() => {})}>
                        <Text style={styles.linkText}>{s.link}</Text>
                      </TouchableOpacity>
                    )}
                    <Text style={styles.label}>{t.grade}</Text>
                    <TextInput
                      style={styles.input}
                      value={(gradeMap[s.id] || {}).grade ?? s.grade ?? ''}
                      onChangeText={(v) => setGradeMap((p) => ({ ...p, [s.id]: { ...p[s.id], grade: v, feedback: p[s.id]?.feedback ?? s.feedback ?? '' } }))}
                      placeholder="A / 85"
                      placeholderTextColor="#999"
                    />
                    <Text style={styles.label}>{t.feedback}</Text>
                    <TextInput
                      style={styles.input}
                      value={(gradeMap[s.id] || {}).feedback ?? s.feedback ?? ''}
                      onChangeText={(v) => setGradeMap((p) => ({ ...p, [s.id]: { grade: p[s.id]?.grade ?? s.grade ?? '', feedback: v } }))}
                      placeholder="…"
                      placeholderTextColor="#999"
                    />
                    <TouchableOpacity style={styles.saveBtn} onPress={() => saveGrade(s)} disabled={busy}>
                      <Text style={styles.btnText}>{t.gradeSave}</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
          </View>
        ) : list.length === 0 ? (
          <Text style={styles.empty}>{t.empty}</Text>
        ) : (
          list.map((x) => (
            <TouchableOpacity key={x.id} style={styles.card} onPress={() => setOpenId(x.id)}>
              <Text style={styles.itemTitle}>{x.title}</Text>
              <Text style={styles.meta}>
                [{x.level || 'All'}]{x.byName ? ` · ${t.by} ${x.byName}` : ''}{x.due ? ` · ⏰ ${x.due}` : ''}
              </Text>
              <Text style={styles.meta} numberOfLines={2}>{x.body || x.desc || ''}</Text>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      <Modal visible={!!modal} transparent animationType="fade" onRequestClose={() => setModal(null)}>
        <View style={styles.overlay}>
          <View style={styles.modalBox}>
            <ScrollView>
              <Text style={styles.itemTitle}>{t.add}</Text>
              <Text style={styles.label}>{t.fTitle}</Text>
              <TextInput style={styles.input} value={modal?.title || ''} onChangeText={(v) => setModal((m) => ({ ...m, title: v }))} />
              <Text style={styles.label}>{modal?.kind === 'lesson' ? t.fBody : t.fDesc}</Text>
              <TextInput
                style={[styles.input, { minHeight: 100, textAlignVertical: 'top' }]}
                value={modal?.text || ''} onChangeText={(v) => setModal((m) => ({ ...m, text: v }))} multiline
              />
              <Text style={styles.label}>{t.fLevel}</Text>
              <TextInput style={styles.input} value={modal?.level || ''} onChangeText={(v) => setModal((m) => ({ ...m, level: v }))} placeholder="All / N5…" placeholderTextColor="#999" />
              <Text style={styles.label}>{modal?.kind === 'lesson' ? t.fMedia : t.fDue}</Text>
              <TextInput style={styles.input} value={modal?.extra || ''} onChangeText={(v) => setModal((m) => ({ ...m, extra: v }))} placeholder="…" placeholderTextColor="#999" />
              <View style={styles.rowBtns}>
                <TouchableOpacity style={styles.cancelBtn} onPress={() => setModal(null)}>
                  <Text style={styles.btnText}>{t.cancel}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.saveBtn} onPress={saveItem} disabled={busy}>
                  <Text style={styles.btnText}>{busy ? '…' : t.save}</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  segRow: { flexDirection: 'row', paddingHorizontal: 15, paddingTop: 10 },
  segBtn: { flex: 1, paddingVertical: 8, borderWidth: 1, borderColor: '#D32F2F', alignItems: 'center', backgroundColor: '#FFF' },
  segActive: { backgroundColor: '#D32F2F' },
  segText: { fontSize: 13, fontWeight: 'bold', color: '#D32F2F' },
  segTextActive: { color: '#FFF' },
  scroll: { padding: 15 },
  card: { backgroundColor: '#FFF', borderRadius: 10, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: '#EEE' },
  itemTitle: { fontSize: 15, fontWeight: 'bold', color: '#333', marginBottom: 4 },
  meta: { fontSize: 11, color: '#888', marginBottom: 4 },
  body: { fontSize: 13, color: '#444', lineHeight: 20, marginTop: 6 },
  empty: { fontSize: 13, color: '#999', textAlign: 'center', marginTop: 30 },
  addBtn: { backgroundColor: '#D32F2F', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6 },
  addBtnText: { color: '#FFF', fontSize: 11, fontWeight: 'bold' },
  mediaBtn: { backgroundColor: '#1976D2', borderRadius: 8, padding: 10, marginTop: 10, alignItems: 'center' },
  mediaText: { color: '#FFF', fontSize: 13, fontWeight: 'bold' },
  rowBtns: { flexDirection: 'row', marginTop: 10 },
  editBtn: { backgroundColor: '#1976D2', borderRadius: 6, padding: 10, marginRight: 8, flex: 1, alignItems: 'center' },
  delBtn: { backgroundColor: '#D32F2F', borderRadius: 6, padding: 10, flex: 1, alignItems: 'center' },
  saveBtn: { backgroundColor: '#2E7D32', borderRadius: 8, padding: 12, marginTop: 10, alignItems: 'center' },
  cancelBtn: { backgroundColor: '#999', borderRadius: 8, padding: 12, marginTop: 10, marginRight: 8, flex: 1, alignItems: 'center' },
  btnText: { color: '#FFF', fontSize: 13, fontWeight: 'bold' },
  backBtn: { fontSize: 13, color: '#1976D2', fontWeight: 'bold', marginBottom: 8 },
  label: { fontSize: 12, fontWeight: 'bold', color: '#555', marginTop: 10, marginBottom: 4 },
  input: { borderWidth: 1, borderColor: '#DDD', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, fontSize: 13, backgroundColor: '#FAFAFA', color: '#333' },
  subBox: { marginTop: 12, borderTopWidth: 1, borderTopColor: '#EEE', paddingTop: 8 },
  gradedBox: { backgroundColor: '#F9F9F9', borderRadius: 8, padding: 10, marginTop: 8, borderWidth: 1, borderColor: '#EEE' },
  linkText: { fontSize: 12, color: '#1976D2', marginTop: 4 },
  overlay: { flex: 1, justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.5)', padding: 20 },
  modalBox: { backgroundColor: '#FFF', borderRadius: 12, padding: 18, maxHeight: '85%' },
});

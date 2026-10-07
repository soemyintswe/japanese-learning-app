// TeachingScreen — သင်ကြားရေး module (MVP)
// Staff (teacher/admin): lessons + assignments ရေး/ပြင်/ဖျက်, submissions အမှတ်ပေး
// Student: lessons ဖတ်, assignments ကြည့် + အဖြေတင် (တစ်ယောက် တစ်ပုဒ် — resubmit = update)
// Collections: lessons{title,body,level,mediaUrl,by,byName,at} /
//   assignments{title,desc,level,due,by,byName,at} /
//   submissions{assignmentId,uid,name,text,link,grade,feedback,at,gradedBy,gradedAt}
// Rules: lessons/assignments read-all/write-staff; submissions own-or-staff (see firestore.rules).
// Queries use SINGLE-field filters only (no composite index needed).
import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, TextInput, TouchableOpacity, ActivityIndicator, RefreshControl, Linking, Alert, Modal, Platform, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { collection, getDocs, doc, getDoc, setDoc, deleteDoc, query, orderBy, where } from 'firebase/firestore';
import * as ImagePicker from 'expo-image-picker';
import * as Sharing from 'expo-sharing';
import * as Clipboard from 'expo-clipboard';
import { db } from '../src/firebase';
import { logActivity } from '../src/activity';
import { useLanguage } from '../src/LanguageContext';
import AppHeader from './AppHeader';
import { LESSON_SEED, ASSIGN_SEED } from './teachingSeed';

const teachT = {
  my: {
    title: '📖 သင်ခန်းစာများ', segLessons: 'သင်ခန်းစာ', segAssign: 'Assignment',
    empty: 'မရှိသေးပါ။', by: 'သူ', at: '', level: 'Level', media: '🎬 ဗီဒီယို/လင့်ခ်ဖွင့်',
    add: '➕ အသစ်ထည့်မည်', edit: 'ပြင်မည်', del: 'ဖျက်မည်', save: 'သိမ်းမည်', cancel: 'မလုပ်တော့',
    fTitle: 'ခေါင်းစဉ်:', fBody: 'စာသား:', fLevel: 'Level (N5~N1 / All):', fMedia: 'Media link (YouTube/Drive, optional):',
    fDesc: 'ရှင်းလင်းချက်:', fDue: 'နောက်ဆုံးရက် (ဥပမာ 2026-10-20):',
    targetLabel: 'ပေးမည့်သူ:', targetAll: 'အားလုံး', targetLevel: 'Level:', targetPick: 'ကျောင်းသားရွေး:',
    photoAdd: '📷 ပုံတွဲမည်', photoDel: '✕ ပုံဖျက်မည်', photoBig: 'ပုံကြီးလွန်းတယ် (500KB အောက် ရွေးပါ)။',
    stTitle: '📊 အမှတ်စာရင်း', stSubmitted: 'တင်ပြီး', stGraded: 'အမှတ်ပေး', stAvg: 'ပျမ်းမျှ(ဂဏန်း)', stPending: 'မပေးရသေး',
    scoreL: 'ရမှတ် (0-100):', lvlL: 'အဆင့်:', resub: 'ပြန်တင်ပြီးပါပြီ ✅ (အမှတ်ပြန်ပေးရန် လိုမယ်)',
    submit: 'အဖြေတင်မည်', fAnswer: 'အဖြေ:', fLink: 'Link (optional):', submitted: 'တင်ပြီးပါပြီ ✅',
    grade: 'အမှတ်:', feedback: 'မှတ်ချက်:', gradeSave: 'အမှတ်ပေးမည်',
    noGrade: 'အမှတ်မပေးရသေး', subs: 'တင်ထားသူများ', delQ: 'ဖျက်မှာလား?', yesDel: 'ဖျက်မည်', noDel: 'မလုပ်တော့',
    errFill: 'ခေါင်းစဉ်ဖြည့်ပါ။', back: '◀ ပြန်သွားမည်',
    seedBtn: '🌱 နမူနာထည့်မည် (၆+၆)', seeded: 'နမူနာ ထည့်ပြီးပါပြီ ✅',
    impTitle: '📥 Lessons/Assignments Import', impHelp: 'JSON paste (သို့) file ရွေး — {lessons:[], assignments:[]} ပုံစံ။ id တူရင် skip.',
    impDo: 'ထည့်သွင်းမည်', impOk: 'Import ပြီးပါပြီ ✅', impNone: 'အသစ်မတွေ့ပါ။', impInvalid: 'JSON ပုံစံမှားနေပါတယ်။',
    expDone: 'Export ပြီးပါပြီ ✅',
  },
  en: {
    title: '📖 Lessons & Class', segLessons: 'Lessons', segAssign: 'Assignments',
    empty: 'Nothing yet.', by: 'By', at: '', level: 'Level', media: '🎬 Open video/link',
    add: '➕ Add new', edit: 'Edit', del: 'Delete', save: 'Save', cancel: 'Cancel',
    fTitle: 'Title:', fBody: 'Body:', fLevel: 'Level (N5~N1 / All):', fMedia: 'Media link (YouTube/Drive, optional):',
    fDesc: 'Description:', fDue: 'Due date (e.g. 2026-10-20):',
    targetLabel: 'Assign to:', targetAll: 'Everyone', targetLevel: 'Level:', targetPick: 'Pick students:',
    photoAdd: '📷 Attach photo', photoDel: '✕ Remove photo', photoBig: 'Photo too large (pick under 500KB).',
    stTitle: '📊 Grade stats', stSubmitted: 'submitted', stGraded: 'graded', stAvg: 'avg (numeric)', stPending: 'pending',
    scoreL: 'Score (0-100):', lvlL: 'Level:', resub: 'Resubmitted ✅ (needs re-grade)',
    submit: 'Submit answer', fAnswer: 'Answer:', fLink: 'Link (optional):', submitted: 'Submitted ✅',
    grade: 'Grade:', feedback: 'Feedback:', gradeSave: 'Grade it',
    noGrade: 'Not graded yet', subs: 'Submissions', delQ: 'Delete?', yesDel: 'Delete', noDel: 'Cancel',
    errFill: 'Title is required.', back: '◀ Back',
    seedBtn: '🌱 Add samples (6+6)', seeded: 'Samples added ✅',
    impTitle: '📥 Import Lessons/Assignments', impHelp: 'Paste JSON or pick a file — {lessons:[], assignments:[]} shape. Same id = skip.',
    impDo: 'Import', impOk: 'Import done ✅', impNone: 'Nothing new.', impInvalid: 'Invalid JSON shape.',
    expDone: 'Export done ✅',
  },
  jp: {
    title: '📖 授業', segLessons: 'レッスン', segAssign: '課題',
    empty: 'まだありません。', by: '', at: '', level: 'レベル', media: '🎬 動画/リンクを開く',
    add: '➕ 新規', edit: '編集', del: '削除', save: '保存', cancel: 'キャンセル',
    fTitle: 'タイトル:', fBody: '本文:', fLevel: 'レベル (N5~N1 / All):', fMedia: 'メディアリンク (任意):',
    fDesc: '説明:', fDue: '締切 (例 2026-10-20):',
    targetLabel: '対象:', targetAll: '全員', targetLevel: 'レベル:', targetPick: '学生を選択:',
    photoAdd: '📷 写真を添付', photoDel: '✕ 写真を外す', photoBig: '写真が大きすぎます (500KB以下)。',
    stTitle: '📊 成績', stSubmitted: '提出', stGraded: '採点済', stAvg: '平均(数値)', stPending: '未採点',
    scoreL: '得点 (0-100):', lvlL: 'レベル:', resub: '再提出 ✅ (再採点が必要)',
    submit: '提出する', fAnswer: '回答:', fLink: 'リンク (任意):', submitted: '提出済み ✅',
    grade: '評価:', feedback: 'コメント:', gradeSave: '採点する',
    noGrade: '未採点', subs: '提出一覧', delQ: '削除しますか?', yesDel: '削除', noDel: 'キャンセル',
    errFill: 'タイトルを入力してください。', back: '◀ 戻る',
    seedBtn: '🌱 見本を入れる (6+6)', seeded: '見本を追加しました ✅',
    impTitle: '📥 インポート', impHelp: 'JSONを貼付/選択 — {lessons:[], assignments:[]}。同idはスキップ。',
    impDo: '取込', impOk: '取込完了 ✅', impNone: '新規なし。', impInvalid: 'JSON形式エラー。',
    expDone: '書出完了 ✅',
  },
};

const LEVELS = ['All', 'N5', 'N4', 'N3', 'N2', 'N1'];

// Section error boundary — detail/sub render တစ်ခုခု ပေါက်ကွဲရင်တောင်
// tab တခုလုံး ဖြူမသွားအောင် (header + tabs ကျန်, inline error + retry)
class TeachErrorBoundary extends React.Component {
  constructor(p) { super(p); this.state = { err: null }; }
  static getDerivedStateFromError(e) { return { err: String((e && e.message) || e) }; }
  render() {
    if (this.state.err) {
      return (
        <View style={{ padding: 20, alignItems: 'center' }}>
          <Text style={{ fontSize: 13, color: '#C62828', marginBottom: 10 }}>⚠️ {this.state.err}</Text>
          <TouchableOpacity
            style={{ backgroundColor: '#D32F2F', borderRadius: 8, paddingHorizontal: 16, paddingVertical: 10 }}
            onPress={() => this.setState({ err: null })}
          >
            <Text style={{ color: '#FFF', fontWeight: 'bold' }}>🔄 Retry</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return this.props.children;
  }
}

const safeArr = (a) => (Array.isArray(a) ? a : []);

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
  // round-2: targets + photo
  const [myLevel, setMyLevel] = useState('');
  const [allUsers, setAllUsers] = useState([]);
  const [photo, setPhoto] = useState(null); // data-uri string for submit attach

  const fetchAll = async (silent) => {
    if (!silent) setLoading(true);
    try {
      // lessons + assignments parallel (sequential မဟုတ် — မြန်အောင်)
      const [lq, aq] = await Promise.all([
        getDocs(query(collection(db, 'lessons'), orderBy('at', 'desc'))),
        getDocs(query(collection(db, 'assignments'), orderBy('at', 'desc'))),
      ]);
      const la = [];
      lq.forEach((d) => la.push({ id: d.id, ...d.data() }));
      setLessons(la);
      const aa = [];
      aq.forEach((d) => aa.push({ id: d.id, ...d.data() }));
      setAssigns(aa);
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

  // own JLPT level — once on mount only (fetchAll တိုင်း ပြန်မဖတ်ဘူး)
  useEffect(() => {
    (async () => {
      try {
        if (!user?.uid) return;
        const me = await getDoc(doc(db, 'users', user.uid));
        if (me.exists()) {
          const d = me.data();
          setMyLevel(String(d.jlpt || d.testedLevel || '').toUpperCase());
        }
      } catch (e) {}
    })();
  }, []);

  // users directory — staff က assign editor ဖွင့်မှသာ lazy-load (photoURL base64 မပါ — name/email/role only)
  const ensureUsers = async () => {
    if (allUsers.length || !isStaff) return;
    try {
      const uq = await getDocs(collection(db, 'users'));
      const ua = [];
      uq.forEach((d) => {
        const dd = d.data() || {};
        ua.push({ id: d.id, name: dd.name || '', email: dd.email || '', role: dd.role || '' });
      });
      setAllUsers(ua);
    } catch (e) {}
  };

  // safety: loading 15s ထက် ကြာရင် အတင်းရပ် (spinner တစ်သက်လုံး မလည်)
  useEffect(() => {
    if (!loading) return;
    const tmr = setTimeout(() => { setLoading(false); setRefreshing(false); }, 15000);
    return () => clearTimeout(tmr);
  }, [loading]);

  useEffect(() => { fetchAll(false); }, []);
  // staff opens an assignment → reload its submissions
  useEffect(() => { if (openId) fetchAll(true); }, [openId]);

  // ---------- Export / Import (JSON backup + bulk add, staff import) ----------
  const [impVisible, setImpVisible] = useState(false);
  const [impText, setImpText] = useState('');

  const handleExport = async () => {
    const payload = JSON.stringify({
      app: 'JapaneseStudyPlanner-teaching', version: 1,
      exportedAt: new Date().toISOString(),
      lessons, assignments,
    }, null, 2);
    const fileName = `teaching-${lessons.length}L-${assigns.length}A.json`;
    try {
      if (Platform.OS === 'web' && typeof document !== 'undefined') {
        const blob = new Blob([payload], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 5000);
        Alert.alert('✅', `${t.expDone} (${lessons.length + assigns.length})`);
      } else {
        const FS = require('expo-file-system');
        const file = new FS.File(FS.Paths.cache, fileName);
        const writable = file.writableStream();
        const writer = writable.getWriter();
        await writer.write(new TextEncoder().encode(payload));
        await writer.close();
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(file.uri, { mimeType: 'application/json', dialogTitle: t.title });
        } else {
          throw new Error('share-unavailable');
        }
        Alert.alert('✅', `${t.expDone} (${lessons.length + assigns.length})`);
      }
    } catch (e) {
      try {
        await Clipboard.setStringAsync(payload);
        Alert.alert('✅', `${t.expDone} (${lessons.length + assigns.length})`);
      } catch (e2) {
        Alert.alert('⚠️', String((e && e.message) || e));
      }
    }
  };

  const handlePickFile = async () => {
    if (!isStaff) return;
    try {
      const DP = require('expo-document-picker');
      const res = await DP.getDocumentAsync({ type: ['application/json', 'text/plain'], copyToCacheDirectory: true });
      if (res.canceled) return;
      const uri = res.assets && res.assets[0] ? res.assets[0].uri : null;
      if (!uri) return;
      const resp = await fetch(uri);
      setImpText(await resp.text());
    } catch (e) {
      Alert.alert('⚠️', String(e.message || e));
    }
  };

  const cleanLevel = (v) => (LEVELS.includes(v) ? v : 'All');

  const doImportFromText = async (text) => {
    if (!isStaff) return;
    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch (e) {
      Alert.alert('⚠️', t.impInvalid);
      return;
    }
    const lArr = Array.isArray(parsed) ? [] : (parsed.lessons || []);
    const aArr = Array.isArray(parsed) ? parsed : (parsed.assignments || []);
    if (!Array.isArray(lArr) || !Array.isArray(aArr) || (lArr.length + aArr.length === 0)) {
      Alert.alert('⚠️', t.impInvalid);
      return;
    }
    setBusy(true);
    let added = 0;
    try {
      const now = new Date().toISOString();
      for (let i = 0; i < lArr.length; i++) {
        const e = lArr[i] || {};
        if (!e.title || !String(e.title).trim()) continue;
        const id = e.id ? String(e.id) : ('imp_l' + Date.now().toString(36) + '_' + i);
        const ref = doc(db, 'lessons', id);
        if ((await getDoc(ref)).exists()) continue;
        await setDoc(ref, {
          title: String(e.title), body: String(e.body || ''), level: cleanLevel(e.level),
          mediaUrl: String(e.mediaUrl || ''), target: 'all',
          by: user?.uid || '', byName: user?.name || user?.email || '', at: now,
        });
        added += 1;
      }
      for (let i = 0; i < aArr.length; i++) {
        const e = aArr[i] || {};
        if (!e.title || !String(e.title).trim()) continue;
        const id = e.id ? String(e.id) : ('imp_a' + Date.now().toString(36) + '_' + i);
        const ref = doc(db, 'assignments', id);
        if ((await getDoc(ref)).exists()) continue;
        const tg = e.target === 'level' ? 'level' : (e.target === 'students' && Array.isArray(e.targetUids) ? 'students' : 'all');
        await setDoc(ref, {
          title: String(e.title), desc: String(e.desc || ''), level: cleanLevel(e.level),
          due: String(e.due || ''), target: tg,
          targetLevel: cleanLevel(e.targetLevel || 'N5'),
          targetUids: Array.isArray(e.targetUids) ? e.targetUids.map(String) : [],
          by: user?.uid || '', byName: user?.name || user?.email || '', at: now,
        });
        added += 1;
      }
      logActivity(user, 'teaching.import', '+' + added, '');
      setImpText('');
      setImpVisible(false);
      Alert.alert('✅', added > 0 ? `${t.impOk} (+${added})` : t.impNone);
      fetchAll(true);
    } catch (e) {
      Alert.alert('⚠️', String(e?.code || e?.message || e));
    } finally {
      setBusy(false);
    }
  };

  const onRefresh = () => { setRefreshing(true); fetchAll(false); };

  // 🌱 starter samples (fixed IDs — existing ones skipped, staff only)
  const seedSamples = async () => {
    if (!isStaff) return;
    setBusy(true);
    try {
      const now = new Date().toISOString();
      for (const l of LESSON_SEED) {
        const ref = doc(db, 'lessons', l.id);
        const ex = await getDoc(ref);
        if (!ex.exists()) {
          await setDoc(ref, {
            title: l.title, body: l.body, level: l.level, mediaUrl: l.mediaUrl || '',
            target: 'all', by: user?.uid || '', byName: user?.name || user?.email || '', at: now,
          });
        }
      }
      for (const a of ASSIGN_SEED) {
        const ref = doc(db, 'assignments', a.id);
        const ex = await getDoc(ref);
        if (!ex.exists()) {
          await setDoc(ref, {
            title: a.title, desc: a.desc, level: a.level, due: a.due || '',
            target: a.target || 'all', targetLevel: a.targetLevel || 'N5', targetUids: a.targetUids || [],
            by: user?.uid || '', byName: user?.name || user?.email || '', at: now,
          });
        }
      }
      logActivity(user, 'teaching.seed', '6 lessons + 6 assignments', '');
      Alert.alert(t.seeded);
      fetchAll(true);
    } catch (e) {
      Alert.alert('Error', String(e?.code || e?.message));
    } finally {
      setBusy(false);
    }
  };

  const openEditor = (kind, item) => {
    if (kind === 'assign') ensureUsers(); // picker အတွက် lazy-load
    setModal({
      kind, id: item?.id || null,
      title: item?.title || '',
      text: item ? (item.body || item.desc || '') : '',
      level: item?.level || 'All',
      extra: item ? (item.mediaUrl || item.due || '') : '',
      target: item?.target || 'all',
      targetLevel: item?.targetLevel || 'N5',
      targetUids: item?.targetUids || [],
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
        ? {
            ...base, body: modal.text.trim(), mediaUrl: modal.extra.trim(),
            target: modal.target || 'all', targetLevel: modal.targetLevel || 'N5',
            targetUids: modal.targetUids || [],
          }
        : {
            ...base, desc: modal.text.trim(), due: modal.extra.trim(),
            target: modal.target || 'all', targetLevel: modal.targetLevel || 'N5',
            targetUids: modal.targetUids || [],
          };
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

  const pickPhoto = async () => {
    try {
      const r = await ImagePicker.launchImageLibraryAsync({ base64: true, quality: 0.4 });
      if (r.canceled || !r.assets?.[0]?.base64) return;
      const b64 = r.assets[0].base64;
      if (b64.length > 700000) { Alert.alert(t.photoBig); return; }
      setPhoto('data:image/jpeg;base64,' + b64);
    } catch (e) {
      Alert.alert('Error', String(e?.message || e));
    }
  };

  const submitAnswer = async (assign) => {
    if (!user?.uid || !answer.trim()) { Alert.alert(t.errFill); return; }
    setBusy(true);
    try {
      const sid = `${assign.id}_${user.uid}`;
      const prev = await getDoc(doc(db, 'submissions', sid));
      const isResub = prev.exists();
      await setDoc(doc(db, 'submissions', sid), {
        assignmentId: assign.id, uid: user.uid, name: user.name || user.email || '',
        text: answer.trim(), link: answerLink.trim(),
        ...(photo ? { photo } : {}),
        // ပြန်တင်ရင် အမှတ်/အဆင့် အဟောင်း ပျက် → ဆရာ ပြန်ပေးရန် (stale grade ကာကွယ်)
        ...(isResub ? { grade: '', feedback: '', score: '', slevel: '' } : {}),
        at: new Date().toISOString(),
      }, { merge: true });
      logActivity(user, isResub ? 'assign.resubmit' : 'assign.submit', assign.title || assign.id, photo ? '+photo' : '');
      setAnswer('');
      setAnswerLink('');
      setPhoto(null);
      Alert.alert(isResub ? t.resub : t.submitted);
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
      const score = String(g.score ?? sub.score ?? '').trim();
      await setDoc(doc(db, 'submissions', sub.id), {
        grade: score, score,
        slevel: g.slevel ?? sub.slevel ?? '',
        feedback: ((g.feedback ?? sub.feedback) || '').trim(),
        gradedBy: user?.email || '', gradedAt: new Date().toISOString(),
      }, { merge: true });
      logActivity(user, 'assign.grade', sub.name || sub.uid, score + ((g.slevel ?? sub.slevel) ? '/' + (g.slevel ?? sub.slevel) : ''));
      fetchAll(true);
    } catch (e) {
      Alert.alert('Error', String(e?.code || e?.message));
    } finally {
      setBusy(false);
    }
  };

  const rawList = seg === 'lessons' ? safeArr(lessons) : safeArr(assigns);
  // students see only lessons/assignments targeted at them (old docs without target = everyone)
  const list = !isStaff
    ? rawList.filter((a) => {
        if (!a || !a.target || a.target === 'all') return true;
        if (a.target === 'level') return !myLevel || (a.targetLevel || 'All') === 'All' || a.targetLevel === myLevel;
        if (a.target === 'students') return safeArr(a.targetUids).includes(user?.uid);
        return true;
      })
    : rawList;
  const targetTag = (x) => {
    if (!x.target || x.target === 'all') return '';
    if (x.target === 'level') return ` · 🎯 ${x.targetLevel || ''}`;
    return ` · 🎯 ${(x.targetUids || []).length}`;
  };
  const subScore = (s) => String(s.score ?? s.grade ?? '').trim();
  const subMarked = (s) => !!subScore(s);
  const statsLine = () => {
    const total = openedSubs.length;
    const graded = openedSubs.filter(subMarked);
    const nums = graded.map((s) => parseFloat(subScore(s))).filter((n) => !Number.isNaN(n));
    const avg = nums.length ? (nums.reduce((a, b) => a + b, 0) / nums.length).toFixed(1) : '—';
    return `${t.stSubmitted} ${total} · ${t.stGraded} ${graded.length} · ${t.stAvg} ${avg} · ${t.stPending} ${total - graded.length}`;
  };
  const opened = openId ? rawList.find((x) => x && x.id === openId) : null;
  const openedSubs = openId ? safeArr(subs).filter((s) => s && s.assignmentId === openId) : [];
  const mySub = !isStaff && opened ? openedSubs[0] : null;

  return (
    <SafeAreaView style={styles.container}>
      <AppHeader
        title={t.title}
        user={user}
        onLogout={onLogout}
        onProfilePress={goProfile}
        action={!opened ? (
          <View style={{ flexDirection: 'row' }}>
            {isStaff && (
              <TouchableOpacity style={[styles.addBtn, { marginRight: 6 }]} onPress={() => setImpVisible(true)}>
                <Text style={styles.addBtnText}>📥</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={[styles.addBtn, { marginRight: 6, backgroundColor: '#455A64' }]} onPress={handleExport}>
              <Text style={styles.addBtnText}>📤</Text>
            </TouchableOpacity>
            {isStaff && (
              <TouchableOpacity style={styles.addBtn} onPress={() => openEditor(seg === 'lessons' ? 'lesson' : 'assign', null)}>
                <Text style={styles.addBtnText}>{t.add}</Text>
              </TouchableOpacity>
            )}
          </View>
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
        <TeachErrorBoundary key={seg}>
        {loading ? (
          <ActivityIndicator size="large" color="#D32F2F" style={{ marginTop: 30 }} />
        ) : opened ? (
          <View style={styles.card}>
            <TouchableOpacity onPress={() => setOpenId(null)}>
              <Text style={styles.backBtn}>{t.back}</Text>
            </TouchableOpacity>
            <Text style={styles.itemTitle}>{opened.title}</Text>
            <Text style={styles.meta}>
              [{opened.level || 'All'}]{opened.byName ? ` · ${t.by} ${opened.byName}` : ''}{opened.due ? ` · ⏰ ${opened.due}` : ''}{targetTag(opened)}
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
                <View style={styles.rowBtns}>
                  <TouchableOpacity style={[styles.editBtn, { flex: 1 }]} onPress={pickPhoto} disabled={busy}>
                    <Text style={styles.btnText}>{t.photoAdd}</Text>
                  </TouchableOpacity>
                  {!!photo && (
                    <TouchableOpacity style={[styles.delBtn, { flex: 1 }]} onPress={() => setPhoto(null)}>
                      <Text style={styles.btnText}>{t.photoDel}</Text>
                    </TouchableOpacity>
                  )}
                </View>
                {!!photo && <Image source={{ uri: photo }} style={styles.attachedImg} />}
                <TouchableOpacity style={styles.saveBtn} onPress={() => submitAnswer(opened)} disabled={busy}>
                  <Text style={styles.btnText}>{t.submit}</Text>
                </TouchableOpacity>
                {!!mySub && (
                  <View style={styles.gradedBox}>
                    <Text style={styles.body}>{mySub.text}</Text>
                    {!!mySub.photo && <Image source={{ uri: mySub.photo }} style={styles.attachedImg} />}
                    <Text style={styles.meta}>
                      {subMarked(mySub) ? `🏅 ${subScore(mySub)}${mySub.slevel ? ` [${mySub.slevel}]` : ''}` : `⏳ ${t.noGrade}`}{mySub.feedback ? ` — ${mySub.feedback}` : ''}
                    </Text>
                  </View>
                )}
              </View>
            )}

            {seg === 'assignments' && isStaff && (
              <View style={styles.subBox}>
                <Text style={styles.label}>{t.subs} ({openedSubs.length})</Text>
                <Text style={styles.meta}>{t.stTitle}: {statsLine()}</Text>
                {openedSubs.length === 0 && <Text style={styles.meta}>{t.empty}</Text>}
                {openedSubs.map((s) => (
                  <View key={s.id} style={styles.gradedBox}>
                    <Text style={styles.itemTitle}>{s.name || s.uid}</Text>
                    <Text style={styles.body}>{s.text || ''}</Text>
                    {!!s.photo && <Image source={{ uri: s.photo }} style={styles.attachedImg} />}
                    {!!s.link && (
                      <TouchableOpacity onPress={() => Linking.openURL(s.link).catch(() => {})}>
                        <Text style={styles.linkText}>{s.link}</Text>
                      </TouchableOpacity>
                    )}
                    <Text style={styles.label}>{t.scoreL}</Text>
                    <TextInput
                      style={styles.input}
                      value={String((gradeMap[s.id] || {}).score ?? s.score ?? s.grade ?? '')}
                      onChangeText={(v) => setGradeMap((p) => ({ ...p, [s.id]: { ...p[s.id], score: v.replace(/[^0-9.]/g, ''), slevel: p[s.id]?.slevel ?? s.slevel ?? '', feedback: p[s.id]?.feedback ?? s.feedback ?? '' } }))}
                      placeholder="0-100"
                      placeholderTextColor="#999"
                      keyboardType="numeric"
                    />
                    <Text style={styles.label}>{t.lvlL}</Text>
                    <View style={[styles.rowBtns, { flexWrap: 'wrap', marginTop: 0 }]}>
                      {['—', 'N5', 'N4', 'N3', 'N2', 'N1'].map((lv) => {
                        const cur = (gradeMap[s.id] || {}).slevel ?? s.slevel ?? '';
                        const norm = lv === '—' ? '' : lv;
                        return (
                          <TouchableOpacity key={lv} style={[styles.segBtn, { paddingHorizontal: 10, marginRight: 4, marginTop: 4, flex: 0 }, cur === norm && styles.segActive]} onPress={() => setGradeMap((p) => ({ ...p, [s.id]: { ...p[s.id], score: p[s.id]?.score ?? s.score ?? s.grade ?? '', slevel: norm, feedback: p[s.id]?.feedback ?? s.feedback ?? '' } }))}>
                            <Text style={[styles.segText, cur === norm && styles.segTextActive]}>{lv}</Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                    <Text style={styles.label}>{t.feedback}</Text>
                    <TextInput
                      style={styles.input}
                      value={(gradeMap[s.id] || {}).feedback ?? s.feedback ?? ''}
                      onChangeText={(v) => setGradeMap((p) => ({ ...p, [s.id]: { score: p[s.id]?.score ?? s.score ?? s.grade ?? '', slevel: p[s.id]?.slevel ?? s.slevel ?? '', feedback: v } }))}
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
          <View style={{ alignItems: 'center', marginTop: 30 }}>
            <Text style={styles.empty}>{t.empty}</Text>
            {isStaff && (
              <TouchableOpacity style={[styles.saveBtn, { paddingHorizontal: 20 }]} onPress={seedSamples} disabled={busy}>
                <Text style={styles.btnText}>{t.seedBtn}</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          list.map((x) => (
            <TouchableOpacity key={x.id} style={styles.card} onPress={() => setOpenId(x.id)}>
              <Text style={styles.itemTitle}>{x.title}</Text>
              <Text style={styles.meta}>
                [{x.level || 'All'}]{x.byName ? ` · ${t.by} ${x.byName}` : ''}{x.due ? ` · ⏰ ${x.due}` : ''}{targetTag(x)}
              </Text>
              <Text style={styles.meta} numberOfLines={2}>{x.body || x.desc || ''}</Text>
            </TouchableOpacity>
          ))
        )}
        </TeachErrorBoundary>
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
              {/* target picker — lessons + assignments နှစ်မျိုးလုံး (တစ်ဦးချင်း/အုပ်စုခွဲ) */}
              {(
                <View>
                  <Text style={styles.label}>{t.targetLabel}</Text>
                  <View style={styles.rowBtns}>
                    {['all', 'level', 'students'].map((md) => (
                      <TouchableOpacity key={md} style={[styles.segBtn, { flex: 1, marginRight: 4 }, modal?.target === md && styles.segActive]} onPress={() => setModal((m) => ({ ...m, target: md }))}>
                        <Text style={[styles.segText, modal?.target === md && styles.segTextActive]}>{md === 'all' ? t.targetAll : md === 'level' ? t.targetLevel : t.targetPick}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                  {modal?.target === 'level' && (
                    <View style={[styles.rowBtns, { flexWrap: 'wrap' }]}>
                      {['N5', 'N4', 'N3', 'N2', 'N1'].map((lv) => (
                        <TouchableOpacity key={lv} style={[styles.segBtn, { paddingHorizontal: 12, marginRight: 4, marginTop: 4 }, modal?.targetLevel === lv && styles.segActive]} onPress={() => setModal((m) => ({ ...m, targetLevel: lv }))}>
                          <Text style={[styles.segText, modal?.targetLevel === lv && styles.segTextActive]}>{lv}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                  {modal?.target === 'students' && (
                    <View>
                      {allUsers.filter((u) => (u.role || '').toLowerCase() === 'student').slice(0, 100).map((u) => {
                        const on = (modal?.targetUids || []).includes(u.id);
                        return (
                          <TouchableOpacity key={u.id} style={styles.pickRow} onPress={() => setModal((m) => {
                            const cur = m.targetUids || [];
                            return { ...m, targetUids: on ? cur.filter((x) => x !== u.id) : [...cur, u.id] };
                          })}>
                            <Text style={styles.pickBox}>{on ? '☑️' : '⬜'}</Text>
                            <Text style={styles.pickName}>{u.name || u.email}</Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  )}
                </View>
              )}
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

      <Modal visible={impVisible} transparent animationType="fade" onRequestClose={() => setImpVisible(false)}>
        <View style={styles.overlay}>
          <View style={styles.modalBox}>
            <ScrollView>
              <Text style={styles.itemTitle}>{t.impTitle}</Text>
              <Text style={styles.meta}>{t.impHelp}</Text>
              <TouchableOpacity style={[styles.saveBtn, { backgroundColor: '#1976D2' }]} onPress={handlePickFile}>
                <Text style={styles.btnText}>📁 JSON</Text>
              </TouchableOpacity>
              <TextInput
                style={[styles.input, { minHeight: 120, textAlignVertical: 'top', marginTop: 8 }]}
                value={impText} onChangeText={setImpText} multiline
                placeholder='{"lessons":[],"assignments":[]}'
                placeholderTextColor="#999"
              />
              <View style={styles.rowBtns}>
                <TouchableOpacity style={styles.cancelBtn} onPress={() => setImpVisible(false)}>
                  <Text style={styles.btnText}>{t.cancel}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.saveBtn} onPress={() => doImportFromText(impText)} disabled={busy}>
                  <Text style={styles.btnText}>{busy ? '…' : t.impDo}</Text>
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
  attachedImg: { width: '100%', height: 200, borderRadius: 8, marginTop: 8, backgroundColor: '#EEE' },
  pickRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6 },
  pickBox: { fontSize: 14, marginRight: 8 },
  pickName: { fontSize: 13, color: '#333' },
  overlay: { flex: 1, justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.5)', padding: 20 },
  modalBox: { backgroundColor: '#FFF', borderRadius: 12, padding: 18, maxHeight: '85%' },
});

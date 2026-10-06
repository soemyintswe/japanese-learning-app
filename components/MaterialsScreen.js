// MaterialsScreen — 📚 ဆရာ၏ shared Drive materials library
// Teacher shares from THEIR own Google Drive app (Anyone-with-link viewer) → pastes link here.
// Firestore `materials`: {title, desc, level, type, url, createdBy, createdByName, createdAt, updatedAt}
// Rules: read signed-in, write staff(teacher/admin). No Drive API needed.
import React, { useState, useEffect, useRef } from 'react';
import * as Speech from 'expo-speech';
import { ESSAYS } from './essayData';
import { StyleSheet, Text, View, TextInput, FlatList, TouchableOpacity, Modal, Alert, Linking, Platform, ScrollView } from 'react-native';
import { WebView } from 'react-native-webview';
import { Video, ResizeMode } from 'expo-av';
import { SafeAreaView } from 'react-native-safe-area-context';
import { collection, query, onSnapshot, addDoc, updateDoc, deleteDoc, doc, orderBy } from 'firebase/firestore';
import { db } from '../src/firebase';
import { useLanguage } from '../src/LanguageContext';
import AppHeader from './AppHeader';
import { MATERIALS_SEED } from './materialsSeed';
import { useTeacherDrive, teacherDriveConfigured, guessType, SHARED_FOLDER } from '../src/teacherDrive';

// Teacher-only uploader — hook runs ONLY when OAuth configured (else render crash)
function TeacherUploadSection({ t, onUploaded }) {
  const td = useTeacherDrive();
  const [picked, setPicked] = React.useState(null);

  const pick = async () => {
    try {
      const DP = require('expo-document-picker');
      const res = await DP.getDocumentAsync({ type: '*/*', copyToCacheDirectory: true });
      if (res.canceled) return;
      const a = res.assets && res.assets[0];
      if (!a) return;
      setPicked({ uri: a.uri, name: a.name || 'file', mime: a.mimeType || '', size: a.size || 0 });
    } catch (e) {
      Alert.alert('⚠️', String(e.message || e));
    }
  };

  const upload = async () => {
    if (!picked) return;
    const r = await td.uploadPicked(picked);
    if (r.needAuth || r.expired) {
      try { await td.connect(); } catch (e) { Alert.alert('⚠️', String(e.message || e)); }
      return;
    }
    if (!r.ok) {
      Alert.alert('⚠️', r.error === 'too-big' ? t.upTooBig : `${t.upErr} (${r.error || 'unknown'})`);
      return;
    }
    const base = (picked.name || 'material').replace(/\.[^.]+$/, '');
    onUploaded({ title: base, type: guessType(picked.mime, picked.name), url: r.file.webViewLink || '' });
    setPicked(null);
    Alert.alert('✅', t.upOk);
  };

  return (
    <View style={{ backgroundColor: '#F3E8FD', borderRadius: 8, padding: 10, marginTop: 8, borderWidth: 1, borderColor: '#CE93D8' }}>
      <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#6A1B9A', marginBottom: 4 }}>{t.upTitle}</Text>
      <Text style={{ fontSize: 10, color: '#666', marginBottom: 8, lineHeight: 15 }}>{t.upHelp}</Text>
      {!td.connected ? (
        <TouchableOpacity style={[styles.miniUpBtn, { backgroundColor: '#6A1B9A' }]} onPress={() => td.connect().catch((e) => Alert.alert('⚠️', String(e.message || e)))} disabled={td.busy}>
          <Text style={styles.miniUpText}>{t.upConnect}</Text>
        </TouchableOpacity>
      ) : (
        <>
          <Text style={{ fontSize: 10, color: '#2E7D32', marginBottom: 6 }}>✅ {t.upConnected || ''}</Text>
          <View style={{ flexDirection: 'row' }}>
            <TouchableOpacity style={[styles.miniUpBtn, { flex: 1, backgroundColor: '#1976D2' }]} onPress={pick} disabled={td.busy}>
              <Text style={styles.miniUpText}>{t.upPick}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.miniUpBtn, { flex: 1, marginLeft: 8, backgroundColor: '#2E7D32' }]} onPress={upload} disabled={td.busy || !picked}>
              <Text style={styles.miniUpText}>{td.busy ? '…' : t.upDo}</Text>
            </TouchableOpacity>
          </View>
          {!!picked && (
            <Text style={{ fontSize: 11, color: '#333', marginTop: 6 }} numberOfLines={2}>
              📎 {picked.name}{picked.size ? ` (${(picked.size / 1048576).toFixed(1)} MB)` : ''}
            </Text>
          )}
        </>
      )}
    </View>
  );
}

const ADMIN_EMAIL = 'soemyintswe@gmail.com';

const mT = {
  my: {
    header: '📚 စာကြည့်တိုက်', searchPh: 'ခေါင်းစဉ်ရှာရန်...', all: 'အားလုံး',
    add: '➕ အသစ်', edit: 'ပြင်မည်', del: 'ဖျက်မည်', open: 'ဖွင့်ကြည့်မည် ↗',
    empty: 'သင်ခန်းစာ မရှိသေးပါ။',
    segLib: '📚 စာကြည့်တိုက်', segEssay: '📖 Essay & သီချင်း',
    backToList: '← စာရင်း', essPlayAll: '▶️ အစဆုံးဖွင့်',
    mTitle: 'ခေါင်းစဉ်:', mTitlePh: 'ဥပမာ - N5 Kanji Worksheet 1',
    mDesc: 'ရှင်းလင်းချက်:', mDescPh: 'အကျဉ်းရေးပါ...',
    mLevel: 'Level:', mType: 'အမျိုးအစား:', mUrl: 'Google Drive Link:',
    mUrlPh: 'https://drive.google.com/... (Anyone with link)',
    mUrlHelp: 'နည်း: Drive မှာ folder အသစ် ("MKS Materials") ဆောက် → Right-click Share → Anyone with the link (Viewer) → ဖိုင်များ/ပုံ/အသံ/ဗီဒီယို အဲဒီထဲထည့် → file/folder link ကူးထည့်ပါ။ (App က folder auto-မဆောက်ဘူး — ကိုယ်တိုင်တစ်ခါဆောက်ရုံနဲ့ နောက် link ကူးထည့်ရုံပဲ)',
    cancel: 'ပယ်ဖျက်မည်', save: 'သိမ်းမည်',
    newTitle: 'သင်ခန်းစာအသစ်', editTitle: 'သင်ခန်းစာ ပြင်ရန်',
    errFill: 'ခေါင်းစဉ် + Drive link ဖြည့်ပါ။', errUrl: 'Link ပုံစံမှားနေပါတယ် (https://...)။',
    delQ: 'ဖျက်ရန် သေချာလား?', no: 'မလုပ်ပါ', yes: 'ဖျက်မည်', done: 'ပြီးပါပြီ ✅',
    openExternal: 'Browser နဲ့ဖွင့်မည် ↗', closeViewer: 'ပိတ်မည် ✕',
    seedBtn: '🌱 အဆင်သင့် (24)', seedDone: 'Starter ထည့်ပြီးပါပြီ ✅', seedNone: 'အကုန်ရှိနေပြီးသား ✅',
    upTitle: '📤 100GB Drive တိုက်ရိုက်တင် (ဆရာ)',
    upHelp: '100GB Gmail ချိတ် → file ရွေး → Upload → "MKS Materials" folder + Anyone-link auto → link auto-ဖြည့်',
    upConnect: '🔗 100GB Gmail ချိတ်မယ်', upPick: '📁 File ရွေးမယ်', upDo: '⬆️ Upload + link ဖြည့်မည်',
    upOk: 'Upload ပြီးပါပြီ ✅ — ခေါင်းစဉ်/အဆင့် စစ်ပြီး Save နှိပ်ပါ',
    upTooBig: '100MB ထက်ကြီးတယ် — Drive app ကနေ တိုက်ရိုက်တင်ပြီး link ကူးထည့်ပါ။',
    upErr: 'Upload error', upSetup: 'Admin setup လိုသေးတယ်: Google OAuth Client ID (.env)',
    upConnected: 'Drive ချိတ်ထားပြီး ✅ — file ရွေး → Upload',
    types: { doc: '📄 စာရွက်', video: '🎬 ဗီဒီယို', audio: '🎧 အသံ', link: '🔗 လင့်' },
  },
  en: {
    header: '📚 Library', searchPh: 'Search titles...', all: 'All',
    add: '➕ New', edit: 'Edit', del: 'Delete', open: 'Open ↗',
    empty: 'No materials yet.',
    segLib: '📚 Library', segEssay: '📖 Essays & Songs',
    backToList: '← List', essPlayAll: '▶️ Play all',
    mTitle: 'Title:', mTitlePh: 'e.g. N5 Kanji Worksheet 1',
    mDesc: 'Description:', mDescPh: 'Short description...',
    mLevel: 'Level:', mType: 'Type:', mUrl: 'Google Drive Link:',
    mUrlPh: 'https://drive.google.com/... (Anyone with link)',
    mUrlHelp: 'How: create a folder ("MKS Materials") in Drive → Share → Anyone with the link (Viewer) → put files/images/audio/video inside → paste file/folder link here. (App does not auto-create folders.)',
    cancel: 'Cancel', save: 'Save',
    newTitle: 'New Material', editTitle: 'Edit Material',
    errFill: 'Fill title + Drive link.', errUrl: 'Bad link format (https://...).',
    delQ: 'Delete?', no: 'No', yes: 'Delete', done: 'Done ✅',
    openExternal: 'Open in browser ↗', closeViewer: 'Close ✕',
    seedBtn: '🌱 Starter (24)', seedDone: 'Starter added ✅', seedNone: 'Already all there ✅',
    upTitle: '📤 Direct upload to 100GB Drive (teacher)',
    upHelp: 'Connect 100GB Gmail → pick file → Upload → "MKS Materials" folder + Anyone-link auto → link auto-filled',
    upConnect: '🔗 Connect 100GB Gmail', upPick: '📁 Pick file', upDo: '⬆️ Upload + fill link',
    upOk: 'Uploaded ✅ — check title/level then Save',
    upTooBig: 'Over 100MB — upload via Drive app and paste the link.',
    upErr: 'Upload error', upSetup: 'Admin setup needed: Google OAuth Client ID (.env)',
    upConnected: 'Drive connected ✅ — pick a file → Upload',
    types: { doc: '📄 Doc', video: '🎬 Video', audio: '🎧 Audio', link: '🔗 Link' },
  },
  jp: {
    header: '📚 資料室', searchPh: 'タイトル検索...', all: 'すべて',
    add: '➕ 新規', edit: '編集', del: '削除', open: '開く ↗',
    empty: '資料なし。',
    segLib: '📚 資料', segEssay: '📖 エッセイ・歌',
    backToList: '← 一覧', essPlayAll: '▶️ 全部再生',
    mTitle: 'タイトル:', mTitlePh: '例 - N5漢字ワークシート1',
    mDesc: '説明:', mDescPh: '短く書く...',
    mLevel: 'レベル:', mType: '種類:', mUrl: 'Googleドライブリンク:',
    mUrlPh: 'https://drive.google.com/...',
    mUrlHelp: 'Driveでフォルダ作成→共有→リンクを知る全員（閲覧）→ファイル/画像/音声/動画を入れ→リンク貼付。',
    cancel: 'キャンセル', save: '保存',
    newTitle: '新規資料', editTitle: '資料編集',
    errFill: 'タイトル＋リンクを入力。', errUrl: 'リンク形式エラー。',
    delQ: '削除しますか？', no: 'いいえ', yes: '削除', done: '完了 ✅',
    openExternal: 'ブラウザで開く ↗', closeViewer: '閉じる ✕',
    seedBtn: '🌱 スターター', seedDone: '追加 ✅', seedNone: '追加済み ✅',
    upTitle: '📤 100GBドライブ直接upload',
    upHelp: 'Gmail接続 → 選択 → Upload → フォルダ＋公開リンク自動',
    upConnect: '🔗 接続', upPick: '📁 選択', upDo: '⬆️ Upload',
    upOk: '完了 ✅ — 保存を押す',
    upTooBig: '100MB超 — Driveアプリで直接。',
    upErr: 'エラー', upSetup: '管理者設定が必要',
    upConnected: '接続中 ✅',
    types: { doc: '📄 資料', video: '🎬 動画', audio: '🎧 音声', link: '🔗 リンク' },
  },
};

const LEVELS = ['N5', 'N4', 'N3', 'N2', 'N1'];
const TYPES = ['doc', 'video', 'audio', 'link'];

// URL → in-app viewer: {kind:'youtube'|'drive'|'av', embed|url} or {kind:'external'}
function extractYouTubeId(url) {
  if (!url) return null;
  const m = url.match(/(?:youtube\.com\/(?:watch\?v=|shorts\/|live\/|embed\/)|youtu\.be\/)([A-Za-z0-9_-]{6,})/);
  return m ? m[1] : null;
}
function extractDriveId(url) {
  if (!url) return null;
  let m = url.match(/drive\.google\.com\/file\/d\/([A-Za-z0-9_-]+)/);
  if (m) return m[1];
  m = url.match(/[?&]id=([A-Za-z0-9_-]+)/);
  if (m && /drive\.google\.com|docs\.google\.com/.test(url)) return m[1];
  return null;
}
function resolveViewer(url) {
  const u = (url || '').trim();
  if (!u) return { kind: 'external', url: u };
  // YouTube playlist → videoseries embed (plays in-app, continuous)
  const pl = u.match(/[?&]list=([A-Za-z0-9_-]+)/);
  if (pl && /youtube\.com|youtu\.be/.test(u)) {
    return { kind: 'youtube', embed: `https://www.youtube.com/embed/videoseries?list=${pl[1]}` };
  }
  const yt = extractYouTubeId(u);
  if (yt) return { kind: 'youtube', embed: `https://www.youtube.com/embed/${yt}?rel=0` };
  // NOTE: channel URLs (/@handle, /channel/, /user/, /c/) have NO embed player —
  // they fall through to external (YouTube app/site), which is correct behavior.
  const did = extractDriveId(u);
  if (did) return { kind: 'drive', embed: `https://drive.google.com/file/d/${did}/preview`, direct: `https://drive.google.com/uc?export=download&id=${did}` };
  if (/\.(mp3|wav|m4a|ogg|mpga)(\?|$)/i.test(u)) return { kind: 'av', url: u, audioOnly: true };
  if (/\.(mp4|mov|webm|mkv)(\?|$)/i.test(u)) return { kind: 'av', url: u, audioOnly: false };
  return { kind: 'external', url: u };
}

export default function MaterialsScreen({ user, onLogout, navigation }) {
  const goProfile = () => { try { navigation.navigate('Community', { seg: 'profile' }); } catch (e) {} };
  const { lang } = useLanguage();
  const t = mT[lang] || mT.my;
  const staff = (user?.email || '').toLowerCase() === ADMIN_EMAIL.toLowerCase()
    || user?.role === 'teacher' || user?.role === 'admin';

  const [items, setItems] = useState([]);
  const [q, setQ] = useState('');
  const [lv, setLv] = useState('All');
  const [modal, setModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [viewer, setViewer] = useState(null); // {title, resolved}
  const videoRef = React.useRef(null);

  // 📖 Essay & Songs reader — continuous sentence listening (JA → MM per line)
  const [essMode, setEssMode] = useState('lib'); // lib | essay
  const [readerEssay, setReaderEssay] = useState(null);
  const [essIdx, setEssIdx] = useState(-1);
  const [essPlaying, setEssPlaying] = useState(false);
  const essRef = useRef({ active: false, idx: 0, timer: null });
  const essListRef = useRef(null);

  useEffect(() => {
    return () => {
      const p = essRef.current;
      p.active = false;
      if (p.timer) clearTimeout(p.timer);
      try { Speech.stop(); } catch (e) {}
    };
  }, []);

  const stopEss = () => {
    const p = essRef.current;
    p.active = false;
    if (p.timer) { clearTimeout(p.timer); p.timer = null; }
    try { Speech.stop(); } catch (e) {}
    setEssPlaying(false);
    setEssIdx(-1);
  };

  const nextEss = (essay, i) => {
    if (!essRef.current.active) return;
    essRef.current.timer = setTimeout(() => speakEssLine(essay, i + 1), 650);
  };

  const speakEssLine = (essay, i) => {
    const p = essRef.current;
    if (!p.active || !essay) return;
    if (i >= essay.lines.length) { stopEss(); return; }
    p.idx = i;
    setEssIdx(i);
    try {
      if (essListRef.current && essListRef.current.scrollToIndex) {
        essListRef.current.scrollToIndex({ index: i, viewPosition: 0.25, animated: true });
      }
    } catch (e) {}
    const L = essay.lines[i];
    try {
      Speech.speak(L.ja, {
        language: 'ja', rate: 0.85,
        onDone: () => {
          if (!essRef.current.active) return;
          try {
            Speech.speak(L.mm, {
              language: 'my', rate: 0.95,
              onDone: () => nextEss(essay, i),
              onError: () => nextEss(essay, i),
            });
          } catch (e) { nextEss(essay, i); }
        },
        onError: () => nextEss(essay, i),
      });
    } catch (e) { nextEss(essay, i); }
  };

  const playEssFrom = (essay, i) => {
    stopEss();
    if (!essay || !essay.lines.length) return;
    essRef.current.active = true;
    setEssPlaying(true);
    speakEssLine(essay, Math.max(0, i));
  };

  const openEssay = (essay) => {
    stopEss();
    essRef.current.idx = 0;
    setEssIdx(-1);
    setReaderEssay(essay);
  };
  const [fTitle, setFTitle] = useState('');
  const [fDesc, setFDesc] = useState('');
  const [fLevel, setFLevel] = useState('N5');
  const [fType, setFType] = useState('doc');
  const [fUrl, setFUrl] = useState('');

  useEffect(() => {
    const unsub = onSnapshot(
      query(collection(db, 'materials'), orderBy('updatedAt', 'desc')),
      (snap) => {
        const arr = [];
        snap.forEach((d) => arr.push({ id: d.id, ...d.data() }));
        setItems(arr);
      }, () => {}
    );
    return unsub;
  }, []);

  const filtered = items.filter((m) => {
    if (lv !== 'All' && m.level !== 'All' && m.level !== lv) return false;
    const s = q.trim().toLowerCase();
    if (!s) return true;
    return (m.title || '').toLowerCase().includes(s) || (m.desc || '').toLowerCase().includes(s);
  });

  const openAdd = () => {
    setEditId(null); setFTitle(''); setFDesc(''); setFLevel('N5'); setFType('doc'); setFUrl('');
    setModal(true);
  };
  const openEdit = (m) => {
    setEditId(m.id); setFTitle(m.title || ''); setFDesc(m.desc || '');
    setFLevel(m.level || 'N5'); setFType(m.type || 'doc'); setFUrl(m.url || '');
    setModal(true);
  };

  const save = async () => {
    if (!fTitle.trim() || !fUrl.trim()) {
      Alert.alert('⚠️', t.errFill);
      return;
    }
    if (!/^https:\/\//.test(fUrl.trim())) {
      Alert.alert('⚠️', t.errUrl);
      return;
    }
    try {
      const data = {
        title: fTitle.trim(), desc: fDesc.trim(), level: fLevel, type: fType,
        url: fUrl.trim(), updatedAt: new Date().toISOString(),
      };
      if (editId) {
        await updateDoc(doc(db, 'materials', editId), data);
      } else {
        await addDoc(collection(db, 'materials'), {
          ...data, createdBy: user.uid, createdByName: user.name || '',
          createdAt: new Date().toISOString(),
        });
      }
      setModal(false);
      Alert.alert('✅', t.done);
    } catch (e) {
      Alert.alert('⚠️', e.message);
    }
  };

  // 🌱 Starter pack — တစ်ချက်နှိပ်, ရှိပြီးသားဆို skip
  const [seeding, setSeeding] = useState(false);
  const seedStarter = async () => {
    if (!staff || seeding) return;
    setSeeding(true);
    try {
      const have = new Set(items.map((m) => (m.title || '').trim().toLowerCase()));
      let added = 0;
      for (const s of MATERIALS_SEED) {
        if (have.has(s.title.trim().toLowerCase())) continue;
        await addDoc(collection(db, 'materials'), {
          ...s, createdBy: user.uid, createdByName: (user.name || '') + ' (seed)',
          createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
        });
        added += 1;
      }
      Alert.alert('✅', added > 0 ? `${t.seedDone} (+${added})` : t.seedNone);
    } catch (e) {
      Alert.alert('⚠️', e.message);
    } finally {
      setSeeding(false);
    }
  };

  const del = (id) => {
    Alert.alert(t.delQ, '', [
      { text: t.no, style: 'cancel' },
      { text: t.yes, style: 'destructive', onPress: async () => {
        try { await deleteDoc(doc(db, 'materials', id)); } catch (e) { Alert.alert('⚠️', e.message); }
      } },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <AppHeader
        title={t.header}
        user={user}
        onLogout={onLogout}
        onProfilePress={goProfile}
        action={staff ? (
          <View style={{ flexDirection: 'row' }}>
            <TouchableOpacity style={[styles.addBtn, { backgroundColor: '#2E7D32', marginRight: 6 }]} onPress={seedStarter} disabled={seeding}>
              <Text style={styles.addBtnText}>{t.seedBtn}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.addBtn} onPress={openAdd}>
              <Text style={styles.addBtnText}>{t.add}</Text>
            </TouchableOpacity>
          </View>
        ) : null}
      />

      {/* 📚 Library | 📖 Essay & Songs */}
      <View style={{ flexDirection: 'row', paddingHorizontal: 12, paddingTop: 8 }}>
        {[
          { k: 'lib', label: t.segLib },
          { k: 'essay', label: t.segEssay },
        ].map((s) => (
          <TouchableOpacity
            key={s.k}
            style={[styles.segBtn, essMode === s.k && styles.segBtnActive]}
            onPress={() => { stopEss(); setReaderEssay(null); setEssMode(s.k); }}
          >
            <Text style={[styles.segText, essMode === s.k && styles.segTextActive]}>{s.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {essMode === 'lib' ? (
      <>

      <View style={styles.searchRow}>
        <Text style={{ fontSize: 16, marginRight: 6 }}>🔍</Text>
        <TextInput style={styles.searchInput} placeholder={t.searchPh} placeholderTextColor="#999" value={q} onChangeText={setQ} />
      </View>

      <View style={styles.chipRow}>
        {['All', ...LEVELS].map((l) => (
          <TouchableOpacity key={l} style={[styles.chip, lv === l && styles.chipActive]} onPress={() => setLv(l)}>
            <Text style={[styles.chipText, lv === l && styles.chipTextActive]}>{l === 'All' ? t.all : l}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {filtered.length === 0 ? (
        <Text style={styles.empty}>{t.empty}</Text>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(m) => m.id}
          contentContainerStyle={{ padding: 12 }}
          renderItem={({ item: m }) => (
            <View style={styles.card}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={{ fontSize: 26, marginRight: 10 }}>{(t.types[m.type] || '🔗').split(' ')[0]}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardTitle}>{m.title}</Text>
                  {!!m.desc && <Text style={styles.cardDesc} numberOfLines={2}>{m.desc}</Text>}
                  <View style={{ flexDirection: 'row', marginTop: 4 }}>
                    <View style={styles.badge}><Text style={styles.badgeText}>{m.level || 'All'}</Text></View>
                    <View style={[styles.badge, { backgroundColor: '#E3F2FD', marginLeft: 6 }]}>
                      <Text style={[styles.badgeText, { color: '#1976D2' }]}>{t.types[m.type] || m.type}</Text>
                    </View>
                  </View>
                </View>
              </View>
              <View style={{ flexDirection: 'row', marginTop: 10 }}>
                <TouchableOpacity
                  style={[styles.openBtn, { flex: 1 }]}
                  onPress={() => {
                    const r = resolveViewer(m.url);
                    if (r.kind === 'external') Linking.openURL(m.url).catch(() => {});
                    else setViewer({ title: m.title, resolved: r, url: m.url });
                  }}
                >
                  <Text style={styles.openBtnText}>{t.open}</Text>
                </TouchableOpacity>
                {staff && (
                  <>
                    <TouchableOpacity style={[styles.miniBtn, { marginLeft: 8 }]} onPress={() => openEdit(m)}>
                      <Text style={{ fontSize: 16 }}>✏️</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.miniBtn, { marginLeft: 6 }]} onPress={() => del(m.id)}>
                      <Text style={{ fontSize: 16 }}>🗑️</Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>
            </View>
          )}
        />
      )}
      </>
      ) : !readerEssay ? (
        <FlatList
          data={ESSAYS}
          keyExtractor={(e) => e.id}
          contentContainerStyle={{ padding: 12 }}
          renderItem={({ item: e }) => (
            <TouchableOpacity style={styles.card} onPress={() => openEssay(e)} activeOpacity={0.85}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={{ fontSize: 28, marginRight: 10 }}>{e.kind === 'song' ? '🎵' : '📖'}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardTitle}>{e.title}</Text>
                  <Text style={styles.cardDesc}>{e.level} • {e.lines.length} lines</Text>
                </View>
                <Text style={{ fontSize: 20 }}>▶️</Text>
              </View>
            </TouchableOpacity>
          )}
        />
      ) : (
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8 }}>
            <TouchableOpacity
              style={{ backgroundColor: '#EEE', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6, marginRight: 8 }}
              onPress={() => { stopEss(); setReaderEssay(null); }}
            >
              <Text style={{ fontSize: 12, fontWeight: 'bold' }}>{t.backToList}</Text>
            </TouchableOpacity>
            <Text style={[styles.cardTitle, { flex: 1 }]} numberOfLines={1}>
              {readerEssay.kind === 'song' ? '🎵' : '📖'} {readerEssay.title}
            </Text>
          </View>
          <View style={{ flexDirection: 'row', paddingHorizontal: 12, paddingBottom: 8 }}>
            {!essPlaying ? (
              <TouchableOpacity
                style={[styles.openBtn, { flex: 1, backgroundColor: '#7B1FA2' }]}
                onPress={() => {
                  essRef.current.active = true;
                  setEssPlaying(true);
                  const p = essRef.current;
                  p.idx = 0;
                  speakEssLine(readerEssay, 0);
                }}
              >
                <Text style={styles.openBtnText}>{t.essPlayAll} ({readerEssay.lines.length})</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[styles.openBtn, { flex: 1, backgroundColor: '#555' }]}
                onPress={stopEss}
              >
                <Text style={styles.openBtnText}>⏹️</Text>
              </TouchableOpacity>
            )}
          </View>
          <FlatList
            ref={essListRef}
            data={readerEssay.lines}
            keyExtractor={(_, i) => String(i)}
            contentContainerStyle={{ padding: 12, paddingTop: 0 }}
            renderItem={({ item: L, index }) => (
              <TouchableOpacity
                style={[styles.card, index === essIdx && essPlaying && styles.playingLine]}
                onPress={() => {
                  stopEss();
                  essRef.current.active = true;
                  setEssPlaying(true);
                  speakEssLine(readerEssay, index);
                }}
                activeOpacity={0.85}
              >
                <Text style={styles.lineJA}>{L.ja}</Text>
                {!!L.reading && <Text style={styles.lineReading}>{L.reading}</Text>}
                <Text style={styles.lineMM}>🇲🇲 {L.mm}</Text>
                {index === essIdx && essPlaying && <Text style={styles.nowBadge}>🔊</Text>}
              </TouchableOpacity>
            )}
          />
        </View>
      )}

      <Modal visible={modal} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            <Text style={styles.modalTitle}>{editId ? t.editTitle : t.newTitle}</Text>
            <Text style={styles.label}>{t.mTitle}</Text>
            <TextInput style={styles.input} value={fTitle} onChangeText={setFTitle} placeholder={t.mTitlePh} placeholderTextColor="#999" />
            <Text style={styles.label}>{t.mDesc}</Text>
            <TextInput
              style={[styles.input, { minHeight: 90, textAlignVertical: 'top', paddingTop: 8 }]}
              value={fDesc} onChangeText={setFDesc} placeholder={t.mDescPh} placeholderTextColor="#999"
              multiline={true} numberOfLines={4}
            />
            <Text style={styles.label}>{t.mLevel}</Text>
            <View style={styles.chipRow2}>
              {['All', ...LEVELS].map((l) => (
                <TouchableOpacity key={l} style={[styles.chip, fLevel === l && styles.chipActive]} onPress={() => setFLevel(l)}>
                  <Text style={[styles.chipText, fLevel === l && styles.chipTextActive]}>{l === 'All' ? t.all : l}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.label}>{t.mType}</Text>
            <View style={styles.chipRow2}>
              {TYPES.map((ty) => (
                <TouchableOpacity key={ty} style={[styles.chip, fType === ty && styles.chipActive]} onPress={() => setFType(ty)}>
                  <Text style={[styles.chipText, fType === ty && styles.chipTextActive]}>{t.types[ty]}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.label}>{t.mUrl}</Text>
            <TextInput style={styles.input} value={fUrl} onChangeText={setFUrl} placeholder={t.mUrlPh} placeholderTextColor="#999" autoCapitalize="none" />
            <Text style={styles.help}>{t.mUrlHelp}</Text>
            {staff && (teacherDriveConfigured() ? (
              <TeacherUploadSection
                t={t}
                onUploaded={(u) => {
                  if (u.title && !fTitle.trim()) setFTitle(u.title);
                  setFType(u.type);
                  setFUrl(u.url);
                }}
              />
            ) : (
              <Text style={[styles.help, { color: '#C62828' }]}>{t.upSetup}</Text>
            ))}
              <View style={styles.modalActionRow}>
                <TouchableOpacity style={styles.cancelBtn} onPress={() => setModal(false)}>
                  <Text style={styles.cancelBtnText}>{t.cancel}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.saveBtn} onPress={save}>
                  <Text style={styles.saveBtnText}>{t.save}</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* In-app viewer: YouTube / Drive preview / audio-video — app အထဲမှာတင် */}
      <Modal visible={!!viewer} animationType="slide" transparent={false}>
        <SafeAreaView style={[styles.container, { backgroundColor: '#000' }]}>
          <View style={styles.viewerBar}>
            <Text style={styles.viewerTitle} numberOfLines={1}>{viewer?.title || ''}</Text>
            <TouchableOpacity onPress={() => setViewer(null)} style={styles.viewerClose}>
              <Text style={styles.viewerCloseText}>{t.closeViewer}</Text>
            </TouchableOpacity>
          </View>
          {!!viewer && (viewer.resolved.kind === 'youtube' || viewer.resolved.kind === 'drive') && (
            <WebView
              source={{ uri: viewer.resolved.embed }}
              style={{ flex: 1, backgroundColor: '#000' }}
              allowsFullscreenVideo={true}
              mediaPlaybackRequiresUserAction={false}
            />
          )}
          {!!viewer && viewer.resolved.kind === 'av' && (
            <View style={{ flex: 1, backgroundColor: '#000', justifyContent: 'center' }}>
              <Video
                ref={videoRef}
                source={{ uri: viewer.resolved.url }}
                style={{ width: '100%', height: viewer.resolved.audioOnly ? 80 : 260 }}
                resizeMode={ResizeMode.CONTAIN}
                useNativeControls
                shouldPlay
              />
            </View>
          )}
          {!!viewer && (
            <TouchableOpacity
              style={styles.extBtn}
              onPress={() => Linking.openURL(viewer.url).catch(() => {})}
            >
              <Text style={styles.extBtnText}>{t.openExternal}</Text>
            </TouchableOpacity>
          )}
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  addBtn: { backgroundColor: '#2E7D32', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6 },
  addBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 11 },
  searchRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', margin: 10, marginBottom: 0, paddingHorizontal: 10, paddingVertical: 7, borderRadius: 8, borderWidth: 1, borderColor: '#DDD' },
  searchInput: { flex: 1, fontSize: 13, color: '#333' },
  chipRow: { flexDirection: 'row', paddingHorizontal: 12, paddingVertical: 8 },
  segBtn: { flex: 1, paddingVertical: 7, borderRadius: 16, alignItems: 'center', marginHorizontal: 3, backgroundColor: '#F0F0F0' },
  segBtnActive: { backgroundColor: '#D32F2F' },
  segText: { fontSize: 12, fontWeight: 'bold', color: '#666' },
  segTextActive: { color: '#FFF' },
  playingLine: { borderColor: '#7B1FA2', borderWidth: 2, backgroundColor: '#F9F1FF' },
  lineJA: { fontSize: 15, fontWeight: 'bold', color: '#222', lineHeight: 23 },
  lineReading: { fontSize: 12, color: '#888', marginTop: 2 },
  lineMM: { fontSize: 13, color: '#333', marginTop: 5, lineHeight: 19 },
  nowBadge: { position: 'absolute', top: 8, right: 10, fontSize: 16 },
  chipRow2: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 2 },
  chip: { paddingHorizontal: 12, paddingVertical: 5, borderWidth: 1, borderColor: '#DDD', borderRadius: 14, marginRight: 6, marginBottom: 6, backgroundColor: '#FFF' },
  chipActive: { backgroundColor: '#D32F2F', borderColor: '#D32F2F' },
  chipText: { fontSize: 11, color: '#555', fontWeight: 'bold' },
  chipTextActive: { color: '#FFF' },
  empty: { textAlign: 'center', color: '#999', marginTop: 40, fontSize: 12 },
  card: { backgroundColor: '#FFF', borderRadius: 10, padding: 12, marginBottom: 10, elevation: 1, borderWidth: 1, borderColor: '#EEE' },
  cardTitle: { fontSize: 14, fontWeight: 'bold', color: '#333' },
  cardDesc: { fontSize: 12, color: '#666', marginTop: 2, lineHeight: 17 },
  badge: { backgroundColor: '#FFEBEE', paddingHorizontal: 6, paddingVertical: 1, borderRadius: 4 },
  badgeText: { color: '#D32F2F', fontSize: 10, fontWeight: 'bold' },
  openBtn: { backgroundColor: '#1976D2', borderRadius: 8, paddingVertical: 9, alignItems: 'center' },
  openBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 12 },
  miniUpBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 7, alignItems: 'center' },
  miniUpText: { color: '#FFF', fontWeight: 'bold', fontSize: 11 },
  miniBtn: { backgroundColor: '#F0F0F0', borderRadius: 8, paddingHorizontal: 10, justifyContent: 'center' },
  modalOverlay: { flex: 1, justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.55)', padding: 18 },
  modalContent: { backgroundColor: '#FFF', borderRadius: 12, padding: 18, maxHeight: '90%' },
  modalTitle: { fontSize: 15, fontWeight: 'bold', textAlign: 'center', marginBottom: 10 },
  label: { fontSize: 12, fontWeight: '600', color: '#555', marginBottom: 4, marginTop: 8 },
  input: { borderWidth: 1, borderColor: '#DDD', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, fontSize: 13, backgroundColor: '#FAFAFA' },
  help: { fontSize: 10, color: '#888', marginTop: 6, lineHeight: 15 },
  modalActionRow: { flexDirection: 'row', marginTop: 14 },
  cancelBtn: { flex: 1, paddingVertical: 9, backgroundColor: '#E0E0E0', borderRadius: 8, alignItems: 'center', marginRight: 6 },
  cancelBtnText: { color: '#333', fontWeight: 'bold', fontSize: 12 },
  saveBtn: { flex: 1, paddingVertical: 9, backgroundColor: '#2E7D32', borderRadius: 8, alignItems: 'center', marginLeft: 6 },
  saveBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 12 },
  viewerBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#111', paddingHorizontal: 12, paddingVertical: 10 },
  viewerTitle: { flex: 1, color: '#FFF', fontSize: 13, fontWeight: 'bold' },
  viewerClose: { backgroundColor: '#D32F2F', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 14, marginLeft: 8 },
  viewerCloseText: { color: '#FFF', fontWeight: 'bold', fontSize: 12 },
  extBtn: { backgroundColor: '#1976D2', paddingVertical: 10, alignItems: 'center' },
  extBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 12 },
});

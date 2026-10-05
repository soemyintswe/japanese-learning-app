// CommunityScreen — 👥 People | 💬 Chats | 🙍 My Profile | 📊 Reports(admin)
// Presence: src/presence.js heartbeat. Rules: firestore.rules (chats/*), storage.rules (avatars).
import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, FlatList, TouchableOpacity, Modal, Alert, Image, Platform, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { collection, query, where, getDocs, getDoc, addDoc, setDoc, updateDoc, deleteDoc, doc, onSnapshot, orderBy } from 'firebase/firestore';
import * as ImagePicker from 'expo-image-picker';
import { db } from '../src/firebase';
import { useLanguage } from '../src/LanguageContext';
import AppHeader from './AppHeader';
import { presenceOf } from '../src/presence';
import { useDriveBackup } from '../src/driveBackup';

const ADMIN_EMAIL = 'soemyintswe@gmail.com';

const cT = {
  my: {
    title: '👥 အဖွဲ့', segPeople: '👥 လူများ', segChats: '💬 Chat', segProfile: '🙍 ပရိုဖိုင်', segReports: '📊 Report',
    searchPh: 'နာမည် / Email ရှာရန်...',
    stActive: 'Active', stIdle: 'Idle', stOffline: 'Offline',
    activeNow: 'အခု Active', totalUsers: 'စုစုပေါင်း',
    chatWith: '💬 Chat ပြောမယ်', startChat: 'Chat စမည်', newGroup: '➕ Group အသစ်',
    groupName: 'Group နာမည်:', groupNamePh: 'ဥပမာ - N5 Batch A',
    pickMembers: 'အဖွဲ့ဝင်ရွေးပါ:', create: 'ဖန်တီးမည်', cancel: 'ပယ်ဖျက်မည်',
    errGroupName: 'Group နာမည် + အဖွဲ့ဝင် ၁ ယောက်အနည်းဆုံး ရွေးပါ။',
    noChats: 'Chat မရှိသေးပါ — လူစာရင်းက 💬 နှိပ်ပြီး စပြောပါ။',
    typeMsg: 'စာရိုက်ပါ...', send: '➤', deleteChat: 'Group ဖျက်မယ်',
    delChatQ: 'ဒီ chat ကို ဖျက်ရန် သေချာလား?', no: 'မလုပ်ပါ', yes: 'ဖျက်မည်',
    privateTag: '🔒 Private', privateNote: 'ဒီ profile ကို ပိုင်ရှင်က ပိတ်ထားပါတယ် (private)။',
    meTag: '(ကိုယ်)',
    fName: 'အမည်:', fPhone: 'ဖုန်း:', fBirth: 'မွေးနေ့ (YYYY-MM-DD):', fGender: 'ကျား/မ:',
    fEdu: 'ပညာအရည်အချင်း:', fJlpt: 'ဂျပန်အဆင့် (ကိုယ်ပြော):', fTested: 'စစ်ထားတဲ့အဆင့် (Quiz):',
    fBio: 'ကိုယ်ရေးအကျဉ်း (Bio):', fBioPh: 'ကိုယ့်အကြောင်း အကျဉ်းရေး...',
    fPublic: 'လူတိုင်းမြင်နိုင် (Public profile)', save: 'သိမ်းဆည်းမည်', saved: 'သိမ်းပြီးပါပြီ ✅',
    errBirth: 'မွေးနေ့ ပုံစံမှားနေပါတယ် (ဥပမာ 2000-05-12)။',
    genders: { '': '—', male: 'ကျား', female: 'မ', other: 'အခြား' },
    edus: { '': '—', 'high-school': 'အထက်တန်း', bachelor: 'ဘွဲ့', master: 'မဟာဘွဲ့', phd: 'ပါရဂူဘွဲ့', other: 'အခြား' },
    photo: 'Profile ပုံ:', pickPhoto: '📷 ပုံရွေးမယ်', uploading: 'တင်နေပါတယ်...',
    rPresence: 'အခြေအနေ', rRole: 'Role', rGender: 'ကျား/မ', rAge: 'အသက်အရွယ်', rEdu: 'ပညာအရည်အချင်း',
    rJlpt: 'ဂျပန် (ကိုယ်ပြော)', rTested: 'ဂျပန် (စစ်ပြီး)', ageNA: 'မသိ',
    driveTitle: '☁️ Google Drive Backup (ကိုယ့် Drive)',
    driveHelp: 'ကိုယ့် Drive appDataFolder (hidden) ထဲ သိမ်းမယ် — device ပြောင်းရင် Restore ပြန်လုပ်',
    driveSetup: 'Admin setup လိုသေးတယ်: Google Cloud OAuth Client ID (.env) + tester email (HANDOVER ကြည့်)',
    driveConnect: '🔗 Drive ချိတ်မယ်', driveDisconnect: 'ဖြတ်မယ်',
    driveBackup: '☁️ Backup လုပ်မည်', driveRestore: '⬇️ Restore ပြန်ယူမည်',
    driveLast: 'နောက်ဆုံး backup:', driveNone: 'မရှိသေးပါ',
    driveConnected: 'ချိတ်ထားပြီး ✅', driveNotConnected: 'မချိတ်ရသေးပါ',
    driveBackedOk: 'Backup ပြီးပါပြီ ✅', driveRestoredOk: 'Restore ပြီးပါပြီ ✅ — App ပိတ်/ဖွင့်ပြီး စစ်ပါ',
    driveConfirm: 'ဖုန်းထဲက လက်ရှိဒေတာ အကုန် backup ထဲကအတိုင်း အစားထိုးမယ် — သေချာလား?',
    driveNeedAuth: 'Drive အရင်ချိတ်ပါ 🔗', driveExpired: 'Session ကုန်သွားပြီ — ပြန်ချိတ်ပါ 🔗',
    driveEmpty: 'Drive မှာ backup မရှိသေးပါ။', driveErr: 'Drive error',
  },
  en: {
    title: '👥 Community', segPeople: '👥 People', segChats: '💬 Chats', segProfile: '🙍 Profile', segReports: '📊 Reports',
    searchPh: 'Search name / email...',
    stActive: 'Active', stIdle: 'Idle', stOffline: 'Offline',
    activeNow: 'Active now', totalUsers: 'Total users',
    chatWith: '💬 Chat', startChat: 'Start chat', newGroup: '➕ New group',
    groupName: 'Group name:', groupNamePh: 'e.g. N5 Batch A',
    pickMembers: 'Pick members:', create: 'Create', cancel: 'Cancel',
    errGroupName: 'Group name + at least 1 member required.',
    noChats: 'No chats yet — tap 💬 on someone to start.',
    typeMsg: 'Type a message...', send: '➤', deleteChat: 'Delete group',
    delChatQ: 'Delete this chat?', no: 'No', yes: 'Delete',
    privateTag: '🔒 Private', privateNote: 'This profile is private.',
    meTag: '(you)',
    fName: 'Name:', fPhone: 'Phone:', fBirth: 'Birthdate (YYYY-MM-DD):', fGender: 'Gender:',
    fEdu: 'Education:', fJlpt: 'Japanese (self):', fTested: 'Tested level (Quiz):',
    fBio: 'Bio:', fBioPh: 'Write about yourself...',
    fPublic: 'Public profile (everyone can see)', save: 'Save', saved: 'Saved ✅',
    errBirth: 'Bad birthdate format (e.g. 2000-05-12).',
    genders: { '': '—', male: 'Male', female: 'Female', other: 'Other' },
    edus: { '': '—', 'high-school': 'High school', bachelor: "Bachelor's", master: "Master's", phd: 'PhD', other: 'Other' },
    photo: 'Photo:', pickPhoto: '📷 Pick photo', uploading: 'Uploading...',
    rPresence: 'Status', rRole: 'Role', rGender: 'Gender', rAge: 'Age', rEdu: 'Education',
    rJlpt: 'Japanese (self)', rTested: 'Japanese (tested)', ageNA: 'Unknown',
    driveTitle: '☁️ Google Drive Backup (my Drive)',
    driveHelp: 'Saves to your Drive appDataFolder (hidden) — restore on new device',
    driveSetup: 'Admin setup needed: Google Cloud OAuth Client ID (.env) + tester email (see HANDOVER)',
    driveConnect: '🔗 Connect Drive', driveDisconnect: 'Disconnect',
    driveBackup: '☁️ Backup now', driveRestore: '⬇️ Restore',
    driveLast: 'Last backup:', driveNone: 'none yet',
    driveConnected: 'Connected ✅', driveNotConnected: 'Not connected',
    driveBackedOk: 'Backup done ✅', driveRestoredOk: 'Restore done ✅ — restart the app',
    driveConfirm: 'Replace all on-device data with the backup? Sure?',
    driveNeedAuth: 'Connect Drive first 🔗', driveExpired: 'Session expired — reconnect 🔗',
    driveEmpty: 'No backup in Drive yet.', driveErr: 'Drive error',
  },
  jp: {
    title: '👥 コミュニティ', segPeople: '👥 仲間', segChats: '💬 チャット', segProfile: '🙍 プロフィール', segReports: '📊 レポート',
    searchPh: '名前・Email検索...',
    stActive: 'オンライン', stIdle: '離席中', stOffline: 'オフライン',
    activeNow: 'オンライン中', totalUsers: '総ユーザー',
    chatWith: '💬 チャット', startChat: '開始', newGroup: '➕ 新規グループ',
    groupName: 'グループ名:', groupNamePh: '例 - N5 Batch A',
    pickMembers: 'メンバー選択:', create: '作成', cancel: 'キャンセル',
    errGroupName: 'グループ名＋1人以上が必要。',
    noChats: 'チャットなし — 💬で開始。',
    typeMsg: 'メッセージ...', send: '➤', deleteChat: 'グループ削除',
    delChatQ: '削除しますか？', no: 'いいえ', yes: '削除',
    privateTag: '🔒 非公開', privateNote: '非公開プロフィールです。',
    meTag: '（あなた）',
    fName: '名前:', fPhone: '電話:', fBirth: '生年月日 (YYYY-MM-DD):', fGender: '性別:',
    fEdu: '学歴:', fJlpt: '日本語（自己申告）:', fTested: '測定レベル:',
    fBio: '自己紹介:', fBioPh: '自己紹介を書く...',
    fPublic: '公開プロフィール', save: '保存', saved: '保存 ✅',
    errBirth: '生年月日の形式が違います。',
    genders: { '': '—', male: '男性', female: '女性', other: 'その他' },
    edus: { '': '—', 'high-school': '高校', bachelor: '学士', master: '修士', phd: '博士', other: 'その他' },
    photo: '写真:', pickPhoto: '📷 選択', uploading: '送信中...',
    rPresence: '状態', rRole: 'ロール', rGender: '性別', rAge: '年齢', rEdu: '学歴',
    rJlpt: '日本語（自己）', rTested: '日本語（測定）', ageNA: '不明',
    driveTitle: '☁️ Googleドライブ backup',
    driveHelp: 'DriveのappDataFolder（非表示）に保存 — 機種変更時に復元',
    driveSetup: '管理者設定が必要: OAuth Client ID (.env)',
    driveConnect: '🔗 接続', driveDisconnect: '切断',
    driveBackup: '☁️ backup', driveRestore: '⬇️ 復元',
    driveLast: '最終:', driveNone: 'なし',
    driveConnected: '接続中 ✅', driveNotConnected: '未接続',
    driveBackedOk: '完了 ✅', driveRestoredOk: '復元 ✅ — アプリ再起動',
    driveConfirm: '上書きしますか？',
    driveNeedAuth: '先に接続 🔗', driveExpired: '期限切れ — 再接続 🔗',
    driveEmpty: 'backupなし。', driveErr: 'エラー',
  },
};

const DOT = { active: '#2E7D32', idle: '#F9A825', offline: '#BDBDBD' };

function ageOf(bd) {
  if (!bd || !/^\d{4}-\d{2}-\d{2}$/.test(bd)) return null;
  const age = new Date().getFullYear() - parseInt(bd.slice(0, 4), 10);
  return age >= 5 && age <= 120 ? age : null;
}
function ageGroup(age) {
  if (age == null) return null;
  if (age < 18) return '<18';
  if (age <= 24) return '18–24';
  if (age <= 34) return '25–34';
  return '35+';
}
function fmtTime(iso) {
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '';
    return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  } catch (e) { return ''; }
}

export default function CommunityScreen({ user, onLogout, navigation }) {
  const { lang } = useLanguage();
  const t = cT[lang] || cT.my;
  const isAdmin = (user?.email || '').toLowerCase() === ADMIN_EMAIL.toLowerCase() || user?.role === 'admin';

  const [seg, setSeg] = useState('people');
  const [users, setUsers] = useState([]);
  const [q, setQ] = useState('');
  const [now, setNow] = useState(Date.now());

  // chats
  const [chats, setChats] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [msgs, setMsgs] = useState([]);
  const [msgInput, setMsgInput] = useState('');
  const [groupModal, setGroupModal] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [groupPick, setGroupPick] = useState([]);

  // profile form
  const [pf, setPf] = useState({ name: '', phone: '', birthdate: '', gender: '', education: '', jlpt: '', bio: '', photoURL: null, isPublic: true, testedLevel: '' });
  const [uploading, setUploading] = useState(false);

  // profile view modal (other user)
  const [viewUser, setViewUser] = useState(null);

  // Google Drive backup (my Drive)
  const drive = useDriveBackup(user);

  const onBackup = async () => {
    const r = await drive.backupNow();
    if (r.needAuth) {
      try {
        await drive.connect();
      } catch (e) {
        Alert.alert('⚠️', String(e.message || e));
      }
      return;
    }
    if (r.expired) {
      Alert.alert('⚠️', t.driveExpired);
      return;
    }
    if (r.ok) Alert.alert('✅', t.driveBackedOk);
    else Alert.alert('⚠️', `${t.driveErr} (${r.error || 'unknown'})`);
  };

  const onRestore = async () => {
    const f = await drive.fetchLatest();
    if (f.expired) {
      Alert.alert('⚠️', t.driveExpired);
      return;
    }
    if (f.empty) {
      Alert.alert('ℹ️', t.driveEmpty);
      return;
    }
    if (!f.ok) {
      Alert.alert('⚠️', `${t.driveErr} (${f.error || 'unknown'})`);
      return;
    }
    Alert.alert(t.driveRestore, `${f.file.name}\n${f.file.modifiedTime || ''}\n\n${t.driveConfirm}`, [
      { text: t.no, style: 'cancel' },
      {
        text: t.yes, style: 'destructive', onPress: async () => {
          const r = await drive.restoreNow(f.backup);
          if (r.ok) Alert.alert('✅', `${t.driveRestoredOk} (${r.count})`);
          else Alert.alert('⚠️', `${t.driveErr} (${r.error || 'unknown'})`);
        }
      }
    ]);
  };

  // live clock for presence counts (60s)
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(timer);
  }, []);

  // users realtime (presence အတွက် auto-refresh)
  useEffect(() => {
    if (!user?.uid) return;
    const unsub = onSnapshot(collection(db, 'users'), (snap) => {
      const arr = [];
      snap.forEach((d) => arr.push({ id: d.id, ...d.data() }));
      setUsers(arr);
    }, () => {});
    return unsub;
  }, [user?.uid]);

  // my chats realtime
  useEffect(() => {
    if (!user?.uid) return;
    const unsub = onSnapshot(
      query(collection(db, 'chats'), where('members', 'array-contains', user.uid)),
      (snap) => {
        const arr = [];
        snap.forEach((d) => arr.push({ id: d.id, ...d.data() }));
        arr.sort((a, b) => String(b.updatedAt || '').localeCompare(String(a.updatedAt || '')));
        setChats(arr);
      }, () => {}
    );
    return unsub;
  }, [user?.uid]);

  // thread messages realtime
  useEffect(() => {
    if (!activeChat) { setMsgs([]); return; }
    const unsub = onSnapshot(
      query(collection(db, 'chats', activeChat.id, 'messages'), orderBy('at', 'asc')),
      (snap) => {
        const arr = [];
        snap.forEach((d) => arr.push({ id: d.id, ...d.data() }));
        setMsgs(arr.slice(-100));
      }, () => {}
    );
    return unsub;
  }, [activeChat && activeChat.id]);

  // my profile form init
  useEffect(() => {
    const me = users.find((u) => u.id === user?.uid);
    if (me) {
      setPf({
        name: me.name || '', phone: me.phone || '', birthdate: me.birthdate || '',
        gender: me.gender || '', education: me.education || '', jlpt: me.jlpt || '',
        bio: me.bio || '', photoURL: me.photoURL || null,
        isPublic: me.isPublic !== false, testedLevel: me.testedLevel || '',
      });
    }
  }, [user?.uid, users.length]);

  const canView = (u) => isAdmin || u.id === user?.uid || u.isPublic !== false;
  const isMe = (u) => u.id === user?.uid;
  const statusOf = (u) => presenceOf(u, now);

  const filteredUsers = users.filter((u) => {
    const s = q.trim().toLowerCase();
    if (!s) return true;
    return (u.name || '').toLowerCase().includes(s) || (u.email || '').toLowerCase().includes(s);
  });

  const counts = { active: 0, idle: 0, offline: 0 };
  users.forEach((u) => { counts[statusOf(u)] += 1; });

  // ---------- DM / group ----------
  const openDM = async (other) => {
    if (other.id === user.uid) return;
    const ids = [user.uid, other.id].sort();
    const chatId = 'dm_' + ids[0] + '_' + ids[1];
    try {
      const snap = await getDoc(doc(db, 'chats', chatId));
      if (!snap.exists()) {
        await setDoc(doc(db, 'chats', chatId), {
          type: 'direct',
          members: ids,
          memberNames: { [user.uid]: user.name || '', [other.id]: other.name || '' },
          updatedAt: new Date().toISOString(),
          createdBy: user.uid,
          createdAt: new Date().toISOString(),
        });
      }
      setActiveChat({ id: chatId });
      setSeg('chats');
    } catch (e) {
      Alert.alert('⚠️', e.message);
    }
  };

  const createGroup = async () => {
    if (!groupName.trim() || groupPick.length === 0) {
      Alert.alert('⚠️', t.errGroupName);
      return;
    }
    try {
      const members = [...new Set([user.uid, ...groupPick])];
      const names = {};
      members.forEach((id) => {
        const u = users.find((x) => x.id === id);
        names[id] = u ? (u.name || '') : '';
      });
      const ref = await addDoc(collection(db, 'chats'), {
        type: 'group', name: groupName.trim(), members, memberNames: names,
        updatedAt: new Date().toISOString(), createdBy: user.uid, createdAt: new Date().toISOString(),
      });
      setGroupName(''); setGroupPick([]); setGroupModal(false);
      setActiveChat({ id: ref.id });
    } catch (e) {
      Alert.alert('⚠️', e.message);
    }
  };

  const sendMsg = async () => {
    const text = msgInput.trim();
    if (!text || !activeChat) return;
    setMsgInput('');
    try {
      await addDoc(collection(db, 'chats', activeChat.id, 'messages'), {
        text, byUid: user.uid, byName: user.name || '', at: new Date().toISOString(),
      });
      await updateDoc(doc(db, 'chats', activeChat.id), {
        lastMessage: { text: text.slice(0, 80), by: user.name || '', at: new Date().toISOString() },
        updatedAt: new Date().toISOString(),
      });
    } catch (e) {
      Alert.alert('⚠️', e.message);
    }
  };

  const deleteChat = async () => {
    if (!activeChat) return;
    Alert.alert(t.deleteChat, t.delChatQ, [
      { text: t.no, style: 'cancel' },
      {
        text: t.yes, style: 'destructive', onPress: async () => {
          try {
            await deleteDoc(doc(db, 'chats', activeChat.id));
            setActiveChat(null);
          } catch (e) {
            Alert.alert('⚠️', e.message);
          }
        }
      }
    ]);
  };

  // ---------- profile ----------
  const saveProfile = async () => {
    if (pf.birthdate && !/^\d{4}-\d{2}-\d{2}$/.test(pf.birthdate.trim())) {
      Alert.alert('⚠️', t.errBirth);
      return;
    }
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        name: pf.name.trim(), phone: pf.phone.trim(), birthdate: pf.birthdate.trim(),
        gender: pf.gender, education: pf.education, jlpt: pf.jlpt, bio: pf.bio.trim(),
        photoURL: pf.photoURL || null, isPublic: !!pf.isPublic,
      });
      Alert.alert('✅', t.saved);
    } catch (e) {
      Alert.alert('⚠️', e.message);
    }
  };

  // Avatar: Firebase Storage (Blaze/paid လိုတယ်) မသုံးဘဲ
  // ပုံကို compress + base64 လုပ်ပြီး Firestore photoURL ထဲ တိုက်ရိုက်သိမ်းမယ် —
  // Console မှာ ဘာမှ ဖွင့်စရာမလို, အခမဲ့ Spark plan နဲ့ ရတယ်
  const pickPhoto = async () => {
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        Alert.alert('⚠️', '📷');
        return;
      }
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true, aspect: [1, 1], quality: 0.4, base64: true,
      });
      if (res.canceled || !res.assets || !res.assets[0] || !res.assets[0].base64) return;
      const dataUrl = `data:image/jpeg;base64,${res.assets[0].base64}`;
      if (dataUrl.length > 700000) {
        Alert.alert('⚠️', 'ပုံကြီးလွန်းပါတယ် — ပိုသေးတဲ့ပုံ ရွေးပေးပါ။');
        return;
      }
      setUploading(true);
      await updateDoc(doc(db, 'users', user.uid), { photoURL: dataUrl });
      setPf({ ...pf, photoURL: dataUrl });
      Alert.alert('✅', t.saved);
    } catch (e) {
      Alert.alert('⚠️', e.message);
    } finally {
      setUploading(false);
    }
  };

  const avatarOf = (u, size) => {
    const s = size || 40;
    if (u.photoURL) return <Image source={{ uri: u.photoURL }} style={{ width: s, height: s, borderRadius: s / 2, backgroundColor: '#EEE' }} />;
    const ch = ((u.name || 'U').trim().charAt(0) || 'U').toUpperCase();
    return (
      <View style={{ width: s, height: s, borderRadius: s / 2, backgroundColor: '#D32F2F', justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: '#FFF', fontWeight: 'bold', fontSize: s * 0.45 }}>{ch}</Text>
      </View>
    );
  };

  // ---------- reports ----------
  const tally = (fn) => {
    const m = {};
    users.forEach((u) => {
      const k = fn(u);
      if (k == null || k === '') return;
      m[k] = (m[k] || 0) + 1;
    });
    return m;
  };
  const Bar = ({ label, n, max }) => (
    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
      <Text style={{ width: 110, fontSize: 12, color: '#333' }}>{label}</Text>
      <View style={{ flex: 1, height: 14, backgroundColor: '#EEE', borderRadius: 7, marginRight: 8 }}>
        <View style={{ width: `${max ? Math.round((n / max) * 100) : 0}%`, height: 14, backgroundColor: '#D32F2F', borderRadius: 7 }} />
      </View>
      <Text style={{ width: 30, fontSize: 12, fontWeight: 'bold', textAlign: 'right' }}>{n}</Text>
    </View>
  );
  const renderReports = () => {
    const genders = tally((u) => t.genders[u.gender] || null);
    const ages = tally((u) => ageGroup(ageOf(u.birthdate)));
    const edus = tally((u) => t.edus[u.education] || null);
    const jlpts = tally((u) => u.jlpt || null);
    const tested = tally((u) => u.testedLevel || null);
    const roles = tally((u) => (u.role || 'student').toUpperCase());
    const blocks = [
      [t.rGender, genders], [t.rAge, ages], [t.rEdu, edus],
      [t.rJlpt, jlpts], [t.rTested, tested], [t.rRole, roles],
    ];
    return (
      <ScrollView contentContainerStyle={{ padding: 12 }}>
        <View style={{ flexDirection: 'row', marginBottom: 12 }}>
          {[['🟢', t.stActive, counts.active, '#E8F5E9'], ['🟡', t.stIdle, counts.idle, '#FFF8E1'], ['⚪', t.stOffline, counts.offline, '#F5F5F5']].map(([e, label, n, bg]) => (
            <View key={label} style={{ flex: 1, backgroundColor: bg, borderRadius: 10, padding: 12, marginHorizontal: 3, alignItems: 'center' }}>
              <Text style={{ fontSize: 22 }}>{e}</Text>
              <Text style={{ fontSize: 20, fontWeight: 'bold' }}>{n}</Text>
              <Text style={{ fontSize: 11, color: '#666' }}>{label}</Text>
            </View>
          ))}
        </View>
        <View style={{ backgroundColor: '#D32F2F', borderRadius: 10, padding: 14, marginBottom: 12, alignItems: 'center' }}>
          <Text style={{ color: '#FFF', fontSize: 13 }}>{t.activeNow}</Text>
          <Text style={{ color: '#FFF', fontSize: 32, fontWeight: 'bold' }}>{counts.active}</Text>
          <Text style={{ color: '#FFCDD2', fontSize: 11 }}>{t.totalUsers}: {users.length}</Text>
        </View>
        {blocks.map(([title, m]) => {
          const keys = Object.keys(m);
          if (keys.length === 0) return null;
          const max = Math.max(...keys.map((k) => m[k]));
          return (
            <View key={title} style={{ backgroundColor: '#FFF', borderRadius: 10, padding: 12, marginBottom: 10 }}>
              <Text style={{ fontSize: 13, fontWeight: 'bold', marginBottom: 8 }}>{title}</Text>
              {keys.map((k) => <Bar key={k} label={k} n={m[k]} max={max} />)}
            </View>
          );
        })}
      </ScrollView>
    );
  };

  const chatTitleOf = (c) => {
    if (c.type === 'group') return c.name || 'Group';
    const otherId = (c.members || []).find((m) => m !== user.uid);
    const u = users.find((x) => x.id === otherId);
    return (c.memberNames && c.memberNames[otherId]) || (u && u.name) || 'Chat';
  };

  return (
    <SafeAreaView style={styles.container}>
      <AppHeader title={t.title} user={user} onLogout={onLogout} />

      {/* segment */}
      <View style={styles.segRow}>
        {[
          { k: 'people', label: t.segPeople },
          { k: 'chats', label: t.segChats },
          { k: 'profile', label: t.segProfile },
        ].concat(isAdmin ? [{ k: 'reports', label: t.segReports }] : []).map((s) => (
          <TouchableOpacity key={s.k} style={[styles.segBtn, seg === s.k && styles.segBtnActive]} onPress={() => setSeg(s.k)}>
            <Text style={[styles.segText, seg === s.k && styles.segTextActive]}>{s.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {seg === 'people' && (
        <View style={{ flex: 1 }}>
          <View style={styles.searchRow}>
            <Text style={{ fontSize: 16, marginRight: 6 }}>🔍</Text>
            <TextInput style={styles.searchInput} placeholder={t.searchPh} placeholderTextColor="#999" value={q} onChangeText={setQ} />
            <Text style={styles.countText}>{counts.active}🟢 {t.totalUsers} {users.length}</Text>
          </View>
          <FlatList
            data={filteredUsers}
            keyExtractor={(u) => u.id}
            contentContainerStyle={{ padding: 12 }}
            renderItem={({ item: u }) => {
              const st = statusOf(u);
              const pub = u.isPublic !== false;
              return (
                <TouchableOpacity style={styles.userRow} onPress={() => setViewUser(u)}>
                  {avatarOf(u, 42)}
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <View style={[styles.dot, { backgroundColor: DOT[st] }]} />
                      <Text style={styles.userName} numberOfLines={1}>
                        {u.name || 'No Name'}{isMe(u) ? t.meTag : ''}{!pub && !isMe(u) && !isAdmin ? ` ${t.privateTag}` : ''}
                      </Text>
                    </View>
                    <Text style={styles.userSub} numberOfLines={1}>
                      {(u.role || 'student').toUpperCase()} • {(u.jlpt || u.testedLevel || '—')}
                      {u.testedLevel ? ` ✓` : ''} • {t['st' + st.charAt(0).toUpperCase() + st.slice(1)]}
                    </Text>
                  </View>
                  {!isMe(u) && (
                    <TouchableOpacity style={styles.chatBtn} onPress={() => openDM(u)}>
                      <Text style={styles.chatBtnText}>💬</Text>
                    </TouchableOpacity>
                  )}
                </TouchableOpacity>
              );
            }}
          />
        </View>
      )}

      {seg === 'chats' && !activeChat && (
        <View style={{ flex: 1 }}>
          <TouchableOpacity style={styles.newGroupBtn} onPress={() => { setGroupPick([]); setGroupName(''); setGroupModal(true); }}>
            <Text style={styles.newGroupText}>{t.newGroup}</Text>
          </TouchableOpacity>
          {chats.length === 0 ? (
            <Text style={styles.emptyText}>{t.noChats}</Text>
          ) : (
            <FlatList
              data={chats}
              keyExtractor={(c) => c.id}
              contentContainerStyle={{ padding: 12 }}
              renderItem={({ item: c }) => (
                <TouchableOpacity style={styles.userRow} onPress={() => setActiveChat(c)}>
                  <Text style={{ fontSize: 30 }}>{c.type === 'group' ? '👥' : '👤'}</Text>
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <Text style={styles.userName} numberOfLines={1}>{chatTitleOf(c)}</Text>
                    <Text style={styles.userSub} numberOfLines={1}>
                      {c.lastMessage ? `${c.lastMessage.by}: ${c.lastMessage.text}` : ''}
                    </Text>
                  </View>
                  <Text style={{ fontSize: 10, color: '#999' }}>{fmtTime(c.updatedAt)}</Text>
                </TouchableOpacity>
              )}
            />
          )}
        </View>
      )}

      {seg === 'chats' && !!activeChat && (
        <View style={{ flex: 1 }}>
          <View style={styles.threadHeader}>
            <TouchableOpacity onPress={() => setActiveChat(null)} style={styles.backBtn}>
              <Text style={styles.backBtnText}>←</Text>
            </TouchableOpacity>
            <Text style={[styles.userName, { flex: 1 }]} numberOfLines={1}>
              {chatTitleOf(chats.find((c) => c.id === activeChat.id) || activeChat)}
            </Text>
            <TouchableOpacity onPress={deleteChat} style={{ padding: 6 }}>
              <Text style={{ fontSize: 16 }}>🗑️</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={msgs}
            keyExtractor={(m) => m.id}
            contentContainerStyle={{ padding: 12 }}
            renderItem={({ item: m }) => {
              const mine = m.byUid === user.uid;
              return (
                <View style={[styles.msg, mine ? styles.msgMine : styles.msgTheir]}>
                  {!mine && <Text style={styles.msgName}>{m.byName}</Text>}
                  <Text style={[styles.msgText, mine && { color: '#FFF' }]}>{m.text}</Text>
                  <Text style={[styles.msgTime, mine && { color: '#BBDEFB' }]}>{fmtTime(m.at)}</Text>
                </View>
              );
            }}
          />
          <View style={styles.inputRow}>
            <TextInput
              style={styles.msgInput}
              value={msgInput}
              onChangeText={setMsgInput}
              placeholder={t.typeMsg}
              placeholderTextColor="#999"
              returnKeyType="send"
              onSubmitEditing={sendMsg}
            />
            <TouchableOpacity style={styles.sendBtn} onPress={sendMsg}>
              <Text style={{ fontSize: 18, color: '#FFF' }}>{t.send}</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {seg === 'profile' && (
        <ScrollView contentContainerStyle={{ padding: 14 }}>
          <View style={{ alignItems: 'center', marginBottom: 12 }}>
            {avatarOf({ name: pf.name, photoURL: pf.photoURL }, 80)}
            <TouchableOpacity style={[styles.smallBtn, { marginTop: 8 }]} onPress={pickPhoto} disabled={uploading}>
              <Text style={styles.smallBtnText}>{uploading ? t.uploading : t.pickPhoto}</Text>
            </TouchableOpacity>
            {!!user?.email && <Text style={{ fontSize: 11, color: '#888', marginTop: 6 }}>{user.email}</Text>}
          </View>

          <Text style={styles.label}>{t.fName}</Text>
          <TextInput style={styles.input} value={pf.name} onChangeText={(v) => setPf({ ...pf, name: v })} placeholder="Mg Mg" placeholderTextColor="#999" />

          <Text style={styles.label}>{t.fPhone}</Text>
          <TextInput style={styles.input} value={pf.phone} onChangeText={(v) => setPf({ ...pf, phone: v })} placeholder="09xxxxxxxxx" placeholderTextColor="#999" keyboardType="phone-pad" />

          <Text style={styles.label}>{t.fBirth}</Text>
          <TextInput style={styles.input} value={pf.birthdate} onChangeText={(v) => setPf({ ...pf, birthdate: v })} placeholder="2000-05-12" placeholderTextColor="#999" />

          <Text style={styles.label}>{t.fGender}</Text>
          <View style={styles.chipRow}>
            {['male', 'female', 'other'].map((g) => (
              <TouchableOpacity key={g} style={[styles.chip, pf.gender === g && styles.chipActive]} onPress={() => setPf({ ...pf, gender: g })}>
                <Text style={[styles.chipText, pf.gender === g && styles.chipTextActive]}>{t.genders[g]}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>{t.fEdu}</Text>
          <View style={styles.chipRow}>
            {['high-school', 'bachelor', 'master', 'phd', 'other'].map((e) => (
              <TouchableOpacity key={e} style={[styles.chip, pf.education === e && styles.chipActive]} onPress={() => setPf({ ...pf, education: e })}>
                <Text style={[styles.chipText, pf.education === e && styles.chipTextActive]}>{t.edus[e]}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>{t.fJlpt}</Text>
          <View style={styles.chipRow}>
            {['N5', 'N4', 'N3', 'N2', 'N1'].map((l) => (
              <TouchableOpacity key={l} style={[styles.chip, pf.jlpt === l && styles.chipActive]} onPress={() => setPf({ ...pf, jlpt: l })}>
                <Text style={[styles.chipText, pf.jlpt === l && styles.chipTextActive]}>{l}</Text>
              </TouchableOpacity>
            ))}
          </View>
          {!!pf.testedLevel && (
            <Text style={{ fontSize: 11, color: '#2E7D32', marginTop: 4 }}>{t.fTested} {pf.testedLevel} ✓</Text>
          )}

          <Text style={styles.label}>{t.fBio}</Text>
          <TextInput
            style={[styles.input, { height: 90, textAlignVertical: 'top' }]}
            value={pf.bio} onChangeText={(v) => setPf({ ...pf, bio: v })}
            placeholder={t.fBioPh} placeholderTextColor="#999" multiline={true}
          />

          <TouchableOpacity style={styles.toggleRow} onPress={() => setPf({ ...pf, isPublic: !pf.isPublic })}>
            <Text style={{ fontSize: 20 }}>{pf.isPublic ? '✅' : '⬜'}</Text>
            <Text style={{ marginLeft: 8, fontSize: 12, color: '#333', fontWeight: '600' }}>{t.fPublic}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.saveBtn} onPress={saveProfile}>
            <Text style={styles.saveBtnText}>{t.save}</Text>
          </TouchableOpacity>

          {/* Google Drive backup/restore */}
          <View style={{ backgroundColor: '#FFF', borderWidth: 1, borderColor: '#DDD', borderRadius: 8, padding: 12, marginTop: 18 }}>
            <Text style={{ fontSize: 13, fontWeight: 'bold', color: '#333', marginBottom: 4 }}>{t.driveTitle}</Text>
            <Text style={{ fontSize: 11, color: '#666', marginBottom: 8, lineHeight: 16 }}>{t.driveHelp}</Text>
            {!drive.configured ? (
              <Text style={{ fontSize: 11, color: '#C62828', lineHeight: 16 }}>{t.driveSetup}</Text>
            ) : (
              <>
                <Text style={{ fontSize: 11, color: '#666', marginBottom: 8 }}>
                  {drive.connected ? t.driveConnected : t.driveNotConnected}
                  {drive.lastBackup ? ` · ${t.driveLast} ${drive.lastBackup.name}` : ` · ${t.driveLast} ${t.driveNone}`}
                </Text>
                <View style={{ flexDirection: 'row', alignSelf: 'stretch' }}>
                  {!drive.connected ? (
                    <TouchableOpacity style={[styles.smallBtn, { flex: 1, alignItems: 'center' }]} onPress={() => drive.connect().catch((e) => Alert.alert('⚠️', String(e.message || e)))} disabled={drive.busy}>
                      <Text style={styles.smallBtnText}>{t.driveConnect}</Text>
                    </TouchableOpacity>
                  ) : (
                    <>
                      <TouchableOpacity style={[styles.smallBtn, { flex: 1, backgroundColor: '#2E7D32' }]} onPress={onBackup} disabled={drive.busy}>
                        <Text style={styles.smallBtnText}>{drive.busy ? '…' : t.driveBackup}</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={[styles.smallBtn, { flex: 1, marginLeft: 8, backgroundColor: '#EF6C00' }]} onPress={onRestore} disabled={drive.busy}>
                        <Text style={styles.smallBtnText}>{t.driveRestore}</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={[styles.smallBtn, { marginLeft: 8, backgroundColor: '#9E9E9E' }]} onPress={drive.disconnect} disabled={drive.busy}>
                        <Text style={styles.smallBtnText}>✕</Text>
                      </TouchableOpacity>
                    </>
                  )}
                </View>
              </>
            )}
          </View>
        </ScrollView>
      )}

      {seg === 'reports' && isAdmin && renderReports()}

      {/* view user modal */}
      <Modal visible={!!viewUser} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {!!viewUser && (
              <>
                <View style={{ alignItems: 'center', marginBottom: 10 }}>
                  {avatarOf(viewUser, 64)}
                  <Text style={{ fontSize: 16, fontWeight: 'bold', marginTop: 6 }}>
                    {viewUser.name || 'No Name'}{viewUser.id === user?.uid ? t.meTag : ''}
                  </Text>
                  <Text style={{ fontSize: 11, color: '#888' }}>{viewUser.email || ''}</Text>
                  <Text style={{ fontSize: 11, color: DOT[statusOf(viewUser)], fontWeight: 'bold', marginTop: 2 }}>
                    ● {t['st' + statusOf(viewUser).charAt(0).toUpperCase() + statusOf(viewUser).slice(1)]}
                  </Text>
                </View>
                {canView(viewUser) ? (
                  <>
                    <Text style={styles.bioLine}>🎓 {(viewUser.role || 'student').toUpperCase()} • JLPT: {viewUser.jlpt || '—'}{viewUser.testedLevel ? ` (✓ ${viewUser.testedLevel})` : ''}</Text>
                    {(isAdmin || viewUser.id === user?.uid) && !!viewUser.phone && (
                      <Text style={styles.bioLine}>📞 {viewUser.phone}</Text>
                    )}
                    {(isAdmin || viewUser.id === user?.uid) && !!viewUser.birthdate && (
                      <Text style={styles.bioLine}>🎂 {viewUser.birthdate}{ageOf(viewUser.birthdate) != null ? ` (${ageOf(viewUser.birthdate)})` : ''}</Text>
                    )}
                    {!!viewUser.gender && (
                      <Text style={styles.bioLine}>{viewUser.gender === 'male' ? '👨' : viewUser.gender === 'female' ? '👩' : '🧑'} {t.genders[viewUser.gender] || viewUser.gender}</Text>
                    )}
                    {!!viewUser.education && (
                      <Text style={styles.bioLine}>🏫 {t.edus[viewUser.education] || viewUser.education}</Text>
                    )}
                    {!!viewUser.bio && (
                      <Text style={styles.bioBox}>{viewUser.bio}</Text>
                    )}
                    {viewUser.id !== user?.uid && (
                      <TouchableOpacity
                        style={[styles.saveBtn, { marginTop: 12 }]}
                        onPress={() => { const u = viewUser; setViewUser(null); openDM(u); }}
                      >
                        <Text style={styles.saveBtnText}>{t.chatWith}</Text>
                      </TouchableOpacity>
                    )}
                  </>
                ) : (
                  <Text style={styles.bioLine}>{t.privateTag} — {t.privateNote}</Text>
                )}
                <TouchableOpacity style={[styles.saveBtn, { backgroundColor: '#9E9E9E', marginTop: 10 }]} onPress={() => setViewUser(null)}>
                  <Text style={styles.saveBtnText}>✕</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* new group modal */}
      <Modal visible={groupModal} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{t.newGroup}</Text>
            <Text style={styles.label}>{t.groupName}</Text>
            <TextInput style={styles.input} value={groupName} onChangeText={setGroupName} placeholder={t.groupNamePh} placeholderTextColor="#999" />
            <Text style={styles.label}>{t.pickMembers}</Text>
            <ScrollView style={{ maxHeight: 220 }}>
              {users.filter((u) => u.id !== user?.uid && u.isPublic !== false && (u.status === 'active' || !u.status)).map((u) => {
                const on = groupPick.includes(u.id);
                return (
                  <TouchableOpacity
                    key={u.id}
                    style={[styles.memberRow, on && styles.memberRowOn]}
                    onPress={() => setGroupPick(on ? groupPick.filter((x) => x !== u.id) : [...groupPick, u.id])}
                  >
                    {avatarOf(u, 30)}
                    <Text style={{ marginLeft: 8, flex: 1, fontSize: 13 }}>{u.name || u.email}</Text>
                    <Text style={{ fontSize: 18 }}>{on ? '✅' : '⬜'}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
            <View style={styles.modalActionRow}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setGroupModal(false)}>
                <Text style={styles.cancelBtnText}>{t.cancel}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={createGroup}>
                <Text style={styles.saveBtnText}>{t.create}</Text>
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
  segRow: { flexDirection: 'row', backgroundColor: '#FFF', paddingVertical: 8, paddingHorizontal: 10, borderBottomWidth: 1, borderBottomColor: '#EEE' },
  segBtn: { flex: 1, paddingVertical: 7, borderRadius: 16, alignItems: 'center', marginHorizontal: 2, backgroundColor: '#F0F0F0' },
  segBtnActive: { backgroundColor: '#D32F2F' },
  segText: { fontSize: 11, fontWeight: 'bold', color: '#666' },
  segTextActive: { color: '#FFF' },
  searchRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', margin: 10, marginBottom: 0, paddingHorizontal: 10, paddingVertical: 7, borderRadius: 8, borderWidth: 1, borderColor: '#DDD' },
  searchInput: { flex: 1, fontSize: 13, color: '#333' },
  countText: { fontSize: 10, color: '#666', marginLeft: 6 },
  userRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderRadius: 10, padding: 10, marginBottom: 8, elevation: 1 },
  dot: { width: 9, height: 9, borderRadius: 5, marginRight: 6 },
  userName: { fontSize: 14, fontWeight: 'bold', color: '#333', flexShrink: 1 },
  userSub: { fontSize: 11, color: '#666', marginTop: 2 },
  chatBtn: { backgroundColor: '#E3F2FD', borderRadius: 16, paddingHorizontal: 10, paddingVertical: 6, marginLeft: 8 },
  chatBtnText: { fontSize: 16 },
  newGroupBtn: { backgroundColor: '#2E7D32', borderRadius: 8, padding: 12, margin: 12, marginBottom: 0, alignItems: 'center' },
  newGroupText: { color: '#FFF', fontWeight: 'bold', fontSize: 13 },
  emptyText: { textAlign: 'center', color: '#999', marginTop: 40, fontSize: 12, paddingHorizontal: 30 },
  threadHeader: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', paddingHorizontal: 10, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#EEE' },
  backBtn: { backgroundColor: '#EEE', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6, marginRight: 8 },
  backBtnText: { fontSize: 13, fontWeight: 'bold', color: '#333' },
  msg: { maxWidth: '80%', borderRadius: 10, padding: 8, marginBottom: 6 },
  msgMine: { backgroundColor: '#1976D2', alignSelf: 'flex-end' },
  msgTheir: { backgroundColor: '#FFF', alignSelf: 'flex-start', borderWidth: 1, borderColor: '#EEE' },
  msgName: { fontSize: 10, color: '#888', marginBottom: 2 },
  msgText: { fontSize: 13, color: '#333', lineHeight: 18 },
  msgTime: { fontSize: 9, color: '#999', marginTop: 3, textAlign: 'right' },
  inputRow: { flexDirection: 'row', padding: 10, alignItems: 'center', backgroundColor: '#FFF', borderTopWidth: 1, borderTopColor: '#EEE' },
  msgInput: { flex: 1, borderWidth: 1, borderColor: '#DDD', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8, fontSize: 13, marginRight: 8, backgroundColor: '#FAFAFA' },
  sendBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#D32F2F', justifyContent: 'center', alignItems: 'center' },
  label: { fontSize: 12, fontWeight: '600', color: '#555', marginBottom: 4, marginTop: 10 },
  input: { borderWidth: 1, borderColor: '#DDD', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, fontSize: 13, backgroundColor: '#FFF' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 2 },
  chip: { paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderColor: '#DDD', borderRadius: 14, marginRight: 6, marginBottom: 6, backgroundColor: '#FFF' },
  chipActive: { backgroundColor: '#D32F2F', borderColor: '#D32F2F' },
  chipText: { fontSize: 12, color: '#555' },
  chipTextActive: { color: '#FFF', fontWeight: 'bold' },
  toggleRow: { flexDirection: 'row', alignItems: 'center', marginTop: 14, backgroundColor: '#FFF', borderRadius: 8, padding: 10, borderWidth: 1, borderColor: '#DDD' },
  saveBtn: { backgroundColor: '#D32F2F', paddingVertical: 11, borderRadius: 8, alignItems: 'center', marginTop: 14 },
  saveBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 13 },
  smallBtn: { backgroundColor: '#1976D2', paddingHorizontal: 14, paddingVertical: 7, borderRadius: 8 },
  smallBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 12 },
  modalOverlay: { flex: 1, justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.55)', padding: 18 },
  modalContent: { backgroundColor: '#FFF', borderRadius: 12, padding: 18, maxHeight: '88%' },
  modalTitle: { fontSize: 15, fontWeight: 'bold', textAlign: 'center', marginBottom: 10 },
  bioLine: { fontSize: 13, color: '#333', marginBottom: 6, lineHeight: 18 },
  bioBox: { fontSize: 13, color: '#333', backgroundColor: '#F5F5F5', borderRadius: 8, padding: 10, marginTop: 4, lineHeight: 19 },
  memberRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  memberRowOn: { backgroundColor: '#E8F5E9' },
  modalActionRow: { flexDirection: 'row', marginTop: 14 },
  cancelBtn: { flex: 1, paddingVertical: 9, backgroundColor: '#E0E0E0', borderRadius: 8, alignItems: 'center', marginRight: 6 },
  cancelBtnText: { color: '#333', fontWeight: 'bold', fontSize: 12 },
});

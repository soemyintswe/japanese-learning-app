import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, TextInput, TouchableOpacity, Pressable, Alert, Share, RefreshControl, ActivityIndicator, Modal, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Admin table ထဲက icon ခလုတ်များ —
// Web မှာ mouse တင်ရင် စာတမ်းလေး (tooltip) ပေါ်မယ်၊
// ဖုန်းမှာ ဖိထားရင် (long-press) ရှင်းလင်းချက် ပေါ်မယ်။
function ActionBtn({ emoji, bg, tip, onPress, disabled }) {
  const [hover, setHover] = useState(false);
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      onHoverIn={() => setHover(true)}
      onHoverOut={() => setHover(false)}
      onLongPress={() => Alert.alert('ဒီခလုတ်က ဘာလုပ်တာလဲ?', tip)}
      style={[styles.smallBtn, { backgroundColor: bg, opacity: disabled ? 0.45 : 1 }]}
    >
      <Text style={{ fontSize: 12 }}>{disabled ? '…' : emoji}</Text>
      {hover && Platform.OS === 'web' && (
        <View style={styles.tooltip}>
          <Text style={styles.tooltipText}>{tip}</Text>
        </View>
      )}
    </Pressable>
  );
}

function firestoreErrorMsg(error, actionName) {
  if (error?.code === 'permission-denied' || (error?.message || '').includes('permission')) {
    return actionName + ' မရပါ — Firestore Rules ခွင့်မပြုလို့ပါ。\n\nFirebase Console > Firestore Database > Rules tab မှာ project ထဲက firestore.rules file အတိုင်း ကူးထည့်ပြီး Publish လုပ်ပေးပါ။';
  }
  return actionName + ' မအောင်မြင်ပါ။ (' + (error?.code || error?.message || 'unknown') + ')';
}

// Firebase ချိတ်ဆက်မှု
import { db, auth } from '../src/firebase';
import { collection, getDocs, doc, setDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { updatePassword } from 'firebase/auth';
import { useLanguage } from '../src/LanguageContext';
import AppHeader from './AppHeader';
import ConfirmModal from './ConfirmModal';

const teacherT = {
  my: {
    headerAdmin: '🛡️ Admin Panel & User Management', headerUser: '🎓 ကျောင်းသား/ဆရာ ဧရိယာ',
    adminTitle: '🛡️ ADMIN - User Management', addUser: 'User အသစ်ထည့်မည်',
    sub: 'Register လုပ်ထားသူများကို Approve လုပ်ရန်၊ Role ပြောင်းရန်နှင့် စီမံရန်',
    legend: 'ခလုတ် အဓိပ္ပာယ် — ✅/🔒 = ဖွင့်/ပိတ် (Approve/Disable)\n🔄 = Role ရွေးမယ် (နှိပ်ရင် Student/Teacher/Admin စာရင်း ပေါ်မယ်)\n🗑️ = အကောင့် အပြီးဖျက်\n(Web မှာ ခလုတ်ပေါ် mouse တင်ရင် စာတမ်းပေါ်မယ်၊ ဖုန်းမှာ ဖိထားရင် ရှင်းချက်ပေါ်မယ်)',
    thName: 'အမည် / Email', thRole: 'Role', thStatus: 'Status', thActions: 'Actions',
    empty: 'Firestore တွင် ယခုလက်ရှိ User စာရင်း မရှိသေးပါ။', me: ' (ကိုယ်)',
    statusActive: 'အသုံးပြုခွင့် ဖွင့်ပေးလိုက်ပါပြီ (ACTIVE)။', statusDisabled: 'အသုံးပြုခွင့် ပိတ်လိုက်ပါပြီ (DISABLED)။',
    nonAdminTitle: 'အကောင့် အခြေအနေ', nonAdminBody: 'သင်၏အကောင့်မှာ ကျောင်းသား/ဆရာ အကောင့်ဖြစ်ပါသည်။ Admin လုပ်ဆောင်ချက်များကို ကြည့်ရှုခွင့်မရှိပါ။',
    bioTitle: 'ဆရာ့ ကိုယ်ရေးအကျဉ်းနှင့် အရည်အချင်းများ',
    bioName: 'ဦးစိုးမြင့်ဆွေ (U Soe Myint Swe)',
    bioDegreesV: 'B.Sc (Physics), Dip. in Education, MKS Edu Services Founder',
    bioExpertiseV: 'Japanese Language (JLPT N3/N4/N5), Python Automation, Educational Management',
    bioExpV: '၂၅ နှစ်ကျော် အစိုးရနှင့် ပညာရေးဝန်ဆောင်မှု လုပ်ငန်းအတွေ့အကြုံရှိသူ။',
    bioContactV: 'soemyintswe@gmail.com | Yangon, Myanmar',
    bioDegrees: 'ဘွဲ့/ပညာအရည်အချင်း:', bioExpertise: 'ကျွမ်းကျင်မှု:', bioExp: 'အတွေ့အကြုံ:', bioContact: 'ဆက်သွယ်ရန်:',
    shareTitle: 'App ကို မျှဝေသုံးစွဲရန်', shareSub: 'ဤ Study Planner အက်ပ်ကို အခြားသူများထံ မျှဝေရန် နှိပ်ပါ',
    pwTitle: '🔑 စကားဝှက် ပြင်ဆင်ရန် (Change Password)', oldPw: 'စကားဝှက်ဟောင်း (Old Password):', newPw: 'စကားဝှက်အသစ် (New Password):',
    changeBtn: 'စကားဝှက် ပြောင်းလဲမည်',
    createTitle: '👤 User အသစ် ထည့်သွင်းခြင်း', nameLabel: 'အမည် (Full Name):', emailLabel: 'Email:',
    createNote: 'Password ကို ဒီမှာ မထည့်ပါ — ကျောင်းသားက Google/Email နဲ့ ပထမဆုံး Login ဝင်မှ Firebase Auth မှာ တကယ် မှတ်မယ်။',
    roleLabel: 'Role သတ်မှတ်ရန်:', cancel: 'ပယ်ဖျက်မည်', create: 'ဖန်တီးမည်',
    roleModalTitle: '🔄 Role ရွေးချယ်ရန်', roleFor: 'အတွက် Role ရွေးပါ — လက်ရှိ:', current: '(လက်ရှိ)', saveRole: 'သိမ်းဆည်းမည်',
    rStudent: 'STUDENT', rTeacher: 'TEACHER', rAdmin: 'ADMIN',
    rStudentD: 'မေးခွန်းဖြေ၊ Planner/Notes သုံးမယ်', rTeacherD: 'မေးခွန်းထည့်/ပြင်၊ သင်ကြားရေး စီမံမယ်', rAdminD: 'User အကုန် + Role + Status စီမံမယ်',
    tipToggleActive: 'အသုံးပြုခွင့် ပိတ်မယ် (DISABLE) — ဒီအကောင့် Login ဝင်မရတော့ပါ',
    tipTogglePending: 'အသုံးပြုခွင့် ဖွင့်မယ် (APPROVE/ACTIVE) — Login ဝင်လို့ရပြီ',
    tipRole: 'Role ရွေးမယ်', tipDelete: 'အကောင့်ကို Firestore ထဲက အပြီးဖျက်မယ် (Delete) — ပြန်မရပါ!',
    ok: 'အောင်မြင်သည် ✅', err: 'အမှား',
    errFetch: 'User စာရင်း ဆွဲထုတ်ရာတွင် အမှားရှိသည်: ',
    errCreateFill: 'အမည် နှင့် Email ကို ဖြည့်သွင်းပါ။', createdTail: 'ကို အောင်မြင်စွာ ဖန်တီးပြီးပါပြီ။', userWord: 'User',
    roleQ: 'Role ပြောင်းလဲရန်', roleTo: '၏ Role ကို', roleChangedTo: 'သို့ ပြောင်းမည်မှာ သေချာပါသလား?', noDo: 'မလုပ်ပါ', yesSave: 'သိမ်းမည်',
    statusQ: 'အသုံးပြုခွင့် (Status) ပြောင်းလဲရန်', statusConfirm: 'အတည်ပြုမည်',
    delQ: 'သတိပေးချက် ⚠️️', delConfirm: 'အကောင့်ကို စနစ်ထဲမှ လုံးဝ ဖျက်ပစ်ရန် သေချာပါသလား?', noDel: 'မဖျက်ပါ', yesDel: 'ဖျက်မည်', deleted: 'User အကောင့်ကို ဖျက်ပစ်ပြီးပါပြီ။',
    pwShort: 'Password အသစ်ကို အနည်းဆုံး ၆ လုံး ဖြည့်ပါ။', pwLoginFirst: 'Google/Email နဲ့ Login ဝင်ထားမှ Password ပြောင်းလို့ရပါတယ်။',
    pwDone: 'သင်၏ Password ကို Firebase မှာ တကယ်ပြောင်းပြီးပါပြီ။', pwRecent: 'လုံခြုံရေးအရ Logout လုပ်ပြီး Login ပြန်ဝင်ပြီးမှ ပြောင်းပါ။', pwFail: 'မအောင်မြင်ပါ',
    okBtn: 'အိုကေ', bioEdit: '✏️ ပြင်ဆင်ရန်',
    bioModalTitle: 'ဆရာ့ ကိုယ်ရေးအကျဉ်း ပြင်ဆင်ရန်',
    bioFName: 'အမည်:', bioFDeg: 'ဘွဲ့/ပညာအရည်အချင်း:', bioFExpertise: 'ကျွမ်းကျင်မှု:', bioFExp: 'အတွေ့အကြုံ:', bioFContact: 'ဆက်သွယ်ရန်:',
    bioSaved: 'ကိုယ်ရေးအကျဉ်း သိမ်းပြီးပါပြီ ✅',
  },
  en: {
    headerAdmin: '🛡️ Admin Panel & User Management', headerUser: '🎓 Student/Teacher Area',
    adminTitle: '🛡️ ADMIN - User Management', addUser: 'Add New User',
    sub: 'Approve registrations, change roles and manage users',
    legend: 'Buttons — ✅/🔒 = Approve/Disable\n🔄 = Pick role (Student/Teacher/Admin list)\n🗑️ = Delete account permanently\n(Web: hover for tips, phone: long-press)',
    thName: 'Name / Email', thRole: 'Role', thStatus: 'Status', thActions: 'Actions',
    empty: 'No users in Firestore yet.', me: ' (you)',
    statusActive: 'Access enabled (ACTIVE).', statusDisabled: 'Access disabled (DISABLED).',
    nonAdminTitle: 'Account Status', nonAdminBody: 'Your account is a student/teacher account. Admin features are not visible to you.',
    bioTitle: 'Teacher Profile & Qualifications',
    bioName: 'U Soe Myint Swe',
    bioDegreesV: 'B.Sc (Physics), Dip. in Education, MKS Edu Services Founder',
    bioExpertiseV: 'Japanese Language (JLPT N3/N4/N5), Python Automation, Educational Management',
    bioExpV: '25+ years in government and education services.',
    bioContactV: 'soemyintswe@gmail.com | Yangon, Myanmar',
    bioDegrees: 'Degrees:', bioExpertise: 'Expertise:', bioExp: 'Experience:', bioContact: 'Contact:',
    shareTitle: 'Share the App', shareSub: 'Tap to share this Study Planner app with others',
    pwTitle: '🔑 Change Password', oldPw: 'Old Password:', newPw: 'New Password:',
    changeBtn: 'Change Password',
    createTitle: '👤 Add New User', nameLabel: 'Full Name:', emailLabel: 'Email:',
    createNote: 'No password here — set on first Google/Email login in Firebase Auth.',
    roleLabel: 'Set role:', cancel: 'Cancel', create: 'Create',
    roleModalTitle: '🔄 Pick a Role', roleFor: 'Pick a role for', current: '(current)', saveRole: 'Save',
    rStudent: 'STUDENT', rTeacher: 'TEACHER', rAdmin: 'ADMIN',
    rStudentD: 'Answer quizzes, use Planner/Notes', rTeacherD: 'Add/edit questions, manage teaching', rAdminD: 'Manage all users, roles and status',
    tipToggleActive: 'Disable access (DISABLED) — cannot log in anymore',
    tipTogglePending: 'Enable access (APPROVE/ACTIVE) — can log in now',
    tipRole: 'Pick a role', tipDelete: 'Permanently delete from Firestore — cannot be undone!',
    ok: 'Success ✅', err: 'Error',
    errFetch: 'Failed to load user list: ',
    errCreateFill: 'Please fill in name and email.', createdTail: ' created successfully.', userWord: 'User',
    roleQ: 'Change Role', roleTo: "'s role to", roleChangedTo: '?', noDo: 'Cancel', yesSave: 'Save',
    statusQ: 'Change Access Status', statusConfirm: 'Confirm',
    delQ: 'Warning ⚠️️', delConfirm: 'Permanently delete this account from the system?', noDel: 'No', yesDel: 'Delete', deleted: 'User account deleted.',
    pwShort: 'New password must be at least 6 characters.', pwLoginFirst: 'Please log in with Google/Email first.',
    pwDone: 'Your password has been changed in Firebase.', pwRecent: 'For security, log out and log in again first.', pwFail: 'Failed',
    okBtn: 'OK', bioEdit: '✏️ Edit',
    bioModalTitle: 'Edit Teacher Profile',
    bioFName: 'Name:', bioFDeg: 'Degrees:', bioFExpertise: 'Expertise:', bioFExp: 'Experience:', bioFContact: 'Contact:',
    bioSaved: 'Profile saved ✅',
  },
  jp: {
    headerAdmin: '🛡️ 管理者パネル・ユーザー管理', headerUser: '🎓 学生・先生エリア',
    adminTitle: '🛡️ ADMIN - ユーザー管理', addUser: '新規ユーザー追加',
    sub: '登録の承認、ロールの変更、ユーザー管理',
    legend: 'ボタン — ✅/🔒 = 有効化/無効化\n🔄 = ロール選択（Student/Teacher/Admin)\n🗑️ = アカウント完全削除\n(Web: ホバーで説明、スマホ: 長押し)',
    thName: '名前 / Email', thRole: 'ロール', thStatus: 'ステータス', thActions: '操作',
    empty: 'Firestoreにユーザーがまだいません。', me: '（あなた）',
    statusActive: '利用を有効化しました（ACTIVE）。', statusDisabled: '利用を無効化しました（DISABLED）。',
    nonAdminTitle: 'アカウント状態', nonAdminBody: 'あなたのアカウントは学生・先生用です。管理者機能は表示されません。',
    bioTitle: '先生のプロフィール・資格',
    bioName: 'ウー・ソー・ミン・スエ',
    bioDegreesV: '物理学学士、教育ディプロマ、MKS Edu Services 創設者',
    bioExpertiseV: '日本語（JLPT N3/N4/N5）、Python自動化、教育管理',
    bioExpV: '政府・教育サービスで25年以上の経験。',
    bioContactV: 'soemyintswe@gmail.com | ヤンゴン、ミャンマー',
    bioDegrees: '学位・学歴:', bioExpertise: '専門:', bioExp: '経験:', bioContact: '連絡先:',
    shareTitle: 'アプリを共有', shareSub: 'このスタディプランナーを他の人に共有するにはタップ',
    pwTitle: '🔑 パスワード変更', oldPw: '古いパスワード:', newPw: '新しいパスワード:',
    changeBtn: 'パスワードを変更',
    createTitle: '👤 新規ユーザー追加', nameLabel: '氏名:', emailLabel: 'Email:',
    createNote: 'パスワードはここでは設定しません。初回ログイン時に登録されます。',
    roleLabel: 'ロール設定:', cancel: 'キャンセル', create: '作成',
    roleModalTitle: '🔄 ロール選択', roleFor: 'のロールを選択 — 現在:', current: '（現在）', saveRole: '保存',
    rStudent: 'STUDENT', rTeacher: 'TEACHER', rAdmin: 'ADMIN',
    rStudentD: 'クイズ解答、プランナー・ノート利用', rTeacherD: '問題の追加・編集、指導管理', rAdminD: '全ユーザー・ロール・状態の管理',
    tipToggleActive: '利用を無効化（DISABLE）— ログインできなくなります',
    tipTogglePending: '利用を有効化（APPROVE/ACTIVE）— ログイン可能になります',
    tipRole: 'ロールを選択', tipDelete: 'Firestoreから完全削除 — 元に戻せません！',
    ok: '成功 ✅', err: 'エラー',
    errFetch: 'ユーザー一覧の取得に失敗: ',
    errCreateFill: '名前とEmailを入力してください。', createdTail: 'を作成しました。', userWord: 'ユーザー',
    roleQ: 'ロール変更', roleTo: 'のロールを', roleChangedTo: 'にしますか？', noDo: 'やめる', yesSave: '保存',
    statusQ: '利用状態の変更', statusConfirm: '確定',
    delQ: '警告 ⚠️️', delConfirm: 'このアカウントをシステムから完全に削除しますか？', noDel: 'やめる', yesDel: '削除', deleted: 'ユーザーアカウントを削除しました。',
    pwShort: '新しいパスワードは6文字以上にしてください。', pwLoginFirst: 'Google/Emailでログインしてから変更してください。',
    pwDone: 'Firebaseでパスワードを変更しました。', pwRecent: 'セキュリティのため再ログインしてください。', pwFail: '失敗',
    okBtn: 'OK', bioEdit: '✏️ 編集',
    bioModalTitle: '先生プロフィール編集',
    bioFName: '名前:', bioFDeg: '学位・学歴:', bioFExpertise: '専門:', bioFExp: '経験:', bioFContact: '連絡先:',
    bioSaved: '保存しました ✅',
  },
};

export default function TeacherScreen({ currentUser, onLogout, navigation }) {
  const goProfile = () => { try { navigation.navigate('Community', { seg: 'profile' }); } catch (e) {} };
  const { lang } = useLanguage();
  const t = teacherT[lang] || teacherT.my;
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [usersList, setUsersList] = useState([]);

  // Admin အီးမေးလ် သတ်မှတ်ချက်
  const ADMIN_EMAIL = 'soemyintswe@gmail.com'; 
  const isAdmin = currentUser?.email === ADMIN_EMAIL || currentUser?.role === 'admin';

  // User အသစ်ဖန်တီးရန် State များ
  const [modalVisible, setModalVisible] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState('student');

  const [oldPassword, setOldPassword] = useState('');
  const [newPass, setNewPass] = useState('');
  const [showOldPass, setShowOldPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);

  // ခလုတ်နှိပ်နေတုန်း (loading) ဘယ်အတန်းလဲ မှတ်ထားရန် — ခလုတ်အလုပ်လုပ်နေမှန်း သိသာအောင်
  const [busyId, setBusyId] = useState(null);

  // In-app confirm/info dialog (web Alert.alert is NO-OP → custom modal)
  // {title, message, confirmText?, cancelText?, danger?, onConfirm?} — confirmText မပါရင် info mode (OK သက်သက်)
  const [confirm, setConfirm] = useState(null);
  const showInfo = (title, message) => setConfirm({ title, message, info: true });

  // Teacher bio — Firestore settings/teacherBio (staff ပြင်/ဖြည့်, အားလုံးကြည့်)
  const DEFAULT_BIO = {
    name: 'ဦးစိုးမြင့်ဆွေ (U Soe Myint Swe)',
    degrees: 'B.Sc (Physics), Dip. in Education, MKS Edu Services Founder',
    expertise: 'Japanese Language (JLPT N3/N4/N5), Python Automation, Educational Management',
    experience: '၂၅ နှစ်ကျော် အစိုးရနှင့် ပညာရေးဝန်ဆောင်မှု လုပ်ငန်းအတွေ့အကြုံရှိသူ။',
    contact: 'soemyintswe@gmail.com | Yangon, Myanmar',
  };
  const [bio, setBio] = useState(DEFAULT_BIO);
  const [bioModal, setBioModal] = useState(false);
  const [bioForm, setBioForm] = useState(DEFAULT_BIO);
  const canEditBio = isAdmin || currentUser?.role === 'teacher';

  useEffect(() => {
    (async () => {
      try {
        const snap = await getDoc(doc(db, 'settings', 'teacherBio'));
        if (snap.exists()) setBio({ ...DEFAULT_BIO, ...snap.data() });
      } catch (e) {
        console.log('Load bio:', e.message);
      }
    })();
  }, []);

  const openBioEdit = () => {
    setBioForm({ ...bio });
    setBioModal(true);
  };

  const saveBio = async () => {
    if (!canEditBio) return;
    try {
      const data = {
        name: (bioForm.name || '').trim() || DEFAULT_BIO.name,
        degrees: (bioForm.degrees || '').trim(),
        expertise: (bioForm.expertise || '').trim(),
        experience: (bioForm.experience || '').trim(),
        contact: (bioForm.contact || '').trim(),
        updatedAt: new Date().toISOString(),
        updatedBy: currentUser?.email || '',
      };
      await setDoc(doc(db, 'settings', 'teacherBio'), data, { merge: true });
      setBio({ ...DEFAULT_BIO, ...data });
      setBioModal(false);
      showInfo(t.ok, t.bioSaved);
    } catch (e) {
      showInfo(t.err, firestoreErrorMsg(e, t.bioModalTitle));
    }
  };

  // Firestore မှ Users စာရင်းများကို ဆွဲထုတ်ခြင်း
  const fetchUsersFromFirestore = async (silent) => {
    if (!isAdmin) return;
    try {
      if (!silent) setLoading(true);

      // db မှန်ကန်မှုရှိမရှိ စစ်ဆေးခြင်း
      if (!db) {
        throw new Error('Firestore (db) is not initialized properly.');
      }

      const querySnapshot = await getDocs(collection(db, 'users'));
      const users = [];
      querySnapshot.forEach((document) => {
        users.push({ id: document.id, ...document.data() });
      });

      // ကိုယ့် Admin email နဲ့ PENDING ဖြစ်ကျန်နေတဲ့ doc ရှိရင် ACTIVE အဖြစ် auto-ပြင်မယ်
      // (အရင် version မှာ PENDING နဲ့ ကျန်ခဲ့လို့ ကိုယ့်အကောင့်မှာ PENDING ပြနေတာ)
      const adminDocs = users.filter(
        (u) => (u.email || '').toLowerCase() === ADMIN_EMAIL.toLowerCase() && u.status !== 'active'
      );
      for (const ad of adminDocs) {
        try {
          await updateDoc(doc(db, 'users', ad.id), { status: 'active', role: ad.role || 'teacher' });
          ad.status = 'active';
          ad.role = ad.role || 'teacher';
        } catch (e) {
          console.log('Auto-activate admin failed:', e.message);
        }
      }

      setUsersList(users);
    } catch (error) {
      console.error('Error fetching users: ', error);
      if (!silent) showInfo(t.err, t.errFetch + error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchUsersFromFirestore();
    } else {
      setLoading(false);
    }
  }, [isAdmin]);

  const onRefresh = () => {
    setRefreshing(true);
    if (isAdmin) {
      fetchUsersFromFirestore();
    } else {
      setRefreshing(false);
    }
  };

  // User အသစ် တိုက်ရိုက်ဖန်တီးပေးခြင်း
  // NOTE: Password ကို Firestore မှာ လုံးဝ မသိမ်းပါ (လုံခြုံရေးအရ)။
  // ဒီကနေ profile (name/email/role/status) သက်သက် ဖန်တီးပေးပြီး
  // ကျောင်းသားက Google/Email နဲ့ ပထမဆုံး Login ဝင်မှ Auth ချိတ်မယ်။
  const handleCreateUser = async () => {
    if (!isAdmin) return;
    if (!newName.trim() || !newEmail.trim()) {
      showInfo(t.err, t.errCreateFill);
      return;
    }

    try {
      setLoading(true);

      if (!db) {
        throw new Error('Firestore (db) is not initialized properly.');
      }

      const userId = 'user_' + Date.now();
      const userRef = doc(db, 'users', userId);

      await setDoc(userRef, {
        uid: userId,
        name: newName.trim(),
        email: newEmail.trim().toLowerCase(),
        role: newRole,
        status: 'active',
        createdAt: new Date().toISOString(),
        note: 'Admin က ကြိုဖန်တီးပေးထားသည် — ကျောင်းသား Login ဝင်မှ uid ချိတ်မယ်'
      });

      showInfo(t.ok, t.userWord + ' "' + newName + '"' + t.createdTail);
      setNewName('');
      setNewEmail('');
      setNewRole('student');
      setModalVisible(false);
      fetchUsersFromFirestore();
    } catch (error) {
      console.error('Create User Error:', error);
      showInfo(t.err, error.message);
    } finally {
      setLoading(false);
    }
  };

  // Role ရွေးချယ်မှု Modal အတွက် state — လှည့်ပြောင်းခလုတ် (cycle) အစား
  // ရွေးချယ်စရာအကုန် မြင်ရတဲ့ dropdown ပုံစံ (Modal) သုံးမယ်:
  // မှားနှိပ်မိလို့ Role လွှဲသွားတဲ့ ပြဿနာ မရှိတော့ဘူး။
  const [roleModalVisible, setRoleModalVisible] = useState(false);
  const [roleTarget, setRoleTarget] = useState(null); // {id, name, email, role}
  const [rolePick, setRolePick] = useState('student');

  const ROLE_INFO = {
    student: { emoji: '🎓', label: t.rStudent, desc: t.rStudentD },
    teacher: { emoji: '👨‍🏫', label: t.rTeacher, desc: t.rTeacherD },
    admin: { emoji: '🛡️', label: t.rAdmin, desc: t.rAdminD },
  };

  // 🔄 နှိပ်ရင် Modal ဖွင့်မယ် (လှည့်မပြောင်းတော့ဘူး)
  const handleChangeRole = (userId, currentRole, userName) => {
    if (!isAdmin) return;
    setRoleTarget({ id: userId, name: userName, role: (currentRole || 'student').toLowerCase() });
    setRolePick((currentRole || 'student').toLowerCase());
    setRoleModalVisible(true);
  };

  // Modal ထဲက Role ကို တကယ် သိမ်းမယ်
  const handleSaveRole = async () => {
    if (!roleTarget) return;
    if (rolePick === roleTarget.role) {
      setRoleModalVisible(false);
      return; // မပြောင်းဘူး — အပို write မလုပ်ဘူး
    }
    setBusyId(roleTarget.id);
    try {
      await updateDoc(doc(db, 'users', roleTarget.id), { role: rolePick });
      showInfo(t.ok, '"' + (roleTarget.name || t.userWord) + '" ' + t.roleTo + ' ' + ROLE_INFO[rolePick].label);
      setRoleModalVisible(false);
      setRoleTarget(null);
      fetchUsersFromFirestore(true);
    } catch (error) {
      showInfo(t.err, firestoreErrorMsg(error, t.roleQ));
    } finally {
      setBusyId(null);
    }
  };

  // User ၏ အသုံးပြုခွင့် Status ကို ပြောင်းလဲခြင်း (in-app confirm modal)
  const handleToggleStatus = (userId, currentStatus, userName) => {
    if (!isAdmin) return;
    const newStatus = currentStatus === 'active' ? 'disabled' : 'active';
    const statusText = newStatus === 'active' ? t.statusActive : t.statusDisabled;

    setConfirm({
      title: t.statusQ,
      message: '"' + (userName || t.userWord) + '" — ' + statusText,
      confirmText: t.statusConfirm,
      cancelText: t.noDo,
      danger: newStatus !== 'active',
      onConfirm: async () => {
        setBusyId(userId);
        try {
          await updateDoc(doc(db, 'users', userId), { status: newStatus });
          setConfirm({ title: t.ok, message: statusText, info: true });
          fetchUsersFromFirestore(true);
        } catch (error) {
          setConfirm({ title: t.err, message: firestoreErrorMsg(error, t.statusQ), info: true });
        } finally {
          setBusyId(null);
        }
      },
    });
  };

  // User အကောင့်ကို ဖျက်ခြင်း (in-app confirm modal)
  const handleDeleteUser = (userId, userName) => {
    if (!isAdmin) return;
    setConfirm({
      title: t.delQ,
      message: '"' + (userName || t.userWord) + '" ' + t.delConfirm,
      confirmText: t.yesDel,
      cancelText: t.noDel,
      danger: true,
      onConfirm: async () => {
        setBusyId(userId);
        try {
          await deleteDoc(doc(db, 'users', userId));
          setConfirm({ title: t.ok, message: t.deleted, info: true });
          fetchUsersFromFirestore(true);
        } catch (error) {
          setConfirm({ title: t.err, message: firestoreErrorMsg(error, t.delQ), info: true });
        } finally {
          setBusyId(null);
        }
      },
    });
  };

  const onShareApp = async () => {
    try {
      await Share.share({
        message: 'Japanese Study Planner အက်ပ်ကို အသုံးပြု၍ ဂျပန်စာလေ့လာမှုကို စနစ်တကျ စီမံကြပါစို့! Download link: https://mksedudoc.web.app',
      });
    } catch (error) {
      showInfo('Error', error.message);
    }
  };

  // Firebase Auth အစစ်ဖြင့် Password ပြောင်းခြင်း
  const handleChangePassword = async () => {
    if (!newPass.trim() || newPass.trim().length < 6) {
      showInfo(t.err, t.pwShort);
      return;
    }
    try {
      if (!auth.currentUser) {
        showInfo(t.err, t.pwLoginFirst);
        return;
      }
      await updatePassword(auth.currentUser, newPass.trim());
      showInfo(t.ok, t.pwDone);
      setOldPassword('');
      setNewPass('');
    } catch (e) {
      console.error('Change password error', e.message);
      showInfo(
        t.pwFail,
        e.code === 'auth/requires-recent-login'
          ? t.pwRecent
          : e.message
      );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <AppHeader title={isAdmin ? t.headerAdmin : t.headerUser} user={currentUser} onLogout={onLogout} onProfilePress={goProfile} />

      <ScrollView 
        contentContainerStyle={styles.scrollContainer}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {isAdmin ? (
          <View style={styles.adminCard}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <Text style={[styles.cardTitle, { color: '#D32F2F', flex: 1 }]}>{t.adminTitle}</Text>

              <TouchableOpacity style={styles.addUserBtnHeader} onPress={() => setModalVisible(true)}>
                <Text style={{ fontSize: 14, color: '#FFF', marginRight: 4 }}>👤➕</Text>
                <Text style={styles.addUserBtnText}>{t.addUser}</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.subText}>{t.sub}</Text>
            <Text style={[styles.subText, { marginTop: -8, backgroundColor: '#FFF', padding: 8, borderRadius: 6 }]}>
              {t.legend}
            </Text>

            {/* ဇယားခေါင်းစဉ်တန်း */}
            <View style={styles.tableHeaderRow}>
              <Text style={[styles.thText, { flex: 2 }]}>{t.thName}</Text>
              <Text style={[styles.thText, { flex: 1, textAlign: 'center' }]}>{t.thRole}</Text>
              <Text style={[styles.thText, { flex: 1, textAlign: 'center' }]}>{t.thStatus}</Text>
              <Text style={[styles.thText, { flex: 1.2, textAlign: 'right' }]}>{t.thActions}</Text>
            </View>

            {loading && usersList.length === 0 ? (
              <ActivityIndicator size="small" color="#D32F2F" style={{ marginVertical: 20 }} />
            ) : usersList.length === 0 ? (
              <View style={styles.emptyTableContainer}>
                <Text style={styles.noDataText}>{t.empty}</Text>
              </View>
            ) : (
              usersList.map((usr) => {
                const status = (usr.status || 'pending').toLowerCase();
                const role = (usr.role || 'student').toLowerCase();
                const isMe = (usr.email || '').toLowerCase() === (currentUser?.email || '').toLowerCase();
                const busy = busyId === usr.id;

                return (
                  <View key={usr.id} style={[styles.tableRowItem, isMe && { backgroundColor: '#FFF8E1', borderRadius: 6 }]}>
                    <View style={{ flex: 2, marginRight: 4 }}>
                      <Text style={styles.studentName}>
                        {usr.name || usr.username || 'No Name'}{isMe ? t.me : ''}
                      </Text>
                      <Text style={styles.studentDate}>{usr.email || 'N/A'}</Text>
                    </View>

                    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                      <Text style={[styles.badge, role === 'admin' ? styles.bgAdmin : role === 'teacher' ? styles.bgTeacher : styles.bgStudent]}>
                        {role.toUpperCase()}
                      </Text>
                    </View>

                    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                      <Text style={[styles.badge, status === 'active' ? styles.bgActive : styles.bgPending]}>
                        {status.toUpperCase()}
                      </Text>
                    </View>

                    <View style={styles.actionColumn}>
                      <ActionBtn
                        emoji={status === 'active' ? '🔒' : '✅'}
                        bg={status === 'active' ? '#E53935' : '#2E7D32'}
                        tip={status === 'active' ? t.tipToggleActive : t.tipTogglePending}
                        disabled={busy}
                        onPress={() => handleToggleStatus(usr.id, status, usr.name || usr.username)}
                      />

                      <ActionBtn
                        emoji="🔄"
                        bg="#1976D2"
                        tip={t.tipRole + ' — ' + role.toUpperCase()}
                        disabled={busy}
                        onPress={() => handleChangeRole(usr.id, role, usr.name || usr.username)}
                      />

                      <ActionBtn
                        emoji="🗑️"
                        bg="#D32F2F"
                        tip={t.tipDelete}
                        disabled={busy}
                        onPress={() => handleDeleteUser(usr.id, usr.name || usr.username)}
                      />
                    </View>
                  </View>
                );
              })
            )}
          </View>
        ) : (
          <View style={styles.card}>
            <View style={styles.cardHeaderRow}>
              <Text style={{ fontSize: 22 }}>ℹ️</Text>
              <Text style={styles.cardTitle}>{t.nonAdminTitle}</Text>
            </View>
            <Text style={styles.bioText}>{t.nonAdminBody}</Text>
          </View>
        )}

        {/* ဆရာ့ ကိုယ်ရေးအကျဉ်း — Firestore settings/teacherBio (ဆရာ/Admin ပြင်/ဖြည့်, အားလုံးကြည့်) */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Text style={{ fontSize: 22 }}>🎖️</Text>
            <Text style={[styles.cardTitle, { flex: 1 }]}>{t.bioTitle}</Text>
            {canEditBio && (
              <TouchableOpacity style={styles.bioEditBtn} onPress={openBioEdit}>
                <Text style={styles.bioEditText}>{t.bioEdit}</Text>
              </TouchableOpacity>
            )}
          </View>
          <Text style={styles.bioName}>{bio.name}</Text>
          {!!bio.degrees && (
            <Text style={styles.bioText}><Text style={styles.bold}>{t.bioDegrees}</Text> {bio.degrees}</Text>
          )}
          {!!bio.expertise && (
            <Text style={styles.bioText}><Text style={styles.bold}>{t.bioExpertise}</Text> {bio.expertise}</Text>
          )}
          {!!bio.experience && (
            <Text style={styles.bioText}><Text style={styles.bold}>{t.bioExp}</Text> {bio.experience}</Text>
          )}
          {!!bio.contact && (
            <Text style={styles.bioText}><Text style={styles.bold}>{t.bioContact}</Text> {bio.contact}</Text>
          )}
        </View>

        {/* App မျှဝေရန် Banner */}
        <TouchableOpacity style={styles.shareBanner} onPress={onShareApp}>
          <Text style={{ fontSize: 24, color: '#FFF' }}>📤</Text>
          <View style={{ marginLeft: 12, flex: 1 }}>
            <Text style={styles.shareBannerTitle}>{t.shareTitle}</Text>
            <Text style={styles.shareBannerSub}>{t.shareSub}</Text>
          </View>
        </TouchableOpacity>

        {/* Password ပြောင်းလဲခြင်း ကဏ္ဍ */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t.pwTitle}</Text>

          <Text style={styles.label}>{t.oldPw}</Text>
          <View style={styles.passwordContainer}>
            <TextInput 
              style={styles.passwordInput} 
              placeholder="Old Password" 
              placeholderTextColor="#999"
              value={oldPassword} 
              onChangeText={setOldPassword} 
              secureTextEntry={!showOldPass} 
            />
            <TouchableOpacity onPress={() => setShowOldPass(!showOldPass)} style={styles.eyeIcon}>
              <Text style={{ fontSize: 20 }}>{showOldPass ? '🙈' : '👁️'}</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.label}>{t.newPw}</Text>
          <View style={styles.passwordContainer}>
            <TextInput 
              style={styles.passwordInput} 
              placeholder="New Password" 
              placeholderTextColor="#999"
              value={newPass} 
              onChangeText={setNewPass} 
              secureTextEntry={!showNewPass} 
            />
            <TouchableOpacity onPress={() => setShowNewPass(!showNewPass)} style={styles.eyeIcon}>
              <Text style={{ fontSize: 20 }}>{showNewPass ? '🙈' : '👁️'}</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.changePassBtn} onPress={handleChangePassword}>
            <Text style={styles.changePassBtnText}>{t.changeBtn}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* User အသစ်ဖန်တီးသည့် Modal Form */}
      {isAdmin && (
        <Modal visible={modalVisible} animationType="slide" transparent={true}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>{t.createTitle}</Text>

              <Text style={styles.label}>{t.nameLabel}</Text>
              <TextInput style={styles.modalInput} placeholder="Mg Mg" placeholderTextColor="#999" value={newName} onChangeText={setNewName} />

              <Text style={styles.label}>{t.emailLabel}</Text>
              <TextInput style={styles.modalInput} placeholder="user@gmail.com" placeholderTextColor="#999" value={newEmail} onChangeText={setNewEmail} autoCapitalize="none" />

              <Text style={{ fontSize: 11, color: '#666', marginTop: 6 }}>
                {t.createNote}
              </Text>

              <Text style={styles.label}>{t.roleLabel}</Text>
              <View style={styles.roleSelectRow}>
                {['student', 'teacher', 'admin'].map((r) => (
                  <TouchableOpacity 
                    key={r} 
                    style={[styles.roleOptionBtn, newRole === r && styles.roleOptionActive]}
                    onPress={() => setNewRole(r)}
                  >
                    <Text style={[styles.roleOptionText, newRole === r && { color: '#FFF' }]}>{r.toUpperCase()}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.modalBtnRow}>
                <TouchableOpacity style={styles.cancelModalBtn} onPress={() => setModalVisible(false)}>
                  <Text style={{ color: '#555', fontWeight: 'bold', fontFamily: Platform.OS === 'ios' ? 'Myanmar Sangam MN' : 'sans-serif' }}>{t.cancel}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.saveModalBtn} onPress={handleCreateUser}>
                  <Text style={{ color: '#FFF', fontWeight: 'bold', fontFamily: Platform.OS === 'ios' ? 'Myanmar Sangam MN' : 'sans-serif' }}>{t.create}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}

      {/* Role ရွေးချယ်မှု Modal (dropdown အစား — Web/ဖုန်း နှစ်ခုလုံး ရတယ်) */}
      {isAdmin && (
        <Modal visible={roleModalVisible} animationType="slide" transparent={true}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>{t.roleModalTitle}</Text>
              <Text style={{ fontSize: 12, color: '#666', textAlign: 'center', marginBottom: 12 }}>
                "{roleTarget?.name || t.userWord}" ({roleTarget?.email || ''}){'\n'}{t.roleFor} {(roleTarget?.role || '').toUpperCase()}
              </Text>

              {['student', 'teacher', 'admin'].map((r) => {
                const info = ROLE_INFO[r];
                const selected = rolePick === r;
                const isCurrent = roleTarget?.role === r;
                return (
                  <TouchableOpacity
                    key={r}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      borderWidth: 2,
                      borderColor: selected ? '#1976D2' : '#DDD',
                      backgroundColor: selected ? '#E3F2FD' : '#FAFAFA',
                      borderRadius: 10,
                      padding: 12,
                      marginBottom: 8,
                    }}
                    onPress={() => setRolePick(r)}
                  >
                    <Text style={{ fontSize: 26, marginRight: 10 }}>{info.emoji}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 14, fontWeight: 'bold', color: selected ? '#1976D2' : '#333' }}>
                        {info.label}{isCurrent ? ' ' + t.current : ''}
                      </Text>
                      <Text style={{ fontSize: 11, color: '#666', marginTop: 2 }}>{info.desc}</Text>
                    </View>
                    <Text style={{ fontSize: 20 }}>{selected ? '✅' : '⬜'}</Text>
                  </TouchableOpacity>
                );
              })}

              <View style={styles.modalBtnRow}>
                <TouchableOpacity style={styles.cancelModalBtn} onPress={() => { setRoleModalVisible(false); setRoleTarget(null); }}>
                  <Text style={{ color: '#555', fontWeight: 'bold', fontFamily: Platform.OS === 'ios' ? 'Myanmar Sangam MN' : 'sans-serif' }}>{t.cancel}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.saveModalBtn} onPress={handleSaveRole}>
                  <Text style={{ color: '#FFF', fontWeight: 'bold', fontFamily: Platform.OS === 'ios' ? 'Myanmar Sangam MN' : 'sans-serif' }}>{t.saveRole}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}

      {/* Bio edit modal (ဆရာ/Admin) */}
      {canEditBio && (
        <Modal visible={bioModal} animationType="slide" transparent={true}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>{t.bioModalTitle}</Text>

              <Text style={styles.label}>{t.bioFName}</Text>
              <TextInput style={styles.modalInput} value={bioForm.name} onChangeText={(v) => setBioForm({ ...bioForm, name: v })} placeholderTextColor="#999" />

              <Text style={styles.label}>{t.bioFDeg}</Text>
              <TextInput style={styles.modalInput} value={bioForm.degrees} onChangeText={(v) => setBioForm({ ...bioForm, degrees: v })} placeholderTextColor="#999" />

              <Text style={styles.label}>{t.bioFExpertise}</Text>
              <TextInput style={[styles.modalInput, { height: 60, textAlignVertical: 'top' }]} value={bioForm.expertise} onChangeText={(v) => setBioForm({ ...bioForm, expertise: v })} placeholderTextColor="#999" multiline={true} />

              <Text style={styles.label}>{t.bioFExp}</Text>
              <TextInput style={[styles.modalInput, { height: 60, textAlignVertical: 'top' }]} value={bioForm.experience} onChangeText={(v) => setBioForm({ ...bioForm, experience: v })} placeholderTextColor="#999" multiline={true} />

              <Text style={styles.label}>{t.bioFContact}</Text>
              <TextInput style={styles.modalInput} value={bioForm.contact} onChangeText={(v) => setBioForm({ ...bioForm, contact: v })} placeholderTextColor="#999" />

              <View style={styles.modalBtnRow}>
                <TouchableOpacity style={styles.cancelModalBtn} onPress={() => setBioModal(false)}>
                  <Text style={{ color: '#555', fontWeight: 'bold', fontFamily: Platform.OS === 'ios' ? 'Myanmar Sangam MN' : 'sans-serif' }}>{t.cancel}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.saveModalBtn} onPress={saveBio}>
                  <Text style={{ color: '#FFF', fontWeight: 'bold', fontFamily: Platform.OS === 'ios' ? 'Myanmar Sangam MN' : 'sans-serif' }}>{t.saveRole}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}

      {/* Confirm / info dialog (Alert.alert အစား) */}
      <ConfirmModal
        visible={!!confirm}
        title={confirm?.title}
        message={confirm?.message}
        confirmText={confirm?.info ? null : confirm?.confirmText}
        cancelText={confirm?.info ? t.okBtn : confirm?.cancelText}
        danger={!!confirm?.danger}
        busy={!!busyId}
        onConfirm={async () => { if (confirm?.onConfirm) await confirm.onConfirm(); }}
        onCancel={() => { if (!busyId) setConfirm(null); }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  headerPlanner: { paddingHorizontal: 20, paddingVertical: 12, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#EFEFEF' },
  headerTitleText: { fontSize: 17, fontWeight: 'bold', color: '#333', fontFamily: Platform.OS === 'ios' ? 'Myanmar Sangam MN' : 'sans-serif' },
  scrollContainer: { padding: 15 },
  card: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 18, marginBottom: 15, elevation: 3 },
  adminCard: { backgroundColor: '#FFF5F5', borderWidth: 1, borderColor: '#FFCDD2', borderRadius: 12, padding: 18, marginBottom: 15, elevation: 3 },
  cardHeaderRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  cardTitle: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 6, fontFamily: Platform.OS === 'ios' ? 'Myanmar Sangam MN' : 'sans-serif' },
  subText: { fontSize: 11, color: '#666', marginBottom: 12, fontFamily: Platform.OS === 'ios' ? 'Myanmar Sangam MN' : 'sans-serif' },
  tableHeaderRow: { flexDirection: 'row', backgroundColor: '#FFEBEE', paddingVertical: 8, paddingHorizontal: 6, borderRadius: 6, marginBottom: 6 },
  thText: { fontSize: 11, fontWeight: 'bold', color: '#C62828', fontFamily: Platform.OS === 'ios' ? 'Myanmar Sangam MN' : 'sans-serif' },
  tableRowItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 4, borderBottomWidth: 1, borderBottomColor: '#FFCDD2' },
  emptyTableContainer: { padding: 20, alignItems: 'center' },
  bioEditBtn: { backgroundColor: '#E3F2FD', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6, marginLeft: 8 },
  bioEditText: { color: '#1976D2', fontSize: 11, fontWeight: 'bold' },
  bioName: { fontSize: 17, fontWeight: 'bold', color: '#D32F2F', marginBottom: 6, fontFamily: Platform.OS === 'ios' ? 'Myanmar Sangam MN' : 'sans-serif' },
  bioText: { fontSize: 13, color: '#555', marginBottom: 4, lineHeight: 18, fontFamily: Platform.OS === 'ios' ? 'Myanmar Sangam MN' : 'sans-serif' },
  bold: { fontWeight: 'bold', color: '#333', fontFamily: Platform.OS === 'ios' ? 'Myanmar Sangam MN' : 'sans-serif' },
  shareBanner: { backgroundColor: '#1976D2', borderRadius: 12, padding: 16, flexDirection: 'row', alignItems: 'center', marginBottom: 15, elevation: 2 },
  shareBannerTitle: { color: '#FFF', fontSize: 15, fontWeight: 'bold', fontFamily: Platform.OS === 'ios' ? 'Myanmar Sangam MN' : 'sans-serif' },
  shareBannerSub: { color: '#E3F2FD', fontSize: 12, marginTop: 2, fontFamily: Platform.OS === 'ios' ? 'Myanmar Sangam MN' : 'sans-serif' },
  label: { fontSize: 13, fontWeight: '600', color: '#555', marginBottom: 5, marginTop: 8, fontFamily: Platform.OS === 'ios' ? 'Myanmar Sangam MN' : 'sans-serif' },
  passwordContainer: { flexDirection: 'row', borderWidth: 1, borderColor: '#DDD', borderRadius: 8, alignItems: 'center', backgroundColor: '#FAFAFA', marginBottom: 10 },
  passwordInput: { flex: 1, paddingHorizontal: 12, paddingVertical: 8, fontSize: 14, color: '#333', fontFamily: Platform.OS === 'ios' ? 'Myanmar Sangam MN' : 'sans-serif' },
  eyeIcon: { padding: 10 },
  changePassBtn: { backgroundColor: '#1976D2', paddingVertical: 12, borderRadius: 8, alignItems: 'center', marginTop: 15 },
  changePassBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 14, fontFamily: Platform.OS === 'ios' ? 'Myanmar Sangam MN' : 'sans-serif' },
  addUserBtnHeader: { flexDirection: 'row', backgroundColor: '#D32F2F', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6, alignItems: 'center' },
  addUserBtnText: { color: '#FFF', fontSize: 11, fontWeight: 'bold', fontFamily: Platform.OS === 'ios' ? 'Myanmar Sangam MN' : 'sans-serif' },
  studentName: { fontSize: 13, fontWeight: 'bold', color: '#333', fontFamily: Platform.OS === 'ios' ? 'Myanmar Sangam MN' : 'sans-serif' },
  studentDate: { fontSize: 10, color: '#666', marginTop: 2, fontFamily: Platform.OS === 'ios' ? 'Myanmar Sangam MN' : 'sans-serif' },
  badge: { fontSize: 9, fontWeight: 'bold', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, overflow: 'hidden', color: '#FFF', textAlign: 'center', fontFamily: Platform.OS === 'ios' ? 'Myanmar Sangam MN' : 'sans-serif' },
  bgAdmin: { backgroundColor: '#D32F2F' },
  bgTeacher: { backgroundColor: '#E65100' },
  bgStudent: { backgroundColor: '#1976D2' },
  bgActive: { backgroundColor: '#2E7D32' },
  bgPending: { backgroundColor: '#F57C00' },
  actionColumn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', flex: 1.2 },
  smallBtn: { width: 26, height: 26, borderRadius: 4, marginRight: 4, justifyContent: 'center', alignItems: 'center', position: 'relative', overflow: 'visible' },
  deleteUserBtn: { width: 26, height: 26, backgroundColor: '#D32F2F', borderRadius: 4, justifyContent: 'center', alignItems: 'center' },
  tooltip: { position: 'absolute', bottom: 30, right: 0, backgroundColor: '#333', paddingHorizontal: 8, paddingVertical: 5, borderRadius: 6, minWidth: 140, maxWidth: 200, zIndex: 999 },
  tooltipText: { color: '#FFF', fontSize: 11, lineHeight: 15 },
  noDataText: { fontSize: 12, color: '#888', textAlign: 'center', fontFamily: Platform.OS === 'ios' ? 'Myanmar Sangam MN' : 'sans-serif' },
  modalOverlay: { flex: 1, justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.5)', padding: 20 },
  modalContent: { backgroundColor: '#FFF', borderRadius: 12, padding: 20, elevation: 5 },
  modalTitle: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 10, textAlign: 'center', fontFamily: Platform.OS === 'ios' ? 'Myanmar Sangam MN' : 'sans-serif' },
  modalInput: { borderWidth: 1, borderColor: '#DDD', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, fontSize: 14, backgroundColor: '#FAFAFA', marginBottom: 5, fontFamily: Platform.OS === 'ios' ? 'Myanmar Sangam MN' : 'sans-serif' },
  roleSelectRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 5, marginBottom: 15 },
  roleOptionBtn: { flex: 1, paddingVertical: 8, borderWidth: 1, borderColor: '#DDD', borderRadius: 6, alignItems: 'center', marginHorizontal: 3 },
  roleOptionActive: { backgroundColor: '#1976D2', borderColor: '#1976D2' },
  roleOptionText: { fontSize: 11, fontWeight: 'bold', color: '#555', fontFamily: Platform.OS === 'ios' ? 'Myanmar Sangam MN' : 'sans-serif' },
  modalBtnRow: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 10 },
  cancelModalBtn: { paddingVertical: 10, paddingHorizontal: 15, marginRight: 10, justifyContent: 'center' },
  saveModalBtn: { backgroundColor: '#D32F2F', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 8, justifyContent: 'center' }
});
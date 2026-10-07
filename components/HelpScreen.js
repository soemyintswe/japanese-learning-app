// HelpScreen — App အသုံးပြုနည်း လမ်းညွှန်အပြည့်အစုံ (my/en/jp, login မလို content — static guide)
// New sections ထပ်တိုးရင် ၃ ဘာသာလုံး ဖြည့်ရန် (structure: {h, b}[] per lang).
import React from 'react';
import { StyleSheet, Text, View, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLanguage } from '../src/LanguageContext';
import AppHeader from './AppHeader';

const helpT = {
  my: {
    title: '🆘 အကူအညီ — အသုံးပြုနည်း',
    secs: [
      { h: '🚪 အစ — Login/Register', b: '• Email + Password (သို့) Google နဲ့ ဝင်ပါ/ဖွင့်ပါ။\n• Role (student/teacher/admin) က အလိုအလျောက် — Admin ပေးမှ ရတယ်, ကိုယ်တိုင်ရွေးစရာမလို။\n• အကောင့်သစ် = PENDING (Admin approve-မှ ACTIVE)။ Password မေ့ရင် reset email ပို့ပါ။' },
      { h: '🌐 ဘာသာစကား', b: '• ခေါင်းစဉ်ဘား မြန်မာ|English|日本語 — ပြောင်းရင် tab အားလုံး လိုက်ပြောင်း + မှတ်ထား။\n• အောက် menu ခေါင်းစဉ်တွေပါ လိုက်ပြောင်းတယ်။' },
      { h: '🏠 ပင်မ', b: '• ယနေ့ တိုးတက်မှု% = Planner အမှတ်ခြစ် အစစ် (data မရှိရင် 0%)။\n• အမြန်လင့်ခ်များ + ဆရာ/admin ဆို Teacher လင့်ခ်။' },
      { h: '📚 အဘိဓာန် (~1340 လုံး)', b: '• ဂျပန်/မြန်မာ/အင်္ဂလိပ် ရှာ + Level chips (ဖိထားရင် level ရှင်းချက်) + ကတ်နှိပ်ဖွင့်။\n• 🔊 တစ်လုံး / ▶️All / ▶️From-here auto-playlist (JP/MM/EN + repeat 1-3x)။\n• Staff: ➕/✏️/🗑️ + 📥 Import (app/OpenJLPT JSON) / 📤 Export။ ကျောင်းသား = ကြည့်ရန် + Export သာ။' },
      { h: '📅 အချိန်ဇယား', b: '• Calendar ရက် ရွေး → မနက်/ညနေ ၅ ခုစီ အမှတ်ခြစ် → Home % တက်မယ်။\n• မှတ်စုတို ရေးနိုင်။ Data က ကိုယ့် device ထဲသိမ်း။' },
      { h: '📝 မှတ်စု', b: '• ကိုယ်ပိုင် CRUD (device ထဲ)။' },
      { h: '❓ Quiz & Skills (159)', b: '• Level quiz (70%+ နဲ့ နောက်အဆင့်ပွင့်) + Level Check (အဆင့်သတ်မှတ်) + 4 skills (TTS listening/reading/writing-input/speaking record)။\n• ✏️ ကိုယ်ပိုင်မေးခွန်း + 📥/📤 Import/Export (level pools မှာ တန်းပေါ်)။\n• 🤖 Bot: စကားလုံး/quiz/grammar ပုံစံတိုနဲ့မေး (`使い方` ကြည့်)။ စကားစမြည်အရှည် = မရသေး။' },
      { h: '👥 အဖွဲ့ (People)', b: '• Directory (search + presence 🟢🟡⚫ + tap DM) | Chats (DM + groups, 🎤 voice, 📎 files ≤500KB, long-press ဖျက်, 📋 copy) | My Profile (ကိုယ်ရေးဖြည့် + avatar + Drive backup) | Reports (admin)။\n• 🔔 Bell = စာအသစ် + PENDING approve (admin one-tap)။' },
      { h: '📚 စာကြည့် (Library)', b: '• Teacher Drive links (🌱 starter 29 + ➕ staff) — YouTube/Drive/mp3 in-app viewer။\n• 📖 Essay & Songs reader (tap-to-play, ▶️ all, auto-scroll) + ကိုယ်ပိုင် essays 📥/📤။\n• Library 📥 staff / 📤 အားလုံး။' },
      { h: '📖 သင်ခန်း (Class)', b: '• Staff: lessons/assignments ရေး (တစ်ဦးချင်း/Level/အားလုံး ခွဲပေး) + အဖြေစစ် + ရမှတ်(0-100)/အဆင့် + 🌱 နမူနာ + 📥/📤။\n• ကျောင်းသား: ကိုယ့်အတွက်သာ မြင် → အဖြေ+link+ပုံ တင် → ပြန်တင်ရင် အမှတ်ပျက် (ပြန်ပေးရန်)။' },
      { h: '🎓 ဆရာ/Admin', b: '• ✅/🔒 approve-disable, 🔄 role modal, 🔑 reset, 👤➕ အကောင့်ဖန်တီး (temp password + mailto/sms ပို့), 🗑️ ဖျက် (=ban, ပြန်ဖွင့်ရ)။\n• 📋 Activity log (latest 50) + 📥 full backup export + teacher bio + share။' },
      { h: '💡 Tips', b: '• Deploy/Update ပြီးတိုင်း browser Ctrl+F5 (cache!)။\n• Bot/Chat copy = 📋 ခလုတ်။ TTS အသံမထွက်ရင် device volume/voice စစ်ပါ။\n• Data backup: Profile → Google Drive Backup (ကိုယ့် Drive appData)။' },
    ],
  },
  en: {
    title: '🆘 Help — How to use',
    secs: [
      { h: '🚪 Start — Login/Register', b: '• Sign in/up with Email+Password or Google.\n• Roles are automatic (assigned by Admin, nothing to pick).\n• New accounts = PENDING until Admin approves. Forgot password → reset email.' },
      { h: '🌐 Language', b: '• Header switcher my|en|jp — applies to all tabs + saved.\n• Bottom tab titles follow too.' },
      { h: '🏠 Home', b: '• Today % is REAL (from Planner checks; 0% when empty).\n• Quick links + Teacher link for staff.' },
      { h: '📚 Dictionary (~1340)', b: '• Search JA/MM/EN + level chips (long-press = level guide) + tap-expand cards.\n• 🔊 per word / ▶️All / ▶️From-here playlists (JA/MM/EN + repeat 1-3x).\n• Staff: CRUD + 📥 import (app/OpenJLPT JSON) / 📤 export. Students: view + export.' },
      { h: '📅 Planner', b: '• Pick a date → morning/evening 5 checks each → Home % rises.\n• Short notes. Data stays on your device.' },
      { h: '📝 Notes', b: '• Personal CRUD (on-device).' },
      { h: '❓ Quiz & Skills (159)', b: '• Level quizzes (70%+ unlocks next) + Level Check (awards level) + 4 skills (TTS listening/reading/typing/speaking record).\n• ✏️ My questions + 📥/📤 import/export (auto-joined into level pools).\n• 🤖 Bot: short patterns only (`使い方`); no free chat yet.' },
      { h: '👥 People', b: '• Directory (search + presence 🟢🟡⚫ + tap DM) | Chats (DM + groups, 🎤 voice, 📎 ≤500KB, long-press delete, 📋 copy) | My Profile (+ avatar + Drive backup) | Reports (admin).\n• 🔔 Bell = new messages + PENDING approvals (admin one-tap).' },
      { h: '📚 Library', b: '• Teacher Drive links (🌱 29 starters + ➕ staff) — in-app YouTube/Drive/mp3 viewer.\n• 📖 Essays & Songs reader (tap-to-play, ▶️ all, auto-scroll) + personal essays 📥/📤.\n• Library 📥 staff / 📤 everyone.' },
      { h: '📖 Class', b: '• Staff: write lessons/assignments (individual/level/everyone) + grade with score (0-100)/level + 🌱 samples + 📥/📤.\n• Students: see only theirs → submit answer+link+photo → resubmit clears grade.' },
      { h: '🎓 Teacher/Admin', b: '• ✅/🔒 approve-disable, 🔄 role modal, 🔑 reset, 👤➕ create (temp password + mailto/sms), 🗑️ delete (=ban, unban-able).\n• 📋 Activity log (latest 50) + 📥 full backup + bio + share.' },
      { h: '💡 Tips', b: '• After every update: browser Ctrl+F5 (cache!).\n• Copy chat text via 📋. No TTS? Check device volume/voices.\n• Backup: Profile → Google Drive Backup (your own appData).' },
    ],
  },
  jp: {
    title: '🆘 ヘルプ — 使い方',
    secs: [
      { h: '🚪 開始 — ログイン/登録', b: '• メール+パスワード又はGoogleで入る。\n• 役割は自動 (管理者が付与)。新規 = PENDING (承認待ち)。' },
      { h: '🌐 言語', b: '• ヘッダー my|en|jp — 全タブに適用＋保存。' },
      { h: '🏠 ホーム', b: '• 今日%は実績 (Planner由来、空=0%)。クイックリンク。' },
      { h: '📚 辞書 (約1340)', b: '• 日/ミャンマー/英検索 + レベルchip (長押し=説明) + タップ展開。\n• 🔊単語 / ▶️連続再生 (日/ミャ/英+リピート)。\n• Staff: 編集+📥/📤。学生: 閲覧+📤。' },
      { h: '📅 プランナー', b: '• 日付→午前/午後5件チェック → Home%に反映。端末保存。' },
      { h: '📝 ノート', b: '• 個人メモ (端末保存)。' },
      { h: '❓ クイズ＆技能 (159)', b: '• レベルクイズ (70%で解放) + レベルチェック + 4技能 (TTS聴解/読解/入力/録音)。\n• ✏️自作問題 + 📥/📤。🤖Botは定型のみ。' },
      { h: '👥 仲間', b: '• 名簿 (検索+🟢🟡⚫+DM) | チャット (🎤音声/📎500KB以下/📋コピー) | プロフィール (+Drive backup) | 報告 (管理者)。\n• 🔔=新着+承認 (管理者ワンタップ)。' },
      { h: '📚 資料', b: '• 先生Driveリンク (🌱29+➕) — アプリ内再生。\n• 📖作文・歌リーダー + 自作📥/📤。📥は先生のみ/📤は全員。' },
      { h: '📖 授業', b: '• 先生: レッスン/課題 (個人/レベル/全員) + 得点(0-100)/レベル採点 + 🌱見本 + 📥/📤。\n• 学生: 自分宛のみ → 提出 (再提出で点数クリア)。' },
      { h: '🎓 先生/管理者', b: '• ✅/🔒承認・停止、🔄役割、🔑リセット、👤➕作成、🗑️削除 (=ban)。\n• 📋操作ログ (50件) + 📥全backup + 紹介文 + 共有。' },
      { h: '💡 Tips', b: '• 更新後はCtrl+F5 (キャッシュ!)。\n• コピーは📋。TTSが出ない時は音量/音声を確認。\n• Backupはプロフィール→Google Drive。' },
    ],
  },
};

export default function HelpScreen({ user, onLogout, navigation }) {
  const { lang } = useLanguage();
  const t = helpT[lang] || helpT.my;
  const goProfile = () => { try { navigation.navigate('Community', { seg: 'profile' }); } catch (e) {} };
  return (
    <SafeAreaView style={styles.container}>
      <AppHeader title={t.title} user={user} onLogout={onLogout} onProfilePress={goProfile} />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {t.secs.map((s, i) => (
          <View key={i} style={styles.card}>
            <Text style={styles.h}>{s.h}</Text>
            <Text style={styles.b}>{s.b}</Text>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  scroll: { padding: 12 },
  card: { backgroundColor: '#FFF', borderRadius: 10, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: '#EEE' },
  h: { fontSize: 14, fontWeight: 'bold', color: '#D32F2F', marginBottom: 6 },
  b: { fontSize: 12, color: '#444', lineHeight: 19 },
});

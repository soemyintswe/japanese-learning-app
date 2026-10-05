// BotPanel — offline rule-based study bot (no API key needed)
// Can: dictionary lookup (800 words), level-quiz launch, grammar mini-lessons,
// JLPT level guide, study tips, small talk. callbacks: onStartQuiz(level), onNavigate(tab)
import React, { useState, useRef } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, ScrollView, Platform, ActivityIndicator } from 'react-native';
import { dictionaryDatabase } from './dictionaryData/fullDictionary';
import { fullDictionary as modularDictionary } from './dictionaryData/index';

const ALL_WORDS = (() => {
  const seen = new Set();
  return [...(dictionaryDatabase || []), ...(modularDictionary || [])].filter((w) => {
    const k = `${w.japanese}||${w.reading || w.hiragana || ''}`;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
})();

const readingOf = (w) => w.reading || w.hiragana || '';

const GRAMMAR_TIPS = [
  {
    keys: ['は vs が', 'は が', 'wa ga', 'はとが'],
    title: 'は vs が',
    body: 'は = topic (အကြောင်းအရာ): わたしは学生です\nが = subject/emphasis: だれが来ますか。\nအသစ် မိတ်ဆက်တာ → が, သိပြီးသား အကြောင်း → は',
  },
  {
    keys: ['てform', 'てけい', 'te form', 'て形'],
    title: 'て-form',
    body: '辞書形 → て形: 食べる→食べて, 飲む→飲んで, 書く→書いて, 行く→行って\n〜てください (please), 〜ている (doing 〜) တို့နဲ့ တွဲသုံး',
  },
  {
    keys: ['ない', 'nai', 'negative', 'ปฏิเสธ'],
    title: 'ない-form (အငြင်း)',
    body: '辞書形 → ない形: 食べる→食べない, 行く→行かない, する→しない, 来る→来ない\n〜なければなりません = must, 〜なくてもいい = need not',
  },
  {
    keys: ['たい', 'tai', 'want'],
    title: '〜たい (လုပ်ချင်တယ်)',
    body: 'ます-stem + たい: 食べたい, 行きたい, 見たい\nအငြင်း → 〜たくない (行きたくない)',
  },
  {
    keys: ['potential', '可能', 'can', 'られる', 'える'],
    title: 'Potential form (နိုင်တယ်)',
    body: 'Group1: 書く→書ける / Group2: 食べる→食べられる / Irregular: する→できる, 来る→来られる\n〜ことができる လည်း သုံးလို့ရ',
  },
  {
    keys: ['から', 'ので', 'kara', 'node', 'reason', 'because', 'အကြောင်း'],
    title: 'から vs ので (…လို့)',
    body: '〜から = တိုက်ရိုက် အကြောင်း (strong): 雨が降るから、行かない\n〜ので = ယဉ်ကျေးသော အကြောင်း (soft): 熱があるので、休みます',
  },
  {
    keys: ['にへで', 'に vs', 'へ vs', 'で vs', 'place particle', '場所', 'သွား'],
    title: 'に / へ / で (နေရာ)',
    body: '学校に行く / 学校へ行く = ကျောင်းကို သွားတယ် (direction)\n学校で勉強する = ကျောင်းမှာ စာကျက်တယ် (action Place)\n学校にいる = ကျောင်းမှာ ရှိတယ် (exist Place)',
  },
  {
    keys: ['ている', 'teiru', 'progressive', 'ている'],
    title: '〜ている (နေသည်)',
    body: 'Action ဆက်ဖြစ်နေ: 食べている (စားနေတယ်)\nResult state: 結婚している (လက်ထပ်ပြီးသား), 知っている (သိတယ်)',
  },
];

const LEVEL_GUIDE = {
  N5: 'N5 — အခြေခံ (beginner): နေ့စဉ်သုံး စကားလုံး ~800',
  N4: 'N4 — အခြေခံအထက်: နေ့စဉ်သုံး ~1500',
  N3: 'N3 — အလယ်အလတ်: ~3000 (အလုပ်/ကျောင်းအခြေခံ)',
  N2: 'N2 — အလယ်အလတ်အထက်: ~6000 (အလုပ်လျှောက်ရန်)',
  N1: 'N1 — အမြင့်ဆုံး: ~10000 (သတင်းစာ/စာပေ)',
};

function stripPunct(s) {
  return s.trim().replace(/[？?！!。、…〜～「」『』"']/g, '').trim();
}

function findWords(q) {
  const raw = stripPunct(q);
  if (!raw) return [];
  const s = raw.toLowerCase();
  // 「Xとは」「Xって」pattern → X ထုတ်
  let key = s;
  const m = s.match(/^(.+?)(とは|って|って何|とは何|の意味|の読み方|ってなに)$/);
  if (m) key = m[1].trim();
  if (!key) return [];
  const rawKey = stripPunct(raw);
  return ALL_WORDS.filter((w) =>
    (w.japanese && (w.japanese.includes(raw) || w.japanese.includes(rawKey))) ||
    (readingOf(w) && readingOf(w).includes(key)) ||
    (w.myanmar && (w.myanmar.includes(raw) || w.myanmar.includes(rawKey))) ||
    (w.english && w.english.toLowerCase().includes(key))
  ).slice(0, 3);
}

function botReply(text, lang) {
  const t = text.trim();
  const low = t.toLowerCase();

  // --- greetings ---
  if (/^(hello|hi|hey|こんにちは|おはよう|こんばんは|ハロー|มิง?ဂလာပါ|မင်္ဂလာပါ|hello bot)/.test(low)) {
    return { text: lang === 'jp' ? 'こんにちは！🌸 単語・クイズ・文法の形で聞いてください（例: 先生とは？ / N5 quiz）。' : 'မင်္ဂလာပါ! 🌸\nစကားလုံး (`先生とは？`) / Quiz (`N5 quiz`) / Grammar (`は vs が`) — ပုံစံလေးတွေနဲ့ မေးပေးပါ 🙏' };
  }
  if (/^(bye|goodbye|さようなら|バイバイ|သွားပြီ|တာ့တာ)/.test(low)) {
    return { text: lang === 'jp' ? 'またね！頑張ってください 📚' : 'တာ့တာ! 👋 စာဆက်ကြိုးစားပါ 📚' };
  }
  if (/(thank|ありがとう|ကျေးဇူး)/.test(low)) {
    return { text: lang === 'jp' ? 'どういたしまして 😊' : 'ရပါတယ် 😊 ဆက်မေးပါ!' };
  }
  if (/(who are you|your name|名前|နင်ဘယ်သူ|မင်းဘယ်သူ|bot)/.test(low) && low.length < 30) {
    return { text: '🤖 ぼくは MKS Study Bot — အဘိဓာန် 800 လုံး + Quiz + Grammar tips နဲ့ ကူညီပေးမယ်!\n"使い方" လို့ ရိုက်ရင် အသုံးပြုနည်း ပြပေးမယ်။' };
  }
  if (/^(help|使い方|help me|အသုံးပြုနည်း|ဘယ်လိုသုံး)/.test(low)) {
    return {
      text: '📖 **အသုံးပြုနည်း**\n• စကားလုံးရှာ: `先生とは？` / `cat` / `ကြောင်`\n• Quiz: `N5 quiz` / `စာမေးပွဲ` / `level check`\n• Grammar: `は vs が` / `てform` / `たい` / `から`\n• Level: `N3 とは` (level ရှင်းချက်)\n• အောက်က အမြန်ခလုတ်တွေလည်း နှိပ်လို့ရတယ် 👇',
    };
  }
  // --- meta: "anything I ask?" → capability (NOT fallback) ---
  if (/(ကြိုက်တာ|ကြိုက်သလို|ဘာမေးမေး|ဘာတွေမေး|anything|what can you|お前は何が|何ができる|なにができる|できること)/.test(low)) {
    return {
      text: '👍 ဒါတွေ မေးလို့ရတယ်:\n• 📚 စကားလုံး 800: `先生とは？` / `cat` / `ကြောင်` (ဂျပန်/အင်္ဂလိပ်/မြန်မာ ကြိုက်ရာနဲ့ရှာ)\n• 🎯 Quiz: `N5 quiz` / `စာမေးပွဲ` / `level check`\n• 📘 Grammar: `は vs が` / `てform` / `から` / `たい`\n• 🎚️ Level: `N3 とは`\nစာကြောင်းအရှည်ကြီး စကားပြောတာတော့ မရသေးဘူး — ပုံစံလေးတွေနဲ့ မေးပေးပါ 🙏',
    };
  }

  // --- level quiz launch (synonyms broadened) ---
  const lvlM = t.match(/(N5|N4|N3|N2|N1)\s*(quiz|test|テスト|クイズ|မေးခွန်း|စာမေးပွဲ|試験|しけん|test me)/i);
  if (lvlM || /(quiz|クイズ|テスト|မေးခွန်း|စာမေးပွဲ|試験|しけん|quiz me)/.test(low)) {
    const lv = lvlM ? lvlM[1].toUpperCase() : 'N5';
    return { text: `🎯 ${lv} Quiz စမယ်! Good luck 🍀`, action: { type: 'quiz', level: lv } };
  }
  if (/(level check|placement|レベルチェック|အဆင့်စစ်|test my level)/.test(low)) {
    return { text: '📊 Level Check စမယ် — N5 ကနေ N1 အထိ 4 လုံးစီ, အောင်တဲ့ အမြင့်ဆုံးအဆင့် သတ်မှတ်ပေးမယ်!', action: { type: 'placement' } };
  }
  // --- level guide ---
  const lvM2 = t.match(/(N5|N4|N3|N2|N1)\s*(とは|って|とは何|level|level check|guide|အဆင့်)/i);
  if (lvM2 && !lvlM) {
    const lv = lvM2[1].toUpperCase();
    return { text: `🎚️ ${LEVEL_GUIDE[lv]}` };
  }
  // --- skills ---
  if (/(listening|リスニング|နားထောင်|listening test)/.test(low)) {
    return { text: '🎧 Listening လေ့ကျင့်မယ် — TTS အသံနားထောင်ပြီး ရွေးပါ!', action: { type: 'skill', skill: 'listening' } };
  }
  if (/(speaking|スピーキング|စကားပြော|speaking test)/.test(low)) {
    return { text: '🎤 Speaking လေ့ကျင့်မယ် — Model နားထောင် → record → ပြန်နားထောင်!', action: { type: 'skill', skill: 'speaking' } };
  }
  if (/(reading|読解|စာဖတ်)/.test(low)) {
    return { text: '📖 Reading လေ့ကျင့်မယ်!', action: { type: 'skill', skill: 'reading' } };
  }
  if (/(writing|作文|စာရေး|かき)/.test(low)) {
    return { text: '✍️ Writing လေ့ကျင့်မယ် — kana ရိုက်ထည့်ပြီး စစ်မယ်!', action: { type: 'skill', skill: 'writing' } };
  }
  // --- grammar tips ---
  for (const g of GRAMMAR_TIPS) {
    if (g.keys.some((k) => low.includes(k.toLowerCase()))) {
      return { text: `📘 **${g.title}**\n${g.body}` };
    }
  }
  // --- study plan ---
  if (/(plan|plan|အစီအစဉ်|study plan|プラン|schedule)/.test(low)) {
    return { text: '📅 Planner tab မှာ နေ့စဉ်အစီအစဉ် ဆွဲလို့ရတယ်!', action: { type: 'goto', tab: 'Planner' } };
  }
  // --- dictionary lookup (fallback before generic) ---
  const found = findWords(t);
  if (found.length > 0) {
    const lines = found.map((w) =>
      `• **${w.japanese}**${readingOf(w) ? ` (${readingOf(w)})` : ''} [${w.level || '?'}]\n  🇲🇲 ${w.myanmar || '—'}\n  🇬🇧 ${w.english || '—'}`
    ).join('\n');
    return { text: `📚 တွေ့ပြီ (${found.length}):\n${lines}` };
  }
  // --- fallback (dictionary already tried above → truly unknown) ---
  return {
    text: 'ဟင်… ဒီပုံစံ နားမလည်သေးဘူး 😅\nဒီလိုမေးကြည့်ပါ:\n• `猫とは？` / `dog` / `ပန်း`\n• `N4 quiz` / `စာမေးပွဲ` / `level check`\n• `から` / `てform` / `は vs が`\n• `N2 とは` / `使い方`',
  };
}

const QUICK = ['N5 Quiz 🎯', 'Level Check 📊', '🎧 Listening', '先生とは？', '使い方 📖'];

export default function BotPanel({ lang = 'my', onStartQuiz, onStartPlacement, onStartSkill, onNavigate }) {
  const [messages, setMessages] = useState([
    { from: 'bot', text: 'မင်္ဂလာပါ! 🤖 MKS Study Bot ပါ။\nစကားလုံး (`猫とは？`) / Quiz (`N5 quiz`) / Grammar (`から`) — ပုံစံလေးတွေနဲ့ မေးပေးပါ 🙏\n("使い方" = နမူနာများ)' },
  ]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const scrollRef = useRef(null);

  const pushMsg = (m) => setMessages((prev) => [...prev, m]);

  const runAction = (action) => {
    if (!action) return;
    if (action.type === 'quiz' && onStartQuiz) onStartQuiz(action.level);
    else if (action.type === 'placement' && onStartPlacement) onStartPlacement();
    else if (action.type === 'skill' && onStartSkill) onStartSkill(action.skill);
    else if (action.type === 'goto' && onNavigate) onNavigate(action.tab);
  };

  const send = (rawText) => {
    const text = (rawText !== undefined ? rawText : input).trim();
    if (!text || typing) return;
    setInput('');
    pushMsg({ from: 'user', text });
    setTyping(true);
    setTimeout(() => {
      const reply = botReply(text, lang);
      setTyping(false);
      pushMsg({ from: 'bot', text: reply.text });
      if (reply.action) {
        setTimeout(() => runAction(reply.action), 700);
      }
    }, 600);
  };

  const sendQuick = (q) => {
    // "N5 Quiz 🎯" → "N5 quiz" အဖြစ် bot က နားလည်အောင် ရှင်းမယ်
    const clean = q.replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\uFE0F ]/gu, ' ').replace(/\s+/g, ' ').trim();
    send(clean || q);
  };

  return (
    <View style={styles.wrap}>
      <ScrollView
        ref={scrollRef}
        style={styles.chat}
        contentContainerStyle={styles.chatInner}
        onContentSizeChange={() => scrollRef.current && scrollRef.current.scrollToEnd({ animated: true })}
      >
        {messages.map((m, i) => (
          <View key={i} style={[styles.bubble, m.from === 'user' ? styles.userBubble : styles.botBubble]}>
            <Text style={[styles.msgText, m.from === 'user' && styles.userText]}>{m.text}</Text>
          </View>
        ))}
        {typing && (
          <View style={[styles.bubble, styles.botBubble]}>
            <ActivityIndicator size="small" color="#D32F2F" />
          </View>
        )}
      </ScrollView>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.quickRow}>
        {QUICK.map((q) => (
          <TouchableOpacity key={q} style={styles.quickBtn} onPress={() => sendQuick(q)}>
            <Text style={styles.quickText}>{q}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          value={input}
          onChangeText={setInput}
          placeholder={lang === 'jp' ? '質問する… (例: 先生とは？)' : 'မေးခွန်းရိုက်ပါ… (ဥပမာ: 先生とは？)'}
          placeholderTextColor="#999"
          returnKeyType="send"
          onSubmitEditing={() => send()}
        />
        <TouchableOpacity style={styles.sendBtn} onPress={() => send()}>
          <Text style={{ fontSize: 18, color: '#FFF' }}>➤</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1 },
  chat: { flex: 1 },
  chatInner: { padding: 12, paddingBottom: 6 },
  bubble: { maxWidth: '85%', borderRadius: 12, padding: 10, marginBottom: 8 },
  botBubble: { backgroundColor: '#FFFFFF', alignSelf: 'flex-start', borderWidth: 1, borderColor: '#EEE', elevation: 1 },
  userBubble: { backgroundColor: '#1976D2', alignSelf: 'flex-end' },
  msgText: { fontSize: 13, color: '#333', lineHeight: 19 },
  userText: { color: '#FFF' },
  quickRow: { maxHeight: 44, paddingHorizontal: 10 },
  quickBtn: { borderWidth: 1, borderColor: '#D32F2F', borderRadius: 16, paddingHorizontal: 12, paddingVertical: 6, marginRight: 8, backgroundColor: '#FFF' },
  quickText: { fontSize: 12, color: '#D32F2F', fontWeight: '600' },
  inputRow: { flexDirection: 'row', padding: 10, alignItems: 'center' },
  input: { flex: 1, borderWidth: 1, borderColor: '#DDD', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8, fontSize: 13, backgroundColor: '#FFF', marginRight: 8 },
  sendBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#D32F2F', justifyContent: 'center', alignItems: 'center' },
});

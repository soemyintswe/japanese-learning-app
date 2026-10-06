// BotPanel — offline rule-based study bot (no API key needed)
// Can: dictionary lookup (~1300 words), level-quiz launch, grammar mini-lessons,
// JLPT level guide, study tips, small talk + MY data (planner/notes/scores) +
// SHARED data (library/members counts, own profile). callbacks: onStartQuiz(level), onNavigate(tab)
import React, { useState, useRef } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, ScrollView, Platform, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../src/firebase';
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
    keys: ['から', 'ので', 'kara', 'node', 'reason', 'because'],
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
    (w.japanese && (w.japanese.includes(rawKey) || w.japanese === key)) ||
    (readingOf(w) && readingOf(w).includes(key)) ||
    (w.myanmar && (w.myanmar.includes(rawKey) || w.myanmar.includes(key))) ||
    (w.english && w.english.toLowerCase().includes(key))
  ).slice(0, 3);
}

function botReply(text, lang, user) {
  const t = text.trim();
  const low = t.toLowerCase();

  // --- greetings ---
  if (/^(hello|hi|hey|good morning|good evening)\b|^(こんにちは|おはよう|こんばんは|ハロー)|^(မင်္ဂလာပါ|မဂ်လာပါ|ဟယ်လို)/.test(low)) {
    return { text: lang === 'jp' ? 'こんにちは！🌸 単語・クイズ・文法の形で聞いてください（例: 先生とは？ / N5 quiz）。' : 'မင်္ဂလာပါ! 🌸\nစကားလုံး (`先生とは？`) / Quiz (`N5 quiz`) / Grammar (`は vs が`) — ပုံစံလေးတွေနဲ့ မေးပေးပါ 🙏' };
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
      text: '👍 ဒါတွေ မေးလို့ရတယ်:\n• 📚 စကားလုံး: `先生とは？` / `cat` / `単語数`\n• 🎯 Quiz: `N5 quiz` / `စာမေးပွဲ` / `my level`\n• 📅 ကိုယ့်ဒေတာ: `ဒီနေ့ အစီအစဉ်` / `မှတ်စု` / `ရမှတ်` / `ကျွန်တော့်အကြောင်း`\n• 👥📚 အများ: `စာကြည့် ဘယ်နှခု` / `ကျောင်းသား ဘယ်နှယောက်`\n• 📘 Grammar: `は vs が` / `てform` / `から`\nစာကြောင်းအရှည် စကားပြောတာတော့ မရသေးဘူး 🙏',
    };
  }

  // --- small talk (offline patterns — true free chat needs AI API, roadmap) ---
  // Placed BEFORE quiz/grammar/dictionary so chit-chat is never swallowed.
  if (/(နေကောင်း|နေထိုင်ကောင်း|ကျန်းမာ|how are you|how r u|お元気|元気ですか|元気\?)/.test(low)) {
    return { text: lang === 'jp' ? '元気です！あなたは？😊「N5 quiz」で力試ししましょう！' : 'နေကောင်းပါတယ်! 😊\nခင်ဗျားရော နေကောင်းလား? စာတိုးတက်မှုသိချင်ရင် "my level" လို့ ရိုက်ကြည့်ပါ!' };
  }
  if (/(ဘာလုပ်နေ|ဘာတေ?လုပ်နေ|အလုပ်များ|what (are|r) (you|u) doing|なにしてる|何してる|なにしている)/.test(low)) {
    return { text: lang === 'jp' ? 'あなたを待っていました😊 一緒に「N5 quiz」しませんか？' : 'ခင်ဗျားကို စောင့်နေတာ 😊 အတူတူ `N5 quiz` ဖြေကြမလား?' };
  }
  if (/(ဗိုက်ဆာ|ထမင်းစား|ဆာတယ်|hungry|お腹|おなか|はらへった|腹減った)/.test(low)) {
    return { text: '🍚 ご飯を食べて、頑張りましょう！\nထမင်းစားပြီးမှ စာဆက်ကျက်ပါ — `食べる (たべる) = စားတယ်` မှတ်မိလား? 😊' };
  }
  if (/(ပင်ပန်း|မောတယ်|အိပ်ချင်|tired|sleepy|疲れた|つかれた|眠い|ねむい)/.test(low)) {
    return { text: '😴 お疲れ様！ခဏနားပြီး ပြန်ကျက်ပါ — `休む (やすむ) = နားတယ်` 💪' };
  }
  if (/(ရယ်|ဟာသ|ပျော်|funny|面白い|おもしろい|笑|わら)/.test(low)) {
    return { text: '😄 `笑う (わらう) = ရယ်တယ်` — ရယ်ပြီးရင် `N5 quiz` နဲ့ အမှတ်ယူမလား? 🎯' };
  }
  if (/(ချစ်|love|loved|好き|すき|愛|あいしてる)/.test(low) && low.length < 40) {
    return { text: '💖 `好き (すき) = ကြိုက်တယ်/ချစ်တယ်` — `わたしは日本語が好きです` (ဂျပန်စာ ကြိုက်တယ်) 😊' };
  }
  if (/(အသက်|အသက်ဘယ်လောက်|how old|年齢|何歳|なんさい)/.test(low)) {
    return { text: '🤖 ぼくは生まれたばかり！\n`何歳 (なんさい) = အသက်ဘယ်လောက်` — `〜歳です` နဲ့ ဖြေပါ (ဥပမာ: わたしは二十歳です)' };
  }
  if (/(ဘယ်မှာ|ဘယ်နား|where (are|r) (you|u)|どこにいる|どこですか)/.test(low)) {
    return { text: '📱 ぼくはこのアプリの中にいます！\n`どこ = ဘယ်မှာ` — Community tab မှာ သူငယ်ချင်းတွေနဲ့ စကားပြောလို့ရတယ် 👥' };
  }
  if (/(ရာသီဥတု|မိုးရွာ|နေပူ|weather|天気|てんき|雨|あめ)/.test(low) && low.length < 40) {
    return { text: '🌦️ `天気 (てんき) = ရာသီဥတု` / `雨 (あめ) = မိုး` — `今日はいい天気ですね` (ဒီနေ့ ရာသီဥတုကောင်းတယ်) 😊' };
  }
  if (/(bye|goodbye|さようなら|バイバイ|သွားပြီ|တာ့တာ|おやすみ|good ?night)/.test(low) && low.length < 30) {
    return { text: lang === 'jp' ? 'またね！頑張ってください 📚' : 'တာ့တာ! 👋 စာဆက်ကြိုးစားပါ 📚' };
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
  // --- MY planner today (AsyncStorage) ---
  if (/(ဒီနေ့|today|今日)/.test(low) && /(အစီအစဉ်|ဇယား|plan|予定|planner|တိုးတက်|progress|進捗)/.test(low)) {
    return { defer: async () => {
      try {
        const raw = await AsyncStorage.getItem('@japanese_planner_v1');
        const now = new Date();
        const key = `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`;
        const day = raw ? (JSON.parse(raw)[key] || null) : null;
        if (!day) return { text: '📅 ဒီနေ့ planner မှာ ဘာမှမရှိသေးဘူး — Planner tab မှာ မနက်/ညနေ အမှတ်ခြစ်လိုက်ပါ!' };
        const c = (s) => Object.values((day[s]) || {}).filter(Boolean).length;
        const m = c('morning'), e = c('evening'), tot = m + e;
        return { text: `📅 ဒီနေ့: မနက် ${m}/5, ညနေ ${e}/5 — စုစုပေါင်း ${tot}/10 (${Math.round((tot / 10) * 100)}%)${tot === 10 ? ' 🎉 ပြီးပြီ!' : ''}` };
      } catch (err) { return { text: 'planner ဖတ်မရဘူး 😅' }; }
    } };
  }
  // --- study plan ---
  if (/(plan|plan|အစီအစဉ်|study plan|プラン|schedule)/.test(low)) {
    return { text: '📅 Planner tab မှာ နေ့စဉ်အစီအစဉ် ဆွဲလို့ရတယ်! ("ဒီနေ့ အစီအစဉ်" လို့မေးရင် ဒီနေ့အခြေအနေပြပေးမယ်)', action: { type: 'goto', tab: 'Planner' } };
  }
  // --- MY notes (AsyncStorage) ---
  if (/(မှတ်စု|notes?|メモ)/.test(low)) {
    return { defer: async () => {
      try {
        const raw = await AsyncStorage.getItem('@japanese_notes_v1');
        const arr = raw ? JSON.parse(raw) : [];
        if (!arr.length) return { text: '📝 မှတ်စု မရှိသေးဘူး — Notes tab မှာ ရေးလိုက်ပါ!' };
        const kw = t.replace(/မှတ်စု|notes?|メモ|[?？。、！!…]/gi, '').trim().toLowerCase();
        const list = kw ? arr.filter((n) => ((n.title || '') + ' ' + (n.content || '')).toLowerCase().includes(kw)) : arr;
        if (!list.length) return { text: `🔍 "${kw}" နဲ့ မှတ်စု မတွေ့ဘူး.` };
        const top = list.slice(0, 5).map((n) => `• ${n.title || '(no title)'}`).join('\n');
        return { text: `📝 မှတ်စု ${arr.length} ခု${kw ? ` ("${kw}" → ${list.length})` : ''}:\n${top}${list.length > 5 ? `\n…+${list.length - 5}` : ''}` };
      } catch (err) { return { text: 'မှတ်စု ဖတ်မရဘူး 😅' }; }
    } };
  }
  // --- MY quiz progress (AsyncStorage) ---
  if (/(ရမှတ်|\bscore\b|my level|測定結果|^အဆင့်$|^レベル$|assessed)/.test(low)) {
    return { defer: async () => {
      try {
        const raw = await AsyncStorage.getItem('@japanese_quiz_progress_v1');
        const p = raw ? JSON.parse(raw) : {};
        const best = p.best || {};
        const order = ['N5', 'N4', 'N3', 'N2', 'N1'];
        const parts = order.filter((l) => best[l] != null).map((l) => `${l}: ${best[l]}%`);
        const a = p.assessed ? `🏅 သင့်အဆင့်: ${p.assessed}` : '📊 Level Check မဖြေရသေးဘူး — "level check" လို့ ရိုက်ပါ!';
        return { text: parts.length ? `📝 Quiz ရမှတ် (အကောင်းဆုံး):\n• ${parts.join('\n• ')}\n${a}` : `📝 Quiz မဖြေရသေးဘူး!\n${a}` };
      } catch (err) { return { text: 'ရမှတ် ဖတ်မရဘူး 😅' }; }
    } };
  }
  // --- dictionary counts (local data) ---
  if (/(စကားလုံး|単語|words?).*(ဘယ်နှ|ဘယ်လောက်|how many|စုစုပေါင်း|total)|^(အဘိဓာန်|辞書|dictionary)$/.test(low)) {
    const order = ['N5', 'N4', 'N3', 'N2', 'N1'];
    const counts = {};
    ALL_WORDS.forEach((w) => { const l = w.level || '?'; counts[l] = (counts[l] || 0) + 1; });
    const parts = order.filter((l) => counts[l]).map((l) => `${l}: ${counts[l]}`);
    return { text: `📖 အဘိဓာန် စုစုပေါင်း ${ALL_WORDS.length} လုံး:\n• ${parts.join('\n• ')}` };
  }
  // --- library counts (Firestore) ---
  if (/(စာကြည့်|စာအုပ်|library|資料|materials?).*(ဘယ်နှ|ဘယ်လောက်|how many|စုစုပေါင်း|list|ပြ)/.test(low)) {
    return { defer: async () => {
      try {
        const snap = await getDocs(collection(db, 'materials'));
        const arr = [];
        snap.forEach((d) => arr.push(d.data()));
        if (!arr.length) return { text: '📚 Library မှာ မရှိသေးဘူး.' };
        const top = arr.slice(0, 6).map((m) => `• ${m.title || ''} [${m.level || ''}]`).join('\n');
        return { text: `📚 Library စုစုပေါင်း ${arr.length} ခု:\n${top}${arr.length > 6 ? `\n…+${arr.length - 6}` : ''}` };
      } catch (err) { return { text: 'Library ဖတ်မရဘူး 😅' }; }
    } };
  }
  // --- members count (Firestore) ---
  if (/(ကျောင်းသား|ကျောင်း|လူ|members?|users?|学生).*(ဘယ်နှ|ဘယ်လောက်|how many|စုစုပေါင်း)|^(members|users|ကျောင်းသားများ)$/.test(low)) {
    return { defer: async () => {
      try {
        const snap = await getDocs(collection(db, 'users'));
        let s = 0, tc = 0, a = 0;
        snap.forEach((d) => {
          const r = ((d.data() || {}).role || 'student').toLowerCase();
          if (r === 'admin') a += 1; else if (r === 'teacher') tc += 1; else s += 1;
        });
        return { text: `👥 စုစုပေါင်း ${s + tc + a} ယောက် — 🎓 ကျောင်းသား ${s}, 👨‍🏫 ဆရာ ${tc}, 🛡️ Admin ${a}` };
      } catch (err) { return { text: 'စာရင်းဖတ်မရဘူး 😅' }; }
    } };
  }
  // --- my profile (own Firestore doc) ---
  if (/(ကျွန်တော့်|ကျမ၏|ကျနော့်|ကိုယ့်).*(အကြောင်း|profile|အဆင့်|プロフィール)|^(my profile|プロフィール|ကိုယ့်အကြောင်း)$/.test(low)) {
    return { defer: async () => {
      if (!user?.uid) return { text: 'Login ဝင်ပြီးမှ ကြည့်လို့ရမယ် 🙂' };
      try {
        const snap = await getDoc(doc(db, 'users', user.uid));
        const d = snap.exists() ? snap.data() : {};
        return { text: `🙍 ${d.name || user.name || ''}\n🎓 ${(d.role || '').toUpperCase()} • JLPT: ${d.jlpt || '—'}${d.testedLevel ? ` (✓${d.testedLevel})` : ''}\n📊 Status: ${d.status || ''}` };
      } catch (err) { return { text: 'profile ဖတ်မရဘူး 😅' }; }
    } };
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
  // NOTE: open-ended free chat needs an AI API (paid/online) — roadmap.
  // This offline bot matches patterns only, so always show what DOES work.
  return {
    text: 'ဟင်… ဒီစာကြောင်း ပုံစံ နားမလည်သေးဘူး 😅 (အရှည်စကားပြော = roadmap, API လိုတယ်)\nဒါတွေတော့ ရတယ်:\n• `猫とは？` / `dog` / `ပန်း` (စကားလုံး)\n• `N4 quiz` / `စာမေးပွဲ` / `my level` (Quiz+ရမှတ်)\n• `ဒီနေ့ အစီအစဉ်` / `မှတ်စု` / `ကျွန်တော့်အကြောင်း` (ကိုယ့်ဒေတာ)\n• `စာကြည့် ဘယ်နှခု` / `ကျောင်းသား ဘယ်နှယောက်` (အများ)\n• `から` / `てform` / `は vs が` / `使い方`',
  };
}

const QUICK = ['N5 Quiz 🎯', 'Level Check 📊', '🎧 Listening', '先生とは？', '使い方 📖'];

export default function BotPanel({ lang = 'my', user, onStartQuiz, onStartPlacement, onStartSkill, onNavigate }) {
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
    setTimeout(async () => {
      let reply = botReply(text, lang, user);
      if (reply && reply.defer) {
        try {
          reply = await reply.defer();
        } catch (e) {
          reply = { text: 'မှားသွားပြီ 😅 ထပ်ကြိုးစားကြည့်ပါ' };
        }
      }
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
            <Text selectable style={[styles.msgText, m.from === 'user' && styles.userText]}>{m.text}</Text>
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

// teachingSeed.js — starter lessons + assignments (staff taps 🌱 once; skips existing IDs)
// All content original (teacher-reviewable). Media links = verified public resources.
export const LESSON_SEED = [
  {
    id: 'seed_l1', level: 'N5', target: 'all',
    title: 'ひらがな あ行 — Hiragana A-row',
    body: 'あ(a)・い(i)・う(u)・え(e)・お(o)\nあさ(asa=မနက်) / いぬ(inu=ခွေး) / うみ(umi=ပင်လယ်) / えき(eki=ဘူတာ) / おかね(okane=ပိုက်ဆံ)\nအသံထွက်ကို Dictionary 🔊 နဲ့ နားထောင်ပြီး ၅ လုံးလုံး အလွတ်ရအောင်ကျက်ပါ။',
    mediaUrl: 'https://www.tofugu.com/japanese/learn-hiragana/',
  },
  {
    id: 'seed_l2', level: 'N5', target: 'all',
    title: '自己紹介 — Self-introduction pattern',
    body: 'はじめまして。わたしは ___ です。\n___ から来ました。___ 歳です。\nよろしくおねがいします。\n(ဥပမာ: はじめまして。わたしは Aung です。ミャンマーから来ました。20歳です。よろしくおねがいします。)\n___ နေရာမှာ ကိုယ့်အချက်အလက်ထည့်ပြီး အသံထွက်ဖတ်ကြည့်ပါ。',
    mediaUrl: '',
  },
  {
    id: 'seed_l3', level: 'N4', target: 'all',
    title: 'て-form 作り方 — How to make te-form',
    body: 'Group1: う→って (買う→買って), く→いて (書く→書いて), ぐ→いで (泳ぐ→泳いで), す→して (話す→話して), つ・ぬ・ぶ・む→んで (飲む→飲んで), る→って (切る→切って)\nGroup2: る→て (食べる→食べて)\nIrregular: する→して, 来る→来て (exception: 行く→行って)\n〜てください (please〜) / 〜ている (〜နေသည်) တို့နဲ့ တွဲသုံး。',
    mediaUrl: '',
  },
  {
    id: 'seed_l4', level: 'N5', target: 'all',
    title: 'カタカナ — Katakana basics',
    body: 'ア(a)・イ(i)・ウ(u)・エ(e)・オ(o)\nコーヒー(koohii=ကော်ဖီ) / パン(pan=ပေါင်မုန့်) / テレビ(terebi=တီဗီ) / コンピューター(konpyuutaa=ကွန်ပျူတာ)\n外来語 (နိုင်ငံခြားစကားလုံး) တွေကို Katakana နဲ့ရေး — ဆိုင်ဆိုင်းဘုတ်ဖတ်ကြည့်ပါ。',
    mediaUrl: 'https://www.tofugu.com/japanese/learn-katakana/',
  },
  {
    id: 'seed_l5', level: 'N5', target: 'all',
    title: '数と助数詞 — Numbers & counters',
    body: 'ひとつ・ふたつ・みっつ・よっつ・いつつ・むっつ・ななつ・やっつ・ここのつ・とお\n人: ひとり・ふたり・さんにん〜 / 円: ひゃくえん・せんえん・いちまんえん\nスーパーで値段を読んでみよう (300円=さんびゃくえん, 800円=はっぴゃくえん)。',
    mediaUrl: '',
  },
  {
    id: 'seed_l6', level: 'N4', target: 'all',
    title: '〜たい — Want to do',
    body: 'ます-stem + たい: 食べたい(たべたい=စားချင်တယ်) / 行きたい(いきたい=သွားချင်တယ်) / 見たい(みたい=ကြည့်ချင်တယ်)\nအငြင်း → 〜たくない (行きたくない=မသွားချင်ဘူး)\n質問: なにを 食べたいですか。— わたしは ラーメンが 食べたいです。',
    mediaUrl: '',
  },
];

export const ASSIGN_SEED = [
  {
    id: 'seed_a1', level: 'N5', target: 'all', targetLevel: 'N5', targetUids: [], due: '',
    title: '✍️ 自己紹介を書こう (N5)',
    desc: 'Seed L2 ပုံစံအတိုင်း ကိုယ့်မိတ်ဆက် ၅ ကြောင်းရေးပါ (なまえ・くに・とし・しごと/がっこう・よろしく)。\nစာရွက်ဓာတ်ပုံ တွဲတင်လည်းရ, စာရိုက်တင်လည်းရ。',
  },
  {
    id: 'seed_a2', level: 'N5', target: 'level', targetLevel: 'N5', targetUids: [], due: '',
    title: '👨‍👩‍👧 家族を紹介しよう (N5)',
    desc: 'ကိုယ့်မိသားစုအကြောင်း ၅ ကြောင်းရေးပါ (〜は〜です / 〜にんです / 〜さいです သုံးရန်)。\nEssay「わたしの家族」ကို နမူနာကြည့်နိုင်တယ်。',
  },
  {
    id: 'seed_a3', level: 'N4', target: 'level', targetLevel: 'N4', targetUids: [], due: '',
    title: '📓 日記を書こう — て-form (N4)',
    desc: 'မနေ့က လုပ်ခဲ့တာ ၅ ခု て-form သုံးပြီး နေ့စဉ်မှတ်တမ်းရေးပါ (〜たり〜たり / 〜てから / 〜てもいい ရွေးသုံး ၁ ခု ပါရမယ်)。',
  },
  {
    id: 'seed_a4', level: 'N5', target: 'all', targetLevel: 'N5', targetUids: [], due: '',
    title: '🍞 コンビニで買おう (N5)',
    desc: 'Katakana စကားလုံး ၅ လုံး ဆိုင်မှာ ရှာဖတ်ပြီး ရေးပါ (コーヒー・パン・テレビ… မဟုတ် — အပြင်မှာ တွေ့တာ)။\nဓာတ်ပုံ တွဲတင်နိုင်တယ် (ဆိုင်နာမည်မပါစေနဲ့)။',
  },
  {
    id: 'seed_a5', level: 'N5', target: 'level', targetLevel: 'N5', targetUids: [], due: '',
    title: '🔢 値段を読もう (N5)',
    desc: 'ဈေးနှုန်း ၅ ခု ဂျပန်လို အသံထွက်ရေးပါ (ဥပမာ 300円→さんびゃくえん)။\nSeed L5 (Numbers & counters) ပြန်ကြည့်နိုင်တယ်။',
  },
  {
    id: 'seed_a6', level: 'N4', target: 'level', targetLevel: 'N4', targetUids: [], due: '',
    title: '💭 〜たい作文 (N4)',
    desc: '〜たい သုံးပြီး လုပ်ချင်တာ ၃ ခု + အကြောင်းပြချက် ၁ ခုစီ ရေးပါ (〜から/ので တွဲသုံး)။\nဥပမာ: 日本へ行きたいです。アニメを見たいからです。',
  },
];

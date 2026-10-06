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
];

// N5 Quiz bank — { id, level, skill, question, speakText?, passage?, options[], correctIndex, explanation, mediaUrl? }
// skills: vocab | grammar | reading | listening
export const n5Quiz = [
  // ---- Vocabulary ----
  { id: 'n5q01', level: 'N5', skill: 'vocab', question: '「猫」の読み方は？', options: ['ねこ', 'いぬ', 'とり', 'さかな'], correctIndex: 0, explanation: '猫（ねこ）= ကြောင်' },
  { id: 'n5q02', level: 'N5', skill: 'vocab', question: '「食べる」の意味は？', options: ['သောက်သည်', 'စားသည်', 'သွားသည်', 'လာသည်'], correctIndex: 1, explanation: '食べる（たべる）= စားသည်' },
  { id: 'n5q03', level: 'N5', skill: 'vocab', question: '「学校」の読み方は？', options: ['がっこう', 'びょういん', 'ぎんこう', 'としょかん'], correctIndex: 0, explanation: '学校（がっこう）= ကျောင်း' },
  { id: 'n5q04', level: 'N5', skill: 'vocab', question: '「赤い」の意味は？', options: ['ပြာသော', 'နီသော', 'ဖြူသော', 'မည်းသော'], correctIndex: 1, explanation: '赤い（あかい）= နီသော' },
  { id: 'n5q05', level: 'N5', skill: 'vocab', question: '「静か」の反対は？', options: ['にぎやか', 'きれい', 'ゆうめい', 'しんせつ'], correctIndex: 0, explanation: '静か（しずか, တိတ်ဆိတ်သော）⇔ 賑やか（にぎやか, စည်ကားသော）' },
  { id: 'n5q06', level: 'N5', skill: 'vocab', question: '「明日」の読み方は？', options: ['あした', 'きょう', 'きのう', 'あさって'], correctIndex: 0, explanation: '明日（あした）= မနက်ဖြန်' },
  { id: 'n5q07', level: 'N5', skill: 'vocab', question: '「お金」の意味は？ (お金)', options: ['ပိုက်ဆံ', 'အချိန်', 'လူ', 'ရေ'], correctIndex: 0, explanation: 'お金（おかね）= ပိုက်ဆံ' },
  { id: 'n5q08', level: 'N5', skill: 'vocab', question: '「 Nihon 」の正しい書き方は？', options: ['日本', '日本語', '日曜日', '本人'], correctIndex: 0, explanation: '日本（にほん/にっぽん）= ဂျပန်နိုင်ငံ' },
  // ---- Grammar ----
  { id: 'n5q09', level: 'N5', skill: 'grammar', question: 'わたし ___ 学生です。', options: ['は', 'が', 'を', 'に'], correctIndex: 0, explanation: 'X は Y です = X က Y ဖြစ်သည် (topic は)' },
  { id: 'n5q10', level: 'N5', skill: 'grammar', question: 'ご飯 ___ 食べます。', options: ['を', 'に', 'へ', 'で'], correctIndex: 0, explanation: 'Object + を + verb (ご飯を食べます = ထမင်းစားသည်)' },
  { id: 'n5q11', level: 'N5', skill: 'grammar', question: '学校 ___ 行きます。', options: ['に', 'を', 'が', 'と'], correctIndex: 0, explanation: 'Place + に + 行きます (destination に)' },
  { id: 'n5q12', level: 'N5', skill: 'grammar', question: '友達 ___ 電話します。', options: ['に', 'を', 'へ', 'が'], correctIndex: 0, explanation: '相手 + に (တစ်စုံတစ်ယောက်ကို → に)' },
  { id: 'n5q13', level: 'N5', skill: 'grammar', question: '図書館 ___ 本を読みます。', options: ['で', 'に', 'へ', 'を'], correctIndex: 0, explanation: 'Action の場所 + で (図書館で = စာကြည့်တိုက်မှာ)' },
  { id: 'n5q14', level: 'N5', skill: 'grammar', question: 'これは ___ 本ですか。', options: ['だれの', 'なんの', 'どこの', 'いくつの'], correctIndex: 0, explanation: 'だれの = ဘယ်သူ့ဟာလဲ (possession)' },
  { id: 'n5q15', level: 'N5', skill: 'grammar', question: '昨日、映画を ___。', options: ['見ました', '見ます', '見たい', '見ない'], correctIndex: 0, explanation: '昨日 (past) → ました (past polite)' },
  { id: 'n5q16', level: 'N5', skill: 'grammar', question: '日本語が ___ たいです。', options: ['話し', '話す', '話して', '話した'], correctIndex: 0, explanation: 'ます-stem + たい = want to (話したい)' },
  // ---- Reading ----
  { id: 'n5q17', level: 'N5', skill: 'reading', question: 'たなかさんは何歳ですか。', passage: 'はじめまして。わたしは たなかです。20歳です。学生です。まいあさ 7時に おきます。', options: ['18歳', '20歳', '7歳', '学生'], correctIndex: 1, explanation: '20歳（はたち）です と書いてある' },
  { id: 'n5q18', level: 'N5', skill: 'reading', question: 'たなかさんは朝何時に起きますか。', passage: 'はじめまして。わたしは たなかです。20歳です。学生です。まいあさ 7時に おきます。', options: ['6時', '7時', '8時', '20時'], correctIndex: 1, explanation: 'まいあさ 7時に おきます' },
  // ---- Listening (speakText を TTS で再生) ----
  { id: 'n5q19', level: 'N5', skill: 'listening', question: '聞こえた言葉は？', speakText: 'おはようございます', options: ['おはようございます', 'こんばんは', 'おやすみなさい', 'さようなら'], correctIndex: 0, explanation: 'おはようございます = မင်္ဂလာနံနက်ခင်း' },
  { id: 'n5q20', level: 'N5', skill: 'listening', question: '聞こえた数字は？', speakText: 'きっぷを二枚ください', options: ['一枚', '二枚', '三枚', '切符なし'], correctIndex: 1, explanation: '二枚（にまい）= ၂ စောင်' },
  { id: 'n5q21', level: 'N5', skill: 'listening', question: '聞こえた時間は？', speakText: 'じゅぎょうは九時からです', options: ['7時から', '8時から', '九時から', '10時から'], correctIndex: 2, explanation: '九時（くじ）から = ၉ နာရီကနေ' },
  { id: 'n5q22', level: 'N5', skill: 'vocab', question: '「大きい」の反対は？', options: ['小さい', '新しい', '古い', '長い'], correctIndex: 0, explanation: '大きい（おおきい) ⇔ 小さい（ちいさい)' },
];

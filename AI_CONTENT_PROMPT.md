# AI Content Prompt — JapaneseStudyPlanner bulk content (JA/MM/EN trilingual)

> ဤ file ကို အခြား AI (ChatGPT/Gemini/Claude...) ကို ပေးပြီး content အမြောက်အမြား ထုတ်ခိုင်းရန်။
> Output は下の JSON formats အတိုင်း — App ထဲ 📥 Import နဲ့ တိုက်ရိုက်ထည့်လို့ရ (Dictionary/Quiz customs/Library/Essays/Teaching)။

---

## COPY-PASTE PROMPT (English + မြန်မာ):

```
You are creating study content for a Japanese learning app used by Myanmar students
(JLPT N5→N1). EVERY item MUST be trilingual: Japanese + Myanmar + English.

RULES:
1. If the source material is Japanese-only, ADD your own Myanmar and English translations.
   - Myanmar glosses must be ORIGINAL (never copy from another dictionary).
   - Keep them short (dictionary = 1-5 words; essays = 1 natural sentence per line).
2. Output ONLY valid JSON (no markdown fences, no explanations) in EXACTLY one of the
   schemas below. Batch size: max 50 items per reply.
3. Readings: kana only (hiragana/katakana), e.g. "たべる", NOT romaji.
4. Levels: N5 | N4 | N3 | N2 | N1 | All. Match standard JLPT level lists
   (ref: OpenJLPT word lists, CC BY-SA 4.0 — level assignments only, glosses original).
5. NO copyrighted song lyrics, NO copied exam questions, NO copied textbook passages.
   Essays/songs: write ORIGINAL essays, or traditional public-domain songs only
   (e.g. さくら さくら, うみ, ちょうちょう, ふるさと verse 1 — pre-1930 works).
6. Quiz: 4 options max, exactly ONE correct (correctIndex 0-based), simple explanation
   in Myanmar. Mix skills across the batch if asked for "mixed".
7. Library: ONLY real, working https URLs you are confident exist
   (official sites, known YouTube channels). NO dead links, NO URL guessing.
8. Dedupe: do not repeat common words already in the app
   (e.g. 食べる, 学校, 猫, 水, 大きい, 先生, 切手, 診察, 邂逅 — assume basics exist).

SCHEMA A — Dictionary words (output as {"words":[...]}):
{"japanese":"切手","reading":"きって","myanmar":"တံဆိပ်ခေါင်း","english":"Postage stamp","pos":"noun","level":"N5"}
pos ∈ noun|verb|adj-i|adj-na|adverb|pronoun|conjunction|expression|number

SCHEMA B — Quiz questions (output as {"questions":[...]}):
{"question":"「切手」の読み方は？","options":["きって","きっぷ","ふうとう","はがき"],"correctIndex":0,"level":"N5","explanation":"切手（きって）= တံဆိပ်ခေါင်း","mediaUrl":""}

SCHEMA C — Library links (output as {"materials":[...]}):
{"title":"Tae Kim — Japanese Grammar Guide","desc":"N5~N3 သဒ္ဒါ အခမဲ့လမ်းညွှန်","level":"All","type":"doc","url":"https://guidetojapanese.org/learn/"}
type ∈ doc|video|audio|link ; level ∈ N5|N4|N3|N2|N1|All

SCHEMA D — Essays & songs (output as {"essays":[...]}):
{"title":"買い物","kind":"essay","level":"N5","lines":[{"ja":"〜。","reading":"〜。","mm":"မြန်မာပြန်။"}]}
kind ∈ essay|song ; 5-8 lines per item.

SCHEMA E — Lessons & assignments (output as {"lessons":[],"assignments":[]}):
lesson: {"title":"…","body":"…","level":"N5","mediaUrl":"","target":"all"}
assignment: {"title":"…","desc":"…","level":"N5","due":"","target":"all","targetLevel":"N5","targetUids":[]}
target ∈ all|level|students. submission grades: staff gives score (0-100) + level (N5-N1) per student answer; resubmit clears old grade.

Now produce: <—ここに欲しいものを書く / ဒီမှာ လိုချင်တာရေး: e.g. "N4 nouns 50, Schema A" —>
```

## IMPORT PATHS (after the other AI replies):

| Schema | App location | How |
|---|---|---|
| A words | Dictionary tab → 📥 | paste JSON or pick file (app + OpenJLPT formats OK) |
| B questions | Quiz tab → ✏️ My Questions → 📥 | customs merge into level pools automatically |
| C materials | Library tab → 📥 (staff) | https-only validated, dupe by title+url |
| D essays | Library → Essays seg → 📥 | personal device list, reader works instantly |
| E teaching | Class tab → 📥 (staff) | `{lessons, assignments}`, same-id skipped |

## NOTES FOR OWNER:
- Other-AI output ကို Import မလုပ်ခင်: JSON valid ဖြစ်မဖြစ် + readings kana ဟုတ်/မဟုတ် + Myanmar original ဟုတ်/မဟုတ် အမြန်စစ်ပါ (wrong-level words များ levels ပြန်စစ်ရ).
- Bulk bank files (code) ထဲ တိုက်ရိုက်ထည့်ချင်ရင် developer/AI ကို ဒီ file + output JSON ပေးလိုက်ပါ.
- Copyright: lyrics/textbook/exam-copy ပါလာရင် REJECT (policy: HANDOVER 6.7/6.9).

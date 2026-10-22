// components/KanaScreen.js — あ 五十音表 (Hiragana/Katakana) + tap-to-hear TTS
// Local data only (guest/offline OK). Katakana = hiragana +0x60 code conversion.
import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Speech from 'expo-speech';
import Svg, { Path } from 'react-native-svg';
import AppHeader from './AppHeader';
import { useLanguage } from '../src/LanguageContext';
import STROKES from './kanaStrokes.json';

const tX = {
  my: {
    title: 'あ ဂျပန်အက္ခရာ (五十音)',
    base: 'အခြေခံ (あ行〜ら行)', daku: 'သံတိုး (が〜ぱ行)', youon: 'ပေါင်းထုတ် (ゃゅょ)', spec: 'အထူးစာလုံး',
    hint: 'စာလုံး နှိပ် → 🔊 အသံထွက် နားထောင်ပါ · a=အ i=ိ u=ု e=ေ o=ော',
    tap: 'စာလုံး ရွေးပြီး နှိပ်ပါ', speakAll: '🔊 တစ်ကြောင်းလုံး နားထောင်',
    stroke: '✍ ရေးပုံ (書き順)', replay: '▶ ပြန်ကြည့်', strokes: 'အဆင့်',
    strokeHint: 'လက်နဲ့ လိုက်ရေးကြည့်ပါ — အနီရောင် = ရေးပြီး, မီးခိုးရောင် = ရေးရန်',
    attrib: 'Stroke data: KanjiVG (CC BY-SA 3.0) — kanjivg.tagaini.net',
  },
  en: {
    title: 'あ Kana Chart (Gojuon)',
    base: 'Basic (a〜ra)', daku: 'Voiced (ga〜pa)', youon: 'Combos (ゃゅょ)', spec: 'Special',
    hint: 'Tap a kana → 🔊 hear it · a/i/u/e/o vowels',
    tap: 'Select a kana', speakAll: '🔊 Hear whole row',
    stroke: '✍ Stroke order', replay: '▶ Replay', strokes: 'step',
    strokeHint: 'Trace along — red = drawn, grey = next',
    attrib: 'Stroke data: KanjiVG (CC BY-SA 3.0) — kanjivg.tagaini.net',
  },
  jp: {
    title: 'あ 五十音表',
    base: '基本 (あ行〜ら行)', daku: '濁音 (が〜ぱ行)', youon: '拗音 (ゃゅょ)', spec: '特殊文字',
    hint: '文字をタップ → 🔊 発音を聞く',
    tap: '文字を選んでタップ', speakAll: '🔊 行をまとめて聞く',
    stroke: '✍ 書き順', replay: '▶ やり直し', strokes: 'ステップ',
    strokeHint: '赤=書いた stroke, 灰=次の stroke',
    attrib: 'Stroke data: KanjiVG (CC BY-SA 3.0) — kanjivg.tagaini.net',
  },
};

// [kana, romaji, mm] triples — mm = မြန်မာအသံနှိုင်း (original, per-kana)
const BASE_ROWS = [
  [['あ', 'a', 'အ'], ['い', 'i', 'ိ'], ['う', 'u', 'ု'], ['え', 'e', 'ေ'], ['お', 'o', 'ော']],
  [['か', 'ka', 'က'], ['き', 'ki', 'ကိ'], ['く', 'ku', 'ကု'], ['け', 'ke', 'ကေ'], ['こ', 'ko', 'ကော']],
  [['さ', 'sa', 'စ'], ['し', 'shi', 'ရှိ'], ['す', 'su', 'စု'], ['せ', 'se', 'စေ'], ['そ', 'so', 'စော']],
  [['た', 'ta', 'တ'], ['ち', 'chi', 'ချိ'], ['つ', 'tsu', 'တု'], ['て', 'te', 'တေ'], ['と', 'to', 'တော']],
  [['な', 'na', 'န'], ['に', 'ni', 'နိ'], ['ぬ', 'nu', 'နု'], ['ね', 'ne', 'နေ'], ['の', 'no', 'နော']],
  [['は', 'ha', 'ဟ'], ['ひ', 'hi', 'ဟိ'], ['ふ', 'fu', 'ဖူ'], ['へ', 'he', 'ဟေ'], ['ほ', 'ho', 'ဟော']],
  [['ま', 'ma', 'မ'], ['み', 'mi', 'မိ'], ['む', 'mu', 'မု'], ['め', 'me', 'မေ'], ['も', 'mo', 'မော']],
  [['や', 'ya', 'ယ'], ['ゆ', 'yu', 'ယု'], ['よ', 'yo', 'ယော']],
  [['ら', 'ra', 'ရ'], ['り', 'ri', 'ရိ'], ['る', 'ru', 'ရု'], ['れ', 're', 'ရေ'], ['ろ', 'ro', 'ရော']],
  [['わ', 'wa', 'ဝါ'], ['を', 'wo', 'ဝိ'], ['ん', 'n', 'င်']],
];
const DAKU_ROWS = [
  [['が', 'ga', 'ဂ'], ['ぎ', 'gi', 'ဂိ'], ['ぐ', 'gu', 'ဂု'], ['げ', 'ge', 'ဂေ'], ['ご', 'go', 'ဂော']],
  [['ざ', 'za', 'ဇ'], ['じ', 'ji', 'ဂျိ'], ['ず', 'zu', 'ဇု'], ['ぜ', 'ze', 'ဇေ'], ['ぞ', 'zo', 'ဇော']],
  [['だ', 'da', 'ဒ'], ['ぢ', 'di', 'ဒျိ'], ['づ', 'du', 'ဒု'], ['で', 'de', 'ဒေ'], ['ど', 'do', 'ဒော']],
  [['ば', 'ba', 'ဘ'], ['び', 'bi', 'ဘိ'], ['ぶ', 'bu', 'ဘု'], ['べ', 'be', 'ဘေ'], ['ぼ', 'bo', 'ဘော']],
  [['ぱ', 'pa', 'ဖ'], ['ぴ', 'pi', 'ဖိ'], ['ぷ', 'pu', 'ဖု'], ['ぺ', 'pe', 'ဖေ'], ['ぽ', 'po', 'ဖော']],
];
// [kana, romaji, mm]
const YOUON = [
  ['きゃ', 'kya', 'ကျ'], ['きゅ', 'kyu', 'ကျူ'], ['きょ', 'kyo', 'ကျော'],
  ['しゃ', 'sha', 'ရှ'], ['しゅ', 'shu', 'ရှူ'], ['しょ', 'sho', 'ရှော'],
  ['ちゃ', 'cha', 'ချ'], ['ちゅ', 'chu', 'ချူ'], ['ちょ', 'cho', 'ချို'],
  ['にゃ', 'nya', 'နျ'], ['にゅ', 'nyu', 'နျူ'], ['にょ', 'nyo', 'နျော'],
  ['ひゃ', 'hya', 'ဟျ'], ['ひゅ', 'hyu', 'ဟျူ'], ['ひょ', 'hyo', 'ဟျော'],
  ['みゃ', 'mya', 'မျ'], ['みゅ', 'myu', 'မျူ'], ['みょ', 'myo', 'မျော'],
  ['りゃ', 'rya', 'ရျ'], ['りゅ', 'ryu', 'ရျူ'], ['りょ', 'ryo', 'ရျော'],
  ['じゃ', 'ja', 'ဂျ'], ['じゅ', 'ju', 'ဂျူ'], ['じょ', 'jo', 'ဂျို'],
];
const SPECIAL = [
  ['っ', 'tsu — double next consonant (さっか)', 'ဆိုင်း + နောက်သက် ၂ ကြိမ်ခေါ်'],
  ['ん', 'n (n/ng/m by sound)', 'င် (nasal)'],
  ['ー', 'long vowel (ラーメン)', 'အသံရှည်'],
];

const toKata = (ch) => {
  const c = ch.codePointAt(0);
  return (c >= 0x3041 && c <= 0x3096) ? String.fromCodePoint(c + 0x60) : ch;
};
const speak = (word) => {
  try { Speech.speak(word, { language: 'ja', rate: 0.8 }); } catch (e) {}
};

// きゃ (combo) → main kana き; ー etc → null (button hidden)
const strokesFor = (ch) => (!ch ? null : STROKES[ch] || STROKES[ch[0]] || null);

export default function KanaScreen({ user, onLogout }) {
  const { lang } = useLanguage();
  const t = tX[lang] || tX.my;
  const [kata, setKata] = useState(false);
  const [sel, setSel] = useState(null);
  const [strokeOpen, setStrokeOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [playKey, setPlayKey] = useState(0);

  const strokes = strokesFor(sel?.k || '');
  const total = strokes ? strokes.length : 0;

  // sequential stroke reveal: advance every 650ms until done
  useEffect(() => {
    if (!strokeOpen) return undefined;
    setStep(total > 0 ? 1 : 0);
    if (total <= 1) return undefined;
    const iv = setInterval(() => {
      setStep((s) => {
        if (s >= total) { clearInterval(iv); return s; }
        return s + 1;
      });
    }, 650);
    return () => clearInterval(iv);
  }, [strokeOpen, sel, total, playKey]);

  const show = (ch) => (kata ? toKata(ch) : ch);
  const pick = (k, r, mm) => { const it = { k: show(k), r, mm }; setSel(it); speak(it.k); };

  const Cell = ({ k, r, mm }) => (
    <TouchableOpacity style={styles.cell} onPress={() => pick(k, r, mm)} activeOpacity={0.7}>
      <Text style={styles.kana}>{show(k)}</Text>
      <Text style={styles.romaji}>{r}</Text>
      <Text style={styles.mm}>{mm}</Text>
    </TouchableOpacity>
  );

  const StrRow = ({ row }) => (
    <View style={styles.row}>
      {row.map(([k, r, mm], i) => (
        <Cell key={k + i} k={k} r={r} mm={mm} />
      ))}
    </View>
  );

  const Section = ({ title, children }) => (
    <View style={styles.section}>
      <Text style={styles.secTitle}>{title}</Text>
      {children}
    </View>
  );

  const speakRow = (row) => speak(row.map(([k]) => show(k)).join(' '));

  return (
    <SafeAreaView style={styles.container}>
      <AppHeader title={t.title} user={user} onLogout={onLogout} onProfilePress={undefined} />
      {/* Pinned top (ပုံသေ) — toggle + hint + selected detail: scroll မလုပ် */}
      <View style={styles.fixedTop}>
        <View style={styles.toggleRow}>
          {[['あ', false], ['ア', true]].map(([label, val]) => (
            <TouchableOpacity
              key={label}
              style={[styles.tgBtn, kata === val && styles.tgActive]}
              onPress={() => { setKata(val); setSel(null); }}
            >
              <Text style={[styles.tgText, kata === val && styles.tgTextActive]}>
                {val ? 'カタカナ' : 'ひらがな'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <Text style={styles.hint}>{t.hint}</Text>

        {/* Selected detail */}
        <View style={styles.selBox}>
          {sel ? (
            <>
              <Text style={styles.selKana}>{sel.k}</Text>
              <Text style={styles.selRomaji}>{sel.r}</Text>
              <Text style={styles.selMm}>{sel.mm}</Text>
              <TouchableOpacity style={styles.speakBtn} onPress={() => speak(sel.k)}>
                <Text style={styles.speakText}>🔊 {sel.k}</Text>
              </TouchableOpacity>
              {!!strokes && (
                <TouchableOpacity style={styles.strokeBtn} onPress={() => setStrokeOpen(true)}>
                  <Text style={styles.strokeBtnText}>{t.stroke}</Text>
                </TouchableOpacity>
              )}
            </>
          ) : (
            <Text style={styles.selEmpty}>{t.tap}</Text>
          )}
        </View>
      </View>

      {/* Chart area only — အောက်ဘက်ဇယားတွေ ပဲ scroll ရ (အပေါ်က ပုံသေ) */}
      <ScrollView contentContainerStyle={styles.scroll}>
        <Section title={t.base}>
          {BASE_ROWS.map((row) => (
            <View key={row[0][0]}>
              <TouchableOpacity style={styles.rowSpeak} onPress={() => speakRow(row)}>
                <Text style={styles.rowSpeakText}>{t.speakAll}</Text>
              </TouchableOpacity>
              <StrRow row={row} />
            </View>
          ))}
        </Section>

        <Section title={t.daku}>
          {DAKU_ROWS.map((row) => (
            <StrRow key={row[0][0]} row={row} />
          ))}
        </Section>

        <Section title={t.youon}>
          <View style={styles.rowWrap}>
            {YOUON.map(([k, r, mm]) => (
              <Cell key={k} k={k} r={r} mm={mm} />
            ))}
          </View>
        </Section>

        <Section title={t.spec}>
          {SPECIAL.map(([k, r, mm]) => (
            <TouchableOpacity key={k} style={styles.specRow} onPress={() => pick(k, r, mm)} activeOpacity={0.7}>
              <Text style={styles.specKana}>{show(k)}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.romaji}>{r}</Text>
                <Text style={styles.mm}>{mm}</Text>
              </View>
              <Text style={styles.specSpeak}>🔊</Text>
            </TouchableOpacity>
          ))}
        </Section>
      </ScrollView>

      {/* 書き順 stroke-order modal — KanjiVG data, sequential reveal */}
      <Modal visible={strokeOpen} transparent animationType="fade" onRequestClose={() => setStrokeOpen(false)}>
        <View style={styles.modalBack}>
          <View style={styles.modalCard}>
            <Text style={styles.modalKana}>{sel ? sel.k : ''}</Text>
            <View style={styles.svgBox}>
              <Svg viewBox="0 0 109 109" width={230} height={230}>
                {(strokes || []).map((d, i) => (
                  <Path
                    key={i}
                    d={d}
                    stroke={i < step ? '#D32F2F' : '#E0E0E0'}
                    strokeWidth={i === step - 1 ? 5 : 3.5}
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                ))}
              </Svg>
            </View>
            <Text style={styles.stepText}>{t.strokes} {step}/{total}</Text>
            <Text style={styles.strokeHint}>{t.strokeHint}</Text>
            <View style={styles.modalBtns}>
              <TouchableOpacity style={styles.speakBtn} onPress={() => speak(sel ? sel.k : '')}>
                <Text style={styles.speakText}>🔊</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.replayBtn}
                onPress={() => { setStep(total > 0 ? 1 : 0); setPlayKey((k) => k + 1); }}
              >
                <Text style={styles.replayText}>{t.replay}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.closeBtn} onPress={() => setStrokeOpen(false)}>
                <Text style={styles.closeText}>✕</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.attrib}>{t.attrib}</Text>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  fixedTop: { paddingHorizontal: 12, paddingTop: 10, paddingBottom: 8, backgroundColor: '#F8F9FA', borderBottomWidth: 1, borderBottomColor: '#E8E8E8' },
  scroll: { padding: 12, paddingBottom: 30 },
  toggleRow: { flexDirection: 'row', justifyContent: 'center', marginBottom: 8 },
  tgBtn: { paddingHorizontal: 18, paddingVertical: 8, borderWidth: 1, borderColor: '#DDD', borderRadius: 8, marginHorizontal: 4, backgroundColor: '#FFF' },
  tgActive: { backgroundColor: '#D32F2F', borderColor: '#D32F2F' },
  tgText: { fontSize: 13, fontWeight: 'bold', color: '#666' },
  tgTextActive: { color: '#FFF' },
  hint: { fontSize: 11, color: '#666', textAlign: 'center', marginBottom: 10 },
  selBox: { backgroundColor: '#FFF', borderRadius: 10, borderWidth: 1, borderColor: '#EEE', padding: 14, alignItems: 'center', marginBottom: 12, minHeight: 120, justifyContent: 'center' },
  selKana: { fontSize: 56, fontWeight: 'bold', color: '#333' },
  selRomaji: { fontSize: 18, color: '#1976D2', fontWeight: 'bold', marginTop: 2 },
  selMm: { fontSize: 15, color: '#2E7D32', marginTop: 2 },
  selEmpty: { fontSize: 13, color: '#999' },
  speakBtn: { marginTop: 10, backgroundColor: '#D32F2F', paddingHorizontal: 20, paddingVertical: 8, borderRadius: 8 },
  speakText: { color: '#FFF', fontWeight: 'bold', fontSize: 15 },
  section: { marginBottom: 14 },
  secTitle: { fontSize: 13, fontWeight: 'bold', color: '#D32F2F', marginBottom: 6 },
  row: { flexDirection: 'row', justifyContent: 'center', marginBottom: 6 },
  rowWrap: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: { width: 64, backgroundColor: '#FFF', borderRadius: 8, borderWidth: 1, borderColor: '#EEE', alignItems: 'center', paddingVertical: 6, margin: 3 },
  kana: { fontSize: 26, color: '#333' },
  romaji: { fontSize: 11, color: '#1976D2', fontWeight: 'bold', marginTop: 1 },
  mm: { fontSize: 11, color: '#2E7D32' },
  rowSpeak: { alignSelf: 'center', marginBottom: 3 },
  rowSpeakText: { fontSize: 11, color: '#1976D2' },
  strokeBtn: { marginTop: 8, backgroundColor: '#FFF3E0', borderWidth: 1, borderColor: '#FF9800', paddingHorizontal: 18, paddingVertical: 7, borderRadius: 8 },
  strokeBtnText: { color: '#E65100', fontWeight: 'bold', fontSize: 13 },
  modalBack: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', alignItems: 'center', justifyContent: 'center', padding: 16 },
  modalCard: { backgroundColor: '#FFF', borderRadius: 14, padding: 16, alignItems: 'center', width: '100%', maxWidth: 360 },
  modalKana: { fontSize: 44, fontWeight: 'bold', color: '#333', marginBottom: 8 },
  svgBox: { backgroundColor: '#FAFAFA', borderWidth: 1, borderColor: '#EEE', borderRadius: 10, padding: 6 },
  stepText: { fontSize: 14, fontWeight: 'bold', color: '#D32F2F', marginTop: 8 },
  strokeHint: { fontSize: 11, color: '#777', marginTop: 4, textAlign: 'center' },
  modalBtns: { flexDirection: 'row', marginTop: 12, alignItems: 'center' },
  replayBtn: { backgroundColor: '#1976D2', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, marginLeft: 8 },
  replayText: { color: '#FFF', fontWeight: 'bold', fontSize: 13 },
  closeBtn: { backgroundColor: '#EEE', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, marginLeft: 8 },
  closeText: { color: '#333', fontWeight: 'bold', fontSize: 13 },
  attrib: { fontSize: 9, color: '#999', marginTop: 12, textAlign: 'center' },
  specRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderRadius: 8, borderWidth: 1, borderColor: '#EEE', padding: 10, marginBottom: 6 },
  specKana: { fontSize: 34, color: '#333', width: 56, textAlign: 'center', marginRight: 8 },
  specSpeak: { fontSize: 18 },
});

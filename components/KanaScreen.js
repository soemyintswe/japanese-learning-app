// components/KanaScreen.js — あ 五十音表 (Hiragana/Katakana) + tap-to-hear TTS
// Local data only (guest/offline OK). Katakana = hiragana +0x60 code conversion.
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Modal, PanResponder } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Speech from 'expo-speech';
import Svg, { Path, Circle, Line as SvgLine, Text as SvgText } from 'react-native-svg';
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
    legend: '① = စရာ (ဂဏန်း = စဉ်လိုက်) · ● = ဆုံးရာ · မြား = ဆွဲရမည့် ဘက်',
    practice: '✍ လေ့ကျင့်', practiceOn: 'စာကွက်ပေါ် လက်နဲ့ (cursor နဲ့) အဖြူပေါ် လိုက်ဆွဲပါ',
    clear: '🧹 ဖျက်',
    attrib: 'Stroke data: KanjiVG (CC BY-SA 3.0) — kanjivg.tagaini.net',
  },
  en: {
    title: 'あ Kana Chart (Gojuon)',
    base: 'Basic (a〜ra)', daku: 'Voiced (ga〜pa)', youon: 'Combos (ゃゅょ)', spec: 'Special',
    hint: 'Tap a kana → 🔊 hear it · a/i/u/e/o vowels',
    tap: 'Select a kana', speakAll: '🔊 Hear whole row',
    stroke: '✍ Stroke order', replay: '▶ Replay', strokes: 'step',
    strokeHint: 'Trace along — red = drawn, grey = next',
    legend: '① = start (number = order) · ● = end · arrow = direction',
    practice: '✍ Practice', practiceOn: 'Trace over the box with finger or mouse',
    clear: '🧹 Clear',
    attrib: 'Stroke data: KanjiVG (CC BY-SA 3.0) — kanjivg.tagaini.net',
  },
  jp: {
    title: 'あ 五十音表',
    base: '基本 (あ行〜ら行)', daku: '濁音 (が〜ぱ行)', youon: '拗音 (ゃゅょ)', spec: '特殊文字',
    hint: '文字をタップ → 🔊 発音を聞く',
    tap: '文字を選んでタップ', speakAll: '🔊 行をまとめて聞く',
    stroke: '✍ 書き順', replay: '▶ やり直し', strokes: 'ステップ',
    strokeHint: '赤=書いた stroke, 灰=次の stroke',
    legend: '①=始点(数字=順番) · ●=終点 · 矢印=向き',
    practice: '✍ 練習', practiceOn: '枠の上で指/マウスでなぞる',
    clear: '🧹 消す',
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

// KanjiVG path (M/c/C/L... absolute+relative) → {sx,sy start, ex,ey end, ux,uy unit direction at start}
const pathInfo = (d) => {
  const toks = d.match(/[MmLlHhVvCcQqSsTtAaZz]|-?[\d.]+(?:e-?\d+)?/g) || [];
  let i = 0, x = 0, y = 0, st = null, cmd = null, lastM = null;
  let d0x = 0, d0y = 0, gotDir = false;
  const n = () => { const v = parseFloat(toks[i]); i += 1; return v || 0; };
  while (i < toks.length) {
    if (/[A-Za-z]/.test(toks[i])) cmd = toks[i]; i += 1;
    if (!cmd) { i += 1; continue; }
    const rel = cmd === cmd.toLowerCase() && cmd !== 'Z' && cmd !== 'z';
    const C = cmd.toUpperCase();
    if (C === 'M') { const nx = n(), ny = n(); x = rel ? x + nx : nx; y = rel ? y + ny : ny; if (!st) st = { x, y }; lastM = { x, y }; }
    else if (C === 'L') { const nx = n(), ny = n(); x = rel ? x + nx : nx; y = rel ? y + ny : ny; }
    else if (C === 'H') { const nx = n(); x = rel ? x + nx : nx; }
    else if (C === 'V') { const ny = n(); y = rel ? y + ny : ny; }
    else if (C === 'C') { const a = n(), b = n(), c = n(), e = n(), f = n(), g = n(); if (!gotDir) { const c1x = rel ? x + a : a, c1y = rel ? y + b : b; d0x = c1x - x; d0y = c1y - y; gotDir = true; } x = rel ? x + f : f; y = rel ? y + g : g; }
    else if (C === 'Q') { const a = n(), b = n(), c = n(), e = n(); if (!gotDir) { const c1x = rel ? x + a : a, c1y = rel ? y + b : b; d0x = c1x - x; d0y = c1y - y; gotDir = true; } x = rel ? x + c : c; y = rel ? y + e : e; }
    else if (C === 'A') { n(); n(); n(); n(); n(); const nx = n(), ny = n(); x = rel ? x + nx : nx; y = rel ? y + ny : ny; }
    else if (C === 'Z') { if (lastM) { x = lastM.x; y = lastM.y; } }
    else { i += 1; }
  }
  const s = st || { x: 0, y: 0 };
  if (!gotDir || (Math.abs(d0x) < 0.01 && Math.abs(d0y) < 0.01)) { d0x = x - s.x; d0y = y - s.y; }
  if (Math.abs(d0x) < 0.01 && Math.abs(d0y) < 0.01) { d0x = 1; d0y = 0; }
  const len = Math.hypot(d0x, d0y) || 1;
  return { sx: s.x, sy: s.y, ex: x, ey: y, ux: d0x / len, uy: d0y / len };
};

export default function KanaScreen({ user, onLogout }) {
  const { lang } = useLanguage();
  const t = tX[lang] || tX.my;
  const [kata, setKata] = useState(false);
  const [sel, setSel] = useState(null);
  const [strokeOpen, setStrokeOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [playKey, setPlayKey] = useState(0);
  const [practice, setPractice] = useState(false);
  const [userStrokes, setUserStrokes] = useState([]); // [[{x,y}...]...] viewBox coords
  const curStroke = useRef(null);

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

  // close/clear practice when modal closes or kana changes
  useEffect(() => {
    if (!strokeOpen) { setPractice(false); setUserStrokes([]); curStroke.current = null; }
  }, [strokeOpen, sel]);

  // finger/mouse tracing layer (only active when practice ON) — svg viewBox = 109 units, render box = 230px
  const pan = useMemo(() => {
    const toVB = (e) => {
      const { locationX: lx, locationY: ly } = e.nativeEvent;
      return { x: (lx * 109) / 230, y: (ly * 109) / 230 };
    };
    return PanResponder.create({
      onStartShouldSetPanResponder: () => practice,
      onMoveShouldSetPanResponder: () => practice,
      onPanResponderGrant: (e) => {
        if (!practice) return;
        curStroke.current = [toVB(e)];
        setUserStrokes((s) => [...s]);
      },
      onPanResponderMove: (e) => {
        if (!practice || !curStroke.current) return;
        const p = toVB(e);
        const last = curStroke.current[curStroke.current.length - 1];
        if (last && Math.abs(last.x - p.x) + Math.abs(last.y - p.y) < 0.4) return;
        curStroke.current.push(p);
        setUserStrokes((s) => [...s]);
      },
      onPanResponderRelease: () => {
        const c = curStroke.current;
        curStroke.current = null;
        if (c && c.length > 1) setUserStrokes((s) => [...s, c]);
        else setUserStrokes((s) => [...s]);
      },
      onPanResponderTerminate: () => {
        const c = curStroke.current;
        curStroke.current = null;
        if (c && c.length > 1) setUserStrokes((s) => [...s, c]);
        else setUserStrokes((s) => [...s]);
      },
    });
  }, [practice]);

  const allUserStrokes = () => (curStroke.current ? [...userStrokes, curStroke.current] : userStrokes);
  const clearUser = () => { curStroke.current = null; setUserStrokes([]); };

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

      {/* 書き順 stroke-order modal — KanjiVG data, sequential reveal + start/end markers + practice trace */}
      <Modal visible={strokeOpen} transparent animationType="fade" onRequestClose={() => setStrokeOpen(false)}>
        <View style={styles.modalBack}>
          <View style={styles.modalCard}>
            <Text style={styles.modalKana}>{sel ? sel.k : ''}</Text>
            <View style={styles.svgBox}>
              <View style={styles.canvasBox} {...pan.panHandlers}>
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
                {/* start(① green) + end(● red) markers + direction arrow per stroke */}
                {(strokes || []).map((d, i) => {
                  const info = pathInfo(d);
                  const ax = info.sx + info.ux * 16;
                  const ay = info.sy + info.uy * 16;
                  const shown = i < step; // marker appears when stroke revealed
                  if (!shown) return null;
                  const hot = i === step - 1;
                  return (
                    <React.Fragment key={`m${i}`}>
                      <SvgLine
                        x1={info.sx + info.ux * 5}
                        y1={info.sy + info.uy * 5}
                        x2={ax}
                        y2={ay}
                        stroke={hot ? '#1976D2' : '#90CAF9'}
                        strokeWidth={hot ? 2 : 1.5}
                      />
                      <Path
                        d={`M${ax},${ay} L${ax - info.ux * 5 + info.uy * 3},${ay - info.uy * 5 - info.ux * 3} M${ax},${ay} L${ax - info.ux * 5 - info.uy * 3},${ay - info.uy * 5 + info.ux * 3}`}
                        stroke={hot ? '#1976D2' : '#90CAF9'}
                        strokeWidth={hot ? 2 : 1.5}
                        fill="none"
                        strokeLinecap="round"
                      />
                      <Circle cx={info.sx} cy={info.sy} r={5.5} fill="#2E7D32" />
                      <SvgText x={info.sx} y={info.sy + 2.6} fontSize={7} fill="#FFF" textAnchor="middle" fontWeight="bold">
                        {i + 1}
                      </SvgText>
                      <Circle cx={info.ex} cy={info.ey} r={3.5} fill="#D32F2F" stroke="#FFF" strokeWidth={1} />
                    </React.Fragment>
                  );
                })}
                {/* user practice trace (blue) */}
                {allUserStrokes().map((pts, i) => {
                  if (!pts || pts.length < 2) return null;
                  const d = pts.map((p, j) => `${j === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
                  return (
                    <Path key={`u${i}`} d={d} stroke="#1565C0" strokeWidth={4} opacity={0.75} fill="none" strokeLinecap="round" strokeLinejoin="round" />
                  );
                })}
              </Svg>
              </View>
            </View>
            <Text style={styles.stepText}>{t.strokes} {step}/{total}</Text>
            <Text style={styles.legend}>{t.legend}</Text>
            <Text style={styles.strokeHint}>{practice ? t.practiceOn : t.strokeHint}</Text>
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
              <TouchableOpacity
                style={[styles.practiceBtn, practice && styles.practiceBtnOn]}
                onPress={() => { setPractice((p) => !p); clearUser(); }}
              >
                <Text style={[styles.practiceText, practice && styles.practiceTextOn]}>{t.practice}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.closeBtn} onPress={() => setStrokeOpen(false)}>
                <Text style={styles.closeText}>✕</Text>
              </TouchableOpacity>
            </View>
            {(userStrokes.length > 0 || curStroke.current) && (
              <TouchableOpacity style={styles.clearBtn} onPress={clearUser}>
                <Text style={styles.clearText}>{t.clear}</Text>
              </TouchableOpacity>
            )}
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
  canvasBox: { width: 230, height: 230 },
  legend: { fontSize: 10, color: '#555', marginTop: 6, textAlign: 'center' },
  practiceBtn: { backgroundColor: '#E3F2FD', borderWidth: 1, borderColor: '#1976D2', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, marginLeft: 8 },
  practiceBtnOn: { backgroundColor: '#1976D2' },
  practiceText: { color: '#1976D2', fontWeight: 'bold', fontSize: 13 },
  practiceTextOn: { color: '#FFF' },
  clearBtn: { marginTop: 8, backgroundColor: '#FFF', borderWidth: 1, borderColor: '#BDBDBD', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 8 },
  clearText: { color: '#555', fontWeight: 'bold', fontSize: 12 },
  stepText: { fontSize: 14, fontWeight: 'bold', color: '#D32F2F', marginTop: 8 },
  strokeHint: { fontSize: 11, color: '#777', marginTop: 4, textAlign: 'center' },
  modalBtns: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', marginTop: 12, alignItems: 'center' },
  replayBtn: { backgroundColor: '#1976D2', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, marginLeft: 8 },
  replayText: { color: '#FFF', fontWeight: 'bold', fontSize: 13 },
  closeBtn: { backgroundColor: '#EEE', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, marginLeft: 8 },
  closeText: { color: '#333', fontWeight: 'bold', fontSize: 13 },
  attrib: { fontSize: 9, color: '#999', marginTop: 12, textAlign: 'center' },
  specRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderRadius: 8, borderWidth: 1, borderColor: '#EEE', padding: 10, marginBottom: 6 },
  specKana: { fontSize: 34, color: '#333', width: 56, textAlign: 'center', marginRight: 8 },
  specSpeak: { fontSize: 18 },
});

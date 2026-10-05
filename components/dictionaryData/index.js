// Dictionary index — level files merge + dedupe helper
// New schema: { id, japanese, reading, myanmar, english, pos, level }
// (Old entries may use { hiragana } instead of { reading } and lack pos — UI handles both.)
import { n5Nouns } from './n5_nouns';
import { n5Verbs } from './n5_verbs';
import { n5Adjectives } from './n5_adjectives';
import { n5Others } from './n5_others';
import { n4Words } from './n4_words';
import { n3Advanced } from './n3_advanced';
import { n2Words } from './n2_words';
import { n1Words } from './n1_words';

const _all = [
  ...n5Nouns,
  ...n5Verbs,
  ...n5Adjectives,
  ...n5Others,
  ...n4Words,
  ...n3Advanced,
  ...n2Words,
  ...n1Words,
];

// Same word+gloss twice (e.g. shared across levels) → keep first only
const _seen = new Set();
export const fullDictionary = _all.filter((w) => {
  const key = `${w.japanese}||${w.reading || w.hiragana || ''}||${w.myanmar}`;
  if (_seen.has(key)) return false;
  _seen.add(key);
  return true;
});

export const LEVELS = ['N5', 'N4', 'N3', 'N2', 'N1'];
export const POS_LIST = ['noun', 'verb', 'adj-i', 'adj-na', 'adverb', 'pronoun', 'conjunction', 'expression', 'number'];

// ---- Import-format helpers (sec: import/export) ----
// Accepts: (a) our format [{japanese...}], (b) {words:[...]},
// (c) OpenJLPT format [{word, reading, meanings[], level}] (CC BY-SA 4.0 dataset)
export function normalizeImportEntry(e, idx) {
  if (!e || typeof e !== 'object') return null;
  if (e.word && !e.japanese) {
    return {
      id: 'imp_' + Date.now().toString(36) + '_' + idx,
      japanese: String(e.word),
      reading: e.reading ? String(e.reading) : '',
      myanmar: '',
      english: Array.isArray(e.meanings) ? e.meanings.slice(0, 3).join(' / ') : (e.meanings ? String(e.meanings) : ''),
      pos: '',
      level: ['N5', 'N4', 'N3', 'N2', 'N1'].includes(e.level) ? e.level : 'N5',
      imported: true,
    };
  }
  if (!e.japanese || !String(e.japanese).trim()) return null;
  return {
    id: e.id ? String(e.id) : 'imp_' + Date.now().toString(36) + '_' + idx,
    japanese: String(e.japanese),
    reading: e.reading ? String(e.reading) : (e.hiragana ? String(e.hiragana) : ''),
    myanmar: e.myanmar ? String(e.myanmar) : '',
    english: e.english ? String(e.english) : '',
    pos: e.pos ? String(e.pos) : '',
    level: ['N5', 'N4', 'N3', 'N2', 'N1'].includes(e.level) ? e.level : 'N5',
    imported: true,
  };
}

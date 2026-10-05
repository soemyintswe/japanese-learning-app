import React from 'react';
import { Text } from 'react-native';

// Firebase Hosting (web.app) မှာ @expo/vector-icons font file တွေ load မဖြစ်လို့
// လေးထောင့်တုံး (tofu) ပေါ်နေတာကို ဖြေရှင်းရန်:
// Icon font လုံးဝ မသုံးဘဲ Emoji (system font) သက်သက် သုံးမယ် —
// localhost / web.app / Android / iOS နေရာတိုင်း font ထပ်သွင်းစရာမလိုဘဲ ပေါ်တယ်။

const MAP = {
  // actions
  add: '➕',
  search: '🔍',
  create: '✏️',
  'create-outline': '✏️',
  edit: '✏️',
  trash: '🗑️',
  'trash-outline': '🗑️',
  eye: '👁️',
  'eye-off': '🙈',
  // nav
  back: '◀',
  'chevron-back': '◀',
  forward: '▶',
  'chevron-forward': '▶',
  calendar: '📅',
  checkbox: '☑️',
  'square-outline': '⬜',
  // misc
  school: '🎓',
  trophy: '🏆',
  book: '📚',
  'logo-google': 'G',
  google: 'G',
  person: '👤',
  'person-add': '👤➕',
  lock: '🔒',
  'lock-closed': '🔒',
  check: '✅',
  'checkmark-circle': '✅',
  swap: '🔄',
  'swap-horizontal': '🔄',
  info: 'ℹ️',
  'information-circle': 'ℹ️',
  ribbon: '🎖️',
  share: '📤',
  'share-social-outline': '📤',
};

export function iconNameToEmoji(name, fallback = '•') {
  if (!name) return fallback;
  if (MAP[name]) return MAP[name];
  const lower = String(name).toLowerCase();
  if (MAP[lower]) return MAP[lower];
  // dictionaryData ထဲက icon name တွေ (school, person, paw, book...) အတွက်
  if (lower.includes('school') || lower.includes('business')) return '🏫';
  if (lower.includes('person') || lower.includes('people') || lower.includes('man') || lower.includes('woman')) return '👤';
  if (lower.includes('book') || lower.includes('document')) return '📚';
  if (lower.includes('cat') || lower.includes('octocat')) return '🐱';
  if (lower.includes('paw') || lower.includes('dog')) return '🐶';
  if (lower.includes('train') || lower.includes('car') || lower.includes('airplane')) return '🚃';
  if (lower.includes('cash') || lower.includes('cart') || lower.includes('restaurant') || lower.includes('cafe') || lower.includes('fast-food')) return '🍚';
  if (lower.includes('medical')) return '🏥';
  if (lower.includes('water')) return '💧';
  if (lower.includes('fish')) return '🐟';
  if (lower.includes('eye')) return '👁️';
  if (lower.includes('headset')) return '🎧';
  if (lower.includes('create')) return '✏️';
  if (lower.includes('ribbon') || lower.includes('trophy') || lower.includes('flash') || lower.includes('pulse')) return '🏆';
  return fallback;
}

export default function AppIcon({ name, size = 18, color, style }) {
  const emoji = iconNameToEmoji(name);
  return (
    <Text style={[{ fontSize: size, color, textAlign: 'center' }, style]}>
      {emoji}
    </Text>
  );
}

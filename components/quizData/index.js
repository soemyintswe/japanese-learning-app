// Quiz banks index — level pools + progression config
import { n5Quiz } from './n5_quiz';
import { n4Quiz } from './n4_quiz';
import { n3Quiz } from './n3_quiz';
import { n2Quiz } from './n2_quiz';
import { n1Quiz } from './n1_quiz';

export const QUIZ_LEVELS = ['N5', 'N4', 'N3', 'N2', 'N1'];

export const QUIZ_BANK = {
  N5: n5Quiz,
  N4: n4Quiz,
  N3: n3Quiz,
  N2: n2Quiz,
  N1: n1Quiz,
};

// Practice round မှာ ဒီ % ရမှ နောက် level ပွင့်
export const UNLOCK_SCORE = 70;
// Level Check (placement) မှာ level တစ်ခုစီ ဒီ % ရမှ အောင်မှတ်
export const PLACE_PASS = 75;
export const PLACE_Q_PER_LEVEL = 4;

// အမှတ်ပေးစည်းမျဉ်း (scoring rules — QAScreen + Help + prompt 共通)
export const SCORING = {
  pointsPerQ: 1, // Q တစ်ပုဒ် = 1 မှတ် (q.points ပါရင် အဲဒါ ဦးစား)
  roundSize: 10, // practice/random တစ်ပွဲ အရေအတွက်
  passPractice: 70, // == UNLOCK_SCORE — ဒီရာခိုင်နှုန်းနဲ့ နောက်အဆင့်ပွင့်
  passPlacement: 75, // == PLACE_PASS — Level Check အောင်မှတ်
};

export const SKILLS = ['vocab', 'grammar', 'reading', 'listening'];

export function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function sampleQuestions(level, n, skill) {
  let pool = QUIZ_BANK[level] || [];
  if (skill) pool = pool.filter((q) => q.skill === skill);
  return shuffle(pool).slice(0, n);
}

// assessedLevel / best scores မှ level unlock ဖြစ်မဖြစ်
export function isLevelUnlocked(level, progress) {
  const idx = QUIZ_LEVELS.indexOf(level);
  if (idx <= 0) return true; // N5 always open
  const prev = QUIZ_LEVELS[idx - 1];
  if ((progress.best && (progress.best[prev] || 0)) >= UNLOCK_SCORE) return true;
  if (progress.assessed) {
    const aIdx = QUIZ_LEVELS.indexOf(progress.assessed);
    if (aIdx >= idx - 1) return true;
  }
  return false;
}

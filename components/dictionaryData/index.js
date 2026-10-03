import { n5Nouns } from './n5_nouns';
import { n5Verbs } from './n5_verbs';
import { n3Advanced } from './n3_advanced';
import { n2Words } from './n2_words';
import { n1Words } from './n1_words';

export const fullDictionary = [
  ...n5Nouns,
  ...n5Verbs,
  ...n3Advanced,
  ...n2Words,
  ...n1Words,
];
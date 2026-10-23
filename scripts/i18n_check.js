// i18n parity check: for each const X = { my:{...}, en:{...}, jp:{...} } — compare top-level keys
const fs = require('fs');
const path = require('path');
const files = ['App.js', ...fs.readdirSync('components').filter((f) => f.endsWith('.js')).map((f) => 'components/' + f)];

function extractBlock(src, start) {
  // start = index of '{'; returns { text, end } with brace matching (skip strings crudely)
  let depth = 0, i = start, inStr = null;
  for (; i < src.length; i++) {
    const c = src[i];
    if (inStr) { if (c === '\\') { i++; continue; } if (c === inStr) inStr = null; continue; }
    if (c === "'" || c === '"' || c === '`') { inStr = c; continue; }
    if (c === '{') depth++;
    else if (c === '}') { depth--; if (depth === 0) return { text: src.slice(start, i + 1), end: i + 1 }; }
  }
  return { text: src.slice(start), end: src.length };
}
function topLevelKeys(block) {
  // keys at depth 1 inside block (block includes outer braces of the t-object)
  const keys = [];
  let depth = 0, inStr = null;
  for (let i = 0; i < block.length; i++) {
    const c = block[i];
    if (inStr) { if (c === '\\') { i++; continue; } if (c === inStr) inStr = null; continue; }
    if (c === "'" || c === '"' || c === '`') { inStr = c; continue; }
    if (c === '{' || c === '[' || c === '(') depth++;
    else if (c === '}' || c === ']' || c === ')') depth--;
    else if (depth === 1) {
      const m = block.slice(i).match(/^([A-Za-z_]\w*)\s*:/);
      if (m) { keys.push(m[1]); i += m[0].length - 1; }
    }
  }
  return keys;
}
function langBlock(objText, lang) {
  const re = new RegExp('\\b' + lang + '\\s*:\\s*\\{');
  const m = re.exec(objText);
  if (!m) return null;
  const b = extractBlock(objText, objText.indexOf('{', m.index + m[0].length - 1));
  return b.text;
}

for (const f of files) {
  const src = fs.readFileSync(f, 'utf8');
  const re = /const\s+(\w+)\s*=\s*\{/g;
  let m;
  while ((m = re.exec(src))) {
    const obj = extractBlock(src, m.index + m[0].length - 1);
    const myB = langBlock(obj.text, 'my'), enB = langBlock(obj.text, 'en'), jpB = langBlock(obj.text, 'jp');
    if (!myB || !enB || !jpB) continue;
    const K = (b) => new Set(topLevelKeys(b));
    const myK = K(myB), enK = K(enB), jpK = K(jpB);
    const miss = (a, b) => [...a].filter((k) => !b.has(k));
    const me = miss(myK, enK), mj = miss(myK, jpK), em = miss(enK, myK), ej = miss(enK, jpK), jm = miss(jpK, myK), je = miss(jpK, enK);
    if (me.length || mj.length || em.length || ej.length || jm.length || je.length) {
      console.log(`${f} :: ${m[1]}`);
      if (me.length) console.log('  my-only (missing in en):', me.join(', '));
      if (mj.length) console.log('  my-only (missing in jp):', mj.join(', '));
      if (em.length) console.log('  en-only (missing in my):', em.join(', '));
      if (ej.length) console.log('  en-only (missing in jp):', ej.join(', '));
      if (jm.length) console.log('  jp-only (missing in my):', jm.join(', '));
      if (je.length) console.log('  jp-only (missing in en):', je.join(', '));
    }
  }
}
console.log('DONE');

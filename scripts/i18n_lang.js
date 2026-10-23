// language-content violations:
// 1) en/jp blocks containing Myanmar text  2) my blocks with pure-English strings (3+ ascii words, no Myanmar)
const fs = require('fs');
const files = ['App.js', ...fs.readdirSync('components').filter((f) => f.endsWith('.js')).map((f) => 'components/' + f)];
function extractBlock(src, start) {
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
const MY = /[\u1000-\u109F]/;
for (const f of files) {
  const src = fs.readFileSync(f, 'utf8');
  const re = /const\s+(\w+)\s*=\s*\{/g;
  let m;
  while ((m = re.exec(src))) {
    const obj = extractBlock(src, m.index + m[0].length - 1);
    for (const lang of ['my', 'en', 'jp']) {
      const lm = new RegExp('\\b' + lang + '\\s*:\\s*\\{').exec(obj.text);
      if (!lm) continue;
      const b = extractBlock(obj.text, obj.text.indexOf('{', lm.index + lm[0].length - 1)).text;
      const lines = b.split('\n');
      const startLine = src.slice(0, m.index).split('\n').length;
      lines.forEach((line, li) => {
        if (/^\s*\/\//.test(line)) return;
        const strs = [...line.matchAll(/'([^']{3,})'|\"([^\"]{3,})\"|`([^`]{3,})`/g)].map((x) => x[1] || x[2] || x[3]).filter(Boolean);
        if (lang !== 'my' && MY.test(line)) {
          console.log(`${f}:${startLine + li} [${lang} has Myanmar] ${line.trim().slice(0, 110)}`);
        }
        if (lang === 'my') {
          for (const s of strs) {
            if (MY.test(s)) continue;
            const words = s.match(/[A-Za-z]{3,}/g) || [];
            const rest = s.replace(/[^A-Za-z0-9\s\.,:;!?\-()/&+%'"@#=*[\]{}]/g, '');
            if (words.length >= 3 && /[A-Za-z]/.test(rest)) {
              console.log(`${f}:${startLine + li} [my pure-EN] "${s.slice(0, 90)}"`);
            }
          }
        }
      });
    }
  }
}
console.log('DONE');

// fetch kana stroke paths from KanjiVG (CC BY-SA 3.0, http://kanjivg.tagaini.net)
const fs = require('fs');
const hir = 'あいうえおかきくけこさしすせそたちつてとなにぬねのはひふへほまみむめもやゆよらりるれろわをんっゃゅょがぎぐげござじずぜぞだぢづでどばびぶべぼぱぴぷぺぽ';
const kat = 'アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲンッャュョガギグゲゴザジズゼゾダヂヅデドバビブベボパピプペポ';
const chars = [...hir, ...kat];
const base = 'https://cdn.jsdelivr.net/gh/KanjiVG/kanjivg@master/kanji/';

async function one(c) {
  const code = c.codePointAt(0).toString(16).padStart(5, '0');
  const r = await fetch(base + code + '.svg');
  if (!r.ok) throw new Error('http ' + r.status);
  const t = await r.text();
  const strokes = [];
  for (const m of t.matchAll(/<path\b[^>]*>/g)) {
    if (/id="kvg:[0-9A-Fa-f]+-s\d+"/.test(m[0])) {
      const d = m[0].match(/d="([^"]+)"/);
      if (d) strokes.push(d[1]);
    }
  }
  if (!strokes.length) throw new Error('no strokes');
  return [c, strokes];
}

(async () => {
  const out = {};
  const queue = chars.slice();
  const workers = Array.from({ length: 8 }, async () => {
    while (queue.length) {
      const c = queue.shift();
      try { const [k, v] = await one(c); out[k] = v; }
      catch (e) { console.log('MISS', c, e.message); }
    }
  });
  await Promise.all(workers);
  fs.writeFileSync('components/kanaStrokes.json', JSON.stringify(out));
  console.log('total', Object.keys(out).length, 'size', fs.statSync('components/kanaStrokes.json').size);
})();



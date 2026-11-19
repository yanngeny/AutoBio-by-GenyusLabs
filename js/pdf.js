// Mini générateur PDF (texte + tableaux, A4, Helvetica) sans dépendance : fonctionne hors ligne.
// Les caractères sont encodés en WinAnsi (accents français et €).
const W = 595.28, H = 841.89, M = 40;
const CP = { '€': 0x80, '‘': 0x91, '’': 0x92, '“': 0x93, '”': 0x94, '–': 0x96, '—': 0x97, '…': 0x85, '·': 0xB7, '°': 0xB0 };

export function winAnsi(s) {
  const out = [];
  for (const ch of String(s ?? '').replace(/[   ]/g, ' ')) {
    const c = ch.codePointAt(0);
    out.push(CP[ch] ?? (c < 256 && c >= 32 ? c : 63));
  }
  return out;
}
const esc = bytes => bytes.map(b => (b === 40 || b === 41 || b === 92 ? [92, b] : [b])).flat();
// Largeur approximative (Helvetica ≈ 0,5 em de moyenne) : suffisant pour tronquer proprement les cellules.
const width = (s, size) => String(s ?? '').length * size * 0.5;
function fit(s, w, size) {
  s = String(s ?? '').replace(/[\r\n]+/g, ' ');
  if (width(s, size) <= w) return s;
  const n = Math.max(1, Math.floor(w / (size * 0.5)) - 1);
  return s.slice(0, n) + '…';
}

/** doc = { title, subtitle, footer, blocks: [ {h} | {p} | {kv:[[k,v]]} | {table:{cols:[{h,w,right}], rows:[[...]]}} ] } */
export function buildPdf(doc) {
  const pages = []; let cur = null, y = 0;
  const newPage = () => { cur = []; pages.push(cur); y = H - M; };
  const text = (x, yy, s, size = 10, bold = false) => cur.push({ x, y: yy, s, size, bold });
  const line = (x1, y1, x2, y2, g = 0.8) => cur.push({ line: [x1, y1, x2, y2], g });
  const need = h => { if (y - h < M + 18) newPage(); };
  newPage();
  text(M, y - 18, doc.title, 20, true); y -= 26;
  if (doc.subtitle) { text(M, y - 10, doc.subtitle, 11); y -= 18; }
  y -= 8;
  for (const b of doc.blocks) {
    if (b.h) { need(40); y -= 14; text(M, y - 12, b.h, 13, true); y -= 20; line(M, y, W - M, y); y -= 6; }
    else if (b.p) { for (const l of String(b.p).split('\n')) { need(16); text(M, y - 10, fit(l, W - 2 * M, 10), 10); y -= 14; } }
    else if (b.kv) { for (const [k, v] of b.kv) { need(16); text(M, y - 10, k, 10, true); text(M + 150, y - 10, fit(v, W - 2 * M - 150, 10), 10); y -= 14; } }
    else if (b.table) {
      const { cols, rows } = b.table, total = cols.reduce((s, c) => s + c.w, 0), k = (W - 2 * M) / total;
      const xs = []; let x = M; for (const c of cols) { xs.push(x); x += c.w * k; }
      const head = () => { need(40); cols.forEach((c, i) => text(c.right ? xs[i] + c.w * k - width(c.h, 9) - 4 : xs[i] + 6, y - 10, c.h, 9, true)); y -= 14; line(M, y, W - M, y, 0.5); y -= 3; };
      head();
      if (!rows.length) { text(M + 2, y - 10, 'Aucune ligne.', 9); y -= 14; }
      for (const r of rows) {
        if (y - 15 < M + 18) { newPage(); head(); }
        r.forEach((v, i) => { const c = cols[i], s = fit(v, c.w * k - 6, 9); text(c.right ? xs[i] + c.w * k - width(s, 9) - 4 : xs[i] + 6, y - 10, s, 9); });
        y -= 14; line(M, y, W - M, y, 0.92); y -= 2;
      }
    }
  }
  // assemblage PDF
  const objs = [], add = s => { objs.push(s); return objs.length; };
  const catalog = add(null), pagesObj = add(null), f1 = add('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>'), f2 = add('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>');
  const kids = [];
  pages.forEach((items, pi) => {
    const parts = [];
    for (const it of items) {
      if (it.line) parts.push(`${it.g} G 0.6 w ${it.line[0].toFixed(2)} ${it.line[1].toFixed(2)} m ${it.line[2].toFixed(2)} ${it.line[3].toFixed(2)} l S`);
      else parts.push({ t: it });
    }
    const foot = `${doc.footer || ''}${doc.footer ? ' · ' : ''}page ${pi + 1}/${pages.length}`;
    parts.push({ t: { x: M, y: 24, s: foot, size: 8, bold: false } });
    const chunks = [];
    for (const p of parts) {
      if (typeof p === 'string') { chunks.push(Uint8Array.from(Array.from(p, c => c.charCodeAt(0)))); continue; }
      const t = p.t, head = `0 g BT /${t.bold ? 'F2' : 'F1'} ${t.size} Tf ${t.x.toFixed(2)} ${t.y.toFixed(2)} Td (`;
      chunks.push(Uint8Array.from([...Array.from(head, c => c.charCodeAt(0)), ...esc(winAnsi(t.s)), ...Array.from(') Tj ET\n', c => c.charCodeAt(0))]));
      continue;
    }
    // le contenu mélange chaînes (traits) et octets : on sépare les traits par un saut de ligne
    const sep = Uint8Array.from([10]);
    const bodyParts = []; chunks.forEach(c => { bodyParts.push(c, sep); });
    const len = bodyParts.reduce((s, c) => s + c.length, 0), body = new Uint8Array(len); let o = 0; for (const c of bodyParts) { body.set(c, o); o += c.length; }
    const cid = add({ stream: body });
    const pid = add(`<< /Type /Page /Parent ${pagesObj} 0 R /MediaBox [0 0 ${W} ${H}] /Resources << /Font << /F1 ${f1} 0 R /F2 ${f2} 0 R >> >> /Contents ${cid} 0 R >>`);
    kids.push(pid);
  });
  objs[catalog - 1] = `<< /Type /Catalog /Pages ${pagesObj} 0 R >>`;
  objs[pagesObj - 1] = `<< /Type /Pages /Kids [${kids.map(k => `${k} 0 R`).join(' ')}] /Count ${kids.length} >>`;
  const out = []; let size = 0; const offsets = [];
  const push = b => { const u = typeof b === 'string' ? Uint8Array.from(Array.from(b, c => c.charCodeAt(0) & 255)) : b; out.push(u); size += u.length; };
  push('%PDF-1.4\n');
  objs.forEach((o, i) => {
    offsets.push(size);
    if (o && o.stream) { push(`${i + 1} 0 obj\n<< /Length ${o.stream.length} >>\nstream\n`); push(o.stream); push('\nendstream\nendobj\n'); }
    else push(`${i + 1} 0 obj\n${o}\nendobj\n`);
  });
  const xref = size;
  push(`xref\n0 ${objs.length + 1}\n0000000000 65535 f \n${offsets.map(n => String(n).padStart(10, '0') + ' 00000 n \n').join('')}trailer\n<< /Size ${objs.length + 1} /Root ${catalog} 0 R >>\nstartxref\n${xref}\n%%EOF\n`);
  const res = new Uint8Array(size); let p = 0; for (const u of out) { res.set(u, p); p += u.length; }
  return res;
}

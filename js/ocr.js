// Lecture photo : l'appareil photo et la reconnaissance de texte sont gérés sur le téléphone (plugin natif AutoBioOcr),
// puis ce module repère les chiffres utiles (pompe : litres, montant, prix au litre ; compteur : kilomètres).

const plugin = () => window.Capacitor?.Plugins?.AutoBioOcr;
export const available = () => !!plugin();

// Ouvre l'appareil photo du téléphone. La photo va dans le cache privé de l'appli, est lue puis supprimée :
// rien n'est enregistré dans la photothèque. Renvoie '' si l'utilisateur annule.
export async function scan() {
  const { text, cancelled } = await plugin().scan();
  return cancelled ? '' : String(text || '');
}

const r = (n, d) => Math.round(n * 10 ** d) / 10 ** d;
const numbers = text => [...String(text).replace(/ /g, ' ').matchAll(/(\d{1,4})\s?[.,]\s?(\d{2,3})(?!\d)/g)].map(m => ({ v: parseFloat(m[1] + '.' + m[2]), dec: m[2].length }));

// Pompe : cherche le trio (montant, litres, prix au litre) cohérent : montant ≈ litres × prix.
export function parsePump(text) {
  const c = numbers(text), out = {};
  let best = null;
  for (const p of c) {
    if (p.v < 0.9 || p.v > 3.5) continue;
    for (const l of c) {
      if (l === p || l.v < 1 || l.v > 160) continue;
      for (const t of c) {
        if (t === p || t === l || t.v < 1 || t.v > 600) continue;
        const err = Math.abs(l.v * p.v - t.v) / t.v;
        if (err <= 0.006 + 0.006 / t.v && (!best || err < best.err - 1e-9 || (Math.abs(err - best.err) < 1e-9 && p.dec > best.p.dec))) best = { p, l, t, err };
      }
    }
  }
  if (best) return { liters: r(best.l.v, 2), total: r(best.t.v, 2), ppl: r(best.p.v, 3) };
  const flat = String(text).replace(/ /g, ' ');
  const num = s => s && parseFloat(s.replace(/\s/g, '').replace(',', '.'));
  const total = num((flat.match(/(\d{1,3}\s?[.,]\s?\d{2})\s*(?:€|eur)(?!\s*\/)/i) || [])[1]);
  const liters = num((flat.match(/(\d{1,3}\s?[.,]\s?\d{2,3})\s*(?:l\b|litres?)/i) || [])[1]);
  const ppl = num((flat.match(/([123][.,]\d{2,3})\s*(?:€|eur)?\s*\/\s*l/i) || flat.match(/\b([123][.,]\d{3})\b/) || [])[1]);
  if (total) out.total = r(total, 2);
  if (liters) out.liters = r(liters, 2);
  if (ppl) out.ppl = r(ppl, 3);
  if (out.ppl && out.total && !out.liters) out.liters = r(out.total / out.ppl, 2);
  if (out.ppl && out.liters && !out.total) out.total = r(out.liters * out.ppl, 2);
  return out;
}

// Compteur : le kilométrage est un entier de 4 à 6 chiffres (hors compteur partiel, qui a une décimale).
// `ref` = dernier kilométrage connu : le compteur est au-dessus (ou à peine en dessous), pas très loin.
export function parseOdometer(text, ref = 0) {
  const flat = String(text).replace(/ /g, ' ');
  const cands = [];
  for (const m of flat.matchAll(/(?<![\d.,])(\d{1,3}(?:[ .]\d{3})+|\d{4,6})(?![\d])(?!\s?[.,]\d)(\s?km)?/gi)) {
    const v = parseInt(m[1].replace(/[ .]/g, ''), 10);
    if (v >= 1000 && v <= 999999) cands.push({ v, km: !!m[2] });
  }
  if (!cands.length) return null;
  if (ref > 0) {
    const near = cands.filter(c => c.v >= ref - 50 && c.v <= ref + 8000).sort((a, b) => Math.abs(a.v - ref) - Math.abs(b.v - ref));
    if (near.length) return near[0].v;
  }
  const withKm = cands.filter(c => c.km); if (withKm.length) return withKm[0].v;
  return cands.sort((a, b) => String(b.v).length - String(a.v).length || b.v - a.v)[0].v;
}

// Facture de garage : date (jj/mm/aaaa), montant TTC et kilométrage, quand ils sont lisibles.
export function parseInvoice(text, ref = 0) {
  const flat = String(text).replace(/[  ]/g, ' '), out = {};
  const dm = flat.match(/(?<!\d)(\d{1,2})[\/.\-](\d{1,2})[\/.\-](\d{4}|\d{2})(?!\d)/g) || [];
  for (const s of dm) {
    const [d, m, y0] = s.split(/[\/.\-]/).map(Number), y = y0 < 100 ? 2000 + y0 : y0;
    if (d >= 1 && d <= 31 && m >= 1 && m <= 12 && y >= 2000 && y <= 2100) { out.date = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`; break; }
  }
  const amt = s => { const v = parseFloat(s.replace(/\s/g, '').replace(',', '.')); return Number.isFinite(v) ? v : null; };
  const tot = [];
  for (const m of flat.matchAll(/(?:total\s*(?:ttc|à payer)?|net\s*à\s*payer|montant\s*ttc|à\s*payer|reste\s*à\s*payer)[^\d\n]{0,25}(\d{1,3}(?:[ .]\d{3})*[.,]\d{2}|\d+[.,]\d{2})/gi)) { const v = amt(m[1]); if (v) tot.push(v); }
  if (tot.length) out.total = Math.max(...tot);
  else { const all = [...flat.matchAll(/(\d{1,3}(?:[ .]\d{3})*[.,]\d{2})\s*(?:€|eur)/gi)].map(m => amt(m[1])).filter(Boolean); if (all.length) out.total = Math.max(...all); }
  const km = [...flat.matchAll(/(?:(?:kilom[ée]trage|kms?|compteur)\s*:?\s*(\d{1,3}(?:[ .]\d{3})+|\d{4,6})|(\d{1,3}(?:[ .]\d{3})+|\d{4,6})\s*(?:km|kms)\b)/gi)].map(m => parseInt((m[1] || m[2]).replace(/[ .]/g, ''), 10)).filter(v => v >= 1000 && v <= 999999);
  if (km.length) out.km = ref > 0 ? (km.find(v => v >= ref - 50 && v <= ref + 8000) ?? km[0]) : km[0];
  return out;
}

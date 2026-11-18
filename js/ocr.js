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

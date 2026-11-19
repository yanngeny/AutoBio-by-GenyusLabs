// Fusionne les recherches de plans d'entretien (data/catalogue/*.json) en js/catalog-fr.js.
// Usage : node tools/build-catalog-fr.mjs
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const dir = 'data/catalogue';
const slug = s => String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const BRAND = { 'DS Automobiles': 'DS' };
const SKIP = r => /générique|non spécifique/i.test(r.model + ' ' + r.engine) || (r.ops || []).length < 3; // un plan de moins de 3 opérations serait trompeur

const records = [];
for (const f of fs.readdirSync(dir).filter(f => f.endsWith('.json')).sort()) {
  for (const r of JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'))) { if (!SKIP(r)) records.push(r); }
}

const sources = {};
const srcKey = (url, title) => { const k = 's' + crypto.createHash('md5').update(url).digest('hex').slice(0, 6); sources[k] ||= { label: title || url, url }; return k; };
const fmtKm = n => n.toLocaleString('fr-FR').replace(/ | /g, ' ');
const fmtDur = m => m % 12 === 0 ? `${m / 12} an${m / 12 > 1 ? 's' : ''}` : `${m} mois`;
const fmt = (km, mo) => [km != null ? `${fmtKm(km)} km` : null, mo != null ? fmtDur(mo) : null].filter(Boolean).join(' / ');

// Regroupe par marque et modèle
const brands = {};
const seenEngine = {};
for (const r of records) {
  const brand = BRAND[r.brand] || r.brand;
  const B = brands[brand] ||= { models: [] };
  let M = B.models.find(x => x.name === r.model);
  if (!M) { M = { id: slug(r.model), name: r.model, years: r.years, engines: [] }; B.models.push(M); }
  const baseLabel = [r.engine, r.gearbox].filter(Boolean).join(' · ');
  let label = baseLabel, n = (seenEngine[brand + M.id + baseLabel] = (seenEngine[brand + M.id + baseLabel] || 0) + 1);
  if (n > 1 || records.filter(x => x.model === r.model && x.brand === r.brand && [x.engine, x.gearbox].filter(Boolean).join(' · ') === baseLabel).length > 1) label = `${baseLabel} (${r.years})`;
  const ops = r.ops.map(o => {
    const isOther = /^Autre\s*:/.test(o.label);
    const label = o.label.replace(/^Autre\s*:\s*/, '');
    const ek = o.everyKm ?? o.firstKm ?? null, em = o.everyMonths ?? o.firstMonths ?? null;
    const parts = [];
    if (o.note) parts.push(String(o.note).replace(/\s+/g, ' ').trim());
    if ((o.firstKm != null || o.firstMonths != null) && o.everyKm != null && (o.firstKm !== o.everyKm || o.firstMonths !== o.everyMonths) && !/puis/i.test(o.note || ''))
      parts.push(`Première échéance : ${fmt(o.firstKm, o.firstMonths)}.`);
    if (o.severeKm != null || o.severeMonths != null) parts.push(`Conditions sévères : ${fmt(o.severeKm, o.severeMonths)}.`);
    if (o.confidence !== 'constructeur') parts.push('Source secondaire : à vérifier dans le carnet d’entretien du véhicule.');
    return {
      label: /^Révision/.test(label) ? 'Révision (vidange + filtre à huile)' : label,
      everyKm: ek, everyMonths: em,
      enabled: !isOther && (ek != null || em != null),
      kind: /^Révision/.test(label) ? 'oil' : undefined,
      note: parts.join(' '),
      source: o.sourceUrl ? [srcKey(o.sourceUrl, o.sourceTitle)] : [],
      conf: o.confidence === 'constructeur' ? 'c' : 's',
    };
  });
  M.engines.push({ id: slug(label), label, fuel: r.fuel, gearbox: r.gearbox || null, years: r.years, ops });
}
for (const B of Object.values(brands)) B.models.sort((a, b) => a.name.localeCompare(b.name, 'fr'));

const out = `// Fichier généré par tools/build-catalog-fr.mjs à partir de data/catalogue/*.json : ne pas modifier à la main.
// Plans d'entretien par modèle et par moteur (France / Europe de l'ouest). conf : 'c' = document constructeur, 's' = source secondaire.
export const FR_SOURCES = ${JSON.stringify(sources, null, 1)};
export const FR_BRANDS = ${JSON.stringify(brands)};
`;
fs.writeFileSync('js/catalog-fr.js', out);
console.log(Object.entries(brands).map(([b, v]) => `${b}: ${v.models.length} modèles, ${v.models.reduce((a, m) => a + m.engines.length, 0)} moteurs`).join('\n'), '\n', Object.keys(sources).length, 'sources');

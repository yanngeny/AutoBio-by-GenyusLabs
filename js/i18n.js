// Langue de l'appli : français (par défaut) ou anglais.
// Les textes sont écrits en français dans le code ; en mode anglais, ils sont traduits à l'affichage
// (dictionnaire exact + motifs pour les phrases à chiffres) : t() pour le code, tr() pour du texte déjà composé,
// et un observateur de DOM pour tout ce qui s'affiche (écrans, pop-up, messages).
import { EN, UNITS } from './i18n-en.js';
import { NOTES_EN } from './i18n-notes-en.js';

let LANG = 'fr';
export const lang = () => LANG;
export const loc = () => (LANG === 'en' ? 'en-GB' : 'fr-FR');
export function setLang(l) { LANG = l === 'en' ? 'en' : 'fr'; if (typeof document !== 'undefined') document.documentElement.lang = LANG; }

const N = '([\\d][\\d\\s\\u202f\\u00a0.,]*)';
const cap = (m, x) => (m[0][0] === 'T' ? x[0].toUpperCase() + x.slice(1) : x);
const unit = u => UNITS[u] || u;
const plural = (n, one, many) => (Number(String(n).replace(/[^\d]/g, '')) === 1 ? one : many);
const P = [
  [/^(\d+) marques\. Plans par modèle et motorisation, à vérifier dans le carnet de ton véhicule\.$/, (m, n) => `${n} makes. Plans by model and powertrain: check them against your vehicle’s service book.`],
  [new RegExp(`^À renseigner : (.+)$`), (m, x) => `To fill in: ${tr(x)}`],
  [/^(\d+) points? à vérifier$/, (m, n) => `${n} point${n === '1' ? '' : 's'} to check`],
  [/^(\d+) intervalles? exclus? des moyennes$/, (m, n) => `${n} interval${n === '1' ? '' : 's'} excluded from the averages`],
  [/^(.+) entre le (.+) et le (.+) \((.+)\)\. Un plein manque peut-être\.$/, (m, a, d1, d2, r) => `${a} between ${d1} and ${d2} (${tr(r)}). A fill-up may be missing.`],
  [new RegExp(`^(\\d+) jours?$`), (m, n) => `${n} day${n === '1' ? '' : 's'}`],
  [new RegExp(`^(\\d+) opérations? ajoutées?$`), (m, n) => `${n} operation${n === '1' ? '' : 's'} added`],
  [new RegExp(`^(\\d+) véhicules? retrouvés?$`), (m, n) => `${n} vehicle${n === '1' ? '' : 's'} found`],
  [/^Fichier : (.*)$/, (m, x) => `File: ${x}`],
  [/^Agenda : refusé$/, () => 'Calendar: denied'],
  [/^(vers le |le )(.+?)(?: · à (.+))?$/, (m, w, d, k) => `${w === 'le ' ? 'on ' : 'around '}${d}${k ? ` · at ${k}` : ''}`],
  [new RegExp(`^tous les ${N} km ou tous les ${N} (ans?|mois)$`, 'i'), (m, a, b, u) => cap(m, `every ${a} km or every ${b} ${unit(u)}`)],
  [new RegExp(`^tous les ${N} km$`, 'i'), (m, a) => cap(m, `every ${a} km`)],
  [new RegExp(`^tous les ${N} (ans?|mois)$`, 'i'), (m, a, u) => cap(m, `every ${a} ${unit(u)}`)],
  [/^(.+) \(8V restylée, 8Y\)(.*)$/, (m, a, b) => `${a} (8V facelift, 8Y)${b}`],
  [/^(.*)restylée(.*)$/, (m, a, b) => `${a}facelift${b}`],
  [new RegExp(`^${N} points? à traiter$`), (m, n) => `${n} item${plural(n, '', 's')} to handle`],
  [new RegExp(`^${N} en retard$`), (m, n) => `${n} overdue`],
  [new RegExp(`^En retard de ${N} (j|km)$`), (m, n, u) => `Overdue by ${n} ${u === 'j' ? 'd' : 'km'}`],
  [new RegExp(`^Dans ${N} (j|km)$`), (m, n, u) => `In ${n} ${u === 'j' ? 'd' : 'km'}`],
  [new RegExp(`^Dans (\\d+) jours? : (.*)$`), (m, n, x) => `In ${n} day${plural(n, '', 's')}: ${tr(x)}`],
  [/^Aujourd’hui : (.*)$/, (m, x) => `Today: ${tr(x)}`],
  [/^le (.+)$/, (m, d) => `on ${d}`],
  [new RegExp(`^à ${N} km ou le (.+)$`), (m, n, d) => `at ${n} km or on ${d}`],
  [new RegExp(`^à ${N} km \\(vers (.+)\\)$`), (m, n, d) => `at ${n} km (around ${d})`],
  [new RegExp(`^(.+) \\(vers (.+)\\)$`), (m, a, d) => `${tr(a)} (around ${d})`],
  [/^Toujours en retard : (.*)$/, (m, x) => `Still overdue: ${tr(x)}`],
  [new RegExp(`^à ${N} km$`), (m, n) => `at ${n} km`],
  [new RegExp(`^Tous les ${N} km ou ${N} (ans?|mois)$`), (m, a, b, u) => `Every ${a} km or ${b} ${unit(u)}`],
  [new RegExp(`^Tous les ${N} km$`), (m, a) => `Every ${a} km`],
  [new RegExp(`^Tous les ${N} (ans?|mois)$`), (m, a, u) => `Every ${a} ${unit(u)}`],
  [new RegExp(`^${N} (ans?|mois)$`), (m, a, u) => `${a} ${unit(u)}`],
  [/^Rappel (.+)$/, (m, x) => `Reminder ${tr(x)}`],
  [/^Plein · (.+)$/, (m, x) => `Fill-up · ${x}`],
  [/^Coût d’usage · (.+)$/, (m, x) => `Running cost · ${{ 'depuis l’achat': 'since purchase', 'ce mois': 'this month', '3 mois': '3 months', '12 mois': '12 months' }[x] || x}`],
  [/^(.+ €\/km) · (.+ €)\/mois(.*)$/, (m, a, b, c) => `${a} · ${b}/month${c}`],
  [/^Possession : (.+)$/, (m, x) => `Ownership: ${x}`],
  [/^Meilleure conso (.+)$/, (m, x) => `Best consumption ${x}`],
  [/^Pire conso (.+)$/, (m, x) => `Worst consumption ${x}`],
  [/^moyenne (.+)$/, (m, x) => `average ${x}`],
  [/^Moyenne (.+) par mois\. Orange : le mois le plus chargé\.$/, (m, x) => `Average ${x} per month. Orange: busiest month.`],
  [new RegExp(`^${N} € · ${N} pleins?$`), (m, a, n) => `${a} € · ${n} fill-up${plural(n, '', 's')}`],
  [/^(.+) · (\d+) pl\. · (.+)$/, (m, a, n, c) => `${a} · ${n} fill-up${n === '1' ? '' : 's'} · ${c}`],
  [/^Prix au litre : (.+)$/, (m, x) => `Price per litre: ${x}`],
  [/^Tous les pleins \((\d+)\)$/, (m, n) => `All fill-ups (${n})`],
  [/^Entretiens \((\d+)\)$/, (m, n) => `Maintenance (${n})`],
  [/^Autres dépenses \((\d+)\)$/, (m, n) => `Other expenses (${n})`],
  [/^Lu : (.+)\. Vérifie avant d’enregistrer$/, (m, x) => `Read: ${x}. Check before saving`],
  [/^Compteur lu : (.+)\. Vérifie avant d’enregistrer$/, (m, x) => `Odometer read: ${x}. Check before saving`],
  [/^Carburant \((\d+) pleins?\)$/, (m, n) => `Fuel (${n} fill-up${n === '1' ? '' : 's'})`],
  [/^Archivé le (.+?)(?: · vendu (.+))?$/, (m, d, p) => `Archived on ${d}${p ? ` · sold ${p}` : ''}`],
  [/^Entendu : « (.*) ». Vérifie avant d’enregistrer$/, (m, x) => `Heard: “${x}”. Check before saving`],
  [/^Je n’ai pas compris « (.*) » : dis par exemple « 42 litres 78 euros »$/, (m, x) => `I didn’t understand “${x}”: say for example “42 litres 78 euros”`],
  [/^Je n’ai pas compris « (.*) » : dis par exemple « péage 12 euros 50 »$/, (m, x) => `I didn’t understand “${x}”: say for example “toll 12 euros 50”`],
  [/^Échéance : (.+)$/, (m, x) => `Due: ${x}`],
  [/^Vers (.+)$/, (m, x) => `Around ${x}`],
  [/^version (.+)$/, (m, x) => `version ${x}`],
  [/^Agenda : (.*)$/, (m, x) => `Calendar: ${x}`],
  [/^(\d+) opérations?$/, (m, n) => `${n} operation${n === '1' ? '' : 's'}`],
  [/^Dernière synchro(?:nisation)? : (.*)$/, (m, x) => `Last sync: ${x}`],
];

/** Traduit un texte français composé (phrase entière, ou morceaux séparés par « · »). */
export function tr(s) {
  if (LANG !== 'en' || typeof s !== 'string' || !s) return s;
  const raw = s, lead = raw.match(/^\s*/)[0], trail = raw.match(/\s*$/)[0], k = raw.trim().replace(/\s+/g, ' ');
  if (!k) return raw;
  const hit = EN[k] || NOTES_EN[k]; if (hit) return lead + hit + trail;
  if (k.endsWith(' ·')) { const x = tr(k.slice(0, -2)); if (x !== k.slice(0, -2)) return lead + x + ' ·' + trail; }
  for (const [re, f] of P) { const m = re.exec(k); if (m) return lead + f(...m) + trail; }
  if (/[.!?]\s/.test(k)) {
    const parts = k.split(/(?<=[.!?])\s+/);
    if (parts.length > 1) { const out = parts.map(x => tr(x)); if (out.some((x, i) => x !== parts[i])) return lead + out.join(' ') + trail; }
  }
  if (k.includes(' · ')) { const parts = k.split(' · '), out = parts.map(p => tr(p)); if (out.some((p, i) => p !== parts[i])) return lead + out.join(' · ') + trail; }
  const sp = k.replace(/ [—·] /g, m => m);
  const m2 = /^(.+?) — (.+)$/.exec(sp); if (m2) { const a = tr(m2[1]), b = tr(m2[2]); if (a !== m2[1] || b !== m2[2]) return lead + `${a} — ${b}` + trail; }
  return raw;
}
export const t = tr;

// ---------- DOM ----------
const ATTRS = ['placeholder', 'aria-label', 'title', 'alt'];
const SKIP = new Set(['SCRIPT', 'STYLE', 'TEXTAREA', 'INPUT']);
function node(n) {
  if (n.nodeType === 3) { if (!SKIP.has(n.parentElement?.tagName)) { const v = tr(n.nodeValue); if (v !== n.nodeValue) n.nodeValue = v; } return; }
  if (n.nodeType !== 1 || SKIP.has(n.tagName) && n.tagName !== 'INPUT' && n.tagName !== 'TEXTAREA') return;
  for (const a of ATTRS) { const v = n.getAttribute?.(a); if (v) { const x = tr(v); if (x !== v) n.setAttribute(a, x); } }
  if (n.tagName === 'INPUT' || n.tagName === 'TEXTAREA' || n.tagName === 'SCRIPT' || n.tagName === 'STYLE') return;
  for (const c of n.childNodes) node(c);
}
let mo;
export function watch(root = document.body) {
  if (typeof MutationObserver === 'undefined') return;
  mo?.disconnect();
  if (LANG !== 'en') return;
  node(root);
  mo = new MutationObserver(list => {
    for (const r of list) {
      if (r.type === 'characterData') node(r.target);
      else if (r.type === 'attributes') node(r.target);
      else r.addedNodes.forEach(node);
    }
  });
  mo.observe(root, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ATTRS });
}

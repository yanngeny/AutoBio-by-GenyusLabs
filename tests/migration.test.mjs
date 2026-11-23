// Sécurité des données : chaque ancien format de fichier doit s'ouvrir sans perte et sans calcul absurde (NaN, plantage).
import { readFileSync, readdirSync } from 'node:fs';
const mem = {}; globalThis.localStorage = { getItem: k => mem[k] ?? null, setItem: (k, v) => { mem[k] = String(v); }, removeItem: k => { delete mem[k]; } };
globalThis.window = globalThis; globalThis.document = { addEventListener() {}, hidden: false, documentElement: {} };
const S = await import('../js/store.js'), N = await import('../js/notify.js'), { carnetDoc } = await import('../js/carnet.js');
const { buildPdf } = await import('../js/pdf.js'), { toCsv } = await import('../js/csv.js'), W = await import('../js/widget.js');
let bad = 0; const t = (n, ok, d) => { console.log(ok ? 'OK  ' : 'FAIL', n, ok ? '' : (d || '')); if (!ok) bad++; };
const COLS = ['vehicles', 'maintenances', 'fuels', 'expenses', 'documents'];
const badNum = (o, path = '') => { if (typeof o === 'number') return Number.isFinite(o) ? null : path || 'racine'; if (o && typeof o === 'object') for (const [k, v] of Object.entries(o)) { const r = badNum(v, `${path}.${k}`); if (r) return r; } return null; };
const today = S.isoToday();

const dir = new URL('./fixtures/', import.meta.url);
for (const f of readdirSync(dir).filter(x => x.endsWith('.json')).sort()) {
  const raw = JSON.parse(readFileSync(new URL(f, dir), 'utf8')), name = f.replace('.json', '');
  S.replaceData(JSON.parse(JSON.stringify(raw)), { dirty: false });
  const D = S.getData();
  t(`${name} : aucune ligne perdue à l'ouverture`, COLS.every(c => (raw[c] || []).every(r => D[c].some(x => x.id === r.id)) && D[c].length === (raw[c] || []).length));
  t(`${name} : aller-retour JSON identique`, S.sameContent(JSON.parse(JSON.stringify(D)), D));
  // tous les calculs, pour chaque véhicule
  let err = null, res = {};
  try {
    for (const v of D.vehicles) {
      const id = v.id;
      res[id] = { rem: S.reminders(id), ev: S.events(id), tot: S.totals(id), con: S.consumption(id), own: S.ownership(id), kd: S.kmPerDay(id), lm: S.lastMileageDate(id), km: S.vehicleMileage(id) };
      for (const p of ['mois', '3m', '12m', 'achat']) res[id]['st' + p] = S.stats(id, p);
      for (const fu of D.fuels.filter(x => x.vehicleId === id)) S.consoAlert(id, fu.id);
      const doc = carnetDoc(D, id, { today, mileage: res[id].km, reminders: res[id].rem.filter(r => r.kind === 'plan'), own: S.ownership(id) });
      buildPdf(doc); res[id].pdf = true;
      W.summary(v, res[id].km, res[id].rem.filter(r => r.status !== 'todo').slice(0, 3));
    }
    toCsv(D); S.reminders(); N.plan(new Date()); N.kmPlan(new Date()); N.stallPlan(new Date()); N.digestPlan(new Date());
  } catch (e) { err = e; }
  t(`${name} : tous les calculs, PDF, CSV et notifications passent sans erreur`, !err, err && (err.stack || String(err)).split('\n').slice(0, 3).join(' | '));
  const nb = badNum(res); t(`${name} : aucun nombre aberrant (NaN, infini)`, !nb, nb);
  // fusion
  const same = S.mergeData(D, JSON.parse(JSON.stringify(D)));
  t(`${name} : fusion avec une copie identique = inchangé`, S.sameContent(same, D));
  const emp = S.mergeData(D, { vehicles: [], maintenances: [], fuels: [], expenses: [], documents: [] });
  t(`${name} : fusion avec un fichier vide ne perd rien`, COLS.every(c => emp[c].length === D[c].length));
  const back = S.mergeData({ vehicles: [], maintenances: [], fuels: [], expenses: [], documents: [] }, D);
  t(`${name} : un appareil vide récupère tout depuis le fichier`, COLS.every(c => back[c].length === D[c].length));
  // une modification sans effet n'abîme rien
  const before = JSON.stringify(D.vehicles.map(v => v.id));
  S.change(() => {});
  t(`${name} : modification vide sans effet`, JSON.stringify(S.getData().vehicles.map(v => v.id)) === before && COLS.every(c => S.getData()[c].length === D[c].length));
  // assurance mensuelle : idempotente
  S.autoInsurance(); const n1 = S.getData().expenses.length; S.autoInsurance();
  t(`${name} : assurance mensuelle sans doublon`, S.getData().expenses.length === n1);
}
process.exit(bad ? 1 : 0);

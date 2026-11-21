// v0.1.23 : rappels intelligents, coût de possession, fusion multi-appareils, journal d'erreurs.
const mem = {}; globalThis.localStorage = { getItem: k => mem[k] ?? null, setItem: (k, v) => { mem[k] = String(v); }, removeItem: k => { delete mem[k]; } };
globalThis.window = globalThis; globalThis.document = { addEventListener() {}, hidden: false, documentElement: {} };
const S = await import('../js/store.js');
const N = await import('../js/notify.js');
let bad = 0; const t = (n, ok, d) => { console.log(ok ? 'OK  ' : 'FAIL', n, ok ? '' : (d || '')); if (!ok) bad++; };
const today = S.isoToday();

// --- 4 : contrôle technique estimé
t('CT : 1er contrôle à 4 ans', S.ctEstimate('2023-05-10', '2026-11-19') === '2027-05-10');
t('CT : ensuite tous les 2 ans', S.ctEstimate('2016-03-15', '2026-11-19') === '2028-03-15');
t('CT : sans date → null', S.ctEstimate('', today) === null);
S.change(d => { d.vehicles.push({ id: 'a', name: 'Audi', mileage: 99000, plan: [{ id: 'o1', label: 'Vidange', everyKm: 10000, lastKm: 90000, enabled: true }], firstRegistration: '2016-03-15' }); d.fuels.push({ id: 'f1', vehicleId: 'a', date: S.addDays(today, -40), mileage: 98800, liters: 40, total: 60, full: true }); });
const ct = S.reminders('a').find(r => r.kind === 'ct');
t('CT : rappel estimé affiché', ct && ct.label === 'Contrôle technique (estimé)' && ct.status !== 'todo' && ct.dueDate > today);
S.change(d => { d.vehicles[0].ctNextDate = S.addDays(today, 200); });
t('CT : la date saisie prime sur l’estimation', S.reminders('a').find(r => r.kind === 'ct').label === 'Contrôle technique');

// alerte km proche + kilométrage ancien
S.setSettings({ notif: { enabled: true, daysBefore: 7 } });
const st = N.stallPlan(new Date());
t('km proche : notification avec action « mettre à jour »', st.length === 1 && st[0].actionTypeId === 'KM' && /Vidange/.test(st[0].title) && st[0].schedule.at > new Date());
S.change(d => { d.fuels[0].date = S.addDays(today, -3); });
t('km proche : rien si le kilométrage est récent', N.stallPlan(new Date()).length === 0);

// récapitulatif du lundi
t('récap : désactivé par défaut', N.digestPlan(new Date()).length === 0);
S.setSettings({ digest: true });
const dg = N.digestPlan(new Date());
t('récap : 8 lundis à 9 h', dg.length === 8 && dg.every(x => x.schedule.at.getDay() === 1 && x.schedule.at.getHours() === 9) && dg[0].schedule.at > new Date());
t('récap : le premier détaille, les suivants renvoient vers l’appli', /bientôt|retard|urgent/.test(dg[0].body) && /Ouvre AutoBio/.test(dg[1].body));
t('plan : inclut le récap', N.plan(new Date()).some(x => /Récapitulatif/.test(x.title)));

// --- 2 : coût de possession
S.change(d => { d.vehicles.push({ id: 'b', name: 'Micra', mileage: 70000, purchasePrice: 9000, purchaseDate: S.addDays(today, -365), resaleValue: 6000, targetPerKm: 0.2, plan: [] });
  d.fuels.push({ id: 'g1', vehicleId: 'b', date: S.addDays(today, -300), mileage: 60000, liters: 40, total: 60, full: true });
  d.maintenances.push({ id: 'm1', vehicleId: 'b', date: S.addDays(today, -100), mileage: 66000, cost: 340, label: 'Révision' });
  d.expenses.push({ id: 'e1', vehicleId: 'b', date: S.addDays(today, -50), amount: 600, category: 'Assurance' }); });
const ow = S.ownership('b');
t('possession : dépréciation = achat − valeur estimée', ow.depreciation === 3000);
t('possession : dépenses d’usage', ow.running === 1000 && ow.total === 4000);
t('possession : par mois et par km', Math.abs(ow.perMonth - 4000 / (365 / 30.44)) < 1 && Math.abs(ow.perKm - 0.4) < 0.01, JSON.stringify(ow));
t('possession : écart à l’objectif', ow.overTarget > 0.19 && ow.overTarget < 0.21);
t('possession : sans valeur estimée, pas de dépréciation', (() => { S.change(d => { d.vehicles.find(v => v.id === 'b').resaleValue = 0; }); const o = S.ownership('b'); return o.depreciation === null && o.total === 1000; })());
t('possession : véhicule vendu → prix de vente', (() => { S.change(d => { const v = d.vehicles.find(x => x.id === 'b'); v.archivedAt = today; v.soldPrice = 5000; }); return S.ownership('b').depreciation === 4000; })());
const { carnetDoc } = await import('../js/carnet.js');
const bil = carnetDoc(S.getData(), 'b', { today, mileage: 70000, own: S.ownership('b') });
t('bilan PDF : titre et bloc de possession', bil.title === 'Bilan du véhicule' && JSON.stringify(bil).includes('Coût total de possession'));
t('carnet sans bilan inchangé', carnetDoc(S.getData(), 'b', { today }).title === 'Carnet d’entretien');

// --- 1 : fusion multi-appareils
{
  const M = S.mergeData, rec = (id, m, x = {}) => ({ id, vehicleId: 'v', _m: m, date: '2026-01-01', mileage: 1, liters: 1, total: 1, ...x });
  const base = { vehicles: [{ id: 'v', name: 'V', _m: '2026-01-01T00:00:00Z' }], maintenances: [], fuels: [rec('f1', '2026-01-01T00:00:00Z')], expenses: [], documents: [], deleted: {} };
  const A = JSON.parse(JSON.stringify(base)), B = JSON.parse(JSON.stringify(base));
  A.fuels.push(rec('fa', '2026-02-01T00:00:00Z')); B.fuels.push(rec('fb', '2026-02-02T00:00:00Z'));
  const m1 = M(A, B);
  t('fusion : deux saisies sur deux appareils sont conservées', m1.fuels.length === 3 && m1.fuels.some(f => f.id === 'fa') && m1.fuels.some(f => f.id === 'fb'));
  const C = JSON.parse(JSON.stringify(base)), D = JSON.parse(JSON.stringify(base));
  C.fuels[0] = rec('f1', '2026-03-01T00:00:00Z', { liters: 50 }); D.fuels[0] = rec('f1', '2026-03-02T00:00:00Z', { liters: 60 });
  t('fusion : la modification la plus récente gagne (dans les deux sens)', M(C, D).fuels[0].liters === 60 && M(D, C).fuels[0].liters === 60);
  const E = JSON.parse(JSON.stringify(base)); E.fuels = []; E.deleted = { f1: '2026-04-01T00:00:00Z' };
  t('fusion : une suppression récente l’emporte', M(E, base).fuels.length === 0 && M(base, E).fuels.length === 0);
  const F = JSON.parse(JSON.stringify(base)); F.fuels[0] = rec('f1', '2026-05-01T00:00:00Z', { liters: 7 });
  t('fusion : une modification plus récente que la suppression ressuscite la ligne', M(E, F).fuels.length === 1 && M(F, E).fuels[0].liters === 7);
  t('fusion : identique → inchangé', S.sameContent(M(base, base), base));
  t('fusion : lignes sans date (ancien fichier) → pas de perte', M({ ...base, fuels: [{ id: 'x', vehicleId: 'v' }] }, { ...base, fuels: [{ id: 'y', vehicleId: 'v' }] }).fuels.length === 2);
  // change() date les lignes modifiées et note les suppressions
  S.change(d => { d.fuels.push({ id: 'zz', vehicleId: 'a', date: today, mileage: 5, liters: 1, total: 1 }); });
  t('change : ligne ajoutée datée', !!S.getData().fuels.find(f => f.id === 'zz')._m);
  const m0 = S.getData().fuels.find(f => f.id === 'f1')._m;
  S.change(d => { d.fuels = d.fuels.filter(f => f.id !== 'zz'); });
  t('change : suppression enregistrée', !!S.getData().deleted.zz);
  S.change(d => { d.fuels.find(f => f.id === 'f1').notes = 'x'; });
  t('change : seule la ligne modifiée est redatée', S.getData().fuels.find(f => f.id === 'f1')._m > (m0 || '') && !S.getData().fuels.find(f => f.id === 'zz'));
  // restauration qui fait foi
  S.replaceData({ vehicles: [{ id: 'a', name: 'Audi' }], fuels: [], maintenances: [], expenses: [], documents: [] }, { dirty: true, force: true });
  const R = S.getData();
  t('restauration : lignes absentes marquées supprimées, lignes restaurées datées', R.deleted.f1 && R.vehicles[0]._m && S.mergeData(R, { ...base, vehicles: [{ id: 'a', name: 'Audi', _m: '2020-01-01T00:00:00Z' }] }).fuels.length === 0);
}

// --- 5 : journal de diagnostic
{
  const L = await import('../js/log.js');
  L.clear(); L.log('erreur', new Error('boom'));
  L.log('synchro', 'Fichier illisible'); L.log('synchro', 'Fichier illisible');
  const e = L.entries();
  t('journal : erreurs enregistrées', e.length === 2 && /boom/.test(e[0].m) && e[0].l === 'erreur');
  t('journal : répétitions regroupées', e[1].n === 2);
  for (let i = 0; i < 200; i++) L.log('avert.', 'ligne ' + i);
  t('journal : 150 lignes au plus', L.entries().length === 150 && /ligne 199/.test(L.entries().at(-1).m));
  const r = L.report({ Synchro: 'idle' });
  t('journal : rapport avec version et état', /^AutoBio \d/.test(r) && /Synchro : idle/.test(r) && /ligne 199/.test(r));
  L.clear(); t('journal : effacement', L.entries().length === 0 && /journal vide/.test(L.report()));
  console.error('test hook'); t('journal : console.error capturé', L.entries().some(x => /test hook/.test(x.m)));
}

process.exit(bad ? 1 : 0);

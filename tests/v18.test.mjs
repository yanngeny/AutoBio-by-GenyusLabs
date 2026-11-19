// v0.1.18 : widget 3 échéances, pneus saisonniers, alerte conso, rappels km, dernière date de km.
const mem = {}; globalThis.localStorage = { getItem: k => mem[k] ?? null, setItem: (k, v) => { mem[k] = String(v); }, removeItem: k => { delete mem[k]; } };
globalThis.window = globalThis; globalThis.document = { addEventListener() {}, hidden: false, documentElement: {} };
const S = await import('../js/store.js');
const { summary } = await import('../js/widget.js');
const N = await import('../js/notify.js');
let bad = 0; const t = (n, ok) => { console.log(ok ? 'OK  ' : 'FAIL', n); if (!ok) bad++; };

// widget : 3 lignes
const L = [{ status: 'late', label: 'CT', dueDate: '2026-01-01' }, { status: 'soon', label: 'Vidange', dueDate: '2026-12-03' }, { status: 'ok', label: 'Courroie', dueKm: 150000 }, { status: 'ok', label: 'Autre', dueKm: 1 }];
const s = summary({ name: 'A4' }, 1000, L);
t('widget : 3 lignes maximum', s.sub === '⚠ CT en retard' && /^Vidange le/.test(s.sub2) && s.sub3 === 'Courroie à 150 000 km');
t('widget : une seule échéance → sub2/sub3 vides', (() => { const r = summary({ name: 'A4' }, 1, [L[1]]); return r.sub2 === '' && r.sub3 === ''; })());
t('widget : liste vide', summary({ name: 'A4' }, 1, []).sub === 'Aucune échéance à venir');

// pneus saisonniers
t('pneus : date passée → l’an prochain', S.nextYearly('2026-03-15', '2026-11-19') === '2027-03-15');
t('pneus : date à venir cette année', S.nextYearly('2025-12-01', '2026-11-19') === '2026-12-01');
t('pneus : le jour même', S.nextYearly('2026-11-19', '2026-11-19') === '2026-11-19');
t('pneus : 29 février → 28', S.nextYearly('2024-02-29', '2026-11-19') === '2027-02-28');
t('pneus : vide ou invalide', S.nextYearly('', '2026-11-19') === null && S.nextYearly('abc', '2026-11-19') === null);

// données de test
const today = S.isoToday();
S.change(d => {
  d.vehicles.push({ id: 'v1', name: 'Micra', brand: 'Nissan', model: 'Micra', mileage: 50000, plan: [], tyreWinter: S.addDays(today, 10).replace(/^\d{4}/, '2020') });
  // 8 pleins réguliers à ~6 L/100 puis un plein à 9 L/100
  let km = 50000;
  for (let i = 0; i < 8; i++) { km += 500; d.fuels.push({ id: 'f' + i, vehicleId: 'v1', date: S.addDays(today, -200 + i * 10), mileage: km, liters: 30, total: 50, full: true }); }
  km += 500; d.fuels.push({ id: 'fh', vehicleId: 'v1', date: S.addDays(today, -100), mileage: km, liters: 45, total: 75, full: true });
  km += 500; d.fuels.push({ id: 'fn', vehicleId: 'v1', date: S.addDays(today, -90), mileage: km, liters: 31, total: 52, full: true });
});
const rs = S.reminders('v1');
const w = rs.find(r => r.kind === 'season');
t('pneus : rappel présent', !!w && w.label === 'Pneus hiver' && w.status === 'soon');
t('pneus : pas de rappel été sans date', !rs.some(r => r.label === 'Pneus été'));

// alerte conso
t('conso : plein anormal détecté', (() => { const a = S.consoAlert('v1', 'fh'); return a && a.l100 > 8.9 && a.pct >= 40; })());
t('conso : plein normal sans alerte', S.consoAlert('v1', 'fn') === null);
t('conso : pas assez d’historique', S.consoAlert('v1', 'f3') === null);
t('conso : plein inconnu', S.consoAlert('v1', 'zzz') === null);

// dernière date de km
t('km : date du dernier plein', S.lastMileageDate('v1') === S.addDays(today, -90));
S.change(d => { d.vehicles[0].mileageAt = today; });
t('km : relevé manuel plus récent', S.lastMileageDate('v1') === today);

// rappels km
t('rappel km désactivé par défaut', N.kmPlan(new Date()).length === 0);
S.setSettings({ kmReminderWeeks: 3 });
const kp = N.kmPlan(new Date());
t('rappel km : 4 notifications à 9 h', kp.length === 4 && kp.every(x => x.schedule.at.getHours() === 9 && x.actionTypeId === 'KM'));
t('rappel km : espacées de 3 semaines', Math.round((kp[1].schedule.at - kp[0].schedule.at) / 86400000) === 21);
t('rappel km : première dans le futur', kp[0].schedule.at > new Date());
t('rappel km : véhicule archivé ignoré', (() => { S.change(d => { d.vehicles[0].archivedAt = today; }); const r = N.kmPlan(new Date()).length === 0; S.change(d => { delete d.vehicles[0].archivedAt; }); return r; })());
t('plan : inclut les rappels km et les pneus', (() => { S.setSettings({ notif: { enabled: true, daysBefore: 30 } }); const p = N.plan(new Date()); return p.some(x => x.actionTypeId === 'KM') && p.some(x => /Pneus hiver/.test(x.title)); })());
t('plan : pneus sans relance « en retard »', !N.plan(new Date()).some(x => /Toujours en retard : Pneus/.test(x.title)));

process.exit(bad ? 1 : 0);

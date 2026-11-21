// Données locales (cache) + calculs. La vérité est le fichier Drive ; ceci n'est qu'une copie de travail.
const DK = 'suivi.data.v1', MK = 'suivi.meta.v1';
export const NOTE = 'Working file created by AutoBio and replaced automatically on every change. Do not edit.';
const blank = () => ({ _note: NOTE, schema: 1, updatedAt: '', vehicles: [], maintenances: [], fuels: [], expenses: [], documents: [] });
const read = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) || d; } catch { return d; } };
function norm(d) {
  const b = blank();
  for (const k of Object.keys(b)) if (Array.isArray(b[k])) b[k] = Array.isArray(d?.[k]) ? d[k] : [];
  b.updatedAt = d?.updatedAt || '';
  return b;
}
let data = norm(read(DK, blank()));
let meta = { dirty: false, ...read(MK, {}) };
meta.settings = { autoSync: true, snapshots: true, ...(meta.settings || {}) };
const subs = new Set();
const emit = t => subs.forEach(f => f(t));
const saveData = () => localStorage.setItem(DK, JSON.stringify(data));
const saveMeta = () => localStorage.setItem(MK, JSON.stringify(meta));

export const uid = () => (crypto.randomUUID ? crypto.randomUUID() : 'id' + Date.now().toString(36) + Math.random().toString(36).slice(2, 10));
export const normalize = norm;
export const getData = () => data;
export const getMeta = () => meta;
export const subscribe = f => { subs.add(f); return () => subs.delete(f); };
// Modification utilisateur : marque « à envoyer » et déclenche la synchro.
export function change(fn) { fn(data); data.updatedAt = new Date().toISOString(); meta.dirty = true; saveData(); saveMeta(); emit('data'); emit('dirty'); }
// Modification technique (ex. identifiant Drive d'un document) : pas de nouvelle date de modification.
export function quiet(fn) { fn(data); saveData(); }
export function replaceData(next, { dirty = false } = {}) { data = norm(next); meta.dirty = dirty; saveData(); saveMeta(); emit('data'); if (dirty) emit('dirty'); }
export function setMeta(p) { Object.assign(meta, p); saveMeta(); emit('meta'); }
export function setSettings(p) { meta.settings = { ...meta.settings, ...p }; saveMeta(); emit('meta'); }
export const hasContent = () => data.vehicles.length > 0;

// ---------- dates ----------
const pad = n => String(n).padStart(2, '0');
export const isoToday = () => { const d = new Date(); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; };
export function addMonths(iso, n) {
  const [y, m, d] = iso.split('-').map(Number);
  const t = new Date(Date.UTC(y, m - 1 + n, 1));
  const last = new Date(Date.UTC(t.getUTCFullYear(), t.getUTCMonth() + 1, 0)).getUTCDate();
  return `${t.getUTCFullYear()}-${pad(t.getUTCMonth() + 1)}-${pad(Math.min(d, last))}`;
}
export const addDays = (iso, n) => { const t = new Date(Date.parse(iso + 'T00:00:00Z') + n * 86400000); return `${t.getUTCFullYear()}-${pad(t.getUTCMonth() + 1)}-${pad(t.getUTCDate())}`; };
export const daysBetween = (a, b) => Math.round((Date.parse(b + 'T00:00:00Z') - Date.parse(a + 'T00:00:00Z')) / 86400000);

// ---------- dérivés ----------
export const vehicle = id => data.vehicles.find(v => v.id === id);
export function vehicleMileage(id) {
  const v = vehicle(id);
  let m = v?.mileage || 0;
  for (const e of [...data.maintenances, ...data.fuels, ...data.expenses]) if (e.vehicleId === id && e.mileage > m) m = e.mileage;
  return m;
}
export function consumption(vid) {
  const fs = data.fuels.filter(f => f.vehicleId === vid && f.liters > 0).sort((a, b) => a.mileage - b.mileage || a.date.localeCompare(b.date));
  const points = [];
  for (let i = 1; i < fs.length; i++) {
    const f = fs[i], p = fs[i - 1], dk = f.mileage - p.mileage;
    if (dk <= 0 || f.ignoreConso || !f.full || !p.full) continue;
    points.push({ fuelId: f.id, date: f.date, km: dk, liters: f.liters, total: f.total, l100: f.liters / dk * 100 });
  }
  const sk = points.reduce((s, p) => s + p.km, 0);
  const sl = points.reduce((s, p) => s + p.liters, 0);
  const st = points.reduce((s, p) => s + p.total, 0);
  return { points, avg: sk ? sl / sk * 100 : null, cost100: sk ? st / sk * 100 : null };
}
function lastDone(v, op) {
  let best = { km: null, date: null };
  for (const m of data.maintenances) {
    if (m.vehicleId !== v.id || !(m.planIds || []).includes(op.id)) continue;
    if (!best.date || m.date > best.date) best = { km: m.mileage ?? null, date: m.date };
  }
  if (op.lastDate && (!best.date || op.lastDate > best.date)) best = { km: op.lastKm ?? null, date: op.lastDate };
  else if (!best.date && op.lastKm != null) best = { km: op.lastKm, date: null };
  return best;
}
function mk(v, label, dueKm, dueDate, cur, today, kind, opId, todo) {
  const remKm = dueKm != null ? dueKm - cur : null;
  const remDays = dueDate ? daysBetween(today, dueDate) : null;
  let status = 'ok';
  if (todo) status = 'todo';
  else if ((remKm != null && remKm < 0) || (remDays != null && remDays < 0)) status = 'late';
  else if ((remKm != null && remKm <= 1500) || (remDays != null && remDays <= 45)) status = 'soon';
  return { vehicleId: v.id, vehicleName: v.name, label, dueKm, dueDate, remKm, remDays, status, kind, opId };
}
/** Prochaine occurrence (aujourd'hui compris) d'une date saisie une fois : « 2026-11-15 » → chaque 15 novembre. */
export function nextYearly(iso, today = isoToday()) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso || '')) return null;
  const y = Number(today.slice(0, 4));
  for (const yy of [y, y + 1]) {
    const d = addMonths(`${yy}-${iso.slice(5, 7)}-01`, 0); // 1er du mois, pour borner le jour
    const last = Number(addDays(addMonths(d, 1), -1).slice(8, 10));
    const day = String(Math.min(Number(iso.slice(8, 10)), last)).padStart(2, '0');
    const out = `${yy}-${iso.slice(5, 7)}-${day}`;
    if (out >= today) return out;
  }
  return null;
}
/** Date de la dernière mise à jour connue du kilométrage (relevé manuel ou saisie datée avec km). */
export function lastMileageDate(id) {
  let best = vehicle(id)?.mileageAt || '';
  for (const e of [...data.maintenances, ...data.fuels, ...data.expenses]) if (e.vehicleId === id && e.mileage > 0 && e.date && e.date > best && e.date <= isoToday()) best = e.date;
  return best || null;
}
/** Plein anormal : consommation du plein `fuelId` comparée à la moyenne des relevés précédents (≥ 5). */
export function consoAlert(vid, fuelId) {
  const pts = consumption(vid).points, i = pts.findIndex(p => p.fuelId === fuelId);
  if (i < 5) return null;
  const prev = pts.slice(0, i), sk = prev.reduce((a, p) => a + p.km, 0), sl = prev.reduce((a, p) => a + p.liters, 0);
  if (!sk) return null;
  const avg = sl / sk * 100, l100 = pts[i].l100, diff = l100 - avg;
  return diff >= 1.5 && diff / avg >= 0.25 ? { l100, avg, pct: Math.round(diff / avg * 100) } : null;
}
/** Assurance mensualisée : crée une dépense « Assurance » par mois échu (une seule fois par mois, sans recréer une mensualité supprimée). */
export function autoInsurance(today = isoToday()) {
  const ym = today.slice(0, 7), todo = [];
  for (const v of data.vehicles) {
    if (v.archivedAt || v.insuranceMode !== 'monthly' || !(v.insuranceAmount > 0)) continue;
    const day = Math.min(28, Math.max(1, Math.round(v.insuranceDay) || 1));
    let m = v.insuranceGenTo ? addMonths(v.insuranceGenTo + '-01', 1).slice(0, 7) : (v.insuranceFrom || today).slice(0, 7);
    const first = addMonths(ym + '-01', -35).slice(0, 7); if (m < first) m = first; // 36 mois au plus
    for (; m <= ym; m = addMonths(m + '-01', 1).slice(0, 7)) {
      const date = `${m}-${String(day).padStart(2, '0')}`;
      if (date > today) break;
      if (v.insuranceFrom && date < v.insuranceFrom) continue;
      todo.push({ v, m, date });
    }
  }
  if (!todo.length) return 0;
  change(d => {
    for (const { v, m, date } of todo) {
      const id = `ins-${v.id}-${m}`, veh = d.vehicles.find(x => x.id === v.id);
      if (!d.expenses.some(x => x.id === id)) d.expenses.push({ id, vehicleId: v.id, date, mileage: 0, amount: v.insuranceAmount, category: 'Assurance', description: 'Assurance (mensualité)', auto: true });
      veh.insuranceGenTo = m;
    }
  });
  return todo.length;
}
export function reminders(onlyVehicle) {
  const today = isoToday(), out = [];
  for (const v of data.vehicles) {
    if (onlyVehicle && v.id !== onlyVehicle) continue;
    if (v.archivedAt && !onlyVehicle) continue;
    const cur = vehicleMileage(v.id);
    for (const op of v.plan || []) {
      if (!op.enabled) continue;
      const last = lastDone(v, op);
      const dueKm = op.everyKm && last.km != null ? last.km + op.everyKm : null;
      const dueDate = op.everyMonths && last.date ? addMonths(last.date, op.everyMonths) : null;
      out.push(mk(v, op.label, dueKm, dueDate, cur, today, 'plan', op.id, dueKm == null && !dueDate));
    }
    out.push(mk(v, 'Contrôle technique', null, v.ctNextDate || null, cur, today, 'ct', null, !v.ctNextDate));
    out.push(mk(v, 'Assurance', null, v.insuranceDate || null, cur, today, 'ins', null, !v.insuranceDate));
    for (const [key, label] of [['tyreWinter', 'Pneus hiver'], ['tyreSummer', 'Pneus été']]) {
      const d = nextYearly(v[key], today);
      if (d) out.push(mk(v, label, null, d, cur, today, 'season', key, false));
    }
  }
  const rank = { late: 0, soon: 1, todo: 2, ok: 3 };
  const key = r => (r.remDays != null ? r.remDays : 99999) + (r.remKm != null ? r.remKm / 40 : 0);
  return out.sort((a, b) => rank[a.status] - rank[b.status] || key(a) - key(b));
}
export function events(vid) {
  const ev = [];
  for (const m of data.maintenances) if (m.vehicleId === vid) ev.push({ kind: 'maint', id: m.id, date: m.date, mileage: m.mileage, title: m.label || 'Entretien', amount: m.cost, sub: m.garage || '' });
  for (const f of data.fuels) if (f.vehicleId === vid) ev.push({ kind: 'fuel', id: f.id, date: f.date, mileage: f.mileage, title: `Plein · ${String(f.liters).replace('.', ',')} L`, amount: f.total, sub: f.station || '' });
  for (const x of data.expenses) if (x.vehicleId === vid) ev.push({ kind: 'exp', id: x.id, date: x.date, mileage: x.mileage, title: x.description || x.category, amount: x.amount, sub: x.category });
  return ev.sort((a, b) => b.date.localeCompare(a.date) || (b.mileage || 0) - (a.mileage || 0));
}
export function totals(vid, year) {
  const inY = d => !year || (d || '').startsWith(String(year));
  const cat = {};
  const add = (k, v) => { cat[k] = (cat[k] || 0) + (v || 0); };
  for (const f of data.fuels) if (f.vehicleId === vid && inY(f.date)) add('Carburant', f.total);
  for (const m of data.maintenances) if (m.vehicleId === vid && inY(m.date)) add('Entretien', m.cost);
  for (const x of data.expenses) if (x.vehicleId === vid && inY(x.date)) add(x.category || 'Autre', x.amount);
  const total = Object.values(cat).reduce((s, n) => s + n, 0);
  const years = [...new Set([...data.fuels, ...data.maintenances, ...data.expenses].filter(e => e.vehicleId === vid && e.date).map(e => e.date.slice(0, 4)))].sort().reverse();
  return { cat: Object.entries(cat).sort((a, b) => b[1] - a[1]), total, years };
}

// Rythme moyen (km/jour) sur les 12 derniers mois, d'après les kilométrages enregistrés.
export function kmPerDay(vid) {
  const from = addDays(isoToday(), -365);
  const pts = [...data.maintenances, ...data.fuels, ...data.expenses].filter(e => e.vehicleId === vid && e.mileage > 0 && e.date >= from).sort((a, b) => a.date.localeCompare(b.date));
  if (pts.length < 2) return null;
  const days = daysBetween(pts[0].date, pts[pts.length - 1].date), kms = Math.max(...pts.map(p => p.mileage)) - Math.min(...pts.map(p => p.mileage));
  return days >= 30 && kms > 0 ? kms / days : null;
}
// Date retenue pour un rappel : la plus proche entre l'échéance en date et l'estimation tirée de l'échéance en km.
export function reminderDate(r) {
  const t = isoToday(), c = [];
  if (r.dueDate) c.push({ date: r.dueDate, est: false });
  if (r.dueKm != null) {
    if (r.remKm <= 0) c.push({ date: t, est: false });
    else { const kd = kmPerDay(r.vehicleId); if (kd) { const days = Math.round(r.remKm / kd); if (days <= 1825) c.push({ date: addDays(t, days), est: true }); } }
  }
  return c.sort((a, b) => a.date.localeCompare(b.date))[0] || null;
}

// ---------- statistiques ----------
const dateOnly = a => a.slice(0, 10);
function firstDate(vid) {
  const v = vehicle(vid);
  const ds = [v?.purchaseDate, ...[...data.fuels, ...data.maintenances, ...data.expenses].filter(e => e.vehicleId === vid).map(e => e.date)].filter(Boolean).sort();
  return ds[0] || isoToday();
}
export function periodStart(vid, period) {
  const t = isoToday();
  if (period === 'mois') return t.slice(0, 8) + '01';
  if (period === '3m') return addMonths(t, -3);
  if (period === '12m') return addMonths(t, -12);
  return firstDate(vid);
}
const stationKey = s => { const w = String(s || '').trim().split(/[\s,/-]+/)[0].toLowerCase(); return w || ''; };
export function stats(vid, period) {
  const v = vehicle(vid), t = isoToday(), start = periodStart(vid, period), first = firstDate(vid);
  const mine = a => a.filter(e => e.vehicleId === vid);
  const inP = e => e.date && e.date >= start;
  const byDate = (a, b) => a.date.localeCompare(b.date) || (a.mileage || 0) - (b.mileage || 0);
  const allFuels = mine(data.fuels).filter(f => f.liters > 0).sort(byDate);
  const fuels = allFuels.filter(inP), maints = mine(data.maintenances).filter(inP), exps = mine(data.expenses).filter(inP);
  const sum = (a, k) => a.reduce((s, x) => s + (x[k] || 0), 0);
  const fuelTot = sum(fuels, 'total'), maintTot = sum(maints, 'cost'), othTot = sum(exps, 'amount'), run = fuelTot + maintTot + othTot, L = sum(fuels, 'liters');
  // kilomètres
  const ev = [...mine(data.maintenances), ...mine(data.fuels), ...mine(data.expenses)].filter(e => e.mileage > 0 && e.date).sort(byDate);
  const before = [...ev].reverse().find(e => e.date < start), inEv = ev.filter(e => e.date >= start);
  const base = before || inEv[0], top = inEv.reduce((m, e) => (!m || e.mileage > m.mileage ? e : m), null);
  const kmTot = base && top ? Math.max(0, top.mileage - base.mileage) : 0, span = base && top ? daysBetween(base.date, top.date) : 0;
  const effStart = start > first ? start : first, months = Math.max(1, daysBetween(effStart, t) / 30.44);
  // consommation
  const pts = consumption(vid).points.filter(p => p.date >= start);
  const sk = pts.reduce((s, p) => s + p.km, 0), sl = pts.reduce((s, p) => s + p.liters, 0), st = pts.reduce((s, p) => s + p.total, 0);
  const gaps = []; for (let i = 1; i < fuels.length; i++) gaps.push(daysBetween(fuels[i - 1].date, fuels[i].date));
  // qualité : intervalles entre pleins exclus des moyennes
  const sorted = [...allFuels].sort((a, b) => a.mileage - b.mileage || a.date.localeCompare(b.date)), issues = []; let nInt = 0;
  for (let i = 1; i < sorted.length; i++) {
    const a = sorted[i - 1], b = sorted[i]; if (b.date < start) continue; nInt++;
    const dk = b.mileage - a.mileage; if (dk > 0 && !b.ignoreConso && b.full && a.full) continue;
    issues.push({ from: a.date, to: b.date, km: Math.max(0, dk), reason: b.ignoreConso ? 'marqué hors calcul' : (!b.full || !a.full) ? 'plein partiel' : 'kilométrage incohérent' });
  }
  // stations
  const stMap = {};
  for (const f of fuels) { const k = stationKey(f.station); const o = stMap[k] || (stMap[k] = { name: k ? k[0].toUpperCase() + k.slice(1) : 'Non renseignée', n: 0, total: 0, liters: 0 }); o.n++; o.total += f.total || 0; o.liters += f.liters; }
  const stations = Object.values(stMap).sort((a, b) => b.total - a.total);
  // mois (13 derniers au plus)
  const keys = []; { let [y, m] = [+start.slice(0, 4), +start.slice(5, 7)]; const [ey, em] = [+t.slice(0, 4), +t.slice(5, 7)]; while (y < ey || (y === ey && m <= em)) { keys.push(`${y}-${String(m).padStart(2, '0')}`); if (++m > 12) { m = 1; y++; } } }
  const mkeys = keys.slice(-13), mon = Object.fromEntries(mkeys.map(k => [k, { k, fuel: 0, maint: 0, other: 0, km: 0 }]));
  for (const f of fuels) if (mon[f.date.slice(0, 7)]) mon[f.date.slice(0, 7)].fuel += f.total || 0;
  for (const m of maints) if (mon[m.date.slice(0, 7)]) mon[m.date.slice(0, 7)].maint += m.cost || 0;
  for (const x of exps) if (mon[x.date.slice(0, 7)]) mon[x.date.slice(0, 7)].other += x.amount || 0;
  for (let i = 1; i < ev.length; i++) {
    const a = ev[i - 1], b = ev[i], n = daysBetween(a.date, b.date), dk = b.mileage - a.mileage; if (n <= 0 || dk <= 0) continue;
    for (let j = 1; j <= n; j++) { const d = addDays(a.date, j); if (d >= start && mon[d.slice(0, 7)]) mon[d.slice(0, 7)].km += dk / n; }
  }
  // records
  const best = pts.length ? pts.reduce((a, b) => (b.l100 < a.l100 ? b : a)) : null, worst = pts.length ? pts.reduce((a, b) => (b.l100 > a.l100 ? b : a)) : null;
  const ppl = fuels.filter(f => f.total > 0).map(f => ({ date: f.date, v: f.total / f.liters }));
  const maxBy = (a, k) => a.reduce((m, x) => (!m || (x[k] || 0) > (m[k] || 0) ? x : m), null);
  const cheapest = ppl.length ? ppl.reduce((a, b) => (b.v < a.v ? b : a)) : null;
  // possession (depuis l'achat, toutes périodes confondues)
  const allRun = sum(mine(data.fuels), 'total') + sum(mine(data.maintenances), 'cost') + sum(mine(data.expenses), 'amount');
  const allKm = ev.length ? Math.max(...ev.map(e => e.mileage)) - ev[0].mileage : 0, daysAll = Math.max(1, daysBetween(first, t));
  return {
    start, months, n: { fuels: fuels.length, maints: maints.length, exps: exps.length }, empty: !fuels.length && !maints.length && !exps.length,
    fuelTot, maintTot, othTot, run, L, kmTot, kmDay: span >= 7 && kmTot > 0 ? kmTot / span : null,
    perKm: kmTot > 0 ? run / kmTot : null, perMonth: run / months,
    avg: sk ? sl / sk * 100 : null, cost100: sk ? st / sk * 100 : null, autonomy: pts.length ? sk / pts.length : null,
    ppl: L > 0 && fuelTot > 0 ? fuelTot / L : null, avgFill: fuels.length ? { l: L / fuels.length, eur: fuelTot / fuels.length } : null,
    gapAvg: gaps.length ? gaps.reduce((s, n) => s + n, 0) / gaps.length : null, gapMin: gaps.length ? Math.min(...gaps) : null,
    pts, pplSeries: ppl, stations, months13: mkeys.map(k => mon[k]), issues, nInt,
    records: { best, worst, priciest: maxBy(fuels, 'total'), biggest: maxBy(fuels, 'liters'), cheapest, longest: pts.length ? pts.reduce((a, b) => (b.km > a.km ? b : a)) : null },
    possession: { purchase: v?.purchasePrice || 0, total: (v?.purchasePrice || 0) + allRun, perKm: allKm > 0 ? ((v?.purchasePrice || 0) + allRun) / allKm : null, projection: daysAll >= 60 ? allRun / daysAll * 365 : null, run: allRun },
    maintList: maints.sort((a, b) => b.date.localeCompare(a.date)),
  };
}

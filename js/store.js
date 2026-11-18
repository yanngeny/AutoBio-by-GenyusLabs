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
export function reminders(onlyVehicle) {
  const today = isoToday(), out = [];
  for (const v of data.vehicles) {
    if (onlyVehicle && v.id !== onlyVehicle) continue;
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

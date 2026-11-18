// Widget d'écran d'accueil (APK) : ajout rapide + résumé du véhicule.
//  - pousse au widget le nom du véhicule, son kilométrage et la prochaine échéance ;
//  - traduit les liens autobio://add/<type> (boutons du widget) en écran de l'appli.
// Les fonctions pures (parseLink, targetHash, pickVehicle, summary) n'ont aucune dépendance : testables sous Node.

export const KINDS = ['plein', 'entretien', 'depense', 'km', 'home'];

/** 'autobio://add/plein' → 'plein' ; tout autre lien → null. */
export function parseLink(url) {
  const m = /^autobio:\/\/add\/([a-z]+)\/?(?:[?#].*)?$/i.exec(String(url || '').trim());
  const k = m && m[1].toLowerCase();
  return KINDS.includes(k) ? k : null;
}

/** Écran à ouvrir pour un type d'ajout. 'km' ouvre la fiche (le pop-up kilométrage est lancé ensuite). */
export function targetHash(kind, vid) {
  if (!vid) return '#/';
  if (kind === 'plein' || kind === 'entretien' || kind === 'depense') return `#/v/${vid}/${kind}/new`;
  return `#/v/${vid}`;
}

/** Véhicule « actif » : celui de la dernière saisie (entretien, plein, dépense), sinon le premier. */
export function pickVehicle(data) {
  const vs = data?.vehicles || [];
  if (vs.length < 2) return vs[0]?.id || null;
  const last = new Map();
  for (const e of [...(data.maintenances || []), ...(data.fuels || []), ...(data.expenses || [])]) {
    if (e.date && e.date >= (last.get(e.vehicleId) || '')) last.set(e.vehicleId, e.date);
  }
  let best = vs[0].id, bd = last.get(vs[0].id) || '';
  for (const v of vs) { const d = last.get(v.id) || ''; if (d > bd) { best = v.id; bd = d; } }
  return best;
}

const fmtKm = n => Math.round(n).toLocaleString('fr-FR').replace(/ | /g, ' ');
const fmtDay = iso => new Date(iso + 'T12:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });

/** Texte du widget : { title, sub }. `rem` = première échéance non OK du véhicule (ou null). */
export function summary(vehicle, mileage, rem) {
  if (!vehicle) return { title: 'AutoBio', sub: 'Ouvrez l’appli pour commencer' };
  const title = mileage ? `${vehicle.name} · ${fmtKm(mileage)} km` : vehicle.name;
  if (!rem) return { title, sub: 'Aucune échéance à venir' };
  let when = '';
  if (rem.status === 'late') when = 'en retard';
  else if (rem.dueDate) when = `le ${fmtDay(rem.dueDate)}`;
  else if (rem.dueKm != null) when = `à ${fmtKm(rem.dueKm)} km`;
  return { title, sub: `${rem.status === 'late' ? '⚠ ' : ''}${rem.label} ${when}`.trim() };
}

// ---------- branchement sur l'appli ----------
const plugin = () => window.Capacitor?.Plugins?.AutoBioWidget || null;
const appPlugin = () => window.Capacitor?.Plugins?.App || null;
let last = '';

export async function push(S) {
  const p = plugin(); if (!p) return false;
  const data = S.getData(), vid = pickVehicle(data), v = vid && S.vehicle(vid);
  const rem = v ? S.reminders(vid).find(r => r.status !== 'todo') || null : null;
  const s = summary(v, v ? S.vehicleMileage(vid) : 0, rem), key = JSON.stringify(s);
  if (key === last) return false;
  last = key;
  try { await p.update(s); return true; } catch { return false; }
}

/** Ouvre le bon écran pour un lien du widget. `go(hash)` navigue ; `after(kind)` lance l'action propre au type. */
export function handleLink(url, S, go, after) {
  const kind = parseLink(url); if (!kind) return false;
  const vid = pickVehicle(S.getData());
  go(targetHash(kind, vid));
  if (vid && kind === 'km') setTimeout(() => after?.(kind), 80);
  return true;
}

export function init(S, go, after) {
  if (!plugin() && !appPlugin()) return;
  const run = () => push(S);
  S.subscribe(t => { if (t === 'data') run(); });
  run();
  const app = appPlugin();
  if (app) {
    app.addListener('appUrlOpen', e => handleLink(e?.url, S, go, after));
    app.getLaunchUrl?.().then(r => { if (r?.url) handleLink(r.url, S, go, after); }).catch(() => {});
  }
}

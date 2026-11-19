import { loc, tr as T } from './i18n.js';
// Notifications de rappels.
//  - APK : notifications locales programmées (plugin Capacitor LocalNotifications), même appli fermée.
//  - Web : notification affichée à l'ouverture de l'appli pour les échéances proches ou dépassées
//    (un navigateur ne peut pas programmer de notification sans serveur d'envoi).
import * as S from './store.js';

const native = () => window.Capacitor?.Plugins?.LocalNotifications || null;
const SEEN = 'autobio.notified.v1';
const HOUR = 9; // les notifications programmées partent à 9 h

export const kind = () => (native() ? 'native' : 'Notification' in window ? 'web' : 'none');
export const isOn = () => !!S.getMeta().settings.notif?.enabled;
export const daysBefore = () => S.getMeta().settings.notif?.daysBefore ?? 7;

export async function permission() {
  if (kind() === 'native') { try { return (await native().checkPermissions()).display; } catch { return 'denied'; } }
  if (kind() === 'web') return Notification.permission;
  return 'denied';
}
export async function enable() {
  let p = await permission();
  if (p !== 'granted') {
    if (kind() === 'native') { try { p = (await native().requestPermissions()).display; } catch { p = 'denied'; } }
    else if (kind() === 'web') p = await Notification.requestPermission();
  }
  if (p !== 'granted') return false;
  S.setSettings({ notif: { enabled: true, daysBefore: daysBefore() } });
  await refresh();
  return true;
}
export async function disable() {
  S.setSettings({ notif: { enabled: false, daysBefore: daysBefore() } });
  if (kind() === 'native') { try { const { notifications } = await native().getPending(); if (notifications.length) await native().cancel({ notifications }); } catch { /* rien à annuler */ } }
}
export const kmWeeks = () => S.getMeta().settings.kmReminderWeeks ?? 0;
export function setKmWeeks(n) { S.setSettings({ kmReminderWeeks: n }); return refresh(); }
export function setDaysBefore(n) { S.setSettings({ notif: { enabled: isOn(), daysBefore: n } }); return refresh(); }

const idOf = s => { let h = 0; for (const c of s) h = (h * 31 + c.charCodeAt(0)) | 0; return Math.abs(h) % 2147483000 + 1; };
const dueText = r => T(r.dueKm != null && !r.dueDate ? `à ${Math.round(r.dueKm).toLocaleString(loc())} km` : r.dueDate ? `le ${new Date(r.dueDate + 'T12:00:00').toLocaleDateString(loc(), { day: 'numeric', month: 'long', year: 'numeric' })}` : '');

// Liste des notifications à programmer : J-n et jour J, à 9 h, pour chaque échéance datée (ou estimée d'après les km).
export function plan(now = new Date()) {
  const out = [], n = daysBefore();
  for (const r of S.reminders()) {
    if (r.status === 'todo') continue;
    const d = S.reminderDate(r); if (!d) continue;
    const at = (iso, hour = HOUR) => { const [y, m, dd] = iso.split('-').map(Number); return new Date(y, m - 1, dd, hour, 0, 0); };
    const label = `${r.label} · ${r.vehicleName}`;
    const body = `${d.est ? T('Vers ') : ''}${dueText({ ...r, dueDate: d.date })}${r.dueKm != null ? ` (${Math.round(r.dueKm).toLocaleString(loc())} km)` : ''}`;
    const when = [[S.addDays(d.date, -n), T(`Dans ${n} jours : ${label}`)], [d.date, T(`Aujourd’hui : ${label}`)]];
    // échéance dépassée et pas encore traitée : relance tous les 3 jours (4 fois au plus)
    if (r.kind !== 'season') for (let k = 1; k <= 4; k++) when.push([S.addDays(d.date, 3 * k), T(`Toujours en retard : ${label}`)]);
    for (const [iso, title] of when) {
      const date = at(iso); if (date <= now) continue;
      out.push({ id: idOf(`${r.vehicleId}|${r.opId || r.kind}|${iso}`), title, body, schedule: { at: date, allowWhileIdle: true }, smallIcon: 'ic_stat_autobio', actionTypeId: r.kind === 'plan' ? 'DUE' : undefined, extra: { vehicleId: r.vehicleId, opId: r.opId || null } });
    }
  }
  out.push(...kmPlan(now));
  return out.sort((a, b) => a.schedule.at - b.schedule.at).slice(0, 60);
}

/** Rappels « mets à jour ton kilométrage » toutes les N semaines après le dernier relevé (4 prochains par véhicule). */
export function kmPlan(now = new Date()) {
  const w = kmWeeks(), out = [];
  if (!w) return out;
  const today = S.isoToday();
  for (const v of S.getData().vehicles) {
    if (v.archivedAt) continue;
    const base = S.lastMileageDate(v.id) || today;
    let n = 0;
    for (let k = 1; k <= 60 && n < 4; k++) {
      const iso = S.addDays(base, k * w * 7), [y, m, d] = iso.split('-').map(Number), date = new Date(y, m - 1, d, HOUR, 0, 0);
      if (date <= now) continue;
      n++;
      out.push({ id: idOf(`${v.id}|km|${iso}`), title: T(`Mets à jour le kilométrage · ${v.name}`), body: S.lastMileageDate(v.id) ? T(`Dernier relevé le ${new Date(base + 'T12:00:00').toLocaleDateString(loc(), { day: 'numeric', month: 'long' })}`) : T('Un relevé garde tes échéances en km à jour'), schedule: { at: date, allowWhileIdle: true }, smallIcon: 'ic_stat_autobio', actionTypeId: 'KM', extra: { kind: 'km', vehicleId: v.id } });
    }
  }
  return out;
}

let timer;
export function refresh() {
  clearTimeout(timer);
  return new Promise(res => { timer = setTimeout(async () => { await sync(); res(); }, 600); });
}
async function sync() {
  if (!isOn()) return;
  if (kind() === 'native') {
    try {
      const { notifications } = await native().getPending();
      if (notifications.length) await native().cancel({ notifications });
      const list = plan();
      if (list.length) await native().schedule({ notifications: list });
    } catch (e) { console.warn('notifications', e); }
  } else if (kind() === 'web') await webCheck();
}

// Web : une notification par échéance en retard ou proche, au plus une fois par jour.
async function webCheck() {
  if (Notification.permission !== 'granted') return;
  const seen = JSON.parse(localStorage.getItem(SEEN) || '{}'), t = S.isoToday();
  const reg = await navigator.serviceWorker?.getRegistration();
  for (const r of S.reminders()) {
    if (!['late', 'soon'].includes(r.status)) continue;
    const key = `${r.vehicleId}|${r.opId || r.kind}`;
    if (seen[key] === t) continue;
    seen[key] = t;
    const title = `${r.status === 'late' ? 'En retard' : 'Bientôt'} : ${r.label} · ${r.vehicleName}`, body = dueText(r);
    if (reg?.showNotification) await reg.showNotification(title, { body, icon: 'icons/icon.svg', tag: key });
    else new Notification(title, { body, icon: 'icons/icon.svg', tag: key });
  }
  localStorage.setItem(SEEN, JSON.stringify(seen));
}

// Boutons des notifications : « Fait » ouvre un entretien prérempli ; « Mettre à jour » ouvre le pop-up kilométrage.
export function onDone(f, onKm) {
  const n = native(); if (!n?.addListener) return;
  try { n.registerActionTypes?.({ types: [{ id: 'DUE', actions: [{ id: 'done', title: T('Fait') }] }, { id: 'KM', actions: [{ id: 'km', title: T('Mettre à jour') }] }] }); } catch { /* actions indisponibles */ }
  n.addListener('localNotificationActionPerformed', e => {
    const x = e?.notification?.extra || {};
    if (e?.actionId === 'done' && x.vehicleId && x.opId) f(x.vehicleId, x.opId);
    else if (x.kind === 'km' && x.vehicleId && (e?.actionId === 'km' || e?.actionId === 'tap')) onKm?.(x.vehicleId);
  });
}
export function init() {
  S.subscribe(t => { if (t === 'data') refresh(); });
  document.addEventListener('visibilitychange', () => { if (!document.hidden) refresh(); });
  refresh();
}

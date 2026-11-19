// Bouton « Ajouter à l'agenda » : un événement journée entière par échéance.
// Web : lien Google Agenda pré-rempli. APK : création directe via le plugin natif AutoBioCalendar (voir README).
import * as S from './store.js';
import { loc, tr as T } from './i18n.js';

const title = (r, d) => `${r.label} — ${r.vehicleName}${d.est ? T(' (estimé)') : ''}`;
const notes = (r, d) => [T('Rappel AutoBio'), r.dueKm != null ? T(`Échéance : ${Math.round(r.dueKm).toLocaleString(loc())} km`) : '', d.est ? T('Date estimée d’après ton rythme de kilométrage.') : ''].filter(Boolean).join('\n');
export function eventInfo(r) {
  const d = S.reminderDate(r); if (!d) return null;
  return { title: title(r, d), start: d.date, end: S.addDays(d.date, 1), notes: notes(r, d) };
}
export function templateUrl(info) {
  const ymd = s => s.replaceAll('-', '');
  return 'https://calendar.google.com/calendar/render?' + new URLSearchParams({ action: 'TEMPLATE', text: info.title, dates: `${ymd(info.start)}/${ymd(info.end)}`, details: info.notes });
}
export const nativeCalendar = () => window.Capacitor?.Plugins?.AutoBioCalendar || null;

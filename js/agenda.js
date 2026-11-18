// Bouton « Ajouter à l'agenda » : un événement journée entière par échéance.
// Web : lien Google Agenda pré-rempli. APK : création directe via le plugin natif AutoBioCalendar (voir README).
import * as S from './store.js';

const title = (r, d) => `${r.label} — ${r.vehicleName}${d.est ? ' (estimé)' : ''}`;
const notes = (r, d) => ['Rappel AutoBio', r.dueKm != null ? `Échéance : ${Math.round(r.dueKm).toLocaleString('fr-FR')} km` : '', d.est ? 'Date estimée d’après ton rythme de kilométrage.' : ''].filter(Boolean).join('\n');
export function eventInfo(r) {
  const d = S.reminderDate(r); if (!d) return null;
  return { title: title(r, d), start: d.date, end: S.addDays(d.date, 1), notes: notes(r, d) };
}
export function templateUrl(info) {
  const ymd = s => s.replaceAll('-', '');
  return 'https://calendar.google.com/calendar/render?' + new URLSearchParams({ action: 'TEMPLATE', text: info.title, dates: `${ymd(info.start)}/${ymd(info.end)}`, details: info.notes });
}
export const nativeCalendar = () => window.Capacitor?.Plugins?.AutoBioCalendar || null;

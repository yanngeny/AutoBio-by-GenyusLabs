// Journal de diagnostic : les erreurs et avertissements de l'appli sont gardés sur le téléphone (150 dernières lignes)
// pour pouvoir être partagés depuis Réglages › Diagnostic. Rien n'est envoyé nulle part.
import { VERSION } from './version.js';
const KEY = 'autobio.log.v1', MAX = 150;
const read = () => { try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch { return []; } };
const write = a => { try { localStorage.setItem(KEY, JSON.stringify(a.slice(-MAX))); } catch { /* stockage plein : le journal n'est pas vital */ } };
const text = x => { try { return typeof x === 'string' ? x : x instanceof Error ? `${x.name}: ${x.message}${x.stack ? ' @ ' + String(x.stack).split('\n')[1]?.trim() : ''}` : JSON.stringify(x); } catch { return String(x); } };

export function log(level, ...args) {
  const msg = args.map(text).join(' ').slice(0, 400);
  const a = read(), last = a[a.length - 1];
  if (last && last.l === level && last.m === msg) { last.n = (last.n || 1) + 1; last.t = new Date().toISOString(); } else a.push({ t: new Date().toISOString(), l: level, m: msg });
  write(a);
}
export const entries = () => read();
export const clear = () => { try { localStorage.removeItem(KEY); } catch { /* rien */ } };

/** Texte à partager : version, appareil, état de la synchro, puis le journal (le plus récent en dernier). */
export function report(info = {}) {
  const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';
  const head = [`AutoBio ${VERSION}`, `Date : ${new Date().toISOString()}`, `Appareil : ${ua}`, ...Object.entries(info).map(([k, v]) => `${k} : ${v}`), ''];
  const lines = read().map(e => `${e.t} [${e.l}]${e.n > 1 ? ` ×${e.n}` : ''} ${e.m}`);
  return head.concat(lines.length ? lines : ['(journal vide)']).join('\n');
}

let hooked = false;
export function hook() {
  if (hooked || typeof window === 'undefined') return; hooked = true;
  window.addEventListener?.('error', e => log('erreur', e.message || 'erreur', e.filename ? `${String(e.filename).split('/').pop()}:${e.lineno}` : ''));
  window.addEventListener?.('unhandledrejection', e => log('promesse', e.reason));
  for (const k of ['error', 'warn']) {
    const orig = console[k]?.bind(console); if (!orig) continue;
    console[k] = (...a) => { try { log(k === 'error' ? 'erreur' : 'avert.', ...a); } catch { /* jamais bloquant */ } orig(...a); };
  }
}
hook();

// Mise à jour de l'APK : compare la version installée à la dernière publication GitHub (aucune donnée envoyée, simple lecture).
import { VERSION } from './version.js';
export const REPO = 'yanngeny/AutoBio-by-GenyusLabs';
const API = `https://api.github.com/repos/${REPO}/releases/latest`;

/** « 0.1.24 » > « 0.1.23 » ? Les suffixes (-dev, -debug) sont ignorés. */
export function isNewer(latest, current) {
  const n = v => String(v || '').replace(/^v/i, '').split('-')[0].split('.').map(x => parseInt(x, 10) || 0);
  const a = n(latest), b = n(current);
  for (let i = 0; i < Math.max(a.length, b.length); i++) { const d = (a[i] || 0) - (b[i] || 0); if (d) return d > 0; }
  return false;
}
/** APK à télécharger : de préférence celui signé (sans « debug »), sinon le premier .apk de la publication. */
export function pickApk(assets = []) {
  const apks = assets.filter(a => /\.apk$/i.test(a?.name || '') && a.browser_download_url);
  return (apks.find(a => !/debug/i.test(a.name)) || apks[0])?.browser_download_url || '';
}
/** Interprète la réponse de l'API : { version, url (page), apk, newer } ou null si inexploitable. */
export function parseRelease(rel, current = VERSION) {
  const version = String(rel?.tag_name || '').replace(/^v/i, '');
  if (!/^\d+\.\d+/.test(version)) return null;
  return { version, url: rel.html_url || `https://github.com/${REPO}/releases`, apk: pickApk(rel.assets), newer: isNewer(version, current), notes: String(rel.body || '').slice(0, 600) };
}
/** Interroge GitHub. Renvoie le résultat ou lance une erreur (réseau, limite d'API…). */
export async function fetchLatest(fetcher = fetch, current = VERSION) {
  const r = await fetcher(API, { headers: { Accept: 'application/vnd.github+json' } });
  if (!r.ok) throw new Error(`GitHub ${r.status}`);
  const p = parseRelease(await r.json(), current);
  if (!p) throw new Error('réponse inattendue');
  return p;
}

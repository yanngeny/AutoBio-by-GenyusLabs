import { log } from './log.js';
// Verrouillage de l'appli par le code, le schéma ou l'empreinte du téléphone (écran de confirmation Android).
const plugin = () => window.Capacitor?.Plugins?.AutoBioLock;
export const available = () => !!plugin();
/** true = validé, false = refusé ou annulé, null = aucun verrouillage configuré sur le téléphone (on laisse passer). */
export async function authenticate(title = 'AutoBio') {
  try {
    const r = await plugin().authenticate({ title });
    if (r.available === false) return null;
    return !!r.ok;
  } catch (e) { log('verrouillage', e); return false; }
}

// Stockage et synchronisation : un seul document de travail JSON, choisi avec le sélecteur de fichiers d'Android
// (Google Drive, mémoire du téléphone ou autre appli de stockage) via le plugin natif AutoBioFile.
// Envoi automatique après chaque modification : le fichier est remplacé, avec reprise après erreur.
import { getMeta, setMeta, getData, replaceData, subscribe, isoToday } from './store.js';
import { getBlob, putKV, getKV, delKV, listPrefix } from './blobs.js';

// Le nom du fichier dit ce qu'il est : un document de travail JSON, créé par AutoBio, remplacé automatiquement.
const MAIN = 'AutoBio_live-data.json';
const KEEP_LOCAL = 20, KEEP_DAILY = 14, DEBOUNCE = 2500, SAFE = 'safety:';

let status = 'off', lastError = '', timer = null, syncing = false, again = false, retry = 0, conflictHandler = null;
const listeners = new Set();
export const onStatus = f => { listeners.add(f); return () => listeners.delete(f); };
function setStatus(s, e = '') { status = s; lastError = e; listeners.forEach(f => f(s)); }
export const getStatus = () => ({ status, lastError });
export const setConflictHandler = f => { conflictHandler = f; };

const native = () => window.Capacitor?.Plugins?.AutoBioFile || null;
export const fileAvailable = () => !!native();
export const storageMode = () => (getMeta().storage === 'file' ? 'file' : null);
export const isConnected = () => storageMode() !== null;
const err = (message, extra) => Object.assign(new Error(message), extra);

// ---------- fichier ----------
async function fileRead() {
  const r = await native().read({ uri: getMeta().fileUri });
  const c = r?.content;
  if (!c || !String(c).trim()) return null;
  try { return JSON.parse(c); } catch { throw err('Fichier illisible (JSON invalide)'); }
}
const fileWrite = obj => native().write({ uri: getMeta().fileUri, content: JSON.stringify(obj) });
// kind : 'open' (retrouver un fichier existant) ou 'create' (créer un nouveau fichier)
export async function linkFile(kind) {
  if (!native()) throw err('Le choix de fichier n’est disponible que dans l’appli Android.');
  const r = await native().pickFile({ mode: kind, name: MAIN });
  if (!r?.uri) throw err('Aucun fichier choisi');
  setMeta({ storage: 'file', fileUri: r.uri, fileName: r.name || MAIN });
  await syncNow();
}

// ---------- copies locales (sur ce téléphone) ----------
async function localCopy(name, obj) {
  await putKV(SAFE + name, { name, modifiedTime: new Date().toISOString(), json: JSON.stringify(obj) });
  const all = (await listPrefix(SAFE)).sort((a, b) => b.value.modifiedTime.localeCompare(a.value.modifiedTime));
  for (const x of all.slice(KEEP_LOCAL)) await delKV(x.key);
}
async function writeSnapshot() {
  if (!getMeta().settings.snapshots) return;
  await localCopy(`AutoBio_backup_${isoToday()}`, getData());
  const autos = (await listPrefix(SAFE + 'AutoBio_backup_')).sort((a, b) => b.key.localeCompare(a.key));
  for (const x of autos.slice(KEEP_DAILY)) await delKV(x.key);
}
export async function listBackups() {
  return (await listPrefix(SAFE)).map(x => ({ id: x.key, name: x.value.name, modifiedTime: x.value.modifiedTime })).sort((a, b) => b.modifiedTime.localeCompare(a.modifiedTime));
}
export async function readBackup(id) { return JSON.parse((await getKV(id)).json); }
// Copie de sécurité d'un état avant une opération destructive (restauration, remplacement, conflit).
export async function safetyCopy(label, obj) {
  const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  return localCopy(`AutoBio_safety_${label}_${ts}`, obj);
}
export const remoteInfo = () => (isConnected() ? fileRead() : null);

// ---------- documents (photos) : restent sur ce téléphone ----------
export const fetchDocBlob = doc => getBlob(doc.id);

// ---------- moteur de synchro ----------
async function push() {
  const stamp = getData().updatedAt;
  await fileWrite(getData());
  await writeSnapshot();
  const still = getData().updatedAt !== stamp;
  setMeta({ dirty: still, lastSyncAt: new Date().toISOString() });
  if (still) again = true;
}
export async function syncNow() {
  if (!isConnected()) return;
  if (syncing) { again = true; return; }
  syncing = true; setStatus('syncing');
  try {
    const d = await fileRead(), remote = d ? { data: d } : null;
    const local = getData(), m = getMeta();
    if (remote?.data?.updatedAt && (!local.updatedAt || remote.data.updatedAt > local.updatedAt)) {
      let pick = 'remote';
      if (m.dirty && local.vehicles.length && conflictHandler) pick = await conflictHandler(remote.data, local);
      if (pick === 'remote') replaceData(remote.data, { dirty: false });
    }
    if (getMeta().dirty || !remote) await push();
    retry = 0; setStatus('idle');
  } catch (e) {
    setStatus('error', e.message);
    retry++; schedule(Math.min(60000, 4000 * 2 ** retry));
  } finally { syncing = false; if (again) { again = false; schedule(500); } }
}
function schedule(ms = DEBOUNCE) { clearTimeout(timer); timer = setTimeout(syncNow, ms); }
function onDirty() {
  if (!isConnected()) return;
  setStatus('pending');
  if (getMeta().settings.autoSync) schedule();
}
export function disconnect() {
  clearTimeout(timer);
  setMeta({ storage: null, fileUri: null, fileName: null });
  setStatus('off');
}
export function init() {
  subscribe(t => { if (t === 'dirty') onDirty(); });
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible' && isConnected()) schedule(300); });
  if (isConnected()) { setStatus(getMeta().dirty ? 'pending' : 'idle'); schedule(200); } else setStatus('off');
}

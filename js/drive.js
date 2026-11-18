// Stockage et synchronisation. Deux modes :
//  - « file »  : un fichier choisi avec le sélecteur Android (Drive, téléphone, autre appli de stockage), via le plugin natif AutoBioFile ;
//  - « drive » : API Google Drive (document de travail dans Mon Drive › AutoBio, copies datées 30 jours).
// Dans les deux cas : envoi automatique après chaque modification, fichier écrasé, reprise après coupure réseau.
import { getMeta, setMeta, getData, replaceData, subscribe, quiet, isoToday } from './store.js';
import { getBlob, putBlob, putKV, getKV, delKV, listPrefix } from './blobs.js';
import { CONFIG } from '../config.js';

const SCOPE = 'https://www.googleapis.com/auth/drive.file';
// Le nom du fichier dit ce qu'il est : un document de travail JSON, créé par AutoBio, remplacé automatiquement.
const ROOT = 'AutoBio', MAIN = 'AutoBio_live-data.json', BK = 'Sauvegardes', DOCS = 'Documents';
const API = 'https://www.googleapis.com/drive/v3/files', UP = 'https://www.googleapis.com/upload/drive/v3/files';
const KEEP_DAYS = 30, KEEP_LOCAL = 20, DEBOUNCE = 2500, SAFE = 'safety:';

const toks = {};
let status = 'off', lastError = '', timer = null, syncing = false, again = false, retry = 0, conflictHandler = null;
const listeners = new Set();
export const onStatus = f => { listeners.add(f); return () => listeners.delete(f); };
function setStatus(s, err = '') { status = s; lastError = err; listeners.forEach(f => f(s)); }
export const getStatus = () => ({ status, lastError });
export const clientId = () => getMeta().settings.clientId || CONFIG.CLIENT_ID;
export const hasClient = () => !!clientId();
export const setConflictHandler = f => { conflictHandler = f; };

// ---------- mode de stockage ----------
const native = () => window.Capacitor?.Plugins?.AutoBioFile || null;
export const fileAvailable = () => !!native();
export const storageMode = () => (getMeta().storage === 'file' ? 'file' : getMeta().connected ? 'drive' : null);
export const isConnected = () => storageMode() !== null;
const err = (message, extra) => Object.assign(new Error(message), extra);

// ---------- mode fichier ----------
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
  setMeta({ storage: 'file', fileUri: r.uri, fileName: r.name || MAIN, connected: false });
  await syncNow();
}
async function localCopy(name, obj) {
  await putKV(SAFE + name, { name, modifiedTime: new Date().toISOString(), json: JSON.stringify(obj) });
  const all = (await listPrefix(SAFE)).sort((a, b) => b.value.modifiedTime.localeCompare(a.value.modifiedTime));
  for (const x of all.slice(KEEP_LOCAL)) await delKV(x.key);
}

// ---------- authentification Google (mode drive) ----------
function loadGsi() {
  if (window.google?.accounts?.oauth2) return Promise.resolve();
  return new Promise((res, rej) => { const s = document.createElement('script'); s.src = 'https://accounts.google.com/gsi/client'; s.onload = res; s.onerror = () => rej(err('offline', { net: true })); document.head.appendChild(s); });
}
async function auth(scope = SCOPE) {
  await loadGsi();
  return new Promise((resolve, reject) => {
    const tc = window.google.accounts.oauth2.initTokenClient({
      client_id: clientId(), scope,
      callback: r => { if (r.error) return reject(err(r.error, { auth: true })); toks[scope] = { t: r.access_token, exp: Date.now() + (Number(r.expires_in || 3600) - 60) * 1000 }; resolve(r.access_token); },
      error_callback: e => reject(err(e?.type || 'auth', { auth: true })),
    });
    tc.requestAccessToken({ prompt: '' });
  });
}
const token = async (scope = SCOPE) => (toks[scope] && Date.now() < toks[scope].exp ? toks[scope].t : auth(scope));
async function api(url, opts = {}, scope = SCOPE) {
  const t = await token(scope);
  const r = await fetch(url, { ...opts, headers: { ...(opts.headers || {}), Authorization: 'Bearer ' + t } });
  if (r.status === 401 && !opts._r) { delete toks[scope]; return api(url, { ...opts, _r: 1 }, scope); }
  if (!r.ok) throw err('drive ' + r.status, { status: r.status });
  return r;
}

// ---------- fichiers Drive ----------
const esc = s => s.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
async function find(name, parent, folder) {
  const parts = [`name='${esc(name)}'`, 'trashed=false'];
  if (parent) parts.push(`'${parent}' in parents`);
  if (folder) parts.push("mimeType='application/vnd.google-apps.folder'");
  const r = await api(`${API}?q=${encodeURIComponent(parts.join(' and '))}&fields=${encodeURIComponent('files(id,name,modifiedTime)')}&pageSize=10`);
  return (await r.json()).files?.[0] || null;
}
async function mkFolder(name, parent) {
  const r = await api(`${API}?fields=id`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, mimeType: 'application/vnd.google-apps.folder', ...(parent ? { parents: [parent] } : {}) }) });
  return (await r.json()).id;
}
async function createFile(name, parent, mime, body) {
  const b = 'b' + Math.random().toString(36).slice(2);
  const blob = new Blob([`--${b}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify({ name, parents: [parent] })}\r\n--${b}\r\nContent-Type: ${mime}\r\n\r\n`, body, `\r\n--${b}--`]);
  const r = await api(`${UP}?uploadType=multipart&fields=id,modifiedTime`, { method: 'POST', headers: { 'Content-Type': `multipart/related; boundary=${b}` }, body: blob });
  return r.json();
}
const updateFile = (id, mime, body) => api(`${UP}/${id}?uploadType=media&fields=id`, { method: 'PATCH', headers: { 'Content-Type': mime }, body });
const downloadJson = async id => (await api(`${API}/${id}?alt=media`)).json();
const removeFile = id => api(`${API}/${id}`, { method: 'DELETE' });

async function ensureLayout() {
  const m = getMeta();
  if (m.rootId && m.backupsId && m.docsId) return;
  const root = (await find(ROOT, null, true))?.id || await mkFolder(ROOT);
  const bk = (await find(BK, root, true))?.id || await mkFolder(BK, root);
  const docs = (await find(DOCS, root, true))?.id || await mkFolder(DOCS, root);
  setMeta({ rootId: root, backupsId: bk, docsId: docs });
}
async function readRemote() {
  const m = getMeta();
  if (m.fileId) { try { return { id: m.fileId, data: await downloadJson(m.fileId) }; } catch (e) { if (e.status !== 404) throw e; setMeta({ fileId: null }); } }
  const f = await find(MAIN, m.rootId, false);
  if (!f) return null;
  setMeta({ fileId: f.id });
  return { id: f.id, data: await downloadJson(f.id) };
}

// ---------- documents (photos) : mode drive uniquement ----------
async function uploadDocs() {
  for (const doc of getData().documents) {
    if (doc.driveId) continue;
    const blob = await getBlob(doc.id);
    if (!blob) continue;
    const f = await createFile(`${doc.id}-${doc.name}`.replace(/[\\/]/g, '_'), getMeta().docsId, doc.mime || blob.type || 'application/octet-stream', blob);
    quiet(x => { const t = x.documents.find(z => z.id === doc.id); if (t) t.driveId = f.id; });
  }
}
export async function fetchDocBlob(doc) {
  let b = await getBlob(doc.id);
  if (b) return b;
  if (!doc.driveId || storageMode() !== 'drive') return null;
  b = await (await api(`${API}/${doc.driveId}?alt=media`)).blob();
  await putBlob(doc.id, b);
  return b;
}
export async function deleteDocRemote(doc) { if (doc.driveId && storageMode() === 'drive') { try { await removeFile(doc.driveId); } catch { /* sans gravité */ } } }

// ---------- sauvegardes ----------
async function writeSnapshot() {
  const m = getMeta();
  if (!m.settings.snapshots) return;
  const today = isoToday();
  if (storageMode() === 'file') {
    await localCopy(`AutoBio_backup_${today}`, getData());
    const autos = (await listPrefix(SAFE + 'AutoBio_backup_')).sort((a, b) => b.key.localeCompare(a.key));
    for (const x of autos.slice(14)) await delKV(x.key);
    return;
  }
  const body = JSON.stringify(getData());
  if (m.snapId && m.snapDay === today) {
    try { await updateFile(m.snapId, 'application/json', body); return; } catch (e) { if (e.status !== 404) throw e; }
  }
  const f = await createFile(`AutoBio_backup_${today}.json`, m.backupsId, 'application/json', body);
  setMeta({ snapId: f.id, snapDay: today });
  const list = (await listBackups()).filter(x => /^AutoBio_backup_\d{4}-\d{2}-\d{2}\.json$/.test(x.name)).sort((a, b) => b.name.localeCompare(a.name));
  for (const old of list.slice(KEEP_DAYS)) { try { await removeFile(old.id); } catch { /* ignoré */ } }
}
export async function listBackups() {
  if (storageMode() === 'file') return (await listPrefix(SAFE)).map(x => ({ id: x.key, name: x.value.name, modifiedTime: x.value.modifiedTime })).sort((a, b) => b.modifiedTime.localeCompare(a.modifiedTime));
  await ensureLayout();
  const q = encodeURIComponent(`'${getMeta().backupsId}' in parents and trashed=false`);
  const r = await api(`${API}?q=${q}&orderBy=${encodeURIComponent('modifiedTime desc')}&pageSize=60&fields=${encodeURIComponent('files(id,name,modifiedTime)')}`);
  return (await r.json()).files || [];
}
export async function readBackup(id) { return storageMode() === 'file' ? JSON.parse((await getKV(id)).json) : downloadJson(id); }
// Copie de sécurité d'un état (local ou distant) avant une opération destructive.
export async function safetyCopy(label, obj) {
  const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  if (storageMode() === 'file') return localCopy(`AutoBio_safety_${label}_${ts}`, obj);
  await ensureLayout();
  await createFile(`AutoBio_safety_${label}_${ts}.json`, getMeta().backupsId, 'application/json', JSON.stringify(obj));
}
export async function remoteInfo() {
  if (storageMode() === 'file') return fileRead();
  await ensureLayout(); const r = await readRemote(); return r ? r.data : null;
}

// ---------- moteur de synchro ----------
async function push() {
  await ensureLayout();
  await uploadDocs();
  const stamp = getData().updatedAt, body = JSON.stringify(getData());
  let id = getMeta().fileId;
  if (id) { try { await updateFile(id, 'application/json', body); } catch (e) { if (e.status !== 404) throw e; id = null; } }
  if (!id) id = (await createFile(MAIN, getMeta().rootId, 'application/json', body)).id;
  await writeSnapshot();
  const still = getData().updatedAt !== stamp;
  setMeta({ fileId: id, dirty: still, lastSyncAt: new Date().toISOString() });
  if (still) again = true;
}
async function pushFile() {
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
  const fm = storageMode() === 'file';
  try {
    let remote;
    if (fm) { const d = await fileRead(); remote = d ? { data: d } : null; }
    else {
      if (!navigator.onLine) throw err('offline', { net: true });
      await ensureLayout(); remote = await readRemote();
    }
    const local = getData(), m = getMeta();
    if (remote?.data?.updatedAt && (!local.updatedAt || remote.data.updatedAt > local.updatedAt)) {
      let pick = 'remote';
      if (m.dirty && local.vehicles.length && conflictHandler) pick = await conflictHandler(remote.data, local);
      if (pick === 'remote') replaceData(remote.data, { dirty: false });
    }
    if (getMeta().dirty || (!remote && (fm || getData().vehicles.length))) await (fm ? pushFile() : push());
    retry = 0; setStatus('idle');
  } catch (e) {
    if (e.net || e instanceof TypeError) setStatus('offline', e.message);
    else if (e.auth || e.status === 401 || e.status === 403) setStatus('auth', e.message);
    else setStatus('error', e.message);
    retry++; if (status !== 'auth') schedule(Math.min(60000, 4000 * 2 ** retry));
  } finally { syncing = false; if (again) { again = false; schedule(500); } }
}
function schedule(ms = DEBOUNCE) { clearTimeout(timer); timer = setTimeout(syncNow, ms); }
function onDirty() {
  if (!isConnected()) return;
  setStatus(storageMode() === 'drive' && !navigator.onLine ? 'offline' : 'pending');
  if (getMeta().settings.autoSync) schedule();
}
export async function connect() {
  if (!hasClient()) throw err('Identifiant client Google manquant.');
  await auth();
  setMeta({ connected: true, storage: null });
  await syncNow();
}
export function disconnect() {
  delete toks[SCOPE]; clearTimeout(timer);
  setMeta({ connected: false, storage: null, fileUri: null, fileName: null, fileId: null, rootId: null, backupsId: null, docsId: null, snapId: null, snapDay: null });
  setStatus('off');
}
export function init() {
  subscribe(t => { if (t === 'dirty') onDirty(); });
  addEventListener('online', () => isConnected() && schedule(300));
  addEventListener('offline', () => storageMode() === 'drive' && setStatus('offline'));
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible' && isConnected()) schedule(300); });
  if (isConnected()) { setStatus(getMeta().dirty ? 'pending' : 'idle'); schedule(200); } else setStatus('off');
}

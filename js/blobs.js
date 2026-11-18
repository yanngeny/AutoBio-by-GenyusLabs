// Photos et documents : stockés dans IndexedDB (copie locale), puis envoyés dans le dossier Documents de Drive.
let dbp;
const db = () => dbp ||= new Promise((res, rej) => {
  const r = indexedDB.open('suivi-blobs', 1);
  r.onupgradeneeded = () => r.result.createObjectStore('blobs');
  r.onsuccess = () => res(r.result);
  r.onerror = () => rej(r.error);
});
const tx = async (mode, fn) => { const d = await db(); return new Promise((res, rej) => { const t = d.transaction('blobs', mode); const rq = fn(t.objectStore('blobs')); t.oncomplete = () => res(rq?.result); t.onerror = () => rej(t.error); }); };
export const putBlob = (id, blob) => tx('readwrite', s => s.put(blob, id));
export const getBlob = id => tx('readonly', s => s.get(id));
export const delBlob = id => tx('readwrite', s => s.delete(id));
export async function shrinkImage(file, max = 1600, q = 0.82) {
  if (!file.type.startsWith('image/')) return file;
  try {
    const bmp = await createImageBitmap(file);
    const k = Math.min(1, max / Math.max(bmp.width, bmp.height));
    const c = document.createElement('canvas'); c.width = Math.round(bmp.width * k); c.height = Math.round(bmp.height * k);
    c.getContext('2d').drawImage(bmp, 0, 0, c.width, c.height);
    return await new Promise(r => c.toBlob(b => r(b || file), 'image/jpeg', q));
  } catch { return file; }
}

// Copies de sécurité locales (mode « fichier choisi », où l'on ne peut pas écrire à côté du fichier).
export const putKV = putBlob, getKV = getBlob, delKV = delBlob;
export async function listPrefix(prefix) {
  const d = await db();
  return new Promise((res, rej) => {
    const out = [], t = d.transaction('blobs', 'readonly'), rq = t.objectStore('blobs').openCursor(IDBKeyRange.bound(prefix, prefix + '\uffff'));
    rq.onsuccess = () => { const c = rq.result; if (c) { out.push({ key: c.key, value: c.value }); c.continue(); } };
    t.oncomplete = () => res(out); t.onerror = () => rej(t.error);
  });
}

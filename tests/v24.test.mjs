const mem = {}; globalThis.localStorage = { getItem: k => mem[k] ?? null, setItem: (k, v) => { mem[k] = String(v); }, removeItem: k => { delete mem[k]; } };
const U = await import('../js/update.js');
let bad = 0; const t = (n, ok) => { console.log(ok ? 'OK  ' : 'FAIL', n); if (!ok) bad++; };
t('0.1.24 > 0.1.23', U.isNewer('0.1.24', '0.1.23'));
t('v0.2.0 > 0.1.99', U.isNewer('v0.2.0', '0.1.99'));
t('0.1.10 > 0.1.9 (numérique)', U.isNewer('0.1.10', '0.1.9'));
t('égal : pas plus récent', !U.isNewer('0.1.23', '0.1.23'));
t('plus ancien : pas plus récent', !U.isNewer('0.1.22', '0.1.23'));
t('suffixe ignoré', !U.isNewer('0.1.23-debug', '0.1.23'));
const assets = [{ name: 'AutoBio-debug.apk', browser_download_url: 'https://x/debug.apk' }, { name: 'AutoBio.apk', browser_download_url: 'https://x/signed.apk' }, { name: 'notes.txt', browser_download_url: 'https://x/n' }];
t('APK signé préféré', U.pickApk(assets) === 'https://x/signed.apk');
t('à défaut le debug', U.pickApk([assets[0]]) === 'https://x/debug.apk');
t('aucun APK', U.pickApk([assets[2]]) === '' && U.pickApk() === '');
const rel = { tag_name: 'v0.1.30', html_url: 'https://github.com/r', assets, body: 'Nouveautés' };
const p = U.parseRelease(rel, '0.1.23');
t('parseRelease', p.version === '0.1.30' && p.newer && p.apk.endsWith('signed.apk') && p.url === 'https://github.com/r');
t('parseRelease invalide', U.parseRelease({}) === null && U.parseRelease({ tag_name: 'nightly' }) === null);
t('fetchLatest ok', (await U.fetchLatest(async () => ({ ok: true, json: async () => rel }), '0.1.30')).newer === false);
let e1 = null; try { await U.fetchLatest(async () => ({ ok: false, status: 403 })); } catch (e) { e1 = e; }
t('fetchLatest erreur HTTP', e1 && /403/.test(e1.message));
let e2 = null; try { await U.fetchLatest(async () => ({ ok: true, json: async () => ({}) })); } catch (e) { e2 = e; }
t('fetchLatest réponse inattendue', !!e2);
process.exit(bad ? 1 : 0);

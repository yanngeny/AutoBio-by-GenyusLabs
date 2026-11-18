const { chromium } = require('playwright');
const fs = require('fs');
// Jeu de données synthétique au format AutoBio (aucune donnée réelle).
const os = require('os'), path = require('path');
const MAIN = 'AutoBio_live-data.json';
const BACKUP = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'autobio-')), 'AutoBio_export_test.json');
{
  const day = i => new Date(Date.UTC(2026, 0, 10 + i * 25)).toISOString().slice(0, 10);
  fs.writeFileSync(BACKUP, JSON.stringify({
    schema: 1, updatedAt: '2026-11-01T10:00:00.000Z',
    vehicles: [{ id: 'v1', name: 'Voiture Test', brand: 'Marque', model: 'Test', year: 2020, fuelType: 'Essence', mileage: 60500, ctNextDate: '2027-11-13', insuranceDate: '2027-03-01', plan: [] }],
    maintenances: [{ id: 'm1', vehicleId: 'v1', date: '2025-11-05', mileage: 50000, cost: 100, garage: 'Garage A', notes: '', tags: ['Vidange'], planIds: [], label: 'Vidange' }, { id: 'm2', vehicleId: 'v1', date: '2026-05-05', mileage: 55000, cost: 139, garage: 'Garage B', notes: '', tags: ['Freins'], planIds: [], label: 'Freins' }],
    fuels: Array.from({ length: 13 }, (_, i) => ({ id: 'f' + i, vehicleId: 'v1', date: day(i), mileage: 54500 + 500 * i, liters: 40.5, total: 81, pricePerLiter: 2, full: true, station: '', ignoreConso: i % 5 === 4 })),
    expenses: [{ id: 'x1', vehicleId: 'v1', date: '2026-03-01', amount: 1000, category: 'Assurance', notes: '' }], documents: [],
  }));
}
const BASE = 'http://localhost:8099/index.html';
const OUT = require('path').join(__dirname, 'shots'); fs.mkdirSync(OUT, { recursive: true });
let n = 0; const files = {}; const cal = {}; let down = false; const log = [];
const id = () => 'F' + (++n);
function mockDrive(route, req) {
  if (down) return route.abort('internetdisconnected');
  const u = new URL(req.url()), m = req.method(), p = u.pathname;
  const ok = (o, st = 200) => route.fulfill({ status: st, contentType: 'application/json', body: JSON.stringify(o) });
  if (p.startsWith('/calendar/v3/calendars/primary/events')) {
    const idm = p.match(/events\/([^/]+)$/);
    if (m === 'POST') { const b = JSON.parse(req.postData()); const e = { id: 'E' + (++n), ...b }; cal[e.id] = e; return ok({ id: e.id }); }
    if (m === 'PATCH' && idm) { if (!cal[idm[1]]) return ok({}, 404); Object.assign(cal[idm[1]], JSON.parse(req.postData())); return ok({ id: idm[1] }); }
    if (m === 'DELETE' && idm) { delete cal[idm[1]]; return route.fulfill({ status: 204, body: '' }); }
    return ok({ error: 'cal unhandled' }, 500);
  }
  log.push(m + ' ' + p);
  if (m === 'GET' && p === '/drive/v3/files') {
    const q = u.searchParams.get('q') || ''; const name = (q.match(/name='((?:[^'\\]|\\.)*)'/) || [])[1]; const par = (q.match(/'([^']+)' in parents/) || [])[1]; const folder = q.includes('folder');
    const r = Object.values(files).filter(f => !f.trashed && (!name || f.name === name.replace(/\\'/g, "'")) && (!par || f.parents?.includes(par)) && (!folder || f.mime.includes('folder')) && (folder || !f.mime.includes('folder') || !name));
    return ok({ files: r.map(f => ({ id: f.id, name: f.name, modifiedTime: f.modified })) });
  }
  if (m === 'POST' && p === '/drive/v3/files') { const b = JSON.parse(req.postData()); const f = { id: id(), name: b.name, mime: b.mimeType, parents: b.parents, content: '', modified: new Date().toISOString() }; files[f.id] = f; return ok({ id: f.id }); }
  if (m === 'POST' && p === '/upload/drive/v3/files') {
    const body = req.postDataBuffer().toString('utf8'); const parts = body.split(/\r\n--b[a-z0-9]+(?:--)?\r\n?/).filter(x => x.trim());
    const meta = JSON.parse(parts[0].split('\r\n\r\n')[1]); const content = parts[1] ? parts[1].split('\r\n\r\n').slice(1).join('\r\n\r\n').replace(/\r\n--b[a-z0-9]+--\s*$/, '') : '';
    const f = { id: id(), name: meta.name, mime: 'application/json', parents: meta.parents, content, modified: new Date().toISOString() }; files[f.id] = f; return ok({ id: f.id, modifiedTime: f.modified });
  }
  const mm = p.match(/\/drive\/v3\/files\/([^/]+)$/), mu = p.match(/\/upload\/drive\/v3\/files\/([^/]+)$/);
  if (m === 'PATCH' && mu) { const f = files[mu[1]]; if (!f) return ok({}, 404); f.content = req.postData(); f.modified = new Date().toISOString(); return ok({ id: f.id }); }
  if (m === 'GET' && mm) { const f = files[mm[1]]; if (!f) return ok({}, 404); return route.fulfill({ status: 200, contentType: 'application/json', body: f.content }); }
  if (m === 'DELETE' && mm) { delete files[mm[1]]; return route.fulfill({ status: 204, body: '' }); }
  return ok({ error: 'unhandled ' + m + p }, 500);
}
const GSI = `window.google={accounts:{oauth2:{initTokenClient:c=>({requestAccessToken:()=>setTimeout(()=>c.callback({access_token:'tok',expires_in:3600}),5)})}}};`;
let nativeFile = { content: null };
async function newPage(browser, meta, native) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, locale: 'fr-FR', timezoneId: 'Europe/Paris', deviceScaleFactor: 1 });
  await ctx.route('https://accounts.google.com/gsi/client', r => r.fulfill({ contentType: 'text/javascript', body: GSI }));
  await ctx.route('https://www.googleapis.com/**', mockDrive);
  const page = await ctx.newPage();
  if (native) {
    await page.exposeFunction('__nRead', () => nativeFile.content);
    await page.exposeFunction('__nWrite', c => { nativeFile.content = c; });
    await page.addInitScript(() => { window.Capacitor = { Plugins: { AutoBioFile: { pickFile: async ({ mode }) => ({ uri: 'content://test/doc.json', name: 'AutoBio_live-data.json', mode }), read: async () => ({ content: await window.__nRead() }), write: async ({ content }) => { await window.__nWrite(content); return {}; } } } }; });
  }
  page.on('pageerror', e => console.log('PAGEERROR', e.message));
  page.on('console', m => { if (m.type() === 'error') console.log('CONSOLE', m.text()); });
  await page.addInitScript(m => { if (!localStorage.getItem('suivi.meta.v1')) localStorage.setItem('suivi.meta.v1', JSON.stringify(m)); }, meta);
  await page.goto(BASE); return page;
}
const check = (name, cond, extra = '') => { console.log((cond ? 'OK   ' : 'FAIL ') + name + (extra ? ' — ' + extra : '')); if (!cond) process.exitCode = 1; };
const shot = (p, name) => p.screenshot({ path: `${OUT}/${name}.png` });
(async () => {
  const browser = await chromium.launch();
  const page = await newPage(browser, { onboarded: true, settings: { clientId: 'test-client', autoSync: true, snapshots: true } });
  // --- import
  await page.goto(BASE + '#/restaurer'); await page.reload();
  await page.setInputFiles('#impfile', BACKUP);
  await page.waitForSelector('text=Contenu du fichier');
  const prev = await page.innerText('main');
  check('aperçu import : 1 véhicule, 2 entretiens, 13 pleins, 1 autre dépense', /1\s*véhicule/.test(prev) && /2\s*entretiens/.test(prev) && /13\s*pleins/.test(prev) && /1\s*autre dépense/.test(prev));
    await shot(page, '01-import-apercu');
  await page.click('[data-act=do-import]');
  await page.waitForSelector('text=Données chargées');
  await page.waitForFunction(() => document.querySelector('[data-pill] span, #app')?.textContent.length > 0);
  await page.waitForTimeout(800);
  const main = Object.values(files).find(f => f.name === MAIN);
  check('document de travail créé sur Drive après restauration', !!main);
  const d1 = JSON.parse(main.content);
  check('contenu Drive : 1 véhicule / 2 entretiens / 13 pleins / 1 dépense', d1.vehicles.length === 1 && d1.maintenances.length === 2 && d1.fuels.length === 13 && d1.expenses.length === 1);
  check('copie datée créée dans Sauvegardes', Object.values(files).some(f => /^AutoBio_backup_\d{4}-\d{2}-\d{2}\.json$/.test(f.name)));
  check('Drive : _note en tête du fichier', /working file/i.test(d1._note || ''));
  // --- écrans
  await page.goto(BASE + '#/'); await shot(page, '02-garage');
  const vid = d1.vehicles[0].id;
  await page.goto(BASE + `#/v/${vid}/pleins`); const pl = await page.innerText('main');
  check('conso moyenne 8,1 et 16,2 €/100 km', /8,1/.test(pl) && /16,2/.test(pl), pl.replace(/\s+/g, ' ').slice(0, 90));
  await shot(page, '03-pleins');
  await page.goto(BASE + `#/v/${vid}/depenses`); const dp = await page.innerText('main');
  check('total dépenses 2 292 €', /2\s292\s€/.test(dp.replace(/[  ]/g, ' ')), dp.replace(/\s+/g, ' ').slice(0, 80));
  await shot(page, '04-depenses');
  await page.goto(BASE + `#/v/${vid}`); await shot(page, '05-fiche');
  // --- plan + rappels
  await page.goto(BASE + `#/v/${vid}/plan/new`);
  await page.fill('[name=label]', 'Vidange moteur'); await page.fill('[name=everyKm]', '15000'); await page.fill('[name=everyMonths]', '12'); await page.fill('[name=lastKm]', '60500'); await page.fill('[name=lastDate]', '2026-11-05');
  await shot(page, '06-form-operation');
  await page.click('button[type=submit]');
  await page.waitForSelector('dialog[open] >> text=Ajouter à ton agenda');
  const dl1 = await page.innerText('dialog[open]');
  check('pop-up agenda après création d’une opération : Vidange moteur proposée', /Vidange moteur/.test(dl1) && /5 nov\. 2027/.test(dl1), dl1.replace(/\s+/g, ' ').slice(0, 140));
  await page.click('dialog[open] >> text=Plus tard');
  await page.goto(BASE + '#/rappels'); const rp = (await page.innerText('main')).replace(/[  ]/g, ' ');
  check('rappel vidange : échéance à 75 500 km ou le 5 nov. 2027', /75 500 km ou le 5 nov. 2027/.test(rp), rp.replace(/\s+/g, ' ').slice(-120));
  await shot(page, '07-rappels');
  // --- bouton agenda (lien pré-rempli + création native)
  await page.goto(BASE + '#/rappels'); const links = await page.locator('a[data-cal][href^="https://calendar.google.com/calendar/render"]').count();
  check('rappels : bouton « Ajouter à l’agenda » (lien pré-rempli)', links >= 2, String(links));
  const href = await page.locator('a[data-cal][href*="text=Contr"]').first().getAttribute('href');
  check('lien agenda : titre, dates et rappel pré-remplis', /text=Contr%C3%B4le\+technique/.test(href) && /dates=20271113%2F20271114/.test(href), href.slice(0, 140));
  await page.evaluate(() => { window.__cal = []; window.Capacitor = { Plugins: { AutoBioCalendar: { addEvent: async e => { window.__cal.push(e); } } } }; });
  await page.locator('a[data-cal][href*="text=Contr"]').first().click(); await page.waitForTimeout(300);
  const ce = await page.evaluate(() => window.__cal);
  check('APK : création native en un appui (sans ouvrir de page)', ce.length === 1 && ce[0].allDay && ce[0].start === '2027-11-13' && ce[0].title.startsWith('Contrôle technique'), JSON.stringify(ce[0] || {}).slice(0, 120));
  await page.evaluate(() => { delete window.Capacitor; });
  await shot(page, '07b-rappels-agenda');
  // --- ajout entretien => envoi auto
  const before = log.length;
  await page.goto(BASE + `#/v/${vid}/entretien/new`);
  await page.check('input[value^="p:"]'); await page.fill('[name=cost]', '120,50'); await page.fill('[name=garage]', 'Test Garage'); await page.fill('[name=mileage]', '60800');
  await shot(page, '08-form-entretien');
  await page.click('button[type=submit]');
  await page.waitForSelector('dialog[open] >> text=Ajouter à ton agenda');
  const dl2 = await page.innerText('dialog[open]');
  check('pop-up agenda après un entretien : prochaine vidange à +12 mois / +15 000 km', /Vidange moteur/.test(dl2) && /75\s800\skm/.test(dl2) && new RegExp(String(new Date().getFullYear() + 1)).test(dl2), dl2.replace(/\s+/g, ' ').slice(0, 160));
  await shot(page, '08b-popup-agenda');
  await page.click('dialog[open] >> text=Plus tard');
  await page.waitForTimeout(4200);
  const d2 = JSON.parse(Object.values(files).find(f => f.name === MAIN).content);
  check('entretien envoyé automatiquement sur Drive', d2.maintenances.length === 3 && d2.maintenances.some(m => m.garage === 'Test Garage' && m.cost === 120.5));
  const snap = Object.values(files).find(f => /^AutoBio_backup_\d{4}/.test(f.name)); check('copie datée mise à jour', JSON.parse(snap.content).maintenances.length === 3);
  check('une seule copie datée (pas de doublon)', Object.values(files).filter(f => /^AutoBio_backup_\d{4}-\d{2}-\d{2}\.json$/.test(f.name)).length === 1);
  // --- hors connexion
  down = true; await page.evaluate(() => dispatchEvent(new Event('offline')));
  await page.goto(BASE + `#/v/${vid}/plein/new`);
  await page.fill('[name=liters]', '40'); await page.fill('[name=total]', '80'); await page.fill('[name=mileage]', '61000'); await page.click('button[type=submit]');
  await page.waitForTimeout(3500);
  const pillOff = await page.innerText('[data-pill]').catch(() => '');
  await page.goto(BASE + '#/'); const pillTxt = await page.innerText('[data-pill]');
  check('hors connexion : pastille « Hors connexion »', /Hors connexion/.test(pillTxt), pillTxt);
  check('hors connexion : rien envoyé', JSON.parse(Object.values(files).find(f => f.name === MAIN).content).fuels.length === 13);
  await shot(page, '09-hors-connexion');
  down = false; await page.evaluate(() => dispatchEvent(new Event('online')));
  await page.waitForTimeout(2500);
  const d3 = JSON.parse(Object.values(files).find(f => f.name === MAIN).content);
  check('retour réseau : plein rattrapé et envoyé', d3.fuels.length === 14);
  check('pastille de nouveau « Synchronisé »', /Synchronisé/.test(await page.innerText('[data-pill]')));
  // --- réglages
  await page.goto(BASE + '#/reglages'); await page.waitForTimeout(600); await shot(page, '10-reglages');
  const rg = await page.innerText('main'); check('réglages : liste des sauvegardes', /AutoBio_backup_\d{4}-\d{2}-\d{2}/.test(rg), rg.replace(/\s+/g,' ').slice(-160));
  // --- nouveau téléphone : récupère tout depuis Drive
  const page2 = await newPage(browser, { connected: true, onboarded: true, settings: { clientId: 'test-client', autoSync: true, snapshots: true } });
  await page2.waitForTimeout(1500);
  const g2 = await page2.innerText('main'); check('nouveau téléphone : récupère le véhicule depuis Drive', /Voiture Test/.test(g2), g2.replace(/\s+/g, ' ').slice(0, 80));
  await shot(page2, '11-nouveau-telephone');
  // --- mode fichier choisi (plugin Android simulé) : première installation
  const pf = await newPage(browser, {}, true);
  await pf.waitForSelector('text=As-tu déjà utilisé AutoBio');
  check('accueil : question « As-tu déjà utilisé AutoBio ? » au premier lancement', true);
  await shot(pf, '12-accueil');
  await pf.click('[data-act=onb][data-v=no]'); await pf.click('[data-act=link-file][data-kind=create]');
  await pf.waitForSelector('text=Mes véhicules');
  check('mode fichier : fichier créé à la première installation', !!nativeFile.content && JSON.parse(nativeFile.content).schema === 1);
  await pf.goto(BASE + '#/restaurer'); await pf.setInputFiles('#impfile', BACKUP); await pf.waitForSelector('text=Charger mes données');
  await pf.click('[data-act=do-import]'); await pf.waitForSelector('text=Données chargées'); await pf.waitForTimeout(1200);
  const nf1 = JSON.parse(nativeFile.content);
  check('mode fichier : import écrit dans le fichier choisi', nf1.vehicles.length === 1 && nf1.fuels.length === 13, nf1.vehicles.length + '/' + nf1.fuels.length);
  await pf.goto(BASE + `#/v/${nf1.vehicles[0].id}/plein/new`);
  await pf.fill('[name=liters]', '41'); await pf.fill('[name=total]', '82'); await pf.fill('[name=mileage]', '61500'); await pf.click('button[type=submit]');
  await pf.waitForTimeout(4000);
  check('mode fichier : nouveau plein écrit automatiquement', JSON.parse(nativeFile.content).fuels.length === 14);
  await pf.goto(BASE + '#/reglages'); await pf.waitForTimeout(700); await shot(pf, '13-reglages-fichier');
  const rgf = await pf.innerText('main'); check('mode fichier : copies de sécurité locales listées', /AutoBio_backup_\d{4}/.test(rgf) && /Fichier : AutoBio_live-data/.test(rgf), rgf.replace(/\s+/g, ' ').slice(0, 120));
  // --- réinstallation : « Oui, retrouver mon fichier »
  const pg = await newPage(browser, {}, true);
  await pg.waitForSelector('text=As-tu déjà utilisé AutoBio');
  await pg.click('[data-act=onb][data-v=yes]'); await pg.click('[data-act=link-file][data-kind=open]');
  await pg.waitForSelector('text=Voiture Test');
  check('réinstallation : le fichier existant est relié et les données reviennent', true);
  await shot(pg, '14-relink');
  // --- première installation côté web : connexion Drive et relink
  const pw = await newPage(browser, { settings: { clientId: 'test-client', autoSync: true, snapshots: true } });
  await pw.waitForSelector('text=As-tu déjà utilisé AutoBio');
  await pw.click('[data-act=onb][data-v=yes]'); await pw.click('[data-act=connect]');
  await pw.waitForSelector('text=Voiture Test');
  check('web : « Oui » + connexion Drive retrouve le fichier existant', true);
  // --- guide Google Drive (API)
  const pg2 = await newPage(browser, { onboarded: true, settings: { clientId: '', autoSync: true, snapshots: true } });
  await pg2.goto(BASE + '#/guide-drive'); await pg2.waitForSelector('text=Guide Google Drive');
  const gl = await pg2.locator('a[href^="https://console.cloud.google.com/"]').evaluateAll(a => a.map(x => x.href));
  check('guide Drive : boutons vers les bonnes pages Google Cloud', gl.some(h => h.includes('apis/library/drive.googleapis.com')) && gl.some(h => h.includes('apis/credentials/consent')) && gl.some(h => h.includes('apis/credentials')) && gl.some(h => h.includes('projectcreate')), gl.join(' '));
  await shot(pg2, '15-guide-drive');
  // --- catalogue Audi
  await pg2.evaluate(() => localStorage.setItem('suivi.data.v1', JSON.stringify({ schema: 1, updatedAt: '2026-11-01T00:00:00Z', vehicles: [{ id: 'va', name: 'Audi A3', brand: 'Audi', model: 'A3 Sportback', mileage: 40000, plan: [] }], maintenances: [], fuels: [], expenses: [], documents: [] })));
  await pg2.goto(BASE + '#/'); await pg2.reload();
  await pg2.goto(BASE + '#/v/va/catalogue'); await pg2.waitForSelector('text=Plan constructeur');
  check('catalogue : modèle deviné depuis « A3 Sportback »', (await pg2.locator('[data-cat=model]').inputValue()) === 'a3');
  await pg2.selectOption('[data-cat=pt]', 'tdi');
  await pg2.waitForSelector('text=Filtre à carburant');
  const cl = await pg2.innerText('main');
  check('catalogue A3 TDI : vidange 15 000 km, révision 30 000 km, filtre diesel, pas de bougies', /Vidange huile moteur/.test(cl) && /tous les 30\s000\skm ou tous les 2 ans/.test(cl) && !/Bougies/.test(cl));
  await shot(pg2, '16-catalogue');
  await pg2.fill('[name=catLastKm]', '38000'); await pg2.fill('[name=catLastDate]', '2026-06-01');
  await pg2.click('[data-act=cat-apply]'); await pg2.waitForSelector('text=Plan d’entretien');
  const plan = await pg2.evaluate(() => JSON.parse(localStorage.getItem('suivi.data.v1')).vehicles[0].plan);
  const oil = plan.find(o => /Vidange/.test(o.label));
  check('catalogue : plan ajouté avec sources et point de départ', plan.length >= 5 && oil.everyKm === 15000 && oil.lastKm === 38000 && oil.lastDate === '2026-06-01' && oil.source.length > 0 && plan.find(o => /Courroie/.test(o.label)).enabled === false, JSON.stringify(plan.map(o => o.label)));
  await pg2.goto(BASE + '#/rappels'); const rp2 = (await pg2.innerText('main')).replace(/[  ]/g, ' ');
  check('rappels générés par le plan catalogue', /Vidange huile moteur/.test(rp2) && /Révision/.test(rp2));
  // --- notifications : programmation
  const nl = await pg2.evaluate(async () => { const N = await import('./js/notify.js'); N.__x = 0; return N.plan(new Date('2026-01-01T00:00:00')).map(n => ({ t: n.title, at: n.schedule.at.toISOString(), icon: n.smallIcon })); });
  check('notifications : J-7 et jour J programmés à 9 h pour les échéances', nl.length >= 2 && nl.some(n => /^Dans 7 jours/.test(n.t)) && nl.some(n => /^Aujourd’hui/.test(n.t)) && nl.every(n => n.icon === 'ic_stat_autobio'), JSON.stringify(nl.slice(0, 2)));
  // plugin natif simulé : activation + planification
  const pn = await newPage(browser, { onboarded: true, settings: { clientId: 'test-client', autoSync: true, snapshots: true } });
  await pn.evaluate(() => { window.__sched = []; window.__pending = []; window.Capacitor = { Plugins: { LocalNotifications: { checkPermissions: async () => ({ display: 'prompt' }), requestPermissions: async () => ({ display: 'granted' }), getPending: async () => ({ notifications: window.__pending }), cancel: async () => { window.__pending = []; }, schedule: async ({ notifications }) => { window.__sched.push(...notifications); window.__pending = notifications.map(n => ({ id: n.id })); } } } }; });
  await pn.evaluate(() => localStorage.setItem('suivi.data.v1', JSON.stringify({ schema: 1, updatedAt: '2026-11-01T00:00:00Z', vehicles: [{ id: 'vn', name: 'Test', mileage: 1000, ctNextDate: '2030-05-01', plan: [] }], maintenances: [], fuels: [], expenses: [], documents: [] })));
  await pn.reload(); await pn.evaluate(() => { window.Capacitor = { Plugins: { LocalNotifications: { checkPermissions: async () => ({ display: 'prompt' }), requestPermissions: async () => ({ display: 'granted' }), getPending: async () => ({ notifications: window.__pending || [] }), cancel: async () => { window.__pending = []; }, schedule: async ({ notifications }) => { (window.__sched = window.__sched || []).push(...notifications); window.__pending = notifications.map(n => ({ id: n.id })); } } } }; });
  await pn.goto(BASE + '#/reglages'); await pn.waitForSelector('text=Notifications des échéances');
  await pn.evaluate(() => { document.querySelector('input[data-setting=notif]').click(); });
  await pn.waitForTimeout(1800);
  const sc = await pn.evaluate(() => window.__sched || []);
  check('APK : activation des notifications → échéances programmées via le plugin', sc.length >= 2 && sc.some(n => /Contrôle technique/.test(n.title)), JSON.stringify(sc.map(n => n.title)));
  await shot(pn, '17-reglages-notifications');
  console.log('requests:', log.length);
  await browser.close();
})();

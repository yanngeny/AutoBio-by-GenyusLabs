const { chromium } = require('playwright');
const fs = require('fs');
// Jeu de données synthétique au format AutoBio (aucune donnée réelle).
const os = require('os'), path = require('path');
const MAIN = 'AutoBio_document-de-travail_remplace-automatiquement_ne-pas-modifier.json';
const BACKUP = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'autobio-')), 'AutoBio_copie-manuelle_test.json');
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
    await page.addInitScript(() => { window.Capacitor = { Plugins: { AutoBioFile: { pickFile: async ({ mode }) => ({ uri: 'content://test/doc.json', name: 'AutoBio_document-de-travail_remplace-automatiquement_ne-pas-modifier.json', mode }), read: async () => ({ content: await window.__nRead() }), write: async ({ content }) => { await window.__nWrite(content); return {}; } } } }; });
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
  check('copie datée créée dans Sauvegardes', Object.values(files).some(f => /^AutoBio_copie-datee_\d{4}-\d{2}-\d{2}\.json$/.test(f.name)));
  check('Drive : _note explicite en tête du fichier', /document de travail JSON/i.test(d1._note || ''));
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
  await page.waitForTimeout(4200);
  const d2 = JSON.parse(Object.values(files).find(f => f.name === MAIN).content);
  check('entretien envoyé automatiquement sur Drive', d2.maintenances.length === 3 && d2.maintenances.some(m => m.garage === 'Test Garage' && m.cost === 120.5));
  const snap = Object.values(files).find(f => /^AutoBio_copie-datee_\d{4}/.test(f.name)); check('copie datée mise à jour', JSON.parse(snap.content).maintenances.length === 3);
  check('une seule copie datée (pas de doublon)', Object.values(files).filter(f => /^AutoBio_copie-datee_\d{4}-\d{2}-\d{2}\.json$/.test(f.name)).length === 1);
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
  const rg = await page.innerText('main'); check('réglages : liste des sauvegardes', /AutoBio_copie-datee_\d{4}-\d{2}-\d{2}/.test(rg), rg.replace(/\s+/g,' ').slice(-160));
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
  const rgf = await pf.innerText('main'); check('mode fichier : copies de sécurité locales listées', /AutoBio_copie-datee_\d{4}/.test(rgf) && /Fichier : AutoBio_document-de-travail/.test(rgf), rgf.replace(/\s+/g, ' ').slice(0, 120));
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
  console.log('requests:', log.length);
  await browser.close();
})();

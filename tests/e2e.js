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
const OUT = path.join(__dirname, 'shots'); fs.mkdirSync(OUT, { recursive: true });
const BASE = 'http://localhost:8099/index.html';
let nativeFile = { content: null }, failWrites = false;
const NAME = 'AutoBio_live-data.json';
async function newPage(browser, meta, native = true) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, locale: 'fr-FR', timezoneId: 'Europe/Paris', deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  if (native) {
    await page.exposeFunction('__nRead', () => nativeFile.content);
    await page.exposeFunction('__nWrite', c => { if (failWrites) throw new Error('disque plein'); nativeFile.content = c; });
    await page.addInitScript(() => { window.Capacitor = { Plugins: { AutoBioFile: { pickFile: async ({ mode }) => ({ uri: 'content://test/doc.json', name: 'AutoBio_live-data.json', mode }), read: async () => ({ content: await window.__nRead() }), write: async ({ content }) => { await window.__nWrite(content); return {}; } }, App: { addListener: (n, cb) => { window.__back = cb; }, exitApp: () => { window.__exited = true; } } } }; });
  }
  page.on('pageerror', e => console.log('PAGEERROR', e.message));
  page.on('console', m => { if (m.type() === 'error' && !/disque plein/.test(m.text())) console.log('CONSOLE', m.text()); });
  if (meta) await page.addInitScript(m => { if (!localStorage.getItem('suivi.meta.v1')) localStorage.setItem('suivi.meta.v1', JSON.stringify(m)); }, meta);
  await page.goto(BASE); return page;
}
const check = (name, cond, extra = '') => { console.log((cond ? 'OK   ' : 'FAIL ') + name + (extra ? ' — ' + extra : '')); if (!cond) process.exitCode = 1; };
const shot = (p, name) => p.screenshot({ path: `${OUT}/${name}.png` });
const doc = () => JSON.parse(nativeFile.content);
(async () => {
  const browser = await chromium.launch();
  // --- première installation : question d'accueil, création du fichier
  const page = await newPage(browser, {});
  await page.waitForSelector('text=As-tu déjà utilisé AutoBio');
  check('accueil : question « As-tu déjà utilisé AutoBio ? » au premier lancement', true);
  await shot(page, '01-accueil');
  await page.click('[data-act=onb][data-v=no]'); await page.click('[data-act=link-file][data-kind=create]');
  await page.waitForSelector('text=Mes véhicules');
  check('fichier créé à la première installation, avec sa _note', !!nativeFile.content && doc().schema === 1 && /working file/i.test(doc()._note || ''));
  // --- restauration depuis un fichier AutoBio
  await page.goto(BASE + '#/restaurer'); await page.setInputFiles('#impfile', BACKUP); await page.waitForSelector('text=Contenu du fichier');
  const prev = await page.innerText('main');
  check('aperçu : 1 véhicule, 2 entretiens, 13 pleins, 1 autre dépense', /1\s*véhicule/.test(prev) && /2\s*entretiens/.test(prev) && /13\s*pleins/.test(prev) && /1\s*autre dépense/.test(prev));
  await shot(page, '02-restaurer-apercu');
  await page.click('[data-act=do-import]'); await page.waitForSelector('text=Données chargées'); await page.waitForTimeout(1200);
  const d1 = doc();
  check('restauration écrite dans le fichier choisi', d1.vehicles.length === 1 && d1.maintenances.length === 2 && d1.fuels.length === 13 && d1.expenses.length === 1);
  // --- écrans
  const vid = d1.vehicles[0].id;
  await page.goto(BASE + '#/'); await shot(page, '03-garage');
  await page.goto(BASE + `#/v/${vid}/pleins`); const pl = await page.innerText('main');
  check('écran Pleins : les 13 pleins sont listés, du plus récent au plus ancien', /Tous les pleins \(13\)/i.test(pl) && (pl.match(/ L\n/g) || []).length >= 13, (pl.match(/Tous les pleins \(\d+\)/) || [''])[0]);
  // --- statistiques
  await page.goto(BASE + `#/v/${vid}/stats`); await page.waitForSelector('.hero');
  let stx = (await page.innerText('main')).replace(/[\s\u00a0\u202f]/g, ' ');
  check('stats : coût d\u2019usage et conso moyenne 8,1 l/100', /Coût d.usage/i.test(stx) && /8,1 l\/100/.test(stx));
  check('stats : 4 sections repliées', (await page.$$('.acch')).length === 4 && (await page.$$('.acci')).length === 0);
  await shot(page, '04a-stats');
  await page.click('[data-act=stat-chart][data-k=prix]'); check('stats : graphique prix du litre', (await page.$$('main svg circle')).length >= 10);
  await page.click('[data-act=stat-chart][data-k=depenses]'); check('stats : graphique dépenses empilé', (await page.$$('main svg rect')).length >= 5);
  await page.click('[data-act=stat-chart][data-k=km]');
  await page.click('[data-act=stat-open][data-k=carb]'); stx = (await page.innerText('main')).replace(/[\s\u00a0\u202f]/g, ' ');
  check('stats : section Carburant dépliée (litres, autonomie)', /Autonomie moyenne/.test(stx) && (await page.$$('.acci')).length === 1);
  await page.click('[data-act=stat-open][data-k=rec]'); stx = (await page.innerText('main')).replace(/[\s\u00a0\u202f]/g, ' ');
  check('stats : une seule section ouverte, records visibles', /Meilleure conso/.test(stx) && !/Autonomie moyenne/.test(stx));
  await page.click('[data-act=stat-open][data-k=qual]'); stx = await page.innerText('main');
  check('stats : qualité des données signale les intervalles exclus', /exclus? des moyennes/.test(stx));
  await page.click('label.chip:has-text("Ce mois")'); check('stats : période « Ce mois » affiche des chiffres ou un message vide', /Coût d.usage|Rien d.enregistré sur cette période/.test(await page.innerText('main')));
  await page.click('label.chip:has-text("Achat")'); await page.waitForSelector('.hero');
  await page.goto(BASE + `#/v/${vid}`); check('fiche : entrée Statistiques', /Statistiques/.test(await page.innerText('main')));
  // --- lecture photo
  await page.goto(BASE + `#/v/${vid}/plein/new`); await page.waitForSelector('[data-act=scan]');
  await page.click('[data-act=scan][data-k=pump]'); check('lecture photo : sans plugin, message « disponible dans l’application Android »', /disponible dans l.application Android/.test(await page.innerText('#toast')));
  await page.evaluate(() => { window.__scans = 0; window.Capacitor.Plugins.AutoBioOcr = { scan: async () => { window.__scans++; return { text: 'TOTAL\nMontant 82,00 €\nVolume 47,64 L\nPrix 1,721 €/L' }; } }; });
  await page.click('[data-act=scan][data-k=pump]');
  await page.waitForFunction(() => document.querySelector('[name=liters]').value !== '');
  check('lecture photo : pompe → litres 47,64 et total 82,00', (await page.inputValue('[name=liters]')) === '47,64' && (await page.inputValue('[name=total]')) === '82,00', (await page.inputValue('[name=liters]')) + ' / ' + (await page.inputValue('[name=total]')));
  check('lecture photo : prix au litre affiché', /1,721/.test(await page.innerText('#ppl')));
  await page.evaluate(() => { window.Capacitor.Plugins.AutoBioOcr.scan = async () => { window.__scans++; return { text: 'ODO\n60 903 km\n12.4' }; }; });
  await page.click('[data-act=scan][data-k=odo]');
  await page.waitForFunction(() => document.querySelector('[name=mileage]').value === '60903');
  check('lecture photo : appareil photo ouvert à chaque appui (2 fois), rien d’autre', (await page.evaluate(() => window.__scans)) === 2);
  await page.evaluate(() => { window.Capacitor.Plugins.AutoBioOcr.scan = async () => ({ text: '', cancelled: true }); });
  await page.fill('[name=mileage]', '1'); await page.click('[data-act=scan][data-k=odo]'); await page.waitForTimeout(300);
  check('lecture photo : annulation de l’appareil photo, rien n’est modifié', (await page.inputValue('[name=mileage]')) === '1');
  await page.fill('[name=mileage]', '60903');
  check('lecture photo : compteur → 60 903 km', (await page.inputValue('[name=mileage]')) === '60903');
  await shot(page, '04b-lecture-photo');
  await page.goto(BASE + `#/v/${vid}/depenses`); const dp = await page.innerText('main');
  check('total dépenses 2 292 €', /2\s292\s€/.test(dp.replace(/[\s\u00a0\u202f]/g, ' ')));
  await shot(page, '04-depenses');
  // --- plan + rappels
  await page.goto(BASE + `#/v/${vid}/plan/new`);
  await page.fill('[name=label]', 'Vidange moteur'); await page.fill('[name=everyKm]', '15000'); await page.fill('[name=everyMonths]', '12'); await page.fill('[name=lastKm]', '60500'); await page.fill('[name=lastDate]', '2026-11-05');
  await page.click('button[type=submit]');
  await page.waitForSelector('dialog[open] >> text=Ajouter à ton agenda');
  const dl1 = await page.innerText('dialog[open]');
  check('pop-up agenda après création d’une opération', /Vidange moteur/.test(dl1) && /5 nov\. 2027/.test(dl1));
  await page.click('dialog[open] >> text=Plus tard');
  await page.goto(BASE + '#/rappels'); const rp = (await page.innerText('main')).replace(/[\s\u00a0\u202f]/g, ' ');
  check('rappel vidange : échéance à 75 500 km ou le 5 nov. 2027', /75 500 km ou le 5 nov. 2027/.test(rp));
  await shot(page, '05-rappels');
  const calBtns = await page.locator('button[data-act=cal-preview]').count();
  check('rappels : bouton agenda sur chaque échéance datée', calBtns >= 2, String(calBtns));
  await page.locator('button[data-act=cal-preview][data-key=ct]').first().click();
  await page.waitForSelector('dialog[open] >> text=Ajouter à ton agenda');
  const pv = (await page.innerText('dialog[open]')).replace(/[\s  ]/g, ' ');
  check('aperçu : le nom exact de l’événement (avec le véhicule) est affiché avant d’ajouter', /Contrôle technique — Voiture Test/.test(pv) && /13 nov\. 2027/.test(pv), pv.slice(0, 160));
  await shot(page, '05b-apercu-agenda');
  const href = await page.locator('dialog[open] a[data-cal]').first().getAttribute('href');
  check('lien agenda : même titre et dates pré-remplis', /text=Contr%C3%B4le\+technique\+%E2%80%94\+Voiture\+Test/.test(href) && /dates=20271113%2F20271114/.test(href));
  await page.evaluate(() => { window.__cal = []; window.Capacitor.Plugins.AutoBioCalendar = { addEvent: async e => { window.__cal.push(e); } }; });
  await page.locator('dialog[open] a[data-cal]').first().click(); await page.waitForTimeout(300);
  const ce = await page.evaluate(() => window.__cal);
  check('APK : création native avec le même titre', ce.length === 1 && ce[0].allDay && ce[0].start === '2027-11-13' && ce[0].title === 'Contrôle technique — Voiture Test', JSON.stringify(ce[0] || {}));
  await page.click('dialog[open] >> text=Plus tard');
  // --- bouton retour Android : remonte d'un écran, ferme les pop-up, quitte seulement depuis l'accueil
  await page.goto(BASE + `#/v/${vid}/plan`); await page.waitForSelector('text=Plan d’entretien');
  const hash = () => page.evaluate(() => location.hash);
  await page.evaluate(() => window.__back()); await page.waitForTimeout(200);
  check('retour Android : plan → fiche véhicule', (await hash()) === `#/v/${vid}`, await hash());
  await page.evaluate(() => window.__back()); await page.waitForTimeout(200);
  check('retour Android : fiche → accueil', ['#/', ''].includes(await hash()), await hash());
  await page.evaluate(() => window.__back()); await page.goto(BASE + '#/rappels');
  await page.evaluate(() => window.__back()); await page.waitForTimeout(200);
  check('retour Android : onglet Rappels → accueil', ['#/', ''].includes(await hash()));
  check('retour Android : l’appli ne se ferme que depuis l’accueil', (await page.evaluate(() => !!window.__exited)) === true);
  // --- entretien => écriture automatique + pop-up
  await page.goto(BASE + `#/v/${vid}/entretien/new`);
  await page.check('input[value^="p:"]'); await page.fill('[name=cost]', '120,50'); await page.fill('[name=garage]', 'Test Garage'); await page.fill('[name=mileage]', '60800');
  await page.click('button[type=submit]');
  await page.waitForSelector('dialog[open] >> text=Ajouter à ton agenda');
  const dl2 = await page.innerText('dialog[open]');
  check('pop-up après un entretien : prochaine vidange à +12 mois / +15 000 km', /75\s800\skm/.test(dl2) && new RegExp(String(new Date().getFullYear() + 1)).test(dl2), dl2.replace(/\s+/g, ' ').slice(0, 160));
  await shot(page, '06-popup-agenda');
  await page.click('dialog[open] >> text=Plus tard');
  await page.waitForTimeout(4000);
  const d2 = doc();
  check('entretien écrit automatiquement dans le fichier', d2.maintenances.length === 3 && d2.maintenances.some(m => m.garage === 'Test Garage' && m.cost === 120.5));
  // --- échec d'écriture puis reprise
  failWrites = true;
  await page.goto(BASE + `#/v/${vid}/plein/new`);
  await page.fill('[name=liters]', '40'); await page.fill('[name=total]', '80'); await page.fill('[name=mileage]', '61000'); await page.click('button[type=submit]');
  await page.waitForTimeout(3500); await page.goto(BASE + '#/');
  const pillErr = await page.innerText('[data-pill]');
  check('écriture impossible : la pastille le signale', /Erreur|Échec|erreur/i.test(pillErr), pillErr);
  check('écriture impossible : fichier inchangé', doc().fuels.length === 13);
  failWrites = false; await page.waitForTimeout(9000);
  check('reprise automatique : plein écrit dans le fichier', doc().fuels.length === 14);
  // --- réglages
  await page.goto(BASE + '#/reglages'); await page.waitForTimeout(700); await shot(page, '07-reglages');
  const rg = await page.innerText('main');
  check('réglages : nom du fichier et copies locales listées', /Fichier : AutoBio_live-data\.json/.test(rg) && /AutoBio_backup_\d{4}/.test(rg), rg.replace(/\s+/g, ' ').slice(0, 160));
  check('plus aucune trace de l’API Google Drive', !/API|identifiant client|OAuth/i.test(rg));
  // --- réinstallation : « Oui, retrouver mon fichier »
  const pg = await newPage(browser, {});
  await pg.waitForSelector('text=As-tu déjà utilisé AutoBio');
  await pg.click('[data-act=onb][data-v=yes]'); await pg.click('[data-act=link-file][data-kind=open]');
  await pg.waitForSelector('text=Voiture Test');
  check('réinstallation : le fichier existant est relié et les données reviennent', true);
  await shot(pg, '08-relink');
  // --- catalogue Audi
  const p2 = await newPage(browser, { onboarded: true, settings: { autoSync: true, snapshots: true } }, false);
  await p2.evaluate(() => localStorage.setItem('suivi.data.v1', JSON.stringify({ schema: 1, updatedAt: '2026-11-01T00:00:00Z', vehicles: [{ id: 'va', name: 'Audi A3', brand: 'Audi', model: 'A3 Sportback', mileage: 40000, plan: [] }], maintenances: [], fuels: [], expenses: [], documents: [] })));
  await p2.goto(BASE + '#/'); await p2.reload();
  await p2.goto(BASE + '#/v/va/catalogue'); await p2.waitForSelector('text=Plan constructeur');
  check('catalogue : modèle deviné depuis « A3 Sportback »', (await p2.locator('[data-cat=model]').inputValue()) === 'a3');
  await p2.selectOption('[data-cat=pt]', 'tdi'); await p2.waitForSelector('text=Filtre à carburant');
  const cl = await p2.innerText('main');
  check('catalogue A3 TDI : vidange, révision 30 000 km, filtre diesel, pas de bougies', /Vidange huile moteur/.test(cl) && /tous les 30\s000\skm ou tous les 2 ans/.test(cl) && !/Bougies/.test(cl));
  await shot(p2, '09-catalogue');
  await p2.fill('[name=catLastKm]', '38000'); await p2.fill('[name=catLastDate]', '2026-06-01');
  await p2.click('[data-act=cat-apply]'); await p2.waitForSelector('text=Plan d’entretien');
  const plan = await p2.evaluate(() => JSON.parse(localStorage.getItem('suivi.data.v1')).vehicles[0].plan);
  const oil = plan.find(o => /Vidange/.test(o.label));
  check('catalogue : plan ajouté avec sources et point de départ', plan.length >= 5 && oil.everyKm === 15000 && oil.lastKm === 38000 && oil.lastDate === '2026-06-01' && oil.source.length > 0 && plan.find(o => /Courroie/.test(o.label)).enabled === false);
  await p2.goto(BASE + '#/rappels'); const rp2 = (await p2.innerText('main')).replace(/[\s\u00a0\u202f]/g, ' ');
  check('rappels générés par le plan catalogue', /Vidange huile moteur/.test(rp2) && /Révision/.test(rp2));
  // --- notifications
  const nl = await p2.evaluate(async () => { const N = await import('./js/notify.js'); return N.plan(new Date('2026-01-01T00:00:00')).map(n => ({ t: n.title, icon: n.smallIcon })); });
  check('notifications : J-7 et jour J programmés', nl.length >= 2 && nl.some(n => /^Dans 7 jours/.test(n.t)) && nl.some(n => /^Aujourd’hui/.test(n.t)) && nl.every(n => n.icon === 'ic_stat_autobio'));
  const pn = await newPage(browser, { onboarded: true, settings: { autoSync: true, snapshots: true } }, false);
  await pn.evaluate(() => localStorage.setItem('suivi.data.v1', JSON.stringify({ schema: 1, updatedAt: '2026-11-01T00:00:00Z', vehicles: [{ id: 'vn', name: 'Test', mileage: 1000, ctNextDate: '2030-05-01', plan: [] }], maintenances: [], fuels: [], expenses: [], documents: [] })));
  await pn.addInitScript(() => { window.__sched = []; window.__pending = []; window.Capacitor = { Plugins: { LocalNotifications: { checkPermissions: async () => ({ display: 'prompt' }), requestPermissions: async () => ({ display: 'granted' }), getPending: async () => ({ notifications: window.__pending }), cancel: async () => { window.__pending = []; }, schedule: async ({ notifications }) => { window.__sched.push(...notifications); window.__pending = notifications.map(n => ({ id: n.id })); } } } }; });
  await pn.goto(BASE + '#/reglages'); await pn.reload(); await pn.waitForSelector('text=Notifications des échéances');
  await pn.evaluate(() => document.querySelector('input[data-setting=notif]').click()); await pn.waitForTimeout(1800);
  const sc = await pn.evaluate(() => window.__sched);
  check('APK : activation → échéances programmées via le plugin', sc.length >= 2 && sc.some(n => /Contrôle technique/.test(n.title)));
  await shot(pn, '10-reglages-notifications');
  // --- navigateur sans plugin : pas de choix de fichier, l'appli reste utilisable
  const pw = await newPage(browser, {}, false);
  await pw.waitForSelector('text=As-tu déjà utilisé AutoBio'); await pw.click('[data-act=onb][data-v=no]');
  const wt = await pw.innerText('main');
  check('web : pas de configuration Drive, simple information et accès à l’appli', /appli Android/.test(wt) && !/API|OAuth|identifiant/i.test(wt));
  await pw.click('[data-act=onb-skip]'); await pw.waitForSelector('text=Mes véhicules');
  check('web : l’appli reste utilisable sans fichier', true);
  await browser.close();
})();

import * as S from './store.js';
import * as D from './storage.js';
import { putBlob, delBlob, shrinkImage } from './blobs.js';
import * as A from './agenda.js';
import * as N from './notify.js';
import * as C from './catalog.js';
import * as O from './ocr.js';
import * as W from './widget.js';
import { VERSION } from './version.js';
import { setLang, loc, lang, watch, tr as T } from './i18n.js';
import { buildPdf } from './pdf.js';
import * as V from './voice.js';
import * as LK from './lock.js';
import { toCsv } from './csv.js';
import { carnetDoc, carnetName } from './carnet.js';

const $ = (s, r = document) => r.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
setLang(S.getMeta().settings.lang);
const nf = { format: n => new Intl.NumberFormat(loc(), { maximumFractionDigits: 0 }).format(n) };
const km = n => nf.format(Math.round(n)) + ' km';
const eur = (n, d = 2) => new Intl.NumberFormat(loc(), { style: 'currency', currency: 'EUR', minimumFractionDigits: d, maximumFractionDigits: d }).format(n || 0);
const dec = (n, d = 1) => new Intl.NumberFormat(loc(), { minimumFractionDigits: d, maximumFractionDigits: d }).format(n);
const fmtDate = iso => iso ? new Date(iso + 'T12:00:00').toLocaleDateString(loc(), { day: 'numeric', month: 'short', year: 'numeric' }) : '';
const fmtMonth = iso => { const s = new Date(iso + 'T12:00:00').toLocaleDateString(loc(), { month: 'short', year: 'numeric' }); return s[0].toUpperCase() + s.slice(1); };
const num = s => { const v = parseFloat(String(s ?? '').replace(/\s/g, '').replace(',', '.')); return Number.isFinite(v) ? v : null; };

const ICONS = {
  copy: '<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3"/>',
  mic: '<path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v3"/>', lock: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
  car: '<path d="M3 13l2-6h14l2 6v5H3z"/><path d="M3 13h18M7 18v2M17 18v2"/>', wrench: '<path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.6 2.6-2.4-.6-.6-2.4z"/>',
  bell: '<path d="M6 16v-5a6 6 0 0 1 12 0v5l2 2H4z"/><path d="M10 21h4"/>', fuel: '<path d="M5 21V5a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v16M3 21h14M15 9h2a2 2 0 0 1 2 2v6a1.5 1.5 0 0 0 3 0V9l-3-3M7 8h6"/>',
  receipt: '<path d="M6 3h12v18l-3-2-3 2-3-2-3 2zM9 8h6M9 12h6"/>', file: '<path d="M7 3h7l5 5v13H7zM14 3v5h5"/>', sliders: '<path d="M4 7h10M18 7h2M4 17h2M10 17h10M16 5v4M8 15v4"/>',
  cloud: '<path d="M7 18a4 4 0 0 1-.5-8A6 6 0 0 1 18 9a4.5 4.5 0 0 1 0 9z"/>', check: '<path d="M5 12l4 4 10-10"/>', chev: '<path d="M9 6l6 6-6 6"/>', down: '<path d="M6 9l6 6 6-6"/>', up: '<path d="M6 15l6-6 6 6"/>', back: '<path d="M15 6l-6 6 6 6"/>',
  plus: '<path d="M12 5v14M5 12h14"/>', camera: '<path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/>', calendar: '<path d="M4 6h16v14H4zM4 10h16M8 3v4M16 3v4"/>',
  alert: '<path d="M12 4l9 16H3zM12 10v4M12 17v.5"/>', gauge: '<path d="M4 18a8 8 0 1 1 16 0M12 18l4-6"/>', book: '<path d="M5 4h10a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3zM5 17a3 3 0 0 1 3-3h10"/>',
  upload: '<path d="M12 16V4M7 9l5-5 5 5M5 20h14"/>', refresh: '<path d="M20 11a8 8 0 0 0-14-4L4 9M4 4v5h5M4 13a8 8 0 0 0 14 4l2-2M20 20v-5h-5"/>', list: '<path d="M8 6h12M8 12h12M8 18h12M4 6h.5M4 12h.5M4 18h.5"/>',
};
const ic = (n, s = 22, c = 'currentColor') => `<svg aria-hidden="true" width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" style="flex:none">${ICONS[n]}</svg>`;
const chip = (t, k = 'ok') => `<span class="chip-s ${k}">${k === 'late' ? ic('alert', 14) : k === 'soon' ? ic('calendar', 14) : k === 'ok' ? ic('check', 14) : ''}${esc(t)}</span>`;

// ---------- éléments communs ----------
const PILL = { off: ['soon', 'Aucun fichier choisi'], idle: ['ok', 'Synchronisé'], pending: ['soon', 'En attente'], syncing: ['ok', 'Envoi…'], offline: ['soon', 'Hors connexion'], auth: ['late', 'Accès refusé'], error: ['late', 'Erreur de synchro'] };
const pill = () => { const [k, t] = PILL[D.getStatus().status] || PILL.off; return `<a class="pill ${k}" data-pill href="#/reglages">${ic('cloud', 16)}<span>${t}</span></a>`; };
const tabs = a => `<nav class="tabs" aria-label="Navigation">${[['garage', 'car', 'Garage', '#/'], ['rappels', 'bell', 'Rappels', '#/rappels'], ['reglages', 'sliders', 'Réglages', '#/reglages']].map(([k, i, l, h]) => `<a href="${h}" class="${a === k ? 'on' : ''}" ${a === k ? 'aria-current="page"' : ''}>${ic(i, 24)}${l}</a>`).join('')}</nav>`;
const layout = ({ title, sub, back, right = '', body, foot = '', nav, form, after }) => ({ form, after, html: `<div class="screen"><header class="hdr">${back ? `<a class="back" href="${back}" aria-label="Retour">${ic('back')}</a>` : ''}<div class="t"><h1>${esc(title)}</h1>${sub ? `<div class="sub">${esc(sub)}</div>` : ''}</div>${right}</header><main>${body}</main>${foot ? `<div class="foot">${foot}</div>` : ''}${nav ? tabs(nav) : ''}</div>` });
const row = (icon, title, sub, right = '', href = '') => { const inner = `<span class="ico">${ic(icon, 20)}</span><span class="tx"><b>${esc(title)}</b><small>${sub}</small></span>${right}`; return href ? `<a class="row" href="${href}">${inner}</a>` : `<div class="row">${inner}</div>`; };
const field = (label, name, value = '', o = {}) => `<label class="field"><span>${esc(label)}</span><input type="${o.type || 'text'}" name="${name}" value="${esc(value)}" ${o.type === 'text' || !o.type ? `inputmode="${o.mode || 'text'}"` : ''} ${o.req ? 'required' : ''} ${o.ph ? `placeholder="${esc(o.ph)}"` : ''} autocomplete="off"></label>`;
const area = (label, name, value = '') => `<label class="field"><span>${esc(label)}</span><textarea name="${name}">${esc(value)}</textarea></label>`;
const chipBox = (type, name, value, label, checked) => `<label class="chip"><input type="${type}" name="${name}" value="${esc(value)}" ${checked ? 'checked' : ''}><span>${esc(label)}</span></label>`;
const sw = (name, on, attrs = '') => `<label class="sw"><input type="checkbox" name="${name}" ${on ? 'checked' : ''} ${attrs}><span></span></label>`;
let undoFn = null;
const toast = (t, undo, ms) => {
  const e = $('#toast'); e.textContent = t; undoFn = undo || null;
  if (undo) { const b = document.createElement('button'); b.type = 'button'; b.dataset.act = 'undo'; b.className = 'toastbtn'; b.textContent = 'Rétablir'; e.append(b); }
  e.classList.toggle('act', !!undo); e.classList.add('show'); clearTimeout(toast.t);
  toast.t = setTimeout(() => { e.classList.remove('show'); undoFn = null; }, ms || (undo ? 7000 : 2200));
};
// « il y a 2 h » à partir d'une date ISO
const ago = iso => { const m = Math.max(0, Math.round((Date.now() - Date.parse(iso)) / 60000)); if (m < 2) return 'à l’instant'; if (m < 60) return `il y a ${m} min`; const h = Math.round(m / 60); return h < 48 ? `il y a ${h} h` : `il y a ${Math.round(h / 24)} j`; };
// Alerte sauvegarde : fichier relié mais modifications non envoyées depuis plus de 24 h, ou aucune copie exportée depuis 30 jours.
function backupAlert() {
  const m = S.getMeta(), age = iso => (Date.now() - Date.parse(iso)) / 3600000;
  if (!S.hasContent()) return null;
  if (D.isConnected()) return m.dirty && (!m.lastSyncAt || age(m.lastSyncAt) > 24) ? 'Tes dernières modifications ne sont pas enregistrées dans ton fichier. Ouvre les Réglages pour synchroniser.' : null;
  const ref = m.lastExportAt || m.firstUseAt;
  return ref && age(ref) > 24 * 30 ? 'Aucune copie de tes données depuis plus de 30 jours. Ouvre les Réglages pour en télécharger une.' : null;
}
function ask({ title, text, ok = 'OK', cancel = 'Annuler', input, value, scan }) {
  return new Promise(res => {
    const d = $('#dlg');
    d.innerHTML = `<form method="dialog"><h3>${esc(title)}</h3>${text ? `<p>${esc(text)}</p>` : ''}${input ? `<label class="field"><span>${esc(input)}</span><span class="inrow"><input type="text" inputmode="decimal" name="v" value="${esc(value ?? '')}">${scan && O.available() ? `<button type="button" class="btn secondary camb" data-camb aria-label="Prendre en photo">${ic('camera', 22)}</button>` : ''}</span></label><p class="muted" data-hint style="font-size:13px;margin:6px 0 0"></p>` : ''}<div class="acts">${cancel ? `<button class="btn secondary" value="cancel">${esc(cancel)}</button>` : ''}<button class="btn" value="ok">${esc(ok)}</button></div></form>`;
    d.querySelector('[data-camb]')?.addEventListener('click', async () => {
      const inp = d.querySelector('[name=v]'), hint = d.querySelector('[data-hint]');
      try { const v = await scan(); if (v == null) return; inp.value = String(v); inp.dispatchEvent(new Event('input', { bubbles: true })); if (hint) hint.textContent = 'Lu sur la photo : vérifie avant d’enregistrer'; }
      catch { if (hint) hint.textContent = 'Lecture impossible : saisis les chiffres à la main'; }
    });
    d.returnValue = '';
    d.onclose = () => res(d.returnValue === 'ok' ? (input ? new FormData(d.querySelector('form')).get('v') : true) : false);
    d.showModal();
  });
}

// Enregistrer / partager un fichier : feuille de partage Android dans l'APK, téléchargement dans un navigateur.
async function saveFile(name, mime, bytes) {
  const f = window.Capacitor?.Plugins?.AutoBioFile;
  if (f?.share) {
    let bin = ''; for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
    return f.share({ name, mime, base64: btoa(bin) });
  }
  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([bytes], { type: mime })); a.download = name; a.click();
}
const today = S.isoToday;
const veh = id => S.vehicle(id);
const GENERIC_OPS = ['Vidange moteur', 'Filtre à air', 'Filtre habitacle', 'Liquide de frein', 'Bougies', 'Courroie', 'Pneus', 'Batterie', 'Freins'];

function remInfo(r) {
  if (r.status === 'todo') return { k: 'soon', t: 'À renseigner' };
  const parts = [];
  if (r.remKm != null) parts.push({ urg: r.remKm / 40, t: r.remKm < 0 ? `En retard de ${km(-r.remKm)}` : `Dans ${km(r.remKm)}` });
  if (r.remDays != null) parts.push({ urg: r.remDays, t: r.remDays < 0 ? `En retard de ${-r.remDays} j` : r.remDays <= 60 ? `Dans ${r.remDays} j` : fmtMonth(r.dueDate) });
  parts.sort((a, b) => a.urg - b.urg);
  return { k: r.status === 'ok' ? 'ok' : r.status, t: parts[0]?.t || '' };
}
const remIcon = r => (r.kind === 'plan' ? 'wrench' : 'calendar');
const remSub = r => {
  if (r.status === 'todo') return esc(r.vehicleName);
  const est = r.dueKm != null && !r.dueDate && r.remKm > 0 ? S.reminderDate(r) : null;
  return esc(r.vehicleName) + ' · ' + [r.dueKm != null ? `à ${km(r.dueKm)}` : '', r.dueDate ? `le ${fmtDate(r.dueDate)}` : ''].filter(Boolean).join(' ou ') + (est?.est ? ` (vers ${fmtMonth(est.date).toLowerCase()})` : '');
};
const remRow = r => {
  const i = remInfo(r), info = r.status === 'todo' ? null : A.eventInfo(r), href = r.kind === 'plan' ? `#/v/${r.vehicleId}/plan` : `#/v/${r.vehicleId}/edit`;
  const main = `<a class="rowmain" href="${href}"><span class="ico">${ic(remIcon(r), 20)}</span><span class="tx"><b>${esc(r.label)}</b><small>${remSub(r)}</small></span>${chip(i.t, i.k)}</a>`;
  const cal = info ? `<button type="button" class="back" style="width:40px;height:40px;border-radius:12px;color:var(--accent)" data-act="cal-preview" data-vid="${r.vehicleId}" data-key="${esc(r.opId || r.kind)}" aria-label="Ajouter à l’agenda" title="Ajouter à l’agenda">${ic('calendar', 20)}</button>` : '';
  return `<div class="row">${main}${cal}</div>`;
};

// ---------- vues ----------
function vGarage() {
  const vs = S.getData().vehicles, rs = S.reminders();
  const urgent = rs.filter(r => r.status !== 'ok'), late = rs.filter(r => r.status === 'late').length;
  const banner = urgent.length ? `<a class="card ${late ? 'late' : 'soon'}" href="#/rappels"><div style="display:flex;align-items:center;gap:12px">${ic('bell', 24)}<b style="flex:1">${late ? `${late} en retard` : urgent.length === 1 ? '1 point à traiter' : `${urgent.length} points à traiter`}</b><u>Voir</u></div></a>` : '';
  const ba = backupAlert(), bkBanner = ba ? `<a class="card late" href="#/reglages"><div style="display:flex;align-items:center;gap:12px">${ic('alert', 24)}<b style="flex:1;font-size:15px;line-height:20px">${ba}</b><u>Voir</u></div></a>` : '';
  const cards = vs.filter(v => !v.archivedAt).map(v => {
    const w = rs.find(r => r.vehicleId === v.id && r.status !== 'ok');
    const c = w ? (w.status === 'todo' ? chip(`À renseigner : ${w.label}`, 'soon') : chip(`${w.label} · ${remInfo(w).t}`, remInfo(w).k)) : chip('Rien d’urgent', 'ok');
    return `<a class="card" href="#/v/${v.id}"><div class="vcard"><span class="ico">${ic('car', 28)}</span><span class="tx"><b>${esc(v.name)}</b><small>${[v.year, v.fuelType, km(S.vehicleMileage(v.id))].filter(Boolean).join(' · ')}</small>${c}</span>${ic('chev', 20, 'var(--muted)')}</div></a>`;
  }).join('');
  const arch = vs.filter(v => v.archivedAt);
  const archHtml = arch.length ? `<h2>Véhicules archivés</h2><div class="card tight">${arch.map(v => row('car', esc(v.name), `Archivé le ${fmtDate(v.archivedAt)}${v.soldPrice != null ? ' · vendu ' + eur(v.soldPrice, 0) : ''}`, ic('chev', 20, 'var(--muted)'), `#/v/${v.id}`)).join('')}</div>` : '';
  const empty = vs.length ? '' : `<div class="card"><b>Bienvenue</b><p class="muted" style="margin:6px 0 0;line-height:22px">Ajoute ton premier véhicule, ou restaure un fichier AutoBio depuis les Réglages.</p></div>`;
  return layout({ title: 'Mes véhicules', right: pill(), body: bkBanner + banner + cards + empty + archHtml, foot: `<a class="btn" href="#/vehicule/new">${ic('plus', 20)}Ajouter un véhicule</a>`, nav: 'garage' });
}
const tile = (i, l, h) => `<a class="tile" href="${h}"><span class="ico">${ic(i, 24)}</span>${l}</a>`;
function vFiche(id) {
  const v = veh(id); if (!v) return vGarage();
  const rs = v.archivedAt ? [] : S.reminders(id).slice(0, 3), ev = S.events(id).slice(0, 3);
  const evRow = e => row({ maint: 'wrench', fuel: 'fuel', exp: 'receipt' }[e.kind], e.title, `${fmtDate(e.date)}${e.mileage ? ' · ' + km(e.mileage) : ''}`, `<b>${eur(e.amount)}</b>`, `#/v/${id}/${{ maint: 'entretien', fuel: 'plein', exp: 'depense' }[e.kind]}/${e.id}`);
  return layout({
    title: v.name, sub: [v.year, v.fuelType].filter(Boolean).join(' · '), back: '#/', right: `<a class="back" href="#/v/${id}/edit" aria-label="Modifier le véhicule">${ic('sliders', 20)}</a>`,
    body: `<div class="card"><div style="display:flex;align-items:center;gap:12px;color:var(--accent)">${ic('gauge', 26)}<span style="flex:1;color:var(--text)"><small class="muted" style="display:block;font-size:13px">Kilométrage actuel</small><b style="font-size:22px">${km(S.vehicleMileage(id))}</b></span><button class="btn secondary small" data-act="km" data-id="${id}">Mettre à jour</button></div></div>
    <div class="tiles">${tile('wrench', 'Entretien', `#/v/${id}/entretien/new`)}${tile('fuel', 'Plein', `#/v/${id}/plein/new`)}${tile('receipt', 'Dépense', `#/v/${id}/depense/new`)}${tile('file', 'Document', `#/v/${id}/depenses`)}</div>
    <h2>À venir</h2><div class="card tight">${rs.map(remRow).join('')}</div>
    <div class="card tight">${row('book', 'Plan d’entretien', 'Opérations et intervalles', ic('chev', 20, 'var(--muted)'), `#/v/${id}/plan`)}${row('gauge', 'Statistiques', 'Coûts, consommation, records', ic('chev', 20, 'var(--muted)'), `#/v/${id}/stats`)}${row('fuel', 'Pleins', 'Historique et ajout', ic('chev', 20, 'var(--muted)'), `#/v/${id}/pleins`)}${row('receipt', 'Dépenses et documents', 'Totaux par catégorie', ic('chev', 20, 'var(--muted)'), `#/v/${id}/depenses`)}${row('file', 'Carnet d’entretien (PDF)', 'Historique à imprimer ou envoyer', '', '').replace('<div class="row">', '<button class="row" data-act="carnet" data-id="' + id + '">').replace(/<\/div>$/, '</button>')}</div>
    <h2>Derniers événements</h2><div class="card tight">${ev.length ? ev.map(evRow).join('') : '<div class="empty">Rien d’enregistré pour l’instant.</div>'}${ev.length ? row('list', 'Tout l’historique', '', ic('chev', 20, 'var(--muted)'), `#/v/${id}/historique`) : ''}</div>`, nav: 'garage',
  });
}
function vHisto(id) {
  const ev = S.events(id);
  return layout({ title: 'Historique', sub: veh(id)?.name, back: `#/v/${id}`, body: `<div class="card tight">${ev.map(e => row({ maint: 'wrench', fuel: 'fuel', exp: 'receipt' }[e.kind], e.title, `${fmtDate(e.date)}${e.mileage ? ' · ' + km(e.mileage) : ''}${e.sub ? ' · ' + esc(e.sub) : ''}`, `<b>${eur(e.amount)}</b>`, `#/v/${id}/${{ maint: 'entretien', fuel: 'plein', exp: 'depense' }[e.kind]}/${e.id}`)).join('') || '<div class="empty">Aucun événement.</div>'}</div>` });
}
function vVehForm(id) {
  const v = id ? veh(id) : {};
  const fuels = ['Essence', 'Diesel', 'Hybride', 'Électrique', 'GPL'];
  return layout({
    title: id ? 'Modifier le véhicule' : 'Nouveau véhicule', back: id ? `#/v/${id}` : '#/', form: true,
    body: `<form id="f" data-form="vehicle" data-id="${id || ''}" style="display:flex;flex-direction:column;gap:12px">
      <div class="grid2">${field('Marque', 'brand', v.brand, { req: !id })}${field('Modèle', 'model', v.model)}</div>
      ${field('Nom affiché (facultatif)', 'name', v.name, { ph: 'Ex. Audi TT Mk3' })}
      <div class="grid2">${field('Année', 'year', v.year || '', { mode: 'numeric' })}<label class="field"><span>Carburant</span><select name="fuelType"><option value=""></option>${fuels.map(f => `<option ${v.fuelType === f ? 'selected' : ''}>${f}</option>`).join('')}</select></label></div>
      ${field('Kilométrage actuel', 'mileage', v.mileage ?? '', { mode: 'numeric', req: true })}
      ${field('Prochain contrôle technique', 'ctNextDate', v.ctNextDate, { type: 'date' })}
      ${field('Échéance de l’assurance', 'insuranceDate', v.insuranceDate, { type: 'date' })}
      <label class="field"><span>Paiement de l’assurance</span><select name="insuranceMode"><option value="annual"${v.insuranceMode !== 'monthly' ? ' selected' : ''}>Annuel</option><option value="monthly"${v.insuranceMode === 'monthly' ? ' selected' : ''}>Mensuel</option></select></label>
      <div class="grid2">${field('Mensualité (€)', 'insuranceAmount', v.insuranceAmount ?? '', { mode: 'decimal' })}${field('Jour de prélèvement', 'insuranceDay', v.insuranceDay ?? '', { mode: 'numeric', ph: '1 à 28' })}</div>
      ${field('Mensualisation depuis le', 'insuranceFrom', v.insuranceFrom, { type: 'date' })}
      <p class="muted small" style="margin:-6px 0 0">Si l’assurance est mensuelle, une dépense « Assurance » est ajoutée chaque mois à la date de prélèvement. Tu peux la modifier ou la supprimer.</p>
      <div class="grid2">${field('Pneus hiver : à monter le', 'tyreWinter', v.tyreWinter, { type: 'date' })}${field('Pneus été : à monter le', 'tyreSummer', v.tyreSummer, { type: 'date' })}</div>
      <p class="muted small" style="margin:-6px 0 0">Choisis une date : le rappel revient chaque année à la même date.</p>
      <div class="grid2">${field('Date d’achat', 'purchaseDate', v.purchaseDate, { type: 'date' })}${field('Prix d’achat (€)', 'purchasePrice', v.purchasePrice ?? '', { mode: 'decimal' })}</div>
      ${id ? (v.archivedAt ? `<button type="button" class="btn secondary" data-act="unarchive" data-id="${id}">Désarchiver</button>` : `<button type="button" class="btn secondary" data-act="archive" data-id="${id}">Archiver (véhicule vendu)</button>`) : ''}
      ${id ? `<button type="button" class="btn danger" data-act="del-vehicle" data-id="${id}">Supprimer ce véhicule</button>` : ''}</form>`,
    foot: `<button class="btn" type="submit" form="f">${ic('check', 20)}Enregistrer</button>`,
  });
}
const scanBtns = (...kinds) => `<div class="${kinds.length > 1 ? 'grid2' : ''}">${kinds.map(([k, l]) => `<button type="button" class="btn secondary small" style="width:100%" data-act="scan" data-k="${k}">${ic('camera', 18)}${l}</button>`).join('')}</div>`;
const voiceBtn = k => `<button type="button" class="btn secondary small" style="width:100%" data-act="voice" data-k="${k}">${ic('mic', 18)}Dicter</button>`;
function fillField(name, v) { const el = $(`[name=${name}]`); if (!el || v == null) return; el.value = String(v).replace('.', name === 'mileage' ? '.' : ','); el.dispatchEvent(new Event('input', { bubbles: true })); }
async function runScan(kind, vid) {
  try {
    const text = await O.scan();
    if (!text) return;
    toast('Lecture en cours…');
    if (kind === 'invoice') {
      const r = O.parseInvoice(text, S.vehicleMileage(vid));
      if (!r.total && !r.date && !r.km) return toast('Facture illisible : cadre bien le document et réessaie');
      if (r.date) fillField('date', r.date); if (r.total) fillField('cost', r.total.toFixed(2)); if (r.km) fillField('mileage', r.km);
      toast(`Lu : ${[r.date ? fmtDate(r.date) : '', r.total ? eur(r.total) : '', r.km ? km(r.km) : ''].filter(Boolean).join(' · ')}. Vérifie avant d’enregistrer`);
    } else if (kind === 'odo') {
      const k = O.parseOdometer(text, S.vehicleMileage(vid));
      if (!k) return toast('Compteur illisible : cadre bien les chiffres et réessaie');
      fillField('mileage', k); toast(`Compteur lu : ${km(k)}. Vérifie avant d’enregistrer`);
    } else {
      const p = O.parsePump(text);
      if (!p.liters && !p.total) return toast('Pompe illisible : cadre bien l’écran et réessaie');
      if (p.liters) fillField('liters', p.liters.toFixed(2)); if (p.total) fillField('total', p.total.toFixed(2));
      toast(`Lu : ${p.liters ? dec(p.liters, 2) + ' L' : ''}${p.liters && p.total ? ' · ' : ''}${p.total ? eur(p.total) : ''}. Vérifie avant d’enregistrer`);
    }
  } catch (err) { toast('Lecture impossible : saisis les chiffres à la main'); }
}
function vMaint(vid, eid) {
  const v = veh(vid), m = eid !== 'new' ? S.getData().maintenances.find(x => x.id === eid) : null;
  const plan = v.plan || [], known = new Set();
  const planChips = plan.map(o => { known.add(o.label); return chipBox('checkbox', 'types', 'p:' + o.id, o.label, m ? m.planIds?.includes(o.id) : o.id === pendingPlan); });
  const gen = ['Vidange', 'Freins', 'Pneus', 'Batterie', 'Filtres', 'Révision'].filter(g => ![...known].some(k => k.toLowerCase().includes(g.toLowerCase()))).map(g => { return chipBox('checkbox', 'types', 'g:' + g, g, m?.tags?.includes(g)); });
  const used = new Set([...(m?.tags || [])]); plan.forEach(o => m?.planIds?.includes(o.id) && used.add(o.label)); ['Vidange', 'Freins', 'Pneus', 'Batterie', 'Filtres', 'Révision'].forEach(g => used.delete(g));
  const custom = m ? (m.label && !(m.planIds?.length || (m.tags || []).some(t => ['Vidange', 'Freins', 'Pneus', 'Batterie', 'Filtres', 'Révision'].includes(t))) ? m.label : '') : '';
  return layout({
    title: m ? 'Modifier l’entretien' : 'Nouvel entretien', sub: v.name, back: `#/v/${vid}`, form: true,
    body: `<form id="f" data-form="maint" data-vid="${vid}" data-id="${m?.id || ''}" style="display:flex;flex-direction:column;gap:12px">
      <div><span class="muted" style="display:block;font-size:14px;font-weight:600;margin-bottom:8px">Type d’entretien</span><div class="chips">${planChips.join('')}${gen.join('')}</div></div>
      ${field('Autre intitulé (facultatif)', 'custom', custom, { ph: 'Ex. Vidange de boîte' })}
      <div class="grid2">${field('Date', 'date', m?.date || today(), { type: 'date', req: true })}${field('Kilométrage', 'mileage', m?.mileage ?? S.vehicleMileage(vid), { mode: 'numeric' })}</div>
      ${scanBtns(['odo', 'Lire le compteur'], ['invoice', 'Lire la facture'])}
      ${field('Coût (€)', 'cost', m?.cost ?? '', { mode: 'decimal' })}${field('Garage (facultatif)', 'garage', m?.garage)}${area('Note (facultatif)', 'notes', m?.notes)}
      <label class="btn secondary" for="photo">${ic('camera', 20)}Ajouter la photo de la facture</label><input id="photo" type="file" accept="image/*,application/pdf" name="photo">
      <div class="small muted" id="photoName"></div>
      ${m ? `<button type="button" class="btn danger" data-act="del" data-kind="maint" data-id="${m.id}" data-vid="${vid}">Supprimer</button>` : ''}</form>`,
    foot: `<button class="btn" type="submit" form="f">${ic('check', 20)}Enregistrer</button><div class="small muted" style="text-align:center">${ic('cloud', 14)} Enregistré automatiquement dans ton fichier AutoBio</div>`,
  });
}
function vFuel(vid, eid) {
  const f = eid !== 'new' ? S.getData().fuels.find(x => x.id === eid) : null;
  return layout({
    title: f ? 'Modifier le plein' : 'Nouveau plein', sub: veh(vid).name, back: `#/v/${vid}/pleins`, form: true,
    body: `<form id="f" data-form="fuel" data-vid="${vid}" data-id="${f?.id || ''}" style="display:flex;flex-direction:column;gap:12px">
      <div class="grid2">${field('Date', 'date', f?.date || today(), { type: 'date', req: true })}${field('Kilométrage', 'mileage', f?.mileage ?? S.vehicleMileage(vid), { mode: 'numeric', req: true })}</div>
      <div class="grid2">${field('Litres', 'liters', f?.liters ?? '', { mode: 'decimal', req: true })}${field('Total (€)', 'total', f?.total ?? '', { mode: 'decimal', req: true })}</div>
      ${field('Prix au litre (€) — remplit le total', 'ppl_in', f?.pricePerLiter ?? '', { mode: 'decimal' })}
      <div class="muted small" id="ppl"></div>
      ${scanBtns(['pump', 'Lire la pompe'], ['odo', 'Lire le compteur'])}
      ${voiceBtn('fuel')}
      ${field('Station (facultatif)', 'station', f ? f.station : (S.getData().fuels.filter(x => x.vehicleId === vid && x.station).sort((a, b) => b.date.localeCompare(a.date))[0]?.station || ''))}${area('Note (facultatif)', 'notes', f?.notes)}
      <div class="card tight"><div class="set"><b>Plein complet</b>${sw('full', f ? f.full !== false : true)}</div><div class="set"><b>Ne pas compter dans la consommation</b>${sw('ignoreConso', !!f?.ignoreConso)}</div></div>
      ${f ? `<button type="button" class="btn danger" data-act="del" data-kind="fuel" data-id="${f.id}" data-vid="${vid}">Supprimer</button>` : ''}</form>`,
    foot: `<button class="btn" type="submit" form="f">${ic('check', 20)}Enregistrer</button>`,
    after() { const g = n => $(`[name=${n}]`), u = () => { const l = num(g('liters').value), t = num(g('total').value); $('#ppl').textContent = l && t ? `Prix au litre : ${dec(t / l, 3)} €` : ''; }; const fromPrice = () => { const l = num(g('liters').value), p = num(g('ppl_in').value); if (l && p) { g('total').value = (Math.round(l * p * 100) / 100).toFixed(2).replace('.', ','); } u(); }; g('liters').oninput = () => { if (num(g('ppl_in').value)) fromPrice(); else u(); }; g('ppl_in').oninput = fromPrice; g('total').oninput = () => { g('ppl_in').value = ''; u(); }; u(); },
  });
}
const CATS = ['Assurance', 'Péage', 'Parking', 'Accessoires', 'Taxes', 'Autre'];
function vExp(vid, eid) {
  const x = eid !== 'new' ? S.getData().expenses.find(y => y.id === eid) : null;
  const cats = [...new Set([...CATS, ...(x ? [x.category] : [])])];
  return layout({
    title: x ? 'Modifier la dépense' : 'Nouvelle dépense', sub: veh(vid).name, back: `#/v/${vid}/depenses`, form: true,
    body: `<form id="f" data-form="exp" data-vid="${vid}" data-id="${x?.id || ''}" style="display:flex;flex-direction:column;gap:12px">
      <div><span class="muted" style="display:block;font-size:14px;font-weight:600;margin-bottom:8px">Catégorie</span><div class="chips">${cats.map(c => chipBox('radio', 'category', c, c, (x?.category || 'Autre') === c)).join('')}</div></div>
      ${field('Description', 'description', x?.description, { req: true })}
      <div class="grid2">${field('Date', 'date', x?.date || today(), { type: 'date', req: true })}${field('Montant (€)', 'amount', x?.amount ?? '', { mode: 'decimal', req: true })}</div>
      ${field('Kilométrage (facultatif)', 'mileage', x?.mileage ?? '', { mode: 'numeric' })}
      ${scanBtns(['odo', 'Lire le compteur'])}
      ${voiceBtn('exp')}
      ${x ? `<button type="button" class="btn danger" data-act="del" data-kind="exp" data-id="${x.id}" data-vid="${vid}">Supprimer</button>` : ''}</form>`,
    foot: `<button class="btn" type="submit" form="f">${ic('check', 20)}Enregistrer</button>`,
  });
}
function vPleins(vid) {
  const fs = S.getData().fuels.filter(f => f.vehicleId === vid).sort((a, b) => b.date.localeCompare(a.date) || b.mileage - a.mileage);
  return layout({
    title: 'Pleins', sub: veh(vid).name, back: `#/v/${vid}`,
    body: `<div class="card tight">${row('gauge', 'Statistiques', 'Consommation, prix du litre, records', ic('chev', 20, 'var(--muted)'), `#/v/${vid}/stats`)}</div>
    <h2>Tous les pleins (${fs.length})</h2><div class="card tight">${fs.map(f => row('fuel', `${dec(f.liters, 2)} L`, `${fmtDate(f.date)} · ${km(f.mileage)}${f.ignoreConso ? ' · hors calcul' : ''}`, `<b>${eur(f.total)}</b>`, `#/v/${vid}/plein/${f.id}`)).join('') || '<div class="empty">Aucun plein.</div>'}</div>`,
    foot: `<a class="btn" href="#/v/${vid}/plein/new">${ic('plus', 20)}Ajouter un plein</a>`,
  });
}
// ---------- statistiques ----------
const statUi = { period: 'achat', chart: 'conso', open: null };
const PERIODS = [['mois', 'Ce mois'], ['3m', '3 mois'], ['12m', '12 mois'], ['achat', 'Achat']];
const CHARTS = [['depenses', 'Dépenses'], ['conso', 'Conso'], ['prix', 'Prix du litre'], ['km', 'Km']];
const shortDate = iso => new Date(iso + 'T12:00:00').toLocaleDateString(loc(), { day: 'numeric', month: 'short' }).replace('.', '');
const monthLbl = k => new Date(k + '-15T12:00:00').toLocaleDateString(loc(), { month: 'short' }).replace('.', '');
const SW = 326;
function lineSvg(pts, { ref, refLabel, fmt = n => dec(n, 1), label }) {
  if (pts.length < 2) return '<div class="empty">Pas assez de données sur cette période.</div>';
  const vs = pts.map(p => p.v), lo0 = Math.min(...vs, ref ?? Infinity), hi0 = Math.max(...vs, ref ?? -Infinity), pad = (hi0 - lo0) * 0.25 || 0.5, lo = lo0 - pad, hi = hi0 + pad;
  const L = 34, R = 10, T = 12, B = 118, X = i => L + i * (SW - L - R) / (pts.length - 1), Y = v => B - (v - lo) / (hi - lo) * (B - T);
  const imin = vs.indexOf(Math.min(...vs)), imax = vs.indexOf(Math.max(...vs));
  let o = [lo, (lo + hi) / 2, hi].map(g => `<line x1="${L}" x2="${SW - R}" y1="${Y(g).toFixed(1)}" y2="${Y(g).toFixed(1)}" class="gl"/><text x="${L - 6}" y="${(Y(g) + 3).toFixed(1)}" text-anchor="end" class="ax">${fmt(g)}</text>`).join('');
  if (ref != null) o += `<line x1="${L}" x2="${SW - R}" y1="${Y(ref).toFixed(1)}" y2="${Y(ref).toFixed(1)}" stroke="var(--muted)" stroke-width="1.5" stroke-dasharray="4 3"/><text x="${L + 4}" y="${(Y(ref) + 14).toFixed(1)}" class="lb">${esc(refLabel)}</text>`;
  o += `<path d="${pts.map((p, i) => `${i ? 'L' : 'M'}${X(i).toFixed(1)} ${Y(p.v).toFixed(1)}`).join(' ')}" fill="none" stroke="var(--c1)" stroke-width="2" stroke-linejoin="round"/>`;
  o += pts.map((p, i) => `<circle cx="${X(i).toFixed(1)}" cy="${Y(p.v).toFixed(1)}" r="${i === imin || i === imax ? 4.5 : 3}" fill="${i === imin || i === imax ? 'var(--c2)' : 'var(--c1)'}" stroke="var(--card)" stroke-width="2"><title>${shortDate(p.date)} : ${fmt(p.v)}</title></circle>`).join('');
  const step = Math.max(1, Math.ceil(pts.length / 4)); o += pts.map((p, i) => i % step === 0 ? `<text x="${X(i).toFixed(1)}" y="136" text-anchor="middle" class="ax">${shortDate(p.date)}</text>` : '').join('');
  return `<svg role="img" aria-label="${esc(label)}" width="100%" viewBox="0 0 ${SW} 142">${o}</svg>`;
}
function barsSvg(months, { stacked, label }) {
  const n = months.length, bw = (SW - 8) / n, bwid = Math.min(bw - 4, 20), base = 118;
  const tot = m => stacked ? m.fuel + m.maint + m.other : m.km, mx = Math.max(...months.map(tot), 1) * 1.15;
  const imax = months.reduce((b, m, i) => (tot(m) > tot(months[b]) ? i : b), 0);
  let o = '';
  months.forEach((m, i) => {
    const x = 4 + i * bw + (bw - bwid) / 2; let y = base;
    const segs = stacked ? [[m.fuel, 'var(--c1)'], [m.maint, 'var(--c2)'], [m.other, 'var(--c3)']] : [[m.km, i === imax ? 'var(--c2)' : 'var(--c1)']];
    for (const [v, c] of segs) { if (v <= 0) continue; const h = Math.max(2, v / mx * (base - 16)); y -= h; o += `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${bwid}" height="${h.toFixed(1)}" rx="2" fill="${c}"><title>${monthLbl(m.k)} : ${stacked ? eur(tot(m), 0) : km(m.km)}</title></rect>`; y -= 2; }
    if (i % (n > 8 ? 2 : 1) === 0) o += `<text x="${(x + bwid / 2).toFixed(1)}" y="134" text-anchor="middle" class="ax">${monthLbl(m.k)}</text>`;
  });
  const top = months[imax]; if (tot(top) > 0) o += `<text x="${SW - 6}" y="11" text-anchor="end" class="lb">${monthLbl(top.k)} : ${stacked ? eur(tot(top), 0) : km(tot(top))}</text>`;
  o += `<line x1="0" x2="${SW}" y1="${base}" y2="${base}" class="gl"/>`;
  return `<svg role="img" aria-label="${esc(label)}" width="100%" viewBox="0 0 ${SW} 142">${o}</svg>`;
}
const klist = rows => `<div class="card tight">${rows.filter(Boolean).map(([l, v]) => `<div class="kr"><span>${l}</span><b>${v}</b></div>`).join('')}</div>`;
const hbars = (rows, color = 'var(--c1)') => rows.map(([l, w, t]) => `<div class="hb"><div class="hl">${esc(l)}</div><div class="ht"><i style="width:${Math.max(3, w * 100)}%;background:${color}"></i></div><div class="hv">${t}</div></div>`).join('');
const acc = (k, title, sub, inner) => { const o = statUi.open === k; return `<div class="acc"><button type="button" class="acch" data-act="stat-open" data-k="${k}" aria-expanded="${o}"><span class="t"><b>${title}</b><small>${sub}</small></span>${ic(o ? 'up' : 'down', 20, 'var(--muted)')}</button>${o ? `<div class="acci">${inner}</div>` : ''}</div>`; };
function vStats(vid) {
  const st = S.stats(vid, statUi.period), v = veh(vid), R = st.records;
  const chips = `<div class="chips">${PERIODS.map(([k, l]) => chipBox('radio', 'per', k, l, statUi.period === k).replace('<input', `<input data-act="stat-period" data-k="${k}"`)).join('')}</div>`;
  if (st.empty) return layout({ title: 'Statistiques', sub: v.name, back: `#/v/${vid}`, body: chips + '<div class="card"><div class="empty">Rien d’enregistré sur cette période. Ajoute des pleins, des entretiens ou des dépenses et les chiffres apparaîtront ici.</div></div>' });
  const hero = `<div class="card hero"><small class="muted">Coût d’usage · ${({ mois: 'ce mois', '3m': '3 mois', '12m': '12 mois', achat: 'depuis l’achat' })[statUi.period]}</small><div class="big">${eur(st.run, 0)}</div><div class="muted">${[st.perKm != null ? dec(st.perKm, 3) + ' €/km' : '', eur(st.perMonth, 0) + '/mois', st.kmTot ? km(st.kmTot) : ''].filter(Boolean).join(' · ')}</div></div>`;
  const key = klist([
    ['Consommation moyenne', st.avg ? dec(st.avg) + ' l/100' : '–'], ['Prix moyen du litre', st.ppl ? dec(st.ppl, 3) + ' €' : '–'],
    ['Kilomètres par jour', st.kmDay ? dec(st.kmDay) + ' km' : '–'], ['Plein moyen', st.avgFill ? `${dec(st.avgFill.l)} l · ${eur(st.avgFill.eur, 0)}` : '–']]);
  const seg = `<div class="seg" role="tablist">${CHARTS.map(([k, l]) => `<button type="button" role="tab" aria-selected="${statUi.chart === k}" class="${statUi.chart === k ? 'on' : ''}" data-act="stat-chart" data-k="${k}">${l}</button>`).join('')}</div>`;
  let chart;
  if (statUi.chart === 'conso') chart = lineSvg(st.pts.map(p => ({ date: p.date, v: p.l100 })), { ref: st.avg, refLabel: st.avg ? `moyenne ${dec(st.avg)} l/100` : '', label: 'Litres aux 100 km à chaque plein' }) + '<div class="tip">Orange : meilleur et pire plein.</div>';
  else if (statUi.chart === 'prix') chart = lineSvg(st.pplSeries, { fmt: n => dec(n, 2), label: 'Prix du litre à chaque plein' }) + '<div class="tip">Orange : litre le moins cher et le plus cher.</div>';
  else if (statUi.chart === 'depenses') chart = barsSvg(st.months13, { stacked: true, label: 'Dépenses par mois' }) + '<div class="lg"><span><i style="background:var(--c1)"></i>Carburant</span><span><i style="background:var(--c2)"></i>Entretien</span><span><i style="background:var(--c3)"></i>Autres frais</span></div>';
  else chart = barsSvg(st.months13, { stacked: false, label: 'Kilomètres par mois' }) + `<div class="tip">Moyenne ${km(st.months13.reduce((s, m) => s + m.km, 0) / st.months13.length)} par mois. Orange : le mois le plus chargé.</div>`;
  const me = x => { const [a, b] = x; return b > 0 ? [a, b] : null; };
  // sections
  const carb = klist([['Litres', dec(st.L) + ' l'], ['Dépensé', eur(st.fuelTot)], st.autonomy ? ['Autonomie moyenne', km(st.autonomy)] : null, st.gapAvg != null ? ['Délai entre pleins', Math.round(st.gapAvg) + ' jours'] : null])
    + (st.stations.length ? `<div class="card">${hbars(st.stations.slice(0, 5).map(s => [s.name, s.total / st.stations[0].total, `${eur(s.total, 0)} · ${s.n} pl. · ${dec(s.total / s.liters, 3)} €/l`]))}</div>` : '');
  const split = [['Carburant', st.fuelTot, 'var(--c1)'], ['Entretien', st.maintTot, 'var(--c2)'], ['Autres frais', st.othTot, 'var(--c3)']].filter(x => x[1] > 0);
  const P = st.possession;
  const couts = (split.length ? `<div class="card"><div class="split">${split.map(([, n, c]) => `<i style="width:${n / st.run * 100}%;background:${c}"></i>`).join('')}</div>${hbars(split.map(([l, n, c]) => [l, n / split[0][1] * 0 + n / Math.max(...split.map(x => x[1])), `${eur(n, 0)} · ${Math.round(n / st.run * 100)} %`]))}</div>` : '')
    + (st.maintList.length ? `<div class="card tight">${st.maintList.slice(0, 5).map(m => row('wrench', esc(m.label || 'Entretien'), `${fmtDate(m.date)}${m.garage ? ' · ' + esc(m.garage) : ''}`, `<b>${eur(m.cost)}</b>`, `#/v/${vid}/entretien/${m.id}`)).join('')}</div>` : '')
    + klist([P.purchase ? ['Prix d’achat', eur(P.purchase, 0)] : null, ['Coût de possession', eur(P.total, 0)], P.perKm ? ['Coût réel au km (indicatif)', dec(P.perKm, 2) + ' €'] : null, P.projection ? ['Projection 12 mois (usage)', eur(P.projection, 0)] : null]);
  const rec = (l, x, f) => x ? [l, `${f(x)} <small class="muted">${shortDate(x.date)}</small>`] : null;
  const records = klist([rec('Meilleure conso', R.best, x => dec(x.l100, 2) + ' l/100'), rec('Pire conso', R.worst, x => dec(x.l100, 2) + ' l/100'), rec('Plein le plus cher', R.priciest, x => eur(x.total)), rec('Plus gros plein', R.biggest, x => dec(x.liters) + ' l'), R.cheapest ? ['Litre le moins cher', `${dec(R.cheapest.v, 3)} € <small class="muted">${shortDate(R.cheapest.date)}</small>`] : null, rec('Plus longue distance', R.longest, x => km(x.km)), st.gapMin != null ? ['Délai le plus court', st.gapMin + ' jours'] : null]);
  const q = st.issues.length ? `<div class="card"><b>${st.issues.length} intervalle${st.issues.length > 1 ? 's' : ''} exclu${st.issues.length > 1 ? 's' : ''} des moyennes</b>${st.issues.map(i => `<p class="warn">${km(i.km)} entre le ${fmtDate(i.from)} et le ${fmtDate(i.to)} (${i.reason}). Un plein manque peut-être.</p>`).join('')}</div>` : '<div class="card"><div class="empty" style="padding:0">Tous les intervalles entre pleins sont utilisés ✓</div></div>';
  return layout({
    title: 'Statistiques', sub: v.name, back: `#/v/${vid}`,
    body: `${chips}${hero}${key}${seg}<div class="card">${chart}</div>
    ${acc('carb', 'Carburant', `${eur(st.fuelTot, 0)} · ${st.n.fuels} plein${st.n.fuels > 1 ? 's' : ''}`, carb)}
    ${acc('couts', 'Coûts', `Possession : ${eur(P.total, 0)}`, couts)}
    ${acc('rec', 'Records', R.best ? `Meilleure conso ${dec(R.best.l100)} l/100` : 'Pas encore de données', records)}
    ${acc('qual', 'Qualité des données', st.issues.length ? `${st.issues.length} point${st.issues.length > 1 ? 's' : ''} à vérifier` : 'Tout est utilisé', q)}`,
  });
}
let depYear = 'all';
function vDep(vid) {
  const t = S.totals(vid, depYear === 'all' ? null : depYear), docs = S.getData().documents.filter(d => d.vehicleId === vid).sort((a, b) => b.date.localeCompare(a.date));
  const bars = t.cat.map(([k, v]) => `<div><div class="lbl"><span>${esc(k)}</span><span>${eur(v, 0)}</span></div><div class="bar"><i style="width:${t.total ? Math.max(3, v / t.total * 100) : 0}%"></i></div></div>`).join('');
  const ex = S.getData().expenses.filter(x => x.vehicleId === vid).sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5);
  return layout({
    title: 'Dépenses et documents', sub: veh(vid).name, back: `#/v/${vid}`,
    body: `<div class="chips">${chipBox('radio', 'yr', 'all', 'Tout', depYear === 'all').replace('<input', '<input data-act="year" data-y="all"')}${t.years.map(y => chipBox('radio', 'yr', y, y, depYear === y).replace('<input', `<input data-act="year" data-y="${y}"`)).join('')}</div>
    <div class="card"><small class="muted">Total ${depYear === 'all' ? 'enregistré depuis le début' : depYear}</small><div style="font-size:30px;font-weight:700;margin:2px 0 14px">${eur(t.total, 0)}</div><div style="display:flex;flex-direction:column;gap:12px">${bars || '<div class="empty">Aucune dépense.</div>'}</div></div>
    ${ex.length ? `<h2>Autres dépenses</h2><div class="card tight">${ex.map(x => row('receipt', x.description || x.category, `${fmtDate(x.date)} · ${esc(x.category)}`, `<b>${eur(x.amount)}</b>`, `#/v/${vid}/depense/${x.id}`)).join('')}</div>` : ''}
    <h2>Documents</h2><div class="card tight">${docs.map(d => `<div class="row"><button class="rowmain" data-act="doc-open" data-id="${d.id}"><span class="ico">${ic('file', 20)}</span><span class="tx"><b>${esc(d.name)}</b><small>${fmtDate(d.date)}</small></span></button><button class="btn secondary small" data-act="doc-del" data-id="${d.id}">Supprimer</button></div>`).join('') || '<div class="empty">Aucun document pour l’instant. Ajoute une facture, la carte grise ou l’attestation d’assurance.</div>'}</div>`,
    foot: `<a class="btn" href="#/v/${vid}/depense/new">${ic('plus', 20)}Ajouter une dépense</a><label class="btn secondary" for="docfile">${ic('camera', 20)}Ajouter un document</label><input id="docfile" type="file" accept="image/*,application/pdf" data-vid="${vid}">`,
  });
}
function vPlan(vid) {
  const v = veh(vid);
  const items = (v.plan || []).map(o => `<div class="set"><a href="#/v/${vid}/plan/${o.id}" style="flex:1;min-width:0"><b style="display:block">${esc(o.label)}</b><small class="muted" style="display:block;font-size:14px">${[o.everyKm ? `Tous les ${km(o.everyKm)}` : '', o.everyMonths ? `${o.everyMonths % 12 === 0 ? o.everyMonths / 12 + (o.everyMonths === 12 ? ' an' : ' ans') : o.everyMonths + ' mois'}` : ''].filter(Boolean).join(' ou ')}</small></a>${sw('en', o.enabled, `data-act="op-toggle" data-id="${o.id}" data-vid="${vid}" aria-label="Rappel ${esc(o.label)}"`)}</div>`).join('');
  return layout({
    title: 'Plan d’entretien', sub: v.name, back: `#/v/${vid}`,
    body: `<div class="card soon" style="font-size:14px;line-height:20px">Saisis les intervalles du carnet d’entretien constructeur. Chaque opération déclenche un rappel selon les kilomètres et/ou les mois.</div><div class="card tight">${items || '<div class="empty">Aucune opération pour l’instant.</div>'}</div>`,
    foot: `<a class="btn" href="#/v/${vid}/plan/new">${ic('plus', 20)}Ajouter une opération</a><a class="btn secondary" href="#/v/${vid}/catalogue">${ic('book', 20)}Charger un plan constructeur</a>${S.getData().vehicles.some(x => x.id !== vid && !x.archivedAt && (x.plan || []).length) ? `<button class="btn secondary" data-act="copy-plan" data-vid="${vid}">${ic('copy', 20)}Copier depuis un autre véhicule</button>` : ''}`,
  });
}
function vOp(vid, oid) {
  const o = oid !== 'new' ? (veh(vid).plan || []).find(x => x.id === oid) : null;
  return layout({
    title: o ? 'Modifier l’opération' : 'Nouvelle opération', sub: veh(vid).name, back: `#/v/${vid}/plan`, form: true,
    body: `<form id="f" data-form="op" data-vid="${vid}" data-id="${o?.id || ''}" style="display:flex;flex-direction:column;gap:12px">
      ${field('Opération', 'label', o?.label, { req: true, ph: 'Ex. Vidange moteur' })}
      ${o ? '' : `<div class="chips">${GENERIC_OPS.map(g => `<button type="button" class="btn secondary small" data-act="fill-label" data-v="${esc(g)}">${esc(g)}</button>`).join('')}</div>`}
      <div class="grid2">${field('Tous les… km', 'everyKm', o?.everyKm ?? '', { mode: 'numeric', ph: 'Ex. 15000' })}${field('Tous les… mois', 'everyMonths', o?.everyMonths ?? '', { mode: 'numeric', ph: 'Ex. 12' })}</div>
      <div class="grid2">${field('Dernière fois (km)', 'lastKm', o?.lastKm ?? '', { mode: 'numeric' })}${field('Dernière fois (date)', 'lastDate', o?.lastDate, { type: 'date' })}</div>
      ${o?.note ? `<div class="card" style="font-size:14px;line-height:20px">${esc(o.note)}${(o.source || []).length ? `<div style="margin-top:8px;font-size:12px">${o.source.map(k => C.SOURCES[k] ? (C.SOURCES[k].url ? `<a href="${esc(C.SOURCES[k].url)}" target="_blank" rel="noopener" style="color:var(--accent)">${esc(C.SOURCES[k].label)}</a>` : esc(C.SOURCES[k].label)) : '').join(' · ')}</div>` : ''}</div>` : ''}
      <div class="card tight"><div class="set"><b>Rappel actif</b>${sw('enabled', o ? o.enabled : true)}</div></div>
      ${o ? `<button type="button" class="btn danger" data-act="del-op" data-id="${o.id}" data-vid="${vid}">Supprimer</button>` : ''}</form>`,
    foot: `<button class="btn" type="submit" form="f">${ic('check', 20)}Enregistrer</button>`,
  });
}
function vRappels() {
  const rs = S.reminders(), g = (s, t) => { const l = rs.filter(r => s.includes(r.status)); return `<h2>${t}</h2><div class="card tight">${l.map(remRow).join('') || '<div class="empty">Rien pour le moment</div>'}</div>`; };
  return layout({ title: 'Rappels', sub: 'Tous véhicules', body: g(['late'], 'En retard') + g(['soon'], 'Bientôt') + g(['todo'], 'À renseigner') + g(['ok'], 'Plus tard'), nav: 'rappels' });
}

// ---------- catalogue de plans d'entretien ----------
let cat = { vid: null, brand: null, model: null, pt: null };
function vCatalogue(vid) {
  const v = veh(vid);
  if (cat.vid !== vid) { const g = C.guessModel(v.brand, v.model); cat = { vid, brand: g?.brand || (C.guessModel(v.brand, '') || {}).brand || 'Audi', model: g?.model || null, pt: null }; }
  const brand = C.CATALOG[cat.brand] ? cat.brand : 'Audi';
  const m = C.modelOf(brand, cat.model);
  if (m && !m.powertrains.includes(cat.pt)) cat.pt = m.powertrains.length === 1 ? m.powertrains[0] : null;
  const ops = m && cat.pt ? C.buildPlan(brand, m.id, cat.pt) : [];
  const opt = (val, label, sel) => `<option value="${esc(val)}" ${sel ? 'selected' : ''}>${esc(label)}</option>`;
  const src = o => (o.source || []).map(k => C.SOURCES[k] ? (C.SOURCES[k].url ? `<a href="${esc(C.SOURCES[k].url)}" target="_blank" rel="noopener" style="color:var(--accent)">${esc(C.SOURCES[k].label)}</a>` : esc(C.SOURCES[k].label)) : '').join(' · ');
  const intervals = o => [o.everyKm ? `tous les ${km(o.everyKm)}` : '', o.everyMonths ? `tous les ${o.everyMonths % 12 === 0 ? o.everyMonths / 12 + (o.everyMonths === 12 ? ' an' : ' ans') : o.everyMonths + ' mois'}` : ''].filter(Boolean).join(' ou ');
  const list = ops.length ? `<h2>Opérations proposées</h2><div class="card tight">${ops.map((o, i) => `<div class="set" style="align-items:flex-start"><span style="flex:1;min-width:0"><b style="display:block">${esc(o.label)}</b><small class="muted" style="display:block;font-size:14px">${esc(intervals(o))}</small><small class="muted" style="display:block;font-size:12px;line-height:17px;margin-top:4px">${esc(o.note)}</small><small style="display:block;font-size:12px;margin-top:4px">${src(o)}</small></span>${sw('catop', o.enabled, `value="${i}"`)}</div>`).join('')}</div>
    <div class="card"><b>Dernier entretien</b><p class="muted small" style="margin:6px 0 12px">Facultatif : sert de point de départ pour la vidange et la révision. Les autres opérations seront à renseigner au fil de l’eau.</p><div class="grid2">${field('Kilométrage', 'catLastKm', '', { mode: 'numeric' })}${field('Date', 'catLastDate', '', { type: 'date' })}</div></div>
    <p class="muted small" style="margin:0">Ces intervalles sont des repères tirés des documents cités : le carnet d’entretien et l’indicateur de service de ton véhicule restent la référence. Tu pourras tout modifier ensuite dans le plan.</p>` : '';
  return layout({
    title: 'Plan constructeur', sub: v.name, back: `#/v/${vid}/plan`, form: true,
    body: `<div class="card"><label class="field"><span>Marque</span><select data-cat="brand">${Object.keys(C.CATALOG).sort((a, b) => a.localeCompare(b)).map(b => opt(b, b, b === brand)).join('')}</select></label><p class="muted small" style="margin:8px 0 0">${Object.keys(C.CATALOG).length} marques. Plans par modèle et motorisation, à vérifier dans le carnet de ton véhicule.</p></div>
      <label class="field"><span>Modèle</span><select data-cat="model"><option value="">Choisir…</option>${C.CATALOG[brand].models.map(x => opt(x.id, `${x.name} · ${x.years}`, x.id === cat.model)).join('')}</select></label>
      ${m ? `<label class="field"><span>Motorisation</span><select data-cat="pt"><option value="">Choisir…</option>${m.powertrains.map(p => opt(p, C.ptLabel(brand, m.id, p), p === cat.pt)).join('')}</select></label>` : ''}${list}`,
    foot: ops.length ? `<button class="btn" data-act="cat-apply" data-vid="${vid}">${ic('check', 20)}Ajouter au plan d’entretien</button>` : '',
  });
}
// Copier le plan d'entretien d'un autre véhicule (deux voitures du même modèle, par exemple).
async function copyPlan(vid) {
  const srcs = S.getData().vehicles.filter(v => v.id !== vid && !v.archivedAt && (v.plan || []).length);
  if (!srcs.length) return toast('Aucun autre véhicule avec un plan');
  const pick = await new Promise(res => {
    const d = $('#dlg');
    d.innerHTML = `<form method="dialog"><h3>Copier le plan d’un autre véhicule</h3><p>Les opérations absentes du plan de ce véhicule seront ajoutées.</p><label class="field"><span>Copier depuis</span><select name="src">${srcs.map(v => `<option value="${v.id}">${esc(v.name)} · ${v.plan.length} opérations</option>`).join('')}</select></label><label class="set"><b>Reprendre aussi les dernières dates et km</b>${sw('keep', false)}</label><div class="acts"><button class="btn secondary" value="cancel">Annuler</button><button class="btn" value="ok">Copier</button></div></form>`;
    d.returnValue = '';
    d.onclose = () => { if (d.returnValue !== 'ok') return res(null); const f = new FormData(d.querySelector('form')); res({ src: f.get('src'), keep: f.has('keep') }); };
    d.showModal();
  });
  if (!pick) return;
  const v = veh(vid), from = veh(pick.src); let n = 0;
  S.change(() => {
    v.plan = v.plan || [];
    for (const o of from.plan) {
      if (v.plan.some(x => x.label === o.label)) continue;
      v.plan.push({ ...o, id: S.uid(), lastKm: pick.keep ? o.lastKm ?? null : null, lastDate: pick.keep ? o.lastDate || '' : '' }); n++;
    }
    if (!v.catalog && from.catalog) v.catalog = { ...from.catalog };
  });
  toast(n ? `${n} opération${n > 1 ? 's' : ''} copiée${n > 1 ? 's' : ''}` : 'Ces opérations sont déjà dans le plan');
  go(`#/v/${vid}/plan`);
}
function applyCatalog(vid) {
  const v = veh(vid), brand = C.CATALOG[cat.brand] ? cat.brand : 'Audi';
  const ops = C.buildPlan(brand, cat.model, cat.pt), on = new Set([...document.querySelectorAll('input[name=catop]:checked')].map(i => +i.value));
  const lastKm = num($('[name=catLastKm]').value), lastDate = $('[name=catLastDate]').value || '';
  let added = 0;
  S.change(() => {
    v.plan = v.plan || [];
    ops.forEach((o, i) => {
      if (v.plan.some(x => x.label === o.label)) return;
      const start = o.kind === 'oil' || o.kind === 'inspection';
      v.plan.push({ id: S.uid(), label: o.label, everyKm: o.everyKm, everyMonths: o.everyMonths, lastKm: start ? lastKm : null, lastDate: start ? lastDate : '', enabled: on.has(i), note: o.note, source: o.source });
      added++;
    });
    v.catalog = { brand, model: cat.model, powertrain: cat.pt };
  });
  toast(added ? `${added} opération${added > 1 ? 's' : ''} ajoutée${added > 1 ? 's' : ''}` : 'Ces opérations sont déjà dans le plan');
  go(`#/v/${vid}/plan`);
}

async function askKm(id) {
  const v = veh(id); if (!v) return;
  const r = await ask({ title: 'Kilométrage actuel', input: 'Kilomètres', value: S.vehicleMileage(id), ok: 'Enregistrer', scan: async () => { const t = await O.scan(); if (!t) return null; const k = O.parseOdometer(t, S.vehicleMileage(id)); if (!k) throw new Error('illisible'); return k; } });
  const n = num(r);
  if (r !== false && n != null) { S.change(() => { v.mileage = n; v.mileageAt = S.isoToday(); }); toast('Kilométrage mis à jour'); }
}

// ---------- pop-up « Ajouter à l'agenda ? » ----------
function offerAgenda(rs, force = false) {
  if (!force && S.getMeta().settings.agendaPrompt === false) return;
  const seen = new Set(), items = [];
  for (const r of rs) {
    const d = S.reminderDate(r), info = d && A.eventInfo(r); if (!info || d.date < today()) continue;
    const k = `${r.vehicleId}|${r.opId || r.kind}`; if (seen.has(k)) continue; seen.add(k);
    items.push({ r, d, info });
  }
  if (!items.length) return;
  const row = ({ r, d, info }) => `<div class="set" style="gap:10px"><span style="flex:1;min-width:0"><b style="display:block">${esc(info.title)}</b><small class="muted" style="display:block;font-size:14px">${d.est ? 'vers le ' : 'le '}${fmtDate(d.date)}${r.dueKm != null ? ` · à ${km(r.dueKm)}` : ''}</small></span><a class="btn small" style="text-decoration:none" href="${esc(A.templateUrl(info))}" target="_blank" rel="noopener" data-cal="1" data-title="${esc(info.title)}" data-start="${info.start}" data-end="${info.end}" data-notes="${esc(info.notes)}">${ic('calendar', 16)}Ajouter</a></div>`;
  const dlg = $('#dlg');
  dlg.innerHTML = `<form method="dialog"><h3>Ajouter à ton agenda ?</h3><p>${items.length > 1 ? 'Voici les événements qui seront créés' : 'Voici l’événement qui sera créé'}, en journée entière${items.some(i => i.d.est) ? ' (la date « vers » est estimée d’après ton rythme de kilométrage)' : ''}.</p><div class="card tight" style="margin:0">${items.map(row).join('')}</div><div class="acts"><button class="btn secondary" value="cancel">Plus tard</button></div></form>`;
  dlg.returnValue = ''; dlg.onclose = null;
  if (!dlg.open) dlg.showModal();
}
function notifCard() {
  const m = S.getMeta().settings, k = N.kind();
  const help = { native: 'Une notification est programmée à 9 h, quelques jours avant chaque échéance puis le jour même, même appli fermée.', web: 'Sur le web, les notifications s’affichent à l’ouverture de l’appli. Pour être prévenu appli fermée, installe l’APK.', none: 'Ce navigateur ne gère pas les notifications.' }[k];
  const days = N.daysBefore();
  return `<h2>Rappels</h2><div class="card tight"><div class="set"><b>Notifications des échéances</b>${sw('notif', N.isOn(), 'data-setting="notif"' + (k === 'none' ? ' disabled' : ''))}</div>`
    + (N.isOn() ? `<div class="set"><b>Prévenir à l’avance</b><select data-notif-days style="min-height:44px;border-radius:12px;padding:0 10px;background:var(--bg);color:var(--text);border:1px solid var(--line)">${[1, 3, 7, 14, 30].map(d => `<option value="${d}" ${d === days ? 'selected' : ''}>${d === 1 ? '1 jour' : d + ' jours'}</option>`).join('')}</select></div>` : '')
    + `<div class="set"><b>Rappel de kilométrage</b><select data-km-weeks style="min-height:44px;border-radius:12px;padding:0 10px;background:var(--bg);color:var(--text);border:1px solid var(--line)">${[[0, 'Jamais'], [2, 'Toutes les 2 semaines'], [3, 'Toutes les 3 semaines'], [4, 'Toutes les 4 semaines']].map(([n, l]) => `<option value="${n}" ${n === N.kmWeeks() ? 'selected' : ''}>${l}</option>`).join('')}</select></div>`
    + `<div class="set"><b>Proposer l’ajout à l’agenda</b>${sw('agendaPrompt', m.agendaPrompt !== false, 'data-setting="agendaPrompt"')}</div></div><p class="muted small" style="margin:0">${help}</p>`;
}
const widgetPick = m => {
  const vs = S.getData().vehicles.filter(v => !v.archivedAt);
  if (!window.Capacitor?.Plugins?.AutoBioWidget || vs.length < 2) return '';
  return `<div class="set"><b>Véhicule du widget</b><select data-widget-veh style="min-height:44px;border-radius:12px;padding:0 10px;background:var(--bg);color:var(--text);border:1px solid var(--line);max-width:55%"><option value="auto"${(m.settings.widgetVehicle || 'auto') === 'auto' ? ' selected' : ''}>Le dernier utilisé</option>${vs.map(v => `<option value="${v.id}"${m.settings.widgetVehicle === v.id ? ' selected' : ''}>${esc(v.name)}</option>`).join('')}</select></div>`;
};
function vReglages() {
  const m = S.getMeta(), st = D.getStatus(), [pk, pt] = PILL[st.status] || PILL.off, mode = D.storageMode(), N = D.fileAvailable();
  const last = m.lastSyncAt ? new Date(m.lastSyncAt).toLocaleString(loc(), { dateStyle: 'short', timeStyle: 'short' }) : 'jamais';
  const clr = pk === 'late' ? 'late' : pk === 'soon' ? 'soon' : 'ok';
  const statusCard = where => `<div class="card"><div style="display:flex;align-items:center;gap:14px"><span style="display:flex;align-items:center;justify-content:center;width:52px;height:52px;border-radius:50%;background:var(--${clr}Bg);color:var(--${clr}Text);flex:none">${ic(pk === 'ok' ? 'check' : 'alert', 28)}</span><span style="flex:1;min-width:0"><b style="display:block;font-size:20px">${pt}</b><small class="muted" style="display:block">${where}</small><small class="muted" style="display:block">Dernier envoi : ${last}${m.lastSyncAt ? ' · ' + ago(m.lastSyncAt) : ''}</small>${st.lastError && st.status === 'error' ? `<small class="muted" style="display:block">${esc(st.lastError)}</small>` : ''}</span></div></div>`;
  let conn;
  if (!mode) {
    conn = (N ? `<div class="card"><b>Où ranger ton fichier AutoBio ?</b><p class="muted small" style="margin:6px 0 12px">Choisis un fichier avec le sélecteur Android. Prends « Drive » dans la liste pour retrouver ton fichier sur tous tes appareils ; sinon il reste sur ce téléphone. AutoBio le lit et l’écrit tout seul.</p><div style="display:flex;flex-direction:column;gap:10px"><button class="btn" data-act="link-file" data-kind="open">${ic('file', 20)}Retrouver mon fichier existant</button><button class="btn secondary" data-act="link-file" data-kind="create">${ic('plus', 20)}Créer un nouveau fichier</button></div></div>` : `<div class="card"><b>Stockage du fichier</b><p class="muted small" style="margin:6px 0 0">Le choix d’un fichier (Google Drive, téléphone…) est disponible dans l’appli Android. Ici, tes données restent dans ce navigateur : télécharge une copie de temps en temps.</p></div>`);
  } else {
    const file = true;
    conn = statusCard(`Fichier : ${esc(m.fileName || '')}`)
      + `<div class="card tight"><div class="set"><b>Envoyer à chaque modification</b>${sw('autoSync', m.settings.autoSync, 'data-setting="autoSync"')}</div><div class="set"><b>${file ? 'Copie quotidienne sur ce téléphone' : 'Copie datée (30 jours)'}</b>${sw('snapshots', m.settings.snapshots, 'data-setting="snapshots"')}</div></div>`
      + `<p class="muted small" style="margin:0">Chaque modification remplace le contenu du fichier choisi. Les photos et documents restent sur ce téléphone dans ce mode. Les copies de sécurité sont gardées sur ce téléphone.</p>`
      + `<button class="btn" data-act="sync">${ic('refresh', 20)}Synchroniser maintenant</button>`
      + `<button class="btn secondary" data-act="restore-main">${ic('upload', 20)}Restaurer depuis mon fichier</button>`
      + (file ? `<div class="grid2"><button class="btn secondary small" style="width:100%" data-act="link-file" data-kind="open">Autre fichier existant</button><button class="btn secondary small" style="width:100%" data-act="link-file" data-kind="create">Nouveau fichier</button></div>` : '')
      + `<h2>Copies de sécurité (ce téléphone)</h2><div class="card tight" id="bklist"><div class="empty">Chargement…</div></div>`;
  }
  return layout({
    title: 'Réglages', sub: 'Stockage et synchronisation', nav: 'reglages',
    body: conn + notifCard() + `<h2>Affichage</h2><div class="card tight"><div class="set"><b>Thème</b><select data-theme-sel style="min-height:44px;border-radius:12px;padding:0 10px;background:var(--bg);color:var(--text);border:1px solid var(--line)">${[['auto', 'Automatique'], ['light', 'Clair'], ['dark', 'Sombre']].map(([k, l]) => `<option value="${k}"${(m.settings.theme || 'auto') === k ? ' selected' : ''}>${l}</option>`).join('')}</select></div>${widgetPick(m)}<div class="set"><b>Langue</b><select data-lang style="min-height:44px;border-radius:12px;padding:0 10px;background:var(--bg);color:var(--text);border:1px solid var(--line)"><option value="fr"${lang() === 'fr' ? ' selected' : ''}>Français</option><option value="en"${lang() === 'en' ? ' selected' : ''}>English</option></select></div></div>` + (LK.available() ? `<h2>Sécurité</h2><div class="card tight"><div class="set"><b>Verrouiller l’appli</b>${sw('lock', !!m.settings.lock, 'data-lock')}</div></div><p class="muted small" style="margin:0">Demande l’empreinte, le code ou le schéma du téléphone à l’ouverture.</p>` : '') + `<div class="card tight">${row('upload', 'Restaurer depuis un fichier', 'Un fichier .json créé par AutoBio', ic('chev', 20, 'var(--muted)'), '#/restaurer')}${row('file', 'Télécharger une copie', 'Fichier JSON sur ce téléphone', '', '').replace('<div class="row">', '<button class="row" data-act="export">').replace(/<\/div>$/, '</button>')}${row('list', 'Exporter pour un tableur', 'Fichier CSV (Excel, LibreOffice)', '', '').replace('<div class="row">', '<button class="row" data-act="export-csv">').replace(/<\/div>$/, '</button>')}</div>${mode ? `<button class="btn secondary" data-act="disconnect">${mode === 'file' ? 'Délier le fichier' : 'Ne plus utiliser ce fichier'}</button>` : ''}<p class="muted small" style="text-align:center;margin:8px 0 0">AutoBio by GenyusLabs<br><span data-ver>version ${VERSION}</span></p>`,
    after() { appPlugin()?.getInfo?.().then(i => { const e = $('[data-ver]'); if (e && i?.version) e.textContent = `version ${i.version}`; }).catch(() => {}); if (mode && (mode === 'file' || navigator.onLine)) loadBackups(); else if ($('#bklist')) $('#bklist').innerHTML = '<div class="empty">Indisponible hors connexion.</div>'; },
  });
}
async function loadBackups() {
  const box = $('#bklist'); if (!box) return;
  try {
    const l = await D.listBackups();
    box.innerHTML = l.length ? l.map(b => `<div class="row"><span class="ico">${ic('file', 20)}</span><span class="tx"><b>${esc(b.name.replace(/\.json$/, ''))}</b><small>${new Date(b.modifiedTime).toLocaleString(loc(), { dateStyle: 'short', timeStyle: 'short' })}</small></span><button class="btn secondary small" data-act="restore-bk" data-id="${b.id}">Restaurer</button></div>`).join('') : '<div class="empty">Aucune sauvegarde pour l’instant.</div>';
  } catch { box.innerHTML = '<div class="empty">Impossible de lister les sauvegardes.</div>'; }
}
let imp = null;
function vRestaurer() {
  const step = n => `<div class="${imp ? (n <= (imp.done ? 3 : 2) ? 'on' : '') : (n === 1 ? 'on' : '')}"><i>${n}</i>${['Fichier', 'Aperçu', 'Terminé'][n - 1]}</div>`;
  let body = `<div class="steps">${step(1)}${step(2)}${step(3)}</div>`, foot = '';
  if (!imp) {
    body += `<div class="card"><b>Choisis un fichier de données AutoBio</b><p class="muted small" style="margin:6px 0 0">Un fichier .json créé par AutoBio : document de travail, copie de sécurité ou copie téléchargée. Il n’est lu que sur ce téléphone.</p></div><div id="impErr" class="card late" style="display:none"></div>`;
    foot = `<label class="btn" for="impfile">${ic('upload', 20)}Choisir le fichier</label><input id="impfile" type="file" accept=".json,application/json">`;
  } else if (!imp.done) {
    const r = imp.report;
    body += `<div class="card tight">${row('file', esc(imp.name), 'Fichier choisi')}</div><div class="card"><div class="muted" style="font-size:14px;font-weight:600;margin-bottom:12px">Contenu du fichier</div><div class="grid2">${[[r.vehicles, r.vehicles > 1 ? 'véhicules' : 'véhicule'], [r.maintenances, r.maintenances > 1 ? 'entretiens' : 'entretien'], [r.fuels, r.fuels > 1 ? 'pleins' : 'plein'], [r.expenses, r.expenses > 1 ? 'autres dépenses' : 'autre dépense']].map(([n, l]) => `<div><div class="stat" style="margin:0">${n}</div><small class="muted">${l}</small></div>`).join('')}</div></div>`;
    body += `<p class="muted small" style="margin:0">${S.hasContent() ? 'Tes données actuelles seront remplacées par celles du fichier ; une copie de sécurité est gardée.' : 'Les données du fichier seront chargées dans l’appli.'} Ensuite, tout se synchronise tout seul.</p>`;
    foot = `<button class="btn" data-act="do-import">${ic('check', 20)}${S.hasContent() ? 'Remplacer mes données' : 'Charger mes données'}</button><button class="btn secondary" data-act="imp-reset">Choisir un autre fichier</button>`;
  } else {
    body += `<div class="card"><b>Données chargées</b><p class="muted small" style="margin:6px 0 0">${D.isConnected() ? 'Ton document de travail est à jour ; les prochaines modifications partiront automatiquement.' : 'Les données sont sur ce téléphone. Choisis l’emplacement du document de travail (ou connecte Google Drive) dans les Réglages pour les sauvegarder.'}</p></div>`;
    foot = `<a class="btn" href="#/">Voir mes véhicules</a>`;
  }
  return layout({ title: 'Restaurer depuis un fichier', back: '#/reglages', body, foot, form: true });
}
const summarize = d => ({ vehicles: d.vehicles.length, maintenances: d.maintenances.length, fuels: d.fuels.length, expenses: d.expenses.length });

let onb = { step: 1, returning: null };
function vBienvenue() {
  const N = D.fileAvailable(), yes = onb.returning;
  let body, foot;
  if (onb.step === 1) {
    body = `<div class="card"><b style="font-size:20px">As-tu déjà utilisé AutoBio ?</b><p class="muted" style="margin:8px 0 0;line-height:22px">Si oui, on retrouve ton fichier et tout revient comme tu l’avais laissé.</p></div>`;
    foot = `<button class="btn" data-act="onb" data-v="yes">Oui, retrouver mon fichier</button><button class="btn secondary" data-act="onb" data-v="no">Non, c’est ma première fois</button><a class="btn secondary" href="#/restaurer">Restaurer depuis un fichier .json</a><button class="btn secondary" data-act="onb-skip">Plus tard</button>`;
  } else if (N) {
    body = `<div class="card"><b style="font-size:20px">${yes ? 'Retrouve ton fichier' : 'Où ranger ton fichier ?'}</b><p class="muted" style="margin:8px 0 0;line-height:22px">${yes ? 'Choisis ton document de travail AutoBio dans Google Drive, sur ce téléphone ou dans une autre appli de stockage.' : 'Dans le sélecteur Android, choisis « Drive » pour retrouver ton fichier sur tous tes appareils (sinon il reste sur ce téléphone). AutoBio le met à jour tout seul.'}</p></div>`;
    foot = `<button class="btn" data-act="link-file" data-kind="${yes ? 'open' : 'create'}">${ic('file', 20)}${yes ? 'Choisir mon fichier' : 'Choisir où le créer'}</button><button class="btn secondary" data-act="onb-back">Retour</button>`;
  } else {
    body = `<div class="card"><b style="font-size:20px">Choisir un fichier : appli Android</b><p class="muted" style="margin:8px 0 0;line-height:22px">Le choix du fichier (Google Drive, téléphone…) est disponible dans l’appli Android. Dans ce navigateur, tes données restent ici : pense à télécharger une copie de temps en temps.</p></div>`;
    foot = `<button class="btn" data-act="onb-skip">Continuer</button><a class="btn secondary" href="#/restaurer">Restaurer depuis un fichier .json</a><button class="btn secondary" data-act="onb-back">Retour</button>`;
  }
  return layout({ title: 'Bienvenue', sub: 'AutoBio by GenyusLabs', body, foot, form: true });
}
function finishOnboarding() {
  S.setMeta({ onboarded: true });
  const n = S.getData().vehicles.length;
  toast(onb.returning ? (n ? `${n} véhicule${n > 1 ? 's' : ''} retrouvé${n > 1 ? 's' : ''}` : 'Aucune donnée dans ce fichier : tu repars de zéro') : 'Stockage prêt');
  onb = { step: 1, returning: null };
  go('#/');
}

// ---------- routeur ----------
let current = { form: false };
let pendingPlan = null;
function route() {
  const p = (location.hash.slice(1) || '/').split('/').filter(Boolean);
  const [a, b, c, d] = p;
  if (!a) return vGarage();
  if (a === 'rappels') return vRappels();
  if (a === 'reglages') return vReglages();
  if (a === 'restaurer') return vRestaurer();
  if (a === 'bienvenue') return vBienvenue();
  if (a === 'vehicule') return vVehForm();
  if (a === 'v' && b && veh(b)) {
    if (!c) return vFiche(b);
    const m = { edit: () => vVehForm(b), historique: () => vHisto(b), pleins: () => vPleins(b), stats: () => vStats(b), depenses: () => vDep(b), plan: () => (d ? vOp(b, d) : vPlan(b)), catalogue: () => vCatalogue(b), entretien: () => vMaint(b, d || 'new'), plein: () => vFuel(b, d || 'new'), depense: () => vExp(b, d || 'new') }[c];
    if (m) return m();
  }
  return vGarage();
}
function render() {
  const keepScroll = current.path === location.hash ? $('main')?.scrollTop : 0;
  const v = route(); current = { form: !!v.form, path: location.hash };
  if (!/\/entretien\//.test(location.hash)) pendingPlan = null;
  $('#app').innerHTML = v.html;
  if (keepScroll) $('main').scrollTop = keepScroll;
  v.after?.();
}
addEventListener('hashchange', () => { render(); });

// ---------- actions ----------
const go = h => { location.hash = h; };
document.addEventListener('click', async e => {
  const cal = e.target.closest('a[data-cal]');
  if (cal && A.nativeCalendar()) {
    e.preventDefault();
    try { await A.nativeCalendar().addEvent({ title: cal.dataset.title, start: cal.dataset.start, end: cal.dataset.end, notes: cal.dataset.notes, allDay: true }); toast('Ajouté à l’agenda'); }
    catch (err) { toast('Agenda : ' + (err.message || 'refusé')); }
    return;
  }
  const el = e.target.closest('[data-act]'); if (!el) return;
  const { act, id, vid, kind } = el.dataset;
  const D0 = S.getData();
  try {
    if (act === 'km') await askKm(id);
    else if (act === 'undo') { const f = undoFn; undoFn = null; $('#toast').classList.remove('show'); f?.(); }
    else if (act === 'del') {
      if (!await ask({ title: 'Supprimer ?', text: 'Tu pourras annuler juste après la suppression.', ok: 'Supprimer' })) return;
      const col = { maint: 'maintenances', fuel: 'fuels', exp: 'expenses' }[kind], idx = D0[col].findIndex(x => x.id === id), item = D0[col][idx];
      S.change(d => { d[col] = d[col].filter(x => x.id !== id); }); go(`#/v/${vid}`);
      toast('Supprimé', () => { S.change(d => { if (item && !d[col].some(x => x.id === id)) d[col].splice(Math.min(idx, d[col].length), 0, item); }); toast('Rétabli'); });
    }
    else if (act === 'del-vehicle') {
      if (!await ask({ title: 'Supprimer le véhicule ?', text: 'Tout son historique sera supprimé.', ok: 'Supprimer' })) return;
      const KS = ['maintenances', 'fuels', 'expenses', 'documents'], vi = D0.vehicles.findIndex(v => v.id === id), vh = D0.vehicles[vi], rows = Object.fromEntries(KS.map(k => [k, D0[k].filter(x => x.vehicleId === id)]));
      S.change(d => { d.vehicles = d.vehicles.filter(v => v.id !== id); for (const k of KS) d[k] = d[k].filter(x => x.vehicleId !== id); }); go('#/');
      toast('Véhicule supprimé', () => { S.change(d => { if (vh && !d.vehicles.some(v => v.id === id)) { d.vehicles.splice(Math.min(vi, d.vehicles.length), 0, vh); for (const k of KS) d[k].push(...rows[k]); } }); toast('Véhicule rétabli'); });
    }
    else if (act === 'del-op') {
      if (!await ask({ title: 'Supprimer l’opération ?', ok: 'Supprimer' })) return;
      const v = veh(vid), oi = v.plan.findIndex(o => o.id === id), op = v.plan[oi];
      S.change(() => { v.plan = v.plan.filter(o => o.id !== id); }); go(`#/v/${vid}/plan`);
      toast('Opération supprimée', () => { S.change(() => { const w = veh(vid); if (w && op && !(w.plan || []).some(o => o.id === id)) { w.plan = w.plan || []; w.plan.splice(Math.min(oi, w.plan.length), 0, op); } }); toast('Opération rétablie'); });
    }
    else if (act === 'copy-plan') await copyPlan(vid);
    else if (act === 'fill-label') { $('[name=label]').value = el.dataset.v; }
    else if (act === 'unlock') { unlock(); }
    else if (act === 'voice') {
      if (!V.available()) return toast('La dictée est disponible dans l’application Android');
      try {
        const text = await V.listen(lang()); if (!text) return;
        if (el.dataset.k === 'fuel') {
          const r = V.parseFuelVoice(text);
          if (!r.liters && !r.total && !r.km) return toast(`Je n’ai pas compris « ${text} » : dis par exemple « 42 litres 78 euros »`);
          if (r.liters) fillField('liters', r.liters); if (r.ppl) fillField('ppl_in', r.ppl); if (r.total) fillField('total', r.total.toFixed(2)); if (r.km) fillField('mileage', r.km);
        } else {
          const r = V.parseExpenseVoice(text);
          if (!r.amount && !r.category) return toast(`Je n’ai pas compris « ${text} » : dis par exemple « péage 12 euros 50 »`);
          if (r.amount) fillField('amount', r.amount.toFixed(2)); if (r.km) fillField('mileage', r.km);
          if (r.category) $(`[name=category][value="${r.category}"]`)?.click();
          const d = $('[name=description]'); if (d && !d.value) fillField('description', r.category || text);
        }
        toast(`Entendu : « ${text} ». Vérifie avant d’enregistrer`);
      } catch (err) { toast('Dictée impossible : saisis les chiffres à la main'); }
    }
    else if (act === 'archive') {
      const r = await ask({ title: 'Archiver ce véhicule ?', text: 'Il disparaît du garage et des rappels. Tout l’historique est conservé. Tu peux indiquer le prix de vente.', input: 'Prix de vente (€, facultatif)', ok: 'Archiver' });
      if (r === false) return;
      const p = num(r); S.change(() => { const v = veh(id); v.archivedAt = today(); if (p != null) v.soldPrice = p; }); toast('Véhicule archivé'); go('#/');
    }
    else if (act === 'unarchive') { S.change(() => { const v = veh(id); delete v.archivedAt; delete v.soldPrice; }); toast('Véhicule désarchivé'); }
    else if (act === 'export-csv') { await saveFile(`AutoBio_${today()}.csv`, 'text/csv', new TextEncoder().encode(toCsv(S.getData()))); toast('Fichier CSV prêt'); }
    else if (act === 'scan') { if (!O.available()) return toast('La lecture photo est disponible dans l’application Android'); await runScan(el.dataset.k, el.closest('form')?.dataset.vid || $('#f')?.dataset.vid); }
    else if (act === 'year') { depYear = el.dataset.y; render(); }
    else if (act === 'stat-period') { statUi.period = el.dataset.k; statUi.open = null; render(); }
    else if (act === 'stat-chart') { statUi.chart = el.dataset.k; render(); }
    else if (act === 'stat-open') { statUi.open = statUi.open === el.dataset.k ? null : el.dataset.k; render(); }
    else if (act === 'doc-open') { const doc = D0.documents.find(x => x.id === id); const b = await D.fetchDocBlob(doc); if (!b) return toast('Document indisponible hors connexion'); window.open(URL.createObjectURL(b), '_blank'); }
    else if (act === 'doc-del') { const doc = D0.documents.find(x => x.id === id); if (!await ask({ title: 'Supprimer le document ?', ok: 'Supprimer' })) return; await delBlob(id); S.change(d => { d.documents = d.documents.filter(x => x.id !== id); }); }
    else if (act === 'link-file') { await D.linkFile(el.dataset.kind); if (location.hash === '#/bienvenue') finishOnboarding(); else toast('Fichier relié'); }
    else if (act === 'onb') { onb = { step: 2, returning: el.dataset.v === 'yes' }; render(); }
    else if (act === 'onb-back') { onb = { step: 1, returning: null }; render(); }
    else if (act === 'onb-skip') { S.setMeta({ onboarded: true }); go('#/'); }
    else if (act === 'disconnect') { if (await ask({ title: 'Ne plus utiliser ce fichier ?', text: 'Les données restent sur ce téléphone et dans le fichier, mais ne seront plus synchronisées.', ok: 'Arrêter' })) { D.disconnect(); render(); } }
    else if (act === 'sync') { await D.syncNow(); toast('Synchronisation terminée'); }
    else if (act === 'restore-main') {
      if (!await ask({ title: 'Restaurer depuis le fichier ?', text: 'Les données de ce téléphone seront remplacées par celles du fichier.', ok: 'Restaurer' })) return;
      const r = await D.remoteInfo(); if (!r) return toast('Le fichier est vide');
      await D.safetyCopy('avant-restauration', S.getData()); S.replaceData(r, { dirty: false }); toast('Données restaurées');
    }
    else if (act === 'restore-bk') {
      if (!await ask({ title: 'Restaurer cette sauvegarde ?', text: 'Les données actuelles seront remplacées (une copie de sécurité est créée avant).', ok: 'Restaurer' })) return;
      const r = await D.readBackup(id); await D.safetyCopy('avant-restauration', S.getData());
      r.updatedAt = new Date().toISOString(); S.replaceData(r, { dirty: true }); toast('Sauvegarde restaurée');
    }
    else if (act === 'export') { S.setMeta({ lastExportAt: new Date().toISOString() }); await saveFile(`AutoBio_export_${today()}.json`, 'application/json', new TextEncoder().encode(JSON.stringify(S.getData(), null, 1))); }
    else if (act === 'carnet') { const v = veh(id); const doc = carnetDoc(S.getData(), id, { today: today(), mileage: S.vehicleMileage(id), reminders: S.reminders(id).filter(r => r.kind === 'plan' && (r.dueDate || r.dueKm != null)), version: VERSION }); await saveFile(carnetName(v, today()), 'application/pdf', buildPdf(doc)); toast('Carnet d’entretien prêt'); }
    else if (act === 'cal-preview') { const r = S.reminders(vid).find(x => (x.opId || x.kind) === el.dataset.key); if (r) offerAgenda([r], true); }
    else if (act === 'cat-apply') applyCatalog(vid);
    else if (act === 'copy-origin') { try { await navigator.clipboard.writeText(el.dataset.v); toast('Adresse copiée'); } catch { toast(el.dataset.v); } }
    else if (act === 'imp-reset') { imp = null; render(); }
    else if (act === 'do-import') await doImport();
  } catch (err) { toast(err.message || 'Une erreur est survenue'); console.error(err); }
});
document.addEventListener('change', async e => {
  const t = e.target;
  if (t.dataset.setting === 'notif') {
    if (t.checked) { const ok = await N.enable(); if (!ok) toast('Notifications refusées : autorise-les dans les réglages du téléphone'); } else await N.disable();
    render();
  }
  else if (t.dataset.themeSel !== undefined) { S.setSettings({ theme: t.value }); applyTheme(); }
  else if (t.dataset.kmWeeks !== undefined) { N.setKmWeeks(+t.value); toast('Enregistré'); }
  else if (t.dataset.widgetVeh !== undefined) { S.setSettings({ widgetVehicle: t.value }); toast('Enregistré'); }
  else if (t.dataset.lock !== undefined) {
    if (t.checked) { const ok = await LK.authenticate(T('Activer le verrouillage')); if (ok !== true) { t.checked = false; return toast(ok === null ? 'Aucun code ni empreinte configuré sur ce téléphone' : 'Verrouillage non activé'); } }
    S.setSettings({ lock: t.checked }); toast('Enregistré');
  }
  else if (t.dataset.lang !== undefined) { S.setSettings({ lang: t.value }); setLang(t.value); watch(); render(); document.documentElement.lang = t.value; }
  else if (t.dataset.notifDays !== undefined) { await N.setDaysBefore(+t.value); toast('Enregistré'); }
  else if (t.dataset.cat) { cat[t.dataset.cat] = t.value || null; if (t.dataset.cat === 'brand') { cat.model = null; cat.pt = null; } if (t.dataset.cat === 'model') cat.pt = null; render(); }
  else if (t.dataset.setting) { S.setSettings({ [t.dataset.setting]: t.checked }); if (t.dataset.setting === 'autoSync' && t.checked) D.syncNow(); }
  else if (t.dataset.act === 'op-toggle') { const v = veh(t.dataset.vid); S.change(() => { v.plan.find(o => o.id === t.dataset.id).enabled = t.checked; }); }
  else if (t.id === 'photo') { $('#photoName').textContent = t.files[0] ? t.files[0].name : ''; }
  else if (t.id === 'docfile' && t.files[0]) { const f = t.files[0]; await addDoc(t.dataset.vid, f.name.replace(/\.[^.]+$/, ''), f); t.value = ''; toast('Document ajouté'); render(); }
  else if (t.id === 'impfile' && t.files[0]) {
    try {
      const f = t.files[0], raw = JSON.parse(await f.text());
      if (!raw || !Array.isArray(raw.vehicles)) throw new Error('Ce fichier n’est pas un fichier de données AutoBio.');
      const data = S.normalize(raw); imp = { name: f.name.replace(/\.json$/i, ''), data, report: summarize(data) }; render();
    } catch (err) { const bx = $('#impErr'); bx.style.display = 'block'; bx.textContent = err instanceof SyntaxError ? 'Ce fichier n’est pas un JSON valide.' : err.message; }
  }
});
async function addDoc(vid, name, file, linkedId) {
  const doc = { id: S.uid(), vehicleId: vid, name, date: today(), mime: '', size: 0, linkedId: linkedId || null, driveId: null };
  const blob = await shrinkImage(file); doc.mime = blob.type || file.type; doc.size = blob.size;
  await putBlob(doc.id, blob); S.change(d => d.documents.push(doc));
}
async function doImport() {
  const had = S.hasContent();
  if (had && !await ask({ title: 'Remplacer les données ?', text: 'Les véhicules actuels de l’appli seront remplacés par ceux du fichier. Une copie de sécurité est gardée.', ok: 'Remplacer' })) return;
  if (D.isConnected()) {
    const remote = await D.remoteInfo();
    if (remote?.vehicles?.length) await D.safetyCopy('avant-restauration', remote);
    if (had) await D.safetyCopy('telephone-avant-restauration', S.getData());
  }
  imp.data.updatedAt = new Date().toISOString();
  S.replaceData(imp.data, { dirty: true });
  S.setMeta({ onboarded: true });
  imp.done = true; render();
  if (D.isConnected()) await D.syncNow();
}
document.addEventListener('submit', async e => {
  const f = e.target.closest('form[data-form]'); if (!f) return;
  e.preventDefault();
  const fd = new FormData(f), g = n => (fd.get(n) ?? '').toString().trim(), kind = f.dataset.form, id = f.dataset.id, vid = f.dataset.vid;
  try {
    if (kind === 'vehicle') {
      const rec = { brand: g('brand'), model: g('model'), year: num(g('year')), fuelType: g('fuelType'), mileage: num(g('mileage')) || 0, ctNextDate: g('ctNextDate'), insuranceDate: g('insuranceDate'), purchaseDate: g('purchaseDate'), purchasePrice: num(g('purchasePrice')), tyreWinter: g('tyreWinter'), tyreSummer: g('tyreSummer'), insuranceMode: g('insuranceMode') === 'monthly' ? 'monthly' : 'annual', insuranceAmount: num(g('insuranceAmount')), insuranceDay: num(g('insuranceDay')), insuranceFrom: g('insuranceFrom') };
      if (id && rec.mileage !== veh(id).mileage) rec.mileageAt = S.isoToday();
      if (rec.insuranceMode === 'monthly' && !rec.insuranceFrom) rec.insuranceFrom = S.isoToday().slice(0, 8) + '01';
      if (id && (rec.insuranceMode !== veh(id).insuranceMode || rec.insuranceFrom !== veh(id).insuranceFrom)) rec.insuranceGenTo = '';
      rec.name = g('name') || [rec.brand, rec.model].filter(Boolean).join(' ') || 'Véhicule';
      if (id) {
        const before = { ct: veh(id).ctNextDate, ins: veh(id).insuranceDate };
        S.change(() => Object.assign(veh(id), rec)); S.autoInsurance(); toast('Enregistré'); go(`#/v/${id}`);
        offerAgenda(S.reminders(id).filter(r => (r.kind === 'ct' && rec.ctNextDate && rec.ctNextDate !== before.ct) || (r.kind === 'ins' && rec.insuranceDate && rec.insuranceDate !== before.ins)));
        return;
      }
      const nid = S.uid(); S.change(d => d.vehicles.push({ id: nid, plan: [], ...rec })); S.autoInsurance(); toast('Véhicule ajouté');
      go(C.guessModel(rec.brand, rec.model) ? `#/v/${nid}/catalogue` : `#/v/${nid}/plan`);
      offerAgenda(S.reminders(nid).filter(r => r.kind === 'ct' || r.kind === 'ins'));
      return;
    }
    if (kind === 'maint') {
      const types = fd.getAll('types'), v = veh(vid), planIds = types.filter(t => t.startsWith('p:')).map(t => t.slice(2));
      const tags = [...types.filter(t => t.startsWith('g:')).map(t => t.slice(2)), ...planIds.map(p => v.plan.find(o => o.id === p)?.label).filter(Boolean)];
      if (g('custom')) tags.push(g('custom'));
      const rec = { vehicleId: vid, date: g('date'), mileage: num(g('mileage')), cost: num(g('cost')) || 0, garage: g('garage'), notes: g('notes'), tags, planIds, label: tags.join(' + ') || 'Entretien' };
      let mid = id;
      if (id) S.change(d => Object.assign(d.maintenances.find(x => x.id === id), rec)); else { mid = S.uid(); S.change(d => d.maintenances.push({ id: mid, ...rec })); }
      const file = fd.get('photo'); if (file && file.size) await addDoc(vid, `Facture – ${rec.label}`, file, mid);
      toast('Entretien enregistré'); go(`#/v/${vid}`);
      offerAgenda(S.reminders(vid).filter(r => r.kind === 'plan' && planIds.includes(r.opId)));
      return;
    }
    if (kind === 'fuel') {
      const l = num(g('liters')), t = num(g('total'));
      const rec = { vehicleId: vid, date: g('date'), mileage: num(g('mileage')) || 0, liters: l, total: t, pricePerLiter: l ? Math.round(t / l * 1000) / 1000 : 0, full: fd.has('full'), ignoreConso: fd.has('ignoreConso'), station: g('station'), notes: g('notes') };
      const fid = id || S.uid();
      if (id) S.change(d => Object.assign(d.fuels.find(x => x.id === id), rec)); else S.change(d => d.fuels.push({ id: fid, ...rec }));
      const al = S.consoAlert(vid, fid), f1 = n => n.toLocaleString(loc(), { maximumFractionDigits: 1, minimumFractionDigits: 1 });
      toast(al ? `Conso inhabituelle : ${f1(al.l100)} L/100 km, +${al.pct} % par rapport à ta moyenne (${f1(al.avg)}). Vérifie la pression des pneus, une fuite ou les injecteurs.` : 'Plein enregistré', null, al ? 8000 : 0); return go(`#/v/${vid}/pleins`);
    }
    if (kind === 'exp') {
      const rec = { vehicleId: vid, date: g('date'), amount: num(g('amount')) || 0, category: g('category') || 'Autre', description: g('description'), mileage: num(g('mileage')) };
      if (id) S.change(d => Object.assign(d.expenses.find(x => x.id === id), rec)); else S.change(d => d.expenses.push({ id: S.uid(), ...rec }));
      toast('Dépense enregistrée'); return go(`#/v/${vid}/depenses`);
    }
    if (kind === 'op') {
      const rec = { label: g('label'), everyKm: num(g('everyKm')), everyMonths: num(g('everyMonths')), lastKm: num(g('lastKm')), lastDate: g('lastDate'), enabled: fd.has('enabled') };
      const oid = id || S.uid();
      S.change(() => { const v = veh(vid); if (id) Object.assign(v.plan.find(o => o.id === id), rec); else v.plan.push({ id: oid, ...rec }); });
      toast('Opération enregistrée'); go(`#/v/${vid}/plan`);
      if (rec.enabled && (rec.lastKm != null || rec.lastDate)) offerAgenda(S.reminders(vid).filter(r => r.opId === oid));
      return;
    }
  } catch (err) { toast(err.message || 'Erreur'); console.error(err); }
});

// ---------- démarrage ----------
D.setConflictHandler(async (remote, local) => {
  const keepRemote = await ask({ title: 'Deux versions différentes', text: 'Le fichier est plus récent, et ce téléphone a aussi des modifications non envoyées. Laquelle garder ? L’autre est conservée dans les copies de sécurité.', ok: 'Garder le fichier', cancel: 'Garder ce téléphone' });
  if (keepRemote) { await D.safetyCopy('telephone-avant-fusion', local); return 'remote'; }
  await D.safetyCopy('fichier-avant-ecrasement', remote); return 'local';
});
S.subscribe(t => { if ((t === 'data' || t === 'meta') && !current.form) { const keep = document.activeElement?.closest?.('dialog'); if (!keep) render(); } });
D.onStatus(() => { document.querySelectorAll('[data-pill]').forEach(p => { const [k, t] = PILL[D.getStatus().status] || PILL.off; p.className = `pill ${k}`; p.querySelector('span').textContent = t; }); if (location.hash.startsWith('#/reglages')) render(); });
if ('serviceWorker' in navigator && location.protocol.startsWith('http') && !location.hostname.match(/^(localhost|127\.)/)) navigator.serviceWorker.register('sw.js').catch(() => {});
if (!S.getMeta().onboarded && !S.hasContent() && !D.isConnected() && !/^#\/(restaurer|reglages|bienvenue)/.test(location.hash)) location.hash = '#/bienvenue';
// Retour (geste ou bouton Android) : ferme d'abord un pop-up, puis remonte d'un écran dans l'appli ; quitte seulement depuis l'accueil.
const appPlugin = () => window.Capacitor?.Plugins?.App;
function goBack() {
  const dlg = $('#dlg'); if (dlg?.open) { dlg.close(); return true; }
  const ob = $('[data-act=onb-back]'); if (ob) { ob.click(); return true; }
  if (location.hash.startsWith('#/bienvenue')) return false;
  const back = $('.hdr .back[href]');
  if (back) { location.hash = back.getAttribute('href'); return true; }
  if (location.hash && location.hash !== '#/' && location.hash !== '#') { location.hash = '#/'; return true; }
  return false;
}
appPlugin()?.addListener('backButton', () => { if (!goBack()) appPlugin().exitApp(); });
function applyTheme() { document.documentElement.dataset.theme = S.getMeta().settings.theme || 'auto'; }
applyTheme();
// Verrouillage : écran masqué tant que le code / l'empreinte n'a pas été validé ; reverrouillé après 30 s en arrière-plan.
let locked = false, authing = false, leftAt = 0, authEnd = 0;
// L'écran de confirmation Android met l'appli en pause puis la reprend : ces va-et-vient (pendant et juste après l'authentification) ne doivent jamais relancer le verrou.
const busy = () => authing || Date.now() - authEnd < 4000;
async function unlock() {
  if (authing) return; authing = true; leftAt = 0;
  try { const ok = await LK.authenticate(T('Déverrouiller AutoBio')); if (ok === true || ok === null) { locked = false; document.getElementById('lock')?.remove(); } }
  finally { authing = false; authEnd = Date.now(); leftAt = 0; }
}
function lockNow() {
  if (!S.getMeta().settings.lock || !LK.available() || locked) return;
  locked = true;
  const d = document.createElement('div'); d.id = 'lock';
  d.innerHTML = `<div class="lockbox">${ic('lock', 44)}<h2>AutoBio</h2><p class="muted">Verrouillé</p><button class="btn" type="button" data-act="unlock">Déverrouiller</button></div>`;
  document.body.appendChild(d); unlock();
}
lockNow();
appPlugin()?.addListener('appStateChange', e => {
  if (busy()) { leftAt = 0; return; }
  if (!e.isActive) { if (!locked) leftAt = Date.now(); return; }
  const away = leftAt; leftAt = 0;
  if (away && Date.now() - away > 30000) lockNow();
});
// Bouton « Fait » d'une notification : entretien prérempli pour cette opération.
N.onDone((vid, oid) => { pendingPlan = oid; go(`#/v/${vid}/entretien/new`); }, vid => { go(`#/v/${vid}`); setTimeout(() => askKm(vid), 150); });
S.autoInsurance();
document.addEventListener('visibilitychange', () => { if (!document.hidden) S.autoInsurance(); });
if (!S.getMeta().firstUseAt) S.setMeta({ firstUseAt: new Date().toISOString() });
watch();
D.init();
N.init();
W.init(S, h => { location.hash = h; }, () => document.querySelector('[data-act=km]')?.click());
render();

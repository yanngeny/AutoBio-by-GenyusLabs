// Carnet d'entretien : modèle de document (rendu par pdf.js) construit à partir des données d'un véhicule.
const eur = n => (n == null || n === '' ? '' : new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n));
const date = iso => (iso ? new Date(iso + 'T12:00:00').toLocaleDateString('fr-FR') : '');
const km = n => (n ? Math.round(n).toLocaleString('fr-FR') + ' km' : '');
const byDateDesc = (a, b) => (b.date || '').localeCompare(a.date || '');

export function carnetDoc(data, vid, { today, mileage, reminders = [], version = '' } = {}) {
  const v = data.vehicles.find(x => x.id === vid);
  if (!v) return null;
  const mine = a => (a || []).filter(e => e.vehicleId === vid).sort(byDateDesc);
  const maints = mine(data.maintenances), exps = mine(data.expenses), fuels = mine(data.fuels);
  const sumM = maints.reduce((s, m) => s + (m.cost || 0), 0), sumE = exps.reduce((s, x) => s + (x.amount || 0), 0), sumF = fuels.reduce((s, f) => s + (f.total || 0), 0);
  const kv = [['Véhicule', [v.brand, v.model].filter(Boolean).join(' ') || v.name], ['Nom', v.name], ['Année', v.year ? String(v.year) : ''], ['Carburant', v.fuelType || ''], ['Kilométrage', km(mileage ?? v.mileage)], ['Contrôle technique', date(v.ctNextDate)], ['Assurance', date(v.insuranceDate)]].filter(r => r[1]);
  const blocks = [{ h: 'Véhicule' }, { kv }];
  if (reminders.length) blocks.push({ h: 'Prochaines échéances' }, { table: { cols: [{ h: 'Opération', w: 5 }, { h: 'Échéance', w: 3 }, { h: 'Kilométrage', w: 3, right: true }], rows: reminders.slice(0, 15).map(r => [r.label, r.dueDate ? date(r.dueDate) : '', r.dueKm != null ? km(r.dueKm) : '']) } });
  blocks.push({ h: `Entretiens (${maints.length})` }, { table: { cols: [{ h: 'Date', w: 2.2 }, { h: 'Km', w: 2.4, right: true }, { h: 'Opération', w: 5 }, { h: 'Garage', w: 3 }, { h: 'Coût', w: 2, right: true }], rows: maints.map(m => [date(m.date), km(m.mileage), m.label || 'Entretien', m.garage || '', eur(m.cost)]) } });
  if (exps.length) blocks.push({ h: `Autres dépenses (${exps.length})` }, { table: { cols: [{ h: 'Date', w: 2.2 }, { h: 'Catégorie', w: 3 }, { h: 'Description', w: 6 }, { h: 'Montant', w: 2, right: true }], rows: exps.map(x => [date(x.date), x.category || '', x.description || '', eur(x.amount)]) } });
  blocks.push({ h: 'Synthèse' }, { kv: [['Entretiens', eur(sumM)], ['Autres dépenses', eur(sumE)], ['Carburant (' + fuels.length + ' pleins)', eur(sumF)], ['Total', eur(sumM + sumE + sumF)]] });
  return { title: 'Carnet d’entretien', subtitle: `${v.name} · édité le ${date(today)}`, footer: `AutoBio by GenyusLabs${version ? ' ' + version : ''}`, blocks };
}
export const carnetName = (v, today) => `Carnet_${String(v?.name || 'vehicule').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^A-Za-z0-9]+/g, '_')}_${today}.pdf`;

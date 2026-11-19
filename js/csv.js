// Export tableur : un seul fichier CSV (séparateur « ; », accents lisibles par Excel / LibreOffice).
const COLS = ['type', 'véhicule', 'date', 'kilométrage', 'libellé', 'garage / station', 'litres', 'prix au litre', 'montant', 'catégorie', 'notes'];
const cell = v => { const s = v == null ? '' : String(v).replace(/\r?\n/g, ' '); return /[;"]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
const n = v => (v == null || v === '' ? '' : String(v).replace('.', ','));

export function toCsv(data) {
  const name = id => data.vehicles.find(v => v.id === id)?.name || '';
  const rows = [];
  for (const m of data.maintenances || []) rows.push(['entretien', name(m.vehicleId), m.date, n(m.mileage), m.label, m.garage, '', '', n(m.cost), '', m.notes]);
  for (const f of data.fuels || []) rows.push(['plein', name(f.vehicleId), f.date, n(f.mileage), '', f.station, n(f.liters), n(f.pricePerLiter), n(f.total), '', f.notes]);
  for (const x of data.expenses || []) rows.push(['dépense', name(x.vehicleId), x.date, n(x.mileage), x.description, '', '', '', n(x.amount), x.category, '']);
  rows.sort((a, b) => (b[2] || '').localeCompare(a[2] || '') || a[1].localeCompare(b[1]));
  return '﻿' + [COLS, ...rows].map(r => r.map(cell).join(';')).join('\r\n') + '\r\n';
}

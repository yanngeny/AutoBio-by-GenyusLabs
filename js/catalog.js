// Catalogue de plans d'entretien constructeur. Pour l'instant : Audi, modèles commercialisés depuis 2019.
// Les intervalles viennent des documents Audi cités dans SOURCES. Ce sont des repères : le carnet d'entretien
// et l'indicateur de service du véhicule restent la référence (l'intervalle varie selon le moteur et l'usage).

export const SOURCES = {
  ssp438: { label: 'Audi, programme d’étude 438 (concept d’entretien)', url: 'https://esperformance.net/ssp/audi/SSP_438_DE.pdf' },
  ukReg: { label: 'Audi UK, régimes d’entretien fixe / flexible', url: 'https://www.audi.co.uk/en/owners/service-and-maintenance/service-plans/layer/service-regimes/' },
  ukRec: { label: 'Audi UK, plans d’entretien recommandés', url: 'https://www.audi.co.uk/en/owners/service-and-maintenance/recommended-service-schedules/' },
  us2020: { label: 'Audi USA, calendrier d’entretien 2020 (converti en km)', url: 'https://static.nhtsa.gov/odi/tsbs/2019/MC-10164490-0001.pdf' },
};

const MI = 1.609344;
const kmOf = miles => Math.round(miles * MI / 1000) * 1000; // 40 000 mi -> 64 000 km

// Familles de motorisation
export const POWERTRAINS = {
  tfsi: 'Essence (TFSI)',
  tdi: 'Diesel (TDI)',
  phev: 'Hybride rechargeable (TFSI e)',
  sport: 'Sportive (S / RS, essence)',
  bev: 'Électrique (e-tron)',
};

// Bougies : intervalle selon la famille de moteur (calendrier USA, converti)
const PLUGS = {
  compact: { everyKm: kmOf(80000), everyMonths: 72 }, // A3, Q3, TT 45 TFSI
  mid: { everyKm: kmOf(40000), everyMonths: 72 },     // A4, A5, A6, A7, A8, Q5, Q7, Q8, TTS
  sport: { everyKm: kmOf(30000), everyMonths: 36 },   // S/RS, TT RS
  r8: { everyKm: kmOf(60000), everyMonths: 72 },
};

// Modèles. plug : famille de bougies ; box : boîte à double embrayage « S tronic » ; awd : quattro à embrayage lamellaire.
const M = (id, name, years, powertrains, o = {}) => ({ id, name, years, powertrains, plug: 'mid', box: false, awd: false, ...o });
export const CATALOG = {
  Audi: {
    models: [
      M('a1', 'A1 (GB)', '2018+', ['tfsi'], { plug: 'compact', box: true }),
      M('a3', 'A3 (8V restylée, 8Y)', '2019+', ['tfsi', 'tdi', 'phev', 'sport'], { plug: 'compact', box: true, awd: true }),
      M('a4', 'A4 / A4 Avant / allroad (B9)', '2019+', ['tfsi', 'tdi', 'sport'], { box: true }),
      M('a5', 'A5 / Sportback / Cabriolet', '2019+', ['tfsi', 'tdi', 'sport'], { box: true }),
      M('a6', 'A6 / Avant / allroad (C8)', '2019+', ['tfsi', 'tdi', 'phev', 'sport'], { box: true }),
      M('a7', 'A7 Sportback (C8)', '2019+', ['tfsi', 'tdi', 'phev', 'sport'], { box: true }),
      M('a8', 'A8 (D5)', '2019+', ['tfsi', 'tdi', 'phev', 'sport']),
      M('q2', 'Q2', '2019+', ['tfsi', 'tdi', 'sport'], { plug: 'compact', box: true }),
      M('q3', 'Q3 / Q3 Sportback (F3)', '2019+', ['tfsi', 'tdi', 'phev', 'sport'], { plug: 'compact', box: true, awd: true }),
      M('q4etron', 'Q4 e-tron / Sportback', '2021+', ['bev'], { heatPump: true }),
      M('q5', 'Q5 / Q5 Sportback (FY)', '2019+', ['tfsi', 'tdi', 'phev', 'sport'], { box: true }),
      M('q7', 'Q7 (4M)', '2019+', ['tfsi', 'tdi', 'phev', 'sport']),
      M('q8', 'Q8 / SQ8 / RS Q8', '2019+', ['tfsi', 'tdi', 'phev', 'sport']),
      M('etron', 'e-tron / Q8 e-tron', '2019+', ['bev']),
      M('etrongt', 'e-tron GT / RS e-tron GT', '2021+', ['bev']),
      M('q6etron', 'Q6 e-tron / SQ6 e-tron', '2024+', ['bev']),
      M('a6etron', 'A6 e-tron / S6 e-tron', '2024+', ['bev']),
      M('tt', 'TT / TTS / TT RS (8S)', '2019–2023', ['tfsi', 'sport'], { plug: 'compact', box: true, awd: true }),
      M('r8', 'R8 (V10)', '2019+', ['sport'], { plug: 'r8', box: true }),
    ],
  },
};

const op = (label, o) => ({ label, everyKm: null, everyMonths: null, enabled: true, note: '', source: [], ...o });

// Construit la liste d'opérations d'un plan pour un modèle et une motorisation.
export function buildPlan(brand, modelId, powertrain) {
  const m = CATALOG[brand]?.models.find(x => x.id === modelId);
  if (!m) return [];
  const out = [];
  const bev = powertrain === 'bev';
  if (!bev) {
    out.push(op('Vidange huile moteur + filtre', {
      everyKm: 15000, everyMonths: 12, kind: 'oil', source: ['ssp438', 'ukReg'],
      note: 'Entretien fixe : 15 000 km ou 1 an. Avec l’indicateur de service flexible (LongLife), l’intervalle peut aller jusqu’à 30 000 km ou 2 ans : suis alors l’affichage du tableau de bord.',
    }));
  }
  out.push(op('Révision (Inspection Service)', {
    everyKm: bev && m.id !== 'etron' ? null : 30000, everyMonths: 24, kind: 'inspection', source: ['ssp438', 'ukReg', 'ukRec'],
    note: bev ? 'Tous les 2 ans. Contrôle aussi la charge et le système haute tension.' : 'Tous les 30 000 km ou 2 ans, au premier des deux.',
  }));
  out.push(op('Liquide de frein', { everyMonths: 24, source: ['ssp438', 'ukRec', 'us2020'], note: 'Tous les 2 ans, quel que soit le kilométrage.' }));
  out.push(op('Filtre d’habitacle (pollen)', { everyMonths: 24, source: ['ukRec', 'us2020'], note: 'Tous les 2 ans.' }));
  if (!bev) {
    out.push(op('Filtre à air moteur', { everyKm: kmOf(40000), everyMonths: 48, source: ['ukRec', 'us2020'], note: 'Audi indique 40 000 à 60 000 miles (64 000 à 96 000 km) ou 4 ans. Valeur basse retenue ; à adapter si tu roules en milieu poussiéreux.' }));
    if (powertrain === 'tdi') out.push(op('Filtre à carburant (diesel)', { everyKm: kmOf(40000), source: ['ukRec'], note: 'Audi indique 40 000 à 60 000 miles (64 000 à 96 000 km).' }));
    else {
      const p = powertrain === 'sport' && m.id !== 'r8' ? PLUGS.sport : PLUGS[m.plug];
      out.push(op('Bougies d’allumage', { ...p, source: ['us2020'], note: 'Intervalle du calendrier Audi USA converti en km ; il varie selon le moteur. Vérifie le carnet de ton véhicule.' }));
    }
    if (m.box) out.push(op('Huile de boîte S tronic', {
      everyKm: m.plug === 'compact' ? kmOf(80000) : kmOf(40000), source: ['us2020'], enabled: true,
      note: 'Valeur du calendrier Audi USA converti en km, selon le modèle. Absent si ta boîte est une automatique à convertisseur (tiptronic).',
    }));
    if (m.awd) out.push(op('Huile du coupleur quattro (embrayage lamellaire)', {
      everyMonths: 36, source: ['us2020'], enabled: false,
      note: 'Tous les 3 ans sur les versions quattro à moteur transversal. À activer seulement si ton véhicule est un quattro.',
    }));
    out.push(op('Courroie de distribution', {
      everyKm: kmOf(80000), enabled: false, source: ['ukRec'],
      note: 'Audi indique 80 000 à 140 000 miles (130 000 à 225 000 km) selon le moteur. Désactivée par défaut : renseigne l’intervalle exact de ton moteur.',
    }));
  } else if (m.heatPump) {
    out.push(op('Climatisation / pompe à chaleur', { everyMonths: 48, source: ['ukRec'], note: 'Entretien tous les 4 ans sur les Q4 e-tron avec pompe à chaleur.' }));
  }
  return out;
}

export const modelOf = (brand, modelId) => CATALOG[brand]?.models.find(x => x.id === modelId) || null;
// Retrouve un modèle du catalogue à partir du texte saisi dans la fiche véhicule (ex. « A3 Sportback »).
export function guessModel(brand, text) {
  const b = Object.keys(CATALOG).find(k => k.toLowerCase() === String(brand || '').trim().toLowerCase());
  if (!b) return null;
  const t = String(text || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  const hit = [...CATALOG[b].models].sort((x, y) => y.id.length - x.id.length).find(m => t && t.startsWith(m.id));
  return { brand: b, model: hit ? hit.id : null };
}

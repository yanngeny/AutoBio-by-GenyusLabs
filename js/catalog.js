// Catalogue de plans d'entretien constructeur. Pour l'instant : Audi, modèles commercialisés depuis 2019.
//
// Règle de sourcing : uniquement des documents français ou d'Europe de l'ouest (France, Allemagne, Royaume-Uni).
// Audi ne publie pas de tableau public par modèle : les valeurs viennent du programme d'étude Audi 438 (version
// française), de la presse Audi France et de guides d'atelier allemands qui disent s'appuyer sur les données
// constructeur. Quand les sources ne confirment pas une valeur pour un modèle ou une motorisation, l'opération est
// soit absente, soit proposée désactivée avec l'explication : rien n'est deviné. Le carnet d'entretien et
// l'indicateur de service du véhicule restent la référence.

export const SOURCES = {
  ssp438: { label: 'Audi, programme d’étude 438 (version française)', url: 'https://www.vag-technique.fr/ext_files/ssp/audi/SSP_438_Le_concept_de_maintenance_perfectionn%C3%A9.pdf' },
  audiFr: { label: 'Audi France (Caradisiac), service Entretien Long Life', url: 'https://www.caradisiac.com/audi-une-prise-en-charge-sur-mesure-pour-les-vehicules-de-plus-de-5-ans-197981.htm' },
  repA3: { label: 'repareo, Audi A3 (données constructeur)', url: 'https://www.repareo.de/inspektion-audi-a3-8v/' },
  repA4: { label: 'repareo, Audi A4 B9', url: 'https://www.repareo.de/inspektion-audi-a4-b9/' },
  repA5: { label: 'repareo, Audi A5', url: 'https://www.repareo.de/inspektion-audi-a5/' },
  repQ5: { label: 'repareo, Audi Q5', url: 'https://www.repareo.de/inspektion-audi-q5' },
  cwTT: { label: 'CarWiki, Audi TT', url: 'https://carwiki.de/audi-tt-inspektion' },
  cwQ3: { label: 'CarWiki, Audi Q3', url: 'https://carwiki.de/audi-q3-inspektion' },
  cwA7: { label: 'CarWiki, Audi A7', url: 'https://carwiki.de/audi-a7-inspektion' },
  cwQ7: { label: 'CarWiki, Audi Q7', url: 'https://carwiki.de/audi-q7-inspektion' },
  cwEtron: { label: 'CarWiki, Audi e-tron', url: 'https://carwiki.de/audi-e-tron-inspektion/' },
  cwQ4: { label: 'CarWiki, Audi Q4 e-tron', url: 'https://carwiki.de/audi-q4-e-tron-inspektion/' },
  fairgarage: { label: 'FairGarage, Audi (liquide de frein)', url: 'https://www.fairgarage.com/de-de/audi-inspektion-kosten' },
  ukEv: { label: 'Audi UK, entretien des modèles électriques', url: 'https://www.audi.co.uk/uk/web/en/owners/ev-service-and-maintenance.html' },
  haldexAt: { label: 'Motor-Talk, TT 8S (témoignage d’atelier, Autriche)', url: 'https://www.motor-talk.de/forum/inspektion-serviceintervalle-wartung-kosten-t6236484.html' },
};

// Familles de motorisation
export const POWERTRAINS = {
  tfsi: 'Essence (TFSI)',
  tdi: 'Diesel (TDI)',
  phev: 'Hybride rechargeable (TFSI e)',
  sport: 'Sportive (S / RS, essence)',
  bev: 'Électrique (e-tron)',
};

// Modèles. Pour chaque modèle :
//  gear  : 'wet' = S tronic à embrayages en bain d'huile (vidange à 60 000 km confirmée),
//          'tip' = automatique à convertisseur (tiptronic), 'unsure' = selon le moteur, non confirmé par les sources
//  awd   : le modèle existe en quattro à embrayage lamellaire (Haldex), huile à renouveler
//  belt  : courroie de distribution sur une partie des moteurs
const M = (id, name, years, powertrains, o = {}) => ({ id, name, years, powertrains, gear: 'unsure', awd: false, belt: false, ...o });
export const CATALOG = {
  Audi: {
    models: [
      M('a1', 'A1 (GB)', '2018+', ['tfsi'], { belt: true }),
      M('a3', 'A3 (8V restylée, 8Y)', '2019+', ['tfsi', 'tdi', 'phev', 'sport'], { awd: true, belt: true }),
      M('a4', 'A4 / A4 Avant / allroad (B9)', '2019+', ['tfsi', 'tdi', 'sport'], { gear: 'wet' }),
      M('a5', 'A5 / Sportback / Cabriolet', '2019+', ['tfsi', 'tdi', 'sport'], { gear: 'wet' }),
      M('a6', 'A6 / Avant / allroad (C8)', '2019+', ['tfsi', 'tdi', 'phev', 'sport'], { gear: 'wet' }),
      M('a7', 'A7 Sportback (C8)', '2019+', ['tfsi', 'tdi', 'phev', 'sport'], { gear: 'wet' }),
      M('a8', 'A8 (D5)', '2019+', ['tfsi', 'tdi', 'phev', 'sport'], { gear: 'tip' }),
      M('q2', 'Q2', '2019+', ['tfsi', 'tdi', 'sport'], { awd: true, belt: true }),
      M('q3', 'Q3 / Q3 Sportback (F3)', '2019+', ['tfsi', 'tdi', 'phev', 'sport'], { awd: true, belt: true }),
      M('q4etron', 'Q4 e-tron / Sportback', '2021+', ['bev']),
      M('q5', 'Q5 / Q5 Sportback (FY)', '2019+', ['tfsi', 'tdi', 'phev', 'sport'], { gear: 'wet' }),
      M('q7', 'Q7 (4M)', '2019+', ['tfsi', 'tdi', 'phev', 'sport'], { gear: 'tip' }),
      M('q8', 'Q8 / SQ8 / RS Q8', '2019+', ['tfsi', 'tdi', 'phev', 'sport'], { gear: 'tip' }),
      M('etron', 'e-tron / Q8 e-tron', '2019+', ['bev']),
      M('etrongt', 'e-tron GT / RS e-tron GT', '2021+', ['bev']),
      M('q6etron', 'Q6 e-tron / SQ6 e-tron', '2024+', ['bev']),
      M('a6etron', 'A6 e-tron / S6 e-tron', '2024+', ['bev']),
      M('tt', 'TT / TTS / TT RS (8S)', '2019–2023', ['tfsi', 'sport'], { gear: 'wet', awd: true }),
      M('r8', 'R8 (V10)', '2019+', ['sport']),
    ],
  },
};

const op = (label, o) => ({ label, everyKm: null, everyMonths: null, enabled: true, note: '', source: [], ...o });

// Construit la liste d'opérations d'un plan pour un modèle et une motorisation.
export function buildPlan(brand, modelId, powertrain) {
  const m = CATALOG[brand]?.models.find(x => x.id === modelId);
  if (!m) return [];
  const out = [];

  // ----- Électrique : pas de vidange ni de bougies
  if (powertrain === 'bev') {
    const km30 = m.id === 'etron'; // e-tron / Q8 e-tron : 30 000 km ou 2 ans ; les autres : 2 ans
    const unconfirmed = ['q6etron', 'a6etron'].includes(m.id) ? ' Valeur des autres Audi électriques, non confirmée pour ce modèle : vérifie dans ton carnet.' : '';
    out.push(op('Entretien (inspection)', {
      everyKm: km30 ? 30000 : null, everyMonths: 24, kind: 'inspection', source: ['ukEv', m.id === 'etron' ? 'cwEtron' : 'cwQ4'],
      note: (km30 ? 'Tous les 30 000 km ou 2 ans. ' : 'Tous les 2 ans, sans limite de kilométrage. ') + 'Comprend le contrôle de la prise de charge, des composants haute tension et du circuit de refroidissement.' + unconfirmed,
    }));
    out.push(op('Liquide de frein', { everyMonths: 24, source: ['ukEv', 'cwQ4'], note: 'Tous les 2 ans.' + unconfirmed }));
    out.push(op('Filtre d’habitacle (pollen)', { everyMonths: 24, source: ['ukEv', 'cwEtron'], note: 'Tous les 2 ans.' + unconfirmed }));
    if (m.id === 'etron') out.push(op('Cartouche du liquide de refroidissement (essieu)', { everyKm: 30000, everyMonths: 24, source: ['cwEtron'], note: 'Cartouche à remplacer à chaque entretien (30 000 km ou 2 ans) sur l’e-tron.' }));
    return out;
  }

  // ----- Thermique et hybride rechargeable
  const phev = powertrain === 'phev';
  out.push(op('Vidange huile moteur + filtre', {
    everyKm: 30000, everyMonths: 24, kind: 'oil', source: ['ssp438', 'audiFr', m.id === 'tt' ? 'cwTT' : 'repA3'],
    note: 'Entretien LongLife (huile homologuée) : au plus tard à 30 000 km ou 2 ans, la révision et les contrôles sont faits en même temps. Si ton véhicule est en entretien fixe : vidange tous les 15 000 km ou 1 an, en alternant petit et grand entretien. L’indicateur de service du tableau de bord fait foi.' + (powertrain === 'sport' ? ' Les moteurs S et RS suivent le même principe, mais vérifie l’affichage du véhicule.' : '') + (phev ? ' Sur l’hybride rechargeable, l’entretien comprend aussi le contrôle du système haute tension.' : ''),
  }));
  out.push(op('Liquide de frein', {
    everyMonths: 24, source: ['fairgarage', 'repA3', 'repA5', m.id === 'tt' ? 'haldexAt' : 'repA4'],
    note: 'Premier remplacement à 3 ans, puis tous les 2 ans. Le plan ne gère qu’un intervalle : si le véhicule a moins de 3 ans, renseigne la date du dernier changement ou attends le premier à 3 ans.',
  }));
  out.push(op('Filtre d’habitacle (pollen)', { everyMonths: 24, source: ['cwTT', 'cwA7'], note: 'Tous les 2 ans.' }));
  out.push(op('Filtre à air moteur', { everyKm: 90000, everyMonths: 72, source: ['repA3', 'repQ5', 'cwTT'], note: 'Tous les 90 000 km ou 6 ans selon les guides allemands consultés, avec nettoyage du boîtier.' }));

  if (powertrain === 'tdi') {
    out.push(op('Filtre à carburant (diesel)', { everyKm: 90000, source: ['repA3'], note: 'Tous les 90 000 km (valeur donnée pour l’A3 diesel ; à confirmer sur ton moteur).' }));
  } else {
    out.push(op('Bougies d’allumage', { everyKm: 60000, everyMonths: 72, source: ['repA5', 'repQ5', 'repA3'], note: 'Tous les 60 000 km ou 6 ans.' }));
  }

  // Boîte
  if (m.gear === 'wet') {
    out.push(op('Huile de boîte S tronic', { everyKm: 60000, source: ['cwA7', m.id === 'tt' ? 'cwTT' : 'repQ5'], note: 'Tous les 60 000 km sur les S tronic à double embrayage en bain d’huile. Sans objet si ta boîte est manuelle.' + (m.id === 'tt' && powertrain === 'tfsi' ? '' : '') }));
  } else if (m.id === 'q7') {
    out.push(op('Huile de boîte automatique (tiptronic)', { everyKm: 60000, source: ['cwQ7'], note: 'Tous les 60 000 km selon CarWiki pour le Q7.' }));
  } else if (m.gear === 'tip') {
    out.push(op('Huile de boîte automatique (tiptronic)', { enabled: false, source: [], note: 'Aucun intervalle confirmé par les sources consultées pour ce modèle : renseigne celui de ton carnet puis active l’opération.' }));
  } else {
    out.push(op('Huile de boîte S tronic', { everyKm: 60000, enabled: false, source: ['cwQ3', 'cwA7'], note: 'À activer seulement si ta boîte est une S tronic à embrayages en bain d’huile (60 000 km). Les S tronic à embrayage sec des petits moteurs ne sont pas couvertes par les sources consultées : vérifie ton carnet.' }));
  }

  // Quattro à embrayage lamellaire
  if (m.awd) {
    out.push(op('Huile du coupleur quattro (Haldex)', { everyMonths: 36, enabled: false, source: m.id === 'tt' ? ['haldexAt'] : [], note: 'Tous les 3 ans sur les quattro à embrayage lamellaire (valeur relevée sur le TT, témoignage d’atelier ; non confirmée pour les autres modèles). À activer seulement si ton véhicule est un quattro de ce type.' }));
  }

  // Distribution
  if (m.belt && powertrain !== 'sport') {
    out.push(op('Courroie de distribution', { everyKm: 210000, everyMonths: 120, enabled: false, source: ['repA3', 'cwQ3'], note: 'Courroie sur une partie des moteurs de ce modèle : 210 000 km au plus tard selon les sources, avec pompe à eau. Les moteurs à chaîne n’ont pas d’échéance. Active seulement si ton moteur a une courroie.' }));
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

# Groupe VW : synthèse (couverture très partielle)

## Couvert (3 enregistrements)
1. Polo VI 1.0 MPI (code DSGD), source Haynes UK, marqué `secondaire`. Boîte non précisée (la page ne mentionne que la manuelle, sans type).
2. Plan générique vw.fr « thermique », tous modèles et moteurs (non spécifique moteur).
3. Plan générique vw.fr « électrique », modèle non précisé (ID.3, ID.4, e-up! non distingués).

## Non couvert, et pourquoi
Polo VI (autres moteurs), T-Roc, T-Cross, Tiguan II, Golf VII et VIII, ID.3/ID.4 en propre, up!, Octavia, Fabia, Karoq, Ibiza, Leon, Arona : aucun enregistrement.
- vw.fr ne donne que des plans génériques, sans moteur ni boîte, et sans courroie/chaîne, huile DSG, filtre à air ni refroidissement.
- Les pages Haynes UK par modèle sont dynamiques : WebFetch n'a restitué qu'un seul moteur (1.0 MPI DSGD) pour la Polo. Aucun plan par moteur/boîte récupéré pour les autres modèles.
- Je n'ai pas lu les SSP VAG (vag-technique.fr) : ils décrivent le concept LongLife, pas les plans par moteur. SSP 438 est un document Audi, SSP 224 est en anglais.
- repareo.de / carwiki.de non consultés.
- Aucune valeur extrapolée : DSG (60 000 km), courroie/chaîne, mode LongLife vs fixe laissés vides.

## Contradictions et doutes
- Bougies : Haynes 60 000 km / 48 mois (1.0 MPI) contre vw.fr « entre 60 000 km / 4 ans et 90 000 km / 6 ans ».
- Filtre d'habitacle : Haynes 60 000 km / 24 mois (« nettoyage du boîtier », remplacement non confirmé) contre vw.fr électrique 2 ans, ou 1 an / 30 000 km en milieu poussiéreux.
- Huile : Haynes 15 000 km / 12 mois puis 30 000 km / 24 mois, sans dire si c'est LongLife ou fixe. vw.fr indique que le 30 000 km / 2 ans est un entretien « Long Life » proposé selon le style de conduite.
- Le champ `severe` de la révision (15 000 km / 12 mois) est une interprétation du libellé vw.fr « Service Vidange ». La source ne l'étiquette pas « sévère ».
- Haynes marqué `secondaire` par prudence : le brief ne précise pas le statut de Haynes UK dans l'enum de confiance.

## Sources utilisées
- https://www.volkswagen.fr/fr/entretenir-ma-volkswagen/entretien-et-pieces/plan-entretien/plan-entretien-thermique.html
- https://www.volkswagen.fr/fr/entretenir-ma-volkswagen/entretien-et-pieces/plan-entretien/plan-entretien-electrique.html
- https://www.volkswagen.fr/fr/entretenir-ma-volkswagen/entretien-et-pieces/plan-entretien.html (général : révision annuelle recommandée, Long Life jusqu'à 30 000 km ou 2 ans)
- https://uk.haynes.com/pages/maintenance-plans-car-volkswagen-polo-mk6-2017-2025

## Pistes pour compléter
Plans d'entretien par moteur/boîte (carnet constructeur, Haynes par moteur, idGarages en `secondaire`) pour chaque modèle. Les sélecteurs Haynes demandent peut-être une interaction que WebFetch ne permet pas.

# Citroën : synthèse (groupe `citroen`)

## Couvert (8 enregistrements, tous `secondaire`, source Haynes UK)
- C3 Aircross : 1.2 PureTech 110 (EB2ADT) et 1.2 PureTech 130 (EB2ADTS), chacun en deux plans (jusqu'à 09/2019, puis à partir de 10/2019). Boîte non précisée (null).
- C5 Aircross : 1.2 PureTech 130 (deux plans, jusqu'au 02/10/2019 puis à partir du 03/10/2019), 1.5 BlueHDi 130 (DV5RC), 1.6 PureTech 180 (EP6FADTXD). Boîte non précisée (null).

## Non couvert
C3 III (2016+, toutes motorisations dont PureTech 82/110, BlueHDi 75/100), C1 II, C4 Cactus, C4 Picasso / Grand C4 SpaceTourer, ë-C3, C4 III, ë-C3 Aircross, et les autres motorisations des Aircross (BlueHDi 100/120 C3 Aircross, etc.).
Raisons :
- Aucun feuillet constructeur Citroën trouvé : les « plan d'entretien » de forum-peugeot.com ne concernent que des modèles Peugeot. Je ne les ai pas transposés à Citroën (extrapolation interdite par le brief).
- Haynes UK : les pages C3 (2016-2023), C1 et la suite de la page C3 Aircross / C5 Aircross sont tronquées ou n'affichent que « See selector above » (valeurs derrière un sélecteur non lisible).
- idGarages : seules les pages C3 I, C3 II (2009-2013) et C3 Picasso sont ressorties, hors période 2015+. Une page idGarages C3 Aircross (URL construite) a été refusée par l'outil (demande d'autorisation sans réponse), je ne l'ai pas retentée.

## Doutes
- Valeurs lues sur Haynes UK via WebFetch (résumé automatique de pages longues, tronquées vers 100 000 caractères). Pour C3 Aircross, l'intervalle de vidange a été déduit de l'en-tête de la première colonne du tableau ; à vérifier.
- Pas de colonne « sévère » dans les extraits : `severeKm/severeMonths` à null partout.
- Filtre à carburant du BlueHDi 130, courroie du PureTech 180 : non listés, mis à null.
- Les données de C5 Aircross PureTech 130 et C3 Aircross PureTech 130 sont identiques (même moteur, cohérent).
- Haynes n'est pas un document constructeur : `confidence` = `secondaire`.

## Sources
- https://uk.haynes.com/pages/maintenance-plans-car-citroen-c3-aircross-2015-2025
- https://uk.haynes.com/pages/maintenance-plans-car-citroen-c5-aircross-2019-2025
- Consultées sans valeurs exploitables : https://uk.haynes.com/pages/maintenance-plans-car-citroen-c3, https://uk.haynes.com/pages/maintenance-plans-car-citroen-c1, https://www.idgarages.com/fr-fr/entretien/citroen/carnet-entretien-citroen-c3 et -c3-2 (générations antérieures à 2015)

## Contradictions
Aucune entre sources exploitables. Les anciennes périodicités PureTech 82/Peugeot (feuillets forum-peugeot) diffèrent de celles du 110/130 Citroën, mais ne sont pas comparables (autres véhicules).

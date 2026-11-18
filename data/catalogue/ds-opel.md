# Groupe ds-opel : synthèse

21 enregistrements (111 opérations). Toutes les valeurs viennent de Haynes UK (plans par modèle et moteur, km / mois). Elles sont marquées `secondaire` : l'énumération du brief n'a pas de valeur pour Haynes, qui reprend les données constructeur. Aucun feuillet constructeur DS ou Opel n'a été trouvé.

## Couverts
- DS 3 Crossback : 1.2 PureTech 100 (EB2ADTD) et 130 (EB2ADTS).
- DS 7 Crossback : 1.2 PureTech 130, 1.6 PureTech 180 (EP6FADTXD), 1.6 PureTech 225 (EP6FADTX), 1.5 BlueHDi 130 (DV5RC).
- DS 4 (1re génération, 2015-2018) : 1.2 THP (EB2DTS), 1.6 THP (EP6CDTM), 1.6 BlueHDi (DV6FC).
- Opel Corsa F : 1.2 75, 1.2 Turbo 100, 1.2 Turbo 130 (huile non confirmée, donc `null`), 1.5 CDTi 100.
- Opel Corsa E : 1.0 Turbo 115, 1.0 Turbo 90, 1.3 CDTi.
- Opel Crossland X : 1.2 MPFi (désignation Haynes).
- Opel Mokka B : 1.2 Turbo 100, 1.2 Turbo 130, 1.5 BlueHDi, Hybrid 136 48V.

## Non couverts, et pourquoi
- DS 3 Crossback BlueHDi 100 / 130 et E-Tense : la page Haynes lue est tronquée, ces moteurs n'y apparaissent pas. Le feuillet constructeur n'a pas été trouvé.
- DS 7 BlueHDi 180 (2.0) et E-Tense 225 / 4x4 300 : absents de la partie lisible de la page Haynes.
- DS 4 (2021+, 2e génération) : pas de page Haynes ; aucune source constructeur trouvée.
- Opel Corsa-e et Mokka-e : aucun plan trouvé (Haynes n'a pas de page dédiée, la notice Opel ne contient pas d'intervalles).
- Opel Corsa E : variantes GPL, 1.2 et 1.4 atmosphériques non reprises. Crossland (1.2 Turbo 110 / 130, 1.5 diesel) : non lus.
- Aucune valeur de boîte de vitesses (huile, BVA/EAT8), de filtre à carburant diesel, de batterie traction ni de liquide de refroidissement : absentes de la partie lisible des sources. Le liquide de refroidissement n'apparaît que comme contrôle, pas comme remplacement.
- Valeurs « sévère » : Haynes ne donne pas de chiffres (« plus fréquent »), donc `severeKm` et `severeMonths` sont `null` partout.
- Boîte de vitesses : `null` partout, car les pages Haynes ne la précisent pas.

## Sources
- https://uk.haynes.com/pages/maintenance-plans-car-ds-ds3-crossback-2019-2025
- https://uk.haynes.com/pages/maintenance-plans-car-ds-ds7-crossback-2017-2025
- https://uk.haynes.com/pages/maintenance-plans-car-ds-ds4-2015-2018
- https://uk.haynes.com/pages/maintenance-plans-car-opel-corsa-f-2019-2025
- https://uk.haynes.com/de/pages/maintenance-plans-car-opel-corsa-e-2015-2020
- https://uk.haynes.com/pages/maintenance-plans-car-opel-crossland-x-2017-2025
- https://uk.haynes.com/pages/maintenance-plans-car-opel-mokka-2020-2025
- Consultés sans valeurs retenues : notice Opel Corsa F (public-servicebox.opel.com), qui renvoie au carnet d'entretien et ne contient pas d'intervalles ; notice Opel Mokka B, idem.

## Décision sur les feuillets Peugeot
Les feuillets forum-peugeot.com (208 P21E, 3008, 5008, etc.) existent, mais ils décrivent des Peugeot. Je ne les ai pas utilisés pour DS ou Opel, car le brief interdit toute extrapolation. Recoupement : le 1.2 PureTech 100 de la 208 (feuillet constructeur : filtre à air 40 000 km / 4 ans, bougies 40 000 km / 4 ans, courroie 100 000 km / 6 ans puis 200 000 km / 12 ans) est identique à ce que Haynes donne pour la DS 3 Crossback. Ce recoupement ne remplace pas une source DS.

## Doutes et contradictions
- Les périodes Haynes dépendent de la date de production (changement au 03/10/2019 pour les PureTech : 25 000 à 20 000 km, filtre à air et bougies 50 000 à 40 000 km). Les enregistrements reprennent la période la plus récente applicable ; l'ancienne figure dans `note` quand elle a été lue.
- Filtre d'habitacle du 1.2 PureTech 130 : 40 000 km / 24 mois sur la page DS 7, 20 000 km / 12 mois sur la page DS 3 Crossback. Non tranché.
- DS 7 1.6 PureTech 180 : seule la période jusqu'au 31/05/2018 a été lue ; les périodes suivantes peuvent différer.
- DS 4 1.6 THP : bougies tous les 20 000 km / 12 mois, valeur inhabituellement courte.
- Crossland X : Haynes nomme le moteur « 1.2 MPFi (D12XE) », sans lien établi avec les appellations PureTech. Le filtre d'habitacle a été omis, car le tableau alterne 20 000 km / 12 mois et 40 000 km / 24 mois sans trancher.
- Les pages Haynes sont longues et n'ont été lues que via WebFetch, qui a tronqué ou résumé certaines parties. Les chiffres sont à revalider sur les pages avant import, surtout DS 7 et DS 4.

# Dacia - synthèse

## Couvert (11 enregistrements, tous `secondaire`, source Haynes UK)
- Sandero III : 1.0 SCe 65, 1.0 TCe 90, 1.0 TCe 100 Eco-G.
- Sandero II : 0.9 TCe 90 (avant et après le 15/02/2019), 0.9 TCe 90 GPL, 1.0 SCe 75 (B4D-400).
- Duster II : 1.3 TCe 130, 1.3 TCe 150, 1.0 TCe 100 Eco-G, 1.5 dCi 110 (K9K-656 E06T, après le 15/02/2019).
- Opérations : révision, filtre d'habitacle, filtre à air, bougies, liquide de frein uniquement.

## Non couvert et pourquoi
- Sandero II 1.0 TCe 100 et 1.5 dCi 90, Sandero Stepway, Duster III (Hybrid 140/150, TCe, Eco-G), Logan, Jogger, Spring, Lodgy/Dokker : aucune donnée par moteur obtenue. Les pages Haynes ont été tronquées ou ne donnent que des fourchettes génériques. Rien n'a été extrapolé depuis un autre modèle.
- Courroie/kit de distribution, filtre à carburant diesel, liquide de refroidissement, huile de boîte, FAP, batterie traction : absents ou « See selector » dans Haynes, donc non renseignés (aucune valeur inventée).
- Aucune valeur de boîte (`gearbox` = null) : Haynes ne distingue pas.
- Pas de plan constructeur : le PDF dacia.fr « Contrats de services VN Dacia thermique » ne contient aucune périodicité (durée de contrat 36-72 mois uniquement). Les PDF de contrats électriques n'en donnent pas non plus (extraits de recherche seulement).
- idGarages « carnet d'entretien » Dacia Sandero / Duster / Logan : ne couvrent que des générations antérieures à 2015 (Sandero I 2008-2012, Duster I 2010-2013), donc hors périmètre.

## Sources
- https://uk.haynes.com/pages/maintenance-plans-car-dacia-sandero-iii-2021-2025
- https://uk.haynes.com/pages/maintenance-plans-car-dacia-sandero-ii-2011-2025
- https://uk.haynes.com/pages/maintenance-plans-car-dacia-duster-ii-2018-2025
- Consultées sans valeur retenue : https://uk.haynes.com/pages/maintenance-plans-car-dacia (fourchettes génériques), https://cdn.group.renault.com/dac/fr/contrats-et-services/Contrats%20de%20services%20VN%20Dacia%20thermique-V14.pdf.asset.pdf/7cd3251ae7.pdf, idGarages (Sandero, Duster).

## Doutes et contradictions
- `confidence` : Haynes n'est pas un document constructeur ; classé `secondaire`.
- Entretien A/B : deux lectures de la même page Haynes (huile+filtre marqués aux deux entretiens, ou symbole différent en A et B, légende illisible). Valeur retenue : 30 000 km / 24 mois pour la révision, à confirmer avec le carnet constructeur.
- Liquide de frein Sandero III : 120 000 km / 36 mois avant 2022, 36 mois seul dès 01/01/2022 ; la valeur km est reportée avec la précision en note. Duster II 1.3 TCe : 48 mois (H5H-470) contre 36 mois (H5H-490).
- La page Haynes Duster II liste aussi 1.0 TCe 90 et 1.2 TCe 125, motorisations douteuses pour Duster II : écartées. Haynes cite parfois « TCe 95 » pour H4D-480.
- Années : reprises de la plage Haynes, pas des dates de commercialisation exactes.
- Pages Haynes lues via résumé WebFetch (pages tronquées) : chiffres à revérifier sur la source.

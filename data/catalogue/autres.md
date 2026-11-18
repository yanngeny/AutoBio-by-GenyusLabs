# Groupe `autres` : synthèse

Recherche arrêtée volontairement après ~15 requêtes (budget raisonnable). Ordre suivi : Fiat, Ford, Hyundai, Nissan, Suzuki, Tesla ; Mini, BMW, Mercedes non traités.

## Couvert (4 enregistrements)
- Tesla Model 3, électrique, toutes versions (manuel du conducteur fr_be, constructeur). Le manuel ne distingue pas les versions ; année de publication du manuel non précisée.
- Tesla Model Y, électrique, toutes versions (manuel du conducteur fr_fr Europe, version 2025+, constructeur). Les filtres HEPA/charbon (3 ans) dépendent de l'équipement.
- Ford Puma 1.0 EcoBoost (M0JA) et Ford Puma 1.0 EcoBoost mHEV 48V (Q0JA), via Haynes UK (secondaire). Valeurs : huile 30 000 km / 24 mois, filtre à air et bougies 60 000 km / 48 mois, liquide de frein 24 mois. Courroie, filtre d'habitacle, liquide de refroidissement et huile de boîte non lus : mis à null / non confirmés. Les variantes 125 ch / 155 ch / Flexifuel ne sont pas distinguées par Haynes dans la partie lue.

## Non couvert et pourquoi
- Fiat 500 (1.0 Hybrid, 500e), Fiat Panda III : aucune source admissible. Fiat France n'a rien donné d'exploitable ; le manuel Panda trouvé sur manualslib (page 132) n'indique ni marché ni édition (règle 1 non vérifiable) et son tableau est illisible hors courroie (120 000 km / 6 ans, sévère 60 000 km / 4 ans, 1.2 8V) et liquide de frein (2 ans). Non retenu dans le JSON.
- Ford Fiesta VII, Focus IV, Puma (diesel, ST) : Haynes Fiesta = tableau générique sans valeurs par moteur ; annexe Ford France (déc. 2022) listant Fiesta mHEV et Focus mais colonnes d'intervalles illisibles. Une URL Haynes par moteur a été refusée (approbation requise), sans contournement.
- Hyundai Kona (essence, hybride, électrique) : seules des pages génériques VE (Hyundai BE/FR : 15 000 ou 30 000 km / 1 ou 2 ans ; filtre d'habitacle 30 000 km ou 2 ans) non spécifiques au moteur ; carnet Kona non trouvé.
- Nissan Qashqai II/III : Haynes UK = valeurs génériques (fourchettes) seulement ; le plan Nissan trouvé est sud-africain (interdit). Non retenu.
- Suzuki Swift, Mini F55/F56, BMW X1 et Série 1, Mercedes Classe A : aucune source admissible trouvée (Suzuki) ou non recherché (Mini, BMW, Mercedes, par limite de budget).

## Contradictions
- Puma : Haynes (Ford Technical Service) donne l'huile à 30 000 km / 24 mois ; Ford France (annexe ST 2022 012) et idGarages indiquent révision annuelle / 15 000 km. Colonnes du PDF Ford illisibles, donc non tranché.
- Tesla : le forum blogtesla.fr cite « 2 ans » pour le liquide de frein, le manuel constructeur dit 4 ans (retenu). Source forum non utilisée.
- Panda : ad.fr donne 120 000 km / 5 ans pour la courroie, le manuel (marché inconnu) 6 ans. Non retenu.

## Sources utilisées
- https://www.tesla.com/ownersmanual/model3/fr_be/GUID-E95DAAD9-646E-4249-9930-B109ED7B1D91.html
- https://www.tesla.com/ownersmanual/modely/fr_fr/GUID-E95DAAD9-646E-4249-9930-B109ED7B1D91.html
- https://uk.haynes.com/pages/maintenance-plans-car-ford-puma-2020-2025
- https://www.ford.fr/content/dam/guxeu/fr/owners/service-and-maintenance/entreiten-reparations/Annexe-1-ST-2022-012-Intervalles-d%E2%80%99entretien-gamme-Ford%E2%80%93D%C3%A9cembre-2022.pdf (consulté, illisible)
- Consultés sans exploitation : Haynes UK Fiesta et Qashqai (génériques), manualslib Panda, idGarages Puma (recoupement), pages Hyundai BE/FR génériques.

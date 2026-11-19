# Groupe eu2 : synthèse

36 enregistrements dans `eu2.json`. Tous sont en `confidence: "secondaire"` : la seule source exploitable obtenue est Haynes UK (plans par moteur, qui reprennent les données constructeur), pas un carnet ou une notice constructeur.

## Couvert (Haynes UK, valeurs en km / mois)
- Skoda Octavia IV (2020-2025) : 1.0 TSI e-TEC DLAA, 1.5 eTSI DFYA, 1.5 TSI DPCA, 2.0 TDI DSTB et DSUD (DSUD : tableau tronqué).
- Skoda Karoq (2017-2025) : 1.0 TSI CHZJ, DKRF (avant 2020 et 2021+), DLAA ; 1.5 TSI DADA (partiel, vidange non lisible).
- Skoda Fabia III : 1.0 MPI CHYA, CHYB, CHYE (jusqu'en 2020 et 2021+), 1.0 TSI CHZB (partiel, filtre à air non lisible).
- Skoda Fabia IV (2022-2025) : 1.0 MPI DSGA et DSGD, 1.0 TSI DLAA et DLAC, 1.5 TSI DPCA (tronqué).
- Skoda Octavia III : 1.0 TSI CHZD et DKRF, 1.2 TSI CJZB.
- Ford Fiesta VII : 1.0 EcoBoost B7JA et B7JC.
- Ford Focus IV : 1.0 EcoBoost B3DA et B7DA.
- Ford Kuga II : 1.5 EcoBoost (10 codes regroupés en un enregistrement).
- Ford Kuga III : 1.5 EcoBlue ZTDA, BVM (2 périodes) et BVA (2 périodes).
- Dacia Lodgy : 1.2 TCe 115, 1.3 TCe 100, 1.3 TCe 130, 1.5 dCi 110 (avant 02/2019).

## Non couvert
- **Fiat 500 / 500e, Panda III, 500X** : aucun plan constructeur ou Haynes trouvé. La page Haynes « maintenance-plans-car-fiat » n'était pas dans les résultats de recherche. Son WebFetch a demandé une autorisation restée sans réponse, donc je ne l'ai pas relancé. idGarages n'a rendu que la Panda II. Les blogs et sites de pièces sont exclus par le brief.
- **Seat Ibiza V, Leon III/IV** : même cause (page Haynes Seat non vue dans les résultats, WebFetch bloqué). Haynes propose seulement des manuels, pas de plan par moteur dans les résultats. Les plans VAG de Skoda sont proches mais je ne les ai pas transposés, ce serait extrapoler.
- **Dacia Spring, Jogger** : pas de page Haynes. Indices non exploitables : carwiki.de (Allemagne) donne 12 mois pour le Jogger, et la presse (La Tribune Auto) parle d'« une visite annuelle ou 20 000 km », sans plan par moteur.
- **Dacia Logan II/III** : la page Haynes est générique (air 30 000 à 60 000 km, etc.), sans plan par moteur, donc non utilisable. Le Logan idGarages est trop ancien et ambigu.
- **Ford Focus IV, Kuga III, Fiesta VII** : diesel EcoBlue (Focus), 2.0 EcoBlue, hybrides FHEV/PHEV (Kuga) et variantes E85/E100/48 V (Fiesta) non lus. Les pages Haynes sont tronquées à 100 000 caractères et seules les premières sections sont lisibles.
- **Skoda** : Fabia III 1.2 TSI, 1.4 TDI ; Octavia III 1.4/1.5 TSI, 1.6 et 2.0 TDI ; Karoq diesel et DSG : sections hors de la fenêtre lue.
- Absents de tous les enregistrements parce que non listés dans la source : filtre à carburant diesel, courroie d'accessoires, huile de boîte, liquide de refroidissement (la source ne donne qu'un contrôle, pas de remplacement). Courroie de distribution : « aucune période recommandée » sur les TSI/MPI Skoda, enregistrée avec valeurs `null`.

## Contradictions et doutes
- Haynes donne des intervalles fixes (Skoda 15 000 km/12 mois) alors que le constructeur propose aussi le LongLife (30 000 km/2 ans), non modélisé ici.
- Fiesta VII et Focus IV : Haynes donne 30 000 km/24 mois au témoin d'entretien. Dacia annonce 20 000 km/1 an en général, mais ces valeurs concernent d'autres modèles.
- Lodgy : le 1.2 TCe est libellé « -LPG » par Haynes (ambigu). Liquide de frein à « 120 000 km/48 mois » ou « 36 mois », recopié tel quel mais peu plausible : à vérifier au carnet. Usage > 15 000 km/an : 30 000 km/12 mois, mis en note.
- Kuga III BVA : 24/09/2020 marque un changement de plan (20 000 km/12 mois, courroie 192 000 km, puis 30 000 km/24 mois, courroie 180 000 km).
- Kuga II : Haynes regroupe les codes moteur, la puissance (120/150/182 ch) n'est pas distinguée. Valeur de courroie de distribution lue sur les premiers codes (M9ME tronqué).
- Champ `years` : plages Haynes, parfois antérieures à 2015 (Kuga II, Lodgy) ou au format mm/aaaa (Kuga III).

## Sources
- Haynes UK, pages « Maintenance Plans » : Skoda Octavia IV 2020-2025, Octavia III 2013-2020, Karoq 2017-2025, Fabia III 2015-2023, Fabia IV 2022-2025 ; Ford Fiesta Mk VII 2016-2025, Focus MK IV 2019-2025, Kuga 2013-2020, Kuga 2019-2025 ; Dacia Lodgy 2012-2025. Toutes sous https://uk.haynes.com/pages/maintenance-plans-car-<modèle>.
- Pages consultées sans exploitation : Haynes Dacia (index) et Logan, idGarages Panda/Logan/Sandero, carwiki.de Jogger, La Tribune Auto.

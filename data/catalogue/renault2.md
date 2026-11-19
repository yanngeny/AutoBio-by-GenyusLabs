# renault2 : synthèse (Renault, groupe 2)

## Couvert (25 enregistrements, tous `secondaire`)
Source unique exploitable : Haynes France (RTA, fr-rta.haynes.com), pages « Carnet d'entretien » par génération et moteur.
- Clio IV : 0.9 TCe 76, 0.9 TCe 90, 1.2 16V 75, 1.2 TCe 120, 1.5 dCi 75, 1.5 dCi 90, 1.5 dCi 110.
- Captur I : 0.9 TCe 90, 1.2 TCe 120, 1.3 TCe 130 Energy.
- Twingo III : 0.9 TCe 90, 0.9 TCe 110 (révision, bougies, liquide de frein seulement).
- Mégane IV : 1.2 TCe 100/130, 1.3 TCe 100/115/140/160/165, 1.5 dCi 110.
- Scénic IV : 1.2 TCe 115/135, 1.3 TCe 115/140/160.

Haynes n'est pas un document constructeur : j'ai donc mis `secondaire` partout, aucun enregistrement n'est `constructeur`.

## Non couvert, et pourquoi
- Captur II, Zoé (toutes batteries), Twingo Electric, Arkana, Austral : aucune valeur par moteur confirmée. Les pages renault.fr trouvées ne donnent que « révision annuelle ou tous les 30 000 km » sans détail, et la notice Clio IV n'a pas le chapitre entretien exploitable. La page Haynes Captur II n'a pas pu être lue (WebFetch a refusé l'URL non issue d'une recherche, je me suis arrêté sans contourner). Pages Haynes Zoé, Arkana et Austral : non trouvées par la recherche. Les autres résultats étaient des blogs de pièces (interdits), des forums et goodmecano (hors liste).
- Mégane IV et Scénic IV diesel (hors Mégane dCi 110) et Scénic dCi : pages Haynes tronquées avant ces moteurs, non lues.
- Captur I diesel (dCi 90/110) : hors de la portion lue. Twingo III SCe : hors de la portion lue (page tronquée).
- Variantes GPL non enregistrées (Clio IV, Captur I, Mégane IV).
- Pas de valeur « sévère », de filtre à carburant, d'huile de boîte, de courroie d'accessoires ni de liquide de refroidissement : absents de Haynes pour ces moteurs. Le liquide de refroidissement n'y a qu'un contrôle, sans périodicité de remplacement.
- Boîtes de vitesses : `gearbox` à null, Haynes ne les distingue pas.

## Doutes et contradictions
- Les pages ont été lues via WebFetch (résumé automatique, pages Haynes longues et tronquées) : relire les chiffres avant import.
- Clio IV 1.2 16V (D4F) : Haynes indique une courroie 150 000 km/72 mois, mais ce moteur est réputé à chaîne. Valeur non retenue (op « Autre » avec null).
- Révision : Haynes donne 30 000 km/24 mois (≤ 15 000 km/an) ou 30 000 km/12 mois (> 15 000 km/an), alors que renault.fr dit « révision annuelle ou tous les 30 000 km ». J'ai retenu 24 mois (note explicative). La notice Clio IV montre un exemple d'affichage « Vidange dans 30 000 Kms / 24 mois », cohérent.
- Liquide de frein : Haynes 120 000 km/36 mois ; renault.fr/entretien/freins parle de « 4 ans ou 120 000 km » (page générique non spécifique au modèle). Haynes retenu.
- Haynes dCi 110 : courroie 150 000 km/72 mois, 140 000/72 pour code E06S (intervalles 20 000 km/12 mois) ; le code E06S n'est pas modélisable ici, il figure en note.
- Twingo III : intervalle de base 20 000 km/12 mois ; le tableau Haynes a des incohérences (km/mois), d'où l'absence des filtres. Captur I 1.3 TCe 130 : bougies 90 000 km/48 mois (contre 60 000 pour les autres essences).
- Haynes pourrait avoir un Blue dCi 95 (K9K-872) sur la page Mégane IV (intervalles 25 000 km pour E06U) : attribution douteuse, non retenu.

## Sources
- https://fr-rta.haynes.com/pages/carnet-entretien-auto-renault-clio-iv-2012-2019
- https://fr-rta.haynes.com/pages/carnet-entretien-auto-renault-captur-2013-2020
- https://fr-rta.haynes.com/pages/carnet-entretien-auto-renault-twingo-iii-2014-2025
- https://fr-rta.haynes.com/pages/carnet-entretien-auto-renault-megane-iv-2016-2025
- https://fr-rta.haynes.com/pages/carnet-entretien-auto-renault-scenic-iv-grand-scenic-2016-2025
- Consultées sans valeur exploitable : renault.fr/entretien/entretien-e-tech.html, renault.fr/faq-vehicules/nouvelle-clio/calendrier-maintenance.html, renault.fr/entretien/freins.html, notice Clio IV (user-manual.renault.com).

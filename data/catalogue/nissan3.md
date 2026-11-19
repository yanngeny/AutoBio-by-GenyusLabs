# nissan3 : synthèse

Limite appliquée : générations commercialisées depuis 2010 (exception au brief). 10 enregistrements, tous `secondaire` (Haynes UK). Aucun plan constructeur Nissan Europe n'a pu être lu.

## Couvert (partiel)
- NV200 / Evalia : 1.5 dCi K9K, K9K-892, K9K-276 ; 1.6 HR16DE (essence).
- Qashqai / Qashqai+2 J10 : 1.5 dCi K9K, deux tableaux Haynes distincts.
- Navara D40 : 2.5 dCi YD25DDTi Euro 4 et Euro 5 (02/2010 -).
- 370Z : V6 VQ37VHR et Nismo. GT-R : aucun plan Europe trouvé.

## Non couvert et pourquoi
- Leaf ZE0 (24/30 kWh) et ZE1 (40/62 kWh), e-NV200, Ariya : pas de page Haynes UK. Le manuel Nissan France Leaf ZE1 2023 (nissan.fr) renvoie les intervalles au « Carnet d'entretien et de garantie » (non en ligne) et la page de changement du liquide de refroidissement ne donne aucun intervalle. Le livret de garantie VE de Nissan UK a des tableaux d'entretien vides (placeholders). Les seuls tableaux chiffrés trouvés viennent d'Afrique du Sud, Nouvelle-Zélande, Canada ou États-Unis : écartés (règle 1). Donc aucun `Batterie traction : contrôle` ni `Liquide de refroidissement batterie`.
- Navara D23 / NP300 2.5 dCi : le tableau 2.5 n'apparaît pas dans la page Haynes lisible. Le 2.3 dCi (YS23DDT/YS23DDTT) était lisible mais hors périmètre demandé et non saisi.
- Qashqai+2 essence et dCi 1.6/2.0 : sections absentes de la partie lue de la page Haynes (tronquée à 100 000 caractères).
- idGarages : une page carnet d'entretien Leaf n'a pas pu être récupérée (accès refusé, non réessayé). Les pages idGarages Leaf trouvées renvoient au carnet constructeur sans chiffres.

## Sources utilisées
- https://uk.haynes.com/pages/maintenance-plans-car-nissan-nv200-evalia-2010-2022
- https://uk.haynes.com/pages/maintenance-plans-car-nissan-qashqai-2007-2013
- https://uk.haynes.com/pages/maintenance-plans-car-nissan-navara-2004-2016
- https://uk.haynes.com/pages/maintenance-plans-car-nissan-370z-2009-2021
- Consultées sans valeur exploitable : manuel Nissan France Leaf 2023, livret garantie Nissan UK.

## Contradictions et doutes
- Qashqai J10 K9K : Haynes présente un tableau 30 000 km / 12 mois (courroie 150 000 km / 72 mois) et un tableau 20 000 km / 12 mois (courroie 160 000 km / 72 mois) sans dire à quelle version ils correspondent ; les deux sont donc saisis séparément. Page ne mentionnant pas le Qashqai+2.
- Haynes fait varier les intervalles de la courroie du K9K (NV200 : 150 000/72 ou 120 000/60 selon code moteur).
- Valeurs « filtre d'habitacle » et parfois « liquide de frein » lues dans les cases cochées des tableaux (pas de ligne dédiée) : signalé dans `note`. Liquide de frein laissé absent pour NV200 K9K et K9K-276, Qashqai tableau 20 000 km, Navara Euro 5.
- Les conditions sévères ne sont pas distinguées par Haynes : `severeKm`/`severeMonths` null partout. Le tableau 370Z > 30 000 km/an (km seuls) n'est pas saisi.
- Les années par moteur sont celles du titre de page Haynes (NV200, 370Z) ou approximatives (Qashqai+2 2008-2014 : commercialisation indiquée par la plage 2007-2013 Haynes ; à vérifier).

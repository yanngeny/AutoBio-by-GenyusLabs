# Peugeot : synthèse de recherche (groupe `peugeot`)

20 enregistrements dans `peugeot.json`, tous au niveau `constructeur`. La source est le feuillet « Plan d'entretien » Peugeot (copie hébergée sur forum-peugeot.com), un par moteur et par boîte. Les PureTech essence étaient déjà faits et n'ont pas été refaits.

## Couverts
| Modèle | Moteurs / boîtes |
|---|---|
| 208 II (P21E) | 1.5 BlueHDi 100 BVM6 |
| 3008 II (P84) | 1.6 BlueHDi 100 BVM5 ; 1.6 BlueHDi 120 EAT6 ; 1.5 BlueHDi 130 BVM6 ; 1.5 BlueHDi 130 EAT8 ; 2.0 BlueHDi 150 BVM6 |
| 5008 II (P87) | 1.6 BlueHDi 100 BVM5 ; 1.6 BlueHDi 120 BVM6 ; 1.6 BlueHDi 120 BVM6 « BC » ; 1.6 BlueHDi 120 EAT6 ; 1.5 BlueHDi 130 BVM6 ; 1.5 BlueHDi 130 EAT8 ; 2.0 BlueHDi 150 BVM6 ; 2.0 BlueHDi 180 EAT6 |
| 308 II (T9) | 1.5 BlueHDi 100 BVM6 ; 1.6 BlueHDi 120 BVM6 ; 1.5 BlueHDi 130 BVM6 ; 2.0 BlueHDi 150 BVM6 ; 2.0 BlueHDi 180 EAT6 ; 2.0 BlueHDi 180 EAT8 |

## Non couverts, et pourquoi
- **e-208 (électrique)** : le plan « motorisation électrique 100 kW » existe sur forum-peugeot.com, mais la page qui le référence (`/modeles/peugeot-e-208/...`) est refusée par WebFetch (client_error) et le PDF n'apparaît dans aucun résultat de recherche. Je n'ai pas contourné ni deviné d'URL. Les seuls éléments trouvés sont des messages de forum (premier entretien 1 an / 12 500 km, puis 2 ans / 25 000 km ; filtre d'habitacle, liquide de frein, pH du liquide de refroidissement batterie). Ce ne sont pas des sources autorisées, donc rien n'est saisi.
- **2008 II (P24)** : aucun feuillet par moteur retrouvé. Les feuillets `planentretien2008bluehdi*` sont ceux du 2008 I (1.6 BlueHDi, 2013-2019), hors périmètre. Haynes UK n'affiche que des fourchettes génériques, les intervalles par moteur sont dans un sélecteur non accessible. Rien de saisi.
- **308 III (P51)** : les plans 1.2 PT, 1.5 BlueHDi 130 BVM/EAT et PHEV sont uniquement en pièces jointes d'un fil du forum, sans URL exploitable. Non couvert.
- **108** : modèle essence uniquement (1.0 VTi 72, ex-PureTech 82). La page des plans est refusée par WebFetch et aucun PDF n'est ressorti. Non couvert.
- **3008 II** : plans non récupérés pour 1.6 BlueHDi 120 BVM6 (et sa variante BC) et 2.0 BlueHDi 180 (EAT6 / EAT8). Les PDF existent probablement mais n'ont pas été retrouvés.
- **308 (T9)** : plans 1.5 BlueHDi 130 EAT6 et EAT8 listés sur le site mais URL non retrouvées. Le fil du forum renvoie vers le feuillet 3008 pour le 130 EAT8 (voir doutes).
- **208 II diesel** : un seul feuillet (BlueHDi 100 BVM6). Il ne contient que la colonne « normal », donc `severeKm` et `severeMonths` sont `null`.
- **Hybrides rechargeables** (3008 / 308 / 5008 PHEV) : hors du périmètre demandé.

## Doutes et contradictions
- **Ancienneté des feuillets** : les feuillets 3008 / 5008 / 308 datent de 2016-2017. Un fil du forum indique que Peugeot a depuis revu certains plans (par exemple nouvelle huile 5W30 sur le 1.5 BlueHDi), et que le plan à jour s'obtient via le VIN. Les valeurs sont celles du feuillet, pas forcément celles d'aujourd'hui.
- **3008 2.0 BlueHDi 150** : le feuillet donne le filtre d'habitacle à 30 000 km en normal et 40 000 km en sévère (inversé). Les autres plans 2.0 donnent 60 000 / 40 000. Valeur recopiée telle quelle avec une note.
- **Kit de distribution 2.0 BlueHDi 150** : 150 000 km (normal) / 140 000 km (sévère) sur 3008 et 5008, mais 180 000 km sur 308 T9, pour le même moteur. Chaque modèle suit son feuillet.
- **Kit de distribution 2.0 BlueHDi 180** : 150 000 / 140 000 km sur 5008 EAT6, mais 180 000 km sur 308 T9 EAT6 et EAT8.
- **Premier intervalle sévère différent** : sur les 1.6 BlueHDi, la première échéance sévère est plus tôt (pH : 120 000 au lieu de 125 000 km ; additif FAP : 90 000 au lieu de 100 000 km). Le format n'a qu'un seul `firstKm`, donc `firstKm` porte la valeur normale et la valeur sévère est dans `note`.
- **Libellés** : le contrôle du pH, le contrôle du niveau d'additif FAP, le kit de courroie d'accessoires, l'AdBlue et le réglage des projecteurs ne sont pas dans le vocabulaire du brief, d'où `Autre : ...`. Le contrôle du colmatage du FAP est saisi sous `Filtre à particules : contrôle`.
- **Données non saisies** : les feuillets ne contiennent ni bougies (diesel), ni huile de boîte, ni liquide de refroidissement à remplacer (seulement un contrôle du pH). Rien n'a été ajouté.
- **Coquilles dans la source** : l'huile est imprimée « 00W30 B71 2312 (C1C2) », probablement 0W30. Elle n'est pas reprise dans le JSON.
- **Variante « BC »** du 5008 1.6 BlueHDi 120 BVM6 : le feuillet ne dit pas ce que signifie BC. Ses valeurs sont identiques au BVM6 standard.
- **Années** : `years` indique la génération (3008 II, 5008 II, 308 T9), pas la plage exacte du moteur. Pour la 208 II, la plage de fin n'est pas confirmée, d'où `2019-`.
- **Accessoires et AdBlue** : le remplissage d'AdBlue n'est saisi que quand il figure dans le texte récupéré (308 T9 120, 150, 180). Il n'apparaît pas dans les extraits 3008 / 5008, ce qui ne prouve pas son absence.

## Sources utilisées
Tous les fichiers sont sous `https://www.forum-peugeot.com/wp-content/uploads/` :
- 2020/05/planentretien208bluehdi100bvm6.pdf
- 2016/09/planentretien3008hdi100.pdf
- 2016/09/planentretien3008bluehdi120eat.pdf
- 2016/06/planentretien3008bluehdi130bvm.pdf
- 2016/06/planentretien3008hdi130eat8.pdf
- 2016/09/planentretien3008bluehdi150.pdf
- 2017/03/planentretien5008bluehdi100bvm5.pdf
- 2017/03/planentretien5008bluehdi120bvm6.pdf
- 2017/03/planentretien5008bluehdi120bvm6bc.pdf
- 2017/03/planentretien5008bluehdi120eat6.pdf
- 2017/03/planentretien5008hdi130bvm6.pdf
- 2017/03/planentretien5008hdi130eat8.pdf
- 2017/03/planentretien5008bluehdi150bvm6.pdf
- 2017/03/planentretien5008bluehdi180eat6.pdf
- 2016/09/planentretien308hdi100bvm6.pdf
- 2016/08/planentretien308bluehdi120.pdf
- 2016/09/planentretien308bluehdi130bvm6.pdf
- 2016/08/planentretien308bluehdi150.pdf
- 2016/09/planentretien308gt180.pdf
- 2016/09/planentretien308hdi180eat8.pdf

Consultée sans valeur retenue : Haynes UK, page maintenance 2008 (https://uk.haynes.com/pages/maintenance-plans-car-peugeot-2008), sans intervalles par moteur.

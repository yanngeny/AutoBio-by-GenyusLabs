# Groupe asia2 : synthèse

Résultat partiel : 13 enregistrements (modèle x moteur) sur une liste d'environ 19 modèles. Seules les valeurs lues dans une source conforme au brief ont été saisies ; le reste est absent plutôt qu'extrapolé.

## Couvert
| Modèle | Moteurs | Source principale |
|---|---|---|
| Kia Ceed III (CD) 2018+ | 1.0 T-GDi, 1.5 T-GDi, 1.6 T-GDi, 1.6 CRDi (D1.6 MHEV) | Manuel Kia FR 2024 (code CD), tableau Europe, normal + sévère |
| Kia Sportage V (NQ5) 2021+ | 1.6 T-GDi HEV, 1.6 T-GDi PHEV | Manuel Kia FR 2024 (code NQ5SH), Europe |
| Kia Niro II (SG2) 2022+ | 1.6 GDi HEV, 1.6 GDi PHEV | Manuel Kia FR 2023 (code SG2), Europe |
| Kia Picanto III (JA) 2017-2025 | 1.0 MPi (G3LD), 1.0 T-GDi (G3LC), 1.2 MPi (G4LF AMT) | Kia Belgique (vidange) + Haynes UK (reste, `secondaire`) |
| Hyundai Kona II (SX2) 2023+ | essence/MHEV, programme Europe commun | Manuel Hyundai 2026 (code SX2), Europe |
| Hyundai Tucson IV (NX4) 2021+ | 1.6 T-GDi, vidange uniquement | Manuel Hyundai 2025 (code NX4), Europe |

## Non couvert, et pourquoi
Aucune valeur exploitable trouvée dans une source autorisée, ou source inaccessible :
- **Hyundai** i10, i20, Tucson III, Kona I (OS) : Haynes UK ne montre pas les tableaux par moteur (sélecteur interactif absent du texte récupéré) ; idGarages ne documente que des générations antérieures à 2015.
- **Kia** Ceed I/II, Sportage IV, Niro I, Stonic : le PDF Kia Belgique 01/2024 donne des intervalles par carburant mais, dans le texte récupéré, sans lien fiable ligne/modèle (hors Picanto). Pas de manuel identifié avec certitude pour ces codes. Niro II électrique non repris : le PDF ne nomme pas le modèle de la ligne « EV 30.000 km / 24 mois ».
- **Nissan** Micra K14, Juke, Qashqai II/III, Leaf : seuls des blogs, idGarages (Qashqai I uniquement) ou des sites hors Europe de l'ouest (Nouvelle-Zélande, Afrique du Sud) remontent ; le manuel Nissan Irlande renvoie à un carnet non en ligne. Rien d'ajouté. Haynes UK liste les moteurs Qashqai mais pas les intervalles dans le texte récupéré.
- **Mini Cooper F56** : plan à intervalles flexibles (Condition Based Service), pas de valeur fixe constructeur trouvée. Les tableaux repérés (blog usro.net, carwiki.de) sont tiers/non constructeur.
- **Suzuki** Swift, Vitara : pas de plan constructeur européen accessible. carwiki.de (Allemagne) évoque 15 000 km / 12 mois jusqu'à la 5e génération et jusqu'à 20 000 km / 12 mois pour la 6e, mais c'est un site tiers, non utilisé.
- **Mazda** 2 et CX-5 : Haynes sans données par moteur ; le manuel Mazda en ligne (CX-5, marché EC) ne contenait pas le tableau dans le texte récupéré ; seules des sources canadiennes (interdites) donnaient des chiffres.

## Contraintes d'outil
Plusieurs URL construites à la main (Haynes Suzuki Swift, etc.) ont déclenché une demande d'autorisation restée sans réponse ; je n'ai pas insisté ni contourné. Les pages ont été lues via WebFetch, qui résume le contenu : certains tableaux étaient aplatis.

## Points d'attention et contradictions
1. **Identification du modèle par code de manuel** : les pages Kia ne citent pas le nom du modèle. CD = Ceed, NQ5 = Sportage V, SG2 = Niro II sont déduits du code dans l'URL (non écrit dans la page). À valider.
2. **Niro II (SG2) vs Sportage V (NQ5)** : bougies 150 000 km contre 75 000 km, liquide de refroidissement 1re fois 180 000 km / 120 mois contre 210 000 km / 120 mois. Les deux sont tels que recopiés ; à confirmer au carnet du véhicule. Le manuel SG2 couvre HEV et PHEV ; le Niro électrique n'est pas couvert.
3. **Ceed : « courroie de distribution »** : le manuel écrit « Courroies de distribution (moteur) » avec la note « courroie d'entraînement alternateur, pompe à eau, climatisation » ; c'est un contrôle (1re fois 90 000 km / 72 mois puis 30 000 km / 24 mois). Saisi sous `Courroie d'accessoires` avec mention « contrôle ». Le 1.0/1.5/1.6 T-GDi ont une chaîne (non traitée par le manuel). Pour le diesel D1.6, kit de distribution à 240 000 km (sans durée) et contrôle de courroie à 120 000 km.
4. **Picanto** : le 1.0 MPi, T-GDi et 1.2 sont distingués par Haynes (bougies 150 000 km MPi / 1.2, 75 000 km T-GDi). Haynes ne donne que des contrôles pour le liquide de refroidissement (aucun remplacement), d'où `null`. Le tableau G3LE (T-GDi plus récent) était tronqué dans la page : non saisi. Plage d'années « 2017-2025 » reprise du titre Haynes, pas d'année par moteur.
5. **Kona II** : la page est un programme Europe unique sans découpage par moteur ; l'intitulé du moteur le dit. Filtre d'habitacle et liquide de frein : valeurs déduites du pas du tableau (24 mois / 30 000 km), colonnes aplaties dans la page.
6. **Tucson IV** : seule la vidange est lisible (essence 15 000 km / 12 mois). Le diesel 2.0 n'est pas saisi : le tableau marque « R » à chaque colonne sans valeur chiffrée.
7. **Liquide de refroidissement batterie (PHEV)** : le manuel Kia indique le liquide de l'onduleur (60 000 km / 36 mois), pas celui de la batterie haute tension. Reporté avec cette précision dans la note.
8. **Sévère** : les valeurs sévères Kia (7 500 km / 6 mois pour les huiles essence, 10 000 km / 12 mois diesel) sont valables si l'une des conditions A à L s'applique ; ne pas les confondre avec le plan normal.

## Sources utilisées
- Kia, manuel du propriétaire FR 2024 (CD) : https://ownersmanual.kia.com/full_webhelp/CD/2024/fr_FR/topics/chapter9_4_1.html
- Kia, manuel du propriétaire FR 2024 (NQ5SH) : https://ownersmanual.kia.com/full_webhelp/NQ5SH/2024/fr_FR/topics/chapter9_4.html
- Kia, manuel du propriétaire FR 2023 (SG2) : https://ownersmanual.kia.com/full_webhelp/SG2/2023/fr_FR/topics/chapter8_4.html
- Kia Belgique, intervalles d'entretien 01/2024 : https://eu-www.kia.com/content/dam/kwcms/kme/be/assets/service/Onderhoudsintervallen-Entretien_Periodique-KIA-012024.pdf
- Haynes UK, Kia Picanto 2017-2025 (`secondaire`, programme OEM Europe, conditions normales) : https://uk.haynes.com/pages/maintenance-plans-car-kia-picanto-2017-2025
- Hyundai, manuel SX2 2026 (Europe) : https://ownersmanual.hyundai.com/full_webhelp/SX2/2026/en_GN/id6dbc7a219ea.html
- Hyundai, manuel NX4 2025 (Europe) : https://ownersmanual.hyundai.com/full_webhelp/NX4/2025/en_GN/id716a9627f96.html

Consultées sans valeur retenue : Haynes UK (Hyundai i10, Mazda CX-5, Mazda 2), idGarages (Hyundai i10, Nissan Qashqai : générations hors périmètre), owners-manual.mazda.com (CX-5, pas de tableau). Le site en .com des manuels Kia/Hyundai est le site constructeur mondial ; les pages utilisées sont les versions françaises ou européennes, en km et mois.

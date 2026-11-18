# AutoBio

*by GenyusLabs* — l’autobiographie de tes véhicules : entretiens, rappels, pleins, dépenses et documents.

Les données vivent dans **un seul document de travail JSON**, créé par l’appli et remplacé automatiquement à chaque modification. Pas de base de données : rien à perdre lors d’une mise à jour de l’appli.

Nom du fichier :

```
AutoBio_live-data.json
```

Il contient aussi une clé `_note` (en anglais) qui rappelle qu’il est créé par AutoBio et remplacé automatiquement.

## Stockage

Dans l'APK, tu choisis l'emplacement du document de travail avec le **sélecteur de fichiers d'Android** (storage access framework) : choisis « Drive » dans la liste pour le retrouver sur tous tes appareils, ou garde-le sur le téléphone. Aucune API Google, aucune configuration. Les photos et documents restent sur le téléphone.

Au premier lancement, l'appli demande **« As-tu déjà utilisé AutoBio ? »** : si oui, elle relie le document existant et retrouve toutes les données (nouveau téléphone, réinstallation).

Dans un navigateur (sans plugin), il n'y a pas de choix de fichier : les données restent dans le navigateur, avec copie manuelle et restauration depuis un fichier.

## Comment fonctionne la sauvegarde

- **À chaque modification**, l’appli remplace le document de travail 2,5 s plus tard.
- **Copie datée** : `AutoBio_backup_AAAA-MM-JJ.json`, mise à jour à chaque envoi, gardée sur le téléphone (14 jours).
- **Copies de sécurité** : `AutoBio_safety_…` avant une restauration, un remplacement ou un écrasement après conflit.
- **Copie manuelle** : Réglages › Télécharger une copie → `AutoBio_export_AAAA-MM-JJ.json`.
- **Erreur d'écriture** (fichier indisponible…) : les changements restent sur le téléphone, la pastille l'indique et l'appli réessaie toute seule.
- **Restaurer** : Réglages › Restaurer depuis un fichier .json (n’importe quel fichier créé par AutoBio).

## Google Agenda

Dans *Rappels*, chaque échéance a un bouton **Ajouter à l’agenda** : sur le web, il ouvre Google Agenda avec l’événement pré-rempli ; dans l’APK, il crée l’événement en un appui via le plugin natif. Aucune API ni autorisation Google Agenda. Les échéances en km sont converties en date estimée d’après ton rythme.

## Notifications

Réglages › Notifications des échéances. Dans l'APK, des notifications locales sont programmées à 9 h (quelques jours avant chaque échéance, puis le jour même), même appli fermée, et reprogrammées à chaque modification. Sur le web, elles s'affichent à l'ouverture de l'appli (un navigateur ne peut pas programmer d'envoi sans serveur).

## Plans d'entretien constructeur

Fiche véhicule › Plan d'entretien › **Charger un plan constructeur** (proposé automatiquement à la création d'un véhicule Audi). Catalogue : `js/catalog.js`, modèles Audi depuis 2019 par motorisation (essence, diesel, hybride rechargeable, sportive, électrique). Chaque opération indique sa source (Audi UK, programme d'étude Audi 438, calendrier Audi USA converti en km). Ce sont des repères : le carnet d'entretien du véhicule reste la référence.

## Pop-up agenda

Après un entretien lié au plan, la création d'une opération ou le changement d'une date de contrôle technique ou d'assurance, l'appli propose d'ajouter la prochaine échéance à l'agenda (date calculée avec l'intervalle du plan, ou estimée d'après les km). Désactivable dans Réglages.

## Lancer l’appli

```bash
python3 -m http.server 8080      # puis http://localhost:8080
```


## APK et releases

- `npm install` puis `npm run sync` : copie l'appli dans `www/` et synchronise le projet Android (`android/`, Capacitor).
- Plugins natifs en Java dans `android/app/src/main/java/com/genyuslabs/autobio/` : `AutoBioFilePlugin` (sélecteur de fichiers) et `AutoBioCalendarPlugin` (ouvre l'agenda avec l'événement pré-rempli).
- **Release** : `git tag v0.1.0 && git push origin v0.1.0` déclenche `.github/workflows/release.yml`, qui construit l'APK et le publie dans *Releases*.
- **Signature** : crée une clé une seule fois (`keytool -genkeypair -v -keystore autobio.keystore -alias autobio -keyalg RSA -keysize 2048 -validity 10000`), puis ajoute dans *Settings › Secrets and variables › Actions* : `KEYSTORE_BASE64` (`base64 -w0 autobio.keystore`), `KEYSTORE_PASSWORD`, `KEY_ALIAS` (`autobio`). Sans ces secrets, la release contient un APK de test (debug). Garde une copie de la clé hors de GitHub : sans elle, impossible de mettre à jour l'appli installée.

## Contrat des plugins natifs (APK)

- `AutoBioFile.pickFile({ mode: 'open' | 'create', name }) → { uri, name }`, `read({ uri }) → { content }`, `write({ uri, content })` : sélecteur de fichiers Android (Storage Access Framework).
- `AutoBioCalendar.addEvent({ title, start, end, notes, allDay }) : création d’un événement dans l’agenda du téléphone.

## Contenu

- `index.html`, `styles.css` : interface (thème clair/sombre automatique)
- `js/store.js` : données locales et calculs (consommation, rappels, totaux)
- `js/storage.js` : fichier choisi, file d’envoi, copies locales, restauration
- `js/agenda.js` : bouton « Ajouter à l’agenda »
- `js/notify.js` : notifications de rappels
- `js/catalog.js` : catalogue de plans d'entretien constructeur
- `js/blobs.js` : photos et documents locaux
- `js/ui.js` : écrans et actions
- `tests/e2e.js` : test de bout en bout avec plugins Android simulés (Playwright), sur un jeu de données fictif

## Format du document de travail

`{ _note, schema, updatedAt, vehicles[], maintenances[], fuels[], expenses[], documents[] }` — dates `AAAA-MM-JJ`, identifiants uniques, montants en euros.

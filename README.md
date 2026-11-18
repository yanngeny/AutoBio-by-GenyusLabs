# AutoBio

*by GenyusLabs* — l’autobiographie de tes véhicules : entretiens, rappels, pleins, dépenses et documents.

Les données vivent dans **un seul document de travail JSON**, créé par l’appli et remplacé automatiquement à chaque modification. Pas de base de données : rien à perdre lors d’une mise à jour de l’appli.

Nom du fichier :

```
AutoBio_live-data.json
```

Il contient aussi une clé `_note` (en anglais) qui rappelle qu’il est créé par AutoBio et remplacé automatiquement.

## Deux modes de stockage

- **Fichier choisi** (APK, par défaut) : tu choisis l’emplacement du document de travail (Google Drive, mémoire du téléphone, autre appli de stockage) via le sélecteur de fichiers Android. Aucune API Google, aucune configuration. Les photos et documents restent sur le téléphone dans ce mode.
- **Google Drive (API)** (web, ou en secours) : l’appli range son document dans `Mon Drive › AutoBio` ; accès limité à `drive.file` (elle ne voit que ses propres fichiers). Les photos et documents vont dans `Documents/`.

Au premier lancement, l’appli demande **« As-tu déjà utilisé AutoBio ? »** : si oui, elle relie le document existant et retrouve toutes les données (nouveau téléphone, réinstallation).

## Comment fonctionne la sauvegarde

- **À chaque modification**, l’appli remplace le document de travail 2,5 s plus tard.
- **Copie datée** : `AutoBio_backup_AAAA-MM-JJ.json`, mise à jour à chaque envoi (30 jours sur Drive ; 14 copies automatiques en local).
- **Copies de sécurité** : `AutoBio_safety_…` avant une restauration, un remplacement ou un écrasement après conflit.
- **Copie manuelle** : Réglages › Télécharger une copie → `AutoBio_export_AAAA-MM-JJ.json`.
- **Hors connexion** : les changements restent sur le téléphone puis partent au retour du réseau.
- **Restaurer** : Réglages › Restaurer depuis un fichier .json (n’importe quel fichier créé par AutoBio).

## Google Agenda

Dans *Rappels*, chaque échéance a un bouton **Ajouter à l’agenda** : sur le web, il ouvre Google Agenda avec l’événement pré-rempli ; dans l’APK, il crée l’événement en un appui via le plugin natif. Aucune API ni autorisation Google Agenda. Les échéances en km sont converties en date estimée d’après ton rythme.

## Configuration Google Drive (mode API uniquement, ~10 minutes)

1. <https://console.cloud.google.com/> : crée un projet.
2. **API et services › Bibliothèque** : active **Google Drive API**.
3. **Écran de consentement OAuth** : type *Externe*, ajoute ton adresse comme utilisateur test et la portée `…/auth/drive.file`. Laisse en mode « Test ».
4. **Identifiants › ID client OAuth** : type *Application Web* ; origines JavaScript autorisées = adresse où l’appli est servie.
5. Colle l’identifiant dans **Réglages** ou dans `config.js`.

> En mode « Test », Google redemande la connexion environ tous les 7 jours (pastille « Reconnecter Drive »).

## Lancer l’appli

```bash
python3 -m http.server 8080      # puis http://localhost:8080
```

Pour l’utiliser sur le téléphone avant l’APK, héberge le dossier en HTTPS (GitHub Pages, Netlify…) et choisis « Ajouter à l’écran d’accueil ».

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
- `js/drive.js` : stockage (fichier choisi / Drive), file d’envoi, copies, restauration
- `js/agenda.js` : bouton « Ajouter à l’agenda »
- `js/blobs.js` : photos et documents locaux
- `js/ui.js` : écrans et actions
- `tests/e2e.js` : test de bout en bout avec Drive et plugins simulés (Playwright), sur un jeu de données fictif

## Format du document de travail

`{ _note, schema, updatedAt, vehicles[], maintenances[], fuels[], expenses[], documents[] }` — dates `AAAA-MM-JJ`, identifiants uniques, montants en euros.

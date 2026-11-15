# Valmart sur ton ordinateur (localhost), sans hébergement

Tout tourne chez toi : le site, l'app mobile, le serveur de jetons. Seul LiveKit reste en ligne (il faut Internet, pas d'hébergement à gérer).

## 1. Une seule fois

Installe Node.js (version LTS) depuis https://nodejs.org. Puis, dans le dossier du projet :

```
npm install
```

## 2. Lancer tout le projet

```
npm run dev:all
```

Trois choses démarrent d'un coup :

| Adresse | Quoi |
|---|---|
| http://localhost:5173/ | Le site web (accueil, app, Studio) |
| http://localhost:5173/#/room | Les salles réelles (créer, rejoindre) |
| http://localhost:5174/ | L'app mobile (dans un cadre de téléphone) |
| http://localhost:5173/#/dev/sync?room=essai&role=host | Test de synchronisation à deux onglets |

Pour arrêter : Ctrl+C. Toute modification d'un fichier dans `src/` se voit tout de suite dans le navigateur.

Aucun réglage n'est nécessaire : en local, le site trouve tout seul le serveur de jetons (`scripts/local-worker.mjs`, mêmes clés LiveKit que `worker/token.js`).

## 3. Tester le live réel avec un seul ordinateur

1. Onglet 1 : `http://localhost:5173/#/room`, **Create the room**, **Go live**, autorise la caméra.
2. Onglet 2 (ou une fenêtre privée) : même adresse, tape le code, **Join the live**.
3. Vérifie la vidéo, le chat et les outils. Pour le mode équipe : onglet 3 avec le lien caméra.

Le navigateur accepte la caméra sur `localhost` même sans https.

## 4. Tester avec ton téléphone (même Wi-Fi)

Un téléphone refuse la caméra sur une adresse `http://192.168…`. Lance donc :

```
npm run dev:https
```

Le terminal affiche une adresse « Phone » (`https://192.168.x.x:5173/#/room`). Ouvre-la sur le téléphone, accepte l'avertissement de certificat une seule fois, puis suis l'étape 3. L'ordinateur et le téléphone doivent être sur le même Wi-Fi, et le pare-feu de l'ordinateur doit autoriser Node.js.

## 5. Les vidéos : tu déposes le clip, puis tu le règles dans l'app

**Étape 1 : déposer les clips.** Copie tes fichiers .mp4 ou .webm dans `public/videos/`. Tu peux les ranger comme tu veux : le dossier contient déjà un classement par pays, ville et live (par exemple `turkiye/istanbul/s6-ferry-ride-and-the-spice/`), mais ce n'est pas obligatoire.

**Étape 2 : ouvrir la bibliothèque.** Avec `npm run dev:all` lancé, ouvre :
`http://localhost:5173/#/dev/library`

Tu vois chaque clip avec un lecteur d'aperçu. Pour chacun, choisis :
- **Not used** : le clip n'est pas utilisé.
- **Video of an existing live** : tu choisis un des live de l'app, et ce clip devient sa vidéo. (Si le clip est dans un dossier `sN-…`, le live est déjà proposé.)
- **New live** : tu règles le **titre**, la **ville**, le **lieu**, la **catégorie**, la **langue** et le **host**. Le live apparaît dans Discover, la page de la ville, les catégories, l'app mobile, etc.

**Étape 3 : Save**, puis **Open the app**. La page se recharge et tes lives sont là. Les réglages sont écrits dans `public/videos/library.json` : tu peux le garder ou l'envoyer plus tard avec le site.

Bon à savoir :
- La bibliothèque ne marche que sur ton ordinateur, avec `npm run dev:all` (elle écrit un fichier). Une fois le site publié, il lit simplement `library.json`.
- Clips conseillés : 20 à 40 secondes, 5 à 8 Mo, sans son. Pas de limite de 25 Mo en local.
- `npm run videos` et `npm run video-folders` existent toujours (méthode par noms de dossiers), mais la bibliothèque est la méthode principale.
- Les salles réelles (`/#/room`) montrent la vraie caméra, pas ces clips.

## 6. Dépannage

| Problème | Cause probable |
|---|---|
| `npm run dev:all` : « port already in use » | un autre programme utilise 5173, 5174 ou 8787 : ferme-le |
| « Cannot reach the room service » | le serveur de jetons ne tourne pas : relance `npm run dev:all` |
| Pas de vidéo chez le viewer | pas d'Internet, ou clé LiveKit invalide |
| Caméra refusée sur le téléphone | utilise `npm run dev:https` |
| Le téléphone n'atteint pas l'adresse | Wi-Fi différent, ou pare-feu |

Plus tard, pour publier : `npm run build:pages`, comme décrit dans `DEPLOY.md` et `SPRINT2_SETUP.md`.

## 7. Retirer l'outil de bibliothèque plus tard (les vidéos restent)

L'outil (la page de réglage) et les données sont séparés. Tes vidéos et tes lives restent grâce à deux choses qui ne dépendent pas de l'outil :
- `public/videos/library.json` : les réglages (titre, ville, catégorie...) ;
- tes clips dans `public/videos/`, et `src/video/library.ts` qui lit le fichier au démarrage.

Pour retirer l'outil, supprime seulement :
1. `src/pages/dev/Library.tsx` ;
2. dans `src/App.tsx` : la ligne `import Library …` et la ligne `<Route path="dev/library" …>` ;
3. dans `vite.config.ts` : la fonction `videoLibraryApi` et la ligne `plugins.push(videoLibraryApi())`.

Ne supprime **pas** `library.json`, `src/video/library.ts` ni la ligne `loadLibrary` de `src/main.tsx`.
Vérifié : après ce retrait, le projet compile et un live créé avec l'outil s'affiche toujours avec sa vidéo.

Si un jour tu veux figer les lives directement dans le code (`src/data/mock.ts`) et supprimer aussi `library.json`, dis-le-moi : je le fais à ta place.

## 8. Le catalogue est réduit à 8 lives (un par ville)

L'app montre 8 lives : s1 Paris, s2 New York, s3 Tokyo, s4 Marrakech, s5 Rome, s6 Istanbul, s7 Rio, s8 Kyoto. Rien n'est supprimé : les 35 lives restent dans `src/data/mock.ts`.
- Pour revenir à tous les lives : dans `src/data/mock.ts`, mets `DEMO_ONLY = false`.
- Pour choisir d'autres lives : modifie la liste `DEMO_IDS` (garde au moins un live par ville, sinon certains écrans plantent).
- Les dossiers de vidéos des autres lives ont été retirés. `npm run video-folders` les recrée si tu réactives tout.


## 9. Lives réels dans la liste « Live now » (sans code)

- Le host remplit titre, ville, catégorie, son nom, puis « Create the room ». Le Worker crée la salle LiveKit avec ces détails.
- Dès que le host publie sa caméra, le live apparaît dans « Live now » (page Live rooms, Discover web, Explore mobile). Un clic = le viewer entre, sans code.
- Le code reste possible dans « Have a code or a private link? » (lien privé, salle d'équipe).
- La liste vient du Worker (`/live`, mise à jour toutes les 15 s). Pas de base de données : un live disparaît quand le host quitte.
- Mode test sans serveur (`?api=local`) : la liste est partagée entre onglets du même navigateur.

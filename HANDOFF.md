# Valmart: passation pour la nouvelle conversation (version code)

Mohamed écrit en français et attend des réponses en français. L'interface de l'app est en anglais, avec des données d'exemple. Réponses courtes, structurées, sans détail inutile.

## 1. Contexte

Valmart est une marketplace de tourisme digital en direct : des hôtes locaux filment en live, les viewers regardent, chattent et influencent le live. Mohamed est Founder et CEO. Le Project « Valmart » contient `Valmart_BusinessPlan_Final (1).docx`.

Le but actuel est un prototype haute-fidélité à montrer à des investisseurs, **pas un produit pour de vrais utilisateurs**. Décisions déjà prises :
- Pas de paiement, pas de base de données, tout gratuit.
- Plus aucune publicité dans l'app.
- Logo bleu #24B1F4 et orange #FA8F1C.
- Les vidéos longues arrivent plus tard ; en attendant, emplacement « Video placement », ou le clip que l'utilisateur choisit lui-même (« Play my own clip »).

**L'avantage visé** : rendre le live plus réel et plus influencé par un simple viewer, dans toutes les catégories (pas seulement le voyage), avec peu de décisions pour l'utilisateur.

## 2. Livrables actuels (artifacts)

| Quoi | Lien |
|---|---|
| Prototype web (site + app + Studio) | https://claude.ai/artifact/W1Ca4DTqxgw1CGetq5hTJh (v13 ou plus récent) |
| Prototype mobile (app plein écran) | https://claude.ai/artifact/KcanYUxq7it2cLauSshakp (v5 ou plus récent) |
| Maquettes desktop des outils live (5 écrans) | https://claude.ai/artifact/BrgaEiWPnCpTEpawTEmnxT |
| Document de stratégie (influence, outils, replays, balade privée, tarifs) | https://claude.ai/code/artifact/57ac7d2f-56fb-405a-9f67-c9f9aaa6a970 |

Les artifacts restent la **vitrine de design simulée**. La version réelle vit sur Cloudflare Pages (voir sprints).

Le code source est dans un zip (sans node_modules ni dist). Il faut le dézipper, puis `npm install`.

## 3. Le code

- **Pile** : React 19, Vite 8, TypeScript, Tailwind 3.4, Zustand 5, react-router-dom 7 (HashRouter), d3-geo.
- **Commandes** : `npm run build` (web, un seul fichier), `npm run build:mobile` (dist-mobile), `npm run build:pages` (dossier `dist-pages` à envoyer sur Cloudflare : web à la racine, mobile dans `/m/`, vidéos dans `/videos/`, marche aussi sous Windows). `node scripts/make-artifact.mjs entrée sortie` convertit un build en fragment publiable.
- **Entrée** : `src/main.tsx` choisit `MobileApp` si `VITE_APP=mobile`, sinon `App`.
- **État** : `src/store.ts` (compte, coins, abonnement, trial, moments, sessions) persisté dans localStorage. `src/mobile/prefs.ts` pour les préférences mobiles (dont `voiceCaptions` et `hostVoice`).
- **Live simulé** : `src/hooks/useLiveSim.ts` (chat, cadeaux, vote de trajet).
- **Vidéo** : `src/components/VideoSlot.tsx` accepte, dans cet ordre, un `mediaStream` (caméra ou flux LiveKit), `src`, `stream.video`, le clip choisi par l'utilisateur (`src/video/clips.ts`, `ClipPicker.tsx`, en mémoire seulement), puis l'emplacement « Video placement ».
- **Intégrations** : web viewer `src/pages/app/Live.tsx`, host web `src/pages/studio/GoLive.tsx`, mobile viewer `src/mobile/Feed.tsx`, host mobile `HostLive` et `HostRoom` dans `src/mobile/Screens.tsx`, réglages `src/mobile/Settings.tsx`.

## 4. Les outils de live

- `tools.ts` : 15 outils en 4 kits (Base, Fear, Hidden places, Travel), les briques, `kitFor(catégorie)`, les modes Immersive / Balanced / Active.
- `engine/reducer.ts` : logique pure (état, reducer, `describe`, `toSnapshot`). Actions distantes : `remoteAnswer`, `remotePin`, `remotePace`, `snapshot`.
- `useToolEngine.ts` : le hook, **un seul objet pour les écrans, trois façons de le faire tourner** :
  - sans `net` : simulation locale (audience simulée) ;
  - `net` + rôle `host` : le host est l'autorité, garde l'outil, la file et les compteurs, ajoute ce que les viewers envoient, publie un instantané chaque seconde ; `simAudience` garde la foule simulée active ;
  - `net` + rôle `viewer` : aucune simulation, l'état est le dernier instantané, les actions (`answer`, `pin`, `pace`) partent vers le host. `engine.mode` vaut `sim`, `host` ou `remote`.
- `transport/types.ts` : interface `Transport` (`send`, `subscribe`, `close`) et messages `state`, `answer`, `pin`, `pace`, `hello`. `transport/local.ts` : BroadcastChannel entre onglets (tests sans réseau). **LiveKit viendra en `transport/livekit.ts`.**
- `ui.tsx` : `ToolCard`, `PaceChips`, `PinLayer`, `VideoEffects`, `ModeSwitch`, `LiveMap`, `ChapterBar`.
- `host.tsx` : `ToolLauncher` et `ToolBuilder`. `store.ts` : mode par surface et outils personnalisés.
- Page de test développeur : `/#/dev/sync?room=xxx&role=host` dans un onglet, `role=viewer` dans un autre.

## 5. Nouvelles fonctions (idées de Mohamed, déjà dans les prototypes, simulées)

- **Cinema mode (web viewer)** : `live/Cinema.tsx`. Vidéo plein écran, 3 éléments seulement (Stay / Move on, Look here, outil actif en fine barre), chat caché (touche C), contrôles masqués après 3 s, raccourcis P, Espace, F, ←, Échap, bouton « TV size ».
- **Voix de synthèse (TTS), usage privé seulement** : `live/tts.tsx`, gratuit, voix du navigateur (qualité variable selon appareil et langue). Le host entend les outils et les résultats ; le viewer peut faire lire les sous-titres. La lecture publique des messages est écartée pour l'instant (spam, insultes).
- **Trois modes host, un seul à la fois** : `live/director.tsx`. Solo automatique (un gros bouton « Launch: … », appui long = pas maintenant, pause automatique quand le host marche, interrupteur de démo), Solo manuel (le lanceur d'outils), Team (régie sur ordinateur avec lien et QR d'invitation, téléphone en rôle Caméra : connexion et bouton Pause seulement, modérateur en option). Réglages cachés derrière « More tools ».
- Mises à part pour plus tard : feuille de route de repères, commande vocale, téléphone comme télécommande.

## 6. Plan en 3 sprints (web et mobile avancent ensemble, un seul code partagé)

**Sprint 1, Fondations** (statut : codé et testé en local)
- Lecteur vidéo commun (clip, MediaStream, clip de test de l'utilisateur) : fait.
- Moteur en deux modes + transport local + page de test à deux fenêtres : fait (12 vérifications passent : horloge, outil, réponse, repère, rythme, viewer en retard, salles séparées).
- Build `build:pages` + guide `DEPLOY.md` : fait. Mohamed a déployé le site sur Cloudflare (adresse `workers.dev`).
- Vidéos depuis Cloudflare : fait. `public/videos/videos.json` (`base`, `clips` par id de live, `pool` partagé) est lu à l'exécution par `src/video/manifest.ts`. Les cartes et listes montrent une image fixe (`preload=metadata`), seul le lecteur d'un live joue le clip (`player` sur `VideoSlot`, un seul live actif dans le Feed mobile). Clips : 25 Mo maximum par fichier, ou bucket R2 via `base`.

**Sprint 2, Le live réel** (statut : codé et testé en local avec un faux backend ; reste le test réel par Mohamed, voir `SPRINT2_SETUP.md`)
- Worker Cloudflare de jetons (rôles host, régie, caméra, modérateur, viewer ; clé secrète côté serveur).
- `transport/livekit.ts` (messages de données ; état en canal non fiable, actions en fiable), écrans créer et rejoindre (**par lien ou code**, pas de liste publique car pas de base de données).
- Caméra réelle du host sur téléphone, viewers web et mobile branchés sur le flux, chat réel sans modération, mode Team réel (la régie est l'autorité, le téléphone ne publie que la vidéo).
- Fait : `worker/token.js` (POST `/create`, `/keys`, `/token` ; clés de rôle par HMAC sans base ; jetons vérifiés avec le vérificateur officiel livekit-server-sdk, `worker/test.mjs`). `src/live/transport/livekit.ts` (topics `tool` et `chat`, état en lossy, état accepté seulement de host ou control). `src/rooms/` : `api.ts` (adresse du Worker via `/config.json` `tokenUrl` ou `?api=`), `useRoom.ts`, `RoomEntry.tsx`, `screens.tsx` (`ViewerRoom`, `HostRoom` solo/régie, `CameraRoom`), `parts.tsx`. Web : routes `/#/room` et `/#/room/CODE?r=host|control|camera|moderator&k=CLE&m=mode&c=catégorie`. Mobile : `src/mobile/Rooms.tsx` (bouton « Join with a code » dans Live, entrée Me, Live rooms ; viewer et host solo ; caméra et régie via le lien web).
- Mode test sans serveur : `?api=local` (`transport/roomLocal.ts`, onglets du même navigateur, pas de vraie vidéo). Tests Playwright avec caméra factice : salle solo, chat, outil host vers viewer, équipe avec caméra, mauvaise clé refusée, mobile host.
- Pas testé en réseau réel (LiveKit inaccessible depuis l'environnement de Claude) : vidéo et son distants, reconnexion, iPhone. À valider par Mohamed. `VideoSlot` a une prop `sound` (viewer) ; l'aperçu du host reste muet.

**Sprint 3, Finition investisseurs**
- Corrections issues des tests de Mohamed sur de vrais appareils.
- Confort : outils qui s'effacent seuls après le vote, pas d'outil pendant une action, mode choisi selon l'appareil.
- Bouton « audience simulée » pour montrer l'app seule.
- Guide de test à deux appareils et script de démo mis à jour.

**Comptes** : Cloudflare avant le Sprint 1, LiveKit avant le Sprint 2 (offre gratuite « Build » : 100 participants simultanés, 5 000 minutes de participation par mois, 50 Go sortants par mois ; quand un quota est épuisé, les requêtes échouent, aucune facture ; chiffres vérifiés le 2026-10-20). Chaque appareil compte comme un participant (en équipe : 2 appareils + 5 viewers = 7).

## 7. Limites et précautions

- **Pas de vidéos téléchargées depuis YouTube ou TikTok** pour la démo. Alternatives : ses propres images, clips libres de droits (Pexels, Pixabay, Mixkit), ou un vrai live avec un vrai host.
- L'environnement de Claude n'a pas accès à YouTube, à LiveKit ni à Cloudflare : le code réseau ne peut pas être testé là. Le code est écrit et testé en local (transport entre onglets), Mohamed teste sur de vrais appareils.
- Les clés secrètes (LiveKit) restent chez Mohamed, jamais dans le code livré.
- Un téléphone de host : écran allumé et onglet ouvert, sinon la caméra se coupe (surtout iPhone).
- L'artifact de Claude bloque les lecteurs externes : le prototype réel doit être testé sur le site publié.
- Cloudflare Pages : 25 Mo maximum par fichier ; les vidéos plus lourdes vont ailleurs (R2 ou Stream) ou se testent avec « Play my own clip ».
- La voix de synthèse gratuite varie selon l'appareil et la langue (arabe, japonais en particulier).

## 8. Choses en attente ou périmées

- README.md et DEMO_SCRIPT.md décrivent l'ancienne structure.
- Document de stratégie : 11 décisions à valider par Mohamed (replays 7 jours Free / 30 jours Premium, balade privée 80/20, Premium 7,99 $, etc.). Tous les prix sont des exemples.
- Caveats à rappeler : tout est simulé, prix d'exemple, traductions à faire vérifier par des natifs.
- Décisions validées par Mohamed : live réel rejoint par lien ou code ; chat réel sans modération pour la démo ; replays, balade privée et tarifs hors de ces sprints.

## 9. Source de vérité : le code

- **Le code est la source de vérité** pour le design et les fonctions. Les prototypes publiés sont construits depuis ce code. Pour vérifier une correspondance : lancer le build, ouvrir le résultat dans un navigateur et comparer par captures (Playwright), au lieu de lire les artifacts.
- **Les tokens de design** sont dans `src/index.css` (variables `:root`) et `tailwind.config.js` : fond ink-950 #06121f, ink-900 #0a1b2d, ink-800 #0f2740, ink-700 #17324f, ligne #1f4066, bleu #24B1F4, orange #FA8F1C, texte #eaf4fc, texte atténué #93adc4, vert OK #3ddc97. Polices : Outfit (titres) et Figtree (texte). Rayons : cartes 18 px, pastilles arrondies complètes.
- **Les maquettes (artifact BrgaEiWPnCpTEpawTEmnxT) ne sont pas le design final** (palette ambre et turquoise, autres polices). Mode par défaut : Balanced sur le web, Immersive sur mobile.
- **Pour garder la cohérence** : toute nouvelle interface réutilise les composants et les tokens existants (`src/components/ui.tsx`, `src/mobile/kit.tsx`, `src/live/ui.tsx`).

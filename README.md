# Valmart, prototype interactif pour les investisseurs

Prototype cliquable de la plateforme Valmart. Les données et les comportements (vidéo, spectateurs, chat, votes, publicités, gains, paiements) sont simulés. Il n'y a pas de backend.

## Démarrer

```bash
npm install
npm run dev          # http://localhost:5173
```

## Deux façons de le construire

| Commande | Résultat | Usage |
|---|---|---|
| `npm run build` | `dist/index.html`, un seul fichier autonome | Démo hors ligne, envoi par email, aperçu |
| `npm run build:site` | `dist-site/`, un site normal en plusieurs fichiers | Mise en ligne (Cloudflare Pages), vidéos longues |

## Mettre en ligne (Cloudflare Pages, gratuit)

1. `npm run build:site`
2. Dans Cloudflare, Workers & Pages, créer un projet Pages et envoyer le dossier `dist-site/` (ou connecter le dépôt Git avec la commande de build `npm run build:site` et le dossier de sortie `dist-site`).
3. Ajouter un domaine personnalisé, par exemple `demo.valmart.com`.

Le routage utilise le `#` dans l'adresse, donc aucune règle de redirection n'est nécessaire.

## Ajouter les vraies vidéos (plus de 15 minutes)

1. Ouvrir `src/data/mock.ts`.
2. Sur chaque session (`STREAMS`), ajouter le champ `video` avec l'adresse du fichier, par exemple `video: 'https://videos.valmart.com/paris-seine.mp4'`.
3. Sans champ `video`, la session garde la scène stylisée et l'étiquette « Video placement ».

Attention à la taille : Cloudflare Pages refuse les fichiers de plus de 25 Mo. Pour des vidéos de 15 minutes et plus, héberge les fichiers ailleurs (Cloudflare R2 avec une adresse publique, ou Cloudflare Stream) et mets l'adresse complète dans `video`. Le fichier unique `dist/index.html` ne convient pas aux vidéos longues.

## Visite guidée pour la présentation

Le bouton « Demo tour » en haut ouvre un guide en 8 étapes avec les points à dire.
Flèches gauche et droite pour avancer, Échap pour fermer. « Reset demo » remet les pièces, le Premium et les pubs à zéro avant de montrer la démo à quelqu'un d'autre.

Dans la salle live, la barre « Presenter » permet de rejouer la pub, de passer en vue Premium et de lancer un cadeau.

## Où se trouve quoi

| Dossier | Contenu |
|---|---|
| `src/pages/` | Les écrans (accueil, explorer, ville, live, hôte, événements, Premium, annonceurs, API) |
| `src/components/` | Éléments communs (carte du monde, chat, vote, pubs, graphiques, visite guidée) |
| `src/data/` | Villes, hôtes, sessions, événements, scénarios du live (tout est fictif) |
| `src/hooks/useLiveSim.ts` | Le « directeur de scénario » : chat, votes, cadeaux simulés |
| `src/store.ts` | État partagé de la démo (pièces, Premium, visite guidée) |

## Passer au vrai MVP

L'interface est réutilisable telle quelle. À remplacer :

| Dans la démo | Dans le MVP |
|---|---|
| Données dans `src/data/` | Base de données (Convex ou Neon) |
| Compte fictif | Better Auth |
| Vidéo placeholder | Streaming WebRTC (par exemple LiveKit) |
| Chat et votes simulés | Messages et votes en temps réel (Convex) |
| Pièces de démonstration | Un système de paiement, à choisir selon les pays |

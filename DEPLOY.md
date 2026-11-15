# Mettre Valmart en ligne (Cloudflare Pages, gratuit)

Tu n'as besoin ni de carte bancaire, ni de GitHub, ni de ligne de commande Cloudflare.

## 1. Créer le dossier à envoyer

Dans le dossier du projet :

```
npm install
npm run build:pages
```

Cela crée le dossier `dist-pages` :
- `/` : l'app web (site, app, Studio) ;
- `/videos/videos.json` : le fichier qui associe les clips aux lives ;
- `/m/` : l'app mobile ;
- `/#/dev/sync` : la page de test à deux fenêtres.

Si tu as reçu un `valmart-pages.zip` déjà prêt, dézippe-le et saute à l'étape 2.

## 2. Compte Cloudflare

1. Va sur https://dash.cloudflare.com/sign-up et crée un compte gratuit (e-mail et mot de passe).
2. Confirme ton e-mail.

## 3. Envoyer le dossier

1. Dans le menu de gauche : **Workers & Pages**.
2. **Create application**, onglet **Pages**, puis **Upload your static files** (ou « Direct Upload »).
3. Nom du projet : par exemple `valmart-demo`. Tu obtiens `https://valmart-demo.pages.dev`.
4. Glisse le dossier **dist-pages** (le dossier lui-même, pas son contenu seul) dans la zone d'envoi, puis **Deploy**.

## 4. Ce que tu peux tester

- Web : `https://valmart-demo.pages.dev/`
- Mobile : `https://valmart-demo.pages.dev/m/` (ouvre-le sur ton téléphone)
- Synchronisation : ouvre `https://valmart-demo.pages.dev/#/dev/sync?room=essai&role=host` sur un appareil et `...&role=viewer` sur un autre navigateur. **Attention :** sans LiveKit, la synchronisation passe par le navigateur lui-même, donc elle ne marche qu'entre deux onglets du même navigateur. Le vrai test entre deux appareils se fait avec les salles réelles : voir SPRINT2_SETUP.md.
- Ton propre clip : dans un live, bouton **Play my own clip** (web) ou Me, Playback, Test video (mobile). Le clip reste sur l'appareil.

## 5. Mettre à jour

Refais `npm run build:pages`, puis dans Cloudflare : ton projet, **Create deployment**, glisse à nouveau `dist-pages`.

## Ajouter tes vidéos

Un fichier décide quel clip va avec quel live : `videos/videos.json`. Tu le modifies, tu envoies les clips, et c'est tout. Aucun code, aucune reconstruction.

```json
{
  "base": "",
  "clips": { "s4": "marrakech-souk.mp4", "s12": "marrakech-aube.mp4" },
  "pool": ["clip-a.mp4", "clip-b.mp4", "clip-c.mp4"]
}
```

- `clips` : un clip précis pour un live précis (identifiant du live, voir la liste plus bas).
- `pool` : des clips partagés par tous les autres lives. Un même live reçoit toujours le même clip.
- `base` : vide = les clips sont dans le dossier `videos/` du site. Pour un bucket Cloudflare R2, mets son adresse publique, par exemple `https://pub-xxxx.r2.dev`.
- Un live sans clip garde l'emplacement « Video placement ».

**Comment fabriquer des clips légers** (5 à 8 Mo chacun, 20 à 40 s, sans son puisque le lecteur est en sourdine) :

```
ffmpeg -i entree.mp4 -vf "scale=-2:720" -c:v libx264 -crf 28 -preset slow -an -movflags +faststart sortie.mp4
```

L'option `+faststart` est importante : les cartes du site n'affichent qu'une image fixe et chargent seulement le début du fichier.

### Voie 1 : dans le dossier du site (la plus simple)
1. Mets tes clips dans `dist-pages/videos/` (à côté de `videos.json`).
2. Modifie `videos.json`.
3. Dans Cloudflare, ton projet, redéploie en glissant à nouveau le dossier `dist-pages`.
Chaque fichier doit faire moins de 25 Mo.

### Voie 2 : un bucket Cloudflare R2 (pour changer les vidéos sans redéployer le site)
1. Cloudflare, **R2 Object Storage**, **Create bucket** (par exemple `valmart-videos`). Cloudflare peut demander un moyen de paiement pour activer R2 : vérifie les conditions affichées avant de continuer.
2. Dans le bucket, **Upload** : envoie tes clips.
3. Dans les réglages du bucket, active l'accès public (le sous-domaine `r2.dev`) et copie l'adresse.
4. Dans `videos.json`, mets cette adresse dans `base`, puis redéploie une seule fois le site. Ensuite, pour ajouter ou remplacer un clip, il suffit de l'envoyer dans le bucket (et de changer `videos.json` si le nom change).

### Identifiants des lives
| id | live |
|---|---|
| s1 | Sunset walk from the Seine to the Eiffel Tower (Paris) |
| s2 | Central Park, you pick the route (New York) |
| s3 | Shibuya after midnight (Tokyo) |
| s4 | Jemaa el-Fna evening market and street food (Marrakech) |
| s5 | Hidden courtyards behind the Pantheon (Rome) |
| s6 | Ferry ride and the spice bazaar (Istanbul) |
| s7 | Carnival rehearsal in Lapa (Rio) |
| s8 | Quiet morning in Gion (Kyoto) |
| s9 | Montmartre at golden hour (Paris) |
| s10 | Brooklyn Bridge to DUMBO with street food stops (New York) |
| s11 | Quiet shrines of Yanaka (Tokyo) |
| s12 | The souks at dawn, before the crowds (Marrakech) |
| s13 à s20 | autres lives de Paris, New York et Tokyo (voir `src/data/mock.ts`) |

Les droits : uniquement tes propres images ou des clips libres de droits (Pexels, Pixabay, Mixkit).

## Limites

- 25 Mo maximum par fichier envoyé. Pour une longue vidéo, utilise « Play my own clip » ou un autre hébergement.
- Les clés LiveKit ne vont jamais dans ce dossier. Elles iront dans le Worker au Sprint 2.

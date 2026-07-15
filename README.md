# Claude Usage — extension Chrome

Affiche ta consommation Claude directement dans Chrome :

- **Session (5 h)** — % du plafond glissant sur 5 heures
- **Semaine** — % du plafond hebdomadaire
- **Crédits d'usage** — dépense vs plafond mensuel (ex. `$360.49 / $500.00 CAD`)

Un **badge** sur l'icône de la barre d'outils montre en permanence le pire pourcentage
(vert < 75 %, ambre 75–90 %, rouge ≥ 90 %). Clique l'icône pour le popup.

Le bouton **⤢** du popup ouvre un **dashboard plein écran** : jauge radiale du budget
crédits et cartes détaillées pour chaque plafond (avec sévérité et reset).

## Comment ça marche

L'extension appelle l'API interne de claude.ai :

```
GET https://claude.ai/api/organizations/{orgId}/usage
```

Comme la requête part **depuis ton navigateur**, ton **cookie de session claude.ai
est envoyé automatiquement** (grâce à `host_permissions`). Aucun token, mot de passe
ni cookie à copier-coller : il suffit d'être connecté à claude.ai dans Chrome.

L'`orgId` est détecté automatiquement via `GET /api/organizations` (avec un identifiant
de secours en dur dans `api.js` si la détection échoue). Le résultat est mis en cache
5 minutes (comme l'appli officielle) pour ne pas marteler l'API.

## Installation (mode développeur)

1. Ouvre `chrome://extensions`
2. Active **Mode développeur** (coin haut-droit)
3. **Charger l'extension non empaquetée** → sélectionne le dossier `C:\sources\claude_usage`
4. Épingle l'icône « Claude Usage » et connecte-toi à claude.ai si ce n'est pas déjà fait

Pour recharger après modification : bouton ↻ sur la carte de l'extension dans `chrome://extensions`.

## Fichiers

| Fichier | Rôle |
|---|---|
| `manifest.json` | Déclaration MV3, permissions, badge |
| `api.js` | Appel API, cache, normalisation des données |
| `popup.html` / `popup.css` / `popup.js` | Interface du popup |
| `dashboard.html` / `dashboard.css` / `dashboard.js` | Dashboard plein écran (jauge, plafonds) |
| `background.js` | Service worker : rafraîchit le badge toutes les 5 min |
| `icons/` | Icônes générées |

## Confidentialité

Aucune donnée ne quitte ta machine : l'extension parle uniquement à `claude.ai`
(la même destination que l'appli). Rien n'est envoyé ailleurs, rien n'est journalisé.

## Limite connue

L'endpoint `/usage` n'est **pas documenté** par Anthropic. Il peut changer ou disparaître
à une mise à jour. Si l'affichage casse, vérifie la structure de la réponse dans
`chrome://extensions` → *Inspecter les vues : service worker / popup*.

## Changer l'organisation manuellement

Depuis la console du service worker ou du popup :

```js
chrome.storage.local.set({ orgId: "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" });
```

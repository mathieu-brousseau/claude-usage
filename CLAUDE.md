# claude_usage

Extension Chrome (Manifest V3) qui affiche la conso Claude (session 5 h, semaine,
crédits $) dans le popup + un badge sur l'icône.

## Points clés
- Source unique : `GET https://claude.ai/api/organizations/{orgId}/usage`, authentifié
  par le **cookie de session** du navigateur (pas de token OAuth — le Bearer CLI renvoie 403).
- Multi-org : `getOrgs()` liste les orgs via `/api/organizations`, `fetchAll()` récupère
  l'usage de chacune (cache par org). Le dashboard rend un bloc par org.
- `api.js` centralise fetch + cache (5 min) + `normalize()`. Popup, dashboard et service worker s'en servent.
- Schéma de réponse utile : `five_hour.utilization`, `seven_day.utilization`,
  `spend.used/limit.amount_minor` (+ `exponent`, `currency`), `extra_usage` (fallback).
- Endpoint **non documenté** : si ça casse, ré-inspecter la réponse réelle.

## Dev
- Pas de build. Charger non empaqueté via `chrome://extensions` (mode dev).
- Recharger l'extension après chaque modif. Déboguer via « Inspecter les vues ».

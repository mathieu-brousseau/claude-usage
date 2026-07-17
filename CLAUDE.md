# claude_usage

Chrome extension (Manifest V3) that shows Claude consumption (5 h session, week,
credit $) in the popup + a badge on the icon.

## Key points
- Single source: `GET https://claude.ai/api/organizations/{orgId}/usage`, authenticated
  by the browser's **session cookie** (no OAuth token — the CLI Bearer returns 403).
- Multi-org: `getOrgs()` lists orgs via `/api/organizations`, `fetchAll()` fetches each
  org's usage (per-org cache). The dashboard renders one block per org.
- `api.js` centralizes fetch + cache (5 min) + `normalize()`. Popup, dashboard and the
  service worker all use it.
- Useful response schema: `five_hour.utilization`, `seven_day.utilization`,
  `spend.used/limit.amount_minor` (+ `exponent`, `currency`), `extra_usage` (fallback).
- **Undocumented** endpoint: if it breaks, re-inspect the real response.

## Dev
- No build. Load unpacked via `chrome://extensions` (dev mode).
- Reload the extension after each change. Debug via "Inspect views".

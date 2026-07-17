# Claude Usage — Chrome extension

![Claude Usage dashboard](docs/dashboard.png)

Shows your Claude consumption directly in Chrome:

- **Session (5 h)** — % of the rolling 5-hour cap
- **Week** — % of the weekly cap
- **Usage credits** — spend vs. monthly cap (e.g. `$360.49 / $500.00 CAD`)

A **badge** on the toolbar icon permanently shows the worst percentage
(green < 75%, amber 75–90%, red ≥ 90%). Click the icon for the popup.

The popup's **⤢** button opens a **full-screen dashboard**: a radial gauge for the
credit budget and detailed cards for each cap (with severity and reset).

## How it works

The extension calls claude.ai's internal API:

```
GET https://claude.ai/api/organizations/{orgId}/usage
```

Because the request is sent **from your browser**, your **claude.ai session cookie is
sent automatically** (thanks to `host_permissions`). No token, password or cookie to
copy-paste: you just need to be logged in to claude.ai in Chrome.

All **organizations** on your account are detected via `GET /api/organizations`, and
usage is fetched for each — the dashboard shows **one block per org**. Data is always
read **live** (the ↻ button simply reloads the page, no cache). The **badge**
(background task) **and the open page** (popup/dashboard) refresh automatically at a
**configurable interval**.

## Installation (developer mode)

1. Open `chrome://extensions`
2. Enable **Developer mode** (top-right corner)
3. **Load unpacked** → select the folder where you cloned this repository
4. Pin the "Claude Usage" icon and log in to claude.ai if you aren't already

To reload after changes: the ↻ button on the extension's card in `chrome://extensions`.

## Files

| File | Role |
|---|---|
| `manifest.json` | MV3 declaration, permissions, badge |
| `api.js` | API call, cache, data normalization |
| `popup.html` / `popup.css` / `popup.js` | Popup UI |
| `dashboard.html` / `dashboard.css` / `dashboard.js` | Full-screen dashboard (gauge, caps) |
| `background.js` | Service worker: refreshes the badge every 5 min |
| `icons/` | Generated icons |

## Language & settings

- **Language**: English by default, toggle **EN/FR** via the language button (popup and dashboard).
- **Auto-refresh**: the badge **and** the open page (popup/dashboard) refresh at the chosen interval (1 to 60 min, adjustable at the bottom of the dashboard).
- **Reset dates**: each cap shows the **countdown** `reset in HH:MM` (tooltip = absolute date `YYYY/MM/DD HH:mm`), updating live.
- **Badge**: choose what the icon shows — **session (default)**, worst cap, week or credits — via the selector at the bottom of the dashboard.

## Privacy

No data leaves your machine: the extension talks only to `claude.ai` (the same
destination as the app). Nothing is sent elsewhere, nothing is logged. See
[PRIVACY.md](PRIVACY.md) for details.

## Known limitation

The `/usage` endpoint is **not documented** by Anthropic. It may change or disappear in
an update. If the display breaks, check the response structure in `chrome://extensions`
→ *Inspect views: service worker / popup*.

## Multi-organization

If your account belongs to several organizations (multiple teams on the same login), the
extension shows them **all** — one block per org in the dashboard, and the badge shows
the worst percentage across all orgs. "Personal" usage on a **different account** does
not appear here: use a dedicated Chrome profile for that session.

## Publishing

Releases are published to the Chrome Web Store automatically via GitHub Actions.
See [docs/PUBLISHING.md](docs/PUBLISHING.md) for the one-time setup and the release process.

## Contributing

Contributions are welcome via Pull Requests from your fork — see
[CONTRIBUTING.md](CONTRIBUTING.md). Please also read the
[Code of Conduct](CODE_OF_CONDUCT.md).

## License

[MIT](LICENSE) © 2026 Mathieu Brousseau

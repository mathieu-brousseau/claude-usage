# Publishing to the Chrome Web Store

> **Important:** you cannot publish to the Chrome Web Store (CWS) directly from
> `gh` or the GitHub API. Publishing goes through **Google's Chrome Web Store
> API**. This repo automates it with a GitHub Actions workflow
> (`.github/workflows/publish-chrome.yml`) that packages the extension and
> uploads it to the store. A few one-time steps below can only be done by a
> human with a Google account.

## How the automation works

On every **published GitHub Release** (or a manual *Run workflow*), the workflow:

1. zips the extension (excluding docs, Markdown, `.github/`, git files);
2. uploads a new version to your CWS item via the API;
3. auto-publishes it (disable with the manual `publish: false` input to upload a
   draft instead).

The workflow needs four repository secrets:

| Secret | What it is |
|---|---|
| `CWS_EXTENSION_ID` | The item ID from the Web Store (the long id in the item URL) |
| `CWS_CLIENT_ID` | OAuth client ID |
| `CWS_CLIENT_SECRET` | OAuth client secret |
| `CWS_REFRESH_TOKEN` | OAuth refresh token for your developer account |

## One-time setup (manual — do this once)

### 1. Developer account & first upload

1. Register a Chrome Web Store developer account (one-time **$5 USD** fee):
   <https://chrome.google.com/webstore/devconsole>.
2. Build the initial package locally and upload it **once** through the dashboard
   to create the item and obtain its **Item ID**:
   ```bash
   zip -r extension.zip . -x '.git/*' '.github/*' 'docs/*' '*.md' 'LICENSE' '.gitignore' 'extension.zip'
   ```
3. Fill in the store listing (required before the item can go live):
   - **Title / summary / description**
   - **Category** (e.g. *Developer Tools* or *Productivity*)
   - At least one **screenshot** (1280×800 or 640×400) — `docs/dashboard.png` works
   - **Icon** 128×128 (already in `icons/`)
   - **Privacy**: single-purpose description, a justification for each permission
     (`storage`, `alarms`, `host_permissions: https://claude.ai/*`), the
     data-usage disclosures, and a **privacy policy URL**:
     `https://github.com/mathieu-brousseau/claude-usage/blob/main/PRIVACY.md`

### 2. Create OAuth API credentials

1. In the [Google Cloud Console](https://console.cloud.google.com/), create a
   project and **enable the "Chrome Web Store API"**.
2. Configure the **OAuth consent screen** (External) and add your Google account
   as a **test user**.
3. Create an **OAuth client ID** of type **Desktop app**. Note the **Client ID**
   and **Client secret**.
4. Generate a **refresh token**. The easiest way:
   ```bash
   npx chrome-webstore-upload-keys
   ```
   Follow the prompts (it opens a Google consent flow and prints the refresh
   token). Alternatively use the OAuth 2.0 Playground with scope
   `https://www.googleapis.com/auth/chromewebstore`.

### 3. Add the GitHub secrets

Either in **Settings → Secrets and variables → Actions**, or with the CLI:

```bash
gh secret set CWS_EXTENSION_ID   --repo mathieu-brousseau/claude-usage
gh secret set CWS_CLIENT_ID      --repo mathieu-brousseau/claude-usage
gh secret set CWS_CLIENT_SECRET  --repo mathieu-brousseau/claude-usage
gh secret set CWS_REFRESH_TOKEN  --repo mathieu-brousseau/claude-usage
```

(`gh secret set` prompts for the value so it never lands in your shell history.)

## Releasing a new version

1. Bump `"version"` in `manifest.json` — the CWS **rejects duplicate versions**.
2. Update `CHANGELOG.md`.
3. Create a **GitHub Release** with a tag such as `v1.0.1`. The workflow packages
   and publishes automatically.
   ```bash
   gh release create v1.0.1 --title v1.0.1 --notes "See CHANGELOG.md"
   ```

You can also trigger it manually from the **Actions** tab (*Run workflow*), with
the option to upload a draft instead of auto-publishing.

## Notes

- After publishing, Google **reviews** the new version before it goes live;
  review time varies from hours to a few days.
- Because the extension calls an **undocumented** claude.ai endpoint, expect extra
  scrutiny of the permission justifications during review.

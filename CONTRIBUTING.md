# Contributing to Claude Usage

Thanks for your interest! Contributions happen **via Pull Requests from your own
fork** — nobody needs write access to the repository.

## Workflow

1. **Fork** the repository (the *Fork* button, top-right on GitHub).
2. **Clone** your fork:
   ```bash
   git clone https://github.com/<your-account>/claude-usage.git
   cd claude-usage
   ```
3. Create a dedicated **branch**:
   ```bash
   git checkout -b fix/my-change
   ```
4. Make your changes, test them (see below), then commit:
   ```bash
   git commit -m "Clearly describe the change"
   ```
5. **Push** to your fork and open a **Pull Request** against this repo's `main`.

Keep your branch up to date with `upstream`:
```bash
git remote add upstream https://github.com/mathieu-brousseau/claude-usage.git
git fetch upstream
git rebase upstream/main
```

## Testing your changes

There is **no build step** — it's vanilla JavaScript (Manifest V3).

1. Open `chrome://extensions`
2. Enable **Developer mode**
3. **Load unpacked** → select the repository folder
4. After each change, click ↻ on the extension's card to reload it
5. Debug via *Inspect views: service worker / popup*

Check that the popup, dashboard and badge work, and if possible test a
**multi-organization** account.

## Pull request guidelines

- **One PR = one topic.** Small, focused PRs are reviewed faster.
- Match the existing style (vanilla JS, no build dependency, no framework).
- Update `README.md` if you change visible behavior.
- The `GET /api/organizations/{orgId}/usage` endpoint is **not documented** by Anthropic:
  if it changes, describe the new response structure in your PR.
- Be clear in the description: *what*, *why*, and *how to test*.

## Reporting a bug or proposing an idea

Open an **issue** using the provided templates before starting a large PR, so we can
agree on the approach together.

All contributions are published under the project's [MIT](LICENSE) license.

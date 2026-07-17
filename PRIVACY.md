# Privacy Policy

_Last updated: 2026-07-17_

Claude Usage is a Chrome extension that displays your Claude usage. Its privacy story is
short by design: everything stays on your device.

## Data the extension accesses

To display your usage, the extension reads data from claude.ai's API using your existing
browser session:

- `GET https://claude.ai/api/organizations` — the list of organizations on your account
- `GET https://claude.ai/api/organizations/{orgId}/usage` — usage figures per organization
  (5-hour session, weekly cap, credit spend)

These requests are sent **from your browser**, authenticated by the **claude.ai session
cookie** already stored by Chrome. The extension never asks you to enter, and never
stores, any password, token, or cookie.

## Data the extension stores

The extension stores only your **local settings** (language, refresh interval, badge
mode) using Chrome's `storage` API. This stays on your device and syncs only through
your own browser if you have Chrome sync enabled.

Usage figures are read **live** and displayed; they are not persisted by the extension.

## Data the extension shares

**None.** The extension communicates **only** with `https://claude.ai` — the same
destination as the Claude web app. It contacts no other server, contains no analytics or
telemetry, and logs nothing to any third party.

## Permissions

| Permission | Why |
|---|---|
| `host_permissions: https://claude.ai/*` | Read your usage from claude.ai using your session |
| `storage` | Save your local settings |
| `alarms` | Refresh the badge periodically |

## Changes

Any change to this policy will be reflected in this file and noted in the
[CHANGELOG](CHANGELOG.md).

## Contact

Questions about privacy can be raised by opening an issue on the GitHub repository.

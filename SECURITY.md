# Security Policy

## Security model

Claude Usage is a Chrome extension (Manifest V3) that:

- communicates **only** with `https://claude.ai` (declared in `host_permissions`);
- relies on the **session cookie** already present in your browser — no token,
  password or cookie is entered, stored persistently, or transmitted elsewhere;
- logs nothing and sends **no data** to any third-party server.

The only permissions requested are `storage` (local settings) and `alarms`
(periodic badge refresh).

## Reporting a vulnerability

Please **do not** open a public issue for a security problem.

Instead, use the **"Report a vulnerability"** button in the repository's *Security* tab
(GitHub Security Advisories), which allows private reporting.

Please include:

- a description of the issue and its potential impact;
- steps to reproduce;
- the browser and extension version affected.

We aim to acknowledge reports within a few days and to fix confirmed issues within a
reasonable timeframe.

## Supported versions

Only the latest version published on the `main` branch receives security fixes.

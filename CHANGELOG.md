# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Community and documentation files: `LICENSE` (MIT), `CONTRIBUTING.md`,
  `CODE_OF_CONDUCT.md`, `SECURITY.md`, `PRIVACY.md`, and issue/PR templates.

### Changed
- All documentation translated to English.

## [1.0.0] - 2026-07-16

### Added
- Popup showing the 5-hour session cap, weekly cap, and credit spend (spend vs. monthly cap).
- Toolbar **badge** showing the worst percentage across caps (green/amber/red), configurable.
- Full-screen **dashboard** with a radial credit-budget gauge and per-cap cards
  (severity, live reset countdown).
- **Multi-organization** support: one block per org, usage fetched per org.
- **Auto-refresh** of the badge and the open page at a configurable interval (1–60 min).
- **Internationalization**: English by default with an EN/FR toggle.
- Live data with no cache; the ↻ button reloads without cache.

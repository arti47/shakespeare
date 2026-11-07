# Changelog

Semver. Rules in `CLAUDE.md` → Versioning. Newest first.

## [Unreleased]

### Added
- `CLAUDE.md` project rules and this changelog.

## [1.0.0] — 2026-11-07

Baseline release: the app as of PR #22.

### Plays
- Othello, Antony and Cleopatra, King Lear, Twelfth Night, Much Ado About Nothing, The Tempest: original text with modern English, speech parts, notes, Study.

### Folio
- Installable PWA, one service worker, offline cache of every play.
- Shelf grouped by First Folio genres (Comedies, Histories, Tragedies), progress per play, single backup/restore.
- Cross-play search index.
- `tools/build.js` generates `search/*.json`, `sw.js`, `version.json` (content-hash build); CI check (#22).

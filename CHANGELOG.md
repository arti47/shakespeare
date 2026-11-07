# Changelog

Semver. Rules in `CLAUDE.md` → Versioning. Newest first.

## [Unreleased]

## [1.1.0] — 2026-11-07

### Added
- Favourite a phrase: press and hold a speech, tap *Favourite a phrase*, then tap the first and last word. Saved phrases are highlighted on the page (tap for the note), listed in My notes, included in the revision sheet and in backups. Optional note per phrase (#27).
- `CLAUDE.md` project rules and this changelog (#24).

### Changed
- `CLAUDE.md` updated for the shared reader (#23).
- `CLAUDE.md`: always ask relevant questions one at a time before each task.

## [1.0.0] — 2026-11-07

Baseline release: the app as of PR #23.

### Plays
- Othello, Antony and Cleopatra, King Lear, Twelfth Night, Much Ado About Nothing, The Tempest: original text with modern English, speech parts, notes, Study.

### Folio
- Installable PWA, one service worker, offline cache of every play.
- Shelf grouped by First Folio genres (Comedies, Histories, Tragedies), progress per play, single backup/restore.
- Cross-play search index.
- One shared reader (`reader.js`) for all plays; per-play content in `<id>/play.js`; stored user data escaped in HTML (#23).
- `tools/build.js` generates play pages, `search/*.json`, `sw.js`, `version.json` (content-hash build); CI check (#22, #23).

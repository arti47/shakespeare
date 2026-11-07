# Changelog

Semver. Rules in `CLAUDE.md` → Versioning. Newest first.

## [Unreleased]

## [2.0.0] — 2026-11-07

### Changed
- One app shell: the same bottom nav (Library / Read / Study / You) on the shelf and inside every play. Read and Study on the shelf open the last play where you left off (#30).
- Opening a play goes straight to your page; the play's title screen is gone. Its Contents, Cast and the story in moments now live in the reader's Contents sheet (☰ or tap the scene name) (#30).
- In the reader the nav shows with the menus (tap empty space) and hides for full-page reading; the page slider sits above it (#30).
- Study is grouped into four: Learn (Explore, Act summaries, Profiles, Themes, Key quotes), Practise (Flashcards, Practise, Quizzes), Write (Essay planner) and Revise (Revision sheet) (#30).
- Each play has a You page: progress, streak, exam plan, My notes, reading settings and a link to Folio settings and backup (#30).
- Today's line, word and week are at the top of the Library; Search is an icon in the Library masthead and in every play's top bar, and a play's search links to searching every play (#30).

### Removed
- Today and Search tabs on the shelf, the play home screen, and the Study and Folio buttons in the reader's top bar (all moved, see above) (#30).

## [1.3.0] — 2026-11-07

### Changed
- Speech tools: *Select a phrase* now starts the on-page selection at that part (tap a word to extend), replacing the separate word picker (#29).
- Play Settings, Revision sheet and the backup reminder point to the single Folio backup; each play keeps *Import an older backup* so old single-play files still restore (#29).
- Small labels (stage, on stage, tags, Story so far, shelf week days, counts) never drop below 14px at any text size (#29).
- Larger tap areas for text links, *‹ Folio*, *Story so far* and the page slider (#29).
- The phone status-bar colour follows the chosen theme on the shelf and in every play (#29).

### Fixed
- Reading log no longer counts a page when the screen is re-laid out (resize, fonts loading, reopening), only on real page turns (#29).
- Damaged or hand-edited saved data and imported backups can no longer inject markup via highlight values or break My notes with unknown themes, bookmarks or phrases (#29).

### Removed
- Unused `ALIGN` data from every play (about 360 KB less to download and cache) (#29).
- Inactive account-sync code from the reader (#29).

## [1.2.0] — 2026-11-07

### Added
- Select a phrase on the page: press and hold a word, drag to extend, tap another word to move the nearer end; a bar offers colour, note, save and Speech tools (#28).
- Five highlight colours per favourite phrase (rose, yellow, green, blue, violet); tap a saved phrase to recolour, edit its note or remove it (#28).

### Changed
- Press and hold on a word now selects a phrase; speech tools open from the selection bar, by right-click on a computer, or by pressing and holding outside the original lines (#28).

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

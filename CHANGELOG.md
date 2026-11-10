# Changelog

Semver. Rules in `CLAUDE.md` → Versioning. Newest first.

## [Unreleased]

## [2.15.0] — 2026-11-10

### Added
- Julius Caesar, on the Tragedies shelf: the Project Gutenberg text with modern English for all 826 speeches, story beats, notes, a 191-word glossary and the full Study set: scene summaries and quizzes, cast profiles, 80 key quotes in 8 themes, Brutus's path (each step from Cassius's first hint to Philippi), a resolve-and-doubt chart, character map, context, critics, imagery and essay plans. Checked against the uploaded SparkNotes and CliffsNotes guides (#56).

## [2.14.1] — 2026-11-10

### Fixed
- Antony and Cleopatra checked against a study guide: how Caesar brings down Lepidus in the Act 3 summary, a Time span key fact, fuller foreshadowing (the serpent talk that points to the asp), a new symbol (Antony's changing cloud) and a clearer modern line for 'salad days' (#55).

## [2.14.0] — 2026-11-10

### Added
- Macbeth, on the Tragedies shelf: the Project Gutenberg text (witches' chants shown as songs) with modern English for all 681 speeches, story beats, notes, a 326-word glossary and the full Study set: scene summaries and quizzes, cast profiles, 92 key quotes in 9 themes, the prophecies (each one and how it comes true), a power-and-guilt chart, character map, context, critics, imagery and essay plans. Checked against the uploaded SparkNotes and CliffsNotes guides (#54).

## [2.13.1] — 2026-11-10

### Fixed
- Hamlet, A Midsummer Night's Dream and Othello checked against study guides: corrected facts and filled gaps in scene summaries, cast notes, key facts and quizzes (e.g. when Iago first suspects Othello and Emilia, the full sequence of Hamlet's and Othello's last scenes, Oberon's claim on the changeling boy), clearer modern English for a few puns and lines, and new motifs and a Hamlet 'Certainty and truth' theme (#53).

## [2.13.0] — 2026-11-09

### Added
- Hamlet, on the Tragedies shelf: the Project Gutenberg text with modern English for every speech, story beats, notes, a 326-word glossary and the full Study set: scene summaries and quizzes, cast profiles, 84 key quotes in 9 themes, Hamlet's path to revenge (every chance he takes or misses), a resolve-and-action chart, character map, context, critics, imagery and essay plans (#52).

## [2.12.0] — 2026-11-09

### Added
- A Midsummer Night's Dream, the fourth Comedy: full text (Project Gutenberg) with modern English for every speech, story beats, notes, glossary, 68 key quotes, scene quizzes and the full Study set (Explore, exam writing, drills) (#51).

## [2.11.2] — 2026-11-09

### Changed
- The whole app (shelf and every play) no longer zooms on pinch or double-tap, so a stray gesture can't knock the page out of place. Aa still sets the text size, and pinching in the reader still steps it (#50).

## [2.11.1] — 2026-11-09

### Fixed
- Reader: prose speeches now run on as a paragraph instead of keeping the printed edition's line breaks, so no more hanging indents or single words stranded on their own line (#49).

## [2.11.0] — 2026-11-09

### Removed
- Settings: Fit verse lines. The Shakespeare text no longer shrinks to fit verse lines; every speech is shown at your chosen text size (#48).

## [2.10.1] — 2026-11-09

### Fixed
- Reader: with Fit verse lines on, prose speeches are now the same size as verse instead of larger (#47).

## [2.10.0] — 2026-11-09

### Added
- Reader: story beats for all 7 plays. A thin rule with a one-line note sits before the speech where the action turns, so you always know what is happening (#46).
- Contents › Beats: every beat of the play, act by act; tap one to read from there (#46).
- Settings: Story beats on/off (shared across plays; hidden on a clean page) (#46).
- `docs/study-research.md`: research on effective ways to learn Shakespeare, mapped to prioritised Study features (docs only).

### Changed
- Build: `tools/build.js` checks every play's beats (each scene covered, each beat anchored to a speech in that scene, in order) (#46).

## [2.9.0] — 2026-11-09

### Added
- Reader: tap any part of a speech and its modern English unfolds right under the lines; tap again to fold it. "Whole speech" and "Meanings & notes" sit in the unfolded note (#45).
- Reader: Fit verse lines (Settings, on by default). The Shakespeare text shrinks just enough that most verse lines fit on one line, never below 14px; prose is unchanged (#45).
- Reader: the first time a character speaks, a one-line note under their name says who they are. Tap any speaker's name for more (#45).
- Reader: "Before you read" sheet with the setting, the story so far and The Argument (folded) (#45).

### Changed
- Reader: slim scene opener. Title, place, who's on stage and the read-to-find-out question sit above the first lines, so the play starts on page 1 (#45).
- Reader: on tablets, Both shows Shakespeare and modern English side by side, each part level with its lines (#45).
- Speech tools: meaning first (modern English, word meanings, notes), then one compact row of mark and share buttons; themes, verse lab, director's choices and thought track fold away (#45).
- Settings: The Argument now appears at the end of each scene instead of before it, so it no longer gives away the read-to-find-out answer (#45).

### Fixed
- King Lear and Twelfth Night saved shared settings (theme, text size, page turn…) under the wrong key, so they didn't follow the other plays. They are moved over once (#45).
- Tablet: opening the speech side panel no longer hides the top bar, page slider and bottom nav behind it (#45).

## [2.8.0] — 2026-11-09

### Added
- Learn → Explore → Director's choices: six key moments per play, each with three ways to stage it and what each does to the audience. Your choice and reason are saved, and the speech tools show the choice too (#44).
- Speech tools: a thought track. Write what the character is really thinking and add it to your note (#44).
- Practise drills: Cut the scene (keep half the lines, then see which key quotes or plot points you lost) and Two-line scene (sum up a scene as one line for each main character, then compare) (#44).

## [2.7.0] — 2026-11-09

### Added
- Verse lab in every speech's tools: verse or prose, a beat count for each line with notes on short, long and shared lines, rhyming couplets, and a punctuation walk (#43).
- Learn → Explore → Verse and prose: how much of the play (and each main character) is in verse, characters who switch between verse and prose in a scene, shared lines, and scenes that end in a rhyme, plus the verse lab on any key speech (#43).
- Practise drills: Word detective (guess an old word's meaning from its line), Untangle (put inverted word order into everyday order), Pun hunt (puns, words used as a different part of speech, malapropisms) and Tone and stress (lean on different words and see how the meaning changes). The puzzles are written for all 7 plays (#43).

## [2.6.0] — 2026-11-09

### Added
- Study → Write → Extract: an exam-style extract question built around a key line. Tap lines to tag methods, check them against the app's notes, use the "Elsewhere in the play" quotes, and write against a 15-minute timer (#42).
- Study → Write → Paragraphs: a labelled model paragraph for every exam question in all 7 plays, a faded one to finish, then your own (#42).
- Mark your writing against the assessment objectives in the Essay planner, Extract and Paragraphs, with a level estimate and a suggested next step. GCSE AO1–AO4 by default; A-level AO1–AO5 in Settings → Exam level (#42).

## [2.5.0] — 2026-11-09

### Added
- Reader: each scene opens with one question to read for, and the end-of-scene quiz asks whether you found out (#41).
- Learn: Themes, Profiles, Act summaries and the main Explore pages have "Test yourself first": the page blurs while you write what you remember, then you compare (#41).
- Practise → Review: a Today's plan (items due, scenes to read for your exam date, one shaky or unquizzed scene) and a short "look back" after each session; next time it reminds you what you said you'd work on (#41).
- Quizzes: predict your score before you start and see how close you were (#41).

## [2.4.0] — 2026-11-09

### Added
- Practise → Learn a part: learn a character's lines from a cue script, the way Shakespeare's actors did. See only the last words before each of your lines, say your part aloud, then check; hints go from the meaning to first letters. Best score per scene is kept, and parts you miss join Daily review (#40).

## [2.3.0] — 2026-11-09

### Added
- Practise → Review: a daily mixed session of everything due (who said it, finish the quote, which theme, which act, and quiz questions from scenes you have read) plus a few new items; predict your score first and see how close you were (#39).
- Library: a Daily review card with the number of items due in each play, linking straight to that play's Review (#39).
- Flashcards: a second card type, Finish the quote; decide whether you're sure before turning a card (#39).
- Quizzes → Mistakes review: "Sure but wrong" lists confident mistakes first (#39).

### Changed
- Flashcards: a quote counts as learnt once you know it on 3 different days; review gaps shorten as your exam date gets close (#39).

## [2.2.4] — 2026-11-08

### Fixed
- Practise → Memory ladder: the quote picker no longer shows the quote's words while you drill it; quotes are listed by number, speaker and scene (#37).
- Practise → Fill the gap: only hides words that appear once in the quote, so the answer isn't printed elsewhere in the line (#37).
- Practise → Who said it?: skips quotes where the speaker names themself, and draws wrong answers from every quoted character so a minor character is no longer the obvious odd one out (#37).
- Quizzes: answer order is shuffled each time; the right answer was usually the second option (#37).

## [2.2.3] — 2026-11-08

### Removed
- The small arc (⁀) after rhyming couplet lines in the reader, across all plays (#36).

## [2.2.2] — 2026-11-08

### Fixed
- Settings → Line spacing now changes the reader text (original and modern); a leftover style had pinned it at Normal (#35).

## [2.2.1] — 2026-11-08

### Fixed
- Page curl now works in Paper themes too; Settings → Page turn adds Instant for e-reader-style turns with no motion (#34).
- Dragging a page on iPhone: the reader claims the touch before Safari can take it as a scroll, so the curl follows your finger (#34).
- Speech and other sheets close by pulling them down from the grab bar or header, as well as with Done (#34).

## [2.2.0] — 2026-11-08

### Added
- Realistic page curl: hold a page near its outer edge or a corner and drag; it bends along your finger with a shaded fold, faint show-through on its back and a shadow on the page beneath, then finishes the turn or springs back when you let go. Taps, swipes, keys and the scroll wheel curl too. Settings → Page turn switches back to Slide; Paper themes and reduced motion stay instant (#33).

## [2.1.0] — 2026-11-08

### Added
- King Richard II, the first play on the new Histories shelf: the Craig (Oxford) text from Project Gutenberg with modern English for every speech, notes, a 215-word glossary and the full Study set: act summaries and quizzes, cast profiles, 69 key quotes in 9 themes, Bolingbroke's rise, power chart, character map, context, critics, imagery and essay plans (#32).

### Fixed
- Power chart: act labels no longer overlap when an act has only one scene (#32).

## [2.0.1] — 2026-11-08

### Changed
- New app icon: a gold open folio with a quill on charcoal, sized to sit inside Android's round icon mask (#31).

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

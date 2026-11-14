# Changelog

Semver. Rules in `CLAUDE.md` → Versioning. Newest first.

## [Unreleased]

## [4.17.0] — 2026-11-14

### Added
- Practise: four new drills built from each play's own lines, each a scored round under the practice frame:
  - Which scene? (place 8 key quotes in their scene) (#PR)
  - Who speaks next? (read a cue, then pick the next speaker from four medallions; the answer shows their reply) (#PR)
  - Quote timeline (three rounds: put 4 key quotes in the order they're spoken) (#PR)
  - Odd one out (three quotes share a theme: find the one that doesn't) (#PR)
- Which scene? and Quote timeline also sit on the Quotes topic (#PR)
- Missed Which scene? quotes join Daily review as act questions; missed Odd one out quotes join it as theme questions (#PR)

### Fixed
- Drill rule cards and Practice hall action icons drew too small (#PR)

## [4.16.0] — 2026-11-14

### Added
- Practise: a Practice hall opens the topic: one big Session card, Daily review (gold when items are due) and the next scene quiz, then every drill as a tile with a best-score ring, then Flashcards, Learn a part and Quizzes (#129)
- Drills: every drill now runs as a round (8 quotes, 8 words, 5 passages, 3 order sets, 3 scenes…) under one frame with progress pips, score and a streak, and ends on a wreath with your best score, a New best seal and the lines you missed to look at again (#129)
- Drills: quotes missed in Fill the gap, Who said it? and Memory ladder join Daily review (#129)

### Changed
- Quizzes, Learn a part, Review and Session use the same pip frame, pinned while you scroll (#129)
- Fill the gap: a dash under every missing letter, a First letters hint, and a second try that keeps the words you got right (#129)
- Who said it?: four character medallions to choose from (#129)
- Put it in order: placed events sit in numbered slots and can be dragged to a new place or tapped back; the answer shows as a timeline with each event's scene and where you put it (#129)
- Memory ladder: choose a quote from a searchable list (seals mark quotes typed word for word and quotes learnt) instead of a drop-down; the four steps show as pips (#129)
- Explain this line and Two-line scene: rate yourself after comparing; Tone and stress counts the readings you've heard (#129)
- Practise topic: the ring shows overall mastery (quiz scores, quotes learnt, drill bests) (#129)

## [4.15.1] — 2026-11-14

### Fixed
- Act summaries: Print and Copy did nothing in the iPhone home-screen app. One Share button now opens the system share sheet with every act's summaries as text (Notes, Mail, Copy, Print); where sharing isn't available it reads Copy all; Print shows only where the browser can print (#127)

## [4.15.0] — 2026-11-14

### Changed
- Act summaries: one act per screen under a sticky act ribbon (I–V with a read-progress bar each), a slim act header and a row of scene seals (day/night dot) that jump to each scene; Previous/Next act at the foot (#126)
- Act summaries: each scene has a slim header (woodcut thumbnail, wax seal when read, medallions of who is on stage), opens with its first sentence as a lead line and runs the rest of its summary as a numbered timeline (wording unchanged) (#126)
- Act summaries: key points always show as "Why it matters" notes (a margin column on wide cards), and each scene's key quotes sit under it as evidence rows that open the preview slip; quoted phrases link to the text (#126)
- Act summaries: Full / Outline replaces Cards / List (Outline = each scene's lead line only; remembered in `folio-actview`); Print shows every act; "Act summary" links from scenes and quizzes open at that scene (#126)

## [4.14.0] — 2026-11-14

### Added
- Library: tapping a shelf cover pulls the book out toward you (lift, tilt and a foil sweep; a gilt outline with reduced motion) (#125)
- Shelf headers: a row of seals, one per play (gilt when begun, red wax when finished), beside the play count (#125)
- Desktops (1200px+): a sticky sidebar beside the bookcase holds the masthead, Continue, Daily review, the genre tabs (stacked) and Order; the case shows five covers a row (#125)
- Theme button: hold it (or right-click) for all four themes (#125)

### Changed
- Lectern: shows only Continue reading and, when items are due, Daily review (a wax seal with the count); This week stays on You; with nothing begun and nothing due the lectern is hidden and the shelves start higher (#125)
- Theme button: a sun for Light and Paper, a moon for Dark and Night, with the theme's name beside it from tablet width (#125)

## [4.13.1] — 2026-11-14

### Removed
- Library: the Word of the day card (and its "Word" row on phones) is gone; Today keeps This week and Daily review (#124)

## [4.13.0] — 2026-11-14

### Added
- Library "Bookcase": the three Folio shelves stand in one wooden bookcase (cornice, plinth, a plank under every row); every play is on show, three across on phones, four on tablets, six on desktops (#123)
- Sticky gilt genre tabs (Comedies, Histories, Tragedies) under the masthead: tap to jump to a shelf, the shelf in view is lit; Order (Recent, Date written, A–Z) is a menu in the same bar (Full mode); a search button joins the bar once it pins (#123)
- Begun plays wear a red bookmark ribbon with their % read on the shelf; finished plays a gilt ribbon (#123)

### Changed
- Library top: Continue reading and Today share one wood-framed lectern (side by side from tablet width; Today alone when nothing is begun); the masthead has a visible Search field (#123)
- Narrow phone covers show the title alone on the plate so the emblem stays in view; the full title is on the detail sheet (#123)

### Fixed
- Word of the day: the illuminated initial showed as a blank red tile (#123)

## [4.12.4] — 2026-11-14

### Fixed
- Tablet and desk: Northumberland's name in the left margin no longer runs into the verse; very long single-word names are set slightly smaller (#122)

## [4.12.3] — 2026-11-14

### Removed
- Library home: the Line of the day card (and its "Line" strip on phones) is gone; Today keeps Word of the day, This week and Daily review (#121)

## [4.12.2] — 2026-11-14

### Fixed
- Phones: the Irony, device, Soliloquy and note chips after a run-in speaker name no longer slide back over the name; they sit after it and wrap with the line (#120)
- Marks in prose: the margin tick no longer lands mid-text on each printed line; a marked prose part gets one tick down the margin (#120)
- Soliloquies and asides: a marked line inks the speech's margin rule instead of drawing a second tick beside it (#120)
- Phones and tablet portrait: the raised initial on a scene's first speech keeps clear of the speaker and note row above it; prose key-quote fleurons sit tight to the words; Irony and device chips show one ornament (#120)

## [4.12.1] — 2026-11-14

### Fixed
- My notes: every speech row now has Remove (with Undo), so a speech you only theme-tagged in Speech tools can be cleared; such rows say "Theme tag from Speech tools"; empty saved records are dropped on load; removing a phrase also offers Undo (#119)

## [4.12.0] — 2026-11-14

### Changed
- Reader highlighting is one Marks system: five named inks (Evidence, Favourite, Confusing, Theme, Language) for whole speeches and for words; rename an ink by pressing and holding it (applies to every play); existing highlights and favourite phrases keep their colours (#118)
- Marks look like a soft hand-drawn marker band behind the words, with a small tick in the margin; tuned for Light, Paper, Dark and Night (#118)
- Selecting: press and hold a word, then drag or use the ink-drop handles (word by word, across lines); press and hold a speaker's name to select the whole speech; right-click works on a computer (#118)
- A floating pill by the selection replaces the selection bar and the speech pill: one tap on an ink saves (Undo in the message), the same ink again removes; Note, Copy, Speech/Modern and More (Speech tools) (#118)
- My notes lists speech marks and marked words together in play order, with ink filter chips and counts and a Has note chip; Copy, Print and the revision sheet name each ink (#118)

### Added
- Settings › Marks on the page: Full, Ticks only or Off, for every play (#118)

### Fixed
- Pressing and holding a run-in speaker name on a phone no longer selects the first word of the line; My notes no longer shows "undefined" for a phrase saved without its text (#118)
## [4.11.0] — 2026-11-13

### Added
- Session mode: 10 mixed questions (who said it, finish the quote, theme, act, scene quiz; due items first) from Review, the Practise page and the five-minute plan; ends with a laurel score and a Look again page linking every missed quote and quiz question to its lines (#117)
- Review and sessions share one frame: progress pips (right, missed, current) and the running score (#117)
- Flashcards: Finish the quote shows the speaker's medallion; Who said it shows a blank medallion; the back shows the medallion, scene, the speech in modern English and the note (#117)

## [4.10.0] — 2026-11-13

### Added
- Symbol tracker: an act-by-symbol heat strip above the lists; tap a cell for the speeches as preview rows (#116)
- Critics: a timeline of every dated critic, coloured by theme; tap a dot to jump to the card (#116)
- Theme pages: "Through the play", a bar per act of the theme's key quotes; tap an act for its quotes (#116)
- Arcs chart: every scene point is tappable and opens the scene (#116)
- Glossary: each word shows the line it is first used in, with the word marked, opening the preview slip; the A–Z rail stays at the top while you scroll (#116)

### Changed
- Context drawers show a one-line preview while closed; Director's choices say "every option is defensible" once instead of under every card (#116)

## [4.9.0] — 2026-11-13

### Added
- Study home: a Today hero (pick up where you were, a five-minute plan of three steps, cards due) above the eight topics as illuminated contents rows with progress rings, a one-line preview and live progress (#115)
- Topic pages: a live panel for each topic (act ribbon with every scene read, word of the day, practice stats, an exam question to try with its starting quotes) and every tool as a described row in two columns (#115)

### Changed
- Study footer: one slim Up next row, the other follow-ons in a More sheet, and Back to the scene you were reading (#115)
- Simple mode: the same redesign, trimmed: quests stay on top; the Write topic, critics, essay planner, extract and paragraphs are hidden (#115)

## [4.8.0] — 2026-11-13

### Added
- Study is linked to the text everywhere: every quote, device, insult, glossary word, drill and flashcard carries a scene chip (act.scene and speaker) instead of "Read in context" (#114)
- Preview slip: a chip opens the lines in place (original with the line marked, its modern English, key-quote themes) with Open in play; in the reader a "Back to Study" pill returns to the same item, its drawer open (#114)
- Evidence speeches for all 36 plays: each Context item and each critic has 1-3 speeches from the play (2,137 in all, picked and checked against the text), shown as "Where the play shows it" and "Test it on" rows (#114)
- Quoted phrases and act/scene mentions in Key facts, Context, Critics, Character analysis, Motifs, Symbols, Contrasts, Insults and Big questions link to their lines (#114)
- Big questions show their evidence quotes as preview rows with a count on each question (#114)

### Fixed
- Revision sheet: quotes open with “ instead of a closing mark (#114)

## [4.7.0] — 2026-11-13

### Added
- Reader "Pocket edition" (audit 10), no content changes: each scene opens on an illustrated title page (woodcut stage vignette by setting, night or day sky, act and scene, full place, first story beat, cast playbill, Before you read); the text starts on the next page (#113)
- Act divider pages: the play's emblem in a laurel wreath, the act in Latin and English, and its scenes with places (#113)
- Woodcut ornaments: urn tailpieces on title, act and end pages; margin marks for asides (pointing hand) and soliloquies (asterism) (#113)
- Crimson Pro (self-hosted, OFL) for modern English, notes and sheets (#113)

### Changed
- Verse lines fit the page live on every screen (Settings › Fit verse lines, on by default; never below 14px); prose follows the same size (#113)
- Tighter spacing between speeches; raised initial on phones; character intro is one italic line (#113)
- Slimmer menus: 56px bottom nav, no icon rings, current tab in red (#113)
- Speech tools: speaker named once, Modern tab shows only the modern English (#113)
- Dark and Night: candlelit page (warm black, glow, gilt beats, initial and ornaments) (#113)
- Desk: wider spread with a wider gutter; the rail folds into roundels on the spine (desk edge on one leaf); one rule under the running head on one leaf (#113)

### Fixed
- Inconsistent indents on wrapped verse; drop cap orphan line; duplicated cast medallions; laid-paper chain lines showing as stripes; place names cut with an ellipsis in the opener (#113)

## [4.6.0] — 2026-11-13

### Changed
- Reader "Printed page" (audit 9), no content changes: on desk the running head, page numbers and time left now sit inside the book's margins, with classic book margins (top, outer, foot) and the dog-ear on the page corner (#112)
- Desk: opening a sheet or panel keeps the book; it slides beside the panel as two leaves when there is room, otherwise one bound leaf, and the menus stay hidden (#112)
- Pages fill more fully: a speech part splits at a line when a page would be more than 10% empty (was 25%) (#112)
- Phones: the speaker's name runs in at the start of the first line in red small caps, as in the Folio (#112)
- No rules between speeches; the scene opener is one band with the first story beat and a single "Before you read" button (#112)
- Speech tools is one card with the speaker pinned and four tabs (Modern, Words, Note, Mark) (#112)
- Word meanings open as a parchment slip pointing at the word; key quotes open as a display card with the speaker's medallion, the theme's emblem and an icon row (#112)
- End of scene: on desk it spreads across the opening (seal and Next on the left, the Argument and predictions on the right); on phones the Argument folds (#112)
- Desk page turns flip the leaf at the gutter (off with reduced motion) (#112)
- Illustrated empty state for My notes; old-style figures and ligatures; candlelit page with a soft vignette in Dark and Night; Both mode on tablet portrait shows the modern English under each part (#112)

## [4.5.1] — 2026-11-13

### Removed
- The catchword (next page's first word) at the reader's page foot (#111)

## [4.5.0] — 2026-11-13

### Changed
- Reader "Folio page" (audit 8), no content changes: every page has a running head (play, act and scene), a centred page number, a catchword (the next page's first word) and the time left in the scene at its foot (#110)
- Verse turnovers hang indented; Settings › Type gains "Fit verse to the page" (largest size, never under 14px, at which most verse lines fit on one line) (#110)
- Tablet and desk set speaker names in the left margin as red small-caps rubrics, as in the Folio; line numbers move to the right margin; phones keep the name above (#110)
- The scene's first letter is a three-line illuminated initial on foliage, with no box (#110)
- Modern English opens as a parchment slip with a tab under the tapped part; the page reflows so the slip is never clipped, and the reader moves to the page that holds it (#110)
- Long-press shows a floating pill over the speech (three highlight colours, Note, Copy, Modern, More); More opens the full Speech tools (#110)
- Phones have one bottom bar (page slider, count and nav) with the ribbon as its top edge (#110)
- Sheets: one phone height with a tap on the grab bar to go full; on tablet and desk they open as a right panel beside the page, never over it. Settings has tabs (Page, Type, Theme, App) with the live preview pinned on top (#110)
- Both mode on wide screens (1000px+) shows Shakespeare on the left page and modern English on the facing page (#110)
- Desk book: the page stack thickens on the left as you read, the ribbon is a short tail at the gutter top, and the menus float as pills off the book (#110)
- Bookmarked pages show a red ribbon; a dog-ear at the bottom-right corner turns the page (hold it to bookmark) (#110)
- Story beats sit centred between rules with a fleuron; Enter directions show small cast medallions (tap for who it is); Night uses warm text and a little more line height (#110)

### Fixed
- Pagination no longer fails on a page index past the scene's end (#110)

## [4.4.0] — 2026-11-13

### Changed
- "Folio bound" look (audit 7), no content changes: emblem roundels on the map, top bar and play You now sit on the play's cloth colour with a gilt rim, as on its cover (#109)
- Reading voice: notes, character intros, modern English and summaries are set in a book serif; upper-case sans tags (Note, Prose, themes, quiz labels) become red small-caps rubrics with a fleuron (#109)
- Reader scene opener is a slim headpiece band (stage vignette, act and scene, place, Before you read); the act strip shows only at act starts (#109)
- Stage pictures show a night sky (stars, moon) or a day sun, taken from the place, stage directions and opening lines (#109)
- Phone top bar shows "I.i · Elsinore" in small caps; the page fades out above the bottom bar so the ribbon never covers a text line (#109)
- Phone shelf: one-row hero (cover, title, ring) with a full-width wax Resume; Today folds to a one-line ticker you tap to open, so the shelves start on the first screen (#109)
- Contents rows carry the number in the seal, with slim plate strips for acts; Search has a gilt clear button, genre pills on one scrolling row and gilt-ruled result cards (#109)
- Play You shows three seal badges (scenes, quiz, quotes) with reading time folded into the level card; quizzes show scene seals (empty, red, gilt) and a laurel for an act at full marks (#109)
- Study: Pick up is a bookmark-ribbon card and Next step a wax card; section heads are printer's headpieces (#109)
- Desktop two-page spread sits on a leather desk with page-stack edges, a deeper gutter and a ribbon bookmark; the rail uses roundel buttons (#109)
- Dark and Night get a warm candle glow and vignette; Light and Paper get faint laid-paper lines and hand-cut card rules (#109)
- Detail sheet: larger cover with a foil sweep, the blurb as an epigraph, a wax Begin bar and ghost pills; welcome covers are dealt in with a wax Next; seals stamp in on the map when newly earned; press-down feedback on buttons and seals; all motion off with reduced motion (#109)

### Fixed
- The bottom nav no longer covers the last row of Study topic pages and other views: every view keeps nav height + 24px clear at the bottom (#109)

## [4.3.2] — 2026-11-13

### Fixed
- Shelf Today cards swipe smoothly again: every card shares one height, so the stack no longer resizes mid-swipe (#108)

## [4.3.1] — 2026-11-13

### Fixed
- Shelf Today cards: a swipe could also scroll the stack up and down on iPhone, cutting off a card's title and leaving a gap below it. The stack now scrolls only sideways, resets to the top of each card and fits again once the fonts load. The stacked edge under the card is a light rule, not a second frame (#107)

## [4.3.0] — 2026-11-13

### Changed
- The whole app now uses the Illuminated folio style. Shelf home: the Continue card puts the play on a stage, with its emblem as the scenery, a gilt progress ring and a wax-seal Resume button. Line of the day sits on a parchment scroll with the play's emblem, Word of the day has an illuminated initial, This week shows a wax seal for each day, and Daily review shows its count on a seal (#106)
- The shelves are wooden planks with a brass plaque for each genre (masks, crown, skull). On desktop the shelf is full width, with Continue and Today side by side above the bookcase (#106)
- Shelf You: the level medallion sits in a laurel, the five levels climb as a staircase, the stats carry icons, read days show as wax dots, and a new Your plays list gives each begun play its seals (#106)
- Search has a quill field, genre pills in each genre's colour with its icon, and a cloth thumbnail with the emblem on each play's results (#106)
- Journey map: each act is a region of landscape with its own tint and terrain (hills, forest, sea, towers, mountains), its act plate stands between gate pillars, and a pin marks where you are. On tablets and desktops the play's details sit in a left column beside the map (#106)
- Reader: a compact stage banner opens each scene, with the act plate (or a small scene plate) over its foot. The first speech of a scene starts with a drop cap, and a fleuron tailpiece ends each scene (#106)
- Reader chrome: the top bar carries the play's emblem and the place in small caps, buttons are round, the bottom bar has a red ribbon for the whole play with a gilt tick at each act, and the long-press tools are a grid of icon buttons (#106)
- Contents: scene rows show a seal and a stage thumbnail, acts open under plates with a wax numeral, the cast is a grid of medallion cards, and Beats is a road. Settings: each option is a card with an icon, theme swatches look like pages, and a live preview at the top shows your page. Play You/Me: the Continue card carries the emblem in a gilt ring, the level medallion sits in a laurel, the act-by-act seals rest on wooden shelves, and wide screens use two columns (#106)
- Navigation: tab icons are roundels and the current tab is a wax seal with a gilt rim. Views fade in, sheets rise, and gilt rays burst behind a seal stamped at the end of a scene. All motion is off with reduced motion (#106)

### Fixed
- Card decks (Key quotes, Act summaries and the others) are as tall as the card in view, not their tallest card, and key quotes over about eight lines are clamped with Show all. The shelf's Today stack also fits the card in view (#106)

## [4.2.0] — 2026-11-12

### Changed
- Study looks like an illuminated folio: one header bar per screen (the STUDY title only on the Study home), topic and theme pages open under a banner with a scalloped valance, a lattice in the topic colour, the emblem as a watermark and a laurel round the progress ring (#105)
- Reading tools are drawn, not just written: the plot timeline is a road with act plates as gates and a seal at each stop, Key facts is a playbill with an icon per fact, Context is a cabinet of illustrated drawers, Critics are scroll cards with the year as a badge, the glossary has a one-row sticky alphabet and an illuminated initial for each letter, and Analysis, Context and scene summaries open with a drop cap (#105)
- The character map uses medallions, curved coloured arrows and a larger canvas, and a medallion opens that character's page. The resolve and action chart has filled areas, act bands and filled dots for scenes you have read (#105)
- Character pages show lines, speeches and scenes as round badges, plus a map of that character's relationships. A theme's road winds, with seals for its three stops. Act summaries open with the act plate in front of the stage picture, and the act's key quotes show their speakers' medallions (#105)
- Practise: each drill opens on a one-line rule card, drills have icons, flashcards sit on a stack and turn over when you check, scene quizzes are a grid of seals per act that fill with your best score and turn gilt at full marks, the whole-play quiz is a laurel banner, and scores show inside a laurel wreath that turns gold at full marks (#105)
- Daily review shows today's reviews as a ring and your last 14 days of study as seals (#105)
- Writing tools sit on parchment with seals for steps; the essay outline and the revision sheet are printed folio pages with a running head and red headings (#105)
- "Test yourself first" is a covered-eye button in the header; the Related links are one Next card with the rest under More (#105)
- Filters, toggles and act chips are pills in the topic colour (never black), selects match, and Dark and Night are warmer, with a candlelit glow and no bright Next card (#105)
- A topic or theme with no progress shows a Begin badge instead of an empty ring; a full ring turns gilt (#105)
- Tablet and desktop: tools show in two columns, with Next and a line to remember in a side column; decks show two or three cards; the Study home has larger tiles (#105)
- Pages rise in when opened, and full rings and full marks get a short celebration. All motion is off with reduced motion (#105)

## [4.1.0] — 2026-11-12

### Changed
- Study opens on eight illustrated topics (Story, People, Themes, Quotes, Words, Practise, Write, Revise), each with its own emblem, colour and progress ring. Simple mode shows your quests as swipeable cards above them (#104)
- Each topic is a page of small tool tiles with an icon and a name; every tool opens full screen under one header (back to its topic, the title, and a ? for how it works). The section chip rows are gone (#104)
- Intros are one line; the full how-to opens from the ? button (#104)
- Key quotes are swipeable cards with the speaker's medallion; tap a speaker to filter. Act summaries are scene cards (stage picture, seal, summary, key points) under each act plate. Both have a List view, remembered on the device (#104)
- The Essay planner, Profiles and step 3 of Paragraphs go one step per screen with a progress bar, then show the whole outline, tap any line to edit it. Saved plans and profiles are unchanged (#104)

### Added
- A page for each character: portrait medallion, who they are, lines and scenes, their key quotes as cards, analysis, and links to their profile and part (#104)
- A page for each theme: an emblem, quotes learnt, and its course through the play as three stops (beginning, turning point, ending) with quote cards and what critics say (#104)

## [4.0.0] — 2026-11-12

### Added
- Two app modes, Simple and Full, for every play (Settings, and You on the shelf). New readers start in Simple; anyone with saved reading stays in Full. Nothing saved changes (#103)
- Simple mode: three tabs (Library, Play, Me), Study opens on Quests with every tool under All tools, and the page hides line numbers and study-note tags (#103)
- Welcome: three cards on a first visit (the Folio, how reading works, seals and levels) ending with "What brings you here?" (enjoy, exam or both) (#103)
- First-scene tips in Simple: four short tips, one at a time, each done when you try it (#103)
- Journey map for each play: the scenes as a road with act title plates as gates, a seal at every scene read, quest dots, Continue; it opens on a first visit to a play, from the Play tab and from Contents (#103)
- Wax seals and levels: a red seal for each scene read, a gilt one when its quests are done; levels from Groundling through Hired Man, Player and Sharer to Master of the Revels, counted across every play (#103)
- Quests for each scene read: Recap, a three-question Check and Key quotes (#103)
- Scene-end card on a page of its own: the seal stamps, Check yourself (3 questions), a large Next scene button (#103)
- Graphics: act title plates and a large stage picture (proscenium and curtains) on scene openers, cast medallions in Before you read, Contents › Cast, name cards and first entrances (#103)
- Shelf: Today is one swipeable card stack (Line, Word, This week with your level, Daily review); You shows your level and the app mode (#103)

### Changed
- Bigger covers on the shelves (#103)
- Simple mode hides the shelf's sort and genre chips (#103)

## [3.1.1] — 2026-11-12

### Changed
- Settings › How to read is now a short list, one line per gesture with an icon, in four groups (Turning pages, Understanding, Marking, Text size) that fold away (#102)

## [3.1.0] — 2026-11-12

### Added
- Cross-links everywhere: character names in the reader open a card linking to their Profile, Key quotes, Analysis and part; glossed words link to the Glossary; each Study section ends with a Related row; Act summaries link every scene, quote and scene quiz; quiz, review and flashcard answers link back to the scene or speech; the tracker steps link to their scenes; play You stat tiles open their sections; Contents › Cast links each character to Study (#101)
- Key quotes are marked in the reader with a red ❦ at the line where they start; tapping it opens a quote card with its themes and links to the theme, the speaker's quotes and flashcards (#101)
- End of each scene: Scene summary and Next scene buttons (#101)
- Study home: Pick up (your last section) and Next step (due reviews, a quiz on a scene you've read, or the scene you're on) above the four cards, which now have progress bars (#101)
- Desktop (1400px+): a slim rail of reading tools beside the pages; two-page view has running heads (play title over the left page, act and scene over the right) (#101)
- Shelf search also finds glossary Words and Key quotes, shown above the speech results (#101)
- Shelf detail sheet links to Key quotes, Characters, Act summaries and Your notes; Word of the day links to that play's Glossary (#101)
- Deep links: `#study=<section>` keeps its section, `#study=explore:<part>[:<word>]` opens an Explore part (and a Glossary word) (#101)

### Changed
- The back gesture now steps back through where you went (Study section → Study home → reader) (#101)
- Study in the bottom bar returns to the section you were last in; tap it again for the Study home (#101)
- Phone shelf: a compact Continue card (Study as a link) and a shorter Line of the day, so the first shelf shows on the first screen; Word of the day, This week and Daily review move under the shelves on phones and tablets (#101)
- The red ◆ after a speaker is now a "note" tag that opens the study note (#101)
- Two-page view: a speech part may continue on the next page when keeping it whole would leave over a quarter of the page empty (#101)

### Fixed
- Two-page view: line numbers on the left page were cut off (#101)
- Desktop: Study and You were squeezed to the left after reading in two-page view (#101)
- Themes: the coverage bars were missing and the table was misaligned (#101)

## [3.0.1] — 2026-11-12

### Fixed
- The text-size preview in Settings and on the You tab now grows and shrinks with the slider, at the reader's real text size (#100)

## [3.0.0] — 2026-11-12

### Changed
- New look for the whole app, "Folio print": ivory paper, black ink and red rubrics as in the 1623 printing, double rules, Fell type for titles, buttons and labels. One set of design tokens (`folio.css`) now styles the shelf and every play, so they always match. (#99)
- Library home redesigned: a Continue reading card with the play's cover and progress, one Today card (line of the day, word of the day, this week), then all three genre shelves on the home screen (no extra tap into a genre). Tapping a cover opens its detail sheet (Begin/Continue, Contents, Study, Mark as not started). Wide screens show the reading desk beside the bookcase. (#99)
- Themes reduced to four, shown as colour tiles: Paper, Light, Dark, Night, plus a "Night after 8pm" switch. Saved choices carry over (Night after 8pm → Auto + switch on; Paper, night after 8pm → Paper + switch on; Paper night → Dark). Text size is a slider with a live preview. Same controls on the shelf and in every play's Settings. (#99)
- Reader: compact scene opener, so the play text starts on the first page on a phone. On stage, Read to find out, setting and story so far now sit behind one Before you read button. (#99)
- Reader: the modern English under a tapped part is a high-contrast card, and a red bar marks the tapped lines. (#99)
- Reader on computers and large tablets (1200px wide and up): two facing pages like an open book. With a mouse, the menus appear when the pointer nears the top or bottom edge. (#99)
- Reader: the first-run guide is three short steps and shows once for the whole app, not once in every play. (#99)
- Study opens on four cards (Learn, Practise, Write, Revise) with your progress. Each card's sections show as buttons that wrap, so none are cut off on a phone. (#99)
- Search: filter by genre or pick one play; results are grouped by play, with counts. (#99)
- Each play's You page shows your stats as tiles, like the shelf. (#99)
- Bottom nav is solid (no see-through), with a highlighted pill for the current tab, and it slides away while you scroll down the shelf. (#99)

### Fixed
- Settings and other sheets no longer stay open when you move to another view. (#99)
- The "Turned to the next page so the part fits" message no longer covers the modern English. (#99)

### Removed
- The "More plays join the Folio" line (all 36 Folio plays are on the shelves). (#99)

## [2.46.0] — 2026-11-12

### Changed
- Shelf covers, third pass: all 36 emblems redrawn as large enamelled gilt badges (gold foil with coloured enamel: red strawberries on Othello's handkerchief, a green asp before a golden sun, Lear's crown split by lightning, a white boar for Richard III, red and white roses for 1 Henry VI…), each filling an ogee arch window with scrolled spandrels across the cover. The epigraph is removed; the genre-shelf spines and the opening curtain show the new emblems. (#98)

## [2.45.0] — 2026-11-12

### Changed
- Shelf covers, second pass: each play's cloth is now foil-stamped all over with its own repeating motif (strawberries for Othello, waves for The Tempest, skulls and rosemary for Hamlet, horseshoes and crowns for Richard III…), the emblem sits in a gilt medallion, the title on a framed plate with the year, and the famous line on a parchment scroll. The foil catches the light as a cover comes forward, the spine carries gilt bands, and the genre-shelf spines show the same patterned cloth. (#97)

## [2.44.0] — 2026-11-12

### Changed
- New shelf covers for all 36 plays: gilt-tooled leather bindings, each with its own emblem (Othello's strawberry handkerchief, Macbeth's dagger, Hamlet's skull, The Winter's Tale's bear, Richard III's boar…), a famous line from the play, a genre badge (comedy mask, tragedy mask, crown), corner fleurons, a year cartouche and a red silk bookmark on plays you have begun. Side covers no longer fade out, the genre shelves show each play's emblem on its spine, and the opening curtain shows the play's emblem. (#96)

## [2.43.0] — 2026-11-12

### Added
- King Henry VI, Part 2, on the Histories shelf: the Project Gutenberg text (eBook #1501; numbered speaker headings, a merged speaker and a misplaced speaker heading in 1.4 fixed, typos corrected, battlefield location set), modern English for all 810 speeches, story beats, notes, a 190-word glossary and the full Study set: scene summaries and quizzes for all 24 scenes, cast profiles, 218 key quotes in 8 themes, York's road to the crown (each step from Anjou and Maine through the Nevilles' oath, the Irish army and Cade's rising to St Albans), a chart of York's power against Henry's authority, character map, context, critics, imagery and essay plans. Placed between The Taming of the Shrew and 3 Henry VI in Date written order. Checked against the uploaded SparkNotes guide (play text wins: York and Buckingham, not Somerset or Suffolk, arrest the Duchess and the spirit answers her questions, not Margaret's; Simpcox names only red and black; Horner dies confessing treason; the spirit foretells death by water, which 'Walter' fulfils; York's army arrives between Dartford and Blackheath; Richard, not York, kills Somerset, and York, not Richard, kills Clifford; the Sergeant episode is not in this edition). (#94)

## [2.42.0] — 2026-11-12

### Added
- King Richard III, on the Histories shelf: the Project Gutenberg text (eBook #1503; empty speaker lines before asides folded in, each ghost at Bosworth named, missing locations set), modern English for all 1130 speeches, story beats, notes, a 265-word glossary and the full Study set: scene summaries and quizzes for all 25 scenes, cast profiles, 255 key quotes in 8 themes, Richard's path to the crown (each step from Clarence's arrest through Anne, Hastings, the princes and Buckingham's fall to Bosworth), a chart of Richard's fortunes against Richmond's, character map, context, critics, imagery and essay plans. Placed between Titus Andronicus and The Comedy of Errors in Date written order. Checked against the uploaded SparkNotes guide (play text wins: Margaret lost one son, Clarence dreams of sailing to Burgundy, Lovel and Ratcliff bring Hastings' head, Buckingham's army is scattered by floods, Urswick is a priest, Blunt carries Richmond's note to Stanley, Hastings' ghost comes before the princes'). (#95)

## [2.41.0] — 2026-11-12

### Added
- King Henry VIII, on the Histories shelf: the Project Gutenberg text (eBook #1541; Globe scene division with five scenes in Act 5, the Prologue opens 1.1 and the Epilogue closes 5.5, the christening song marked, run-in speakers and typos corrected), modern English for all 725 speeches, story beats, notes, a 209-word glossary and the full Study set: scene summaries and quizzes for all 17 scenes, cast profiles, 219 key quotes in 8 themes, the falls of the great (each step from Buckingham's arrest through Katherine's divorce and Wolsey's fall to Cranmer's rise and Elizabeth's christening), a chart of Wolsey's power against Anne's rise, character map, context, critics, imagery and essay plans. Placed after The Tempest, last in Date written order. Checked against the uploaded SparkNotes guide (play text wins: Buckingham missed the Field of the Cloth of Gold through illness, his peers condemn him, Katherine's father is Ferdinand of Spain and the Emperor her nephew, Campeius brings a commission to judge rather than a verdict, Anne also speaks in 1.4, Cranmer is asked to be godfather). (#93)

## [2.40.0] — 2026-11-12

### Added
- King Henry VI, Part 3, on the Histories shelf: the Project Gutenberg text (eBook #1502; numbered speaker headings, run-in speakers and wrapped lines tidied, battlefield locations set), modern English for all 833 speeches, story beats, notes, a 243-word glossary and the full Study set: scene summaries and quizzes for all 28 scenes, cast profiles, 285 key quotes in 8 themes, the crown changes hands (each step from York's entail through Wakefield, Towton, Warwick's turn and Henry's restoration to Barnet, Tewkesbury and Richard's murder of Henry), a chart of York's fortunes against Lancaster's, character map, context, critics, imagery and essay plans. Placed between The Taming of the Shrew and 1 Henry VI in Date written order. Checked against the uploaded SparkNotes guide (play text wins: Edward flees to Burgundy, Norfolk sides with York, the 3.1 keepers' forest is in the north of England, Edward enters with Lady Grey in 3.2, Clarence comes from Burgundy, Prince Edward is killed in the field at Tewkesbury). (#92)

## [2.39.0] — 2026-11-12

### Added
- King Henry VI, Part 1, on the Histories shelf: the Project Gutenberg text (eBook #1500; old-style act headings, unbracketed stage directions and run-in speakers tidied, Orleans locations set), modern English for all 688 speeches, story beats, notes, a 199-word glossary and the full Study set: scene summaries and quizzes for all 27 scenes, cast profiles, 208 key quotes in 8 themes, the roses quarrel (each step of the York–Somerset feud from the Temple Garden to the lost relief of Talbot and York's scorn of the peace), a chart of Talbot's fortunes against Joan's, character map, context, critics, imagery and essay plans. Placed between The Taming of the Shrew and Titus Andronicus in Date written order. Checked against the uploaded SparkNotes guide (play text wins: Vernon wears the white rose and Basset the red, Reignier fights for Charles, Paris revolts to the French, Joan fights York in 5.3, York is restored to his whole inheritance). (#91)

## [2.38.0] — 2026-11-12

### Added
- King Henry IV, Part 2, on the Histories shelf: the Project Gutenberg text (Chiswick edition, eBook #1518; the Induction opens Act 1 Scene 1, the Epilogue closes 5.5, Silence's songs marked, typos corrected), modern English for all 934 speeches, story beats, notes, a 196-word glossary and the full Study set: scene summaries and quizzes for all 19 scenes, cast profiles, 220 key quotes in 8 themes, Hal's road to the crown (each step from Eastcheap to the banishment of Falstaff), a chart of Hal's standing against Falstaff's, character map, context, critics, imagery and essay plans. Placed between The Merry Wives of Windsor and Much Ado About Nothing in Date written order. Checked against the uploaded SparkNotes guide (play text wins: Travers is Northumberland's man, Falstaff keeps Wart, Shadow and Feeble, the King dies offstage in the Jerusalem Chamber). (#90)

## [2.37.0] — 2026-11-12

### Added
- King Henry V, on the Histories shelf: the Project Gutenberg text (eBook #1521; act choruses open the first scene of each act and the Epilogue closes 5.2, standard editorial locations, typing slips corrected), modern English for all 753 speeches, story beats, notes, a 178-word glossary and the full Study set: scene summaries and quizzes for all 23 scenes, cast profiles, 203 key quotes in 9 themes, Henry's road to Agincourt (each step from the tennis balls to the Treaty of Troyes), a chart of English against French fortunes, character map, context, critics, imagery and essay plans. Placed between Much Ado About Nothing and Julius Caesar in Date written order. Checked against the uploaded SparkNotes guide. (#89)

## [2.36.1] — 2026-11-11

### Fixed
- King Henry IV, Part 1: checked against the uploaded LitCharts guide. Scene summaries now note that Kate refuses Hotspur's request for a song (3.1), Worcester's influence and the Windsor Council (1.1), Hal's lost Council seat (3.2), Falstaff's tavern debts and ring (3.3) and his three survivors out of 150 (5.3). New note on 'Lord Mortimer of Scotland' (3.2). (#88)

## [2.36.0] — 2026-11-11

### Added
- King Henry IV, Part 1, on the Histories shelf: the Project Gutenberg text (PG Shakespeare Team edition, eBook #1516; speaker names expanded, standard editorial locations, typos corrected), modern English for all 789 speeches, story beats, notes, a 202-word glossary and the full Study set: scene summaries and quizzes for all 19 scenes, cast profiles, 190 key quotes in 7 themes, Hal's road to Shrewsbury (each step from tavern truant to the prince who kills Hotspur), a chart of Hal's honour against Hotspur's, character map, context, critics, imagery and essay plans. Placed between The Merchant of Venice and The Merry Wives of Windsor in Date written order. No study guide uploaded yet. (#87)

## [2.35.0] — 2026-11-11

### Added
- King John, on the Histories shelf: the Project Gutenberg text (eBook #1511, with standard editorial scene locations and the source's typing slips corrected), modern English for all 570 speeches, story beats, notes, a 193-word glossary and the full Study set: scene summaries and quizzes for all 16 scenes, cast profiles, 149 key quotes in 9 themes, the fate of Arthur (each step from France's claim to the boy's death and Henry's crowning), a chart of John's hold on the crown against the Bastard's rise, character map, context, critics, imagery and essay plans. Placed between A Midsummer Night's Dream and The Merchant of Venice in Date written order. Checked against the uploaded SparkNotes guide. (#86)

### Fixed
- Study charts: act labels no longer overlap when acts have only one scene; a crowded label shortens to its numeral or is left out (all plays). (#86)

## [2.34.0] — 2026-11-11

### Added
- Cymbeline, on the Tragedies shelf: the Project Gutenberg text (World Library edition, eBook #1133; songs marked, standard editorial locations), modern English for all 884 speeches, story beats, notes, a 203-word glossary and the full Study set: scene summaries and quizzes for all 27 scenes, cast profiles, 146 key quotes in 7 themes, the wager plot (each step from the bet in Rome to Iachimo's confession), a chart of Imogen's danger against Iachimo's deceit, character map, context, critics, imagery and essay plans. Placed between The Winter's Tale and The Tempest in Date written order. Checked against the uploaded SparkNotes guide. (#85)

## [2.33.0] — 2026-11-11

### Added
- Coriolanus, on the Tragedies shelf: the Project Gutenberg text, modern English for all 1,143 speeches, story beats, notes, a 213-word glossary and the full Study set: scene summaries and quizzes for all 29 scenes, cast profiles, 152 key quotes in 8 themes, the road to banishment and revenge (each step from the hunger riot to Antium), a chart of Coriolanus's standing against the tribunes' power, character map, context, critics, imagery and essay plans. Placed between Antony and Cleopatra and The Winter's Tale in Date written order. Checked against the uploaded SparkNotes guide (#83).

## [2.32.0] — 2026-11-11

### Added
- Timon of Athens, on the Tragedies shelf: the Project Gutenberg text (Craig edition, with standard editorial scene locations), modern English for all 827 speeches, story beats, notes, a 175-word glossary and the full Study set: scene summaries and quizzes, cast profiles, 194 key quotes in 8 themes, the road to ruin (each step from lavish gifts to the cave and the grave), a chart of Timon's wealth against his hatred of mankind, character map, context, critics, imagery and essay plans. Placed between All's Well That Ends Well and King Lear in Date written order. Checked against the uploaded SparkNotes guide (#84).

## [2.31.0] — 2026-11-11

### Added
- Troilus and Cressida, on the Tragedies shelf: the Project Gutenberg text (prologue opening 1.1), modern English for all 1,160 speeches, story beats, notes, a 201-word glossary and the full Study set: scene summaries and quizzes for all 24 scenes, cast profiles, 183 key quotes in 8 themes, Cressida's exchange (each step from the first meeting to the sleeve on Diomedes' helmet), a chart of Troilus's faith against Cressida's, character map, context, critics, imagery and essay plans. Placed between Twelfth Night and Measure for Measure in Date written order. Checked against the uploaded SparkNotes guide (#82).

### Changed
- `tools/newplay/`: generic scripts for adding a play (parse Gutenberg text, merge modern English batches, validate and assemble `play.js`, recreate a work folder from a shipped play), with a how-to; CLAUDE.md now has the full add-a-play checklist and the project rules.

## [2.30.1] — 2026-11-11

### Fixed
- Key facts now lead with the play's First Folio genre: Othello gains a Genre line; Antony and Cleopatra, Julius Caesar and Hamlet now start theirs with "Tragedy" (#81).

## [2.30.0] — 2026-11-11

### Added
- Mark as not started: a begun play can be reset to "Not yet begun" from its Library card or its You tab (tap twice to confirm). Clears your place, % read and scenes read, and drops it from Continue reading; notes, bookmarks, highlights, Study progress and reading time are kept (#79).

## [2.29.0] — 2026-11-11

### Added
- Titus Andronicus, on the Tragedies shelf: the Project Gutenberg text, modern English for all 588 speeches, story beats, notes, a 212-word glossary and the full Study set: scene summaries and quizzes, cast profiles, 150 key quotes in 8 themes, the revenge chain (each wrong and its payback, from Alarbus's sacrifice to Aaron's sentence), a chart of Titus's suffering against Tamora's power, character map, context, critics, imagery and essay plans. Placed between The Taming of the Shrew and The Comedy of Errors in Date written order. Checked against the uploaded SparkNotes guide (#78).

## [2.28.1] — 2026-11-11

### Changed
- The Tempest and The Winter's Tale: Key facts and Context now give their First Folio genre, Comedy, and explain 'romance' as a later critics' label. Shelves stay on the Folio's three groups only: Comedies, Histories, Tragedies (#77).

## [2.28.0] — 2026-11-11

### Added
- The Winter's Tale, on the Comedies shelf: the Project Gutenberg text with Autolycus's songs and the three-part ballad marked, Time's chorus as its own scene, modern English for all 769 speeches, story beats, notes, a 159-word glossary and the full Study set: scene summaries and quizzes, cast profiles, 135 key quotes in 8 themes, the oracle fulfilled (each step from Apollo's verdict to 'that which is lost' being found), a winter-and-spring chart, character map, context, critics, imagery and essay plans. Placed between Antony and Cleopatra and The Tempest in Date written order (#76).

## [2.27.0] — 2026-11-11

### Added
- The Merry Wives of Windsor, on the Comedies shelf: the Project Gutenberg text with Evans's song, Quickly's snatch of song and the fairies' song marked, modern English for all 1,051 speeches, story beats, notes, a 166-word glossary and the full Study set: scene summaries and quizzes, cast profiles, 121 key quotes in 8 themes, the wives' tricks (each step from the twin letters to Herne's oak), a chart of Falstaff's confidence against Ford's jealousy, character map, context, critics, imagery and essay plans. Placed between The Merchant of Venice and Much Ado About Nothing in Date written order. Checked against the uploaded SparkNotes guide. (#75)

## [2.26.0] — 2026-11-10

### Added
- Measure for Measure, on the Comedies shelf: the Project Gutenberg text with the boy's song marked, modern English for all 929 speeches, story beats, notes, a 179-word glossary and the full Study set: scene summaries and quizzes, cast profiles, 110 key quotes in 8 themes, the Duke's plot (each step from the friar's habit to the final proposal), a justice-and-mercy chart, character map, context, critics, imagery and essay plans. Placed between Twelfth Night and Othello in Date written order. Checked against the uploaded SparkNotes guide (#74).

## [2.25.0] — 2026-11-10

### Added
- The Comedy of Errors, on the Comedies shelf: the Project Gutenberg text with standard scene locations, modern English for all 615 speeches, story beats, notes, a 139-word glossary and the full Study set: scene summaries and quizzes, cast profiles, 112 key quotes in 8 themes, the errors (each mistaken identity in order, from the first wrong Dromio to the twins meeting), a chart of Antipholus of Syracuse's confusion beside Adriana's suspicion, character map, context, critics, imagery and essay plans. Placed between The Taming of the Shrew and Love's Labour's Lost in Date written order. Checked against the uploaded SparkNotes guide (#73).

### Fixed
- Speaker names in every play keep 'of', 'and' and 'the' in lower case (Antipholus of Syracuse, not Antipholus Of Syracuse) (#73).
- The last act label on the scene-by-scene chart no longer runs off the right edge when the final act has only one scene (#73).

## [2.24.0] — 2026-11-10

### Added
- The Taming of the Shrew, on the Comedies shelf: the Project Gutenberg text with Christopher Sly's Induction as its own section before Act 1, the songs and Biondello's rhyme marked, modern English for all 930 speeches, story beats, notes, a 181-word glossary and the full Study set: scene summaries and quizzes, cast profiles, 89 key quotes in 8 themes, Petruchio's taming (each step from the wooing to the wager), a chart of Katherina's defiance and compliance, character map, context, critics, imagery and essay plans. Placed after The Two Gentlemen of Verona in Date written order. Checked against the uploaded SparkNotes guide (#72).

### Changed
- The reader, Study tabs, quizzes and revision sheet support a play with an Induction before Act 1 (#72).

## [2.23.0] — 2026-11-10

### Added
- Love's Labour's Lost, on the Comedies shelf: the Project Gutenberg text with the songs marked, modern English for all 1,062 speeches, story beats, notes, a 197-word glossary and the full Study set: scene summaries and quizzes, cast profiles, 99 key quotes in 8 themes, the broken oath (each step from the lords' vow to the ladies' year of penance), an oath-and-love chart, character map, context, critics, imagery and essay plans. Placed between The Two Gentlemen of Verona and Romeo and Juliet in Date written order. Checked against the uploaded SparkNotes guide (#71).

## [2.22.0] — 2026-11-10

### Added
- The Merchant of Venice, on the Comedies shelf: the Project Gutenberg text with modern English for all 647 speeches, story beats, notes, a 350-word glossary and the full Study set: scene summaries and quizzes, cast profiles, 94 key quotes in 8 themes, the bond tracker (each step from signing to the deed of gift), a love-and-bond chart, character map, context, critics, imagery and essay plans. Placed between A Midsummer Night's Dream and Much Ado in Date written order. Checked against the uploaded SparkNotes guide (#70).

## [2.21.0] — 2026-11-10

### Added
- All's Well That Ends Well, on the Comedies shelf: the Project Gutenberg text with the Clown's songs marked, modern English for all 955 speeches, story beats, notes, a 167-word glossary and the full Study set: scene summaries and quizzes, cast profiles, 84 key quotes in 8 themes, Helena's plan (each step from her vow to the final scene), a chart of Helena's hopes beside Parolles's rise and fall, character map, context, critics, imagery and essay plans. Checked against the uploaded SparkNotes guide (#69).

## [2.19.0] — 2026-11-10

### Added
- The Two Gentlemen of Verona, on the Comedies shelf and first in Date written order: the Project Gutenberg text with the song "Who is Silvia?" marked, modern English for all 875 speeches, story beats, notes, a 155-word glossary and the full Study set: scene summaries and quizzes, cast profiles, 86 key quotes in 8 themes, Proteus's betrayals (each step from first sight of Silvia to the forest), a love-and-friendship chart, character map, context, critics, imagery and essay plans. Checked against the uploaded SparkNotes guide (#68).

## [2.18.0] — 2026-11-10

### Added
- Romeo and Juliet, on the Tragedies shelf: the Project Gutenberg text with modern English for all 871 speeches, story beats, notes, a 195-word glossary and the full Study set: scene summaries and quizzes, cast profiles, 87 key quotes in 8 themes, the lovers' path (each step from the Capulet feast to the tomb), a love-and-feud chart, character map, context, critics, imagery and essay plans. The Prologue and the Act 2 Chorus open the first scene of their acts. Checked against the uploaded SparkNotes guide (#67).

## [2.17.0] — 2026-11-10

### Added
- Sort the plays inside each genre shelf by Recent, Date written (in the order Shakespeare wrote them) or A–Z; the choice is remembered (#66).

## [2.16.0] — 2026-11-10

### Added
- As You Like It, on the Comedies shelf: the Project Gutenberg text with the songs marked, modern English for all 823 speeches, story beats, notes, a 296-word glossary and the full Study set: scene summaries and quizzes, cast profiles, 83 key quotes in 8 themes, Rosalind's game (each step of her disguise as Ganymede), a love-and-brotherhood chart, character map, context, critics, imagery and essay plans. Checked against the uploaded SparkNotes guide (#65).

## [2.15.8] — 2026-11-10

### Changed
- Wrapped verse lines no longer indent; the tight spacing marks the continuation (#64).

## [2.15.7] — 2026-11-10

### Fixed
- Verse lines that wrap at large text sizes now sit close under their own line, with the line-spacing gap only between verse lines, so a wrapped half no longer looks like a new line and highlights stay joined (#63).

## [2.15.6] — 2026-11-10

### Fixed
- Much Ado About Nothing checked against two study guides: fuller cast notes (Claudio a Florentine count with an uncle in Messina, Beatrice's past with Benedick, Don John's grudge against Claudio, Borachio and Margaret's relationship) (#62).

## [2.15.5] — 2026-11-10

### Fixed
- Twelfth Night checked against a study guide: fuller cast notes for Viola (her father's death on the twins' thirteenth birthday) and Antonio (his sea fight against Orsino's ships, and the purse he gives Sebastian) (#61).

## [2.15.4] — 2026-11-10

### Fixed
- Richard II checked against a study guide: fuller cast notes (the Queen's French birth, the Duchess of Gloucester's death at Plashy, Bagot brought in as a prisoner, Northumberland's brother) and a new cast entry for the offstage Earl of Worcester (#60).

## [2.15.3] — 2026-11-10

### Fixed
- The Tempest checked against two study guides: fuller cast notes (Miranda's age and memory of Milan, Ariel's twelve years in the pine and promised release, Caliban's parentage and how he showed Prospero the island, Gonzalo's role, Antonio's tribute deal with Naples), the fleet's return in 1.2, a new 1.2 quiz question, and context on the play's original plot, Caliban's name and the unities (#59).

## [2.15.2] — 2026-11-10

### Fixed
- King Lear checked against a study guide: clearer cast notes (Edgar the elder son, Edmund the younger and his dying turn, Cordelia as the daughter Lear loved most), a new Act 1 point on how Lear frames the love test, and a Time key fact (#58).

## [2.15.1] — 2026-11-10

### Fixed
- Antony and Cleopatra checked against the second (CliffsNotes) guide: fuller Act 3 summaries (Caesarion and Cleopatra's kingdoms, Antony's complaints against Caesar, his threat to Pompey's killer, Cleopatra's birthday before the last battle) and cast notes for Varrius, Silius, Taurus and Gallus (#57).

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

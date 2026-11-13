# Adding a play: the content pipeline

Generic scripts that turn a Project Gutenberg text into `<slug>/play.js`. They were used for every play since
Measure for Measure; earlier plays were made the same way. Rules (Folio-only, genres, versioning, guide checks,
tests, PR) are in `CLAUDE.md`; this file is the how-to.

Keep the work folder (`<wip>`) **outside the repo** (e.g. `/tmp/wip/<slug>` or a shared project folder). Only
`<slug>/play.js` and the edits listed in `CLAUDE.md` → "Adding a play" are committed.

| Step | Command | Writes |
|---|---|---|
| 0. Example | `node tools/newplay/template.js titus-andronicus /tmp/wip/ex` | a complete worked example of every file below, from a shipped play |
| 1. Text | `curl -sL https://www.gutenberg.org/cache/epub/<n>/pg<n>.txt -o <wip>/pg.txt` | `pg.txt` |
| 2. Parse | `node tools/newplay/parse.js <wip>` | `body.txt`, `data0.json` |
| 3. Modern English | `node tools/newplay/dump.js <wip> 0 120`, write `<wip>/m/01.txt`, `02.txt` … | `m/*.txt` |
| 4. Check batches | `node tools/newplay/merge.js <wip>` | (prints `errors 0 missing 0`) |
| 5. Study content | write `<wip>/s1.js` … `s4.js` | |
| 6. Assemble | `node tools/newplay/assemble.js <wip>` | `merge` → `data.json`, `parts.json`; validates; writes `<slug>/play.js` |
| 7. Build | `node tools/build.js` | page, search index, `sw.js`, `version.json` |

`template.js` + `assemble.js` round-trip a shipped play byte-for-byte (apart from the header comment), so the same
pipeline can be used to make large edits to an existing play: `template.js <slug> <wip>`, edit, `assemble.js <wip>`.

## 1–2. Text and parse

Find the play's ebook number on gutenberg.org (Shakespeare plays are #1500–#1540 range). `parse.js` trims the
Gutenberg header/footer and contents list (body starts at the `ACT I` before the first `SCENE I.`), then emits items:

- `{"t":"scene","act":1,"scene":"I","loc":"Rome. Before the Capitol.","id":0}` (roman scene numbers; act `0` = Induction)
- `{"t":"sd","text":"Enter Saturninus and his followers.","id":1}` stage directions, no brackets
- `{"t":"sp","who":"SATURNINUS","lines":["Noble patricians, …", …],"id":2}` (`cont:1` = same speaker resumes after a stage direction)

Ids are sequential over all items and are the keys every other file uses. **Never re-parse after writing `m/` batches**
(ids would shift). Read the printout: `who ? 0`, `empty []`, a sane speaker tally, the scene list matching a standard
edition. Fix problems with `<wip>/parse.config.js` (see header of `parse.js`): extra unbracketed stage-direction
openers (`sdStart`), song headers (`song`, lines get `~`), `induction:true`, and `post(out)` for fix-ups (editorial
locations where Gutenberg says "The same", merging a prologue into scene 1, speaker renames like `BOTH` → `A AND B`).
Rules from `CLAUDE.md`: straight quotes, capitals for speakers, `~` for sung/chanted lines, prologue/chorus opens the
first scene of its act, Induction = act 0.

## 3–4. Modern English batches (`m/*.txt`)

Write fresh modern English from the text, about 60–80 speeches per file, in id order:

```
#2
I am the eldest son of the last emperor. Defend my right to the crown with your swords.
#5
0-6 Princes, you who are competing for power through parties and supporters: …
7-14 …
```

- Speeches under 10 lines: one line of modern English.
- Speeches of 10+ lines (`dump.js` shows `PARTS n` and numbers the lines): contiguous 0-based inclusive ranges that
  cover every line. They become `PARTS`, which the reader aligns to the original lines. Never merge or split parts
  without re-checking alignment.
- Keep stage-direction-like bits inside speeches as `(To Lucius)` etc.
- `merge.js` must report `errors 0 missing 0`.

## 5. Study content modules

Each is a CommonJS module in `<wip>`. Get the exact shapes from `template.js` output of a recent play (Titus
Andronicus or Measure for Measure have every field). Speech ids are numbers or numeric strings; scene ids are
`a<act>s<n>` (`a0s1` for an Induction). All text is written fresh from the play (see `CLAUDE.md` → Content rules).

**`s1.js`** `{CFG, MAINS, COLORS, chars, scenes, gutenberg, PICS}`
- `CFG`: `id` (= slug), `prefix` (unique, e.g. `ta-`), `app` (`<slug>-reader`), `title`, `short`, `an` (article),
  `file` (= slug), `pre`/`h1`/`post` (title page: "The Tragedy of" / "Titus Andronicus" / "a Tragedy"; `post` names the
  Folio genre), `css` (usually `""`), `searchEg` (a phrase that is in the text), `chartLabel`, `insultsIntro`,
  `drillCast` (speakers for the line-learning drill), `profDefault` (default cast profile).
- `MAINS`: main speakers (order = cast lists). `COLORS`: **every** speaker name in `DATA` → hex colour.
- `chars`: `[{name, group, desc}]` cast profiles. `scenes`: `{a1s1: {sum, key, quiz:[{q, o:[4 options], a:0-3}]}}`
  for every scene. `gutenberg`: ebook number. `PICS`: stage pictures, key → `"<other-slug>:<key>"` to reuse an
  existing play's SVG, or a raw 40×40 stroke SVG path string.

**`s2.js`** `{notes, gloss}`: `notes` speech id → explanatory note; `gloss` word (as it appears in the text) → meaning.

**`s3.js`** `{QUOTES}`: `themes` key → `[label, description]`; `quotes` `[{id, who, text, themes:[keys], note}]`
(`text` must be an exact substring of that speech's joined lines; ~150 quotes).

**`s4.js`** `{EX, EXT, BEATS}`
- `EXT`: Study tab list `[[tabId, title, blurb]]`; copy a recent play's list and rewrite titles/blurbs.
- `BEATS`: `{a1s1: [[speechId, "one-line beat"], …]}` for every scene.
- `EX` fields: `intro`, `keyfacts` `[[label, text]]` (Genre line leads with the Folio genre), `timeline`
  `[{s, t, id}]` (30), `irony` id → text, `devices` key → name, `dev` id → `[[deviceKey, note, exact phrase]]`,
  `stage` picKey → description, `stagerules` `[[regex on lower-case loc, picKey]]` (unmatched → `street`), `place`
  scene → place text, `arc` `{"Series A": [0-10 per scene], "Series B": […]}` + `arcnote` (the chart),
  `iago` `[[sceneId, text]]` (the play's step tracker; tab id stays `iago`), `rel` act → `[[A, B, love|hate|trust|deceive…]]`
  (character map, names must be in `COLORS`), `context` `[[heading, text]]`, `critics` themeKey →
  `[[critic and work, "Paraphrased: …"]]`, `symbols` name → text, `symbols2` `[[name, text]]`, `solo` id → 1
  (soliloquies), `why` (one per quote, same order), `insults` `[{id, f, who, n}]`, `pronouns` `[{id, f, n}]`,
  `predict` scene → `[guess, what happens]` (all but last scene), `contrast` `[{t, pts, ids}]`, `analysis`
  SPEAKER → paragraphs, `motifs`/`bigq` `[[title, text|points, [quote indexes]]]`, `examq` `[[question, [quote indexes]]]`,
  `check` (essay checklist), `models` `[[quoteIndex, …model paragraph sentences]]`, `lang` `{un:[[id, phrase, gloss]],
  pun:[[id, phrase, word, kind, note]], st:[[id, line, [[word, note]]]]}`, `dir` `[[id, phrase, question, [[choice, why]]]]`,
  `ev` (4.8) `{ctx:[[1-3 speech ids] per context item], cr:{themeKey:[[1-3 ids] per critic]}}`: the speeches each Context
  item and critic is tested on. After assembling, `node tools/newplay/evidence.js <slug>` drafts them (quoted phrases, then
  key quotes sharing rare words, one per scene); check every pick against the text and correct by hand, then rerun with
  `--keep` only to fill gaps. `build.js` fails if any item has none.

Ask TY (or the current owner) for the play's step tracker (`iago`) and chart (`arc`) subjects before writing them.

## 6. Assemble

`assemble.js` runs `merge.js … out`, checks every cross-reference (quotes and phrases exist in the text, ids sit in
the right scene, every scene has summary/beats/place/predict, arc length = scene count, every speaker has a colour,
stage pictures resolve, quiz shape) and writes `<slug>/play.js`. It must print `validation errors: 0`. Then continue
with `CLAUDE.md` → "Adding a play" (registry edits, build, tests, version, PR).

# Study research: effective ways to learn Shakespeare

Research note (2026-11-08) for the Folio's Study area. Audience: **readers and exam students, weighted to exams** (GCSE/A-level style). Research only; nothing here is built yet. Pick items into their own PRs.

Constraints every proposal respects: offline, no network calls or CDNs, shared `reader.js` driven by `CFG`/content, 7 plays (so per-play authoring cost matters), 14px floor, theme parity, new saved data under the play prefix or `folio-` so backups keep it.

---

## 1. Summary

The strongest evidence points to three things the Folio only partly does today:

1. **Retrieval, spaced and repeated across days** (practice testing, distributed practice, successive relearning). The Folio has Leitner flashcards for quotes only. Extend scheduling to every Practise exercise, add a mixed daily review and an exam-date-aware schedule.
2. **Speaking and doing the text, not just reading it** (RSC/Folger/Globe active approaches, the production effect, actors' "active experiencing", cue scripts). The Folio has nothing spoken or performed. A **cue-script "Learn a part" mode** can be generated from existing `DATA` for all 7 plays at no content cost.
3. **Modelled analytical writing** (worked examples, AO-mapped self-marking). The Essay planner has questions, quote picks and a checklist but no model paragraphs or paragraph-level practice.

Top 5 by value ÷ cost:

| # | Feature | Group | Evidence | Content cost | Build |
|---|---|---|---|---|---|
| 1 | Learn a part (cue scripts) | Practise | High (production effect, active experiencing, original practice) | None (from `DATA`) | M |
| 2 | Daily review: one mixed, spaced queue across all Practise types (and plays) | Practise / Library Today | High (spacing, interleaving, successive relearning) | None | M |
| 3 | Smarter flashcards: cue→complete-the-quote, criterion of 3, confidence rating, exam-date intervals | Practise | High (retrieval, relearning, hypercorrection, Cepeda) | None | S |
| 4 | Extract practice: random exam-style extract, annotate, then link to whole play | Write | High for exams (AO1/AO2 weight; worked examples) | Low (reuses `examq`, themes, devices) | M |
| 5 | Paragraph builder: model → faded → own paragraph, AO-labelled | Write | Moderate–high (worked examples, metacognition) | Medium (1 model per `examq`) | M |

---

## 2. What the Folio already has (audit, v2.2.4)

| Area | Existing | Evidence it maps to |
|---|---|---|
| Reader | Original + modern English per speech, parts, glossary pop-ups, verse/prose detection, soliloquy/aside and dramatic-irony tags, "Story so far", scene predictions (`EX.predict`), per-scene confidence (Shaky/OK/Confident), "confusing" marks, highlights, favourite phrases | Comprehension support (vocabulary coverage), pretesting (predictions), metacognitive monitoring (confidence) |
| Learn | Explore (key facts, character analysis, motifs, big questions, timeline, character map, plot tracker, power arc, context, critics, imagery, symbol tracker, contrast pairs, insults, thou/you, word list, compare two quotes), Act summaries, Profiles, Themes, Key quotes | Elaboration, dual coding (maps, charts), AO3/AO5 material |
| Practise | Flashcards (5-box Leitner, quotes only: front = quote, recall who/when), Fill the gap, Memory ladder, Explain this line, Who said it?, Put it in order, scene quizzes and 20-question mix | Practice testing, generation |
| Write | Essay planner: exam questions, ★ quote fits, 45-min timer, self-marking checklist | Planning, timed practice, self-assessment |
| Revise | Revision sheet, mistakes review (missed questions, unknown quotes, confusing lines), backup | Feedback, error review |
| Shelf | Line of the day, Word of the day, weekly reading log, exam date spreads unread scenes | Spacing (light), planning |

Gaps: nothing **spoken/performed**; spacing only on quote flashcards; no **interleaved** mixed review; no **model writing**; verse is detected but not **taught** (metre, line endings, shared lines, punctuation); no **staging/interpretation choices**; no **calibration** (predict vs actual score).

---

## 3. Evidence base

### 3.1 Learning science

| Finding | Key result | Implication for the Folio |
|---|---|---|
| Dunlosky et al. 2013 review of 10 techniques | **High** utility: practice testing, distributed practice. **Moderate**: elaborative interrogation, self-explanation, interleaved practice. **Low**: summarisation, highlighting, keyword mnemonic, imagery for text, rereading. | Weight Practise over passive Learn; highlighting and rereading (both heavily used in the reader) need a retrieval follow-up to pay off. |
| Testing effect (Roediger & Karpicke 2006) | Retrieval beats restudy on delayed tests even though restudy feels better. | Every Learn screen should end in a short "now recall it" prompt. |
| Retrieval vs concept mapping (Karpicke & Blunt 2011, *Science*) | ~50% better 1-week retention than concept mapping, including inference questions; students predicted the opposite. | Prefer recall exercises over more maps/charts; tell students why (metacognition). |
| Spacing (Cepeda et al. 2008) | Optimal gap ≈ 20–40% of the retention interval for a 1-week test, 5–10% for a 1-year test. | Use the saved exam date to set review intervals. |
| Successive relearning (Rawson & Dunlosky) | Retrieve each item to a criterion (~3 correct) in session 1, then relearn in later sessions; ~a letter grade gain in courses; 3 sessions × 1 correct beat 1 session × 3 correct by a wide margin; ~80% success rate is a good difficulty target. | Card "learnt" = correct across ≥3 separate days, not 2 boxes in one sitting. |
| Interleaving (Brunmair & Richter 2019 meta-analysis) | g = 0.42 overall; strongest for discriminating similar categories; **not** helpful (blocking better) for word lists. | Interleave *discrimination* tasks (who said it, which scene, which theme, which device); keep vocabulary in blocks. |
| Pretesting / errorful generation (Richland, Kornell & Kao 2009; Kornell, Hays & Bjork 2009) | Attempting an answer before learning helps, even when wrong, if feedback follows. | Extend scene predictions to 2–3 pre-questions from the scene quiz; "guess the word" before the gloss. |
| Hypercorrection (Butterfield & Metcalfe 2001) | High-confidence errors, once corrected, are remembered best. | Add a confidence tap before revealing; surface confident misses in Revise. |
| Production effect (MacLeod et al.; Forrin & MacLeod) | Saying items aloud gives ~10–20% better memory than silent reading in mixed lists; mouthing/typing help less. | "Say it aloud" step in Memory ladder and Learn a part. |
| Metacognition (EEF guidance, 7 recommendations) | ~+7 months; must be taught within the subject, not as generic tips. | Plan → monitor → evaluate inside Study: session goal, confidence, predicted vs actual score. |
| Reading comprehension strategies (EEF/E4L toolkit) | ~+6 months (secondary +7): questioning, inference from context, summarising, monitoring; text must be challenging but not overwhelming. | Word detective (infer from context), "what's the question this speech answers?" prompts. |
| Vocabulary coverage (Hu & Nation 2000 and replications) | Comfortable comprehension needs ~98% known words. | Glossing every unfamiliar word (as the Folio does) is right; track words a reader taps often and drill them (blocked, not interleaved). |
| Worked examples in English (Chartered College case study; Kyun et al. 2013) | Models reduce load for novices; one Year 10 class moved from explaining to analysing quotes; "know what analysis is" 26% → 70% (small, no control). | Model paragraphs with labelled parts, then faded versions. |

### 3.2 Theatre and teaching practice

| Source | Method | Evidence |
|---|---|---|
| **RSC Rehearsal Room approaches** | Establish the world, tell the story, discover characters, explore language. Activities: still images / freeze frames, reading as detectives (whisper, walk, stress theme words), voicing a character's unspoken thought, interpretive choices (does Banquo's ghost appear?), editing the text into chunks, sounding out and guessing words before footnotes. | *Time to Act* (2023, 45 schools, Year 5, comparison groups): more confidence when stuck, more complex sentences and vocabulary, better inference. Warwick RSC Schools Survey: some schools reported higher SATs/GCSE English. |
| **Folger Method** (9 essential practices) | Tone & Stress, Tossing Words & Lines, Two-Line Scenes, 20-Minute Plays, Choral Reading, 3-D Lit, Cutting a Text, Promptbooks, Group Scenes. Students handle original language from the start; difficulty ramps up. | Practitioner evidence; widely used in US schools. |
| **Folger "Reading Shakespeare's Language"** | Nine difficulty types: obsolete words, changed meanings, world-building words, inverted word order, separated word groups, omitted words, puns, metaphors, implied stage action. | Editorial guidance (Mowat & Werstine). A clear taxonomy for a language trainer. |
| **Globe Playing Shakespeare** (Yandell et al., UCL) | Workshops + live performance + discussion. | Students reported better understanding and noticed staging choices; preparation and post-show discussion mattered; unprepared students struggled. |
| **Cicely Berry / TFANA punctuation walk** | Read aloud walking, change direction at every punctuation mark; full stops = complete thought, commas = thought being worked out, colons/semicolons = gear change; count sentences; irregular punctuation = agitation. | Voice-practice standard (RSC voice department). |
| **Peter Hall / verse speaking** | Respect the line ending, caesura, feminine endings, short and shared lines as cues (a shared line means no pause; a short line means a pause or action). | Practitioner standard. |
| **Cue scripts** (Tiffany Stern; American Shakespeare Center) | Each actor received only their lines plus the 2–3 word cue; actors had to listen. ASC still rehearses this way. | Historical practice; strong fit with active-experiencing memory research. |
| **Actors' memory** (Noice & Noice) | Actors learn by beats (goal-directed chunks) and meaning, not rote; "active experiencing" (meaning it to someone, with movement) gave 60% vs 50% recall over deliberate memorisation in students; gains for older adults lasted 4 months. | Peer-reviewed, replicated. |
| **Liverpool "Shakespeare and the brain"** (Davis, Thierry et al.) | EEG: functional shift (noun used as verb, e.g. "he godded me") produces a spike the authors read as positive surprise. | Small EEG study; useful as a "spot the shift" language exercise, not a core feature. |
| **Cambridge School Shakespeare / Rex Gibson** | "Active Shakespeare": the play as script to be performed, students as co-creators. | Practitioner standard, basis of UK school editions. |

### 3.3 Exams (what "exam-weighted" means concretely)

- **AQA GCSE Shakespeare (34 marks)**: AO1 12 (argument, evidence), AO2 12 (writer's methods, incl. form and structure), AO3 6 (context woven in), AO4 4 (SPaG). Extract + whole play. Top band: conceptualised thesis, whole-text tracking, precise references, analysis of *why* choices are made (not technique-spotting), context woven into argument.
- **AQA A-level** adds AO4 (connections) and **AO5 (different interpretations)**, which maps to staging choices and critics.

### 3.4 Other apps (feature scan)

- **Line-learning apps** (LineLearner, Scene Partner, Scripts/Scriptation, Rehearsal Pro): cue-only playback with gaps for your lines, record partner lines, star hard beats, speech recognition that checks your line and shows the right words, spaced reminders.
- **Shakespeare in Bits**: short sections, animation, relationship maps, scene summaries.
- **Touch Press *The Sonnets***: performed readings, line-by-line notes, Quarto facsimile comparison.
- **ShakespearePro**: inline glossary, notes and note sharing.
- **LitCharts**: colour-coded theme tracker per plot point, quotes filterable by character/theme/location, printable charts.
- **Ryan North *To Be or Not to Be***: branching story; original path marked; shows alternative readings.

Folio already matches or beats most of the reading/notes side. The gaps versus other apps are **performance** (audio, cue mode, speech checking) and **theme-per-moment tracking**.

---

## 4. Proposed features (prioritised)

Legend: **Build** S/M/L in `reader.js`/`reader.css`. **Content**: none = derived from existing play data; low/med/high = new per-play authoring × 7 plays. Version impact per CLAUDE.md (new feature = minor).

### Priority 1: highest evidence, low content cost

**1. Learn a part (cue scripts)** · Practise · Build M · Content none · New
- Pick a character (`MAINS`) and a scene range. Screen shows only the **cue** (last 3 words of the previous speech, speaker hidden, as in original cue scripts) and blanks for your speech, chunked by `PARTS`.
- Per part: *Say it aloud* → reveal → self-grade (Got it / Nearly / Missed). Hint ladder reuses Memory ladder steps (first letters, then half).
- Option: "Play the other parts" with on-device `speechSynthesis` (only voices with `localService === true`; feature hidden if none).
- Missed parts go into the spaced queue (feature 2).
- Evidence: production effect, active experiencing, cue scripts, beats = goal-driven chunks.
- Data: `<prefix>part` `{who:{speechId:{b,d}}}`.

**2. Daily review (one spaced, interleaved queue)** · Practise + Library "Today" · Build M · Content none · New
- Every Practise item (quote card, gap, who-said-it item, quiz question, explain-line, cue part) gets a schedule entry. Daily review serves ~10–15 due items **mixed across types** (interleave discrimination tasks; keep word drills blocked).
- Library "Today" card: "12 due across 3 plays", one tap to start.
- Session ends with calibration: "You expected 8/12, you got 10/12".
- Evidence: distributed practice, interleaving (similar categories), successive relearning, metacognition.

**3. Smarter flashcards** · Practise · Build S · Content none · Upgrade
- Add card directions: *cue → finish the quote* (first 3–4 words shown), *quote → speaker + scene*, *quote → theme*, *meaning (modern) → original*.
- "Learnt" = correct on **3 separate days** (successive relearning), not box ≥ 2.
- Confidence tap before reveal; confident misses flagged in Revise (hypercorrection).
- Intervals scale to exam date (≈ 20–40% of days left for near exams, cap later); fallback to current `INT`.
- Migration: keep `prog.srs` shape `{b,d}`, add optional fields only (no major bump).

**4. Pre-questions before each scene** · Reader · Build S · Content none · Upgrade
- Before a scene, alongside the existing prediction, show 2 questions drawn from that scene's quiz (`STUDY.scenes[*].quiz`): "Keep these in mind". After the last page, ask them.
- Evidence: pretesting effect + retrieval.

**5. "Now recall it" endings** · Learn · Build S · Content none · Upgrade
- At the bottom of Themes, Profiles, Act summaries, Character analysis: "Close this and write 3 points from memory", then compare with the page. Saves to notes.
- Evidence: Karpicke & Blunt (retrieval > elaborative study), testing effect. Converts the low-utility "reread/summary" use of Learn into retrieval.

### Priority 2: exam writing

**6. Extract practice** · Write · Build M · Content low · New
- App picks a 20–40 line extract from a key scene (speech ranges around `QUOTES`), with an `examq`-style question.
- Step 1 annotate: tap words to tag a method (reuse `EX.devices` keys + verse/prose, imagery, structure), with saved highlights.
- Step 2 zoom out: "Where else in the play?" suggestions from the theme tracker and symbol tracker (whole-text AO1).
- Step 3 timed write (reuse 45-min timer; 15 min for extract-only) and AO-mapped checklist.
- Content: optional per-play list of good extract ranges (low).

**7. Paragraph builder (worked → faded examples)** · Write · Build M · Content medium · New
- For each `examq`, one model paragraph with labelled parts: point, quote, method, effect on audience, context, alternative reading (AO1/2/3/5).
- Stage 1: read model, tap to see labels. Stage 2: faded (method and effect blanked, write them). Stage 3: own paragraph on a different quote, then self-check against the labels.
- Evidence: worked examples for novices, AO weights, explicit metacognition.
- Content: ~5 paragraphs × 7 plays, written fresh from the text (content rule).

**8. AO-mapped marking** · Write · Build S · Content low · Upgrade
- Group the existing `EX.check` items by AO with the GCSE weights shown (12/12/6/4), plus an A-level toggle that adds AO5 interpretations.
- Self-mark → band estimate → one suggested next drill (e.g. weak AO2 → Extract practice).

### Priority 3: language and verse (readers and exam AO2)

**9. Verse lab** · Learn → Explore · Build M–L · Content none (heuristic) · New
- On any speech: syllable count per line (heuristic + small exceptions list; labelled "approximate"), iambic stress overlay, flags for short lines, long/feminine endings, **shared lines** across speakers (detectable from consecutive short lines), verse↔prose switches (already detected in `PROSE`).
- Prompts: "Othello switches to prose here. What has changed?" generated from switch points.
- **Punctuation walk view**: colour full stops vs commas vs colons; count sentences; "thought changes" per line. Evidence: Berry/TFANA, Hall.

**10. Language detective** · Practise · Build M · Content low–med · New
- Folger's nine difficulty types as drill kinds: **untangle** inverted order (drag words into modern order; lines picked per play), **supply the missing word** (omissions), **guess the word** from context before the gloss reveals (pretesting + inference), **pun hunt**, **spot the functional shift**.
- Words a reader taps often in the reader feed a blocked vocabulary drill (Hu & Nation coverage).

**11. Tone & stress** · Practise · Build S · Content low · New
- One line shown 3 times with stress on different words (bold); pick which reading fits the moment and why; "say each aloud". Folger "Tone & Stress", production effect.

### Priority 4: performance and interpretation (AO5, engagement)

**12. Director's choices (promptbook)** · Learn or Write · Build M · Content medium · New
- At 5–8 key moments per play: 2–3 staging options (e.g. "I am not what I am": to Roderigo / straight to the audience / laughing), pick one, write why with a quote. Shows which choices critics/productions have made where known (fact-checked, paraphrased).
- Evidence: RSC interpretive choices, Globe findings (noticing staging), A-level AO5.

**13. Cut the scene** · Practise · Build M · Content none · New
- Folger "Cutting a Text": cut a speech/scene to N lines while keeping the story; compare word count and which lines you kept against the play's key quotes. Teaches what is essential.

**14. Thought track** · Reader tools · Build S · Content none · New
- On any speech: "What is X thinking but not saying?" free text saved to notes (RSC voicing thoughts). Especially at asides, irony tags and `EX.why` moments.

**15. Two-line scenes** · Practise · Build S · Content none · New
- Pull 2-speech exchanges (from `DATA`) at key moments; read both parts aloud as different emotions; pick the reading that fits. Folger practice.

### Priority 5: planning and metacognition

**16. Study session plan** · Study header · Build S · Content none · Upgrade
- Uses existing exam date + per-scene confidence: "Today: 10 min review, 1 extract, 1 shaky scene." End-of-session reflection ("What went well / one thing to fix") saved to notes. EEF plan-monitor-evaluate.

**17. Predict your score** · Quizzes · Build S · Content none · Upgrade
- Before a quiz, predict a score; after, show the gap over time (calibration).

---

## 5. Not recommended (or only with care)

- More highlighting/rereading/summary features without a retrieval step (Dunlosky: low utility).
- Keyword mnemonics and imagery-for-text drills (low utility).
- Interleaving vocabulary lists (blocking was better for words).
- Concept maps as a main revision tool (retrieval beat them).
- Cloud AI chat/marking, video streaming, online speech recognition: break the offline/no-network rule. On-device `SpeechRecognition` (`processLocally`) is emerging in Chromium but not reliable on iOS Safari yet; revisit later for checking spoken lines.
- Audio-only listening as a replacement for reading: comprehension is similar for adults, weaker for complex text; use audio as read-along support only.

---

## 6. Suggested sequence

1. **Smarter flashcards + Daily review** (shared scheduler; feeds everything else). Minor.
2. **Learn a part** (cue scripts, say aloud, optional local voices). Minor.
3. **Pre-questions + "Now recall it"** (small, all plays). Minor or patch.
4. **Extract practice + AO-mapped marking**. Minor.
5. **Paragraph builder** (new Study content set, written per play). Minor.
6. **Verse lab + Language detective**. Minor.
7. **Director's choices, Cut the scene, Thought track, Two-line scenes**. Minor.

Each needs a decision pass with TY (scope, UI, data keys) before building, per CLAUDE.md.

---

## 7. Sources

Learning science
- Dunlosky et al. (2013), *Improving Students' Learning With Effective Learning Techniques*, PSPI: https://www.psychologicalscience.org/journals/pspi/1529100612453266/ · summary: https://www.psychologicalscience.org/news/releases/which-study-strategies-make-the-grade.html
- Roediger & Karpicke (2006), Test-enhanced learning: https://psychology.ecu.edu/wp-content/pv-uploads/sites/216/2019/03/Roediger-Karpicke-2006.pdf
- Karpicke & Blunt (2011), *Science*: https://www.purdue.edu/newsroom/research/2011/110120KarpickeScience.html
- Cepeda et al. (2008), Spacing effects: a temporal ridgeline: https://pubmed.ncbi.nlm.nih.gov/19076480/
- Successive relearning overview (Rawson, Dunlosky et al.): https://www.sec-ed.co.uk/content/best-practice/a-teacher-s-guide-to-retrieval-practice-successive-relearning
- Brunmair & Richter (2019), interleaving meta-analysis: https://pubmed.ncbi.nlm.nih.gov/31556629/
- Pretesting studies overview (Richland, Kornell & Kao 2009; Kornell, Hays & Bjork 2009): https://structural-learning.com/post/pretesting-effect-testing-before-teaching · https://learninglab.uchicago.edu/Pre-Testing_files/RichlandKornellKao.pdf
- Hypercorrection effect: https://link.springer.com/article/10.3758/s13421-013-0344-3
- Production effect (Forrin & MacLeod and colleagues): https://link.springer.com/content/pdf/10.3758/s13421-013-0374-x.pdf · https://journals.sagepub.com/doi/10.1177/0963721417691356
- EEF metacognition guidance: https://educationendowmentfoundation.org.uk/news/new-guidance-on-how-to-develop-pupils-metacognitive-skills
- Reading comprehension strategies (EEF toolkit via Evidence for Learning): https://evidenceforlearning.org.au/teaching-and-learning-toolkit/reading-comprehension-strategies
- Vocabulary coverage, Hu & Nation replication: https://eprints.lancs.ac.uk/id/eprint/210922
- Worked examples in English: https://my.chartered.college/impact_article/the-use-of-worked-examples-for-novice-learners-in-the-english-classroom-2/
- Listening vs reading (Rogowsky 2016, summary): https://techlearning.com/news/audiobooks-for-students-listening-to-what-the-research-says

Theatre and teaching
- RSC Rehearsal Room approaches: https://www.rsc.org.uk/education/about-rsc-education/rehearsal-room-approaches-to-shakespeare · activities: https://www.rsc.org.uk/education/teacher-resources/introducing-rehearsal-room-approaches
- RSC *Time to Act* study coverage: https://www.whatsonstage.com/news/rehearsal-room-approach-to-shakespeares-plays-in-schools-can-boost-confidence-and-language-development-major-rsc-study-finds_1577957
- Folger Method essential practices: https://folger.edu/blogs/teaching-shakespeare/folger-method-essential-practices · https://www.folger.edu/teach/the-folger-method/
- Folger, Reading Shakespeare's Language (The Tempest): https://www.folger.edu/explore/shakespeares-works/the-tempest/reading-shakespeares-language-the-tempest/
- Globe Playing Shakespeare evaluation (Yandell et al., UCL): https://discovery.ucl.ac.uk/10074147/3/Yandell%20Globe_JYTBJC1904final.pdf
- TFANA, Reading with Punctuation (Berry-style exercise): https://tfana.org/wp-content/uploads/2023/09/Exploring-Shakespeares-Language_-Reading-with-Punctuation.pdf
- American Shakespeare Center, Cue scripts: https://americanshakespearecenter.com/2021/08/cue-scripts
- Noice & Noice, actors' memory / active experiencing: https://homepage.villanova.edu/diego.fernandezduque/Teaching/CognitivePsychology/Lectures_and_Labs/sssAppliedIssues/CurrDirActing.pdf
- Liverpool, functional shift EEG: https://www.eurekalert.org/news-releases/771250
- British Council, classroom techniques (freeze frames, plot points): https://britishcouncil.org/voices-magazine/classroom-techniques-help-pupils-tackle-shakespeare
- Peter Hall, *Shakespeare's Advice to the Players* (summary): https://medium.com/@theatrehunter/the-peter-hall-cheat-sheet-2c8af4838d48
- Rex Gibson, *Teaching Shakespeare* (Cambridge): https://lovereading4kids.co.uk/book/9781316609873/isbn/Teaching-Shakespeare-by-Rex-Gibson.html

Exams
- AQA GCSE Shakespeare mark scheme summary: https://www.savemyexams.com/gcse/english-literature/aqa/17/revision-notes/1-shakespeare/how-to-answer-the-shakespeare-essay-question/the-aqa-gcse-shakespeare-mark-scheme
- AQA A-level English Literature A, assessment objectives: https://www.aqa.org.uk/subjects/english/as-and-a-level/english-literature-a-7711-7712/scheme-of-assessment

Apps and platform
- Line-learning apps review: https://www.artfolio.com/article/line-learning-apps-reviewed-which-tools-really-help-actors-lock-lines-fast
- Digital Shakespeare apps (Irish Times): https://www.irishtimes.com/culture/books/ebooks-a-dozen-digital-ways-to-explore-shakespeare-s-poems-and-plays-1.2663350
- LitCharts features: https://www.litcharts.com/about
- MDN `SpeechRecognition.processLocally`: https://developer.mozilla.org/docs/Web/API/SpeechRecognition/processLocally

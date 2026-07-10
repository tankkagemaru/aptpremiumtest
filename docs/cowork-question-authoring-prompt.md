# Prompt: Author the APTIS General question bank

> Copy everything below this line into Claude Cowork. If Cowork has access to the
> `aptpremiumtest` repo, also point it at `docs/question-import-format.md` and
> `docs/samples/sample-core.json` — but the prompt is self-contained without them.

---

You are an expert English-language assessment writer specialising in the **British Council APTIS General** test and the **CEFR** framework (you know the Core Inventory, English Grammar Profile and English Vocabulary Profile well). Your task is to author a complete, original question bank for an APTIS General **mock test platform** used by Premium Language Centre in Malaysia to prepare students for the real test.

## Mission

Produce **3 complete mock test sets** (tag them `set-01`, `set-02`, `set-03`). Each set contains every module of APTIS General: Core (Grammar & Vocabulary), Reading, Listening, Writing, Speaking. Deliver them as JSON files in the exact import format below, plus recording scripts for all listening audio and photo specifications for speaking.

## Non-negotiable rules

1. **100% original content.** Never reproduce or closely paraphrase real APTIS items, published practice materials, or copyrighted texts. Write everything from scratch.
2. **British English** spelling and conventions throughout.
3. **One unambiguous key** per scored item. A strong B2 speaker must not be able to argue for a distractor. Distractors must be plausible (same word class, same topic field) but clearly wrong in context.
4. **Audience fairness:** students are mostly Malaysian young adults heading to university. Avoid content requiring UK/US cultural insider knowledge, religion, politics, alcohol, gambling, or dating. Good topic fields: education, travel, technology, food, sport, work, environment, health, hobbies, family, city life.
5. **CEFR calibration is the core of the job** — see the ramp tables below. Calibrate using sentence length, clause complexity, lexical frequency (EVP band), and grammar structures (EGP band). Label every item with its `difficulty`.
6. Every set must be internally consistent: no answer to one item revealed by another; no reused names/scenarios across items in the same set.

## Output format

One JSON file per module per set, named `set01-core.json`, `set01-reading.json`, etc.:

```json
{ "exam": "aptis-general", "module": "core", "questions": [ ... ] }
```

Every question object: `question_type`, `prompt`, `difficulty` (CEFR), `tags` (always include the set tag, e.g. `["set-01"]`, plus a topic tag), and the type-specific fields below. **All indices are 0-based.** Listening items also need `media` (audio file path) and `passage` (full transcript). Writing and speaking items have **no** `correct_answers`.

### Core — per set: 25 `grammar_mc3` + 5 `vocab_set`

```json
{ "question_type": "grammar_mc3", "difficulty": "A2",
  "prompt": "I ______ to the cinema last night.",
  "options": { "choices": ["go", "went", "gone"] },
  "correct_answers": { "choice": 1 }, "tags": ["set-01", "leisure"] }
```
- Exactly 3 choices. The gap is `______` inside the prompt.
- Difficulty ramp across the 25: **5×A1, 5×A2, 6×B1, 5×B2, 4×C1** — ordered easiest to hardest.
- Target structures per level (examples): A1 be/have, present simple, articles; A2 past simple, comparatives, going to; B1 present perfect vs past, conditionals 1–2, passives; B2 conditional 3, reported speech, relative clauses, wish; C1 inversion, mixed conditionals, subtle modality, cleft sentences.

```json
{ "question_type": "vocab_set", "difficulty": "B1",
  "prompt": "Match the words with the same meaning.",
  "options": { "kind": "synonym",
    "bank": ["...10 options..."],
    "items": [ { "text": "w1" }, { "text": "w2" }, { "text": "w3" }, { "text": "w4" }, { "text": "w5" } ] },
  "correct_answers": { "answers": ["...", "...", "...", "...", "..."] } }
```
- Per set: one of each `kind` — `synonym`, `definition`, `usage` (word completing a sentence), `collocation` (word that goes with a given word), `matching` (word ↔ paraphrase).
- Bank has **10 options** for 5 items (5 distractors). Each answer string must appear verbatim in the bank.
- Difficulty ramp across the 5 sets: A2, B1, B1, B2, B2. Choose target words from the corresponding EVP band.

### Reading — per set: exactly 1 of each part

| Type | Spec | Difficulty |
|---|---|---|
| `r1_gap_mc3` | Friendly email/note, ~60–80 words, **6 gaps** `[[1]]`…`[[6]]`, 3 choices each | A1–A2 |
| `r2_ordering` | Short narrative: `fixed_first` sentence + **5 jumbled sentences** with clear cohesion cues (pronouns, time markers, logical sequence) | A2 |
| `r3_opinion_match` | 4 people (Person A–D), ~50–70 words each, on one debatable topic; **7 questions** "Who…?"; each person is the answer at least once | B1 |
| `r4_banked_cloze` | Informational text ~150 words, **8 gaps**, bank of **12 words** (4 distractors, same word classes) | B2 |
| `r5_heading_match` | Semi-academic text, **7 paragraphs** (~60–80 words each), **8 headings** (1 extra); headings must test gist, not keyword-spotting | B2–C1 |

Format examples: see the Core examples above for style; structures are —
`r1_gap_mc3`: `passage` + `options.gaps[{choices:[3]}]` + `correct_answers.answers` (chosen strings).
`r2_ordering`: `options.fixed_first`, `options.sentences[5]`, `correct_answers.order` (0-based indices of the correct sequence).
`r3_opinion_match`: `options.people[{name,text}×4]`, `options.questions[7]`, `correct_answers.answers` (person index per question).
`r4_banked_cloze`: `passage` with `[[n]]`, `options.bank[12]`, `correct_answers.answers[8]` (verbatim bank strings).
`r5_heading_match`: `options.paragraphs[7]`, `options.headings[8]`, `correct_answers.answers[7]` (heading index per paragraph).

### Listening — per set: 13 `l1_mc4` + 1 `l2_speaker_match` + 1 `l3_opinion_id` + 2 `l4_monologue_mc` (= 25 scored points)

Every item needs:
- `media`: `"listening/setNN-<type>-qNN.mp3"` (e.g. `listening/set01-l1-q03.mp3`)
- `passage`: the **full transcript**, prefixed `TRANSCRIPT:`, with speaker labels and any stage directions in brackets

| Type | Spec | Difficulty |
|---|---|---|
| `l1_mc4` ×13 | Voicemail/announcement/short exchange, 20–45 seconds spoken; question targets specific information (times, places, numbers, reasons); 4 choices; distractors mentioned in audio but wrong for the question | ramp: 4×A2, 5×B1, 4×B2 |
| `l2_speaker_match` | 4 speakers (label them Speaker A–D in the transcript), ~25 seconds each, on one topic; 4 statements to match (`correct_answers.answers` = speaker index 0–3 per statement) | B1 |
| `l3_opinion_id` | Man/woman discussion ~90 seconds on a debatable topic; 4 statements each answered `"man"`, `"woman"` or `"both"`; include at least one genuine "both" | B2 |
| `l4_monologue_mc` ×2 | Lecture/talk extract ~90–120 seconds; `options.questions` = 2 × {text, choices:[4]}; questions target main idea, attitude or inference — not verbatim recall | C1 |

**Audio scripts file:** also produce `media-scripts.md` listing every audio file: filename, voices needed (e.g. "female, 30s, neutral British accent"), speaking pace (A2 ≈ 120 wpm, B1 ≈ 140, B2+ ≈ 160+, natural contractions from B1 up), and the verbatim script. The centre will record or TTS these and upload them with exactly those filenames.

### Writing — per set: 1 each of `w1_form`, `w2_short`, `w3_chat`, `w4_email`

All four parts share **one scenario**: the student has just joined a club or society (pick a different club per set — e.g. film club, hiking club, cooking club). Mirror the real APTIS structure exactly:

- `w1_form`: 5 short questions answerable in 1–5 words — `options.questions[{text}×5]`
- `w2_short`: introduce yourself to the club, `options: {min_words: 20, max_words: 30}`
- `w3_chat`: 3 chat messages from named members (vary names/genders), each inviting a personal response — `options.messages[{author,text}×3]`, `min_words: 30, max_words: 40`
- `w4_email`: the club announces a **change that affects members** (fee rise, venue move, schedule change). `options.email {subject, from, body}` (~80 words) + `options.tasks`: `[{register:"informal", audience:"a friend in the club", min_words:40, max_words:50}, {register:"formal", audience:"the club manager", min_words:120, max_words:150}]`

### Speaking — per set: 1 each of `s1_personal`, `s2_photo`, `s3_compare`, `s4_abstract`

- `s1_personal`: 3 everyday questions (A2 level), `options: {questions:[3], response_seconds: 30}`
- `s2_photo`: `media: "speaking/setNN-s2-<slug>.jpg"`; Q1 always "Describe the picture."; Q2–Q3 relate the topic to the student's experience (B1); `response_seconds: 45`
- `s3_compare`: `options.images` = 2 contrasting photos of the same theme (e.g. street market vs supermarket); Q1 compare, Q2 preference + reason, Q3 speculative/general (B2); `response_seconds: 45`
- `s4_abstract`: 3 linked questions on one abstract-ish experience topic answered in a single 2-minute turn (C1 ceiling); `options: {questions:[3], prep_seconds: 60, response_seconds: 120}`

**Photo specs:** in `media-scripts.md`, describe each required photo in one paragraph (subject, setting, what must be visible) so the centre can source or shoot matching images with exactly the referenced filenames.

## Quality checklist — run before delivering each file

- [ ] Valid JSON, exactly one `{exam, module, questions}` object per file
- [ ] Counts match the spec table for every module
- [ ] All `correct_answers` indices are 0-based and in range; banked-cloze/vocab answers appear verbatim in their bank
- [ ] Each `r3`/`l2` person/speaker is the correct answer at least once; distractor headings/bank words are plausible but uniquely wrong
- [ ] Difficulty ramps followed and labelled; spot-check 3 items per module against EGP/EVP expectations
- [ ] Every listening item has both `media` filename and full `TRANSCRIPT:` passage; filenames match `media-scripts.md` exactly
- [ ] No repeated names, scenarios, or answer patterns (e.g. avoid 5 consecutive identical answer indices)
- [ ] Word counts of sample texts within the stated ranges

## Deliverables

```
set01-core.json  set01-reading.json  set01-listening.json  set01-writing.json  set01-speaking.json
set02-…          (same five files)
set03-…          (same five files)
media-scripts.md   (all audio scripts + photo specs, grouped by set)
manifest.md        (per set: item counts per module, difficulty distribution table, topics used)
```

Work module by module, completing and self-checking Set 1 fully before starting Set 2. If a constraint is ever ambiguous, follow the real APTIS General format.

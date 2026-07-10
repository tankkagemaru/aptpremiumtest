# Manifest — APTIS General mock question bank

Three complete mock sets (`set-01`, `set-02`, `set-03`) for the Premium Language Centre APTIS General platform. All content 100% original, British English, CEFR-calibrated. Import one JSON file per module via **Dashboard → Question bank → Import questions**.

## Files

```
question-bank/
  set01-core.json  set01-reading.json  set01-listening.json  set01-writing.json  set01-speaking.json
  set02-core.json  set02-reading.json  set02-listening.json  set02-writing.json  set02-speaking.json
  set03-core.json  set03-reading.json  set03-listening.json  set03-writing.json  set03-speaking.json
  media-scripts.md   (all listening scripts + speaking photo specs, grouped by set)
  manifest.md        (this file)
```

## Set 1  ·  tag `set-01`

Writing/theme: Film club (topics lean travel / technology / education)

| Module | Items | Scored points | Difficulty distribution |
|---|---|---|---|
| Core | 25 grammar_mc3 + 5 vocab_set | 30 | grammar: A1×5, A2×5, B1×6, B2×5, C1×4; vocab: A2, B1, B1, B2, B2 |
| Reading | 1×r1–r5 | 5 tasks (34 sub-items) | A2×2, B1×1, B2×1, C1×1 |
| Listening | 13 l1 + l2 + l3 + 2 l4 | 25 | l1: A2×4, B1×5, B2×4; l2=B1, l3=B2, l4=C1×2 |
| Writing | w1–w4 | teacher/AI graded | task-based (A2→B2 ceiling) |
| Speaking | s1–s4 | teacher graded | s1=A2, s2=B1, s3=B2, s4=C1 |

Topics used: city life, education, environment, family, hobbies, sport, technology, travel, work.

Media assets to produce (20): see media-scripts.md → Set 1.

## Set 2  ·  tag `set-02`

Writing/theme: Hiking club (topics lean food / environment / health)

| Module | Items | Scored points | Difficulty distribution |
|---|---|---|---|
| Core | 25 grammar_mc3 + 5 vocab_set | 30 | grammar: A1×5, A2×5, B1×6, B2×5, C1×4; vocab: A2, B1, B1, B2, B2 |
| Reading | 1×r1–r5 | 5 tasks (34 sub-items) | A2×2, B1×1, B2×1, C1×1 |
| Listening | 13 l1 + l2 + l3 + 2 l4 | 25 | l1: A2×4, B1×5, B2×4; l2=B1, l3=B2, l4=C1×2 |
| Writing | w1–w4 | teacher/AI graded | task-based (A2→B2 ceiling) |
| Speaking | s1–s4 | teacher graded | s1=A2, s2=B1, s3=B2, s4=C1 |

Topics used: city life, environment, food, health, hiking, hobbies, sport, technology, travel.

Media assets to produce (20): see media-scripts.md → Set 2.

## Set 3  ·  tag `set-03`

Writing/theme: Cooking club (topics lean sport / work / city life / hobbies)

| Module | Items | Scored points | Difficulty distribution |
|---|---|---|---|
| Core | 25 grammar_mc3 + 5 vocab_set | 30 | grammar: A1×5, A2×5, B1×6, B2×5, C1×4; vocab: A2, B1, B1, B2, B2 |
| Reading | 1×r1–r5 | 5 tasks (34 sub-items) | A2×2, B1×1, B2×1, C1×1 |
| Listening | 13 l1 + l2 + l3 + 2 l4 | 25 | l1: A2×4, B1×5, B2×4; l2=B1, l3=B2, l4=C1×2 |
| Writing | w1–w4 | teacher/AI graded | task-based (A2→B2 ceiling) |
| Speaking | s1–s4 | teacher graded | s1=A2, s2=B1, s3=B2, s4=C1 |

Topics used: city life, food, hobbies, sport, travel, work.

Media assets to produce (20): see media-scripts.md → Set 3.

## Totals

- Question objects across all files: **180**
- Scored points per set: Core 30 + Reading (5 tasks) + Listening 25 + ungraded Writing/Speaking
- Audio files to record: 17 per set × 3 = **51**
- Speaking photos to source: 3 per set × 3 = **9**

## Verification

All 15 JSON files parse cleanly and passed an automated spec check: module counts, 0-based key ranges, verbatim bank/cloze answers, difficulty ramps (grammar 5/5/6/5/4; listening l1 4/5/4), each r3 person & l2 speaker keyed ≥1, a genuine 'both' in every l3, unique r5 headings with one distractor, no 5-in-a-row identical answer indices, and media+TRANSCRIPT present on every listening item. Writing/speaking carry no answer keys.
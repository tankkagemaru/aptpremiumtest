# Question import format

Bulk-import file for **Dashboard → Question bank → Import questions**. One JSON file per module:

```json
{
  "exam": "aptis-general",
  "module": "reading",
  "questions": [ { ...question }, { ...question } ]
}
```

Common fields per question:

| Field | Required | Notes |
|---|---|---|
| `question_type` | ✅ | One of the types below; determines the APTIS part automatically |
| `prompt` | varies | The question stem / instruction |
| `passage` | varies | Reading text, or the **audio transcript** for listening |
| `media` | listening + speaking photos | Path inside the `mock-media` bucket, e.g. `listening/l1-q01.mp3` (upload via the Media panel) |
| `options` | ✅ (except w2) | Type-specific, see below |
| `correct_answers` | core/reading/listening | Type-specific; omit for writing/speaking |
| `difficulty` | recommended | CEFR: `A1` `A2` `B1` `B2` `C1` `C2` |
| `tags` | optional | e.g. `["travel", "set-03"]` — use a shared tag to group one test's questions |
| `points` | optional | Defaults to 1 |

All indices are **0-based**.

## Core

`grammar_mc3` — sentence completion, 3 options
```json
{ "question_type": "grammar_mc3", "difficulty": "A2",
  "prompt": "I ______ to the cinema last night.",
  "options": { "choices": ["go", "went", "gone"] },
  "correct_answers": { "choice": 1 } }
```

`vocab_set` — 5 target items sharing a 10-word bank. `kind`: `matching` | `definition` | `usage` | `synonym` | `collocation`
```json
{ "question_type": "vocab_set", "difficulty": "B1",
  "prompt": "Match the words with the same meaning.",
  "options": { "kind": "synonym",
    "bank": ["large", "quick", "silent", "angry", "wealthy", "tired", "clever", "kind", "brave", "strange"],
    "items": [{ "text": "big" }, { "text": "fast" }, { "text": "quiet" }, { "text": "rich" }, { "text": "smart" }] },
  "correct_answers": { "answers": ["large", "quick", "silent", "wealthy", "clever"] } }
```

## Reading

`r1_gap_mc3` — short text, each gap `[[1]]`, `[[2]]`… has 3 choices
```json
{ "question_type": "r1_gap_mc3", "difficulty": "A1",
  "prompt": "Read the email. Choose the best word for each gap.",
  "passage": "Hi Anna, I [[1]] a new job! I start [[2]] Monday.",
  "options": { "gaps": [ { "choices": ["have", "has", "having"] }, { "choices": ["in", "on", "at"] } ] },
  "correct_answers": { "answers": ["have", "on"] } }
```

`r2_ordering` — reorder jumbled sentences; `fixed_first` is shown locked in place
```json
{ "question_type": "r2_ordering", "difficulty": "A2",
  "prompt": "Put the sentences in the right order to tell the story.",
  "options": { "fixed_first": "Last summer, Maria decided to learn to swim.",
    "sentences": ["Finally, she swam a whole length by herself.", "At first, she was afraid of the deep water.", "So she booked lessons at the local pool.", "After a few weeks, she began to feel confident."] },
  "correct_answers": { "order": [2, 1, 3, 0] } }
```

`r3_opinion_match` — 4 people, match each question to a person (0–3)
```json
{ "question_type": "r3_opinion_match", "difficulty": "B1",
  "prompt": "Four people give their views on remote work. Who says the following?",
  "options": { "people": [ { "name": "Person A", "text": "…" }, { "name": "Person B", "text": "…" }, { "name": "Person C", "text": "…" }, { "name": "Person D", "text": "…" } ],
    "questions": ["Who thinks offices help creativity?", "Who saves money by working from home?"] },
  "correct_answers": { "answers": [2, 0] } }
```

`r4_banked_cloze` — long text with `[[n]]` gaps, one shared word bank (include distractor words)
```json
{ "question_type": "r4_banked_cloze", "difficulty": "B2",
  "prompt": "Choose the correct word for each gap.",
  "passage": "The committee reached its [[1]] after hours of [[2]].",
  "options": { "bank": ["decision", "debate", "refusal", "solution", "argument"] },
  "correct_answers": { "answers": ["decision", "debate"] } }
```

`r5_heading_match` — assign one heading per paragraph; provide 1 extra heading
```json
{ "question_type": "r5_heading_match", "difficulty": "C1",
  "prompt": "Match a heading to each paragraph.",
  "options": { "paragraphs": ["…para 1…", "…para 2…"], "headings": ["A history of failure", "New evidence emerges", "An unexpected ally"] },
  "correct_answers": { "answers": [1, 0] } }
```

## Listening (media + transcript required on every item)

`l1_mc4`
```json
{ "question_type": "l1_mc4", "difficulty": "A2",
  "prompt": "Listen to the voicemail. What time does the meeting start?",
  "media": "listening/set01-l1-q01.mp3",
  "passage": "TRANSCRIPT: Hi, it's Dan. Quick reminder that tomorrow's meeting starts at half past nine, not nine…",
  "options": { "choices": ["9:00", "9:30", "10:00", "10:30"] },
  "correct_answers": { "choice": 1 } }
```

`l2_speaker_match` — four speakers (0–3) on one topic
```json
{ "question_type": "l2_speaker_match", "difficulty": "B1",
  "prompt": "Four people talk about holidays. Match each statement to a speaker.",
  "media": "listening/set01-l2.mp3", "passage": "TRANSCRIPT: Speaker A: …",
  "options": { "statements": ["prefers to travel alone", "never plans ahead", "always returns to the same place", "hates flying"] },
  "correct_answers": { "answers": [1, 3, 0, 2] } }
```

`l3_opinion_id` — dialogue; each statement is `"man"`, `"woman"` or `"both"`
```json
{ "question_type": "l3_opinion_id", "difficulty": "B2",
  "prompt": "Listen to the discussion about city cycling. Who expresses each opinion?",
  "media": "listening/set01-l3.mp3", "passage": "TRANSCRIPT: …",
  "options": { "statements": ["Cycle lanes should be wider", "Helmets must be compulsory"] },
  "correct_answers": { "answers": ["woman", "both"] } }
```

`l4_monologue_mc` — one longer monologue, 2 MC questions
```json
{ "question_type": "l4_monologue_mc", "difficulty": "C1",
  "prompt": "Listen to the lecture extract and answer both questions.",
  "media": "listening/set01-l4a.mp3", "passage": "TRANSCRIPT: …",
  "options": { "questions": [ { "text": "What is the speaker's main claim?", "choices": ["…", "…", "…", "…"] }, { "text": "What does she imply about earlier studies?", "choices": ["…", "…", "…", "…"] } ] },
  "correct_answers": { "answers": [2, 0] } }
```

## Writing (no correct_answers — teacher/AI graded)

```json
{ "question_type": "w1_form", "prompt": "You are joining the City Sports Club. Answer the questions. Use 1–5 words.",
  "options": { "questions": [ { "text": "What is your favourite sport?" }, { "text": "When do you usually exercise?" }, { "text": "Who do you play with?" }, { "text": "Where is your nearest gym?" }, { "text": "What sport would you like to try?" } ] } }

{ "question_type": "w2_short", "prompt": "You are a new member of the City Sports Club. Tell the club about yourself. Write 20–30 words.",
  "options": { "min_words": 20, "max_words": 30 } }

{ "question_type": "w3_chat", "prompt": "You are talking to members in the club chat room. Reply to each message. Write 30–40 words per reply.",
  "options": { "messages": [ { "author": "Sam", "text": "Welcome! Why did you join our club?" }, { "author": "Priya", "text": "What do you think of the new opening hours?" }, { "author": "Miguel", "text": "Tell us about a sporting event you enjoyed." } ], "min_words": 30, "max_words": 40 } }

{ "question_type": "w4_email", "prompt": "You received this email from the club. Write two replies.",
  "options": { "email": { "subject": "Membership fee increase", "from": "City Sports Club", "body": "Dear member, from next month the annual fee will rise from £50 to £70 to fund new facilities…" },
    "tasks": [ { "register": "informal", "audience": "a friend in the club", "min_words": 40, "max_words": 50 }, { "register": "formal", "audience": "the club manager", "min_words": 120, "max_words": 150 } ] } }
```

## Speaking (no correct_answers — recorded and teacher graded)

```json
{ "question_type": "s1_personal", "prompt": "Answer three questions about yourself.",
  "options": { "questions": ["Please tell me about your family.", "What do you do in your free time?", "Describe your home town."], "response_seconds": 30 } }

{ "question_type": "s2_photo", "prompt": "Describe the picture, then answer two questions.",
  "media": "speaking/set01-s2-market.jpg",
  "options": { "questions": ["Describe the picture.", "Tell me about a market you have visited.", "Do you prefer shopping in markets or supermarkets? Why?"], "response_seconds": 45 } }

{ "question_type": "s3_compare", "prompt": "Compare the two pictures, then answer two questions.",
  "options": { "images": ["speaking/set01-s3-library.jpg", "speaking/set01-s3-cafe.jpg"],
    "questions": ["Describe and compare the two pictures.", "Which place would you prefer to study in? Why?", "Why do people choose different places to work or study?"], "response_seconds": 45 } }

{ "question_type": "s4_abstract", "prompt": "You will talk about one topic for two minutes. You have one minute to prepare.",
  "options": { "questions": ["Tell me about a time you had to learn something new.", "How did you feel about it?", "Why do you think some people enjoy learning new things more than others?"], "prep_seconds": 60, "response_seconds": 120 } }
```

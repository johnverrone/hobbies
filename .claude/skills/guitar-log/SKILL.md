---
name: guitar-log
description: Log a guitar practice session journal entry. Use when the user describes what they practiced, how it went, or wants to record a practice session.
argument-hint: [description of today's practice session]
user-invocable: true
allowed-tools: Read, Write, Glob, Skill
---

Create a guitar practice journal entry based on the user's description: $ARGUMENTS

## Instructions

1. **Determine the date.** Use today's date unless the user specifies a different one.

2. **Read recent entries for context.** Read the 2-3 most recent files in `hobbies/guitar/journal/` to understand ongoing projects, songs being learned, and current focus areas.

3. **Gather required information.** The user's input must cover enough to fill all required fields. If anything is missing or unclear, ask before writing the file. Required information:
   - **duration** (minutes) — how long the session was
   - **theme** — a short, descriptive title for the session (e.g. "NLP Solo & The Middle Playthroughs")
   - **What I worked on** — what was practiced
   - **How it went** — self-assessment of the session
   - **Key takeaways** — bullet list of learnings or observations
   - **Next session focus** — bullet list of what to work on next time

4. **Write the journal entry** to `hobbies/guitar/journal/YYYY-MM-DD.md` using this exact format:

```markdown
---
date: "YYYY-MM-DD"
duration: <minutes as integer>
theme: "<short descriptive title>"
---

- **What I worked on:** <paragraph>
- **How it went:** <paragraph>
- **Key takeaways:**
  - <bullet>
  - <bullet>
- **Next session focus:**
  - <bullet>
  - <bullet>
```

5. **Check for new songs.** If the user mentions practicing or learning a song, check if it exists in `hobbies/guitar/songs.yaml`. If it's not there, ask the user if they'd like to add it, and if yes, invoke the `/guitar-song` skill to add it.

## Style guidelines

- Write in first person from the user's perspective
- Keep the tone casual and reflective — these are personal practice notes, not formal reports
- The theme should be concise but descriptive (typically 3-8 words)
- Key takeaways should be specific and actionable, not generic
- Next session focus should flow naturally from what happened in this session
- Reference specific songs, exercises, courses, or techniques by name when mentioned

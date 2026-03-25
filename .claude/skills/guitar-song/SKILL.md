---
name: guitar-song
description: Look up guitar tab links, metadata, and practice notes for a song, then optionally add it to guitar/songs.yaml
argument-hint: <song name> - <artist>
user-invocable: true
---

# Guitar Song Lookup & Add to songs.yaml

When invoked with `/guitar-song <song name> - <artist>`, follow these steps:

## Step 1: Search for a Tab on Ultimate Guitar

Use web search to find the highest-rated **free** tab on Ultimate Guitar (ultimate-guitar.com) for the given song and artist. Look for tab types "Tab" or "Chords" only — do NOT use "Tab Pro", "Guitar Pro", or "Official" (these are paid). Prefer results with the highest ratings/votes. Extract the direct URL to the tab page.

If you cannot find a tab on Ultimate Guitar, note that and still proceed with the other steps.

## Step 2: Determine Song Metadata

Based on your knowledge of the song, determine the following metadata. Each select field **must** use one of the valid options listed below.

### Valid Options

**Genre** (select — pick one):
- Rock, Blues, Jazz, Classical, Folk, Country, Metal, Pop

**Difficulty** (select — pick one):
- Beginner, Intermediate, Advanced, Expert

**Key** (select — pick one):
- C, C#/Db, D, D#/Eb, E, F, F#/Gb, G, G#/Ab, A, A#/Bb, B

**Tuning** (select — pick one):
- Standard (EADGBE), Drop D, Drop C, Half Step Down, Open G, Open D, DADGAD, Open E, Drop B

**BPM** (number): The approximate tempo of the song.

**Capo Position** (number): Capo fret number, or 0 if no capo is used. If the most common tab/chord arrangement uses a capo, set this accordingly.

**Progress** (status): Always set to `Not Started` for new songs.

## Step 3: Generate Practice Notes

Write 2-3 sentences of guitar-specific practice tips for this song. Focus on:
- Key techniques needed (fingerpicking, barre chords, hammer-ons, etc.)
- Tricky sections to watch out for
- Suggested practice approach

## Step 4: Present Results for Review

Display all gathered information in a formatted table like this:

| Field | Value |
|-------|-------|
| Song Title | _title_ |
| Artist | _artist_ |
| Genre | _genre_ |
| Difficulty | _difficulty_ |
| Key | _key_ |
| Tuning | _tuning_ |
| BPM | _bpm_ |
| Capo Position | _capo_ |
| Tab Link | _url_ |
| Progress | Not Started |

**Practice Notes:** _notes_

## Step 5: Ask for Confirmation

Use the AskUserQuestion tool to ask:
- "Add this song to guitar/songs.yaml?"
- Options: "Yes, add it" / "No, skip"

## Step 6: Add to songs.yaml

If the user confirms, append the song entry to `hobbies/guitar/songs.yaml` using the Edit tool. Insert the new entry under the appropriate difficulty section comment (`# --- Beginner ---`, `# --- Intermediate ---`, `# --- Advanced ---`), at the end of that section.

Use this exact YAML format (matching existing entries):

```yaml
  - title: "<song title>"
    artist: "<artist>"
    difficulty: "<difficulty>"
    genre: "<genre>"
    key: "<key>"
    tuning: "<tuning>"
    bpm: <bpm>
    capo: <capo>          # only include if capo > 0
    progress: "Not Started"
    tab_link: "<url>"
    notes: "<practice notes>"
```

**Important:**
- Omit the `capo` field entirely if capo is 0 (match existing convention in the file)
- Use double quotes for all string values
- Place the entry at the end of its difficulty section, before the next section comment or end of file
- Read the file first to find the correct insertion point

After adding, confirm success to the user.

import { Hono } from "hono";
import { parse } from "yaml";
import songsYaml from "@hobbies/guitar/songs.yaml";
import planMd from "@hobbies/guitar/plan.md";
import journalEntries from "../generated/guitar-journal.json";

type Song = {
  title: string;
  artist: string;
  difficulty: string;
  genre: string;
  key: string;
  tuning: string;
  bpm: number;
  capo?: number;
  progress: string;
  tab_link: string;
  notes: string;
};

type SongsData = {
  songs: Song[];
};

export type JournalEntry = {
  date: string;
  duration: number;
  week: number;
  theme: string;
  content: string;
};

const data: SongsData = parse(songsYaml);
const journal: JournalEntry[] = journalEntries as JournalEntry[];

const guitar = new Hono();

guitar.get("/songs", (c) => {
  return c.json(data);
});

guitar.get("/journal", (c) => {
  // Return entries with metadata (content included for full access)
  return c.json({ entries: journal });
});

guitar.get("/journal/:date", (c) => {
  const date = c.req.param("date");
  const entry = journal.find((e) => e.date === date);
  if (!entry) {
    return c.json({ error: "Entry not found" }, 404);
  }
  return c.json(entry);
});

guitar.get("/plan", (c) => {
  return c.json({ content: planMd, source: "plan.md" });
});

// Keep /progress for backwards compatibility — returns all journal entries as combined markdown
guitar.get("/progress", (c) => {
  const combined = journal
    .map((e) => `### ${e.date} (${e.duration} hrs)\n\n${e.content}`)
    .join("\n\n---\n\n");
  return c.json({ content: combined, source: "journal/" });
});

export { data as songsData, planMd, journal as journalData };
export default guitar;

import { readdir, readFile, mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

const JOURNAL_DIR = join(import.meta.dirname, "../../hobbies/guitar/journal");
const OUT_DIR = join(import.meta.dirname, "../src/generated");

interface JournalEntry {
  date: string;
  duration: number;
  week: number;
  theme: string;
  content: string;
}

function parseFrontmatter(raw: string): { meta: Record<string, string>; content: string } {
  const match = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) return { meta: {}, content: raw };

  const meta: Record<string, string> = {};
  for (const line of match[1].split("\n")) {
    const idx = line.indexOf(":");
    if (idx === -1) continue;
    const key = line.slice(0, idx).trim();
    const val = line.slice(idx + 1).trim().replace(/^["']|["']$/g, "");
    meta[key] = val;
  }
  return { meta, content: match[2].trim() };
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });

  const files = (await readdir(JOURNAL_DIR))
    .filter((f) => f.endsWith(".md"))
    .sort()
    .reverse(); // newest first

  const entries: JournalEntry[] = [];
  for (const file of files) {
    const raw = await readFile(join(JOURNAL_DIR, file), "utf-8");
    const { meta, content } = parseFrontmatter(raw);
    entries.push({
      date: meta.date || file.replace(".md", ""),
      duration: parseFloat(meta.duration) || 0,
      week: parseInt(meta.week) || 0,
      theme: meta.theme || "",
      content,
    });
  }

  await writeFile(
    join(OUT_DIR, "guitar-journal.json"),
    JSON.stringify(entries, null, 2)
  );

  console.log(`Generated ${entries.length} guitar journal entries`);
}

main();

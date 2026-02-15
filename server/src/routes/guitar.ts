import { Hono } from "hono";
import { parse } from "yaml";
import songsYaml from "../../../guitar/songs.yaml";
import progressMd from "../../../guitar/progress.md";
import planMd from "../../../guitar/plan.md";

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

const data: SongsData = parse(songsYaml);

const guitar = new Hono();

guitar.get("/songs", (c) => {
  return c.json(data);
});

guitar.get("/progress", (c) => {
  return c.json({ content: progressMd, source: "progress.md" });
});

guitar.get("/plan", (c) => {
  return c.json({ content: planMd, source: "plan.md" });
});

export default guitar;

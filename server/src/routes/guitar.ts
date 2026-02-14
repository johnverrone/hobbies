import { Hono } from "hono";
import { parse } from "yaml";
import songsYaml from "../../../guitar/songs.yaml";

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

export default guitar;

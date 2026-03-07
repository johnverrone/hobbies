import { Hono } from "hono";
import { parse } from "yaml";
import roundsYaml from "@hobbies/golf/rounds.yaml";

type Round = {
  date: string;
  course: string;
  tees: string;
  holes: number;
  score: number;
  score_differential: number | null;
  fairways_hit: number;
  fairways_possible: number;
  gir: number;
  putts: number;
  penalties: number;
  feel: string;
  playing_partners: string[];
  notes: string;
};

type RoundsData = {
  rounds: Round[];
};

const roundsData: RoundsData = parse(roundsYaml);

const golf = new Hono();

golf.get("/rounds", (c) => {
  return c.json(roundsData);
});

export default golf;

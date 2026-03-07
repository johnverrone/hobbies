import { Hono } from "hono";
import { parse } from "yaml";
import roundsYaml from "@hobbies/golf/rounds.yaml";

type Round = {
  date: string;
  course: string;
  tees: string;
  rating: number;
  slope: number;
  holes: number;
  score: number;
  putts: number;
  gir: number;
  fir: number;
  handicap_differential: number;
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

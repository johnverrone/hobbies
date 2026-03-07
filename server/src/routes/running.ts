import { Hono } from "hono";
import { parse } from "yaml";
import runsYaml from "@hobbies/running/runs.yaml";
import racesYaml from "@hobbies/running/races.yaml";
import gearYaml from "@hobbies/running/gear.yaml";
import progressMd from "@hobbies/running/progress.md";
import planMd from "@hobbies/running/plan.md";
import prsMd from "@hobbies/running/prs.md";

type Run = {
  date: string;
  type: string;
  distance_mi: number;
  duration_min: number;
  pace_per_mi: string;
  heart_rate_avg: number;
  shoes: string;
  route: string;
  feel: string;
  notes: string;
};

type RunsData = {
  runs: Run[];
};

type Race = {
  name: string;
  slug: string;
  date: string;
  distance: string;
  distance_mi: number;
  location: string;
  goal_time: string;
  finish_time: string | null;
  bq_qualifier: boolean;
  registered: boolean;
  notes: string;
};

type RacesData = {
  races: Race[];
};

type Gear = {
  name: string;
  slug: string;
  type: string;
  brand: string;
  model: string;
  acquired: string;
  status: string;
  mileage: number | null;
  mileage_limit: number | null;
  cost: number;
  notes: string;
};

type GearData = {
  gear: Gear[];
};

const runsData: RunsData = parse(runsYaml);
const racesData: RacesData = parse(racesYaml);
const gearData: GearData = parse(gearYaml);

const racesBySlug = new Map(racesData.races.map((r) => [r.slug, r]));

const running = new Hono();

running.get("/runs", (c) => {
  return c.json(runsData);
});

running.get("/races", (c) => {
  return c.json(racesData);
});

running.get("/races/:slug", (c) => {
  const race = racesBySlug.get(c.req.param("slug"));
  if (!race) return c.json({ error: "Race not found" }, 404);
  return c.json(race);
});

running.get("/gear", (c) => {
  return c.json(gearData);
});

running.get("/progress", (c) => {
  return c.json({ content: progressMd, source: "progress.md" });
});

running.get("/plan", (c) => {
  return c.json({ content: planMd, source: "plan.md" });
});

running.get("/prs", (c) => {
  return c.json({ content: prsMd, source: "prs.md" });
});

export default running;

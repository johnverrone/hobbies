import { Hono } from "hono";
import { parse } from "yaml";
import workoutsYaml from "@hobbies/strength/workouts.yaml";
import prsYaml from "@hobbies/strength/prs.yaml";
import gearYaml from "@hobbies/strength/gear.yaml";
import progressMd from "@hobbies/strength/progress.md";
import planMd from "@hobbies/strength/plan.md";
import bodyMd from "@hobbies/strength/body.md";

type Exercise = {
  name: string;
  sets: number;
  reps: number;
  weight_lbs: number;
  rpe: number;
  notes: string | null;
};

type Workout = {
  date: string;
  type: string;
  program: string;
  bodyweight_lbs: number;
  exercises: Exercise[];
  session_notes: string;
  feel: string;
};

type WorkoutsData = {
  workouts: Workout[];
};

type PR = {
  lift: string;
  weight_lbs: number;
  reps: number;
  type: string;
  date: string;
  notes: string;
};

type PRsData = {
  prs: PR[];
};

type Gear = {
  name: string;
  slug: string;
  type: string;
  brand: string;
  model: string;
  acquired: string;
  status: string;
  cost: number;
  notes: string;
};

type GearData = {
  gear: Gear[];
};

const workoutsData: WorkoutsData = parse(workoutsYaml);
const prsData: PRsData = parse(prsYaml);
const gearData: GearData = parse(gearYaml);

const strength = new Hono();

strength.get("/workouts", (c) => {
  return c.json(workoutsData);
});

strength.get("/prs", (c) => {
  return c.json(prsData);
});

strength.get("/gear", (c) => {
  return c.json(gearData);
});

strength.get("/progress", (c) => {
  return c.json({ content: progressMd, source: "progress.md" });
});

strength.get("/plan", (c) => {
  return c.json({ content: planMd, source: "plan.md" });
});

strength.get("/body", (c) => {
  return c.json({ content: bodyMd, source: "body.md" });
});

export default strength;

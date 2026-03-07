import { Hono } from "hono";
import { parse } from "yaml";
import prsYaml from "@hobbies/strength/prs.yaml";
import progressMd from "@hobbies/strength/progress.md";
import planMd from "@hobbies/strength/plan.md";

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

const prsData: PRsData = parse(prsYaml);

const strength = new Hono();

strength.get("/prs", (c) => {
  return c.json(prsData);
});

strength.get("/progress", (c) => {
  return c.json({ content: progressMd, source: "progress.md" });
});

strength.get("/plan", (c) => {
  return c.json({ content: planMd, source: "plan.md" });
});

export { prsData, progressMd as strengthProgressMd, planMd as strengthPlanMd };
export default strength;

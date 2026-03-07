import { Hono } from "hono";
import { parse } from "yaml";
import roundsYaml from "@hobbies/golf/rounds.yaml";
import coursesYaml from "@hobbies/golf/courses.yaml";
import skillsYaml from "@hobbies/golf/skills.yaml";
import handicapYaml from "@hobbies/golf/handicap.yaml";
import progressMd from "@hobbies/golf/progress.md";
import planMd from "@hobbies/golf/plan.md";

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

type Course = {
  name: string;
  slug: string;
  location: string;
  par: number;
  rating: number;
  slope: number;
  played: boolean;
  times_played: number;
  first_played: string | null;
  best_score: number | null;
  bucket_list: boolean;
  notes: string;
};

type CoursesData = {
  courses: Course[];
};

type Skill = {
  area: string;
  level: string;
  confidence: number;
  handicap_impact: string;
  notes: string;
};

type SkillsData = {
  last_updated: string;
  skills: Skill[];
};

type HandicapEntry = {
  date: string;
  index: number;
  differential_count: number;
  notes: string;
};

type HandicapData = {
  handicap_history: HandicapEntry[];
};

const roundsData: RoundsData = parse(roundsYaml);
const coursesData: CoursesData = parse(coursesYaml);
const skillsData: SkillsData = parse(skillsYaml);
const handicapData: HandicapData = parse(handicapYaml);

const coursesBySlug = new Map(coursesData.courses.map((c) => [c.slug, c]));

const golf = new Hono();

golf.get("/rounds", (c) => {
  return c.json(roundsData);
});

golf.get("/courses", (c) => {
  return c.json(coursesData);
});

golf.get("/courses/:slug", (c) => {
  const course = coursesBySlug.get(c.req.param("slug"));
  if (!course) return c.json({ error: "Course not found" }, 404);
  return c.json(course);
});

golf.get("/skills", (c) => {
  return c.json(skillsData);
});

golf.get("/handicap", (c) => {
  return c.json(handicapData);
});

golf.get("/progress", (c) => {
  return c.json({ content: progressMd, source: "progress.md" });
});

golf.get("/plan", (c) => {
  return c.json({ content: planMd, source: "plan.md" });
});

export default golf;

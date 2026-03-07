import { Hono } from "hono";
import { parse } from "yaml";
import projectsYaml from "@hobbies/software/projects.yaml";
import skillsYaml from "@hobbies/software/skills.yaml";
import ideasYaml from "@hobbies/software/ideas.yaml";
import progressMd from "@hobbies/software/progress.md";
import planMd from "@hobbies/software/plan.md";
import goalsMd from "@hobbies/software/goals.md";

type Project = {
  title: string;
  slug: string;
  status: string;
  type: string;
  stack: string[];
  repo: string | null;
  url: string | null;
  started: string | null;
  shipped: string | null;
  revenue_model: string;
  mrr: number;
  description: string;
  monetize_notes: string | null;
  next_milestone: string | null;
};

type ProjectsData = {
  projects: Project[];
};

type Skill = {
  domain: string;
  level: string;
  confidence: number;
  notes: string;
};

type SkillsData = {
  last_updated: string;
  skills: Skill[];
};

type Idea = {
  title: string;
  captured: string;
  spark: string;
  potential: string;
  monetizable: boolean;
};

type IdeasData = {
  ideas: Idea[];
};

const projectsData: ProjectsData = parse(projectsYaml);
const skillsData: SkillsData = parse(skillsYaml);
const ideasData: IdeasData = parse(ideasYaml);

const projectsBySlug = new Map(projectsData.projects.map((p) => [p.slug, p]));

const software = new Hono();

software.get("/projects", (c) => {
  return c.json(projectsData);
});

software.get("/projects/:slug", (c) => {
  const project = projectsBySlug.get(c.req.param("slug"));
  if (!project) return c.json({ error: "Project not found" }, 404);
  return c.json(project);
});

software.get("/skills", (c) => {
  return c.json(skillsData);
});

software.get("/ideas", (c) => {
  return c.json(ideasData);
});

software.get("/progress", (c) => {
  return c.json({ content: progressMd, source: "progress.md" });
});

software.get("/plan", (c) => {
  return c.json({ content: planMd, source: "plan.md" });
});

software.get("/goals", (c) => {
  return c.json({ content: goalsMd, source: "goals.md" });
});

export default software;

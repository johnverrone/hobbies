import { Hono } from "hono";
import { parse } from "yaml";
import projectsYaml from "@hobbies/video/projects.yaml";
import gearYaml from "@hobbies/video/gear.yaml";
import ideasYaml from "@hobbies/video/ideas.yaml";
import channelsYaml from "@hobbies/video/channels.yaml";
import progressMd from "@hobbies/video/progress.md";
import planMd from "@hobbies/video/plan.md";

type VideoProject = {
  title: string;
  slug: string;
  type: string;
  platform: string;
  status: string;
  shot_date: string | null;
  published_date: string | null;
  duration_min: number | null;
  channel: string | null;
  views: number | null;
  revenue_usd: number | null;
  gear_used: string[];
  notes: string;
};

type ProjectsData = {
  projects: VideoProject[];
};

type Gear = {
  name: string;
  slug: string;
  category: string;
  brand: string;
  model: string;
  acquired: string;
  cost: number;
  status: string;
  notes: string;
};

type GearData = {
  gear: Gear[];
};

type Idea = {
  title: string;
  captured: string;
  type: string;
  platform: string;
  potential: string;
  monetizable: boolean;
  notes: string;
};

type IdeasData = {
  ideas: Idea[];
};

type Channel = {
  name: string;
  slug: string;
  platform: string;
  handle: string;
  url: string;
  subscribers: number;
  monetized: boolean;
  monetization_threshold: number | null;
  watch_hours: number | null;
  notes: string;
};

type ChannelsData = {
  channels: Channel[];
};

const projectsData: ProjectsData = parse(projectsYaml);
const gearData: GearData = parse(gearYaml);
const ideasData: IdeasData = parse(ideasYaml);
const channelsData: ChannelsData = parse(channelsYaml);

const projectsBySlug = new Map(projectsData.projects.map((p) => [p.slug, p]));

const video = new Hono();

video.get("/projects", (c) => {
  return c.json(projectsData);
});

video.get("/projects/:slug", (c) => {
  const project = projectsBySlug.get(c.req.param("slug"));
  if (!project) return c.json({ error: "Project not found" }, 404);
  return c.json(project);
});

video.get("/gear", (c) => {
  return c.json(gearData);
});

video.get("/ideas", (c) => {
  return c.json(ideasData);
});

video.get("/channels", (c) => {
  return c.json(channelsData);
});

video.get("/progress", (c) => {
  return c.json({ content: progressMd, source: "progress.md" });
});

video.get("/plan", (c) => {
  return c.json({ content: planMd, source: "plan.md" });
});

export default video;

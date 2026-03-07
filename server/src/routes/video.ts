import { Hono } from "hono";
import { parse } from "yaml";
import projectsYaml from "@hobbies/video/projects.yaml";
import ideasYaml from "@hobbies/video/ideas.yaml";
import channelsYaml from "@hobbies/video/channels.yaml";
import progressMd from "@hobbies/video/progress.md";
import planMd from "@hobbies/video/plan.md";

type ProjectsData = {
  projects: unknown[];
};

type IdeasData = {
  ideas: unknown[];
};

type Channel = {
  name: string;
  platform: string;
  handle: string;
  url: string;
};

type ChannelsData = {
  channels: Channel[];
};

const projectsData: ProjectsData = parse(projectsYaml);
const ideasData: IdeasData = parse(ideasYaml);
const channelsData: ChannelsData = parse(channelsYaml);

const video = new Hono();

video.get("/projects", (c) => {
  return c.json(projectsData);
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

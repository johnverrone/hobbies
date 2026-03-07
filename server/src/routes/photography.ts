import { Hono } from "hono";
import { parse } from "yaml";
import shootsYaml from "@hobbies/photography/shoots.yaml";
import gearYaml from "@hobbies/photography/gear.yaml";
import locationsYaml from "@hobbies/photography/locations.yaml";
import clientsYaml from "@hobbies/photography/clients.yaml";
import progressMd from "@hobbies/photography/progress.md";
import planMd from "@hobbies/photography/plan.md";

type Shoot = {
  title: string;
  slug: string;
  type: string;
  date: string;
  location: string;
  gear_used: string[];
  shots_taken: number;
  keepers: number;
  editing_status: string;
  published: boolean;
  platform: string | null;
  client: string | null;
  revenue_usd: number | null;
  notes: string;
};

type ShootsData = {
  shoots: Shoot[];
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

type Location = {
  name: string;
  slug: string;
  city: string;
  type: string;
  visited: boolean;
  best_season: string;
  best_time: string;
  coordinates: string;
  notes: string;
};

type LocationsData = {
  locations: Location[];
};

type Client = {
  name: string;
  slug: string;
  type: string;
  status: string;
  date: string;
  revenue_usd: number;
  referral_source: string;
  notes: string;
};

type ClientsData = {
  clients: Client[];
};

const shootsData: ShootsData = parse(shootsYaml);
const gearData: GearData = parse(gearYaml);
const locationsData: LocationsData = parse(locationsYaml);
const clientsData: ClientsData = parse(clientsYaml);

const shootsBySlug = new Map(shootsData.shoots.map((s) => [s.slug, s]));

const photography = new Hono();

photography.get("/shoots", (c) => {
  return c.json(shootsData);
});

photography.get("/shoots/:slug", (c) => {
  const shoot = shootsBySlug.get(c.req.param("slug"));
  if (!shoot) return c.json({ error: "Shoot not found" }, 404);
  return c.json(shoot);
});

photography.get("/gear", (c) => {
  return c.json(gearData);
});

photography.get("/locations", (c) => {
  return c.json(locationsData);
});

photography.get("/clients", (c) => {
  return c.json(clientsData);
});

photography.get("/progress", (c) => {
  return c.json({ content: progressMd, source: "progress.md" });
});

photography.get("/plan", (c) => {
  return c.json({ content: planMd, source: "plan.md" });
});

export default photography;

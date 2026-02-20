import { Hono } from "hono";
import beansJson from "../generated/beans.json";
import roastersJson from "../generated/roasters.json";

type Bean = {
  name: string;
  slug: string;
  roaster: string;
  rating: number;
  origins: string[];
  flavors: string[];
  process: string;
  single_origin: boolean;
  currently_brewing: boolean;
  price_12oz: number;
  notes: string;
  image_url: string;
  created: string;
};

type Roaster = {
  name: string;
  slug: string;
  location: string;
  website: string;
  notes: string;
  image_url: string;
};

const beans = beansJson as Bean[];
const roasters = roastersJson as Roaster[];

const beansBySlug = new Map(beans.map((b) => [b.slug, b]));
const roastersBySlug = new Map(roasters.map((r) => [r.slug, r]));

const coffee = new Hono();

coffee.get("/beans", (c) => {
  return c.json(beans);
});

coffee.get("/beans/:slug", (c) => {
  const bean = beansBySlug.get(c.req.param("slug"));
  if (!bean) return c.json({ error: "Bean not found" }, 404);
  const roaster = roastersBySlug.get(bean.roaster);
  return c.json({ ...bean, roaster: roaster ?? bean.roaster });
});

coffee.get("/roasters", (c) => {
  return c.json(roasters);
});

coffee.get("/roasters/:slug", (c) => {
  const roaster = roastersBySlug.get(c.req.param("slug"));
  if (!roaster) return c.json({ error: "Roaster not found" }, 404);
  return c.json(roaster);
});

export default coffee;

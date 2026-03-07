import { Hono } from "hono";
import { parse } from "yaml";
import portfolioYaml from "@hobbies/photography/portfolio.yaml";
import inspirationYaml from "@hobbies/photography/inspiration.yaml";

type Photo = {
  file: string;
  caption: string;
};

type Collection = {
  title: string;
  slug: string;
  date: string;
  category: string;
  location: string;
  photos: Photo[];
  notes: string;
};

type PortfolioData = {
  storage_bucket: string;
  collections: Collection[];
};

type Inspiration = {
  name: string;
  style: string;
  what_i_like: string;
  reference: string;
};

type InspirationData = {
  inspiration: Inspiration[];
};

const portfolioData: { portfolio: PortfolioData } = parse(portfolioYaml);
const inspirationData: InspirationData = parse(inspirationYaml);

const collectionsBySlug = new Map(
  portfolioData.portfolio.collections.map((c) => [c.slug, c])
);

const photography = new Hono();

photography.get("/portfolio", (c) => {
  return c.json(portfolioData);
});

photography.get("/portfolio/:slug", (c) => {
  const collection = collectionsBySlug.get(c.req.param("slug"));
  if (!collection) return c.json({ error: "Collection not found" }, 404);
  return c.json(collection);
});

photography.get("/inspiration", (c) => {
  return c.json(inspirationData);
});

export default photography;

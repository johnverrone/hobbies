import { Hono } from "hono";
import progressMd from "@hobbies/running/progress.md";
import prsMd from "@hobbies/running/prs.md";

const running = new Hono();

running.get("/progress", (c) => {
  return c.json({ content: progressMd, source: "progress.md" });
});

running.get("/prs", (c) => {
  return c.json({ content: prsMd, source: "prs.md" });
});

export { progressMd as runningProgressMd, prsMd };
export default running;

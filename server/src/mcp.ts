import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { z } from "zod";
import type { Context } from "hono";

// --- data imports from route modules (already parsed at module load) ---
import { songsData, progressMd as guitarProgressMd, planMd as guitarPlanMd } from "./routes/guitar";
import { beans, roasters } from "./routes/coffee";
import { projectsData, skillsData, ideasData, softwareProgressMd, goalsMd } from "./routes/software";
import { runningProgressMd, prsMd } from "./routes/running";
import { prsData, strengthProgressMd, strengthPlanMd } from "./routes/strength";
import { videoProjectsData, videoIdeasData, channelsData, videoProgressMd, videoPlanMd } from "./routes/video";
import { portfolioData, inspirationData } from "./routes/photography";
import { roundsData } from "./routes/golf";

// ---------------------------------------------------------------------------
// Resource registry — maps hobby://hobby/resource URIs to their data
// ---------------------------------------------------------------------------

type ResourceEntry =
  | { mime: "application/json"; data: unknown }
  | { mime: "text/markdown"; data: string };

const RESOURCES: Record<string, ResourceEntry> = {
  // guitar
  "hobby://guitar/songs":    { mime: "application/json", data: songsData },
  "hobby://guitar/progress": { mime: "text/markdown",    data: guitarProgressMd },
  "hobby://guitar/plan":     { mime: "text/markdown",    data: guitarPlanMd },
  // coffee
  "hobby://coffee/beans":    { mime: "application/json", data: beans },
  "hobby://coffee/roasters": { mime: "application/json", data: roasters },
  // software
  "hobby://software/projects": { mime: "application/json", data: projectsData },
  "hobby://software/skills":   { mime: "application/json", data: skillsData },
  "hobby://software/ideas":    { mime: "application/json", data: ideasData },
  "hobby://software/progress": { mime: "text/markdown",    data: softwareProgressMd },
  "hobby://software/goals":    { mime: "text/markdown",    data: goalsMd },
  // running (markdown only — YAML data not yet wired up)
  "hobby://running/progress": { mime: "text/markdown", data: runningProgressMd },
  "hobby://running/prs":      { mime: "text/markdown", data: prsMd },
  // strength
  "hobby://strength/prs":      { mime: "application/json", data: prsData },
  "hobby://strength/progress": { mime: "text/markdown",    data: strengthProgressMd },
  "hobby://strength/plan":     { mime: "text/markdown",    data: strengthPlanMd },
  // video
  "hobby://video/projects": { mime: "application/json", data: videoProjectsData },
  "hobby://video/ideas":    { mime: "application/json", data: videoIdeasData },
  "hobby://video/channels": { mime: "application/json", data: channelsData },
  "hobby://video/progress": { mime: "text/markdown",    data: videoProgressMd },
  "hobby://video/plan":     { mime: "text/markdown",    data: videoPlanMd },
  // photography
  "hobby://photography/portfolio":   { mime: "application/json", data: portfolioData },
  "hobby://photography/inspiration": { mime: "application/json", data: inspirationData },
  // golf
  "hobby://golf/rounds": { mime: "application/json", data: roundsData },
};

// Group resources by hobby for list_hobby_resources
const HOBBY_RESOURCES: Record<string, { data: string[]; narratives: string[] }> = {
  guitar:      { data: ["songs"],                         narratives: ["progress", "plan"] },
  coffee:      { data: ["beans", "roasters"],             narratives: [] },
  software:    { data: ["projects", "skills", "ideas"],   narratives: ["progress", "goals"] },
  running:     { data: [],                                narratives: ["progress", "prs"] },
  strength:    { data: ["prs"],                           narratives: ["progress", "plan"] },
  video:       { data: ["projects", "ideas", "channels"], narratives: ["progress", "plan"] },
  photography: { data: ["portfolio", "inspiration"],      narratives: [] },
  golf:        { data: ["rounds"],                        narratives: [] },
};

// ---------------------------------------------------------------------------
// Server factory — fresh McpServer instance per request (stateless)
// ---------------------------------------------------------------------------

function createServer(): McpServer {
  const server = new McpServer({
    name: "hobbies",
    version: "1.0.0",
  });

  // -------------------------------------------------------------------------
  // Resources
  // -------------------------------------------------------------------------

  for (const [uri, entry] of Object.entries(RESOURCES)) {
    const parts = uri.replace("hobby://", "").split("/");
    const hobby = parts[0];
    const resource = parts[1];
    server.registerResource(
      `${hobby}/${resource}`,
      uri,
      {
        description: `${hobby} ${resource} data`,
        mimeType: entry.mime,
      },
      async () => ({
        contents: [
          entry.mime === "text/markdown"
            ? { uri, mimeType: entry.mime, text: entry.data as string }
            : { uri, mimeType: entry.mime, text: JSON.stringify(entry.data, null, 2) },
        ],
      })
    );
  }

  // -------------------------------------------------------------------------
  // General tools
  // -------------------------------------------------------------------------

  server.registerTool(
    "list_hobby_resources",
    {
      description: "Lists all tracked hobbies and the data resources available for each. Call this first to understand what can be queried.",
      inputSchema: {
        hobby: z.string().optional().describe("Filter to a specific hobby. If omitted, lists all hobbies."),
      },
    },
    async ({ hobby }) => {
      const entries = hobby ? { [hobby]: HOBBY_RESOURCES[hobby] } : HOBBY_RESOURCES;

      if (hobby && !HOBBY_RESOURCES[hobby]) {
        return {
          content: [{ type: "text" as const, text: `Unknown hobby: "${hobby}". Available: ${Object.keys(HOBBY_RESOURCES).join(", ")}` }],
          isError: true,
        };
      }

      const lines = Object.entries(entries).map(([h, r]) => {
        const data = r.data.length
          ? `Data:\n${r.data.map((d) => `  - ${d} (hobby://${h}/${d})`).join("\n")}`
          : "Data: none yet";
        const narratives = r.narratives.length
          ? `Narratives:\n${r.narratives.map((n) => `  - ${n} (hobby://${h}/${n})`).join("\n")}`
          : "";
        return `**${h}**\n${data}${narratives ? `\n${narratives}` : ""}`;
      });

      return { content: [{ type: "text" as const, text: lines.join("\n\n") }] };
    }
  );

  server.registerTool(
    "read_hobby_data",
    {
      description: "Returns the full data for a specific hobby resource. Use list_hobby_resources to see what's available.",
      inputSchema: {
        hobby: z.string().describe("The hobby name (e.g. 'guitar', 'software', 'golf')"),
        resource: z.string().describe("The resource name (e.g. 'songs', 'projects', 'rounds')"),
      },
    },
    async ({ hobby, resource }) => {
      const uri = `hobby://${hobby}/${resource}`;
      const entry = RESOURCES[uri];
      if (!entry) {
        const available = Object.keys(RESOURCES)
          .filter((k) => k.startsWith(`hobby://${hobby}/`))
          .map((k) => k.replace(`hobby://${hobby}/`, ""));
        const msg = available.length
          ? `Unknown resource "${resource}" for hobby "${hobby}". Available: ${available.join(", ")}`
          : `Unknown hobby "${hobby}". Available hobbies: ${Object.keys(HOBBY_RESOURCES).join(", ")}`;
        return { content: [{ type: "text" as const, text: msg }], isError: true };
      }
      const text = entry.mime === "text/markdown"
        ? (entry.data as string)
        : JSON.stringify(entry.data, null, 2);
      return { content: [{ type: "text" as const, text }] };
    }
  );

  server.registerTool(
    "read_hobby_narrative",
    {
      description: "Returns the markdown content of a hobby narrative file (progress log, plan, goals, prs, etc.).",
      inputSchema: {
        hobby: z.string().describe("The hobby name"),
        file: z.string().describe("The file name without extension (e.g. 'progress', 'plan', 'goals', 'prs')"),
      },
    },
    async ({ hobby, file }) => {
      const uri = `hobby://${hobby}/${file}`;
      const entry = RESOURCES[uri];
      if (!entry || entry.mime !== "text/markdown") {
        const available = Object.keys(RESOURCES)
          .filter((k) => k.startsWith(`hobby://${hobby}/`) && RESOURCES[k].mime === "text/markdown")
          .map((k) => k.replace(`hobby://${hobby}/`, ""));
        const msg = available.length
          ? `"${file}" is not a narrative for "${hobby}". Narratives: ${available.join(", ")}`
          : `Unknown hobby "${hobby}". Available: ${Object.keys(HOBBY_RESOURCES).join(", ")}`;
        return { content: [{ type: "text" as const, text: msg }], isError: true };
      }
      return { content: [{ type: "text" as const, text: entry.data as string }] };
    }
  );

  // -------------------------------------------------------------------------
  // Convenience tools
  // -------------------------------------------------------------------------

  server.registerTool(
    "get_active_projects",
    {
      description: "Returns software projects filtered by status. Defaults to all non-Abandoned projects.",
      inputSchema: {
        status: z.string().optional().describe("Filter to a specific status: 'Idea', 'Active', 'Shipped', 'Paused', 'Abandoned'. If omitted, returns all except Abandoned."),
      },
    },
    async ({ status }) => {
      const projects = projectsData.projects.filter((p) =>
        status ? p.status === status : p.status !== "Abandoned"
      );
      return { content: [{ type: "text" as const, text: JSON.stringify(projects, null, 2) }] };
    }
  );

  server.registerTool(
    "get_golf_stats",
    {
      description: "Returns golf round statistics: scoring average, avg putts, avg GIR, avg FIR, and an estimated handicap index computed from score differentials.",
      inputSchema: {
        limit: z.number().int().min(1).max(50).optional().describe("Number of most recent rounds to include. Defaults to all rounds."),
      },
    },
    async ({ limit }) => {
      const rounds = limit ? roundsData.rounds.slice(0, limit) : roundsData.rounds;

      if (rounds.length === 0) {
        return { content: [{ type: "text" as const, text: "No rounds recorded yet." }] };
      }

      const avg = (vals: number[]) =>
        Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10;

      const fullRounds = rounds.filter((r) => r.holes === 18);

      // WHS handicap: best 8 of last 20 differentials (or fewer if < 20 available)
      const differentials = fullRounds.map((r) => r.handicap_differential).sort((a, b) => a - b);
      const bestCount = Math.min(8, Math.ceil(differentials.length * 0.4));
      const handicapIndex = bestCount > 0
        ? Math.round(avg(differentials.slice(0, bestCount)) * 0.96 * 10) / 10
        : null;

      const stats = {
        rounds_total: rounds.length,
        rounds_18_hole: fullRounds.length,
        scoring_avg: avg(rounds.map((r) => r.score)),
        putts_avg: avg(rounds.map((r) => r.putts)),
        gir_avg: avg(rounds.map((r) => r.gir)),
        fir_avg: avg(rounds.map((r) => r.fir)),
        estimated_handicap_index: handicapIndex,
        note: handicapIndex !== null
          ? `Computed from best ${bestCount} of ${fullRounds.length} 18-hole differentials (×0.96 playing conditions factor)`
          : "Not enough 18-hole rounds to estimate handicap",
      };

      return { content: [{ type: "text" as const, text: JSON.stringify(stats, null, 2) }] };
    }
  );

  return server;
}

// ---------------------------------------------------------------------------
// Hono handler — fresh server + stateless transport per request
// ---------------------------------------------------------------------------

export async function mcpHandler(c: Context) {
  const server = createServer();
  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined, // stateless mode
  });
  await server.connect(transport);
  return transport.handleRequest(c.req.raw);
}

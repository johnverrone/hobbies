import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { McpAgent } from "agents/mcp";
import { z } from "zod";
import { updateFileAndCreatePR, commitFilesAndCreatePR, type FileToCommit } from "./github";
import * as yaml from "yaml";
import type { Props } from "./utils";

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
// Resource registry — single source of truth for all hobby resources
// ---------------------------------------------------------------------------

type ResourceEntry =
  | { mime: "application/json"; data: unknown; filePath: string }
  | { mime: "text/markdown"; data: string; filePath: string };

const RESOURCES: Record<string, ResourceEntry> = {
  // guitar
  "hobby://guitar/songs":    { mime: "application/json", data: songsData, filePath: "hobbies/guitar/songs.yaml" },
  "hobby://guitar/progress": { mime: "text/markdown",    data: guitarProgressMd, filePath: "hobbies/guitar/progress.md" },
  "hobby://guitar/plan":     { mime: "text/markdown",    data: guitarPlanMd, filePath: "hobbies/guitar/plan.md" },
  // coffee (generated JSON, not raw YAML)
  "hobby://coffee/beans":    { mime: "application/json", data: beans, filePath: "server/src/generated/beans.json" },
  "hobby://coffee/roasters": { mime: "application/json", data: roasters, filePath: "server/src/generated/roasters.json" },
  // software
  "hobby://software/projects": { mime: "application/json", data: projectsData, filePath: "hobbies/software/projects.yaml" },
  "hobby://software/skills":   { mime: "application/json", data: skillsData, filePath: "hobbies/software/skills.yaml" },
  "hobby://software/ideas":    { mime: "application/json", data: ideasData, filePath: "hobbies/software/ideas.yaml" },
  "hobby://software/progress": { mime: "text/markdown",    data: softwareProgressMd, filePath: "hobbies/software/progress.md" },
  "hobby://software/goals":    { mime: "text/markdown",    data: goalsMd, filePath: "hobbies/software/goals.md" },
  // running (markdown only)
  "hobby://running/progress": { mime: "text/markdown", data: runningProgressMd, filePath: "hobbies/running/progress.md" },
  "hobby://running/prs":      { mime: "text/markdown", data: prsMd, filePath: "hobbies/running/prs.md" },
  // strength
  "hobby://strength/prs":      { mime: "application/json", data: prsData, filePath: "hobbies/strength/prs.yaml" },
  "hobby://strength/progress": { mime: "text/markdown",    data: strengthProgressMd, filePath: "hobbies/strength/progress.md" },
  "hobby://strength/plan":     { mime: "text/markdown",    data: strengthPlanMd, filePath: "hobbies/strength/plan.md" },
  // video
  "hobby://video/projects": { mime: "application/json", data: videoProjectsData, filePath: "hobbies/video/projects.yaml" },
  "hobby://video/ideas":    { mime: "application/json", data: videoIdeasData, filePath: "hobbies/video/ideas.yaml" },
  "hobby://video/channels": { mime: "application/json", data: channelsData, filePath: "hobbies/video/channels.yaml" },
  "hobby://video/progress": { mime: "text/markdown",    data: videoProgressMd, filePath: "hobbies/video/progress.md" },
  "hobby://video/plan":     { mime: "text/markdown",    data: videoPlanMd, filePath: "hobbies/video/plan.md" },
  // photography
  "hobby://photography/portfolio":   { mime: "application/json", data: portfolioData, filePath: "hobbies/photography/portfolio.yaml" },
  "hobby://photography/inspiration": { mime: "application/json", data: inspirationData, filePath: "hobbies/photography/inspiration.yaml" },
  // golf
  "hobby://golf/rounds": { mime: "application/json", data: roundsData, filePath: "hobbies/golf/rounds.yaml" },
};

// Derived from RESOURCES — no manual sync needed
const HOBBY_RESOURCES = Object.entries(RESOURCES).reduce(
  (acc, [uri, entry]) => {
    const [hobby, resource] = uri.replace("hobby://", "").split("/");
    if (!acc[hobby]) acc[hobby] = { data: [], narratives: [] };
    if (entry.mime === "text/markdown") {
      acc[hobby].narratives.push(resource);
    } else {
      acc[hobby].data.push(resource);
    }
    return acc;
  },
  {} as Record<string, { data: string[]; narratives: string[] }>,
);

// ---------------------------------------------------------------------------
// MCP Agent — Durable Object that receives OAuth props (including GitHub token)
// ---------------------------------------------------------------------------

export class HobbiesMCP extends McpAgent<Env, Record<string, never>, Props> {
  server = new McpServer({
    name: "hobbies",
    version: "1.0.0",
  });

  async init() {
    const githubToken = this.props?.accessToken;

    // -----------------------------------------------------------------------
    // Resources
    // -----------------------------------------------------------------------

    for (const [uri, entry] of Object.entries(RESOURCES)) {
      const parts = uri.replace("hobby://", "").split("/");
      const hobby = parts[0];
      const resource = parts[1];
      this.server.registerResource(
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
        }),
      );
    }

    // -----------------------------------------------------------------------
    // General tools
    // -----------------------------------------------------------------------

    this.server.tool(
      "list_hobby_resources",
      "Lists all tracked hobbies and the data resources available for each. Call this first to understand what can be queried.",
      { hobby: z.string().optional().describe("Filter to a specific hobby. If omitted, lists all hobbies.") },
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
      },
    );

    this.server.tool(
      "read_hobby_data",
      "Returns the full data for a specific hobby resource. Use list_hobby_resources to see what's available.",
      {
        hobby: z.string().describe("The hobby name (e.g. 'guitar', 'software', 'golf')"),
        resource: z.string().describe("The resource name (e.g. 'songs', 'projects', 'rounds')"),
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
      },
    );

    this.server.tool(
      "read_hobby_narrative",
      "Returns the markdown content of a hobby narrative file (progress log, plan, goals, prs, etc.).",
      {
        hobby: z.string().describe("The hobby name"),
        file: z.string().describe("The file name without extension (e.g. 'progress', 'plan', 'goals', 'prs')"),
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
      },
    );

    // -----------------------------------------------------------------------
    // Convenience tools
    // -----------------------------------------------------------------------

    this.server.tool(
      "get_active_projects",
      "Returns software projects filtered by status. Defaults to all non-Abandoned projects.",
      { status: z.string().optional().describe("Filter to a specific status: 'Idea', 'Active', 'Shipped', 'Paused', 'Abandoned'. If omitted, returns all except Abandoned.") },
      async ({ status }) => {
        const projects = projectsData.projects.filter((p) =>
          status ? p.status === status : p.status !== "Abandoned",
        );
        return { content: [{ type: "text" as const, text: JSON.stringify(projects, null, 2) }] };
      },
    );

    this.server.tool(
      "get_golf_stats",
      "Returns golf round statistics: scoring average, avg putts, avg GIR, avg FIR, and an estimated handicap index computed from score differentials.",
      { limit: z.number().int().min(1).max(50).optional().describe("Number of most recent rounds to include. Defaults to all rounds.") },
      async ({ limit }) => {
        const rounds = limit ? roundsData.rounds.slice(0, limit) : roundsData.rounds;
        if (rounds.length === 0) {
          return { content: [{ type: "text" as const, text: "No rounds recorded yet." }] };
        }
        const avg = (vals: number[]) =>
          Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10;
        const fullRounds = rounds.filter((r) => r.holes === 18);
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
      },
    );

    // -----------------------------------------------------------------------
    // Write tools — use the authenticated user's GitHub token from OAuth
    // -----------------------------------------------------------------------

    this.server.tool(
      "update_hobby_file",
      "Updates a hobby data file (YAML or markdown) by creating a branch, committing the change, and opening a pull request. " +
        "Use read_hobby_data or read_hobby_narrative first to get the current content, then pass the full updated content here.",
      {
        hobby: z.string().describe("The hobby name (e.g. 'guitar', 'software')"),
        resource: z.string().describe("The resource name (e.g. 'songs', 'progress', 'plan')"),
        content: z.string().describe("The full updated file content"),
        commit_message: z.string().describe("A short commit message describing the change"),
        pr_title: z.string().describe("Pull request title"),
        pr_body: z.string().optional().describe("Optional pull request body/description"),
      },
      async ({ hobby, resource, content, commit_message, pr_title, pr_body }) => {
        if (!githubToken) {
          return {
            content: [{ type: "text" as const, text: "Write operations require GitHub authentication. Please reconnect with OAuth." }],
            isError: true,
          };
        }
        const uri = `hobby://${hobby}/${resource}`;
        const entry = RESOURCES[uri];
        if (!entry) {
          return {
            content: [{ type: "text" as const, text: `Unknown resource "${resource}" for hobby "${hobby}". Use list_hobby_resources to see available resources.` }],
            isError: true,
          };
        }
        try {
          const result = await updateFileAndCreatePR({
            token: githubToken,
            filePath: entry.filePath,
            newContent: content,
            commitMessage: commit_message,
            prTitle: pr_title,
            prBody: pr_body ?? "",
          });
          return {
            content: [{ type: "text" as const, text: `PR created: ${result.prUrl}\nBranch: ${result.branch}` }],
          };
        } catch (err) {
          return {
            content: [{ type: "text" as const, text: `Failed to create PR: ${err instanceof Error ? err.message : String(err)}` }],
            isError: true,
          };
        }
      },
    );

    // -----------------------------------------------------------------------
    // Coffee upsert tool
    // -----------------------------------------------------------------------

    this.server.tool(
      "upsert_coffee",
      "Creates or updates a coffee bean entry by committing YAML and image files to GitHub and opening a PR. " +
        "Optionally creates a new roaster if one doesn't exist yet.",
      {
        name: z.string().describe("Bean name (e.g. 'Tropical Weather')"),
        slug: z.string().describe("URL-safe slug (e.g. 'tropical-weather')"),
        roaster_slug: z.string().describe("Slug of the roaster (must exist unless new_roaster is provided)"),
        rating: z.number().min(1).max(5).optional().describe("Rating from 1-5"),
        origins: z.array(z.string()).describe("List of origin countries"),
        flavors: z.array(z.string()).optional().describe("Flavor notes"),
        process: z.string().optional().describe("Processing method (e.g. 'Washed', 'Natural')"),
        single_origin: z.boolean().describe("Whether this is a single origin coffee"),
        currently_brewing: z.boolean().optional().describe("Whether this is currently being brewed"),
        price_12oz: z.number().optional().describe("Price per 12oz bag in USD"),
        notes: z.string().optional().describe("Additional notes"),
        image_base64: z.string().describe("Base64-encoded JPEG image of the coffee bag"),
        new_roaster: z.object({
          name: z.string().describe("Roaster display name"),
          slug: z.string().describe("Roaster slug"),
          location: z.string().optional().describe("City, State"),
          website: z.string().optional().describe("Website URL"),
          notes: z.string().optional().describe("Notes about the roaster"),
        }).optional().describe("Provide this to create a new roaster alongside the bean"),
      },
      async ({ name, slug, roaster_slug, rating, origins, flavors, process, single_origin, currently_brewing, price_12oz, notes, image_base64, new_roaster }) => {
        if (!githubToken) {
          return {
            content: [{ type: "text" as const, text: "Write operations require GitHub authentication. Please reconnect with OAuth." }],
            isError: true,
          };
        }

        const roasterExists = roasters.some((r) => r.slug === roaster_slug);
        if (!roasterExists && !new_roaster) {
          return {
            content: [{ type: "text" as const, text: `Roaster "${roaster_slug}" not found. Provide new_roaster to create it, or use an existing roaster slug.` }],
            isError: true,
          };
        }
        if (new_roaster && new_roaster.slug !== roaster_slug) {
          return {
            content: [{ type: "text" as const, text: `new_roaster.slug ("${new_roaster.slug}") must match roaster_slug ("${roaster_slug}").` }],
            isError: true,
          };
        }

        const existingBean = beans.find((b) => b.slug === slug);
        const isUpdate = !!existingBean;

        const beanObj: Record<string, unknown> = {
          name,
          slug,
          roaster: roaster_slug,
          rating: rating ?? null,
          origins,
          flavors: flavors ?? [],
          process: process ?? "",
          single_origin,
          currently_brewing: currently_brewing ?? false,
          price_12oz: price_12oz ?? null,
          notes: notes ?? "",
          image_url: `https://storage.googleapis.com/johnverrone/coffee/${slug}.jpg`,
          created: isUpdate ? existingBean.created : new Date().toISOString().slice(0, 10),
        };

        const beanYaml = yaml.stringify(beanObj);
        const files: FileToCommit[] = [
          { path: `hobbies/coffee/beans/${slug}.yaml`, content: beanYaml },
          { path: `hobbies/coffee/images/${slug}.jpg`, content: image_base64, encoding: "base64" },
        ];

        if (new_roaster) {
          const roasterObj: Record<string, unknown> = {
            name: new_roaster.name,
            slug: new_roaster.slug,
            location: new_roaster.location ?? "",
            website: new_roaster.website ?? "",
            notes: new_roaster.notes ?? "",
            image_url: "",
          };
          files.push({
            path: `hobbies/coffee/roasters/${new_roaster.slug}.yaml`,
            content: yaml.stringify(roasterObj),
          });
        }

        const action = isUpdate ? "update" : "add";
        const prTitle = `coffee: ${action} ${name}`;
        const bodyParts = [
          `## ${isUpdate ? "Update" : "New"} Coffee Bean: ${name}`,
          "",
          `- **Roaster:** ${roaster_slug}`,
          `- **Origins:** ${origins.join(", ")}`,
          `- **Single Origin:** ${single_origin}`,
        ];
        if (flavors?.length) bodyParts.push(`- **Flavors:** ${flavors.join(", ")}`);
        if (process) bodyParts.push(`- **Process:** ${process}`);
        if (rating) bodyParts.push(`- **Rating:** ${rating}/5`);
        if (price_12oz) bodyParts.push(`- **Price (12oz):** $${price_12oz}`);
        if (notes) bodyParts.push(`- **Notes:** ${notes}`);
        if (new_roaster) bodyParts.push("", `> New roaster created: **${new_roaster.name}**`);

        try {
          const result = await commitFilesAndCreatePR({
            token: githubToken,
            files,
            commitMessage: prTitle,
            prTitle,
            prBody: bodyParts.join("\n"),
          });
          return {
            content: [{ type: "text" as const, text: `PR created: ${result.prUrl}\nBranch: ${result.branch}` }],
          };
        } catch (err) {
          return {
            content: [{ type: "text" as const, text: `Failed to create PR: ${err instanceof Error ? err.message : String(err)}` }],
            isError: true,
          };
        }
      },
    );
  }
}

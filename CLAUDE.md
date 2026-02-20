# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Hobby tracking system: YAML data files per hobby + a Cloudflare Workers REST API (Hono) that serves them as JSON. Planned future additions include nightly GitHub Actions with AI agents, an MCP server, and a dashboard at johnverrone.com.

## Commands

All server commands run from `server/`:

```bash
bun install          # install dependencies
bun run dev          # start local dev server (wrangler, http://localhost:8787)
bun run deploy       # deploy to Cloudflare Workers
bun run cf-typegen   # generate types for Cloudflare bindings
```

No test runner, linter, or formatter is configured yet.

## Architecture

```
hobbies/               # Project root
├── hobbies/            # Hobby data directories
│   └── guitar/         # Guitar hobby (YAML + markdown)
│       ├── songs.yaml  # Song database
│       ├── progress.yaml # Skill self-assessment
│       └── plan.md     # Practice plan
└── server/             # Cloudflare Workers API (Hono)
    └── src/
        ├── index.ts         # App entry, mounts sub-routers
        ├── routes/guitar.ts # GET /guitar/songs
        └── yaml.d.ts        # Ambient type for *.yaml imports
```

**Data flow:** Wrangler bundles YAML files as text modules at build time (via `rules` in `wrangler.jsonc`). Route modules import YAML from `../../hobbies/<hobby>/` paths, parse once at module load with the `yaml` package, and serve via `c.json()`.

**Adding a new hobby endpoint:** Create a `<hobby>/` directory with YAML data, add a route file in `server/src/routes/`, and mount it in `index.ts` with `app.route()`.

## Key Conventions

- **Package manager:** Bun (not npm/pnpm)
- **Module system:** ESM (`"type": "module"`)
- **TypeScript:** Strict mode, ESNext target, Bundler module resolution
- **Runtime:** Cloudflare Workers — no Node.js APIs or filesystem access at runtime; all data must be bundled at build time
- **Notion MCP:** Pre-authorized for `notion-search` and `notion-fetch` (see `.claude/settings.local.json`)

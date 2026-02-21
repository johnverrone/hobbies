# Hobbies

A living repository for tracking, planning, and growing my hobbies — powered by AI agents.

## Vision

This repo serves as the single source of truth for all my hobbies. Each hobby gets its own directory containing structured files for:

- **Skill progress** — current level, milestones, history
- **Metrics** — quantifiable measures of improvement
- **Practice/improvement plans** — structured plans with goals and timelines
- **Monetization ideas** — ways to turn hobbies into income streams
- **Business proposals** — fleshed-out plans for monetization opportunities

## Architecture

### Repository Structure

```
hobbies/
├── hobbies/
│   ├── coffee/              # Coffee hobby
│   │   ├── beans/           # Individual bean YAML files
│   │   └── roasters/        # Individual roaster YAML files
│   └── guitar/              # Guitar hobby
│       ├── songs.yaml       # Song database
│       ├── progress.md      # Skill self-assessment
│       ├── plan.md          # Practice plan
│       └── level1test.md    # Level 1 proficiency test
├── server/                  # Cloudflare Workers API (Hono)
│   ├── src/
│   │   ├── index.ts         # App entry, mounts sub-routers
│   │   ├── routes/
│   │   │   ├── guitar.ts    # GET /guitar/songs
│   │   │   └── coffee.ts    # GET /coffee/beans, /coffee/roasters
│   │   └── generated/       # Pre-built JSON data (coffee)
│   └── scripts/
│       └── generate-coffee-data.ts
└── README.md
```

### Data Flow

Wrangler bundles YAML files as text modules at build time (via `rules` in `wrangler.jsonc`). Route modules import data, parse it, and serve via `c.json()`. Coffee data is pre-generated into JSON by a build script.

### Server

A Cloudflare Workers REST API (built with Hono) serving hobby data as JSON for [johnverrone.com](https://johnverrone.com) to pull and render a hobby dashboard.

### Planned

- **Nightly AI Agents (GitHub Actions)** — agents that review plans, suggest next steps, and submit PRs
- **MCP Server** — for chatting with Claude about goals, progress, and hobby planning

## Status

Active development. Guitar and coffee hobbies are tracked with a working API deployed to Cloudflare Workers.

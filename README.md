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
├── <hobby-name>/
│   ├── progress.md
│   ├── metrics.md
│   ├── plan.md
│   ├── monetization.md
│   └── ...
├── server/              # REST API + MCP server
├── .github/workflows/   # Nightly agent runs
└── README.md
```

### Nightly AI Agents (GitHub Actions)

A GitHub Action runs on a nightly schedule, spinning up AI agents that:

- Review and develop practice/improvement plans
- Expand on goals and suggest next steps
- Check in on metrics and flag stalls or breakthroughs
- Write and refine business proposals for monetization ideas
- Submit pull requests with their contributions for review

### Server

A lightweight server exposing two interfaces:

- **REST API** — for [johnverrone.com](https://johnverrone.com) to pull data and render a hobby dashboard
- **MCP Server** — for chatting with Claude about goals, progress, what to do next, and general hobby planning

## Status

Early development. Setting up the repo structure and initial hobby directories.

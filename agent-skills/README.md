# Agent Skills

This folder is a showcase of the [OpenCode](https://github.com/sst/opencode) agent
skills that were actually used to build, migrate, and test this project. They are
copied here (from the developer's personal `~/.config/opencode/skills/` directory)
purely as **reference examples** - they are not required to build or run the
application itself.

A "skill" in this context is a self-contained package of instructions, reference
documents, and (where useful) runnable scripts that an AI coding agent loads on
demand, following a **progressive disclosure** pattern: a short `SKILL.md` entry
point with YAML frontmatter (`name` + `description`) is always visible to the
agent, and the agent only reads the deeper `references/` or `scripts/` files when
the current task actually calls for them. This keeps the agent's context small
and focused instead of front-loading every possible instruction into every
conversation.

## What's here

| Skill | Used for |
|---|---|
| [`orion-screen-migration`](./orion-screen-migration) | Migrating a legacy ZK7 screen (ViewModel + Service) to the new React frontend: extracting business logic, exposing it through a new REST/DTO layer without touching the existing ZK screens or database schema, and building the equivalent page with the project's React design system. |
| [`test-automation`](./test-automation) | End-to-end functional testing of a screen/flow across **both** frontends: driving the browser with Puppeteer, verifying the result directly in MSSQL via `sqlcmd`, cross-checking related screens, and producing a rich PASS/FAIL HTML report (with screenshots and an auto-generated root-cause suggestion on failure). |
| [`skill-writing`](./skill-writing) | Meta-skill: guides the creation of new, well-structured agent skills (correct frontmatter, progressive disclosure, when to split content into `references/`). |
| [`session-memory`](./session-memory) | Preserves project context across agent sessions (decisions, gotchas, next steps) in a lightweight markdown file, so a new session doesn't need to replay the entire prior conversation. |

## Note on paths

These skills were authored and used from a personal, machine-level skill
directory rather than a project-local one, so they are not "live" in this repo
(editing the copies here won't affect the actual agent installation that built
this project). They are included for transparency and as a working example of
how the Orion v3 Nemesis migration and testing workflow was actually automated.

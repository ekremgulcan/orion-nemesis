# Frontmatter Field Reference

## name (required)
- Lowercase letters, numbers, hyphens only.
- Max 64 characters.
- Must match the containing directory name exactly.

## description (required)
- Max 1,024 characters.
- The single most important field - this is what the agent matches
  against incoming requests to decide whether to activate the skill.
- Answer: what does it do, and when should it be used.
- Include realistic trigger phrases, not just an abstract goal summary.

## allowed-tools (optional)
- Comma-separated list restricting which tools the agent can use while
  the skill is active (e.g. `Read, Grep, Glob, Bash`).
- Omit entirely to leave normal permissions untouched.
- Use for read-only, security-sensitive, or audit-style skills where you
  want to guarantee no edits/writes happen.

## model (optional)
- Pins a specific model to use whenever this skill is active (e.g.
  `sonnet`, `opus`).
- Leave unset to inherit whatever model the session is already using.
- Useful when a task is either much lighter (fast/cheap model) or much
  heavier (best-quality model) than the default.

## Example: minimal skill

```yaml
---
name: pr-description
description: Writes pull request descriptions. Use when creating a PR, writing a PR summary, or asked to describe changes on a branch.
---

When writing a PR description:
1. Run `git diff main...HEAD` to see all changes on this branch.

## What
One sentence explaining what this PR does.

## Why
Brief context on why this change is needed.

## Changes
- Bullet points of specific changes made
- Group related changes together
- Mention any files deleted or renamed
```

## Example: restricted read-only skill

```yaml
---
name: codebase-onboarding
description: Helps new developers understand the system works. Use when asked to explain the codebase, architecture, or how a system is structured.
allowed-tools: Read, Grep, Glob, Bash
model: sonnet
---

# Codebase Guide
...
```

## Example: skill with progressive disclosure

```yaml
---
name: codebase-onboarding
description: Helps new developers understand the system works.
---

# Codebase Onboarding

## Progressive Disclosure Levels

### Level 2: Architecture Overview
**Only load when user requests more detail.** See
references/architecture-guide.md

Covers:
- Directory structure and purpose of each folder
- Architectural pattern (MVC, REST/API, microservices, etc.)
- Data flow from request to response

### Level 3: Deep Dives
**Only load when user requests a specific topic.** See
references/deep-dive-<topic>.md
```

## Priority hierarchy (when skill names collide)

1. Enterprise - managed settings, highest priority
2. Personal - your home directory skills
3. Project - `.opencode/skills` (or `.claude/skills`) inside a repo
4. Plugins - installed plugins/marketplace skills, lowest priority

To avoid conflicts, use descriptive, specific names instead of generic
ones (e.g. `frontend-review` or `backend-review` rather than just
`review`).

## Common troubleshooting

- **Skill doesn't trigger**: description doesn't overlap with how the
  user actually phrases requests. Add trigger phrases users would
  realistically type. Test variations.
- **Skill doesn't load**: `SKILL.md` must be inside a named directory,
  not loose at the skills root. File name must be exactly `SKILL.md`.
- **Wrong skill gets used**: descriptions are too similar to another
  skill. Make them more distinct.
- **Skill being shadowed**: a higher-priority skill (enterprise/personal/
  project/plugin) has the same name. Rename to something more specific.
- **Runtime errors**: missing dependencies (document them in the
  description so the agent knows what's needed), missing script execute
  permissions, or path separator issues (always use forward slashes).

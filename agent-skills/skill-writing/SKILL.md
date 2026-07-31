---
name: skill-writing
description: Use when the user asks to create, write, or generate a new agent skill for OpenCode/Claude Code - e.g. "bu konuda skill yaz", "create a skill for X", "write a skill that does Y", "yeni skill oluştur". Guides requirement gathering, asks clarifying questions when the request is incomplete or ambiguous, and produces a correctly structured SKILL.md following official frontmatter rules and progressive disclosure best practices.
---

# Skill Writing

You are creating a new agent skill. A skill is a folder containing a
`SKILL.md` file (plus optional supporting files) that Claude/the agent
discovers automatically and loads on demand when a user's request matches
the skill's `description`.

Follow this process every time you are asked to write a skill.

## Step 0: Do not skip clarification when needed

Before writing anything, check whether the user's request gives you enough
to make good decisions. If any of the following are unclear **and not
obvious from context**, ask a single consolidated question (use the
`question` tool) before writing the file. Do not ask about things you can
reasonably infer - only ask when the answer would materially change the
skill.

Things to check, and when to ask vs. infer:

- **Core task / scope** - What exactly should the skill do, and on what
  triggers? If the user's prompt is vague ("bir skill yaz" with no topic,
  or a topic with no detail on desired behavior), ask them to clarify the
  task before proceeding. Do not guess a whole workflow from a one-word
  topic.
- **Trigger phrases** - What would the user actually type to invoke this?
  If not given, infer 3-5 realistic trigger phrases from the task
  description yourself; you don't need to ask unless the task is
  genuinely ambiguous (e.g. could apply to multiple unrelated domains).
- **allowed-tools** - Only ask if it's not obvious. Infer automatically
  when the task type makes it clear:
  - Read-only/analysis tasks (review, audit, explain, summarize) ->
    default to `Read, Grep, Glob, Bash` (or narrower) without asking.
  - Tasks that clearly need file edits (formatting, refactoring,
    generating docs) -> don't restrict tools, don't ask.
  - Ask explicitly when the task touches security-sensitive or
    potentially destructive operations (deployments, credentials,
    database changes, git push/force operations) and it's unclear whether
    the user wants the skill restricted to read-only/dry-run behavior.
- **model** - Leave unset (inherit default) unless the user mentions
  cost/speed/quality tradeoffs, or the task is clearly heavy reasoning
  (architecture review) vs. lightweight (formatting) and they haven't
  specified. If genuinely unclear whether they want a specific model
  pinned, ask; otherwise omit the field.
- **Location (personal vs. project)** - Default is **personal**:
  `~/.config/opencode/skills/<name>/SKILL.md`. Only ask if the user's
  phrasing suggests this is specific to the current repo/team (e.g. "bu
  proje için", "takımla paylaşacağız") - in that case use project-level
  `<repo>/.opencode/skills/<name>/SKILL.md` instead, or ask which one they
  want if truly ambiguous.
- **Multi-file needs** - If the task clearly needs reference material,
  templates, or scripts beyond simple instructions, ask what supporting
  content should live in `references/`, `assets/`, or `scripts/` if it's
  not obvious from the task itself. For simple skills, don't ask - a
  single SKILL.md is enough.
- **Name collisions** - If a skill with the same name already exists,
  confirm with the user before overwriting.

If everything needed is inferable, proceed without asking. Prefer doing
the work over interrogating the user - only ask when a wrong guess would
produce a materially wrong or unsafe skill.

## Step 1: Naming

- Directory name and `name` field must match exactly.
- Lowercase letters, numbers, and hyphens only. Max 64 characters.
- Should be descriptive and specific (e.g. `pr-description`,
  `codebase-onboarding`, not `helper` or `misc`).

## Step 2: Write the description (most important field)

The `description` is how the agent decides whether to activate the skill.
It is matched semantically against the user's request, so it must be
explicit, not vague.

A good description answers two questions:
1. **What does the skill do?**
2. **When should it be used?**

Rules:
- Max 1,024 characters.
- Write in third person ("Use when...", "Reviews...", not "I will...").
- Include concrete trigger keywords/phrases a real user would type -
  don't just describe the goal abstractly. If unsure the description will
  trigger reliably, add more phrasings (e.g. "review", "audit", "check
  quality of").
- Being specific also prevents collisions with similarly-named skills -
  the more distinct the description, the less chance of the wrong skill
  firing.

## Step 3: Frontmatter fields

```yaml
---
name: skill-name
description: What it does and when to use it, with trigger phrases.
allowed-tools: Read, Grep, Glob, Bash   # optional - restricts tool access when skill is active
model: sonnet                          # optional - pin a specific model for this skill
---
```

- `name` and `description` are required. Everything else is optional.
- Omitting `allowed-tools` means no restriction - normal permissions apply.
- Use `allowed-tools` for read-only/security-sensitive workflows where the
  skill should not be able to edit, write, or run arbitrary commands.

## Step 4: Write the instructions body

Below the frontmatter, write the actual instructions the agent should
follow whenever this skill activates - checklists, formatting rules,
step-by-step procedures, examples. Be explicit and concrete, the same way
you would explain the task to a new team member.

## Step 5: Progressive disclosure for larger skills

Keep `SKILL.md` under ~500 lines. If the skill needs more than that:

- `scripts/` - executable code. Scripts run without loading their
  contents into context - only their output does. Tell the agent to
  **run** the script, not read it. Use for environment validation, data
  transforms, or anything more reliable as tested code than generated
  code.
- `references/` - additional docs, deep-dive material, specs. Link to
  these from `SKILL.md` with clear instructions on when to load them
  (e.g. "See references/architecture-guide.md only when user requests
  more detail"). This is like a table of contents instead of dumping
  everything into context at once.
- `assets/` - images, templates, or other static data files the skill
  references.

Don't build multi-file structure for a skill that doesn't need it - a
single well-written SKILL.md is preferable when the task is simple.

## Step 6: Create the file

Default target path (personal, unless Step 0 determined otherwise):

```
~/.config/opencode/skills/<name>/SKILL.md
```

Project-level alternative:

```
<repo-root>/.opencode/skills/<name>/SKILL.md
```

## Step 7: Verify

After writing the file, verify discovery:

```
opencode debug skill
```

Confirm the new skill appears in the JSON list with the correct `name`,
`description`, and `location`. If it doesn't appear, check:
- The file is named exactly `SKILL.md` (all caps, `.md` lowercase) inside
  a folder matching the skill name - not loose at the skills root.
- Frontmatter YAML is valid (dashes on their own lines, no tabs).

## Step 8: Summarize for the user

After creating and verifying the skill, tell the user concisely:
- Where the file was created (path).
- What triggers it (short description of when it activates).
- Any tool restrictions applied, and why.
- Suggest they test it by phrasing a real request that should trigger it.

See `references/frontmatter-reference.md` for the full field reference
and additional examples if needed.

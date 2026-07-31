---
name: session-memory
description: Use to preserve important context across opencode sessions so a new session does not need to reload (via --continue/--fork) a huge historical conversation, which causes expensive auto-compact cycles. Triggers on explicit requests like "session'i ozetle", "bu session'i kapat", "notlara ekle", "memory guncelle", "nerede kalmistik", "onceki session'dan devam et", "catch me up", "summarize this session", "update the project notes". Also invoke proactively (without being explicitly asked) when a meaningful task/session is clearly wrapping up - e.g. user says "tamamdir", "bugunluk bu kadar", "bitti", "iyi calisma oldu" - or when a new session starts in a project that already has a memory file, to brief the user on where things left off. Maintains a lightweight per-project markdown memory file that captures decisions, gotchas, files touched, and next steps, instead of carrying full raw conversation history forward.
---

# Session Memory

Solves session bloat: instead of continuing/forking a huge historical
session (which reloads its entire context and costs a lot in cache-read
tokens), distill only what matters into a small markdown file, and use
that file to bridge context between sessions.

This skill has two modes. Detect which one applies from the user's
message (or from your own judgement if invoked proactively).

## Locating the memory file

Look for a memory file in the current project root, in this priority
order:
1. `SESSION_MEMORY.md`
2. A `## Session Log` (or similarly named) section inside an existing
   project doc like `plan.md` or `README.md`, if the project already uses
   that convention.
3. If neither exists, create `SESSION_MEMORY.md` at the project root (next
   to `package.json` / `pom.xml` / `.git` / other root markers).

Always check what convention the project already has before creating a
new file - don't create a duplicate memory file if one already exists
under a different name.

## Mode 1: Close-out (write/update)

Triggered explicitly ("ozetle", "notlara ekle", "memory guncelle", "bu
session'i kapat") or proactively when a task/session is clearly
concluding.

Steps:
1. Read the existing memory file (if any) to see the format already in
   use and avoid duplicating entries.
2. Review what happened in the *current* conversation only (not other
   sessions) and distill it into the template below. Be concrete and
   specific - file paths, decisions with a one-line rationale, gotchas
   that would otherwise be rediscovered the hard way, and concrete next
   steps. Skip anything trivial or already obvious from the codebase
   itself (don't restate things a fresh read of the code would reveal).
3. Append a new dated entry:

```markdown
## [YYYY-MM-DD] <short topic/title>
**Yapilanlar:**
- ...
**Kararlar:**
- ... (karar + kisa gerekce)
**Dikkat / Gotcha:**
- ... (varsa; yoksa bu basligi atla)
**Degisen dosyalar:**
- `path/to/file` - ne degisti (kisaca)
**Sonraki adimlar:**
- ...
```

4. Keep each entry tight (roughly 10-20 lines). This file will be read at
   the start of future sessions, so verbosity here directly costs tokens
   later.
5. Check the file's total size after appending. If it exceeds ~400 lines
   or ~25 entries, condense the oldest half into a single short
   "Archived Summary" paragraph (one paragraph per old entry, or a merged
   summary if entries are related) and move/keep the newest entries in
   full detail. Never let the file grow unbounded - it defeats the
   purpose if reading it becomes expensive too.
6. Confirm to the user in 1-2 lines: file path, what was added, current
   line/entry count.

## Mode 2: Catch-up (read/brief)

Triggered explicitly ("nerede kalmistik", "onceki session'dan devam et",
"catch me up") or proactively at the start of a new session in a project
that has a memory file.

Steps:
1. Read the memory file.
2. If the user references something specific that isn't covered in the
   memory file (e.g. "ses_xxx session'inda ne konusmustuk"), look it up
   directly from raw session storage instead of continuing/forking that
   session:
   - File storage: `~/.local/share/opencode/storage/message/<sessionID>/*.json`
     (each file has a `role`, and assistant messages have a `tokens`
     field; session metadata is in
     `~/.local/share/opencode/storage/session/global/<sessionID>.json`
     with `title`/`directory`).
   - Or `mantiscli export <sessionID>` for a JSON dump.
   - Read only the specific parts needed, extract the answer, and discard
     the rest - never inject the full old session into the current
     context.
3. Present a concise briefing (5-10 bullets max): last known state, open
   TODOs from the most recent entries, and anything flagged as
   important/gotcha. Do not paste the whole memory file verbatim if it is
   long - summarize the recent/relevant entries and mention that older
   history exists if relevant.

## Principles

- The memory file is a *distillation*, not a transcript. Never dump raw
  tool output or full diffs into it.
- Prefer updating/trimming over indefinite growth - an unbounded memory
  file just recreates the original problem at a smaller scale.
- Don't create a new memory-file convention if the project already has
  one; extend what's there.
- This does not replace `--continue`/`--fork` for same-day, still-active
  work - it's specifically for bridging context *across* separate
  sessions/days without reloading full history.

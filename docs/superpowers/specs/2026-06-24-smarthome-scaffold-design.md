# SmartHome Umbrella Repo — Scaffold & Environment Design

- **Date:** 2026-06-24
- **Status:** Approved (pending spec review)
- **Author:** brainstormed with Claude Code

## 1. Purpose

`SmartHome` is the **final resting point for all home automation and home
documentation going forward**. It is an umbrella monorepo that will, over time,
hold multiple independent automation subsystems (home security, Home Assistant,
Node-RED, Zigbee2MQTT, ESPHome, …) plus a home documentation system.

Today it holds two things:

1. **A reserved slot for the home security system** — the polished version of
   the **KumarSec** stack (https://github.com/BAESolutions/KumarSec). Only a
   placeholder is created now; the real code migrates in deliberately later.
2. **A reserved slot for the home documentation system** — to be designed from
   scratch separately. Placeholder only.

This spec covers initializing the directory as a git repo, setting up the AI
coding-assistant environment, and scaffolding the directory structure and
baseline documentation.

## 2. Scope

**In scope (this work):**

- `git init -b main` + initial commit of the scaffold.
- Top-level directory structure (subsystem-first / "monorepo of subsystems").
- Baseline repo documentation (architecture, conventions, glossary, ADR-0001).
- Changelog with an explicit update protocol documented for assistants.
- AI assistant environment: `AGENTS.md` (canonical, tool-agnostic), `CLAUDE.md`
  (Claude-specific, references `AGENTS.md`), and `.claude/`.
- Placeholder READMEs for `security/`, `home-docs/`, `platforms/`.

**Out of scope (explicitly deferred):**

- Migrating or copying any KumarSec code (reserve placeholder only — decided).
- Designing the home documentation system (separate session, later today).
- Any Home Assistant / Node-RED / Zigbee2MQTT / ESPHome content.
- Speculative slash commands or custom agents (YAGNI until a workflow needs one).
- License file (private home repo).

## 3. Chosen layout — Subsystem-first (Approach 1)

Each automation system is a self-contained top-level directory and owns its own
internals (`apps/`, `services/`, `infra/`, `docs/` as needed). Shared meta lives
at the root. This gives clean isolation today and an obvious slot for every
future addition.

```
SmartHome/
├── .claude/
│   ├── settings.json          # checked-in project settings (minimal for now)
│   └── README.md              # what lives in this folder
├── docs/
│   ├── architecture.md        # umbrella overview; how to add a new subsystem
│   ├── conventions.md         # directory/naming conventions, secrets handling
│   ├── glossary.md            # subsystem, platform, KumarSec, etc.
│   ├── decisions/
│   │   └── 0001-monorepo-of-subsystems.md
│   └── superpowers/specs/
│       └── 2026-06-24-smarthome-scaffold-design.md   # this document
├── security/
│   └── README.md              # reserved slot; KumarSec polished version lands here
├── home-docs/
│   └── README.md              # reserved slot; documentation system, design pending
├── platforms/
│   └── README.md              # future platforms each get a subdirectory here
├── scripts/
│   └── .gitkeep
├── AGENTS.md                  # canonical, tool-agnostic assistant guide
├── CLAUDE.md                  # Claude Code-specific; references AGENTS.md
├── CHANGELOG.md               # Keep a Changelog format
├── README.md                  # human entry point
├── .gitignore
├── .gitattributes             # LF normalization (Windows host)
└── .git/
```

> Note: `.claude/settings.local.json` is **not** created or committed — it is a
> machine-local, gitignored file that each user/tool creates as needed.

## 4. File-by-file content plan

### Root

- **`README.md`** — one-paragraph purpose, the subsystem map, current status
  table (security = placeholder, home-docs = placeholder), pointers to
  `AGENTS.md`, `docs/architecture.md`, and `CHANGELOG.md`.
- **`AGENTS.md`** — the **single source of truth** for any AI coding assistant:
  repo purpose, subsystem map, conventions (each subsystem self-contained;
  secrets never committed; follow existing patterns), the **changelog update
  protocol** (see §5), and the KumarSec link. Tool-agnostic.
- **`CLAUDE.md`** — short. States "Read `AGENTS.md` first — it is the source of
  truth." Then adds Claude Code-specifics: `.claude/` layout, superpowers/skills
  usage expectation, and a reminder that the changelog protocol in `AGENTS.md`
  applies. No duplication of conventions — references `AGENTS.md` to avoid drift.
- **`CHANGELOG.md`** — Keep a Changelog 1.1.0 format with an `[Unreleased]`
  section. Seeded with an initial entry recording repo creation + scaffold.
- **`.gitignore`** — OS noise (`Thumbs.db`, `.DS_Store`), env/secrets
  (`.env`, `*.local`, `.claude/settings.local.json`), Node (`node_modules/`,
  build dirs), Python (`__pycache__/`, `.venv/`, `*.pyc`), editor dirs.
- **`.gitattributes`** — `* text=auto eol=lf` for cross-platform LF normalization
  (host is Windows).

### `.claude/`

- **`settings.json`** — minimal valid settings object; a place to grow shared
  permissions/hooks later.
- **`README.md`** — explains the folder, notes `settings.local.json` is
  gitignored and machine-local.

### `docs/`

- **`architecture.md`** — what the umbrella is, the subsystem boundary model,
  and a step-by-step "how to add a new subsystem" (create top-level dir or a
  `platforms/<name>/` dir, give it its own README + internal structure, register
  it in the root README status table, add a changelog entry).
- **`conventions.md`** — naming (kebab-case dirs), each subsystem owns its
  `apps/services/infra/docs`, secrets handling (`.env` files gitignored, commit
  `.env.example`), commit/changelog expectations.
- **`glossary.md`** — definitions: umbrella repo, subsystem, platform, KumarSec,
  home-docs, security.
- **`decisions/0001-monorepo-of-subsystems.md`** — lightweight ADR capturing
  today's decisions: subsystem-first layout (Approach 1) and placeholder-only
  migration for the security system. Context / Decision / Consequences.

### Subsystem placeholders

- **`security/README.md`** — "Reserved for the polished home security system.
  Source/starting code: https://github.com/BAESolutions/KumarSec. Migration
  deliberate and pending." Brief summary of what KumarSec is (RTSP cameras,
  MediaMTX, YOLO AI worker, FastAPI API, Next.js web, Kotlin Android, backup).
- **`home-docs/README.md`** — "Reserved for the home documentation system.
  Design pending (separate session)."
- **`platforms/README.md`** — explains future automation platforms (Home
  Assistant, Node-RED, Zigbee2MQTT, ESPHome, …) each get their own subdirectory
  here when added.

## 5. Changelog update protocol (documented in AGENTS.md)

The protocol is written into `AGENTS.md` (and referenced from `CLAUDE.md`) so
every assistant handles it consistently:

- The repo keeps a single root **`CHANGELOG.md`** in
  [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) format.
- All notable changes go under the **`[Unreleased]`** section, grouped by
  `Added` / `Changed` / `Deprecated` / `Removed` / `Fixed` / `Security`.
- **When to update:** any change that adds/removes a subsystem, changes
  structure or conventions, or is otherwise user-visible. Routine doc typo fixes
  do not require an entry.
- Each entry is one line, imperative, and names the subsystem it touches when
  applicable (e.g. `Added security/ placeholder reserving the slot for the
  polished KumarSec stack`).
- Versioned releases (cutting `[Unreleased]` to a dated version) are manual and
  intentional; assistants append to `[Unreleased]`, they do not cut releases
  unless asked.

## 6. Git initialization

- `git init -b main` in `V:\repos\SmartHome`.
- Stage the full scaffold; one initial commit:
  `chore: scaffold SmartHome umbrella repo + AI assistant environment`.
- No remote configured in this task.

## 7. Testing / verification

This is a scaffolding task; verification is structural:

- `git status` clean after the initial commit; `git log` shows one commit.
- The directory tree matches §3.
- All Markdown files are non-empty and internally consistent (links resolve to
  files that exist; no `TBD`/`TODO` placeholders left behind).
- `AGENTS.md`, `CLAUDE.md`, and `CHANGELOG.md` agree on the changelog protocol.

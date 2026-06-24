# Conventions

## Directory and file naming

- **Directory names:** kebab-case (`home-docs/`, `my-service/`).
- **Documentation file names:** kebab-case (`architecture.md`, `getting-started.md`).
- **Code files:** follow the conventions of the language or framework in use
  (e.g. PEP 8 for Python, Next.js conventions for TypeScript).
- **ADR files:** `docs/decisions/NNNN-<slug>.md` where `NNNN` is zero-padded.
- **Superpowers specs:** `docs/superpowers/specs/YYYY-MM-DD-<slug>.md`.

## Subsystem internal structure

Each subsystem may contain any subset of the following directories as needed:

```
<subsystem>/
├── apps/        # end-user applications (web, mobile, desktop)
├── services/    # backend services and workers
├── infra/       # infrastructure-as-code (Docker, Compose, Terraform, …)
├── docs/        # subsystem-specific documentation
└── README.md    # required: purpose, status, key entry points
```

Only create directories that have content. Do not pre-create empty placeholders
inside a subsystem.

## Secrets handling

- `.env` files and any file matching `*.local` are gitignored globally.
- Never commit credentials, API keys, tokens, or passwords.
- Provide a `.env.example` template (committed, no real values) for any
  subsystem that requires environment variables.
- For production secrets, document the expected variable names in `.env.example`
  and reference the appropriate secret store in the subsystem's `README.md`.

## Commit conventions

- Use conventional commit prefixes: `feat:`, `fix:`, `chore:`, `docs:`,
  `refactor:`, `test:`.
- Scope is optional but encouraged when touching a specific subsystem:
  `feat(security): …`, `docs(home-docs): …`.
- Keep the subject line under 72 characters.

## Changelog expectations

Follow the protocol documented in [`AGENTS.md`](../AGENTS.md) under
"Changelog update protocol". The short version: notable changes go into
`CHANGELOG.md` under `[Unreleased]`; assistants never cut a release unless asked.

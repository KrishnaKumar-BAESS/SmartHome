# .claude/

This directory holds Claude Code project configuration.

| File                  | Status         | Purpose                                            |
| --------------------- | -------------- | -------------------------------------------------- |
| `settings.json`       | Checked in     | Shared project settings — permissions, hooks, etc. |
| `settings.local.json` | **Gitignored** | Machine-local overrides (do not commit)            |

`settings.local.json` is created by Claude Code automatically for per-machine
state. It is listed in the root `.gitignore` and should never be committed.

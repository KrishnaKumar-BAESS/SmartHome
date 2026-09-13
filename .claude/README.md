# Claude Code project configuration

This directory contains repository-scoped Claude Code configuration.
Follow [CLAUDE.md](../CLAUDE.md) and the shared [AGENTS.md](../AGENTS.md) guide.

| File                           | Status            | Purpose                                     |
| ------------------------------ | ----------------- | ------------------------------------------- |
| [settings.json](settings.json) | Checked in        | Sets empty commit and PR attribution values |
| `settings.local.json`          | Ignored, optional | Machine-local overrides; never commit       |

The current shared file does not configure project hooks, tools, or broad
permission grants. Add shared settings only for an established repository need,
and review their effect with the same care as other configuration changes.

Keep credentials and personal machine paths out of shared settings.
The root [.gitignore](../.gitignore) excludes the local override file.

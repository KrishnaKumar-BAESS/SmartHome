# Claude Code project configuration

This directory contains repository-scoped Claude Code configuration.
Follow [CLAUDE.md](../CLAUDE.md) and the shared [AGENTS.md](../AGENTS.md) guide.

| File                           | Status            | Purpose                                                         |
| ------------------------------ | ----------------- | --------------------------------------------------------------- |
| [settings.json](settings.json) | Checked in        | Sets empty commit and PR attribution values                     |
| [launch.json](launch.json)     | Checked in        | Browser-pane preview of the built security service on port 4319 |
| `settings.local.json`          | Ignored, optional | Machine-local overrides; never commit                           |

`launch.json` starts `security/apps/camera-viewer/dist/server/index.js` with
empty signaling hosts and camera names, so the preview never contacts Xfinity;
run `pnpm build` first. It uses PowerShell, matching the Windows-only service.

The shared settings file does not configure project hooks, tools, or broad
permission grants. Add shared settings only for an established repository need,
and review their effect with the same care as other configuration changes.

Keep credentials and personal machine paths out of shared settings.
The root [.gitignore](../.gitignore) excludes the local override file.

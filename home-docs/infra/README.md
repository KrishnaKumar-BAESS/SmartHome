# LAN hosting templates

See [deployment and rollback](../../docs/deployment.md#home-server-deployment).
Copy `compose.yaml.example` to the host's `compose.yaml`, and
`service.env.example` to `service.env.local`. Keep the examples beside the deployed
configuration. Only the local environment file contains a real app password.
The container runs a complete copied release containing `web/`, `server/`, and
an ESM `package.json`. Do not mount the repository as the served release.

# Automation platforms

**Status: reserved; no platforms configured.** Future supporting infrastructure
such as Home Assistant, Node-RED, Zigbee2MQTT, or ESPHome belongs under this
directory. These are possible additions, not installed services or dependencies
of the active house atlas.

A platform supports subsystems rather than becoming a separate end-user product.
See [architecture](../docs/architecture.md) for the ownership boundary.

## Add a platform when needed

1. Create `platforms/<platform-name>/` using kebab-case.
2. Provide a README covering its purpose, current status, supported version,
   prerequisites, setup, configuration, verification, operations, and rollback.
3. Add actual configuration, infrastructure, and documentation as needed;
   do not scaffold empty directories.
4. Define network exposure, authentication, secret handling, persistent data,
   and backup/restore. Commit harmless environment templates if required.
5. Record cross-subsystem contracts or significant architectural choices in an ADR.
6. Add appropriate checks and update the root map, documentation index, and
   `[Unreleased]` changelog.

There are no platform startup commands or platform environment variables today.
The house documentation app runs independently.

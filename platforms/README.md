# platforms/

This directory holds subdirectories for automation platform infrastructure — Home
Assistant, Node-RED, Zigbee2MQTT, ESPHome, and any other platform added in the
future.

Platforms are shared infrastructure that underpin subsystems, as opposed to
standalone products. They live here rather than at the top level to keep the root
directory uncluttered.

**No platforms have been added yet.**

## Adding a platform

1. Create `platforms/<platform-name>/` (kebab-case).
2. Give it a `README.md` describing the platform, its role, and how to run it.
3. Add internal structure as needed (`infra/`, `docs/`, config files).
4. Register it in the root `README.md` subsystem map and add a changelog entry.

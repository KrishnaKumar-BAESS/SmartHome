# Repository scripts

No maintained helper scripts are implemented here yet. Root commands are defined
in [package.json](../package.json); do not assume `scripts/` contains an alternate
build or deployment entry point.

Add a script only for a repeatable repository task that existing tooling does not
already cover. Document its inputs, working directory, output, failure behavior,
and any side effects here, and link it from the relevant guide.

Subsystem-specific scripts belong inside their subsystem. Shared scripts must
preserve archived sources and reference material and should work with the
[pinned toolchain](../docs/development.md#toolchain-and-installation).

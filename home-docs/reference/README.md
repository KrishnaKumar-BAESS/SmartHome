# Source references

[house-inventory.xlsx](house-inventory.xlsx) is the original root `Book1.xlsx`,
renamed and moved without changing its bytes during the application migration.
Preserve its contents as historical source material.

## Relationship to the app

The app reads [src/data/house.ts](../apps/web/src/data/house.ts), extracted from
the original DC prototype. It does not parse, watch, or synchronize this workbook.
Editing the workbook would not change what users see.

Use the [data model guide](../docs/data-model.md) for inventory corrections.
Keep the recorded source and the reviewed runtime update distinct; migration
tests compare the runtime data with the archived prototype, not with this workbook.

## Handling

Treat the workbook as private home reference material. Do not add it to
`apps/web/public/`, import it into the browser bundle, or publish it with a build.

When checking that a move or copy preserved it, compare a SHA-256 digest with the
trusted source copy. In PowerShell:

```powershell
Get-FileHash -Algorithm SHA256 home-docs/reference/house-inventory.xlsx
```

Run this from the repository root. A checksum establishes byte identity with the
compared copy; it does not verify the factual accuracy of workbook contents.

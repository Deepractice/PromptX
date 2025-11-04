

---
"@promptx/resource": minor
---
Change: Stabilize resource base/registry resolution and resource path computation for Electron dev/prod and ASAR.

Details
- `getResourceBaseDir`
  - In packaged Electron, derive the extraResources `resources` directory from `app.getAppPath()` (i.e., `<...>/resources/resources`).
  - In development/non-Electron, use `path.join(__dirname, 'resources')`.
- `PackageResource.resolvePath`
  - Remove `resources/` prefix before joining since `baseDir` already points at `resources`.
  - Join `baseDir` with the cleaned path and, when available in non-production, apply `electron-util.fixPathForAsarUnpack` to handle ASAR dev scenarios.
- `getPackageRoot`
  - In production, return `path.dirname(app.getAppPath())` (the parent of `app.asar`).
  - In development/non-Electron, return `__dirname`.
- `getRegistryPath`
  - In packaged Electron, read `registry.json` from the extraResources directory (`path.join(path.dirname(app.getAppPath()), 'registry.json')`).
  - In development, use `path.join(__dirname, 'registry.json')`, and apply `fixPathForAsarUnpack` if present.
- Registry loading
  - Add detailed logging of the registry path and `__dirname`.
  - Throw descriptive errors on missing file or unsupported registry version to aid diagnostics.
- `getResourcePath`
  - Add robust environment probing with detailed logs:
    - In main process: use `app.isPackaged` to select extraResources path and strip `resources/` prefix.
    - In renderer: detect packaged mode by checking `__dirname` for `app.asar`, then compute the extraResources path accordingly.
    - In development/non-Electron: ensure `resources/` prefix is present and join with `packageRoot`.
  - Return absolute, directly usable paths and log the resolved values for tracing.

Motivation
- Ensure consistent resource discovery and file access across Electron development and packaged builds, including ASAR cases.
- Eliminate failures caused by incorrect roots, mixed separators, or premature path assumptions.

Impact
- No breaking API changes. Consumers of `getResourcePath`, `findResourceById`, and registry-based lookups receive more reliable absolute paths.
- Downstream flows (copy/list/read) become more robust with fewer environment-specific edge cases.

Migration Guide
- Prefer `getResourcePath(res.metadata.path)` over manual path concatenation to extraResources or `__dirname`.
- Remove ad-hoc separator normalization and environment heuristics in consumers—rely on `@promptx/resource` to provide finalized absolute paths.

Notes
- Minor bump focused on cross-platform correctness and Electron packaging compatibility. The behavior is backward compatible while improving diagnostics and path stability.

# @promptx/cli

## 1.14.1

### Patch Changes

- Updated dependencies [[`4a6ab6b`](https://github.com/Deepractice/PromptX/commit/4a6ab6b579101921ba29f2a551bb24c75f579de1), [`abcff55`](https://github.com/Deepractice/PromptX/commit/abcff55b916b7db73e668023a964fba467cc8cb6)]:
  - @promptx/core@1.14.1
  - @promptx/mcp-server@1.14.1
  - @promptx/logger@1.14.1

## 1.14.0

### Patch Changes

- [#311](https://github.com/Deepractice/PromptX/pull/311) [`801fc4e`](https://github.com/Deepractice/PromptX/commit/801fc4edb1d99cf079baeecbb52adf7d2a7e404e) Thanks [@deepracticexs](https://github.com/deepracticexs)! - fix(Windows): Remove emoji from console output to fix Windows encoding issues

  - Remove all emoji characters from CLI command descriptions and help text
  - Remove emoji from console log messages across all TypeScript files
  - Fix Windows console emoji display issues reported in #310
  - Apply Occam's razor principle: simplify by removing complexity source
  - Maintain functionality while improving cross-platform compatibility

  This change ensures that Windows users no longer see garbled emoji characters in the console output when using the desktop application.

- Updated dependencies [[`cde78ed`](https://github.com/Deepractice/PromptX/commit/cde78ed4a1858df401596e8b95cae91d8c80ef7a), [`801fc4e`](https://github.com/Deepractice/PromptX/commit/801fc4edb1d99cf079baeecbb52adf7d2a7e404e)]:
  - @promptx/core@1.14.0
  - @promptx/mcp-server@1.14.0
  - @promptx/logger@1.14.0

## 1.13.0

### Patch Changes

- Updated dependencies [[`d60e63c`](https://github.com/Deepractice/PromptX/commit/d60e63c06f74059ecdc5435a744c57c1bfe7f7d0)]:
  - @promptx/core@1.13.0
  - @promptx/mcp-server@1.13.0
  - @promptx/logger@1.13.0

## 1.12.0

### Patch Changes

- Updated dependencies [[`2c503d8`](https://github.com/Deepractice/PromptX/commit/2c503d80bb09511ab94e24b015a5c21dea8d4d9b)]:
  - @promptx/logger@1.12.0
  - @promptx/core@1.12.0
  - @promptx/mcp-server@1.12.0

## 1.11.0

### Patch Changes

- Updated dependencies [[`c3c9c45`](https://github.com/Deepractice/PromptX/commit/c3c9c451b9cdd5abaa5c1d51abe594ad14841354)]:
  - @promptx/mcp-server@1.11.0
  - @promptx/logger@1.11.0
  - @promptx/core@1.11.0

## 1.10.1

### Patch Changes

- Fix release workflow and prepare for beta release

  - Update changeset config to use unified versioning for all packages
  - Fix resource discovery and registry generation bugs
  - Update pnpm-lock.yaml for CI compatibility
  - Prepare for semantic versioning with beta releases
  - Fix npm publishing conflicts by using proper versioning strategy

- Updated dependencies []:
  - @promptx/core@1.10.1
  - @promptx/logger@1.10.1
  - @promptx/mcp-server@1.10.1

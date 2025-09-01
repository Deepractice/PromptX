# @promptx/desktop

## 1.12.0

### Patch Changes

- Updated dependencies []:
  - @promptx/core@1.12.0
  - @promptx/mcp-server@1.12.0

## 1.11.0

### Patch Changes

- Updated dependencies [[`c3c9c45`](https://github.com/Deepractice/PromptX/commit/c3c9c451b9cdd5abaa5c1d51abe594ad14841354)]:
  - @promptx/mcp-server@1.11.0
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
  - @promptx/mcp-server@1.10.1

## 1.10.0

### Minor Changes

- [#292](https://github.com/Deepractice/PromptX/pull/292) [`f346df5`](https://github.com/Deepractice/PromptX/commit/f346df58b4e2a28432a9eed7bbfed552db10a9de) Thanks [@deepracticexs](https://github.com/deepracticexs)! - feat(desktop): Add resource management UI with GitHub-style design

  ### New Features

  - **Resource Management Interface**: New dedicated page to view and search all PromptX resources
  - **GitHub-style UI**: Clean, light-themed interface inspired by GitHub's design language
  - **Advanced Filtering**: Dual-layer filtering system for Type (Roles/Tools) and Source (System/User)
  - **Real-time Search**: Instant search across resource names, descriptions, and tags
  - **Resource Statistics**: Dashboard showing total resources breakdown by type and source

  ### Technical Improvements

  - **Enhanced Logging**: Consolidated logging system with file output to ~/.promptx/logs
  - **IPC Communication**: Fixed data structure issues in Electron IPC layer
  - **Renderer Process Logging**: Added dedicated logger for renderer process with main process integration
  - **Resource Loading**: Improved resource fetching from PromptX core with proper error handling

  ### UI/UX Enhancements

  - **Responsive Layout**: Properly structured layout with search bar and filter controls
  - **Visual Hierarchy**: Clear separation between search, filters, and resource listing
  - **Simplified Interaction**: Removed unnecessary buttons and click events for cleaner interface
  - **Better Organization**: Resources grouped by source (System/User) with clear visual indicators

  ### Bug Fixes

  - Fixed resource loading issue where data wasn't properly passed from main to renderer process
  - Resolved IPC handler duplicate registration errors
  - Fixed file path issues in development mode

### Patch Changes

- Updated dependencies []:
  - @promptx/cli@1.10.0

## 1.9.0

### Patch Changes

- Updated dependencies [[`50d6d2c`](https://github.com/Deepractice/PromptX/commit/50d6d2c6480e90d3bbc5ab98efa396cb68a865a1), [`3da84c6`](https://github.com/Deepractice/PromptX/commit/3da84c6fddc44fb5578421d320ee52e59f241157), [`2712aa4`](https://github.com/Deepractice/PromptX/commit/2712aa4b71e9752f77a3f5943006f99f904f157e)]:
  - @promptx/cli@1.9.0

## 1.8.0

### Patch Changes

- Updated dependencies [[`50d6d2c`](https://github.com/Deepractice/PromptX/commit/50d6d2c6480e90d3bbc5ab98efa396cb68a865a1), [`3da84c6`](https://github.com/Deepractice/PromptX/commit/3da84c6fddc44fb5578421d320ee52e59f241157), [`2712aa4`](https://github.com/Deepractice/PromptX/commit/2712aa4b71e9752f77a3f5943006f99f904f157e)]:
  - @promptx/cli@1.8.0

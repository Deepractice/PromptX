---
"@promptx/desktop": minor
---

feat(desktop): Add resource management UI with GitHub-style design

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
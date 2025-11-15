---
"@promptx/desktop": patch
---

feat: integrate main window with unified resource, logs and settings management (#486)

- Add main window page with sidebar navigation integrating three major modules
- Implement sidebar component for unified navigation
- Add internationalized date picker support (Chinese/English)
- Fix dialog animation sliding from top-left corner
- Add TypeScript type declarations for static assets (images, etc.)
- Optimize log filtering with custom date picker
- Add multiple shadcn/ui components (separator, sheet, skeleton, tooltip)

feat: add resource import/export functionality (#327)

- Implement resource import: support importing roles and tools from ZIP files
- Support custom configuration: customizable resource ID, name and description
- Implement resource export: auto-package as ZIP archive, cross-platform compatible
- Add file selection dialog: integrate Electron dialog API
- Add shadcn/ui components: Select, Tabs, Textarea, InputGroup
- Optimize Select component styling: add selected state background highlight
- Complete i18n support: Chinese/English translations for all import/export features
- Add dependency: adm-zip for cross-platform ZIP file handling

Technical implementation:
- Use AdmZip library for cross-platform compression/decompression
- ZIP format is universal across Windows/Linux/macOS, no special handling needed
- IPC communication: resources:import, resources:download, dialog:openFile
- Resource validation: check DPML file structure integrity

feat: complete application logs management page (#487)

- Add standalone logs window page with real-time log viewing and management
- Implement log filtering: by type (error/normal), date, keyword search
- Add log operations: view details, delete individual logs, clear all with one click
- Integrate IPC communication: logs:list, logs:read, logs:delete, logs:clear
- Optimize responsive layout: flexbox layout with independent scrolling for list and content areas
- Complete i18n support: Chinese/English translations covering all features
- Optimize Input component: adjust focus border from 3px to 1px for better visual experience

🤖 Generated with Claude Code

Co-Authored-By: Claude <noreply@anthropic.com>

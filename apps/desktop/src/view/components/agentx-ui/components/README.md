# AgentX UI Components

This directory contains all React components for the AgentX UI library.

## Directory Structure

### `/layout`

Layout components for structuring application UI:

- `ActivityBar` - Vertical activity bar with icons
- `Header` - Application header with left/center/right sections
- `MainContent` - Main content area wrapper
- `Panel` - Resizable panel component
- `RightSidebar` - Right sidebar with collapsible functionality
- `Sidebar` - Left sidebar with navigation
- `StatusBar` - Bottom status bar with items

### `/elements`

Atomic UI building blocks (previously `/ui`):

- `ActionBar` - Action button bar
- `AgentLogo` - Agent logo component
- `AppHeader` - Application header variant
- `Badge` - Badge/tag component
- `Button` - Primary button component
- `EmptyState` - Empty state placeholder
- `ImageAttachment` - Image attachment display
- `Input` - Text input field
- `ListItem` - List item component
- `LoadingState` - Loading state indicator
- `MessageAvatar` - Message avatar display
- `PageHeader` - Page header component
- `Popover` - Popover/tooltip component
- `ScrollArea` - Scrollable area wrapper
- `SearchInput` - Search input field
- `TabNavigation` - Tab navigation component
- `TimeAgo` - Relative time display
- `TokenUsagePie` - Token usage pie chart

### `/typography`

Text rendering and formatting components:

- `DiffViewer` - Code diff viewer
- `JSONRenderer` - JSON syntax highlighter
- `MarkdownText` - Markdown renderer with syntax highlighting

## Usage

```tsx
import { Button, Header, MarkdownText } from "@agentxjs/ui";

function App() {
  return (
    <div>
      <Header left={<h1>AgentX</h1>} />
      <Button>Click me</Button>
      <MarkdownText content="# Hello World" />
    </div>
  );
}
```

## Development

All components include:

- TypeScript definitions
- Storybook stories (`.stories.tsx`)
- Tailwind CSS styling
- Accessibility support

To view components in Storybook:

```bash
pnpm storybook
```

# Layout Components

Pure structural containers for building Agent application layouts. These components handle **spatial arrangement only** - no business logic, no data fetching, just layout.

## Design Philosophy

> **Separation of Concerns**: Layout components provide structure, content components provide meaning.

Layout components are **headless containers** that:

- ✅ Define spatial relationships (position, size, arrangement)
- ✅ Handle resizing and collapsing behavior
- ✅ Work with any content (domain-agnostic)
- ❌ Don't contain business logic
- ❌ Don't fetch data or manage state
- ❌ Don't know about your domain (sessions, users, etc.)

---

## Component Catalog

We provide 7 layout containers for building VSCode-style interfaces:

### 1. **Header** (Application-level top bar)

```tsx
<Header left={<Logo />} center={<SearchBar />} right={<UserMenu />} />
```

- **Purpose**: Global navigation, branding, search, user controls
- **Size**: Fixed height (default 56px)
- **Position**: Top of application

### 2. **ActivityBar** (Icon button bar)

```tsx
<ActivityBar items={topItems} bottomItems={bottomItems} onItemClick={handleClick} />
```

- **Purpose**: View switching, primary navigation
- **Size**: Fixed width (48px)
- **Position**: Left or right edge
- **Features**: Top/bottom sections, badges, active states

### 3. **Sidebar** (Resizable left panel)

```tsx
<Sidebar>
  <SessionList />
</Sidebar>
```

- **Purpose**: Primary content sidebar (files, sessions, search)
- **Size**: Resizable 200-600px
- **Position**: Left side (after ActivityBar)

### 4. **MainContent** (Primary content area)

```tsx
<MainContent>
  <ChatInterface />
</MainContent>
```

- **Purpose**: Main application content
- **Size**: Flexible (takes remaining space)
- **Position**: Center area

### 5. **Panel** (Bottom panel)

```tsx
<Panel>
  <Terminal />
</Panel>
```

- **Purpose**: Terminal, output, logs, debug info
- **Size**: Resizable 100-500px (height)
- **Position**: Bottom (below MainContent)

### 6. **RightSidebar** (Resizable right panel)

```tsx
<RightSidebar>
  <Outline />
</RightSidebar>
```

- **Purpose**: Outline, properties, preview, assistants
- **Size**: Resizable 200-600px
- **Position**: Right edge

### 7. **StatusBar** (Bottom status bar)

```tsx
<StatusBar>
  <StatusBarSection align="left">
    <StatusBarItem icon={<GitBranch />}>main</StatusBarItem>
  </StatusBarSection>
  <StatusBarSection align="right">
    <StatusBarItem>Line 42, Col 8</StatusBarItem>
  </StatusBarSection>
</StatusBar>
```

- **Purpose**: Global status, connection info, cursor position
- **Size**: Fixed height (24px)
- **Position**: Bottom of application

---

## Complete Layout Structure

```
┌─────────────────────────────────────────────┐
│                Header                        │ ← 1. Top bar
├──┬────────┬──────────────────────┬──────────┤
│  │        │                      │          │
│A │ Side   │    MainContent       │  Right   │ ← Main area
│c │ bar    │                      │  Side    │
│t │        ├──────────────────────┤  bar     │
│i │        │      Panel           │          │ ← Bottom panel
│v │        │                      │          │
│i │        │                      │          │
│t │        │                      │          │
│y │        │                      │          │
│  │        │                      │          │
│B │        │                      │          │
│a │        │                      │          │
│r │        │                      │          │
└──┴────────┴──────────────────────┴──────────┘
│              StatusBar                       │ ← 7. Status bar
└─────────────────────────────────────────────┘
    2.        3.         4.          6.         5.
```

---

## Usage Patterns

### Minimal Layout (MainContent only)

```tsx
<MainContent>
  <YourApp />
</MainContent>
```

### Three-Column Layout (ActivityBar + Sidebar + Main)

```tsx
import { Allotment } from "allotment";

<Allotment>
  <Allotment.Pane minSize={48} maxSize={48}>
    <ActivityBar items={items} />
  </Allotment.Pane>
  <Allotment.Pane minSize={200} maxSize={600} preferredSize={256}>
    <Sidebar>
      <SessionList />
    </Sidebar>
  </Allotment.Pane>
  <Allotment.Pane>
    <MainContent>
      <ChatInterface />
    </MainContent>
  </Allotment.Pane>
</Allotment>;
```

### Complete Layout (All 7 containers)

```tsx
<div className="h-screen flex flex-col">
  {/* Header */}
  <Header left={<Logo />} center={<SearchBar />} right={<UserMenu />} />

  {/* Main Area */}
  <div className="flex-1">
    <Allotment>
      {/* ActivityBar */}
      <Allotment.Pane minSize={48} maxSize={48}>
        <ActivityBar items={items} bottomItems={bottomItems} />
      </Allotment.Pane>

      {/* Sidebar */}
      <Allotment.Pane minSize={200} maxSize={600} preferredSize={256}>
        <Sidebar>
          <SessionList />
        </Sidebar>
      </Allotment.Pane>

      {/* Main + Panel */}
      <Allotment.Pane>
        <Allotment vertical>
          <Allotment.Pane>
            <MainContent>
              <ChatInterface />
            </MainContent>
          </Allotment.Pane>
          <Allotment.Pane minSize={100} maxSize={500} preferredSize={200}>
            <Panel>
              <Terminal />
            </Panel>
          </Allotment.Pane>
        </Allotment>
      </Allotment.Pane>

      {/* RightSidebar */}
      <Allotment.Pane minSize={200} maxSize={600} preferredSize={300}>
        <RightSidebar>
          <Outline />
        </RightSidebar>
      </Allotment.Pane>
    </Allotment>
  </div>

  {/* StatusBar */}
  <StatusBar>
    <StatusBarSection align="left">
      <StatusBarItem icon={<GitBranch />}>main</StatusBarItem>
    </StatusBarSection>
    <StatusBarSection align="right">
      <StatusBarItem>Line 42, Col 8</StatusBarItem>
    </StatusBarSection>
  </StatusBar>
</div>
```

---

## Design Principles

### 1. **Single Responsibility**

Each component has ONE job: spatial arrangement.

**✅ Good**:

```tsx
<Sidebar>
  <SessionList sessions={data} />
</Sidebar>
```

**❌ Bad**:

```tsx
// Sidebar shouldn't know about sessions
<Sidebar fetchSessions={true} sessionType="active" />
```

### 2. **Composition over Configuration**

Use React composition instead of complex props.

**✅ Good**:

```tsx
<Header left={<Logo />} right={<UserMenu />} />
```

**❌ Bad**:

```tsx
<Header
  showLogo={true}
  logoSize="large"
  userMenuPosition="right"
  userMenuItems={[...]}
/>
```

### 3. **Content Agnostic**

Layout components work with ANY content.

**✅ Good**: Works with any children

```tsx
<Sidebar>
  <SessionList /> {/* ✅ */}
  <FileExplorer /> {/* ✅ */}
  <CustomWidget /> {/* ✅ */}
</Sidebar>
```

**❌ Bad**: Tied to specific content

```tsx
<SessionSidebar sessions={data} />  {/* Too specific */}
```

### 4. **Headless Pattern**

No styling opinions about content, only container.

**✅ Good**: Container provides structure

```tsx
<Panel>
  <Terminal backgroundColor="black" /> {/* Content controls its style */}
</Panel>
```

**❌ Bad**: Layout controls content style

```tsx
<Panel terminalTheme="dark" />  {/* Don't do this */}
```

---

## Decision Criteria: Should This Be a Layout Component?

Use this checklist when adding new components:

### ✅ Belongs in `layout/` if:

- [ ] **Structural Purpose**: Primary job is spatial arrangement
- [ ] **Content Agnostic**: Works with any child content
- [ ] **No Business Logic**: Zero knowledge about your domain
- [ ] **Reusable**: Can be used in different applications
- [ ] **Composable**: Combines with other layout components

### ❌ Does NOT belong in `layout/` if:

- [ ] Contains domain-specific logic (users, sessions, etc.)
- [ ] Fetches or manages data
- [ ] Has complex user interactions beyond sizing/positioning
- [ ] Knows about your business rules

### Gray Area Test

**Ask yourself**: "Can this component work in a TODO app? A code editor? A dashboard?"

- **YES** → Probably a layout component ✅
- **NO** → Probably a domain component ❌

### Examples

| Component     | Layout? | Reason                                    |
| ------------- | ------- | ----------------------------------------- |
| `Header`      | ✅ YES  | Pure structural container, works anywhere |
| `Sidebar`     | ✅ YES  | Spatial arrangement, content-agnostic     |
| `SessionList` | ❌ NO   | Domain-specific (knows about sessions)    |
| `ChatInput`   | ❌ NO   | Business logic (message sending)          |
| `Panel`       | ✅ YES  | Just a resizable bottom container         |
| `Terminal`    | ❌ NO   | Complex behavior (shell interaction)      |

---

## Anti-Patterns

### ❌ Don't: Add Business Logic

```tsx
// BAD: Layout component shouldn't fetch data
function Sidebar({ apiEndpoint }) {
  const [data, setData] = useState([]);
  useEffect(() => {
    fetch(apiEndpoint).then(setData);
  }, []);
  return <div>{data.map(...)}</div>;
}
```

**✅ Do**: Keep it pure

```tsx
// GOOD: Just a container
function Sidebar({ children }) {
  return <div className="sidebar">{children}</div>;
}
```

### ❌ Don't: Couple to Content

```tsx
// BAD: Too specific
<Sidebar type="sessions" showSearch={true} />
```

**✅ Do**: Use composition

```tsx
// GOOD: Flexible
<Sidebar>
  <SessionSearchBar />
  <SessionList />
</Sidebar>
```

### ❌ Don't: Complex Configuration

```tsx
// BAD: Too many props
<Header
  showLogo={true}
  logoPosition="left"
  showSearch={true}
  searchPlaceholder="Search..."
  showUserMenu={true}
  userMenuPosition="right"
/>
```

**✅ Do**: Simple slots

```tsx
// GOOD: Compose your own
<Header left={<Logo />} center={<SearchBar placeholder="Search..." />} right={<UserMenu />} />
```

---

## Technical Notes

### Resizing with Allotment

All resizable components (Sidebar, Panel, RightSidebar) are designed to work with [allotment](https://github.com/johnwalley/allotment):

```tsx
import { Allotment } from "allotment";
import "allotment/dist/style.css";

<Allotment>
  <Allotment.Pane minSize={200} maxSize={600} preferredSize={256} snap>
    <Sidebar>...</Sidebar>
  </Allotment.Pane>
  <Allotment.Pane>
    <MainContent>...</MainContent>
  </Allotment.Pane>
</Allotment>;
```

**Key Props**:

- `minSize` / `maxSize` - Size constraints
- `preferredSize` - Initial size
- `snap` - Double-click divider to collapse/expand
- `vertical` - Stack vertically instead of horizontally

### Styling

Layout components provide minimal styling (borders, backgrounds). Content components style themselves:

```tsx
<Sidebar>
  {/* Content controls its own styling */}
  <div className="p-4 bg-blue-100">
    <SessionList />
  </div>
</Sidebar>
```

---

## Related Documentation

- [Design System](../../DESIGN_SYSTEM.md) - Color palette, typography, spacing
- [Storybook](http://localhost:6006/?path=/story/layout) - Interactive component demos
- [allotment docs](https://allotment.mulberryhousesoftware.com/) - Resizing behavior

---

## Contributing

When adding new layout components:

1. **Check decision criteria** - Does it belong here?
2. **Follow principles** - Single responsibility, composition, headless
3. **Add stories** - Create `ComponentName.stories.tsx`
4. **Update this README** - Add to component catalog
5. **Export in index.ts** - Make it available

Questions? Review the decision criteria above or ask the team.

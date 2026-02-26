# Typography Components

Advanced text formatting and display components for professional content presentation.

## Design Philosophy

> **Text-First**: Focus on professional typography and readability optimization for text content.

Typography components understand content structure and apply appropriate formatting, syntax highlighting, and layout to maximize readability.

---

## Core Characteristics

- ✅ **Text-Centric**: Primary content is text (not images, charts, or raw data)
- ✅ **Structure-Aware**: Understand content structure (Markdown, JSON, Code)
- ✅ **Professional Formatting**: Apply proper indentation, highlighting, and layout
- ✅ **Readability First**: Optimize for human comprehension

---

## Component Catalog

### 1. **MarkdownText** - Rich Text Formatting

```tsx
<MarkdownText># Hello World **Bold text** and *italic text*</MarkdownText>
```

- **Purpose**: Render Markdown syntax with proper formatting
- **Use Cases**: Chat messages, documentation, rich text content
- **Features**:
  - Full Markdown syntax support
  - Code block highlighting
  - Link rendering
  - Semantic HTML output

### 2. **JSONRenderer** - Structured Text Display

```tsx
<JSONRenderer data={{ user: { name: "Sean", role: "Developer" } }} collapsible={true} />
```

- **Purpose**: Display JSON data with professional formatting
- **Use Cases**: API responses, configuration files, debug output
- **Features**:
  - Syntax highlighting
  - Automatic indentation
  - Collapsible sections
  - Type indicators (string, number, boolean, etc.)

### 3. **DiffViewer** - Code Comparison Display

```tsx
<DiffViewer oldText="const x = 1;" newText="const x = 2;" language="typescript" />
```

- **Purpose**: Show code differences with side-by-side comparison
- **Use Cases**: Code reviews, change tracking, file comparisons
- **Features**:
  - Side-by-side or unified view
  - Syntax highlighting
  - Line numbers
  - Addition/deletion indicators

---

## Decision Criteria

Use this checklist when deciding if a component belongs in `typography/`:

### ✅ Belongs in `typography/` if:

- [ ] **Text Content**: Core content is text (not images, videos, charts)
- [ ] **Needs Formatting**: Requires professional formatting (not just `<p>` or `<span>`)
- [ ] **Structure Understanding**: Component understands content structure (Markdown, JSON, Code, etc.)
- [ ] **Readability Focus**: Primary goal is to improve human readability
- [ ] **Display Only**: Mainly for display (not input/editing)

### ❌ Does NOT belong in `typography/` if:

- [ ] **Non-Text Content**: Primary content is images, charts, tables, or raw data
- [ ] **Simple Text**: Can be handled by basic `<Text>` component from `elements/`
- [ ] **Input/Editing**: Used for text input or editing → Use `elements/Input` or dedicated editor
- [ ] **Layout Container**: Used for spatial arrangement → Use `layout/`
- [ ] **Data Visualization**: Used for visualizing structured data → Use `data-display/` (future)

---

## Gray Area Examples

### Case 1: JSON Renderer - Why Typography?

**Question**: "Is JSON data or text?"

**Answer**: JSON is **structured text** ✅

```tsx
// JSON is text with structure
const json = `{
  "user": { "name": "Sean" }
}`

// Similar to Code Block (Chakra UI places in Typography)
<CodeBlock language="json">{json}</CodeBlock>

// Our JSON Renderer (same purpose: format text for readability)
<JSONRenderer data={data} />
```

**Judgment**:

- ✅ Displays text (string representation of JSON)
- ✅ Needs formatting (indentation, line breaks, highlighting)
- ✅ Goal is readability (not data manipulation)
- → Belongs in Typography ✅

### Case 2: Table - Why NOT Typography?

**Question**: "Tables display text, why not Typography?"

**Answer**: Tables display **tabular data**, not formatted text ❌

```tsx
// Table is about data relationships (rows × columns)
<Table
  data={[
    { name: "Sean", age: 30 },
    { name: "Alice", age: 25 },
  ]}
/>
```

**Judgment**:

- ❌ Primary purpose is data structure (not text formatting)
- ❌ Focus is on data relationships (not readability)
- → Belongs in Data Display (future) or use shadcn/ui Table

---

## Comparison with Other Directories

| Directory         | Purpose                       | Examples                 | Text-Focused?      |
| ----------------- | ----------------------------- | ------------------------ | ------------------ |
| `elements/`       | Atomic UI primitives          | Button, Input, Badge     | ❌ No              |
| `layout/`         | Spatial containers            | Header, Sidebar, Panel   | ❌ No              |
| **`typography/`** | **Text formatting & display** | **Markdown, JSON, Diff** | **✅ Yes**         |
| `message/`        | Message types                 | UserMessage, AIMessage   | ⚠️ Uses typography |
| `chat/`           | Chat interactions             | ChatInput, MessageList   | ⚠️ Uses typography |
| `session/`        | Session management            | SessionList, SessionItem | ❌ No              |

**Key Insight**: `message/` and `chat/` components **use** typography components, but aren't typography themselves (they have business logic).

---

## Design Principles

### 1. **Understand Structure**

Typography components must understand the content structure they're rendering:

**✅ Good**: Understands Markdown

```tsx
function MarkdownText({ children }) {
  const html = parseMarkdown(children); // ✅ Parse structure
  return <div dangerouslySetInnerHTML={{ __html: html }} />;
}
```

**❌ Bad**: Treats everything as plain text

```tsx
function MarkdownText({ children }) {
  return <pre>{children}</pre>; // ❌ No structure understanding
}
```

### 2. **Optimize Readability**

Every formatting decision should improve readability:

```tsx
// ✅ Good: Proper indentation for nested JSON
{
  "user": {
    "name": "Sean"
  }
}

// ❌ Bad: No formatting
{"user":{"name":"Sean"}}
```

### 3. **Minimal Interaction**

Typography components are primarily for display. Interactions should support readability:

**✅ Acceptable Interactions**:

- Collapse/expand sections (help with large content)
- Copy to clipboard (help with reuse)
- Scroll/zoom (help with viewing)

**❌ Avoid**:

- Editing text inline (use dedicated editor)
- Complex data manipulation (use data management components)
- Form submission (use form components)

### 4. **Semantic HTML**

Always use proper semantic HTML for accessibility:

```tsx
// ✅ Good: Semantic elements
<MarkdownText>
  <h1>Title</h1>
  <p>Paragraph</p>
  <code>inline code</code>
</MarkdownText>

// ❌ Bad: Generic divs
<MarkdownText>
  <div class="title">Title</div>
  <div class="text">Paragraph</div>
</MarkdownText>
```

---

## Integration with shadcn/ui

Typography components complement shadcn/ui, not replace it:

### When to use shadcn/ui Text components:

```tsx
import { Text } from "~/components/elements"  // From shadcn/ui

// Simple text display
<Text>Hello World</Text>

// Basic formatting
<Text className="font-bold text-lg">Important</Text>
```

### When to use Typography components:

```tsx
import { MarkdownText } from "~/components/typography";

// Structured text that needs parsing
<MarkdownText># Title **Bold** and *italic*</MarkdownText>;
```

**Rule of Thumb**:

- **Simple text** → `elements/Text` (shadcn/ui)
- **Structured text** → `typography/` components

---

## Future Components

Potential additions to `typography/`:

- **CodeBlock** - Syntax-highlighted code display (like Chakra UI)
- **LaTeX Renderer** - Mathematical formula display
- **ASCIIArt** - Preserve spacing for ASCII art/diagrams
- **Highlight** - Text highlighting with search/annotation
- **Table of Contents** - Auto-generated from Markdown headings

**Decision Process**: Apply the criteria above. If it's text-centric and needs special formatting, it belongs here.

---

## Best Practices

### 1. Performance

Typography components often render large text. Optimize for performance:

```tsx
// ✅ Good: Lazy render large content
<JSONRenderer data={largeData} collapsible defaultCollapsed />

// ✅ Good: Virtualize long documents
<MarkdownText virtualized>{longDocument}</MarkdownText>
```

### 2. Accessibility

Always provide proper ARIA labels and semantic HTML:

```tsx
// ✅ Good: Proper ARIA
<DiffViewer
  oldText={old}
  newText={new}
  aria-label="Code comparison: before and after changes"
/>
```

### 3. Consistency

Use consistent styling across all typography components:

- Same font families
- Same code highlighting theme
- Same spacing/indentation rules
- Same color scheme for syntax

---

## Testing Guidelines

### Unit Tests

Test parsing and formatting logic:

```typescript
describe('MarkdownText', () => {
  it('should parse bold syntax', () => {
    render(<MarkdownText>**bold**</MarkdownText>)
    expect(screen.getByText('bold')).toHaveClass('font-bold')
  })
})
```

### Visual Tests

Use Storybook for visual regression testing:

```tsx
export const AllMarkdownSyntax: Story = {
  render: () => <MarkdownText># H1 ## H2 **bold** *italic* `code`</MarkdownText>,
};
```

### Accessibility Tests

Ensure proper semantic structure:

```typescript
it('should use semantic HTML', () => {
  render(<MarkdownText># Title</MarkdownText>)
  expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument()
})
```

---

## Contributing

When adding new typography components:

1. **Check Decision Criteria** - Does it belong in typography/?
2. **Follow Principles** - Structure-aware, readability-first, minimal interaction
3. **Add Storybook Stories** - Visual documentation and testing
4. **Write Tests** - Unit + visual + accessibility tests
5. **Update This README** - Add to component catalog
6. **Export in index.ts** - Make it available to consumers

Questions? Review the decision criteria and examples above, or reference Chakra UI's Typography category.

---

## References

- [Chakra UI Typography](https://chakra-ui.com/docs/components/typography) - Inspiration for this category
- [React Markdown](https://github.com/remarkjs/react-markdown) - Markdown rendering library we use
- [Prism.js](https://prismjs.com/) - Syntax highlighting library
- [Design System](../../DESIGN_SYSTEM.md) - Our color palette and typography tokens

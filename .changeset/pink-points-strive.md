---
"@promptx/desktop": patch
---

Resource Manager UX: Prevent the edit modal from opening when clicking action icons

- Context: Resource cards use `onClick` to open the edit modal. Clicking right-side action icons (Edit, View/External link, Delete) bubbled to the card, unintentionally triggering the modal.
- Fix: Call `e.stopPropagation()` in each icon’s `onClick` (or on the icon container) to block event bubbling and ensure only the intended action runs.
- Touched file: `apps/desktop/src/view/pages/resources-window/index.tsx`.
- Impact: Affects the behavior of “Edit”, “View/External link”, and “Delete” icons on role/tool cards.
- UX: Clicking action icons now performs the expected operation without opening the editor.
- Compatibility: Non-breaking patch; no API or data shape changes.

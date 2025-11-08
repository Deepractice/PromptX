---
"@promptx/resource": patch
"@promptx/desktop": patch
---

### fix(resource, desktop): Revert resource path logic and fix system role activation

This update addresses a critical regression that affected resource loading and system role activation. The changes are broken down as follows:

- **Reverted Path Resolution Logic in `@promptx/resource`**: A recent modification to the path handling logic within the `@promptx/resource` package was identified as the root cause of widespread resource loading failures. This change has been reverted to its previous, stable state. This ensures that the application can once again reliably locate and parse resource files (e.g., roles, tools) from their correct directories, resolving the loading failures.

- **Fixed System Role Activation Bug**: A direct consequence of the pathing issue was a severe bug that made it impossible to activate or utilize any of the built-in system roles (such as `sean`, `luban`, or `nuwa`) in the desktop application. The fix restores the correct path resolution, allowing the application to find the necessary system role definition files and making these essential roles fully functional and accessible to users again.

- **Optimized Resource Management UI**: The resource management page has been refined to provide a better user experience. Previously, it displayed both user-created custom resources and internal system resources. This was confusing and exposed core components to unintended user actions. The page now leverages the corrected path logic to distinguish between resource types and filters out all built-in system resources from the view. As a result, users will now only see and be able to manage their own custom-defined resources, creating a cleaner and safer management interface.

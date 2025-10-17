---
"@promptx/resource": patch
---

Fix filesystem tool ALLOWED_DIRECTORIES environment variable JSON parsing issue. The tool now properly handles escaped quotes from .env file format, allowing configuration of multiple allowed directories.

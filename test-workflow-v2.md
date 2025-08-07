# Test Workflow V2

This file tests the updated auto version management system with fixes:

## Changes Applied
- Fixed GITHUB_TOKEN to use GH_PAT
- Removed publish/* labels (auto-publish on version change)
- Simplified workflow triggers

## Expected Flow
1. PR created → auto-labeler adds changeset/patch
2. PR merged → auto-changeset creates changeset file
3. Version updated → npm-publisher auto-publishes

Testing date: 2025-08-07
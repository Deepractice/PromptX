# Test Fix Branch for Issue #219

This is a test file to verify the fix branch workflow:

1. Branch name: `fix/#219-test-workflow`
2. Issue: #219
3. Expected labels:
   - `type: fix` (from branch-validator)
   - `changeset/patch` (from auto-labeler)
   - `merge/squash` (from auto-labeler)
   - `publish/dev` (from auto-labeler, if PR to develop)

## Testing Points

- [ ] Branch validation passes
- [ ] Auto-labeler adds correct labels
- [ ] NPM publisher only runs with publish label
- [ ] Changeset creation works correctly
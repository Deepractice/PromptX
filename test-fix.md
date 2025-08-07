# Test Fix Branch

This is a test file to verify the fix branch workflow:

1. Branch name: `fix/#999-test-label-workflow`
2. Expected labels:
   - `type: fix` (from branch-validator)
   - `changeset/patch` (from auto-labeler)
   - `merge/squash` (from auto-labeler)
   - `publish/dev` (from auto-labeler, if PR to develop)

## Testing Points

- [ ] Branch validation passes
- [ ] Auto-labeler adds correct labels
- [ ] NPM publisher only runs with publish label
- [ ] Changeset creation works correctly
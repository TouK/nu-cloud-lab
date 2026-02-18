# Release Workflow

Visual guide to the release process for `@nussknacker/cli`.

## Branch Strategy

```
┌─────────────────┐
│ Feature Branches│
└────────┬────────┘
         │
         ↓ PR
    ┌────────┐
    │  dev   │ ← Beta testing branch
    └────┬───┘
         │ Auto-release: 0.2.0-beta.1, 0.2.0-beta.2, ...
         │ npm tag: beta
         │
         ↓ PR (after testing)
   ┌─────────┐
   │ master  │ ← Stable production branch
   └─────────┘
         │ Auto-release: 0.2.0, 0.2.1, ...
         │ npm tag: latest
```

## Release Flow

### 1. Feature Development → Beta

```bash
# Developer workflow
git checkout dev
git checkout -b feat/new-feature

# Make changes
git commit -m "feat: add awesome feature"
git push origin feat/new-feature

# Create PR: feat/new-feature → dev
# After merge → Auto beta release
```

**Result:**
- Version: `0.2.0-beta.1`
- NPM tag: `beta`
- GitHub: Pre-release
- Install: `npm install @nussknacker/cli@beta`

### 2. Beta Testing

```bash
# Test beta version
npm install @nussknacker/cli@beta
nu-cli --version  # 0.2.0-beta.1

# If bugs found, create more PRs to dev
git commit -m "fix: resolve beta bug"
# → Auto release: 0.2.0-beta.2
```

### 3. Beta → Stable

```bash
# After successful beta testing
git checkout master
git merge dev
git push origin master

# Auto stable release
```

**Result:**
- Version: `0.2.0` (removes -beta suffix)
- NPM tag: `latest`
- GitHub: Release
- Install: `npm install @nussknacker/cli`

### 4. Hotfix to Stable

```bash
# Urgent fix directly to production
git checkout master
git checkout -b fix/critical-bug

git commit -m "fix: resolve critical issue"
git push origin fix/critical-bug

# Create PR: fix/critical-bug → master
# After merge → Auto release: 0.2.1
```

## Version Numbering

### Beta Versions

Each commit to `dev` increments beta version:

```
0.2.0-beta.1  ← first beta
0.2.0-beta.2  ← bug fix
0.2.0-beta.3  ← another fix
```

### Stable Versions

Semantic versioning based on commit type:

- `feat:` → MINOR: `0.1.0` → `0.2.0`
- `fix:` → PATCH: `0.2.0` → `0.2.1`
- `feat!:` → MAJOR: `0.2.0` → `1.0.0`

## NPM Tags

Published package has multiple tags:

```bash
npm view @nussknacker/cli dist-tags

{
  latest: '0.2.0',      # Stable from master
  beta: '0.3.0-beta.2'  # Latest from dev
}
```

Users can install specific versions:

```bash
npm install @nussknacker/cli          # latest (0.2.0)
npm install @nussknacker/cli@beta     # beta (0.3.0-beta.2)
npm install @nussknacker/cli@0.2.0    # specific version
```

## GitHub Releases

### Pre-release (from dev)
- ✅ Tagged as pre-release
- 📝 Beta changelog
- 🏷️ Version: `v0.2.0-beta.1`

### Release (from master)
- ✅ Stable release
- 📝 Full changelog
- 🏷️ Version: `v0.2.0`

## Automation Details

### Triggered Workflows

| Event | Branch | Workflow | Result |
|-------|--------|----------|--------|
| Push | `dev` | Beta Release | `0.2.0-beta.1` (npm@beta) |
| Push | `master` | Release | `0.2.0` (npm@latest) + sync dev |
| PR | any → `dev` | CI | Build + typecheck |
| PR | any → `master` | CI | Build + typecheck |

### What Gets Updated

On every release from `master`:

1. **package.json** - version updated
2. **package-lock.json** - version updated
3. **CHANGELOG.md** - generated from commits
4. **Git tag** - created (e.g., `v0.2.0`)
5. **GitHub release** - created with notes
6. **npm registry** - package published
7. **dev branch** - automatically synced with master

All updates committed back with `[skip ci]` to prevent loops.

### Branch Synchronization

After every stable release from `master`, the `dev` branch is **automatically synchronized**:

```bash
# Happens automatically after master release
git checkout dev
git merge master --no-edit
git push origin dev
```

This ensures:
- ✅ Bug fixes from hotfixes are in dev
- ✅ Version numbers stay in sync
- ✅ No manual synchronization needed
- ✅ Dev always includes latest stable changes

**Note:** The sync commit includes `[skip ci]` to avoid triggering unnecessary builds.

## Best Practices

### ✅ Do

- Merge features to `dev` first for beta testing
- Test beta versions before promoting to stable
- Use conventional commit format
- Merge `dev` to `master` after testing (dev will auto-sync after release)
- Use hotfix branches for urgent fixes to `master`

### ❌ Don't

- Don't manually bump versions in package.json
- Don't create tags manually
- Don't publish to npm manually
- Don't merge feature branches directly to `master`
- Don't use `npm version` command

## Troubleshooting

### Beta not published after merge to dev

Check:
1. Commit message uses conventional format
2. GitHub Actions workflow completed
3. NPM_TOKEN secret is set

### Version didn't increment

Semantic-release only creates releases for meaningful commits:
- `feat:`, `fix:`, `perf:` → release
- `docs:`, `chore:`, `test:` → no release

### Both beta and stable have same version

This is normal after merging `dev` → `master`:
- Before: `beta: 0.2.0-beta.3`, `latest: 0.1.0`
- After: `beta: 0.2.0-beta.3`, `latest: 0.2.0`

Next commit to `dev` will create `0.3.0-beta.1`.

## Examples

### Adding a feature with beta testing

```bash
# 1. Develop feature
git checkout dev
git checkout -b feat/json-export
git commit -m "feat: add JSON export functionality"
git push origin feat/json-export

# 2. Merge to dev (via PR)
# → Auto: 0.2.0-beta.1 published

# 3. Test beta
npm install @nussknacker/cli@beta
# Test the feature...

# 4. Found bug, fix it
git checkout -b fix/export-bug
git commit -m "fix: handle empty data in export"
git push origin fix/export-bug

# 5. Merge to dev
# → Auto: 0.2.0-beta.2 published

# 6. Test again, works!
npm install @nussknacker/cli@beta
# All good!

# 7. Promote to stable
git checkout master
git merge dev
git push origin master
# → Auto: 0.2.0 published

# 8. Users get stable version
npm install @nussknacker/cli  # 0.2.0
```

### Quick hotfix

```bash
# 1. Critical bug in production
git checkout master
git checkout -b fix/security-issue

# 2. Fix it
git commit -m "fix: resolve security vulnerability"
git push origin fix/security-issue

# 3. Merge to master (via PR)
# → Auto: 0.2.1 published immediately
# → Auto: dev branch synced with master
```

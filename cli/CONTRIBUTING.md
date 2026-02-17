# Contributing to @nussknacker/cli

## Commit Convention

This project uses [Conventional Commits](https://www.conventionalcommits.org/) for automated versioning and changelog generation.

### Commit Format

```
<type>(<scope>): <subject>

[optional body]

[optional footer]
```

### Types

- **feat**: New feature (triggers MINOR version bump)
- **fix**: Bug fix (triggers PATCH version bump)
- **perf**: Performance improvement (triggers PATCH version bump)
- **refactor**: Code change that neither fixes a bug nor adds a feature (triggers PATCH version bump)
- **docs**: Documentation only changes (no release)
- **style**: Code style changes (formatting, etc.) (no release)
- **test**: Adding or updating tests (no release)
- **chore**: Maintenance tasks (no release)
- **ci**: CI/CD changes (no release)
- **build**: Build system changes (no release)

### Breaking Changes

Add `BREAKING CHANGE:` in the footer or append `!` after type to trigger MAJOR version bump:

```
feat!: remove support for Node 16

BREAKING CHANGE: Node 18+ is now required
```

### Examples

```bash
# Feature (0.1.0 -> 0.2.0)
git commit -m "feat: add support for Tailscale tunnels"

# Bug fix (0.1.0 -> 0.1.1)
git commit -m "fix: handle missing config file gracefully"

# Breaking change (0.1.0 -> 1.0.0)
git commit -m "feat!: redesign config file format"

# Multiple changes
git commit -m "feat(consumer): add JSON output mode" -m "Adds --json flag for piping output to other tools"
```

## Release Process

Releases are **fully automated** via semantic-release.

### Stable Release (master)

1. Merge PR to `master` branch
2. GitHub Actions runs semantic-release
3. Version is automatically bumped (e.g., `0.1.0` → `0.2.0`)
4. CHANGELOG.md is updated
5. Git tag is created
6. Package is published to npm with `latest` tag
7. GitHub release is created
8. **`dev` branch is automatically synced with `master`**

**Example:** `npm install @nussknacker/cli` → installs stable version

### Beta Release (dev)

1. Merge PR to `dev` branch
2. GitHub Actions runs semantic-release
3. Beta version is created (e.g., `0.2.0-beta.1`)
4. Package is published to npm with `beta` tag
5. GitHub pre-release is created

**Example:** `npm install @nussknacker/cli@beta` → installs beta version

### Version Flow

```
dev branch:     0.1.0 → 0.2.0-beta.1 → 0.2.0-beta.2 → ...
                                         ↓ (merge dev → master)
master branch:                        0.2.0 → 0.2.1 → ...
```

**No manual `npm version` or `npm publish` needed!**

## Development Workflow

### For Beta Testing

1. **Create a branch from `dev`**
   ```bash
   git checkout dev
   git pull origin dev
   git checkout -b feat/my-feature
   ```

2. **Make changes and commit using conventional format**
   ```bash
   git add .
   git commit -m "feat: add new feature"
   ```

3. **Push and create PR to `dev`**
   ```bash
   git push origin feat/my-feature
   # Create PR: feat/my-feature → dev
   ```

4. **CI will run** - checks type safety and build

5. **After PR merge to `dev`** - beta release is published! (`0.2.0-beta.1`)

6. **Test beta version**
   ```bash
   npm install @nussknacker/cli@beta
   nu-cloud --version  # Should show beta version
   ```

### For Stable Release

1. **Merge `dev` into `master`** (after beta testing)
   ```bash
   git checkout master
   git merge dev
   git push origin master
   ```

2. **Stable release is published** (`0.2.0`)

3. **`dev` branch automatically synced** (no manual merge needed!)

### Quick Fix to Stable

For urgent fixes directly to production:

1. **Create branch from `master`**
   ```bash
   git checkout master
   git checkout -b fix/urgent-bug
   ```

2. **Make fix and create PR to `master`**
   ```bash
   git commit -m "fix: resolve critical bug"
   git push origin fix/urgent-bug
   # Create PR: fix/urgent-bug → master
   ```

3. **After merge** - patch release is published (`0.2.1`) and `dev` is auto-synced

## Setup for Development

```bash
cd cli
npm install
npm run dev  # Run in development mode
npm run build  # Build for production
npm run typecheck  # Check types
```

## Publishing Manually (if needed)

Normally not required, but for testing:

```bash
npm run build
npm publish --dry-run  # Test without publishing
```

## NPM Token Setup

For maintainers: Add `NPM_TOKEN` secret to GitHub repository settings:

1. Generate token at https://www.npmjs.com/settings/YOUR_USERNAME/tokens
2. Select "Automation" type token
3. Add to GitHub: Settings → Secrets and variables → Actions → New repository secret
4. Name: `NPM_TOKEN`
5. Value: `npm_xxx...`

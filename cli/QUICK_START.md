# Quick Start - Release Setup

Quick start guide for new developers.

## 📋 What's Configured?

✅ **Semantic Release** - automatic versioning and publishing  
✅ **Beta releases** - testing before stable (branch `dev`)  
✅ **GitHub Actions** - CI/CD workflows  
✅ **Conventional Commits** - standardized commit format  

## 🚀 Basics

### Package Installation

```bash
# Stable version (latest)
npm install @nussknacker/cli

# Beta version (testing)
npm install @nussknacker/cli@beta
```

### Development

```bash
cd cli
npm install
npm run dev -- --help
```

## 📝 How to Commit?

**Format:** `<type>(<scope>): <subject>`

```bash
# Feature
git commit -m "feat(producer): add retry mechanism"

# Bug fix  
git commit -m "fix(consumer): handle connection timeout"

# Breaking change
git commit -m "feat!: remove deprecated config options"

# No release (docs, chores, tests)
git commit -m "docs: update installation guide"
```

**Helper:**
```bash
git config commit.template cli/.git-commit-template
```

## 🔄 Workflow

### Beta Testing (dev branch)

```bash
# 1. Create branch from dev
git checkout dev
git pull origin dev
git checkout -b feat/my-feature

# 2. Make changes
git commit -m "feat: add awesome feature"
git push origin feat/my-feature

# 3. Create PR to dev
# 4. Merge → Auto beta release (0.2.0-beta.1)

# 5. Test beta
npm install @nussknacker/cli@beta
nu-cli --version
```

### Stable Release (master branch)

```bash
# After beta testing
git checkout master
git merge dev
git push origin master

# Auto stable release (0.2.0)
# Auto sync: dev branch updated with master changes
```

### Hotfix

```bash
git checkout master
git checkout -b fix/urgent
git commit -m "fix: critical bug"
# PR to master → Auto release (0.2.1)
# Note: dev branch will be auto-synced after release
```

## 🛠️ Useful Commands

```bash
# Check published versions
npm run check:version

# Test release locally (dry-run)
npm run release:dry

# Build & typecheck
npm run build
npm run typecheck
```

## 📚 Documentation

- **[CONTRIBUTING.md](./CONTRIBUTING.md)** - Full guide for contributors
- **[RELEASE_SETUP.md](./RELEASE_SETUP.md)** - NPM & GitHub setup (maintainers only)
- **[RELEASE_WORKFLOW.md](./RELEASE_WORKFLOW.md)** - Detailed workflow description and examples

## ❓ FAQ

**Q: When to use dev vs master?**  
A: Always use `dev` for new features. Merge to `master` only after beta testing.

**Q: How to publish beta?**  
A: Merge PR to `dev` - GitHub Actions does the rest.

**Q: How to fix a bug in production?**  
A: Branch from `master`, fix, PR to `master`, auto patch release.

**Q: I don't remember commit types**  
A: `git config commit.template cli/.git-commit-template` - template with examples

**Q: How to check what will be released?**  
A: `npm run release:dry` - simulates release without publishing

**Q: Do I need to sync dev after merging to master?**  
A: No! The `dev` branch is **automatically synced** after every stable release.

## ⚠️ Don't Do This:

- ❌ Manual `npm version` or `npm publish`
- ❌ Committing changes to `package.json` version
- ❌ Creating tags manually
- ❌ Merging feature branches directly to `master`
- ❌ Commits without conventional format (blocks release)
- ❌ Manually syncing `dev` with `master` (it's automatic!)

## ✅ Best Practices

- ✅ Always test on beta before stable
- ✅ Use conventional commits
- ✅ PR review before merge
- ✅ Test locally before push (`npm run build && npm run typecheck`)
- ✅ Check GitHub Actions after merge

## 🎯 Typical Flow

```
1. feat/my-feature → dev (PR)
2. Auto: 0.2.0-beta.1 published
3. Test: npm install @nussknacker/cli@beta
4. fix/beta-bug → dev (PR)
5. Auto: 0.2.0-beta.2 published
6. Test again ✅
7. dev → master (merge)
8. Auto: 0.2.0 published (stable)
9. Users: npm install @nussknacker/cli
```

## 📊 Status Check

```bash
# GitHub workflows status
https://github.com/YOUR_ORG/nu-cli-lab/actions

# NPM package page
https://www.npmjs.com/package/@nussknacker/cli

# Check versions
npm run check:version
```

## 🆘 Problems?

1. Check [RELEASE_WORKFLOW.md](./RELEASE_WORKFLOW.md) → Troubleshooting
2. Check GitHub Actions logs
3. Check if `NPM_TOKEN` is set (maintainers only)

---

**Ready to start?** 🚀

```bash
git checkout dev
git checkout -b feat/your-feature
# ... code ...
git commit -m "feat: your amazing feature"
git push origin feat/your-feature
# Create PR to dev → Beta release!
```

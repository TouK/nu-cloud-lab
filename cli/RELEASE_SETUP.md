# Release Setup Guide

Steps to configure automatic npm publishing.

## 1. NPM Token

Create an automation token on npmjs.com:

1. Log in to https://www.npmjs.com
2. Go to **Account Settings** → **Access Tokens**
3. Click **Generate New Token** → **Automation**
4. Copy the generated token (starts with `npm_...`)

## 2. GitHub Secrets

Add the token as a secret in the repository:

1. Open the repository on GitHub
2. Go to **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Name: `NPM_TOKEN`
5. Value: paste the token from step 1
6. Click **Add secret**

## 3. Package Scope (if using scoped package)

If publishing as `@nussknacker/cli`:

1. Ensure you have access to the `@nussknacker` organization on npm
2. Or change the name in `package.json` to unscoped (e.g., `nussknacker-cli`)

## 4. Initial Publish

Before the first automatic release, publish manually:

```bash
cd cli
npm run build
npm login  # Log in to npm
npm publish --access public  # If scoped package
```

After this, semantic-release will take over automatic publishing.

## 5. Create `dev` branch

Create a branch for beta releases:

```bash
git checkout master
git checkout -b dev
git push origin dev
```

## 6. Test Workflow

### Test Beta Release (dev branch)

```bash
git checkout dev
git checkout -b test-beta
# make some changes
git add .
git commit -m "feat: test beta release"
git push origin test-beta
# create PR and merge to dev
```

GitHub Actions should automatically:
- Build package
- Determine beta version (e.g., `0.2.0-beta.1`)
- Publish to npm with `beta` tag
- Create GitHub pre-release

Beta verification:
```bash
npm install @nussknacker/cli@beta
nu-cli --version  # Should show 0.2.0-beta.1
```

### Test Stable Release (master branch)

```bash
git checkout master
git merge dev
git push origin master
```

GitHub Actions should automatically:
- Build package
- Determine stable version (e.g., `0.2.0`)
- Publish to npm with `latest` tag
- Create GitHub release

Stable verification:
```bash
npm install @nussknacker/cli
nu-cli --version  # Should show 0.2.0
```

## 7. Verification

### After merge to `dev` (beta):
1. Check **Actions** → **Beta Release** workflow
2. Check `npm view @nussknacker/cli@beta version`
3. Check if pre-release was created on GitHub

### After merge to `master` (stable):
1. Check **Actions** → **Release** workflow
2. Check `npm view @nussknacker/cli version`
3. Check if release (not pre-release) was created on GitHub

## Troubleshooting

### "npm ERR! 403 Forbidden"
- Check if `NPM_TOKEN` is correctly set in GitHub Secrets
- Ensure the token has publishing permissions

### "npm ERR! 404 Not Found"
- Package doesn't exist on npm yet
- Execute manual publish (step 4)

### "ERELEASEBRANCHES"
- Check if the branch in `.releaserc.json` matches the main branch of the repo
- This repo uses `master` instead of `main`

### Workflow doesn't trigger
- Check if commit message is in conventional commits format
- Check **Actions** tab if workflow is enabled

## Useful Commands

```bash
# Test semantic-release locally (dry-run)
npx semantic-release --dry-run --no-ci

# Test beta release from dev branch
git checkout dev
npx semantic-release --dry-run --no-ci

# Manual publish test
npm run build
npm publish --dry-run

# Publish beta manually (if needed)
npm version prerelease --preid=beta
npm publish --tag beta

# Check published versions
npm view @nussknacker/cli versions
npm view @nussknacker/cli dist-tags

# Check if everything builds
npm ci
npm run typecheck
npm run build
```

## Workflow Overview

```
Feature branches → dev → master
                    ↓      ↓
                   beta   stable
                   0.2.0-beta.1  →  0.2.0
```

- **dev branch**: Beta releases (`0.2.0-beta.1`, `0.2.0-beta.2`, ...)
- **master branch**: Stable releases (`0.2.0`, `0.2.1`, ...)

### Installation:

- **Stable**: `npm install @nussknacker/cli`
- **Beta**: `npm install @nussknacker/cli@beta`
- **Specific**: `npm install @nussknacker/cli@0.2.0-beta.1`

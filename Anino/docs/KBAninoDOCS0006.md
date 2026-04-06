# Anino Git Workflow & Naming Conventions

This document defines naming conventions and workflow standards for **commits, pull requests (PRs), issues, and branches**. Following these conventions ensures **consistency, traceability, and clean automated changelogs**.

---

## 1. Co## 8. Quick Reference Table

| Entity | Format | Examples |
|--------|--------|----------|
| **Commit** | `<type>(<scope>): <subject>` | `feat(dialogue): add branching` |
| **PR** | `<type>/#<issue>-<description>` | `docs/5-finalize-onboarding` |
| **Issue** | `[type] Short description` | `[Bug] Fix audio sync` |
| **Branch** | `<type>/<scope>-<short-description>` | `feature/42-pause-menu` |sage Conventions

### Format

```
<type>(<scope>): <subject>
```

- **type** – nature of the change:

| Type | Description |
|------|-------------|
| `feat` | New feature |
| `fix` | Bug fix |
| `docs` | Documentation only |
| `style` | Formatting or whitespace changes, no code logic |
| `refactor` | Code changes without adding features or fixing bugs |
| `perf` | Performance improvement |
| `test` | Adding or fixing tests |
| `chore` | Maintenance, CI/CD, dependencies, scripts |

- **scope** – optional, module or area affected (e.g., `ui`, `api`, `scene`, `assets`)

- **subject** – short, imperative, lowercase description

### Examples

```
feat(api): add search endpoint
fix(ui): align header properly
docs(readme): update setup instructions
chore(ci): add commitlint GitHub Action
```

### Optional Body

Provide a detailed explanation, motivation, or references:

```
feat(scene): add dialogue system

- Added DialogueManager script
- Implemented branching dialogue tree
- Updated unit tests

Closes #42
```

---

## 2. Pull Request (PR) Naming Conventions

### PR Title Format

```
<type>/#<issue-number>-<description>
```

- **type** – nature of the change (feat, fix, docs, chore, etc.)
- **#<issue-number>** – GitHub issue number
- **description** – lowercase, hyphen-separated, concise description

**Examples:**

```
docs/5-finalize-developer-onboarding-and-guidelines
feat/42-implement-dialogue-branching
fix/15-resolve-audio-sync-issue
chore/8-setup-commitlint-workflow
```

### PR Description Template

```markdown
## Summary
Short description of what this PR does.

## Changes
- Key features or fixes implemented
- Technical decisions made
- Breaking changes, if any

## Testing
- How to test these changes
- Platforms tested on

## Related Issues
Closes #<issue_number>
```

---

## 3. Issue Naming Conventions

### Format

```
[type] Short description
```

- **type** – optional, for categorization:

| Type | Description |
|------|------------|
| `[Feature]` | New feature request |
| `[Bug]` | Bug report |
| `[Docs]` | Documentation update |
| `[Task]` | General task or maintenance |
| `[Epic]` | Large feature spanning multiple issues |

- Keep concise (~50 characters)
- Use imperative style if actionable

### Examples

```
[Feature] Add main menu scene
[Bug] Fix audio playing twice
[Docs] Update README with deployment instructions
[Task] Refactor dialogue manager
```

---

## 4. Branch Naming Conventions

### Format

```
<type>/<scope>-<short-description>
```

- **type** – purpose of the branch:

| Type | Description |
|------|-------------|
| `feature` | New features |
| `fix` | Bug fixes |
| `chore` | Maintenance, CI/CD, configuration |
| `hotfix` | Urgent fixes for production |
| `docs` | Documentation updates |

- **scope** – optional, module/component affected (`ui`, `dialogue`, `assets`, `ci`)

- **short-description** – lowercase, hyphen-separated, descriptive

### Examples

```
feature/dialogue-system
fix/ui-menu-alignment
chore/ci-commitlint-setup
hotfix/audio-playback-crash
docs/platform-setup
```

**Optional issue number prefix:**

```
feature/42-dialogue-branching
fix/15-audio-sync-issue
```

Links branch directly to **issue #42** or **#15**.

---

## 5. Commitlint Integration

The repository uses **Commitlint** to enforce commit message conventions.

### Setup (Local)

```bash
# Install commitlint
npm install --save-dev @commitlint/{cli,config-conventional}

# Create config
echo "module.exports = { extends: ['@commitlint/config-conventional'] };" > commitlint.config.js

# Install husky hooks (optional, for pre-commit checks)
npm install husky --save-dev
npx husky install
npx husky add .husky/commit-msg 'npx --no -- commitlint --edit "$1"'
```

### Invalid Commits (Blocked by CI/CD)

```bash
# ❌ Will be rejected
git commit -m "updated stuff"
git commit -m "Fix bug"

# ✅ Will be accepted
git commit -m "fix(dialogue): resolve branching logic"
git commit -m "chore(ci): add GitHub Actions workflow"
```

---

## 6. GitHub Actions Automation

### Commitlint Check (on PR)

- Enforces commit message format
- Blocks PR merge if commits violate conventions
- Provides helpful error messages

### Auto-Generated Changelog

- Parses `feat`, `fix`, `docs` commits
- Groups by type and scope
- Example:

```markdown
## Features
- **dialogue**: add branching conversations (#42)
- **ui**: implement main menu (#38)

## Bug Fixes
- **audio**: resolve playback sync (#15)

## Docs
- **setup**: add platform-specific instructions (#50)
```

---

## 7. Branch Protection Rules

Applied to `main` and `develop` branches:

✅ Require pull request reviews before merging
✅ Require commit message validation
✅ Require passing GitHub Actions (tests, linting)
✅ Restrict force pushes
✅ Dismiss stale reviews on new commits

---

## 8. Workflow Example

### Creating a New Feature

```bash
# 1. Create issue
#    Title: [Feature] Add pause menu functionality

# 2. Create branch from issue
git checkout -b feature/32-pause-menu

# 3. Make commits with proper messages
git commit -m "feat(ui): add pause menu scene"
git commit -m "feat(input): map pause key to ESC"
git commit -m "test(pause): add pause menu unit tests"

# 4. Push branch
git push origin feature/32-pause-menu

# 5. Create PR with title
#    Title: feat/32-implement-pause-menu-functionality

# 6. GitHub Actions runs automatically
#    - Commitlint validates all commits
#    - Unit tests run
#    - Code review happens

# 7. Merge PR
#    - Commits are preserved (no squash)
#    - Changelog auto-generated
```

---

## 9. Quick Reference Table

| Entity | Format | Examples |
|--------|--------|----------|
| **Commit** | `<type>(<scope>): <subject>` | `feat(dialogue): add branching` |
| **PR** | `<type>(<scope>): <short description>` | `fix(ui): align menu items` |
| **Issue** | `[type] Short description` | `[Bug] Fix audio sync` |
| **Branch** | `<type>/<scope>-<short-description>` | `feature/42-pause-menu` |

---

## 10. Tips & Best Practices

✅ **Use imperative mood** - "Add feature" not "Added feature"
✅ **Keep branch names short** - max 50 characters
✅ **Reference issues** - Use `Closes #<number>` in PR descriptions
✅ **Keep scopes consistent** - ui, dialogue, assets, ci, etc.
✅ **One feature per branch** - Easier to review and revert if needed
✅ **Rebase before merge** - Keep history clean (optional, depends on team preference)
✅ **Don't commit unfinished work** - Stage only complete changes

### Good Commit Example

```
feat(dialogue): add choice branching system

- Implemented ChoiceNode for dialogue branching
- Added support for conditional choices based on player stats
- Updated DialogueManager to traverse choice nodes
- Added unit tests for choice evaluation logic

Closes #42
```

### Bad Commit Example

```
updated stuff
```

---

## 11. Scope List (Recommended)

Use these scopes consistently across the project:

| Scope | Area |
|-------|------|
| `ui` | User interface, menus, HUD |
| `dialogue` | Dialogue system, branching, text |
| `scene` | Scene management, transitions |
| `assets` | Asset management, importing |
| `input` | Input handling, controls |
| `audio` | Audio playback, mixing |
| `test` | Unit tests, test framework |
| `ci` | GitHub Actions, automation |
| `docs` | Documentation, guides |
| `chore` | Maintenance, refactoring |

---

## Summary

Following these conventions ensures:

✅ **Consistency** - Same format across all commits
✅ **Traceability** - Easy to find related commits and PRs
✅ **Automation** - Commitlint enforces rules automatically
✅ **Clarity** - Clear intent of each change
✅ **Changelogs** - Auto-generated from commits
✅ **Team alignment** - Everyone follows same standards

For questions, refer to the [Conventional Commits specification](https://www.conventionalcommits.org/) or [Commitlint documentation](https://commitlint.js.org/).
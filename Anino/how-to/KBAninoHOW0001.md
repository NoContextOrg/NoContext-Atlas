# KBAninoHOW0001: Asset Management Using Git Submodules, Sparse Checkout, and Git LFS

## Overview

This document provides a **practical end-to-end flow** for managing game assets in the Anino Visual Novel project using:

- **Git submodules** – to link the central asset repository
- **Sparse checkout** – to pull only needed folders (`web`, `shared`)
- **Git LFS** – to handle large binary files efficiently

It replaces older patterns that cloned the entire `anino-assets` repo per game type with a **lean, stable, multi-project friendly workflow**.

- Asset repository: https://github.com/NoContextOrg/anino-assets.git
- Game repository: https://github.com/NoContextOrg/anino-visual-novel.git

---

## 1️⃣ Prerequisites

Install the following on your development machine.

### Git

```bash
# Arch Linux / EndeavourOS
sudo pacman -S git

# Ubuntu / Debian
sudo apt install git -y
```

### Git LFS

```bash
# Arch Linux / EndeavourOS
sudo pacman -S git-lfs

git lfs install
```

(For other platforms, follow https://git-lfs.github.com/)

### Godot 4.x

Install **Godot 4.x** matching the version required by `project.godot` in the game repo.

---

## 2️⃣ Clone Game Repo with Submodules

Clone the game repository and initialize submodules in one step:

```bash
git clone --recurse-submodules https://github.com/NoContextOrg/anino-visual-novel.git
cd anino-visual-novel
```

This ensures the `assets` submodule is initialized automatically if already configured in the repo.

> If the repo was cloned previously without `--recurse-submodules`, run:
>
> ```bash
> git submodule update --init --recursive
> ```

---

## 3️⃣ Add Assets Repo as a Submodule (If Not Already Present)

If the `assets/` folder is **not yet configured** as a submodule in the game repository:

```bash
git submodule add https://github.com/NoContextOrg/anino-assets.git assets
```

This makes `assets/` point to the central `anino-assets` repository.

Commit this change in the game repo:

```bash
git add .
git commit -m "chore(assets): add anino-assets as submodule"
```

---

## 4️⃣ Sparse Checkout – Only Needed Folders

To keep the working copy lightweight, only check out the folders required by the Visual Novel project:

```bash
cd assets

git sparse-checkout init --cone
git sparse-checkout set web shared

cd ..
```

This will:

- Pull only `/web` and `/shared` from the asset repository
- Avoid downloading unrelated folders like `ar/`, `rpg/`, `vr/`

> This is the **recommended setup** for the Anino Visual Novel project.

---

## 5️⃣ Install Git LFS Assets

After configuring sparse checkout, pull all Git LFS–tracked files:

```bash
cd assets
git lfs pull
cd ..
```

This ensures textures, audio, and other large binary assets are fully available locally.

> If you see `.gitattributes` entries for file types but only pointer files locally, re-run `git lfs pull`.

---

## 6️⃣ Lock Assets to a Stable Version (Optional but Recommended)

To prevent breaking changes from upstream assets, lock your game repo to a **specific stable tag** or commit in `anino-assets`.

```bash
cd assets
git fetch --tags

git checkout v1.0.0   # Example stable tag

cd ..
git add assets
git commit -m "chore(assets): lock assets to v1.0.0"
```

Push to origin:

```bash
git push
```

The game repository is now pinned to a stable asset snapshot.

---

## 7️⃣ Daily Development Workflow

Use this flow when starting work each day.

### Step 1 – Pull Latest Game Code

```bash
git pull
```

### Step 2 – Update Submodules

```bash
git submodule update --init --recursive
```

### Step 3 – Pull Latest Assets (If Needed)

Only if you want to move to a newer asset snapshot:

```bash
cd assets

git pull origin main      # Or checkout a new tag, e.g. v1.0.1
git lfs pull

cd ..
git add assets
git commit -m "chore(assets): update assets to latest main"
git push
```

> If you want **strict stability**, skip `git pull origin main` and stay pinned to a tag.

---

## 8️⃣ Adding or Updating Assets (For Asset Maintainers)

Only developers with write access to `anino-assets` should modify assets directly.

### Step 1 – Update the Asset Repository

```bash
cd assets

# Add or update assets in web/ or shared/
# e.g. add new sprite, audio, background

git add .
git commit -m "feat(assets): add new background for chapter 3"
git push origin main
```

### Step 2 – Update Game Repo Pointer

```bash
cd ..

git add assets
git commit -m "chore(assets): update submodule to latest main"
git push
```

The game repo now references the new asset commit.

---

## 9️⃣ Commands Cheat Sheet

| Task | Command |
|------|---------|
| Clone game repo with assets | `git clone --recurse-submodules <repo>` |
| Initialize submodules | `git submodule update --init --recursive` |
| Sparse checkout `web` + `shared` | `cd assets && git sparse-checkout init --cone && git sparse-checkout set web shared` |
| Pull latest LFS assets | `cd assets && git lfs pull` |
| Pull latest asset updates | `cd assets && git pull origin main && git lfs pull && cd .. && git add assets && git commit -m "chore(assets): update assets"` |
| Lock assets to tag | `cd assets && git checkout v1.0.0 && cd .. && git add assets && git commit -m "chore(assets): lock assets"` |

---

## 🔟 Notes & Best Practices

1. **Do not `.gitignore` the `assets/` folder** – It must be tracked as a submodule.
2. **Always use Git LFS** for large binary files (textures, audio, video, PSDs).
3. **Use sparse checkout** per project to reduce disk usage and clone time.
4. **Tag assets for stability** and lock game repos to specific tags for releases.
5. **Avoid editing submodule content directly from game repos** – Make changes in `anino-assets` and then update the submodule pointer.
6. **Document asset versions in release notes** – Note which asset tag/commit each game release uses.
7. **Use semantic versioning for tags** in `anino-assets` (e.g., `v1.0.0`, `v1.1.0`).
8. **Keep asset changes atomic** – Small, focused commits improve traceability.
9. **Coordinate asset updates with game code changes** – Especially when asset structure changes (paths, filenames).

---

## Legacy CI/CD Notes (For Asset Repository Maintainers)

The `anino-assets` repository includes CI/CD workflows that:

- Validate required directories (`web/`, `shared/`, etc.)
- Ensure large files are tracked by Git LFS
- Generate `asset-manifest.txt` for auditing and releases

These workflows live in `.github/workflows/` of **anino-assets**, not the game repo.

Game projects (like `anino-visual-novel`) typically:

- Treat `assets/` as a read-only submodule in day-to-day dev
- Only update the submodule pointer when new validated assets are ready

---

## Troubleshooting

### LFS Pointers Instead of Real Files

If you see small text files instead of actual assets in `assets/`:

```bash
cd assets
git lfs install
git lfs pull
```

### Submodule Not Updating

If `assets/` seems stuck on an old commit:

```bash
cd assets
git fetch

git status       # Check current commit
git log --oneline -5
```

Ensure the game repo updated the submodule pointer and that you ran:

```bash
git submodule update --init --recursive
```

### Sparse Checkout Misconfigured

If unwanted folders appear or expected ones are missing:

```bash
cd assets

git sparse-checkout init --cone
git sparse-checkout set web shared

git pull
```

---

## References

- Git Submodules: https://git-scm.com/book/en/v2/Git-Tools-Submodules
- Git LFS: https://git-lfs.github.com/
- Sparse Checkout: https://git-scm.com/docs/git-sparse-checkout
- Anino Assets Repo: https://github.com/NoContextOrg/anino-assets.git
- Anino Visual Novel Repo: https://github.com/NoContextOrg/anino-visual-novel.git

---

*End of KBAninoHOW0001*

Last Updated: April 6, 2026

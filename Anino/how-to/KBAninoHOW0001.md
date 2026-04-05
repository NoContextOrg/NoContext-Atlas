---

# KBAninoHOW0001: Asset Management Using Git Submodules and Git LFS

## Overview

This document provides a formalized guide for managing game assets in the Anino project using **Git submodules** and **Git LFS**. It serves as a knowledge base for developers to efficiently load, update, and maintain game assets across multiple game types (RPG, VR, AR, Web) during local development.

The architecture separates the **asset repository**, which is stored in a dedicated repository with Git LFS support, from the main project repository. This allows large binary assets to be managed efficiently while keeping the main project lightweight.

* Asset repository: [https://github.com/NoContextOrg/anino-assets.git](https://github.com/NoContextOrg/anino-assets.git)
* Main project repository: Contains code and references submodules for assets.

---

## Repository Structure

The `anino-assets` repository is organized to support multiple game types and shared resources:

```
anino-assets/
├─ ar/           # Assets specific to AR games
├─ rpg/          # Assets specific to RPG games
├─ vr/           # Assets specific to VR games
├─ web/          # Assets specific to Web games
├─ shared/       # Assets shared across all game types
├─ metadata/     # Metadata describing assets
├─ LICENSE
└─ README.md
```

**Key Notes:**

* Game-specific folders (`ar`, `rpg`, `vr`, `web`) allow selective submodule inclusion.
* `shared/` contains common assets utilized by multiple game types.
* `metadata/` provides descriptive information for asset management.
* Git LFS is used to store large files efficiently (e.g., `.png`, `.wav`, `.ogg`, `.psd`).

---

## 1. Adding Assets as a Submodule

To integrate assets into a local game project, follow these steps:

1. Navigate to the project root:

```bash
cd /path/to/your/game-project
```

2. Add the submodule pointing to the asset repository, specifying only the necessary folder for your game type:

```bash
git submodule add -b main --depth 1 https://github.com/NoContextOrg/anino-assets.git assets/rpg
```

**Parameters Explained:**

* `-b main` – Ensures the submodule tracks the `main` branch.
* `--depth 1` – Performs a shallow clone to reduce local storage usage.
* `assets/rpg` – Local path in the project where the submodule will reside.

> Repeat for additional game types as required, e.g., `assets/vr` for VR projects.

> All large assets in this repository are stored with Git LFS for performance and storage efficiency.

---

## 2. Updating Submodules

To synchronize your submodules with the latest changes in the asset repository:

```bash
git submodule update --remote --merge
```

**Explanation:**

* Fetches the latest commits from the remote submodule repository.
* `--merge` merges changes into the local submodule without overwriting existing work.

> Recommended to run this periodically to ensure local projects are up-to-date with shared assets.

> Ensure Git LFS is installed to correctly fetch large binary files.

---

## 3. Loading Assets in the Game

Assets should be referenced relative to the submodule path in the project. Examples per game type:

### RPG Game Example

```
game-project/
├─ assets/rpg/characters/
├─ assets/rpg/environment/
```

```gdscript
# Godot example
var character_texture = load("res://assets/rpg/characters/hero.png")
```

### VR, AR, and Web Games

Similarly, mount and reference assets from the respective submodule folders:

```
assets/vr/... 
assets/ar/... 
assets/web/...
```

```gdscript
var vr_environment = load("res://assets/vr/scene1/environment.tscn")
```

> Developers should maintain consistent folder structure to simplify asset referencing.

---

## 4. Best Practices

1. **Minimal Submodule Inclusion:** Only clone the folders required for the current game type to optimize project size.
2. **Shared Assets Management:** Include the `shared/` folder when multiple game types depend on common assets.
3. **Submodule Editing:** Avoid making direct changes in submodules. Update the central asset repository and propagate updates.
4. **Git LFS Awareness:** Ensure all team members have Git LFS installed to handle large binary files correctly.
5. **Git Ignore Local Files:** Exclude any local caches or generated files from the submodule using `.gitignore`.
6. **Version Pinning:** Consider pinning submodules to a specific commit for stable builds.

---

## 5. Removing a Submodule

To completely remove a submodule from your project:

```bash
git submodule deinit -f assets/rpg
git rm -f assets/rpg
rm -rf .git/modules/assets/rpg
```

This removes the submodule and clears its metadata from the repository.

---

## 6. References

* [Git Submodules Documentation](https://git-scm.com/book/en/v2/Git-Tools-Submodules)
* [Git LFS Documentation](https://git-lfs.github.com/)
* Anino Asset Repository: [https://github.com/NoContextOrg/anino-assets.git](https://github.com/NoContextOrg/anino-assets.git)

---

*End of KBAninoHOW0001*

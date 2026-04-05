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
├─ .github/
│  └─ workflows/ # CI/CD automation workflows
├─ LICENSE
└─ README.md
```

**Key Notes:**

* Game-specific folders (`ar`, `rpg`, `vr`, `web`) allow selective submodule inclusion.
* `shared/` contains common assets utilized by multiple game types.
* `metadata/` provides descriptive information for asset management.
* `.github/workflows/` contains GitHub Actions for automated validation and releases.
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

## 4. CI/CD Automation with GitHub Actions

The asset repository includes automated workflows to ensure asset integrity and manage releases. These workflows are defined in `.github/workflows/`.

### 4.1 Assets CI Workflow (`assets-ci.yml`)

**Purpose:** Validates asset repository integrity on every push and pull request to `main`.

**Triggers:**
* Push to `main` branch
* Pull requests targeting `main` branch

**Validation Steps:**
1. Checks out repository with Git LFS enabled
2. Runs `git lfs install` and `git lfs pull` to fetch all large binary files
3. Validates that all required folders exist:
   - `ar/`, `rpg/`, `vr/`, `web/`, `shared/`, `metadata/`
   - Fails if any folder is missing
4. Scans for files larger than 5MB that are NOT tracked by Git LFS
   - Large untracked files indicate misconfiguration and cause workflow failure
5. Generates an `asset-manifest.txt` listing all repository files with timestamps
6. Uploads manifest as a workflow artifact for auditing

**Branch Protection Requirements:**
```
- Require pull request reviews (1 approval minimum)
- Require this CI workflow to pass before merging
- Require conversation resolution before merging
- Restrict who can push to matching branches
- Do not allow bypassing above settings
- Disable force push and deletion
```

### 4.2 Release Workflow (`release.yml`)

**Purpose:** Creates GitHub Releases and publishes asset manifests on version tags or manual trigger.

**Triggers:**
* Tags matching `v*` pattern (e.g., `v1.0.0`, `v1.1.0-beta`)
* Manual trigger via `workflow_dispatch`

**Release Steps:**
1. Checks out repository with Git LFS at tagged commit
2. Validates tag follows semantic versioning (`v*.*.*`)
3. Generates `asset-manifest.txt` including:
   - Release tag and commit SHA
   - Complete file listing with sizes
   - Generation timestamp
4. Creates GitHub Release with:
   - Auto-generated release notes
   - Asset manifest attached as release asset
   - Automatic prerelease detection (tags with `-` suffix)
5. Provides release summary with direct link to GitHub

**Workflow Dispatch Parameters:**
- `tag_name` (optional): Manually specify release tag name

**Branch Protection Requirements:**
Same as Assets CI workflow to ensure only validated code reaches production tags.

### 4.3 Asset Manifest

The `asset-manifest.txt` file is generated by both CI and Release workflows. It serves as:
* An audit trail of repository contents at specific points in time
* Documentation for consuming projects tracking submodule versions
* A checksum-like validation artifact (though not cryptographically signed)

**Manifest Contents:**
```
# Asset Manifest
# Generated: 2026-04-06 14:30:00 UTC
# Repository: NoContextOrg/anino-assets
# Commit: abc1234567890...

## Directory Structure
ar/
ar/audio/
ar/models/
...

## File Listing
ar/audio/ambient.ogg (2048576 bytes)
...
```

---

## 5. Best Practices

1. **Minimal Submodule Inclusion:** Only clone the folders required for the current game type to optimize project size.
2. **Shared Assets Management:** Include the `shared/` folder when multiple game types depend on common assets.
3. **Submodule Editing:** Avoid making direct changes in submodules. Update the central asset repository and propagate updates.
4. **Git LFS Awareness:** Ensure all team members have Git LFS installed to handle large binary files correctly.
5. **Git Ignore Local Files:** Exclude any local caches or generated files from the submodule using `.gitignore`.
6. **Version Pinning:** Consider pinning submodules to a specific commit for stable builds.
7. **CI/CD Trust:** Always ensure the Assets CI workflow passes before merging to `main`.
8. **Release Tagging:** Use semantic versioning for all release tags to maintain clarity on asset versions.
9. **Artifact Retention:** Asset manifests are retained for 30 days; download them if long-term records are needed.

---

## 6. Troubleshooting

### Large Files Not Tracked by Git LFS

If the Assets CI workflow fails with "untracked large files" error:

1. Verify `.gitattributes` includes patterns for your file types
2. Remove the file from Git history:
   ```bash
   git rm --cached <large-file>
   git add .gitattributes
   git commit -m "Configure Git LFS for <file-type>"
   ```
3. Re-add the file (will now be tracked by LFS)

### Missing Required Folders

If workflow fails due to missing folders:

1. Ensure all folders (`ar/`, `rpg/`, `vr/`, `web/`, `shared/`, `metadata/`) exist at repository root
2. Create placeholder files if folders are empty:
   ```bash
   touch ar/.gitkeep
   touch rpg/.gitkeep
   touch vr/.gitkeep
   touch web/.gitkeep
   touch shared/.gitkeep
   touch metadata/.gitkeep
   ```

### Git LFS Not Pulling Files

If LFS files appear as pointers (not actual content):

1. Ensure Git LFS is installed: `git lfs install`
2. Pull LFS files: `git lfs pull`
3. Verify LFS tracking: `git lfs ls-files`

---

## 7. References

* [Git Submodules Documentation](https://git-scm.com/book/en/v2/Git-Tools-Submodules)
* [Git LFS Documentation](https://git-lfs.github.com/)
* [GitHub Actions Documentation](https://docs.github.com/en/actions)
* [Semantic Versioning](https://semver.org/)
* Anino Asset Repository: [https://github.com/NoContextOrg/anino-assets.git](https://github.com/NoContextOrg/anino-assets.git)

---

*End of KBAninoHOW0001*

Last Updated: April 6, 2026
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
├─ .github/
│  └─ workflows/ # CI/CD automation workflows
├─ LICENSE
└─ README.md
```

**Key Notes:**

* Game-specific folders (`ar`, `rpg`, `vr`, `web`) allow selective submodule inclusion.
* `shared/` contains common assets utilized by multiple game types.
* `metadata/` provides descriptive information for asset management.
* `.github/workflows/` contains GitHub Actions for automated validation and releases.
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

## 4. CI/CD Automation with GitHub Actions

The asset repository includes automated workflows to ensure asset integrity and manage releases. These workflows are defined in `.github/workflows/`.

### 4.1 Assets CI Workflow (`assets-ci.yml`)

**Purpose:** Validates asset repository integrity on every push and pull request to `main`.

**Triggers:**
* Push to `main` branch
* Pull requests targeting `main` branch

**Validation Steps:**
1. Checks out repository with Git LFS enabled
2. Runs `git lfs install` and `git lfs pull` to fetch all large binary files
3. Validates that all required folders exist:
   - `ar/`, `rpg/`, `vr/`, `web/`, `shared/`, `metadata/`
   - Fails if any folder is missing
4. Scans for files larger than 5MB that are NOT tracked by Git LFS
   - Large untracked files indicate misconfiguration and cause workflow failure
5. Generates an `asset-manifest.txt` listing all repository files with timestamps
6. Uploads manifest as a workflow artifact for auditing

**Branch Protection Requirements:**
```
- Require pull request reviews (1 approval minimum)
- Require this CI workflow to pass before merging
- Require conversation resolution before merging
- Restrict who can push to matching branches
- Do not allow bypassing above settings
- Disable force push and deletion
```

### 4.2 Release Workflow (`release.yml`)

**Purpose:** Creates GitHub Releases and publishes asset manifests on version tags or manual trigger.

**Triggers:**
* Tags matching `v*` pattern (e.g., `v1.0.0`, `v1.1.0-beta`)
* Manual trigger via `workflow_dispatch`

**Release Steps:**
1. Checks out repository with Git LFS at tagged commit
2. Validates tag follows semantic versioning (`v*.*.*`)
3. Generates `asset-manifest.txt` including:
   - Release tag and commit SHA
   - Complete file listing with sizes
   - Generation timestamp
4. Creates GitHub Release with:
   - Auto-generated release notes
   - Asset manifest attached as release asset
   - Automatic prerelease detection (tags with `-` suffix)
5. Provides release summary with direct link to GitHub

**Workflow Dispatch Parameters:**
- `tag_name` (optional): Manually specify release tag name

**Branch Protection Requirements:**
Same as Assets CI workflow to ensure only validated code reaches production tags.

### 4.3 Asset Manifest

The `asset-manifest.txt` file is generated by both CI and Release workflows. It serves as:
* An audit trail of repository contents at specific points in time
* Documentation for consuming projects tracking submodule versions
* A checksum-like validation artifact (though not cryptographically signed)

**Manifest Contents:**
```
# Asset Manifest
# Generated: 2026-04-06 14:30:00 UTC
# Repository: NoContextOrg/anino-assets
# Commit: abc1234567890...

## Directory Structure
ar/
ar/audio/
ar/models/
...

## File Listing
ar/audio/ambient.ogg (2048576 bytes)
...
```

---

## 5. Best Practices

1. **Minimal Submodule Inclusion:** Only clone the folders required for the current game type to optimize project size.
2. **Shared Assets Management:** Include the `shared/` folder when multiple game types depend on common assets.
3. **Submodule Editing:** Avoid making direct changes in submodules. Update the central asset repository and propagate updates.
4. **Git LFS Awareness:** Ensure all team members have Git LFS installed to handle large binary files correctly.
5. **Git Ignore Local Files:** Exclude any local caches or generated files from the submodule using `.gitignore`.
6. **Version Pinning:** Consider pinning submodules to a specific commit for stable builds.
7. **CI/CD Trust:** Always ensure the Assets CI workflow passes before merging to `main`.
8. **Release Tagging:** Use semantic versioning for all release tags to maintain clarity on asset versions.
9. **Artifact Retention:** Asset manifests are retained for 30 days; download them if long-term records are needed.

---

## 6. Troubleshooting

### Large Files Not Tracked by Git LFS

If the Assets CI workflow fails with "untracked large files" error:

1. Verify `.gitattributes` includes patterns for your file types
2. Remove the file from Git history:
   ```bash
   git rm --cached <large-file>
   git add .gitattributes
   git commit -m "Configure Git LFS for <file-type>"
   ```
3. Re-add the file (will now be tracked by LFS)

### Missing Required Folders

If workflow fails due to missing folders:

1. Ensure all folders (`ar/`, `rpg/`, `vr/`, `web/`, `shared/`, `metadata/`) exist at repository root
2. Create placeholder files if folders are empty:
   ```bash
   touch ar/.gitkeep
   touch rpg/.gitkeep
   touch vr/.gitkeep
   touch web/.gitkeep
   touch shared/.gitkeep
   touch metadata/.gitkeep
   ```

### Git LFS Not Pulling Files

If LFS files appear as pointers (not actual content):

1. Ensure Git LFS is installed: `git lfs install`
2. Pull LFS files: `git lfs pull`
3. Verify LFS tracking: `git lfs ls-files`

---

## 7. References

* [Git Submodules Documentation](https://git-scm.com/book/en/v2/Git-Tools-Submodules)
* [Git LFS Documentation](https://git-lfs.github.com/)
* [GitHub Actions Documentation](https://docs.github.com/en/actions)
* [Semantic Versioning](https://semver.org/)
* Anino Asset Repository: [https://github.com/NoContextOrg/anino-assets.git](https://github.com/NoContextOrg/anino-assets.git)

---

*End of KBAninoHOW0001*

Last Updated: April 6, 2026

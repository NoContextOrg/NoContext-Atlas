# Anino Visual Novel – Multi-Platform Setup Guide (Onboarding)

## 1. Prerequisites (All Platforms)

| Tool | Purpose |
|------|---------|
| Godot 4.x | Engine |
| Git | Version control |
| Node.js + npm | Commitlint / GitHub workflows |
| GitHub CLI (optional) | Repo management |
| Build dependencies (Linux/macOS) | Needed for headless exports & Linux builds |
| AWS CLI + EC2 access | Deploy HTML5 build to EC2 |
| Nginx / Apache (on EC2) | Serve static HTML5 builds |
| SSL Certificate (ACM / LetsEncrypt) | HTTPS |

---

## 2. Platform-Specific Setup

### 2.1 Arch Linux / EndeavourOS

```bash
# Update system
sudo pacman -Syu

# Install all dependencies in one command
sudo pacman -S git nodejs npm mono glibc libx11 mesa glu xvfb github-cli aws-cli

# Godot 4.x via AUR
yay -S godot
```

---

### 2.2 Ubuntu / Debian

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install all dependencies
sudo apt install git nodejs npm mono-complete libglu1-mesa-dev xvfb gh awscli -y

# Godot 4.x (via snap)
sudo snap install godot --classic
```

> On Debian, package names might slightly differ (`mono-complete`, `libglu1-mesa-dev`, etc.).

---

### 2.3 Windows 10/11

- **Godot 4.x** → https://godotengine.org/download/windows
- **Git** → https://git-scm.com/download/win
- **Node.js** → https://nodejs.org
- **GitHub CLI (optional)** → https://cli.github.com
- **AWS CLI** → https://aws.amazon.com/cli/

Linux exports require Linux export templates.

---

### 2.4 macOS (Intel / Apple Silicon)

```bash
# Install Homebrew if not installed
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install all dependencies
brew install git node gh awscli mono xvfb

# Godot 4.x
brew install --cask godot
```

---

## 3. Create Godot Project (All Platforms)

1. Open Godot 4.x → click **New Project**
2. **Project Name:** `anino-visual-novel`
3. **Project Path:** e.g., `~/Projects/anino-visual-novel`
4. Click **Create & Edit** → Godot generates `project.godot`

---

## 4. Configure Display & Input

**Display Settings:**
- Go to **Project → Project Settings → Display → Window**
- Width: `1920`
- Height: `1080`
- Stretch Mode: `2d (canvas_items)`
- Stretch Aspect: `keep`

**Input Map:**
- Go to **Project → Project Settings → Input Map**
- Add action: `ui_accept`
- Bind: **Spacebar** + **Left Mouse Button**

---

## 5. Folder Structure

```
/anino-visual-novel
  /scenes         # All .tscn scene files
  /scripts        # All .gd scripts
  /ui             # UI scenes and elements
  /assets         # Central assets submodule (web + shared only)
  project.godot
```

---

## 6. Add Central Assets Submodule (Web + Shared Only)

```bash
git submodule add -b main https://github.com/NoContextOrg/anino-assets.git assets
cd assets
git sparse-checkout init --cone
git sparse-checkout set web shared
cd ..
git add assets
git commit -m "chore: add assets submodule (web + shared only)"
```

**Notes:**

- Locked at a commit → reproducible builds
- Only `web` + `shared` folders included → smaller downloads
- Manual updates required for stability

---

## 7. Main Scene Setup

1. Create a new scene → root node: **Control**
2. Add children nodes:
   - **TextureRect** → background placeholder
   - **Label** → dialogue placeholder
3. Attach script to root:

```gdscript
extends Control

func _ready():
    print("VN Ready, assets loaded")
```

4. Set main scene: **Project Settings → Run → Main Scene → scenes/main.tscn**

---

## 8. Git Initialization

```bash
git init
git add .
git commit -m "chore(engine): initialize project settings and display #6"
git branch -M main
git remote add origin <repo-url>
git push -u origin main
```

---

## 9. GitHub Actions – Commitlint Workflow (Chore #2)

**File:** `.github/workflows/commitlint.yml`

```yaml
name: Commitlint

on:
  pull_request:
    types: [opened, edited, reopened, synchronize]

jobs:
  commitlint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with: { node-version: '18' }
      - run: npm install --save-dev @commitlint/{cli,config-conventional}
      - run: npx commitlint --from=$(git merge-base origin/main HEAD) --to=HEAD
```

Enforces Conventional Commits format on all PRs.

---

## 10. GitHub Actions – GUT Unit Testing Workflow (Chore #3)

**File:** `.github/workflows/gut_tests.yml`

```yaml
name: GUT Tests

on:
  pull_request:

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
        with:
          submodules: true
      - uses: abarichello/godot-ci@v2
        with: { godot-version: 4.3.2 }
      - run: godot -s addons/gut/gut_cmdln.gd --headless --export "Linux/X11" --run-tests
```

**Notes:**

- Runs Godot GUT tests headless
- Linux / macOS → requires `mono` + `Xvfb` installed
- Windows → runs normally in Godot editor

---

## 11. GitHub Actions – CI/CD Build + Deploy to EC2 (Chore #4)

**File:** `.github/workflows/ci_cd_export.yml`

```yaml
name: Godot Export + EC2 Deploy

on:
  push:
    branches: [ main ]

jobs:
  export-deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout repo
        uses: actions/checkout@v3
        with:
          submodules: true
          fetch-depth: 0

      - name: Sparse checkout assets
        run: |
          cd assets
          git sparse-checkout init --cone
          git sparse-checkout set web shared
          cd ..

      - name: Setup Godot
        uses: firebelley/setup-godot@v2
        with: { godot-version: 4.3.2 }

      - name: Export Windows Build
        run: godot --export "Windows Desktop" build/windows/anino_vn.exe

      - name: Export Linux Build
        run: godot --export "Linux/X11" build/linux/anino_vn.x86_64

      - name: Export HTML5 Build
        run: godot --export "HTML5" build/web/

      - name: Deploy HTML5 to EC2
        uses: easingthemes/ssh-deploy@main
        with:
          ssh-private-key: ${{ secrets.EC2_SSH_KEY }}
          remote-user: ec2-user
          server-ip: ${{ secrets.EC2_IP }}
          local-path: build/web/
          remote-path: /var/www/anino/
          pre-deploy-command: sudo systemctl stop nginx
          post-deploy-command: sudo systemctl start nginx

      - name: Upload Artifacts
        uses: actions/upload-artifact@v3
        with:
          name: alpha-builds
          path: build/
```

**Key Notes:**

- Sparse checkout ensures only `web` + `shared` assets are included
- Builds for Linux, Windows, and HTML5
- **Automatically deploys HTML5 to EC2** via SSH
- Requires GitHub Secrets: `EC2_SSH_KEY`, `EC2_IP`
- Pre/post-deploy commands restart Nginx

**Setup GitHub Secrets:**

1. Go to **Repository → Settings → Secrets and variables → Actions**
2. Add `EC2_SSH_KEY` - Your EC2 private key (PEM format)
3. Add `EC2_IP` - Your EC2 instance public IP

---

## 12. Update Assets Submodule

When the central assets repo updates:

```bash
cd assets
git fetch origin main
git checkout origin/main
git sparse-checkout init --cone
git sparse-checkout set web shared
cd ..
git add assets
git commit -m "chore: update assets submodule to latest main (web + shared)"
git push origin main
```

Next CI/CD run uses updated assets automatically.

---

## 13. Local Build Commands

| Platform | Command / Export |
|----------|------------------|
| **Linux** | Project → Export → Linux/X11 → `build/linux/anino_vn.x86_64` |
| **Windows** | Project → Export → Windows Desktop → `build/windows/anino_vn.exe` |
| **HTML5** | Project → Export → HTML5 → `build/web/` |

CI/CD automatically handles all exports on merge to main.

---

## 14. Build Verification

- **Local:** Open Godot → Play → Check output for: `"VN Ready, assets loaded"`
- **PR:** Verify Commitlint + GUT Tests pass automatically
- **Merge:** Check GitHub Actions for generated Windows/Linux/HTML5 artifacts → HTML5 deployed to EC2

---

## 15. EC2 Hosting Setup (Initial Configuration)

### Launch EC2 Instance

1. Go to **AWS Console → EC2**
2. Click **Launch Instance**
3. Select **Ubuntu Server 22.04 LTS** (recommended)
4. Choose instance type: `t2.micro` (free tier eligible)
5. Configure security group: Allow HTTP (80), HTTPS (443), SSH (22)
6. Download and save the `.pem` key file

### Install Nginx on EC2

```bash
# Connect via SSH
ssh -i your-key.pem ec2-user@<EC2-IP>

# Update system
sudo apt update && sudo apt upgrade -y

# Install Nginx
sudo apt install nginx -y

# Enable and start Nginx
sudo systemctl enable nginx
sudo systemctl start nginx

# Allow Nginx through firewall
sudo ufw allow 'Nginx Full'
```

### Configure Nginx Site

```bash
# Create site configuration
sudo nano /etc/nginx/sites-available/anino
```

Add the following content:

```nginx
server {
    listen 80;
    server_name vn.example.com;
    root /var/www/anino;

    index index.html;

    location / {
        try_files $uri /index.html;
    }
}
```

Enable the site:

```bash
sudo ln -s /etc/nginx/sites-available/anino /etc/nginx/sites-enabled/
sudo systemctl restart nginx
```

### Install SSL Certificate (Let's Encrypt)

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Get SSL certificate (auto-renew enabled)
sudo certbot --nginx -d vn.example.com

# Verify auto-renewal
sudo systemctl enable certbot.timer
```

### Create Deployment Directory

```bash
# Create directory
sudo mkdir -p /var/www/anino

# Set permissions
sudo chown -R ec2-user:ec2-user /var/www/anino
sudo chmod -R 755 /var/www/anino
```

### Test SSH Deploy from GitHub Actions

In your GitHub repository:

1. Go to **Settings → Secrets and variables → Actions**
2. Click **New repository secret**
3. Add `EC2_SSH_KEY` - paste contents of your `.pem` file
4. Add `EC2_IP` - your EC2 instance public IP

Test by pushing to main → workflow will deploy automatically.

---

## 16. Git Ignore

**File:** `.gitignore`

```
.import/
.export/
.godot/
```

---

## 17. Commit & Push Example

```bash
git add .
git commit -m "chore(engine): initialize project settings and display #6"
git commit -m "chore(actions): implement commitlint #2"
git commit -m "chore(actions): build automated GUT testing workflow #3"
git commit -m "chore(actions): setup automated export workflow with fixed assets #4"
git push origin main
```

---

## Summary

This multi-platform guide ensures:

✅ **Cross-platform setup** - Arch, Ubuntu, Debian, Windows, macOS
✅ **Godot 4.x configuration** - Display, input, and scene setup
✅ **Git submodule integration** - Assets locked & sparse checkout
✅ **GitHub Actions CI/CD** - Commitlint, GUT tests, multi-platform builds
✅ **Multi-platform exports** - Linux, Windows, HTML5 ready
✅ **Reproducible builds** - Fixed assets commit
✅ **Scalable EC2 deployment** - Automated HTML5 deployment
✅ **SSL/HTTPS enabled** - Let's Encrypt via Certbot
✅ **Global accessibility** - VN accessible worldwide via EC2 + Nginx

### Key Highlights:

- **Submodule includes only web + shared** → minimal footprint
- **Manual updates required** → prevents accidental breaking changes
- **CI/CD builds all platforms** → unified GitHub Actions workflow
- **Automated EC2 deployment** → HTML5 build deployed on every merge
- **Platform-agnostic project setup** → same steps across all OSes
- **Headless testing support** → Linux/macOS with `mono` + `Xvfb`
- **Local native builds** → no cross-compilation needed
- **Production-ready infrastructure** → Nginx + SSL + free tier eligible

For questions or updates, refer to the [Anino Assets Repository](https://github.com/NoContextOrg/anino-assets) or [Godot Documentation](https://docs.godotengine.org/).
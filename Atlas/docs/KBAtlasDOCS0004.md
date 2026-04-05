---
title: Atlas — Deployment & Operations Guide
project: Atlas
category: documentation
tags: [deployment, github-pages, automation, operations, maintenance]
status: approved
last_updated: 2026-03-29
---

# Atlas — Deployment & Operations Guide

**Repository:** https://github.com/NoContextOrg/NoContext-Atlas.git

Complete guide to deploying Atlas to GitHub Pages with automated CI/CD, monitoring, and maintenance.

---

## Overview

Atlas deployment is **fully automated** with GitHub Actions:

- ✅ Auto-regenerates search index on every push
- ✅ Commits changes automatically
- ✅ Deploys to GitHub Pages in < 2 minutes
- ✅ Zero manual intervention needed
- ✅ Scalable to thousands of articles

---

## Prerequisites for Deployment

### Required

- ✅ GitHub repository created
- ✅ Repository on `main` or `master` branch
- ✅ `generate-index.js` in repository root
- ✅ `search/` directory with `index.html` and `viewer.html`
- ✅ Markdown files in repository

### Optional

- GitHub Actions knowledge (not required!)
- Custom domain (for branded URL)

---

## Initial Setup (One-Time)

### Step 1: Enable GitHub Pages

1. Go to your repository on GitHub
2. Click **Settings** → **Pages**
3. Under "Source", select:
   - **Deploy from a branch**
   - Branch: **main** (or master)
   - Folder: **/ (root)**
4. Click **Save**

**Result:** GitHub Pages is now enabled for your repository.

### Step 2: Verify Workflow File

Check that `.github/workflows/deploy.yml` exists in your repository:

```bash
ls -la .github/workflows/deploy.yml
```

If missing, create it with the automation workflow.

### Step 3: First Deployment

```bash
# Commit all files
git add .
git commit -m "feat: add automated KB deployment"

# Push to trigger deployment
git push origin main
```

### Step 4: Monitor First Deployment

1. Go to your repository on GitHub
2. Click **Actions** tab
3. Watch "Deploy to GitHub Pages" workflow
4. Wait for ✅ green checkmark (usually 2-3 minutes)

### Step 5: Access Your Site

After successful deployment:

```
https://<username>.github.io/<repository-name>/search/
```

**Example:**
```
https://NoContextOrg.github.io/NoContext-Atlas/search/
```

The exact URL is shown in the workflow summary.

---

## How Automated Deployment Works

### The Workflow Pipeline

```
You push commit
       ↓
GitHub detects push
       ↓
Workflow triggers
       ↓
Node.js environment starts
       ↓
Runs: node generate-index.js
       ↓
Regenerates search/index.json
       ↓
Commits changes to repository
       ↓
Uploads to GitHub Pages
       ↓
Site goes live (2-3 minutes)
```

### Workflow Configuration

**File:** `.github/workflows/deploy.yml`

**Key triggers:**
- ✅ Push to `main` or `master`
- ✅ Changes to `.md` files
- ✅ Changes to `generate-index.js`
- ✅ Changes to search files
- ✅ Manual trigger via Actions tab

**Automatic actions:**
1. Regenerates `search/index.json`
2. Commits if index changed
3. Deploys to GitHub Pages
4. Sends summary

---

## Daily Operations

### Adding New KB Articles

Typical workflow for adding articles:

```bash
# 1. Create article in correct folder
mkdir -p kb/ProjectName/category
nano kb/ProjectName/category/KBProjectNameCATEGORY0001.md

# 2. Add frontmatter and content
# 3. Save file

# 4. Commit and push
git add kb/ProjectName/category/KBProjectNameCATEGORY0001.md
git commit -m "docs: add new KB article"
git push origin main

# 5. GitHub Actions automatically:
#    - Regenerates index
#    - Commits changes
#    - Deploys to GitHub Pages
#    - Live within 2-3 minutes
```

**That's it!** No manual index generation needed.

### Updating Existing Articles

```bash
# 1. Edit article
nano kb/ProjectName/category/KBProjectNameCATEGORY0001.md

# 2. Update last_updated date in frontmatter

# 3. Commit and push
git add kb/ProjectName/category/KBProjectNameCATEGORY0001.md
git commit -m "docs: update KB article - fix typo"
git push origin main

# 4. Automatic deployment
```

### Testing Locally Before Pushing

```bash
# 1. Make changes locally
nano kb/ProjectName/category/KBProjectNameCATEGORY0001.md

# 2. Regenerate index
node generate-index.js

# 3. Start local server
python -m http.server 8000

# 4. Test at http://localhost:8000/search/

# 5. If good, commit and push
git add .
git commit -m "docs: add KB article"
git push origin main
```

---

## Monitoring Deployments

### Check Deployment Status

**Via GitHub UI:**
1. Go to **Actions** tab
2. See workflow runs
3. Click run to see details
4. Green ✅ = Success
5. Red ❌ = Failed (rare)

**Via CLI:**
```bash
# Check recent commits
git log --oneline -5

# Check if index was updated
git diff HEAD~1 search/index.json

# Check latest tag
git tag -l --sort=-creatordate | head -5
```

### View Deployment Logs

1. Click **Actions** → **Deploy to GitHub Pages**
2. Click latest run
3. Expand job steps to see:
   - Index generation output
   - File count
   - Deployment summary
   - Live URL

### Verify Live Deployment

```bash
# Check site is live
curl -I https://<username>.github.io/<repo>/search/

# Should return: HTTP/1.1 200 OK
```

---

## Troubleshooting Deployments

### Deployment Failed (Red ❌)

**Steps to fix:**

1. **Check Actions logs**
   - Actions tab → failed run → expand steps
   - Look for error messages
   - Common: file path issues, permission problems

2. **Check file permissions**
   ```bash
   git check-attr -a kb/file.md
   ```

3. **Verify markdown files exist**
   ```bash
   find kb -name "*.md" | head -10
   ```

4. **Test locally**
   ```bash
   node generate-index.js
   echo "Exit code: $?"
   ```

5. **Check Node.js syntax**
   ```bash
   node -c generate-index.js  # Check syntax
   ```

### Index Not Updating

**Problem:** Changes pushed but old articles still shown

**Solutions:**

1. **Force regeneration**
   ```bash
   rm search/index.json
   git add search/index.json
   git commit -m "chore: force index regeneration"
   git push
   ```

2. **Clear browser cache**
   - Hard refresh: Ctrl+Shift+R (Windows/Linux)
   - Cmd+Shift+R (Mac)

3. **Check GitHub Pages cache**
   - Wait 5 minutes
   - Try incognito/private window

### Search Returns No Results

**Problem:** Articles not appearing in search

**Solutions:**

1. **Verify articles exist**
   ```bash
   find kb -name "*.md" | wc -l
   cat search/index.json | grep "title" | wc -l
   # Should match
   ```

2. **Check article frontmatter**
   ```bash
   head -15 kb/project/category/article.md
   # Should have: title, project, category, tags, status, last_updated
   ```

3. **Regenerate manually**
   ```bash
   node generate-index.js
   git add search/index.json
   git commit -m "chore: regenerate index"
   git push
   ```

---

## Performance & Optimization

### Index Size Monitoring

```bash
# Check current size
ls -lh search/index.json

# Show in bytes
wc -c search/index.json

# Growth rate
git log -p -- search/index.json | grep "^-" | wc -l
```

**Targets:**
- Small (< 500 articles): < 2 MB ✅
- Medium (500-2000): 2-10 MB ✅
- Large (2000+): > 10 MB (consider optimization)

### Optimization Strategies

**1. Reduce preview length:**
```javascript
// In generate-index.js
content: plainText.substring(0, 200), // Reduce from 300
```

**2. Exclude directories:**
```javascript
// In generate-index.js scanDirectory()
if (entry.name === 'archive' || entry.name === 'drafts') {
  continue;
}
```

**3. Limit keywords:**
```javascript
// In generate-index.js
return unique.slice(0, 30); // Reduce from 50
```

**4. Archive old articles:**
```bash
mkdir kb/archive
mv kb/project/category/old-article.md kb/archive/
```

### Deployment Speed

**Typical times:**
- Clone & setup: 30 seconds
- Index generation: 10-30 seconds
- Deploy: 20-40 seconds
- **Total: 1-2 minutes**

**If slow (> 3 minutes):**
- Check file count: `find kb -name "*.md" | wc -l`
- Check Actions logs for bottlenecks
- Optimize index as above

---

## GitHub Pages Configuration

### Custom Domain

**Setup custom domain:**

1. Create `CNAME` file in repository root:
   ```
   yourdomain.com
   ```

2. Update DNS with GitHub's nameservers:
   - `185.199.108.153`
   - `185.199.109.153`
   - `185.199.110.153`
   - `185.199.111.153`

3. GitHub Pages automatically uses custom domain

**Access site:**
```
https://yourdomain.com/search/
```

### SSL/HTTPS

GitHub Pages automatically provides SSL/HTTPS:
- ✅ Always encrypted
- ✅ Free certificate
- ✅ Auto-renewal

### Subdomain Setup

For subdomain (e.g., `kb.company.com`):

1. Create `CNAME` file:
   ```
   kb.company.com
   ```

2. Update DNS CNAME record:
   ```
   kb.company.com CNAME username.github.io
   ```

---

## Maintenance Tasks

### Weekly

- ✅ Check deployment status (Actions tab)
- ✅ Verify search functionality
- ✅ Review new articles added

### Monthly

- ✅ Review KB article quality
- ✅ Update old/outdated articles
- ✅ Check index size
- ✅ Monitor GitHub Actions usage

### Quarterly

- ✅ Archive old articles
- ✅ Optimize index if needed
- ✅ Review performance metrics
- ✅ Update documentation

---

## Backup & Recovery

### Backup Repository

GitHub automatically keeps backups, but you can:

```bash
# Clone full history
git clone --mirror https://github.com/org/NoContext-Atlas.git

# Creates backup copy
```

### Restore from Backup

```bash
# View history
git log --oneline | head -20

# Revert to previous commit
git revert <commit-hash>
git push

# Or reset (use with caution!)
git reset --hard <commit-hash>
git push --force
```

### Archive Old Content

```bash
# Create archive branch
git checkout -b archive/2025-q1

# Move old articles
mkdir -p archive
mv kb/old-project archive/

# Commit
git commit -m "archive: move old articles"
git push origin archive/2025-q1
```

---

## Scaling Considerations

### Current Capacity

Atlas handles:
- ✅ Up to 10,000+ markdown files
- ✅ Index generation < 1 minute
- ✅ Search < 100ms
- ✅ Fully client-side (no server)
- ✅ Free GitHub Pages hosting

### If You Need More

**Monitor these metrics:**
- Index file size (track growth)
- Deployment time (should stay < 3 min)
- Search results count (slow with 100K+ articles)

**Optimization checklist:**
1. Archive old articles
2. Reduce preview length
3. Limit keywords per article
4. Split into multiple indexes

**If still need more:**
- Consider backend search (Elasticsearch)
- Add database (PostgreSQL)
- Implement full-text search engine

---

## CI/CD Enhancements

### Add Linting (Optional)

```yaml
- name: ✅ Lint markdown
  run: |
    npm install -g markdownlint-cli
    markdownlint '**.md' || true
```

### Add Notifications (Optional)

```yaml
- name: 📢 Notify Slack
  uses: slackapi/slack-github-action@v1
  with:
    payload: |
      {
        "text": "✅ KB deployed",
        "blocks": [{
          "type": "section",
          "text": {
            "type": "mrkdwn",
            "text": "Atlas deployed\nURL: ${{ steps.deployment.outputs.page_url }}"
          }
        }]
      }
```

### Track Metrics (Optional)

```bash
# Add to workflow
- name: 📊 Log metrics
  run: |
    echo "Articles: $(find kb -name '*.md' | wc -l)"
    echo "Index size: $(ls -lh search/index.json | awk '{print $5}')"
```

---

## Disaster Recovery

### Site Down

**Steps:**

1. **Check status:** Visit https://www.githubstatus.com/
2. **Check Actions:** Workflow still running?
3. **Wait 5 minutes** (transient issues resolve)
4. **Clear cache:** Hard refresh in browser
5. **Manually trigger:** Actions → Deploy → Run workflow

### Lost Articles

**Recover from Git:**

```bash
# Show deleted files
git log --diff-filter=D --summary | grep delete

# Restore deleted file
git checkout <commit>~1 -- kb/path/to/article.md
git commit -m "restore: recover deleted article"
git push
```

### Broken Deployment

**Steps:**

1. Check Actions logs for specific error
2. Fix issue locally
3. Test: `node generate-index.js`
4. Commit and push
5. Monitor Actions tab

---

## Support & Documentation

### Resources

- 📖 [README.md](./README.md) - Project overview
- 🔧 [DEVELOPMENT.md](./KBAtlasDOCS0003.md) - Development guide
- ☑️ [DEPLOY_CHECKLIST.md](./DEPLOY_CHECKLIST.md) - Quick reference
- 🔍 [GitHub Docs](https://docs.github.com/en/pages)

### Getting Help

1. Check Actions logs (most informative)
2. Review this guide
3. Create GitHub Issue with:
   - Error message
   - Steps to reproduce
   - Actions log excerpt
4. Contact Infrastructure Manager

---

## Best Practices

### Commits

```bash
# Good commit messages
git commit -m "docs: add KB article about X"
git commit -m "docs: update article - fix typo"
git commit -m "ui: improve search layout"

# Bad commit messages (avoid)
git commit -m "update"
git commit -m "fix"
git commit -m "asdf"
```

### Article Management

- ✅ Add meaningful titles
- ✅ Include comprehensive frontmatter
- ✅ Use proper markdown formatting
- ✅ Update `last_updated` when editing
- ✅ Archive old content instead of deleting

### Testing

- ✅ Test locally before pushing
- ✅ Verify new articles in search
- ✅ Check formatting in viewer
- ✅ Test on mobile devices
- ✅ Review Actions logs

---

**Last updated:** 2026-03-29
**Maintainer:** Gladwin Ferdz I. Del Rosario

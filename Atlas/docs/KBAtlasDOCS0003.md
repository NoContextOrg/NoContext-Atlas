---
title: Atlas — Development Guide
project: Atlas
category: documentation
tags: [development, setup, local, contributing, architecture]
status: approved
last_updated: 2026-03-29
---

# Atlas — Development Guide

**Repository:** https://github.com/NoContextOrg/NoContext-Atlas.git

This guide covers local development setup, architecture, and contributing to NoContext Atlas knowledge base search engine.

---

## Overview

Atlas is a **static, client-side knowledge base search system** with:
- ✅ Zero backend dependencies
- ✅ Fully searchable markdown content
- ✅ Beautiful, responsive UI
- ✅ Automated GitHub Pages deployment
- ✅ Dynamic index generation

---

## Prerequisites

### Required

- **Node.js 12+** (tested with Node 18)
- **npm** or yarn
- **Git** for version control
- **Code Editor** (VS Code, Sublime, etc.)

### Optional

- Python 3 (for local HTTP server)
- Docker (for containerized development)

---

## Project Structure

```
NoContext-Atlas/
├── kb/                           # Knowledge base articles
│   ├── Anino/
│   │   ├── how-to/
│   │   ├── incident/
│   │   └── configuration/
│   ├── SiteGuard/
│   │   ├── docs/
│   │   └── ...
│   └── [Project]/[Category]/
│
├── search/                       # Search interface
│   ├── index.html               # Main search UI
│   ├── viewer.html              # Markdown viewer for articles
│   └── index.json               # Generated search index (auto-created)
│
├── generate-index.js            # Index generator script
├── README.md                    # Repository overview
├── DEPLOYMENT.md                # Deployment guide
├── DEPLOY_CHECKLIST.md          # Quick checklist
│
└── .github/workflows/
    └── deploy.yml               # GitHub Actions CI/CD
```

---

## Local Development Setup

### 1. Clone Repository

```bash
git clone https://github.com/NoContextOrg/NoContext-Atlas.git
cd NoContext-Atlas
```

### 2. Install Dependencies

```bash
npm install
# or if no package.json:
# No npm packages required! generate-index.js is pure Node.js
```

### 3. Generate Search Index

```bash
node generate-index.js
```

This scans all `.md` files and creates `search/index.json`.

### 4. Start Local Server

**Using Python 3:**
```bash
python -m http.server 8000
# Visit: http://localhost:8000/search/
```

**Using Node.js:**
```bash
npm install -g http-server
http-server -p 8000
# Visit: http://localhost:8000/search/
```

**Using VS Code:**
- Install "Live Server" extension
- Right-click `search/index.html`
- Select "Open with Live Server"

### 5. Test Search

- ✅ Search for keywords
- ✅ Filter by category/project
- ✅ Click articles to view
- ✅ Test responsive design (F12 → Device toolbar)

---

## File Format & Conventions

### Markdown File Naming

**Format:** `KB[Project][Category][ID].md`

**Examples:**
- `KBAninoHOW0001.md` - Anino project, How-To, ID 0001
- `KBSiteGuardDOCS0002.md` - SiteGuard project, Documentation, ID 0002
- `KBAtlasINC0001.md` - Atlas project, Incident, ID 0001

### Frontmatter (YAML)

All articles must start with frontmatter:

```yaml
---
title: [Category] - [System] - [Action]
project: ProjectName
category: how-to
tags: [tag1, tag2, tag3]
status: approved
last_updated: 2026-03-29
---
```

**Fields:**
- `title` - Display title in search results
- `project` - Project name (used for filtering)
- `category` - Category code (how-to, incident, docs, etc.)
- `tags` - Array of searchable keywords
- `status` - draft, review, approved, archived
- `last_updated` - ISO date format

### Example Article

```markdown
---
title: How-To - Raspberry Pi - Initial Setup
project: Anino
category: how-to
tags: [iot, raspberry-pi, setup, beginner]
status: approved
last_updated: 2026-03-29
---

# How-To - Raspberry Pi - Initial Setup

## Overview
This guide covers initial Raspberry Pi configuration...

## Prerequisites
- Raspberry Pi 4+
- 16GB microSD card
- Power supply (5V, 3A)

## Steps

### Step 1: Flash OS
1. Download Raspberry Pi Imager
2. Insert microSD card
3. ...

## Troubleshooting
...
```

---

## Development Workflow

### Adding a New Article

```bash
# 1. Create file in correct folder
mkdir -p kb/ProjectName/category
touch kb/ProjectName/category/KBProjectNameCATEGORY0001.md

# 2. Add frontmatter and content
# (Use template above)

# 3. Regenerate index
node generate-index.js

# 4. Test locally
python -m http.server 8000
# Visit http://localhost:8000/search/

# 5. Commit and push
git add kb/ProjectName/category/KBProjectNameCATEGORY0001.md
git commit -m "docs: add new KB article"
git push origin main
```

### Updating an Existing Article

```bash
# 1. Edit the markdown file
nano kb/ProjectName/category/KBProjectNameCATEGORY0001.md

# 2. Update last_updated date in frontmatter

# 3. Regenerate index
node generate-index.js

# 4. Test locally

# 5. Commit and push
git add kb/ProjectName/category/KBProjectNameCATEGORY0001.md
git commit -m "docs: update KB article"
git push origin main
```

### Modifying Search UI

Edit `search/index.html` or `search/viewer.html`:

```bash
# 1. Make changes locally
# 2. Test in browser (refresh page)
# 3. Regenerate index if needed
node generate-index.js

# 4. Commit and push
git add search/index.html
git commit -m "ui: improve search interface"
git push origin main
```

---

## Understanding the Code

### `generate-index.js` - Index Generator

**What it does:**
1. Recursively scans `kb/` for `.md` files
2. Strips markdown formatting
3. Extracts keywords from content
4. Outputs `search/index.json`

**Key functions:**

```javascript
stripMarkdown(content)     // Remove MD syntax, keep text
extractKeywords(text)      // Pull important words
scanDirectory(dir)         // Recursively find .md files
generateIndex()            // Main function
```

**How to customize:**

```javascript
// Limit keywords per article
function extractKeywords(text, limit = 50) { // Change 50
  // ...
}

// Skip certain directories
if (entry.name.startsWith('.') || entry.name === 'archive') {
  continue; // Add directory names to skip
}

// Adjust preview length in output
content: plainText.substring(0, 300), // Change 300
```

### `search/index.html` - Search Interface

**Main Components:**

1. **KBSearch Class** - Core search logic
   - Loads `index.json`
   - Filters by query/category/project
   - Sorts by relevance
   - Renders results

2. **Event Listeners** - User interactions
   - Search input → triggers `search()`
   - Filter dropdowns → triggers `search()`
   - Click result → opens viewer

3. **Styling** - Responsive CSS
   - Mobile-first design
   - Purple gradient theme
   - Smooth animations

**Key methods:**

```javascript
search()                    // Filter and sort results
calculateRelevance()        // Score matching results
highlightText()            // Add yellow highlights
formatName()               // Format display names
render()                   // Update DOM
```

### `search/viewer.html` - Article Viewer

**Features:**
1. Loads markdown file from URL parameter
2. Converts markdown to HTML
3. Renders with beautiful styling
4. Displays metadata

**URL Format:**
```
viewer.html?file=kb/project/category/KBArticle0001.md
```

**Key function:**
```javascript
convertMarkdownToHtml()    // Parse MD and generate HTML
openMarkdownViewer()       // Load and display file
```

---

## Testing

### Manual Testing

```bash
# 1. Start server
python -m http.server 8000

# 2. Open http://localhost:8000/search/

# 3. Test scenarios:
# - Empty search (show all articles)
# - Search for keywords
# - Filter by category
# - Filter by project
# - Click article → opens in new tab
# - Viewer displays formatting correctly
# - Back button works
# - Responsive on mobile (F12 → Device toolbar)
```

### Testing New Articles

```bash
# Add test article
touch kb/Test/category/KBTestCATEGORY0001.md

# Add content with frontmatter

# Regenerate
node generate-index.js

# Search should find it
```

### Verify Index

```bash
# Check if index was generated
cat search/index.json

# Count articles
cat search/index.json | grep '"title"' | wc -l

# Pretty print (if jq installed)
jq . search/index.json
```

---

## Common Tasks

### Regenerate Index

```bash
node generate-index.js
```

**When to use:**
- After adding/modifying `.md` files
- Manually before testing
- Local development

### Clean Search Cache

```bash
# Remove generated index
rm search/index.json

# Regenerate fresh
node generate-index.js
```

### Check Markdown Validity

```bash
# Find files with syntax errors
find kb -name "*.md" -exec grep -l "^---$" {} \;

# Count total articles
find kb -name "*.md" | wc -l

# List all articles
find kb -name "*.md" -type f
```

### Update All `last_updated` Dates

```bash
# Bash script to update today's date
find kb -name "*.md" -type f | while read file; do
  sed -i 's/last_updated: .*/last_updated: '$(date +%Y-%m-%d)'/' "$file"
done
```

---

## Troubleshooting

### Index Not Generated

**Problem:** `search/index.json` doesn't exist

**Solution:**
```bash
node generate-index.js
# Check for errors in console
cat search/index.json  # Verify output
```

### Search Returns No Results

**Problem:** Articles not appearing in search

**Solutions:**
1. Regenerate index: `node generate-index.js`
2. Verify markdown files exist: `find kb -name "*.md"`
3. Check file format (must have frontmatter)
4. Check keyword extraction: `node -e "const i = require('./search/index.json'); console.log(i[0].keywords)"`

### Articles Not Showing in Viewer

**Problem:** Click article but page doesn't load

**Solutions:**
1. Check file path in index: `cat search/index.json | grep url`
2. Verify markdown file exists at that path
3. Check browser console (F12) for errors
4. Test directly: `http://localhost:8000/search/viewer.html?file=kb/project/category/file.md`

### Local Server Issues

**Problem:** Can't access http://localhost:8000

**Solutions:**
- Check port is free: `lsof -i :8000`
- Change port: `python -m http.server 9000`
- Check firewall allowing localhost
- CORS issues? Server should allow all origins

---

## Version Control

### Commit Messages

Follow conventional commits:

```bash
# Adding new article
git commit -m "docs: add KB article about X"

# Updating article
git commit -m "docs: update KB article - fix typo"

# Modifying search UI
git commit -m "ui: improve search results styling"

# Updating documentation
git commit -m "docs: update development guide"

# Index regeneration (auto-committed by GitHub Actions)
git commit -m "chore: regenerate search index"
```

### Branching Strategy

```bash
# Feature branch for new articles
git checkout -b feature/add-kb-articles

# Make changes and commit
git commit -m "docs: add KB articles"

# Push and create PR
git push origin feature/add-kb-articles

# After review, merge to main
```

---

## Performance Optimization

### Index Size

Monitor with:
```bash
wc -c search/index.json  # File size in bytes
ls -lh search/index.json # Human-readable size
```

**Optimization tips:**
- Reduce preview length in `generate-index.js`
- Archive old articles instead of deleting
- Exclude certain directories from index

### Search Speed

Speed is client-side, bottlenecks:
- Large index size
- Many keywords per article
- Complex search queries

**Optimize:**
- Keep preview < 300 characters
- Limit keywords to 50 per article
- Use specific search terms

---

## Contribution Workflow

1. **Fork** repository (if external contributor)
2. **Create feature branch:** `git checkout -b feature/your-feature`
3. **Make changes** locally
4. **Test** thoroughly
5. **Commit** with clear messages
6. **Push** to your fork/branch
7. **Create Pull Request** with description
8. **Wait for review** and CI checks
9. **Merge** after approval

---

## Resources

- 📖 [README.md](./README.md) - Project overview
- 🚀 [DEPLOYMENT.md](./DEPLOYMENT.md) - Deployment guide
- ☑️ [DEPLOY_CHECKLIST.md](./DEPLOY_CHECKLIST.md) - Quick checklist
- 📚 [Markdown Guide](https://www.markdownguide.org/)
- 🔍 [GitHub Docs](https://docs.github.com/)

---

## Getting Help

- Check existing KB articles for similar issues
- Review GitHub Issues in repository
- Check Actions logs for deployment errors
- Ask in team communication channels

---

**Last updated:** 2026-03-29
**Maintainer:** Gladwin Ferdz I. Del Rosario

# NoContext – Atlas: Centralized Knowledge Base Repository

**Maintained by:** Gladwin Ferdz I. Del Rosario – Infrastructure Manager and Process Owner

---

## Foreword

Welcome to **NoContext – Atlas**, the centralized knowledge base for all IT operations at NoContext. Atlas serves as the definitive repository of organizational IT knowledge, bringing together policies, procedures, runbooks, technical guides, best practices, and project-specific documentation in one accessible, structured location. With the recent addition of a **searchable interface**, Atlas enables rapid discovery of information across projects, categories, and topics, empowering teams to find the right guidance exactly when they need it.

In today's dynamic IT environment, consistent access to accurate information is critical. Atlas has been designed to empower IT staff and stakeholders to make informed decisions, efficiently resolve incidents, and maintain the highest standards of service delivery. By consolidating knowledge into a single source with structured organization and searchable access, we aim to reduce redundancy, minimize errors, and promote operational consistency across all teams.

---

## Purpose

The purpose of Atlas is to:

- **Centralize knowledge** – ensure all IT operations knowledge, including project-specific procedures, is accessible from one authoritative source.
- **Support staff and stakeholders** – provide clear guidance for daily tasks, troubleshooting, and decision-making.
- **Standardize processes** – maintain consistency across policies, procedures, and service management practices.
- **Promote continuous improvement** – encourage contributions, updates, and collaboration to keep information current, relevant, and discoverable through search.

---

## Scope

Atlas covers all aspects of IT operations within NoContext, including but not limited to:

- Incident, problem, and change management processes
- Runbooks for system administration and technical operations
- Policies governing IT governance, security, and compliance
- Standard operating procedures (SOPs) for routine and critical tasks
- Knowledge articles for troubleshooting and support
- Project-specific guidance and best practices, organized per project and category

---

## Vision

Our vision for Atlas is to cultivate a culture of **knowledge sharing and operational excellence**. By providing an organized, accessible, and searchable knowledge base, we aim to enhance efficiency, reduce risk, and empower teams to deliver high-quality IT services consistently.

We encourage all team members to actively **use, contribute, and update Atlas**, ensuring it remains a living resource that evolves with our organization and its operational needs. Together, Atlas will serve as the backbone of knowledge-driven IT operations at NoContext, enabling teams to find the right answers quickly, across projects and operational domains.

---

## Knowledge Base Structure (Project-Based)

Atlas follows a **project-based folder structure** for organization and searchability:

```text
/kb/
└── /{project}/
    ├── /incident/
    ├── /request/
    ├── /problem/
    ├── /how-to/
    ├── /configuration/
    └── /monitoring/
```

**Example:**

```text
/kb/
├── /growup/
│   ├── /incident/
│   │   └── sensor-device-offline.md
│   └── /how-to/
│       └── setup-raspberry-pi.md
└── /atlas/
    └── /configuration/
        └── nginx-reverse-proxy.md
```

---

## Article Naming Convention

### Title (Inside Markdown File)

Use the following format for article titles:

```
[Category] - [System] - [Action/Topic]
```

**Examples:**

- `Incident - Sensor - Device Offline`
- `How-To - Raspberry Pi - Initial Setup`
- `Configuration - Nginx - Reverse Proxy Setup`

### File Naming Convention

Format: `KB[Project][Category][OverallID].md`

- **KB Prefix:** Always start with `KB`
- **Project:** Project name prefix (e.g., `Anino`, `SiteGuard`)
- **Category:** Category code abbreviation (e.g., `HOW` for how-to, `INC` for incident, `CFG` for configuration)
- **OverallID:** Sequential numeric ID with leading zeros (e.g., `0001`, `0002`, `0004`)
- The filename should be in **PascalCase** (no hyphens or spaces)

**Examples:**

- `KBAninoHOW0001.md` – Anino project, How-To category, ID 0001
- `KBAninoINC0004.md` – Anino project, Incident category, ID 0004
- `KBSiteGuardCFG0002.md` – SiteGuard project, Configuration category, ID 0002

**Category Code Reference:**

| Category Code | Full Category |
|---------------|---------------|
| `HOW` | how-to |
| `INC` | incident |
| `REQ` | request |
| `PRB` | problem |
| `CFG` | configuration |
| `MON` | monitoring |

---

## Article Template (Markdown)

All KB articles should follow this consistent format:

```yaml
---
title: Incident - Sensor - Device Offline
project: growup
category: incident
tags: [iot, sensor, critical]
status: approved
last_updated: 2026-04-05
---
```

```markdown
# Incident - Sensor - Device Offline

## Summary
Short description of the issue.

## Symptoms
- Device not sending data
- No readings in dashboard

## Cause
Explain root cause.

## Resolution
Step-by-step fix.

## Prevention
How to avoid this in the future.
```

---

## Tagging Convention

Use **global tags** for cross-project searchability. Tags must be included in each article's frontmatter.

**Example Tags:**

| Tag        | Description                          |
|------------|--------------------------------------|
| `iot`      | Internet of Things related articles  |
| `vpn`      | VPN configuration and troubleshooting|
| `linux`    | Linux system administration          |
| `database` | Database management and issues       |
| `critical` | High-priority or severity-1 articles |

---

## Search and Contribution Guide

### Searching the Knowledge Base

- Use the HTML search interface located at `/search/index.html`.
- Search by **keywords**, **project**, **category**, or **tags**.
- Search results display the article title, a content snippet, and a direct link to the markdown file.

### Contributing a New Article

1. Create a new `.md` file in the appropriate `/kb/{project}/{category}/` folder.
2. Follow the [article naming convention](#article-naming-convention) and [article template](#article-template-markdown).
3. Add appropriate tags in the frontmatter.
4. Submit a **Pull Request** for review and approval.

### Updating an Existing Article

1. Edit the `.md` file in the correct folder.
2. Update the `last_updated` field in the frontmatter.
3. Submit a **Pull Request** for review.

---

## Category Reference

| Category        | Description                                              |
|-----------------|----------------------------------------------------------|
| `incident`      | Documented incidents, root causes, and resolutions       |
| `request`       | Service request fulfillment procedures                   |
| `problem`       | Underlying problem records and known error documentation |
| `how-to`        | Step-by-step guides for common tasks                     |
| `configuration` | System and application configuration references          |
| `monitoring`    | Monitoring setup, alerting rules, and dashboards         |

---

## Article Status Reference

| Status      | Description                                              |
|-------------|----------------------------------------------------------|
| `draft`     | Work in progress; not yet ready for use                  |
| `review`    | Submitted and awaiting peer or manager review            |
| `approved`  | Reviewed and approved for operational use                |
| `archived`  | No longer active; retained for historical reference only |

---

## Key Rules Summary

| Rule | Detail |
|------|--------|
| 📁 **Project** | Corresponds to a top-level folder under `/kb/` |
| 📁 **Category** | Corresponds to a subfolder within the project folder |
| 📄 **Filename** | Lowercase, hyphen-separated: `system-topic.md` |
| 📝 **Title** | Format: `Category - System - Action` |
| 🏷️ **Tags** | Global keywords in frontmatter for cross-project search |
| ✅ **Status** | Always set to `draft`, `review`, `approved`, or `archived` |
| 🔄 **Last Updated** | Must be updated on every edit (`YYYY-MM-DD` format) |

> This ensures Atlas remains **organized**, **searchable**, and **scalable** as knowledge grows across projects and teams.

---

## Governance

All articles in Atlas are subject to the following governance rules:

- **Ownership** – Each article must belong to a project and be maintained by the responsible team.
- **Review Cycle** – Articles should be reviewed at minimum every **6 months** to ensure accuracy.
- **Approval** – New articles and major changes require approval from the Infrastructure Manager or designated Process Owner before the status is changed to `approved`.
- **Deprecation** – Outdated articles must be moved to `archived` status rather than deleted, preserving historical context.

---

## Contact and Feedback

For questions, suggestions, or to report inaccurate information in Atlas, contact:

**Gladwin Ferdz I. Del Rosario**
Infrastructure Manager and Process Owner
*NoContext IT Operations*

---

*Atlas is a living document. Help keep it accurate and up to date by contributing your knowledge.*
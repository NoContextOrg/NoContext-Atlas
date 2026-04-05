---
title: SiteGuard Backend — Project Landing and Audit
project: SiteGuard
category: documentation
tags: [backend, cleanup, refactor, hardening, audit, spring-boot, java]
status: approved
last_updated: 2026-03-29
---

# SiteGuard Backend — Project Landing and Audit

**Repository:** https://github.com/NoContextOrg/siteguard-backend.git

This README consolidates everything we changed and implemented during the cleanup, refactor, and hardening work so far. Use this as the single landing page for the repository and the basis for the GitHub Pages/Project landing.

## Project Overview

**SiteGuard Backend** provides secure, scalable server-side APIs for biometric attendance, hotlist alerts, real-time dashboarding, and SMS notifications for site incidents.

This document records the end-to-end work performed (code changes, refactors, tests, and CI/DevOps wiring) and gives clear instructions to run, test, and extend the project.

---

## High-Level Timeline / Audit (What Was Done)

### 1. Fixed Compilation and Startup Issues

- Fixed compilation and startup issues introduced by empty or incomplete WebSocket classes.
- Implemented minimal, safe `AttendanceWebSocketHandler` and `JwtHandshakeInterceptor` (no-op but compile-safe) and registered them as Spring beans.
- Resolved a bean name conflict between two `WebSocketConfig` classes by giving the non-STOMP config an explicit bean name.

### 2. Centralized Attendance Processing Logic

- Extracted `AttendanceProcessor` and refactored `AttendanceService` to delegate processing to it (single responsibility and testability).
- Improved developer experience and testability.
- Added an H2-based test profile (`src/test/resources/application.properties`) so tests run without an external Postgres instance.
- Adjusted `AttendanceLog` model to use `@Lob` for rawPayload so H2 and Postgres schema creation is compatible.

### 3. Formatting Tools Consolidation

- Experimented with formatting tools (Spotless/google-java-format and an Eclipse formatter), but per user request the formatter tooling was removed from the build to avoid JDK compatibility issues.
- The repo no longer runs a formatter automatically.

### 4. SMS Provider Consolidation and Robust Implementation

Consolidated Vonage (Nexmo) SMS logic into a single `SmsService` with the following features:

- Sync and async send methods (blocking and fire-and-forget)
- Phone normalization and message truncation
- Retry with exponential backoff
- Response parsing for Vonage JSON responses
- Optional Micrometer instrumentation for observability
- Removed the redundant `VonageService` class (functionality merged into `SmsService`)

### 5. Instrumentation and Testing

- Added Micrometer (`micrometer-core`) and instrumented `SmsService` with:
  - **Counters:** `sms.sent.count`, `sms.failed.count`, `sms.retry.count`
  - **Timer:** `sms.send.latency`
- Added comprehensive unit tests for `SmsService` using a mocked `HttpClient` and `SimpleMeterRegistry`:
  - Sync success
  - Provider rejection
  - Retry then success
  - Invalid phone and missing credentials
  - Async success and async failure
- Tests are located at `src/test/java/com/nocontext/siteguard/service/SmsServiceTest.java`

### 6. Build/Test and Branch Management

- Tests run locally; relevant commands are included below.
- Development branch used for these changes: `cleanup/attendance-processor`
- Example commit messages used during work:
  - `refactor(attendance): extract AttendanceProcessor; delegate from AttendanceService; add minimal websocket handlers & add Spotless plugin to pom.xml`
  - `chore(format,test): add Eclipse formatter, H2 test DB, fix websocket beans and model for test compatibility`
  - `test(sms): add SmsService unit tests with mocked HttpClient; consolidate Vonage logic into SmsService; add env-backed vonage properties; remove formatter plugins`
  - `feat(sms): add Micrometer instrumentation and extend SmsService unit tests (retry, metrics, async)`

---

## Files Changed (Important Ones)

### Added/Edited Core Services and Handlers

- `src/main/java/com/nocontext/siteguard/service/AttendanceProcessor.java` (new)
- `src/main/java/com/nocontext/siteguard/service/AttendanceService.java` (refactored)
- `src/main/java/com/nocontext/siteguard/websocket/AttendanceWebSocketHandler.java` (new)
- `src/main/java/com/nocontext/siteguard/websocket/JwtHandshakeInterceptor.java` (new)
- `src/main/java/com/nocontext/siteguard/websocket/WebSocketConfig.java` (bean name fixed)

### SMS & Provider Consolidation + Instrumentation

- `src/main/java/com/nocontext/siteguard/service/SmsService.java` (new consolidated implementation with Micrometer instrumentation)
- `src/main/java/com/nocontext/siteguard/service/VonageService.java` (removed / merged into SmsService)

### Model Compatibility Changes

- `src/main/java/com/nocontext/siteguard/model/AttendanceLog.java` (@Lob for raw payload)

### Tests

- `src/test/java/com/nocontext/siteguard/service/SmsServiceTest.java` (comprehensive tests)

### Build/Test Config and Docs

- `pom.xml` (added micrometer-core; removed formatter plugins)
- `src/test/resources/application.properties` (H2 in-memory DB for tests)
- `src/main/resources/application.properties` (added Vonage env-backed placeholders)
- `README.md` (consolidated landing page)

---

## How to Build, Test, and Run (Developer Quick-Start)

### Prerequisites

- Java 21 (tested with Eclipse Temurin 21)
- Maven 3.8+ (or the Maven wrapper included in the repo)
- Optional: Docker for container builds

### Environment Variables (Production)

#### Database (Postgres)
Set these in your environment or platform:

- `DB_URL` (JDBC URL)
- `DB_USERNAME`
- `DB_PASSWORD`

#### Vonage (Nexmo) SMS Provider Credentials
Set these in environment:

- `VONAGE_API_KEY`
- `VONAGE_API_SECRET`
- `VONAGE_FROM` (optional; default: SiteGuard)

### Local Build & Tests

To compile the project (skip tests):

```bash
mvn -DskipTests=true compile
```

To run the full test suite:

```bash
mvn test
```

To run only the SMS unit tests (fast):

```bash
mvn -Dtest=SmsServiceTest test
```

Run the application (development profile):

```bash
mvn spring-boot:run
```

The app reads runtime configuration from `application.properties` which references env variables for DB and Vonage credentials.

### Docker (Build & Run)

A simple multi-stage Dockerfile was prepared in the plan (if not present, you can create one). Example commands to build & run:

```bash
docker build -t siteguard-backend:latest .

# run with required env variables
docker run -e DB_URL=jdbc:postgresql://db:5432/siteguard \
  -e DB_USERNAME=user \
  -e DB_PASSWORD=pass \
  -e VONAGE_API_KEY=xxx \
  -e VONAGE_API_SECRET=yyy \
  -p 8080:8080 siteguard-backend:latest
```

### CI (Recommended GitHub Actions Workflow)

Create `.github/workflows/maven-ci.yml` with the following to run tests on push/PRs and check formatting/build:

```yaml
name: CI
on:
  push:
    branches: [ main, "cleanup/*" ]
  pull_request:
    branches: [ main ]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Set up JDK 21
        uses: actions/setup-java@v4
        with:
          distribution: temurin
          java-version: 21
      - name: Build and run tests
        run: mvn -B -DskipTests=false clean verify
      - name: Publish test results
        run: echo "Tests complete"
```

You can extend the workflow with caching, static analysis (SpotBugs/Checkstyle), and metrics publishing.

---

## Observability & Production Notes

### Metrics
SmsService records counters and a latency timer via Micrometer. In production enable a MeterRegistry (Prometheus) and export metrics.

### Retries & Resilience
SmsService includes simple retries with exponential backoff. For production you may want Resilience4j to add circuit-breakers and bulkhead protections.

### Secrets
Do not store Vonage or DB credentials in the repo. Use your secret store (Kubernetes secrets, HashiCorp Vault, AWS Secrets Manager, etc.).

### Health & Readiness
Expose Spring Boot Actuator endpoints and configure readiness/liveness checks for containerized deployments.

---

## Tests Added (Summary)

- `SmsServiceTest` covers the sync and async success/failure cases, retry behavior, invalid inputs, and metrics assert via `SimpleMeterRegistry`.
- Add additional tests as needed for `AttendanceProcessor` and other services.

---

## Branch & Commit Notes

Work was performed on branch: `cleanup/attendance-processor`

Representative commit messages:

```
refactor(attendance): extract AttendanceProcessor; delegate from AttendanceService; add minimal websocket handlers & add Spotless plugin to pom.xml
chore(format,test): add Eclipse formatter, H2 test DB, fix websocket beans and model for test compatibility
test(sms): add SmsService unit tests with mocked HttpClient; consolidate Vonage logic into SmsService; add env-backed vonage properties; remove formatter plugins
feat(sms): add Micrometer instrumentation and extend SmsService unit tests (retry, metrics, async)
```

---

## Recommended Next Steps

1. Add integration tests with WireMock or an HTTP recording tool for the Vonage API to exercise the full provider flow.
2. Add a circuit-breaker (Resilience4j) around SMS send calls.
3. Add Actuator and Prometheus exporter to monitor metrics and health.
4. Harden security configuration, CORS, and JWT handshake interceptor to validate tokens correctly in production.
5. Create a PR for the `cleanup/attendance-processor` branch and run CI; review and squash commits as desired.

---

## Contact / Ownership

If you want to continue, we can:

- Push the branch and open a PR
- Add integration tests and Resilience4j wiring
- Add a GitHub Actions workflow that publishes metrics and runs code-quality checks

---

**Last updated:** 2026-03-29
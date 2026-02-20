# Spec: Milestone 4 — Platform Hygiene

**Source:** milestone-4.md
**Epic:** E-03
**Depends on:** None
**Generated:** 2026-02-20
**Status:** DRAFT — requires operator review

---

## Domain Glossary

See `specs/milestone-4.shared.md` for full glossary. No epic-specific additions.

---

## System Constraints

See `specs/milestone-4.shared.md` for shared constraints. Relevant constraint:

- **SC-05** (from shared): All UI related to the legacy "points" system must be fully removed. No migration or communication is required — the platform is not yet live and no user data exists for points.

---

## Features

### F-11: Remove Legacy Points UI | MUST

**F-11.1: Points UI fully removed**
- **GIVEN** the platform UI in its current state, which contains references to a points system
- **WHEN** this milestone is deployed
- **THEN** no UI element referencing points, point balances, point earning, or point redemption remains visible to any Actor on any screen

**F-11.2: Points-related navigation removed**
- **GIVEN** the platform navigation (sidebars, menus, breadcrumbs, links)
- **WHEN** any Actor navigates the platform
- **THEN** no navigation element references points, point history, or point-related features

**F-11.3: Points-related backend routes inaccessible**
- **GIVEN** the platform in its deployed state
- **WHEN** a user attempts to access a URL previously associated with the points system (e.g., via bookmarks or direct URL entry)
- **THEN** the request does not render a points-related page; the user is redirected to an appropriate existing page (e.g., dashboard)

**F-11.4: Points references in shared components removed**
- **GIVEN** shared UI components (user profiles, dashboards, activity feeds) that may contain embedded points references
- **WHEN** any Actor views these components
- **THEN** no points-related content, badges, counters, or labels are present

**F-11.5: Points-related background processes investigated (prerequisite)**
- **GIVEN** the platform may have automated emails, notifications, or scheduled jobs that reference points
- **WHEN** implementation begins
- **THEN** an investigation is performed to identify any background processes referencing points. If found, they are disabled or removed as part of this feature. If none exist, this is documented as confirmed.

---

## Open Questions

- ~~**OQ-01**: Resolved — UI-only removal. Backend (database, models, services, API responses) left in place.~~
- ~~**OQ-02**: Resolved — unknown; flagged as prerequisite investigation in F-11.5.~~

## Assumptions

- **A-01**: No user data migration is needed — the platform is not live, so no existing point balances require communication or conversion.
- **A-02**: Scope is front-end only: UI elements, navigation, routes/redirects. Database tables, models, services, controllers, and API response fields are left in place for future cleanup.
- **A-03**: Any points-related background processes discovered during investigation (F-11.5) will be disabled within this milestone's scope.

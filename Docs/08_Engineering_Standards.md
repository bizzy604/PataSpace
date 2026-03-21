# PataSpace Engineering Standards

## Purpose

This document defines the mandatory engineering baseline for the PataSpace monorepo. It exists to keep the backend modular, the frontend apps maintainable, and future work consistent across contributors and tooling.

## Core Principles

- SOLID: each file and class should have one clear responsibility and one clear reason to change.
- KISS: prefer the simplest design that satisfies the requirement and preserves the domain invariants.
- DRY: remove duplicated business rules and duplicate transport logic by extracting shared collaborators or contracts.
- Explicit ownership: each module owns its API surface, business logic, tests, and supporting documentation.

## Mandatory Repository Rules

- Use `pnpm` for all workspace commands.
- Every app root in `apps/` must contain a maintained `README.md`.
- Every new or modified non-generated source file must start with a file header comment that explains:
  - what the file does
  - why it is important
  - which files or modules depend on it
- No source file may exceed 200 physical lines.
- Placeholder directories and placeholder files are not allowed in committed code.
- Documentation must be updated in the same change set when commands, structure, or architecture change.

## Required File Header

Use this header at the top of every non-generated source file:

```ts
/**
 * Purpose: <what this file does>
 * Why important: <why the system needs it>
 * Used by: <dependent files, modules, or request flows>
 */
```

## Backend Standards For `apps/api`

### Architectural Target

The backend must remain a NestJS modular monolith. Each domain feature lives in a module with a clearly owned public API and a clearly owned implementation.

### Required Module Boundaries

Each implemented feature module must keep the following inside its own folder:

- controller or controllers
- application service or use-case classes
- transport types or DTOs
- Swagger documentation models
- tests
- module wiring

### Recommended Module Layout

```text
modules/<feature>/
  <feature>.module.ts
  controllers/
  application/
  domain/
  persistence/
  dto/
  docs/
  tests/
```

Small modules may collapse folders, but they must keep the same separation of concerns.

### NestJS Production Rules

- Controllers are transport adapters only. They validate input, map the request, and delegate.
- Business rules belong in application or domain services, not controllers.
- Data access belongs in repositories or dedicated persistence services.
- External systems belong behind adapters in `src/infrastructure`.
- Cross-cutting concerns belong in `src/common`.
- Cross-module calls must go through exported providers or explicit public interfaces.
- Do not import another module's internal files directly.
- Avoid circular dependencies. If two modules depend on each other, the boundary is probably wrong.

### Design Patterns To Use Deliberately

- Adapter pattern for SMS, storage, queues, and payments.
- Repository or query-service pattern for persistence.
- Strategy or policy objects for branching business rules.
- Factory builders only when object creation becomes complex enough to justify them.
- Value objects or pure helpers for repeated domain calculations.

### Anti-Patterns To Reject

- God services that contain transport, persistence, cache, notification, and domain logic in one file.
- Controllers that call Prisma directly.
- Scattered validation rules that drift away from shared contracts.
- Empty modules or empty directories committed as placeholders.
- Cross-module imports into another module's private implementation files.

## Frontend Standards For `apps/web`, `apps/admin`, and `apps/mobile`

- Keep each app feature-oriented and avoid a flat component dump.
- Keep route-level logic thin and move reusable behavior into local features, components, or lib folders.
- Reuse shared contracts and shared design tokens before creating app-local variants.
- Keep platform-specific code in the app that owns it.
- Document the app structure, commands, and current gaps in the app README.

## README Requirements

Each app README must include:

- purpose of the app
- local run commands
- build commands
- high-level folder map
- key dependencies on shared packages or backend services
- current implementation status and known gaps

## Review Checklist

Before merging, confirm:

- module boundaries remain clear
- changed files stay under the 200-line limit
- file headers are present and accurate
- README or docs changes are included when structure or commands changed
- business rules are not duplicated across modules
- controllers remain thin
- infrastructure access is behind adapters

## Automation

Run the repository standards check from the workspace root:

```bash
pnpm standards:check
```

This command currently checks:

- missing app-level `README.md` files
- source files that exceed the 200-line limit

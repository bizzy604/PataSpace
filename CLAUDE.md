# PataSpace Project Rules

## Workspace

- Use `pnpm` for all workspace commands. Do not use `npm` or `yarn`.
- Work one planned phase at a time and validate it before moving to the next phase.
- Keep shared contracts in `packages/contracts` aligned with backend and client changes.

## Engineering Standards

- Every app root under `apps/` must contain a descriptive `README.md` and keep it current.
- Every new or modified non-generated source file must begin with a short file header that states:
  - what the file does
  - why it is important
  - which files or modules use it
- Keep source files at or below 200 physical lines. If a touched file already exceeds the limit, reduce or split it before adding more logic.
- Follow SOLID, KISS, and DRY. Prefer small classes, small functions, and one reason to change per file.
- Use descriptive names for files, classes, functions, variables, DTOs, and tests.
- Do not keep placeholder folders or empty structure that suggests behavior which does not exist yet.

## Backend Rules

- Keep `apps/api` as a modular monolith with clear feature boundaries.
- Each feature module owns its own controllers, application services or use cases, DTO or transport models, documentation models, and tests.
- Controllers must stay thin. They coordinate transport concerns only.
- Business rules belong in services or use-case classes inside the owning module.
- Persistence must be isolated behind repositories or dedicated persistence services instead of being spread across controllers and unrelated modules.
- External integrations must stay behind adapters in `apps/api/src/infrastructure`.
- Cross-cutting concerns belong in `apps/api/src/common`.
- Cross-module access must go through exported providers or explicit public interfaces. Do not import another module's internal files directly.
- Avoid god services. Split orchestration, domain policy, persistence, cache coordination, and notification work into separate collaborators.

## Documentation

- When architecture, commands, or folder structure change, update the relevant `README.md` and `Docs/08_Engineering_Standards.md` in the same change set.
- Keep comments explanatory, not decorative. Document intent, invariants, and dependencies.

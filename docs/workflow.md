# Agent Workflow

> **AI Context Summary**: Le Bazaar uses a planner/builder agent pattern for multi-part features. Main thread decomposes tasks, spawns Planner agents (read-only, return task descriptions) via Task tool, then spawns Builder agents (full tools, return completion status). DevOps agent handles infrastructure. Rule: never spawn a Builder without a Planner-designed task spec. Planner outputs a structured spec (scope, files, steps, tests); Builder implements it verbatim and reports blockers rather than making design decisions unilaterally.

## Agents

| Agent | File | Model | Tools | Purpose |
|-------|------|-------|-------|---------|
| **Planner** | `.claude/agents/planner.md` | Sonnet | Read, Glob, Grep, Bash | Designs solution → outputs task spec |
| **Builder** | `.claude/agents/builder.md` | Sonnet | All (Read, Write, Edit, Glob, Grep, Bash) | Implements spec → outputs status |
| **DevOps** | `.claude/agents/devops.md` | Sonnet | All | Infrastructure, deployment, Docker, env |

## Orchestration Flow

Main thread coordinates via the Task tool:

```
1. Receive feature/bug request from user
2. Decompose into independent subproblems
3. Spawn Planner agents in parallel (one per subproblem)
4. Collect task descriptions; resolve file-overlap conflicts
5. Spawn Builder agents (sequential for shared-file deps, parallel otherwise)
6. Collect completion statuses; report to user
```

## Planner → Builder Communication

Planner outputs a structured spec that Builder implements exactly:

```
## Task: [title]
## Scope
In: [what to implement]   Out: [what NOT to touch]
## Design Decisions
- Layers: [Client / Application / Blockchain]
- State: [where state lives, data flow]
- Errors: [handling strategy, user-facing messages]
- Dependencies: [new/modified, direction]
## Files to Modify
- path/file.ext:line — what to change and why
## Implementation Steps
[ordered steps with code snippets where non-trivial]
## Tests
[what to test, expected behaviors, edge cases]
```

Builder treats this as a complete spec. If a design decision is needed beyond what Planner specified, Builder reports a **blocker** rather than deciding unilaterally.

## Parallel vs Sequential

**Parallelize** (spawn via Task tool simultaneously):
- Backend service + frontend component (different file trees)
- Independent features in the same milestone
- PHPUnit tests + Vitest tests (different test runners)

**Sequence** (one completes before the next starts):
- DB migration → seed → service implementation (ordered dependency)
- Planner → Builder (Builder requires Planner's output)
- API endpoint → frontend component consuming it (interface defined first)
- Tasks that modify the same file

## Builder Quality Gate

Before reporting complete, Builder runs `/reviewing-code-quality` on modified files:

- **Defect** findings: Fix before reporting complete
- **Advisory/Warning** findings: Surface to caller if fixing exceeds task scope

## DevOps Agent

Spawn the DevOps agent for infrastructure work, not feature work:
- Production/staging deployment
- Docker or Nginx configuration changes
- Environment variable additions to `.env.example`
- CI/CD pipeline changes
- Database backup/restore

See `.claude/agents/devops.md` and `docs/deployment.md`.

## Example: Adding a Feature

```
User: "Add course rating feature"
  ↓
Main thread decomposes → [DB migration, backend endpoint, frontend UI]
  ↓
Spawn Planner agents in parallel:
  Planner A → task spec: "ratings migration + model"
  Planner B → task spec: "POST /api/courses/{id}/ratings service + controller"
  Planner C → task spec: "RatingWidget component in Portal/Course"
  ↓
Resolve conflicts (do specs touch same files?) → no conflicts here
  ↓
Spawn Builders (migration first, then A+C in parallel):
  Builder A → migration + model (sequential first)
  Builder B → service + controller + PHPUnit tests
  Builder C → React component + Vitest tests
  ↓
Collect statuses → report to user
```

## Le Bazaar-Specific Conventions for Planners

When designing tasks, Planners must follow these project patterns:

- **Thin controllers**: Delegate all logic to services — no business logic in controllers
- **Service response shape**: `['success' => bool, 'message' => string, 'data' => array]`
- **Web3 exec pattern**: Use `buildWeb3Command()` with `escapeshellarg()` — see `docs/architecture.md`
- **Inertia forms**: `Inertia.post()` — not HTML form submit
- **Tests**: `$this->createTestUser()` for users; base `TestCase` applies `DatabaseTransactions`

## Cross-References

- Architecture (three-tier design): `docs/architecture.md`
- Code patterns (thin controller, service contract): `docs/patterns.md`
- Test conventions: `docs/testing.md`
- Deployment (DevOps agent): `docs/deployment.md`

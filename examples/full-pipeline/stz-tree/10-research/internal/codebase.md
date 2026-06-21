---
summary: "Internal scan: greenfield repo. Only .stz/ harness scaffolding exists (intent.json, project.json); no source, tests, build config, or git history. No existing code to integrate, no conventions to honor, no naming/style to match. Implies a clean slice: author package.json, tsconfig, src/, and tests from scratch with full freedom to set conventions."
---

# Internal Research: Codebase State

## Scan result

The repository at `/tmp/stz-live` is **greenfield**. The only contents are the STZ
harness directory `.stz/` holding:
- `.stz/00-intent/intent.json` — the elicited intent (problem, users, constraints, 3 done-predicates)
- `.stz/00-intent/intent.md` — markdown mirror of the same
- `.stz/project.json` — project metadata

`git status` returns exit 128 (not yet an initialized/committed working tree from the
researcher's vantage). There is **no application source code, no tests, no build
configuration, no package manifest, no tsconfig, and no prior commits** to inspect.

## What "no existing code to integrate" implies

- **No integration surface.** There is nothing to import from, wrap, or remain
  backward-compatible with. The slice is fully self-contained.
- **No conventions to honor.** There is no existing code style, lint config,
  formatter setup, directory layout, or naming pattern to match. The slice (or the
  conventions phase) sets these from scratch; specimens have freedom rather than
  constraints inherited from a legacy codebase.
- **No build/test tooling present.** A specimen must establish the full minimal
  toolchain itself: `package.json` (with `"type"` and exports), a `tsconfig.json`,
  a `src/` entry (e.g. `src/slugify.ts` + `src/index.ts`), and a test file. Because
  the intent says **zero runtime deps**, only dev-time tooling (a test runner /
  TypeScript) may be added — no runtime `dependencies`.
- **No dependency graph to reason about.** Risk of breaking other modules is zero;
  the only contract is the public `slugify(title: string): string` signature and the
  three done-predicates.
- **Clean baseline for the tournament.** Each specimen starts from the same empty
  slate in its own worktree, so cross-specimen diff comparison is purely about the
  implementation of one function plus its scaffolding — no confounding legacy diff.

## Concrete implications for the slice contract

- Public API: a single named export `slugify(title: string): string`, pure and
  deterministic (no I/O, no time, no randomness, no global mutation).
- File layout to create from zero: `package.json`, `tsconfig.json`,
  `src/slugify.ts` (logic), `src/index.ts` (re-export), and a test file.
- The function must satisfy the three intent predicates exactly:
  `'Hello World' -> 'hello-world'`, `'A, B & C!' -> 'a-b-c'`, `'' -> ''`.
- TypeScript strict mode is a free, zero-cost convention to adopt given the blank
  slate; recommend it so the type of the single string arg/return is enforced.

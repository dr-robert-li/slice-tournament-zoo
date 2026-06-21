---
summary: "Ground-truth validation of slugify prior-art + internal-codebase research. 14 claims checked: 13 confirmed by running node (Unicode NFKD diacritic strip, the 3 intent predicates, double-hyphen/edge-trim/empty/digit/underscore/idempotence pitfalls) and by ls/find/git on /tmp/stz-live (greenfield, git exit 128, 3 done-predicates in intent.json). 1 confirmed-with-caveat: internal scan understated the .stz scaffolding contents but the core greenfield claim holds. 0 refuted, 0 unverifiable."
validator: stz-validator
checked_at: 2026-06-21
---

# Ground-Truth Validation: Research Claims

Method: claims verified the hard way where cheap — actual `node` execution for JS/Unicode
behaviour, and `ls`/`find`/`git` for repo-state claims. Verdict per claim with evidence pointer.

## External research (slugify-priorart.md)

| # | Claim | Verdict | Evidence |
|---|-------|---------|----------|
| E1 | `'café'.normalize('NFKD').replace(/[̀-ͯ]/g,'')` yields `'cafe'` | confirmed | `node -e` ran it → `"cafe"` (PASS) |
| E2 | `'naïve'` → `'naive'` via same NFKD + Mn-strip idiom | confirmed | `node -e` → `"naive"` (PASS) |
| E3 | Predicate 1: full pipeline `slugify('Hello World') === 'hello-world'` | confirmed | `node -e` pipeline → `"hello-world"` (PASS) |
| E4 | Predicate 2: `slugify('A, B & C!') === 'a-b-c'` (runs collapse, trailing `!` trimmed) | confirmed | `node -e` pipeline → `"a-b-c"` (PASS); also direct snippet `.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+\|-+$/g,'')` → `"a-b-c"` |
| E5 | Predicate 3: `slugify('') === ''` | confirmed | `node -e` pipeline → `""` (PASS) |
| E6 | Double-hyphen pitfall: collapsing run `[^a-z0-9]+` gives `'a, b'` → `'a-b'` (not `a--b`) | confirmed | `node -e` → `"a-b"` (PASS) |
| E7 | Edge-trim: `'!hello!'` → `'hello'` (leading/trailing hyphens removed) | confirmed | `node -e` → `"hello"` (PASS) |
| E8 | All-punctuation `'!!!'` → `''` (not `'-'`) | confirmed | `node -e` → `""` (PASS) |
| E9 | Digits survive: `'Top 10'` → `'top-10'` | confirmed | `node -e` → `"top-10"` (PASS) |
| E10 | Underscore is a separator under `[^a-z0-9]+`: `'a_b'` → `'a-b'` | confirmed | `node -e` → `"a-b"` (PASS) |
| E11 | Idempotence: `slugify(slugify(x)) === slugify(x)` | confirmed | `node -e` on `'Héllo, World!'` → both `"hello-world"` (PASS) |
| E12 | Zero-dep core feasible (only `String.prototype.normalize` + regex needed) | confirmed | entire pipeline above ran in plain `node` with no imports |

## Internal research (codebase.md)

| # | Claim | Verdict | Evidence |
|---|-------|---------|----------|
| I1 | Repo is greenfield: no application source, no tests, no build config, no package manifest, no tsconfig, no prior commits | confirmed | `find /tmp/stz-live` shows only `.stz/` + top-level `intent.json`/`project.json`; `find ... -name '*.ts' -o -name 'package.json' ...` outside `.stz` → none |
| I2 | `git status` returns exit 128 (no initialized/committed tree) | confirmed | ran `git status >/dev/null 2>&1; echo exit=$?` → `exit=128` |
| I3 | Intent defines exactly the 3 done-predicates `'Hello World'→'hello-world'`, `'A, B & C!'→'a-b-c'`, `''→''` | confirmed | `cat .stz/00-intent/intent.json` → `donePredicates` array has ids lower-hyphen / strip-punct / empty matching those exprs |
| I4 | `.stz/` holds *only* `00-intent/intent.json`, `intent.md`, and `project.json` | confirmed-with-caveat | `find` shows additional scaffolding the scan omitted: `00-intent/elicitation.md`, `00-intent/project.md`, plus empty dirs `20-standards/`, `30-tests/held-out/`, `40-slices/`, `50-pressure/`, `90-audit/` (with `project-state.json`). The *core* claim (no source/tests/build artifacts to integrate) still holds; only the enumeration of harness files is understated. |

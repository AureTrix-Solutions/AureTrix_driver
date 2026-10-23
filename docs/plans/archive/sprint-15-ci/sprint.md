# SPRINT: sprint-15-ci

**GOAL:** Add a GitHub Actions CI workflow (npm ci → typecheck → lint → build, Node 22, informational only) and align commit-message conventions across CLAUDE.md and .github/CONTRIBUTING.md.
**DONE-CRITERIA (sprint):** `.github/workflows/ci.yml` exists with the 4 commands pinned to Node 22 on push (main only) + pull_request; CONTRIBUTING.md PR checklist carries the CI line; CLAUDE.md :82 speaks Conventional Commits (with `<sprint>: <task>` note kept).
**Started:** 2026-10-23  ·  **Closed:** 2026-10-23  ·  **Status:** CLOSED
**Tasks:** 3 (all DONE)  ·  **Signed off by PO:** 2026-10-23
<!-- rev1 (2026-10-23): PO directive — push trigger scoped to branches [main] only (WIP sprint-branch pushes carry intentional non-passing ratchet states); pull_request stays unfiltered. Task 1 spec + Done-when updated. -->

## Checkpoint
- Branch: `sprint-15-ci`
- tsc baseline: 0 errors (docs/tsc-baseline.txt) — this sprint touches no .ts/.vue; self-check gate stays at 0, no re-baseline expected.
- Cleanup (from actual `ls`, 2026-10-23, post-Task-2): `.scratch/` contains pm-notes.md + review-notes.md (PM/Reviewer's own; PO may delete) · `_to_delete/` empty. Nothing for PO to `git rm`.

## ▶ RUN THIS
ALL TASKS DONE — awaiting PO sign-off. Tasks 1 (CI workflow, Reviewer PASS), 2 (CONTRIBUTING CI line), 3 (CLAUDE.md commit style) all complete. Route to PM-close for PO sign-off. Stop.

## Tasks

1. **Create .github/workflows/ci.yml** — [high-stakes] — STATUS: DONE
   - ✓ 2026-10-23 Reviewer PASS (0 fails; verbatim vs spec confirmed, all 8 greps ×1, typecheck exit 0) — docs/plans/archive/sprint-15-ci/review-ci-workflow.md
   - Done when: `ls .github/workflows/ci.yml` exists (dir is NEW — grep-confirmed absent today).
   - Done when: each of `grep -F "node-version: 22"`, `grep -F "npm ci"`, `grep -F "npm run typecheck"`, `grep -F "npm run lint"`, `grep -F "npm run build"`, `grep "push:"`, `grep -F "branches: [main]"`, `grep "pull_request:"` against the file returns ≥1 hit.
   - Done when: file content matches the spec below EXACTLY (verbatim transcription; Reviewer diffs against this spec — YAML indentation is the failure mode grep can't catch).
   - Files: `.github/workflows/ci.yml` (create)
   - Spec — write EXACTLY this (2-space indentation as shown):
     ```yaml
     name: CI

     on:
       push:
         branches: [main]
       pull_request:

     jobs:
       build:
         runs-on: ubuntu-latest
         steps:
           - uses: actions/checkout@v4
           - uses: actions/setup-node@v4
             with:
               node-version: 22
               cache: npm
           - run: npm ci
           - run: npm run typecheck
           - run: npm run lint
           - run: npm run build
     ```
   - PM-verified facts (Worker applies, never re-derives):
     - package.json scripts grep-confirmed: `typecheck` = "vue-tsc --noEmit", `lint` = "eslint .", `build` = "vite build" — all three names verbatim in the workflow are correct.
     - `package-lock.json` exists at root → `npm ci` and `cache: npm` are valid.
     - `.github/workflows` does NOT exist yet; path is not gitignored (`git check-ignore` exit 1).
     - Local dev node is v22.23.2 — the Node 22 pin matches the environment.
     - Scope: informational only — NO branch-protection changes, no other workflow files.
     - Push trigger scoped to `main` only (PO rev1): WIP sprint-branch pushes carry intentionally non-passing intermediate ratchet states — unfiltered push would flood red. `pull_request:` stays unfiltered so every PR is checked.
   - Self-check gate: SKIPPED (no .ts/.vue touched). Still run `npm run typecheck` once and record exit 0 in the checkpoint (baseline sanity, expected 0).
   - Commit: `sprint-15-ci: task 1 — add CI workflow (.github/workflows/ci.yml)`; then IN-REVIEW: write docs/plans/reviews/review-ci-workflow.md (goal line + the 3 Done-when criteria + base/head hashes + note to Reviewer: diff the file against the Task 1 spec block above verbatim).

2. **Add CI line to CONTRIBUTING.md PR checklist** — [trivial] — STATUS: DONE
   - ✓ 2026-10-23 (commit 36c146c) — all Done-when pass: 7 checkboxes; CI line inside PR Checklist; v18 untouched.
   - Done when: `grep -c "^- \[ \] " .github/CONTRIBUTING.md` returns 7 (was 6).
   - Done when: `grep -nF "CI checks" .github/CONTRIBUTING.md` hits inside the PR Checklist section, and `grep -nF "v18 or higher" .github/CONTRIBUTING.md` still hits (prerequisite untouched).
   - Files: `.github/CONTRIBUTING.md` (ONE edit-site; do NOT rewrite the file)
   - Spec: after the EXACT line (grep-confirmed, last checkbox of "### PR Checklist"):
     `- [ ] PR description explains the changes and motivation`
     insert one line:
     `- [ ] CI checks (typecheck, lint, build) pass before review`
   - PM-verified: commit-message section already Conventional Commits — leave unchanged (PO directive). Node "v18 or higher" — leave unchanged (PO directive).
   - Commit: `sprint-15-ci: task 2 — CONTRIBUTING PR checklist gains CI-pass line`; collapse to ✓.

3. **CLAUDE.md :82 → Conventional Commits vocabulary** — [trivial] — STATUS: DONE
   - ✓ 2026-10-23 — one edit-site at :82; all Done-when pass: `Add: ...`=0, `Conventional Commits`=1, `<sprint>: <task>`=2, line ends `see Git & commits).`.

## Findings (raw — PM routes at close)
- ci.yml pins actions/checkout@v4 + actions/setup-node@v4 by tag, not commit SHA — fine for informational CI; verify in .github/workflows/ci.yml if a SHA-pinning policy is ever adopted. (Reviewer task 1, non-defect)

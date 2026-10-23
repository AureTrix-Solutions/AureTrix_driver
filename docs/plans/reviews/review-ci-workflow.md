# REVIEW: ci-workflow

**SPRINT GOAL:** Add a GitHub Actions CI workflow (npm ci → typecheck → lint → build, Node 22, informational only) and align commit-message conventions across CLAUDE.md and .github/CONTRIBUTING.md.
**TASK:** Create .github/workflows/ci.yml  ·  **TAG:** [high-stakes]
**DONE WHEN:**
- `ls .github/workflows/ci.yml` exists (dir is NEW — grep-confirmed absent at plan time).
- Each of `grep -F "node-version: 22"`, `grep -F "npm ci"`, `grep -F "npm run typecheck"`, `grep -F "npm run lint"`, `grep -F "npm run build"`, `grep "push:"`, `grep -F "branches: [main]"`, `grep "pull_request:"` against the file returns ≥1 hit.
- File content matches the spec in current-sprint.md Task 1 EXACTLY (verbatim transcription; YAML indentation is the failure mode grep can't catch).

## 📝 Worker notes & self-check
- Created `.github/workflows/ci.yml` verbatim from the Task 1 spec: name CI; push→branches:[main] + unfiltered pull_request; single `build` job on ubuntu-latest; actions/checkout@v4, actions/setup-node@v4 with node-version: 22 + cache: npm; then npm ci / typecheck / lint / build as `- run:` steps.
- All 8 Done-when greps return exactly 1 hit each. `cat -A` confirms 2-space indentation, LF endings, no tabs.
- Self-check vs sdk-reference-v2.md: N/A — no SDK surface touched.
- Design intent preserved: filters:[] ☐ N/A · usagePage 65440 ☐ N/A · wrappers return Error ☐ N/A (no source touched).
- typecheck/build: gate SKIPPED (no .ts/.vue changes). Baseline sanity `npm run typecheck` run anyway → exit 0, 0 errors, no re-baseline. `npm run build` not run (workflow file cannot affect it).

## 🔍 Commits to review
Base: `92e0790` (branch point / PM rev1)   Head: `b5ad9d7` (this task)
Fix-round ranges (added on each re-review): —

## 🖥️ Hardware check ([hw] tasks only)
N/A — not a [hw] task.

## ❓ Reviewer, please confirm
- [ ] meets every "DONE WHEN" criterion above
- [ ] diff scope matches the task (no stray files)
- [ ] no design-intent violation
- [ ] typecheck/build gate met where it applies (no newly introduced errors; unmasked ones recorded/deferred) — or N/A
- [ ] tag is correct (high-stakes where required) — else auto-FAIL

---
## ✅ REVIEWER VERDICT
**Result:** —  ·  **Date:** —  ·  **Fail count:** —

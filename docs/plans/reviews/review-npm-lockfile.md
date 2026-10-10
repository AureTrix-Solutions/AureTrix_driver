# REVIEW: npm-lockfile

**SPRINT GOAL:** Finish the pnpm→npm migration: package.json, lockfiles, and contributor docs all speak npm and point at the AureTrix-Solutions repo.
**TASK:** package.json + lockfile migration  ·  **TAG:** [high-stakes]
**DONE WHEN:**
- package.json has no `packageManager` key and no `pnpm` dependency; `grep -c pnpm package-lock.json` → 0; `npm install` and `npm run build` succeed; `npm run typecheck` ≤ 23 errors (baseline unchanged — no source touched).
- `pnpm-lock.yaml` and `pnpm-workspace.yaml` moved via `git mv` into `_to_delete/` (create the dir); checkpoint's Cleanup line reports from actual `ls`.

## 📝 Worker notes & self-check
- Removed `"packageManager": "pnpm@10.17.0"` key and `"pnpm": "^10.17.1"` dependency from package.json.
- `git mv pnpm-lock.yaml pnpm-workspace.yaml _to_delete/` (dir created); ran `npm install` → lockfile regenerated: "added 61 packages, removed 1 package" (removed pnpm; 61 added = pnpm's transitive deps replaced by npm-resolved tree).
- Self-check vs sdk-reference-v2.md: N/A — no SDK/API claims; no source (.ts/.vue) touched.
- Design intent preserved: N/A — filters:[] / usagePage 65440 / wrapper error-return semantics untouched.
- typecheck/build: typecheck = 23 errors (= baseline, unchanged); `npm run build` passed (✓ built in 1.67s); `grep -c pnpm package-lock.json` → 0.
- Note: `npm install` reported 3 vulnerabilities (1 moderate, 2 critical). Left as-is — out of task scope; `npm audit fix --force` would change dependency versions beyond the migration's remit.

## 🔍 Commits to review
Base: `6f658d6` (PM-open commit)   Head: `3f9fbe3` (this task)
<!-- Reviewer runs this itself — do NOT paste the diff here:
       git diff --stat <base>..<head>     then      git diff <base>..<head>
     A file touched outside this task's scope is a flag. -->
Fix-round ranges (added on each re-review):

## 🖥️ Hardware check ([hw] tasks only)
N/A — not a [hw] task.

## ✅ Reviewer verdict
- VERDICT: — [PASS | FAIL]
- Findings:

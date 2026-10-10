# REVIEW: <task-slug>

<!-- WORKER fills everything above the verdict line. REVIEWER fills the verdict section.
     The PO's hardware verdict is RECORDED BY AN AGENT from the PO's plain-language outcome —
     the PO does not hand-edit this file. -->

**SPRINT GOAL:** <one line — copied from current-sprint.md>
**TASK:** <this task's one-line title>  ·  **TAG:** [high-stakes] (+ [hw] if applicable)
**DONE WHEN:**
- <criterion 1>
- <criterion 2>
<!-- If a criterion is revised after this file exists, UPDATE it here too — the Reviewer judges
     this file, not current-sprint.md. -->

## 📝 Worker notes & self-check
- <what was done, in 1–3 bullets>
- Self-check vs sdk-reference-v2.md: <section(s) checked, result>
- Design intent preserved: filters:[] ☐ · usagePage 65440 ☐ · wrappers return Error ☐
- typecheck/build: <results if the gate is active and this touched .ts/.vue — else "N/A">
  <!-- Gate = NO newly introduced errors. Unmasked pre-existing errors are expected — record &
       defer, never silence with !/as any. Note the before→after count and the reconciliation. -->

## 🔍 Commits to review
Base: `<hash>` (branch point / last reviewed)   Head: `<hash>` (this task)
<!-- Reviewer runs this itself — do NOT paste the diff here:
       git diff --stat <base>..<head>     then      git diff <base>..<head>
     A file touched outside this task's scope is a flag. -->
Fix-round ranges (added on each re-review): <base2>..<head2>, ...

## 🖥️ Hardware check ([hw] tasks only)
**Worker fills (what to test):**
- What changed (that touches hardware behavior): <plain language>
- What to verify: <plain language — what the PO should look at; not a scripted checklist>

**Hardware verdict (agent records from the PO's plain-language outcome):**
- Hardware verdict: PASS — <date>        (that's all a PASS needs; add a note only if useful)
  or: FAIL — <date> → see F1              (symptom written once, in the F1 block below)
<!-- The PO states "hardware passed" / "hardware failed: <symptom>"; an agent does the mechanics:
     PASS → set the task to DONE in current-sprint.md, advance ▶ RUN THIS, commit.
     FAIL → put the symptom in an Fn block below, set the task to IN-PROGRESS,
            add "fix ONLY this — see review-<slug>.md §Fn" to ▶ RUN THIS, commit.
     The verdict must land on disk before any fix session. The Reviewer never writes DONE for [hw]. -->

## ❓ Reviewer, please confirm
- [ ] meets every "DONE WHEN" criterion above
- [ ] diff scope matches the task (no stray files)
- [ ] no design-intent violation
- [ ] typecheck/build gate met where it applies (no newly introduced errors; unmasked ones recorded/deferred) — or N/A
- [ ] tag is correct (high-stakes where required) — else auto-FAIL

---
## ✅ REVIEWER VERDICT
<!-- After ONE verification pass, RULE. Don't keep investigating. A runtime/behavior question goes
     to the PO hardware check, not more static analysis. Output = PASS/FAIL + findings + your own
     Findings one-liners (into current-sprint.md). Do NOT plan task order/parallelism. -->
**Result:** PASS / PASS (pending hw) / FAIL  ·  **Date:** YYYY-MM-DD  ·  **Fail count:** <n>

<!-- PASS (non-hw): one line confirming criteria met; flip task to DONE + advance ▶ RUN THIS.
     PASS (pending hw): flip task to HW-TEST (never DONE); PO does the hands-on check above.
     FAIL: list each failed item below with full detail. Then append a short checklist to
     current-sprint.md ▶ RUN THIS, one bullet per item, each citing its §Fn here. -->

### Failed items (FAIL only)
**F1 — <short title>**
- Where: `src/file.ts:NN`
- Expected: <...>
- Actual: <...>
- Detail / trace:
```
<stack trace or exact syntax problem>
```

**F2 — <short title>**
- ...
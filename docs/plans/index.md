# Sprint Index

One line per sprint, newest last. NN never reused.
Status tokens: `signed off` = closed, not yet merged · `merged` = on main · `abandoned` = branch deleted unmerged.
(PM writes `signed off` at close; PO flips to `merged` when merging the branch.)

| NN | slug | goal | status | closed | archive |
|----|------|------|--------|--------|---------|
| 00 | sdk-reference | Build & verify docs/sdk-reference-v2.md; retire old SDK docs (direct on main, pre-workflow) | merged | 2026-10-08 | — |
| 01 | code-fixes | SDK integration cleanup: typecheck infra, variant-P import fix, wrapper skill, type-error cleanup | merged | 2026-10-09 | archive/sprint-01-code-fixes/ |
| 02 | npm-cleanup | Finish the pnpm→npm migration: package.json, lockfiles, contributor docs all speak npm and point at AureTrix-Solutions | merged | 2026-10-09 | archive/sprint-02-npm-cleanup/ |
| 03 | docs-sdk-ref-fix | sdk-reference-v2.md §13.7 states the verified truth about `configs` reachability and carries the current repo state | merged | 2026-10-10 | archive/sprint-03-docs-sdk-ref-fix/ |
| 04 | sdk-skill-clean | Verify every claim in the sdk-wrapper skill against current source and trim it to the tight pattern+checklist (89 ≤ 100 lines) | merged | 2026-10-11 | archive/sprint-04-sdk-skill-clean/ |
| 05 | docs-comment-cleanup | Clear verified low-hanging doc/comment backlog: Debug.md export purge, serialNumber known-limitation comments + resolved decision, deviceStillPresent comment coverage | merged | 2026-10-11 | archive/sprint-05-docs-comment-cleanup/ |
| 06 | root-types | Root type imports from @sparklinkplayjoy/protocol-keyboard resolve (tsconfig paths remap); unmasked error absorbed, baseline 23; sdk-reference + sdk-wrapper skill record fixed state | merged | 2026-10-11 | archive/sprint-06-root-types/ |
| 07 | tsc-errors | tsc baseline 23 → 0: *.vue ambient shim + persist.paths → persist.pick (v4) in both stores; baseline file at 0 | merged | 2026-10-11 | archive/sprint-07-tsc-errors/ |
| 08 | types-dedupe | src/types/types.ts derives from SDK types (IDefKeyInfo via protocol-keyboard root import; DksLayoutType/DksType re-exported type-only deep import); 13 consumers untouched | signed off | 2026-10-11 | archive/sprint-08-types-dedupe/ |

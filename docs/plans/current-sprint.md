# SPRINT: sprint-27-docs-pages-verify-2

**GOAL:** Reconcile docs/pages/LayoutPreview.md with src/pages/LayoutPreview.vue — document the shipped custom-layouts feature (IndexedDB optgroup, loadCustomLayouts, productName selection) and fix all stale snippets/prose.
**DONE-CRITERIA (sprint):** All Task 1a–1d Done-when greps pass; Reviewer PASS over cumulative base..head; doc hands off free of inline-fixable defects.
**Started:** 2026-11-01  ·  **Status:** IN PROGRESS
<!-- revN (YYYY-MM-DD): <what changed>   ← log revisions here, newest last -->

## Checkpoint
- Branch: `sprint-27-docs-pages-verify-2`
- tsc baseline: N/A — docs-only sprint, code self-check gate SKIPPED (baseline file currently 0). Inline-defect duty still applies.
- Cleanup (from actual ls): `.scratch/` has pm-notes.md + review-notes.md (review-notes.md is stale sprint-26 leftover; PO may delete both freely). `_to_delete/` empty.

## ▶ RUN THIS
Next: Task 1c — LayoutPreview.md: insert NEW "Load Custom Layouts" subsection (Edit 5) + renumber/replace Restore snippet (Edit 6). Do this task, commit, advance this block to 1d, then stop.

## Tasks
1. **LayoutPreview.md ↔ LayoutPreview.vue reconciliation** — [high-stakes] — STATUS: IN-PROGRESS
   - Checkpoint (1b DONE): Edits 3+4 applied verbatim via Edit tool (getKeyStyle → CSSProperties/layoutData/rowLength guard; updateLayout → productName/keyCount split + 6-param getLayoutConfig). Done-when all pass: `selectedLayout.value ?? 82` → nothing; `rowLength` → 2; `getLayoutConfig(keyCount` → 1 (doc now 359 lines). base=a846953 for review file. Committed. Next: 1c.
   - Sequential sub-tasks 1a→1b→1c→1d, each with its OWN commit + Done-when greps. Parent stays IN-PROGRESS until 1d; then Worker → IN-REVIEW + writes `docs/plans/reviews/review-layout-preview-docs.md` (base = this PM-open commit — `git rev-parse HEAD` at 1a start; head = the 1d commit). Reviewer runs ONCE at the end over cumulative base..head.
   - Files: edit ONLY `docs/pages/LayoutPreview.md`. Source of truth (READ-ONLY): `src/pages/LayoutPreview.vue`. Read each file ONCE.
   - All replacement text below is grep/awk-verified against src this session — apply VERBATIM. Code-snippet formatting may stay condensed, but identifiers/values must match src exactly.
   - Doc line refs are as of PM-open (368 lines, no edits yet); they drift after 1a — locate blocks by their unique anchor text, not line number.

   **1a — Component Setup + gridStyle snippets (2 edits, ~28 new lines)**
   - Edit 1: replace the `setup() { ... }` body inside the ```vue fence under `### Component Setup` (anchor: `const layout = ref<any[][]>([]);`, doc:61-68 — the `<script lang="ts">` line through the `</script>` line) with:
     ```
     <script lang="ts">
     import { getLayoutConfig, refreshCustomLayouts } from '@utils/layoutConfigs';
     import LayoutStorageService, { type CustomLayoutConfig } from '@/services/LayoutStorageService';

     setup() {
       const layout = ref<number[][][]>([]);
       const selectedLayout = ref<number | string | null>(null); // Number or productName string
       const layouts = [61, 67, 68, 80, 82, 84, 87];
       const customLayouts = ref<CustomLayoutConfig[]>([]);

       const layoutData = ref<ReturnType<typeof getLayoutConfig>>({ rows: 0, cols: 0, keyPositions: [], gaps: [] });
       ...
     }
     </script>
     ```
     (src:54-66. Note the outer fence stays ```vue; the block includes its own `<script lang="ts">` wrapper lines exactly as the current doc does.)
   - Edit 2: replace the gridStyle ```typescript block under `#### 1. **Grid Style Calculation**` (anchor: `getLayoutConfig(selectedLayout.value ?? 82)`, doc:75-99) with:
     ```
     const gridStyle = computed<CSSProperties>(() => {
       const { keyPositions, gaps } = layoutData.value;
       if (!keyPositions || keyPositions.length === 0) {
         return { height: '0px', width: '0px' } as CSSProperties;
       }
       const containerHeight = keyPositions.reduce((max: number, row: number[][], i: number) => max + Math.max(...row.map((pos: number[]) => pos[1] + pos[3])) + (gaps[i] || 0), 0);
       const maxRowWidth = Math.max(...keyPositions.map((row: number[][]) => row.reduce((sum: number, pos: number[]) => sum + pos[2], 0)));
       return {
         position: 'relative',
         height: `${containerHeight}px`,
         width: `${maxRowWidth}px`,
         margin: '0 auto',
       };
     });
     ```
     (src:69-82 verbatim — keep the two reduce lines single-line exactly as source, even though they are long.)
   - Done when: `grep -n 'ref<any' docs/pages/LayoutPreview.md` returns nothing
   - Done when: `grep -c 'layoutData' docs/pages/LayoutPreview.md` prints `2`
   - Done when: `grep -c 'selectedLayout.value ?? 82' docs/pages/LayoutPreview.md` prints `2` (getKeyStyle + updateLayout remain until 1b)

   **1b — getKeyStyle + updateLayout snippets (2 edits, ~27 new lines)**
   - Edit 3: replace the getKeyStyle ```typescript block under `#### 2. **Key Style Calculation**` (anchor: second `getLayoutConfig(selectedLayout.value ?? 82)`, doc:104-125) with:
     ```
     const getKeyStyle = (rowIdx: number, colIdx: number): CSSProperties => {
       const { keyPositions, gaps } = layoutData.value;
       const rowLength = keyPositions[rowIdx]?.length || 0;
       if (!keyPositions || !keyPositions[rowIdx] || !Array.isArray(keyPositions[rowIdx]) || colIdx >= rowLength) {
         return { width: '0px', height: '0px', left: '0px', top: '0px' } as CSSProperties;
       }
       const [left, top, width, height] = keyPositions[rowIdx][colIdx];
       const topGapPx = gaps[rowIdx] || 0;
       return {
         position: 'absolute',
         left: `${left}px`,
         top: `${top + topGapPx}px`,
         width: `${width}px`,
         height: `${height}px`,
         backgroundColor: '#444',
         boxSizing: 'border-box',
       };
     };
     ```
     (src:84-101.)
   - Edit 4: replace the updateLayout ```typescript block under `#### 3. **Update Layout**` (anchor: `getLayoutConfig(selectedLayout.value ?? 82)` inside `const updateLayout`, doc:130-137) with:
     ```
     const updateLayout = () => {
       const productName = typeof selectedLayout.value === 'string' ? selectedLayout.value : undefined;
       const keyCount = typeof selectedLayout.value === 'number' ? selectedLayout.value : 82;

       const config = getLayoutConfig(keyCount, undefined, undefined, undefined, undefined, productName);
       layoutData.value = config;
       layout.value = config.keyPositions;
       localStorage.setItem('lastSelectedLayout', selectedLayout.value?.toString() ?? '82');
     }
     ```
     (src:104-112. getLayoutConfig's 6-param signature verified: layoutConfigs.ts:119.)
   - Done when: `grep -n 'selectedLayout.value ?? 82' docs/pages/LayoutPreview.md` returns nothing
   - Done when: `grep -n 'rowLength' docs/pages/LayoutPreview.md` returns ≥1 line
   - Done when: `grep -c 'getLayoutConfig(keyCount' docs/pages/LayoutPreview.md` prints `1`

   **1c — NEW Load Custom Layouts subsection + Restore snippet (2 edits, ~32 new lines)**
   - Edit 5: insert the following 11 lines VERBATIM (from the `#### 4.` heading line through the code block's closing triple-backtick line) between the updateLayout block and the `#### 4. **Restore from localStorage**` heading:
     ````
     #### 4. **Load Custom Layouts**
     ```typescript
     const loadCustomLayouts = async () => {
       try {
         customLayouts.value = await LayoutStorageService.getAllLayouts();
         await refreshCustomLayouts();
       } catch (error) {
         console.warn('Failed to load custom layouts:', error);
       }
     };
     ```
     ````
     (src:115-122. getAllLayouts + CustomLayoutConfig verified: LayoutStorageService.ts:77/:3-6; refreshCustomLayouts verified: layoutConfigs.ts:241-243.)
   - Edit 6: renumber heading `#### 4. **Restore from localStorage**` → `#### 5. **Restore from localStorage**` and replace its ```typescript block (anchor: `onMounted(() => {`, doc:142-152) with:
     ```
     onMounted(async () => {
       await loadCustomLayouts();

       const savedLayout = localStorage.getItem('lastSelectedLayout');
       if (savedLayout) {
         // Check if it's a custom layout
         const isCustom = customLayouts.value.some(layout => layout.productName === savedLayout);
         if (isCustom) {
           selectedLayout.value = savedLayout;
         } else if (layouts.includes(parseInt(savedLayout))) {
           selectedLayout.value = parseInt(savedLayout);
         } else {
           selectedLayout.value = 82; // Fallback
         }
       } else {
         selectedLayout.value = 82; // Fallback
       }

       await updateLayout();
     });
     ```
     (src:125-144.)
   - Done when: `grep -c 'loadCustomLayouts' docs/pages/LayoutPreview.md` prints `2`
   - Done when: `grep -n 'isCustom' docs/pages/LayoutPreview.md` returns ≥1 line
   - Done when: `grep -c 'onMounted(async' docs/pages/LayoutPreview.md` prints `1`
   - Done when: `grep -n '#### 5\. \*\*Restore' docs/pages/LayoutPreview.md` returns exactly 1 line

   **1d — prose/diagram point edits (9 edits, ~20 new lines)**
   - Edit 7 (Key Features §1, doc:16): `- Seven supported layouts:` → `- Seven built-in layouts:` and after the `87-key` bullet (doc:23) add: `- Plus user-created custom layouts (IndexedDB, created in the Layout Creator page)`
   - Edit 8 (Key Features §2 Layout Selector, after doc:28): add `- Custom layouts appear in a "Custom Layouts" optgroup when present`
   - Edit 9 (UI Elements → Layout Selector, after doc:48 `Dropdown showing sizes…`): add `  - "Custom Layouts" optgroup (rendered only when custom layouts exist), each option valued by productName`
   - Edit 10 (Dependencies → Utilities, after the getLayoutConfig sub-bullets doc:160): add `- **refreshCustomLayouts** (\`@utils/layoutConfigs\`): reloads the module-level custom-layout cache from IndexedDB` and a new `### Services` block before `### Storage`: `- **LayoutStorageService** (\`@/services/LayoutStorageService\`): \`getAllLayouts()\` returns \`CustomLayoutConfig[]\` (custom layouts from IndexedDB)`
   - Edit 11 (Dependencies → Storage, doc:165): `- Value: Layout number as string (e.g., "82")` → `- Value: Built-in layout number (e.g., "82") or custom layout productName, as string`
   - Edit 12 (Data Flow diagram, doc:169-200 — 3 targeted line edits, NOT a full rewrite):
     a. Replace `onMounted() - Restore saved layout preference` (doc:172) with `onMounted() (async) - loadCustomLayouts() first, then restore preference`;
     b. Replace `If valid: Set selectedLayout to saved value` + `Else: Default to 82` (doc:176-177) with `If saved value matches a custom productName: restore it as string` / `Else if valid built-in number: restore as number` / `Else: Default to 82`;
     c. Replace `getLayoutConfig(selectedLayout)` (doc:181) with `getLayoutConfig(keyCount, ..., productName) → layoutData` and `Fetch new layout config` (doc:195) with `Fetch new layout config (built-in by keyCount, custom by productName)`.
   - Edit 13 (State Persistence → What's Saved, doc:285): `- **Last selected layout**: Layout number (61, 67, etc.)` → `- **Last selected layout**: built-in layout number (61, 67, etc.) or custom layout productName`; and What's Not Saved (doc:288) `- Layout configurations themselves (static, from code)` → `- Layout configurations themselves (built-ins from code; custom layouts live in IndexedDB via LayoutStorageService)`
   - Edit 14 (Error Handling → Invalid Saved Layout, doc:299): `- If stored value not in \`layouts\` array, defaults to 82` → `- If stored value matches a custom layout productName, it is restored; else if not in \`layouts\` array, defaults to 82`
   - Edit 15 (Future Enhancements, doc:354): DELETE line `- Custom layout editor` (shipped as the Layout Creator page — pure deletion)
   - Edit 16 (Developer Notes, doc:363): `- Can add new layouts by updating \`layouts\` array and \`layoutConfigs.ts\`` → `- Built-in layouts: add to \`layouts\` array + \`layoutConfigs.ts\`. Custom layouts: created in Layout Creator, stored in IndexedDB, resolved by productName (Priority 1 in getLayoutConfig)`
   - Done when: `grep -n 'Custom layout editor' docs/pages/LayoutPreview.md` returns nothing
   - Done when: `grep -n 'optgroup' docs/pages/LayoutPreview.md` returns ≥1 line
   - Done when: `grep -c 'LayoutStorageService' docs/pages/LayoutPreview.md` prints ≥2
   - Done when: `grep -n 'getLayoutConfig(selectedLayout' docs/pages/LayoutPreview.md` returns nothing

   **After 1d (still Task 1):** fix any inline defects found (typos/dead links), set Task 1 → IN-REVIEW, write `docs/plans/reviews/review-layout-preview-docs.md` from docs/plans/templates/review-template.md: sprint goal (one line), all 1a–1d Done-when criteria, Base = HEAD when 1a started, Head = final 1d commit. Commit. Stop.

## Context for the Worker (verified facts, do not re-derive)
- src/pages/LayoutPreview.vue = defineComponent+setup (NOT `<script setup>`), 245 lines. selectedLayout is `number | string | null` — string = custom productName, number = built-in keyCount.
- getLayoutConfig priority (layoutConfigs.ts:119-140): P1 IndexedDB custom by productName → P2 sharedLayout.ts by productName → P3 built-in by keyCount. LayoutPreview exercises P1+P3 only.
- Return block exposes: layout, selectedLayout, layouts, customLayouts, gridStyle, getKeyStyle, updateLayout (layoutData and loadCustomLayouts are internal).
- Template select: built-in options `{{count}}-key`, then `<optgroup v-if="customLayouts.length > 0" label="Custom Layouts">` with `:value="customLayout.productName"` (src:18-29).
- Doc parts verified ACCURATE — do NOT touch: Overview/Purpose prose, .key-preview SCSS block, min-height 200px, localStorage key name, 82 fallback, layouts array values, keyPositions/gaps structure section, Positioning Logic, Performance/Accessibility/Styling Highlights/Known Limitations. Doc has no Last Updated footer.

## Findings
(empty — append ONE line per out-of-scope defect/idea: what + where to verify)

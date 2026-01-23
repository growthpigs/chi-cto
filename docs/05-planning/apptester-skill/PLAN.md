# AppTester Skill Design

**Class:** 1 Grade 3 (Skill + MCP Integration) ← Corrected from 4 after validation
**Primary Tool:** Claude in Chrome (visual + interactive testing)
**Relationship:** Integrated with FeatureBuilder (test-fix-verify cycle)
**Validation Score:** 6.5/10 → Addressed in v1.0 scope below

---

## ⚠️ VALIDATION FINDINGS (Addressed)

| Issue | Original Claim | Reality | v1.0 Solution |
|-------|----------------|---------|---------------|
| Class 4 claim | "Closed-loop self-correcting" | No cross-skill invocation mechanism | **Class 3** - manual fix handoff |
| 5 modes | Smoke, Feature, Full, Flow, Regression | Over-engineered for v1.0 | **2 modes only**: Smoke + Full |
| resize_window | Phase 7 responsive testing | Tool doesn't exist | **Skip Phase 7** in v1.0 |
| Fix Mode | Auto-invoke FeatureBuilder | No mechanism exists | Generate fix spec → manual handoff |
| Element inventory | "Click every element" | How? Undefined | Define `querySelectorAll` strategy |
| Evidence naming | "qa-evidence/" | No convention | Define folder/file naming |

---

## Vision

An autonomous QA agent that uses Claude in Chrome to comprehensively test running applications. The key pattern is:

**"Test at the beginning → Fix issues → Prove it works at the end"**

This creates a closed-loop testing cycle:
1. **BUILD** → FeatureBuilder creates the feature
2. **INITIAL QA** → AppTester finds issues (before considering "done")
3. **FIX** → Issues fed back to FeatureBuilder for correction
4. **VERIFY** → AppTester proves it works (regression check)

Think of it as having a dedicated QA engineer who:
- Clicks through every page
- Checks every button, link, and form
- Monitors console logs in real-time
- Watches network requests for failures
- Takes evidence screenshots
- **Correlates with Sentry** for backend exceptions
- Produces professional test reports
- **Triggers fixes** when issues found
- Verifies fixes with proof

**Key Insight:** FeatureBuilder has browser validation as ONE phase (Phase 6). AppTester makes browser testing the ENTIRE focus - deeper, more comprehensive, with fix integration and Sentry correlation.

---

## Use Cases

| Scenario | Example |
|----------|---------|
| **Post-deployment smoke test** | "Test the War Room production app" |
| **Feature validation** | "Test the new client pipeline feature" |
| **Regression testing** | "Check nothing broke after last deploy" |
| **Critical path testing** | "Test the login → dashboard → action flow" |
| **Pre-release QA** | "Full QA pass before we ship" |
| **Bug reproduction** | "Confirm this bug exists, get evidence" |
| **Responsive testing** | "Test on mobile, tablet, desktop viewports" |

---

## Execution Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                      APPTESTER v1.0 FLOW                        │
│                                                                 │
│  Phase 1: SETUP                                                 │
│     └── Verify Chrome extension connected                       │
│     └── Get/create browser tab                                  │
│     └── Navigate to target URL                                  │
│     └── Verify app loads (no blank screen)                      │
│                                                                 │
│  Phase 2: DISCOVER                                              │
│     └── Inventory all pages/routes (via navigation)             │
│     └── Map interactive elements                                │
│     └── Identify forms, buttons, links                          │
│     └── Create test plan based on discovery                     │
│                                                                 │
│  Phase 3: SMOKE TEST                                            │
│     └── Check console for immediate errors                      │
│     └── Check network for failed requests                       │
│     └── Check dev overlay for issues                            │
│     └── Screenshot baseline state                               │
│                                                                 │
│  Phase 4: EXERCISE (Per Page/Feature)                           │
│     └── Click every clickable element                           │
│     └── Fill and submit forms                                   │
│     └── Test navigation (forward, back)                         │
│     └── Trigger hover/focus states                              │
│     └── Monitor console during interactions                     │
│                                                                 │
│  Phase 5: FLOW TEST (Critical Paths)                            │
│     └── Execute user journeys (login → action → logout)         │
│     └── Record as GIF for evidence                              │
│     └── Verify state persistence                                │
│     └── Test error handling paths                               │
│                                                                 │
│  Phase 6: EDGE CASES                                            │
│     └── Empty states (no data scenarios)                        │
│     └── Boundary conditions (long text, many items)             │
│     └── Rapid actions (double-click, spam submit)               │
│     └── Error states (force failures)                           │
│                                                                 │
│  Phase 7: RESPONSIVE ─── SKIPPED IN v1.0 ───                    │
│     └── resize_window tool not available                        │
│     └── Will add in v1.1 when tool is verified/created          │
│                                                                 │
│  Phase 8: REPORT                                                │
│     └── Compile findings                                        │
│     └── Calculate test score                                    │
│     └── Generate evidence package                               │
│     └── Prioritize issues by severity                           │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Test Types & Tools

| Test Type | Claude in Chrome Tool | What It Checks |
|-----------|----------------------|----------------|
| Visual | `computer` (screenshot) | Page renders, layout correct |
| Interactive | `computer` (click, drag) | Buttons work, interactions respond |
| Form | `form_input` | Validation, submission |
| Console | `read_console_messages` | Errors, warnings |
| Network | `read_network_requests` | Failed API calls |
| JavaScript | `javascript_tool` | DOM state, custom checks |
| Flow | `gif_creator` | User journey recording |
| Navigation | `navigate` | Routes accessible |
| Content | `get_page_text` | Text renders correctly |
| Responsive | `resize_window` | Different viewports |

---

## Skill Structure

```
skills/AppTester/
├── SKILL.md                      ← Main skill file
├── tools/
│   ├── discover-app.md           ← Map app structure
│   ├── element-inventory.md      ← Find all interactive elements
│   ├── flow-recorder.md          ← GIF recording helper
│   └── issue-classifier.md       ← Severity classification
├── prompts/
│   ├── setup.md                  ← Phase 1 protocol
│   ├── smoke-test.md             ← Phase 3 checks
│   ├── exercise-page.md          ← Phase 4 per-page testing
│   ├── flow-test.md              ← Phase 5 user journeys
│   ├── edge-cases.md             ← Phase 6 boundary testing
│   ├── responsive.md             ← Phase 7 viewport testing
│   └── test-report.md            ← Phase 8 report format
├── cookbook/
│   ├── common-flows.md           ← Login, CRUD, checkout patterns
│   ├── issue-patterns.md         ← Common issues and fixes
│   ├── evidence-gathering.md     ← Screenshot/GIF best practices
│   └── integration-tests.md      ← With FeatureBuilder/CI
└── templates/
    ├── test-plan.md              ← Auto-generated test plan
    └── test-report.md            ← Final report template
```

---

## Modes of Operation (v1.0: 2 Modes Only)

### 1. Smoke Mode (Quick)
```bash
/test-app https://app.example.com --smoke
```
Runs: SETUP → SMOKE TEST → REPORT
Duration: TBD (measure on first run)
Use for: Quick health check, post-deploy verification

### 2. Full Mode (Comprehensive)
```bash
/test-app https://app.example.com --full
```
Runs: Phases 1-6, 8 (Skip Phase 7 - no resize_window)
Duration: TBD (measure on first run)
Use for: Pre-release QA, comprehensive testing

---

### v1.1 Future Modes (After v1.0 Validated)

| Mode | Phases | Use Case |
|------|--------|----------|
| Feature | 1, 3, 4 (focused), 5, 8 | Test specific feature |
| Flow | 1, 5, 8 | Critical path only |
| Regression | 1, 3, 4 (quick), 5, 8 | Post-change check |
| Responsive | + Phase 7 | When resize tool available |

---

## Report Format

```markdown
╔════════════════════════════════════════════════════════════════╗
║                     APP TEST REPORT                            ║
╠════════════════════════════════════════════════════════════════╣
║ App: [Name/URL]                                                ║
║ Date: [date]                                                   ║
║ Mode: SMOKE / FEATURE / FULL / FLOW / REGRESSION               ║
║ Duration: [X minutes]                                          ║
╠════════════════════════════════════════════════════════════════╣
║ TEST SCORE: X.X / 10                                           ║
║                                                                ║
║ ✅ Passed: XX tests                                            ║
║ ⚠️ Warnings: XX issues                                         ║
║ ❌ Failed: XX critical                                         ║
╠════════════════════════════════════════════════════════════════╣
║ CRITICAL ISSUES (Must Fix)                                     ║
║ 1. [Description] - [Page/Component] - [Evidence]               ║
║ 2. ...                                                         ║
╠════════════════════════════════════════════════════════════════╣
║ WARNINGS (Should Fix)                                          ║
║ 1. [Description] - [Page/Component]                            ║
║ 2. ...                                                         ║
╠════════════════════════════════════════════════════════════════╣
║ PAGES TESTED                                                   ║
║ ✅ /dashboard - 15/15 passed                                   ║
║ ⚠️ /settings - 12/14 passed (2 warnings)                       ║
║ ❌ /reports - 8/12 passed (4 failures)                         ║
╠════════════════════════════════════════════════════════════════╣
║ FLOWS TESTED                                                   ║
║ ✅ Login Flow - PASS (GIF: login-flow.gif)                     ║
║ ✅ Create Client - PASS                                        ║
║ ❌ Export Report - FAIL (network error)                        ║
╠════════════════════════════════════════════════════════════════╣
║ CONSOLE SUMMARY                                                ║
║ Errors: X                                                      ║
║ Warnings: X                                                    ║
║ Notable: [specific messages]                                   ║
╠════════════════════════════════════════════════════════════════╣
║ NETWORK SUMMARY                                                ║
║ Failed Requests: X                                             ║
║ Notable: [specific failures]                                   ║
╠════════════════════════════════════════════════════════════════╣
║ EVIDENCE                                                       ║
║ Screenshots: X captured                                        ║
║ GIFs: X recorded                                               ║
║ Location: [evidence folder]                                    ║
╠════════════════════════════════════════════════════════════════╣
║ VERDICT: PASS / CONDITIONAL PASS / FAIL                        ║
║ [Summary statement]                                            ║
╚════════════════════════════════════════════════════════════════╝
```

---

## Integration with Other Skills

| Skill | Integration |
|-------|-------------|
| **FeatureBuilder** | AppTester can be called after browser validation for deeper testing |
| **InfraBuilder** | After infra is built, AppTester verifies services work |
| **Orchestration** | Can spawn AppTester as a sub-agent for parallel testing |
| **CodeHealth** | Test results feed into Gate 3 (Release-Ready) |
| **SelfCorrect** | If tests fail, can trigger fix cycle |

---

## Differentiation from FeatureBuilder

| Aspect | FeatureBuilder | AppTester |
|--------|----------------|-----------|
| **Focus** | Building features | Testing apps |
| **When** | During development | Post-implementation |
| **Scope** | Single feature | Entire app or feature |
| **Output** | Working code | Test report |
| **Browser phase** | One of 8 phases | The entire skill |
| **Write code?** | Yes | No (observational only) |
| **Evidence** | Screenshots | Screenshots + GIFs + Reports |
| **Modes** | Full / Fast | Smoke / Feature / Full / Flow / Regression |

---

## Files to Create

1. `skills/AppTester/SKILL.md` - Main skill (duplicate from FeatureBuilder structure)
2. `skills/AppTester/prompts/setup.md`
3. `skills/AppTester/prompts/smoke-test.md`
4. `skills/AppTester/prompts/exercise-page.md`
5. `skills/AppTester/prompts/flow-test.md`
6. `skills/AppTester/prompts/edge-cases.md`
7. `skills/AppTester/prompts/responsive.md`
8. `skills/AppTester/prompts/test-report.md`
9. `skills/AppTester/tools/discover-app.md`
10. `skills/AppTester/tools/element-inventory.md`
11. `skills/AppTester/tools/issue-classifier.md`
12. `skills/AppTester/cookbook/common-flows.md`
13. `skills/AppTester/cookbook/issue-patterns.md`
14. `skills/AppTester/templates/test-report.md`

Plus command: `/test-app` - Main entry point

---

## Fix Mode (v1.0: Manual Handoff)

**⚠️ Note:** True closed-loop (auto-invoke FeatureBuilder) requires cross-skill communication mechanism that doesn't exist yet. v1.0 uses manual handoff.

```
┌─────────────────────────────────────────────────────────────────┐
│                  FIX MODE FLOW (v1.0 - Manual)                  │
│                                                                 │
│  1. AppTester finds issue                                       │
│     └── Console error, visual bug, broken interaction           │
│                                                                 │
│  2. Classify severity                                           │
│     └── CRITICAL: Blocks user flow                              │
│     └── HIGH: Feature doesn't work                              │
│     └── MEDIUM: Visual/UX issue                                 │
│     └── LOW: Console warning, minor glitch                      │
│                                                                 │
│  3. Generate fix spec file                                      │
│     └── Save to: docs/06-reference/fix-specs/FIX-[timestamp].md │
│     └── Contains: Issue, evidence, expected behavior            │
│                                                                 │
│  4. ═══ MANUAL HANDOFF ═══                                      │
│     └── User runs: /build-feature fix-specs/FIX-[timestamp].md  │
│     └── OR: Manual fix                                          │
│                                                                 │
│  5. User re-runs AppTester to verify                            │
│     └── /test-app URL --verify FIX-[timestamp]                  │
│     └── Compares before/after state                             │
│                                                                 │
│  6. Report outcome                                              │
│     └── FIXED: Issue no longer present                          │
│     └── PARTIAL: Some issues remain                             │
│     └── REGRESSION: New issues introduced                       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**v1.0 Commands:**
```bash
/test-app https://app.example.com             # Test only, report issues
/test-app https://app.example.com --verify FIX-001  # Re-test after fix
```

**v2.0 Future (when cross-skill invocation exists):**
```bash
/test-app https://app.example.com --fix       # Auto-invoke FeatureBuilder
```

---

## Sentry Integration

Correlate browser errors with backend exceptions for complete picture:

```
┌─────────────────────────────────────────────────────────────────┐
│                   SENTRY CORRELATION                            │
│                                                                 │
│  During SMOKE TEST:                                             │
│  1. Check browser console for errors                            │
│  2. Check Sentry for recent issues (last 15 min)                │
│  3. Correlate: Browser error → Sentry exception                 │
│                                                                 │
│  During FLOW TEST:                                              │
│  1. Record timestamp before user flow                           │
│  2. Execute flow                                                │
│  3. Check Sentry for new issues since timestamp                 │
│  4. Include backend errors in report                            │
│                                                                 │
│  In REPORT:                                                     │
│  - Frontend errors (console)                                    │
│  - Backend errors (Sentry)                                      │
│  - Correlation: "Console error X likely caused by Sentry Y"     │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**MCP Tool:**
```javascript
mcp__chi-gateway__sentry_issues({ org: "badaboost", project: "project-name" })
```

---

## The Complete Testing Lifecycle

How AppTester fits into the development workflow:

```
┌─────────────────────────────────────────────────────────────────┐
│                  FEATURE DEVELOPMENT LIFECYCLE                  │
│                                                                 │
│  1. SPEC                                                        │
│     └── Feature spec written (features/*.md)                    │
│                                                                 │
│  2. BUILD (FeatureBuilder)                                      │
│     └── Implement feature per spec                              │
│     └── TypeScript, tests, basic validation                     │
│                                                                 │
│  3. INITIAL QA (AppTester --initial)   ← NEW                    │
│     └── Browser-based testing                                   │
│     └── Find issues early                                       │
│     └── Generate issues list                                    │
│                                                                 │
│  4. FIX (FeatureBuilder or manual)                              │
│     └── Address issues found in QA                              │
│     └── Iterate until clean                                     │
│                                                                 │
│  5. VERIFY (AppTester --verify)   ← NEW                         │
│     └── Prove all issues fixed                                  │
│     └── Regression check                                        │
│     └── Capture evidence                                        │
│                                                                 │
│  6. SHIP                                                        │
│     └── Deploy with confidence                                  │
│     └── Post-deploy smoke test (AppTester --smoke)              │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Missing Mechanisms (Must Define Before Implementation)

### 1. Element Inventory Strategy

How to find all clickable elements for Phase 4 (EXERCISE):

```javascript
// Via javascript_tool - execute in browser
const clickables = document.querySelectorAll(`
  button,
  a[href],
  [role="button"],
  [onclick],
  input[type="submit"],
  input[type="button"],
  [tabindex]:not([tabindex="-1"]),
  .clickable,
  [data-testid]
`);

// Return array of {tag, text, coordinates, testId}
const inventory = Array.from(clickables).map(el => ({
  tag: el.tagName,
  text: el.innerText?.slice(0, 50) || el.getAttribute('aria-label'),
  rect: el.getBoundingClientRect(),
  testId: el.getAttribute('data-testid')
}));
```

### 2. Evidence File Naming Convention

```
docs/06-reference/qa-evidence/
├── [YYYY-MM-DD]-[mode]-[app-name]/
│   ├── 00-metadata.json          # Test config, duration, results summary
│   ├── 01-initial-load.png       # Phase 1 screenshot
│   ├── 02-smoke-console.txt      # Console output during smoke
│   ├── 03-smoke-network.txt      # Network requests log
│   ├── 04-exercise-[page].png    # Per-page screenshots
│   ├── 05-flow-[name].gif        # User journey recordings
│   └── 99-final-state.png        # End state screenshot
```

### 3. Error Recovery Protocol

```markdown
## Browser Disconnection Recovery

IF MCP call fails mid-test:
1. Log last successful step to metadata.json
2. Attempt reconnect (3 retries, 5s delay)
3. IF reconnect succeeds:
   - Resume from last checkpoint
4. IF reconnect fails:
   - Save partial report with status: "INCOMPLETE"
   - Document where it stopped
   - Report can be resumed with: /test-app URL --resume [timestamp]
```

### 4. App Discovery Strategy (v1.0: User-Provided)

For v1.0, user provides route list:
```bash
/test-app https://app.example.com --routes="/,/dashboard,/settings,/users"
```

OR via project file:
```markdown
# features/TEST-ROUTES.md
/                 # Home page
/dashboard        # Main dashboard
/clients          # Client list
/clients/[id]     # Client detail (use: /clients/123)
/settings         # Settings page
```

v1.1 will add auto-discovery via:
- sitemap.xml parsing
- Next.js `app/` or `pages/` directory scan
- React Router config parsing

---

## Implementation Plan

### Phase 1: Create Directory Structure

```bash
mkdir -p ~/.claude/skills/AppTester/{tools,prompts,cookbook,templates}
```

### Phase 2: Create Core Files

**Priority 1 - Main Skill File:**
- `~/.claude/skills/AppTester/SKILL.md` ← Pivot file (copy from FeatureBuilder, adapt)

**Priority 2 - Phase Prompts:**
- `~/.claude/skills/AppTester/prompts/setup.md` ← Browser setup, tab management
- `~/.claude/skills/AppTester/prompts/smoke-test.md` ← Quick health checks
- `~/.claude/skills/AppTester/prompts/exercise-page.md` ← Per-page testing protocol
- `~/.claude/skills/AppTester/prompts/flow-test.md` ← User journey testing
- `~/.claude/skills/AppTester/prompts/edge-cases.md` ← Boundary testing
- `~/.claude/skills/AppTester/prompts/test-report.md` ← Report format

**Priority 3 - Tools:**
- `~/.claude/skills/AppTester/tools/discover-app.md` ← Map app structure
- `~/.claude/skills/AppTester/tools/element-inventory.md` ← Find interactive elements
- `~/.claude/skills/AppTester/tools/issue-classifier.md` ← Severity classification
- `~/.claude/skills/AppTester/tools/fix-trigger.md` ← How to invoke FeatureBuilder for fixes

**Priority 4 - Cookbook:**
- `~/.claude/skills/AppTester/cookbook/common-flows.md` ← Login, CRUD, etc.
- `~/.claude/skills/AppTester/cookbook/issue-patterns.md` ← Common issues & fixes
- `~/.claude/skills/AppTester/cookbook/sentry-correlation.md` ← Sentry integration

**Priority 5 - Templates:**
- `~/.claude/skills/AppTester/templates/test-report.md` ← QA report template

### Phase 3: Create Slash Command

Create: `~/.claude/commands/test-app.md`

```markdown
---
description: "Test app with Claude in Chrome (AppTester skill)"
---

# /test-app: Automated App Testing

[Command content that loads AppTester skill]
```

### Phase 4: Add Skills Entry

Update: `~/.claude/CLAUDE.md`

Add to Skills table:
```
| **AppTester** | `test app`, `QA`, `/test-app` | SKILL.md (Claude in Chrome testing) |
```

### Phase 5: Test on Real Project

Test on War Room or another deployed app to validate the skill works.

---

## Files to Create (v1.0 Minimal Viable Skill)

### Batch 1: Minimum to Test on Real App
| # | File | Purpose | Base From |
|---|------|---------|-----------|
| 1 | `skills/AppTester/SKILL.md` | Main pivot file (v1.0 scope) | FeatureBuilder v2.1 |
| 2 | `commands/test-app.md` | Slash command | build-feature.md |
| 3 | `skills/AppTester/prompts/setup.md` | Browser setup + error recovery | browser-validation.md |
| 4 | `skills/AppTester/prompts/smoke-test.md` | Smoke mode protocol | stress-test.md |

**STOP HERE → Test on War Room → Measure timing → Learn**

### Batch 2: Full Mode (After Smoke Validated)
| # | File | Purpose | Base From |
|---|------|---------|-----------|
| 5 | `skills/AppTester/prompts/exercise-page.md` | Per-page testing | browser-checklist.md |
| 6 | `skills/AppTester/prompts/flow-test.md` | User journeys + GIF | New |
| 7 | `skills/AppTester/prompts/edge-cases.md` | Boundary testing | New |
| 8 | `skills/AppTester/prompts/test-report.md` | Report generation | E-2-qa.md |

### Batch 3: Polish (After Full Mode Validated)
| # | File | Purpose | Base From |
|---|------|---------|-----------|
| 9 | `skills/AppTester/tools/element-inventory.md` | Clickable element detection | New (mechanism above) |
| 10 | `skills/AppTester/cookbook/sentry-correlation.md` | Sentry integration | New |
| 11 | `skills/AppTester/cookbook/evidence-gathering.md` | Screenshot/GIF management | New (convention above) |

---

## Key Technical Decisions

1. **Naming:** AppTester (not QATester, BrowserTester) - broader scope
2. **Command:** `/test-app` with URL + mode flags
3. **Fix Integration:** Invokes FeatureBuilder skill when `--fix` flag used
4. **Sentry:** Uses `mcp__chi-gateway__sentry_issues` for correlation
5. **Evidence:** Screenshots saved to `docs/06-reference/qa-evidence/`
6. **Report Location:** `docs/06-reference/APP-TEST-REPORT.md`

---

## Relationship to E-2 QA

| Aspect | E-2 QA (Manual) | AppTester (Automated) |
|--------|-----------------|----------------------|
| Execution | Human runs tests | Chi runs via Chrome |
| Report | Manual markdown | Auto-generated |
| Evidence | Human screenshots | Auto screenshots + GIFs |
| Fix | Human applies | Can trigger FeatureBuilder |
| Sentry | Manual check | Automatic correlation |
| Speed | Hours | Minutes |

**Note:** E-2 QA remains for human-specific testing (UX feel, user acceptance). AppTester handles objective, repeatable tests.

---

## Post-Validation Confidence

| Metric | Before Validation | After Fixes |
|--------|-------------------|-------------|
| Confidence | 6.5/10 | **8/10** |
| Class | Grade 4 (claimed) | **Grade 3** (honest) |
| Modes | 5 | **2** (v1.0) |
| Phases | 8 | **7** (skip responsive) |
| Fix Mode | "Auto" (false) | **Manual handoff** |

**What Changed:**
- Honest about current capabilities (Class 3, not 4)
- Reduced scope to provable v1.0
- Defined all missing mechanisms
- Added error recovery protocol
- Batched implementation with validation gates

**Remaining Risk:**
- Actual timing unknown (TBD on first run)
- GIF export destination needs testing
- Sentry correlation timing window (15 min) may need tuning

---

*Designed: 2026-01-01*
*Validated: 2026-01-01 (Score: 6.5 → 8.0 after fixes)*
*Based on: FeatureBuilder v2.1, E-2 QA, Claude in Chrome capabilities*

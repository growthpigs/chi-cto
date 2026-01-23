# AppTester Plan Validation Report

**Reviewed By:** Software Feature Validator Agent
**Date:** 2026-01-01
**Plan Location:** `/Users/rodericandrews/_PAI/.claude/plans/polished-tickling-feather.md`

---

## VERIFIED (Realistic and Achievable)

### 1. Claude in Chrome Tools Exist
**Claim:** The listed Claude in Chrome tools are available for browser automation.

**Evidence:** Verified against `/Users/rodericandrews/_PAI/.claude/skills/ClaudeInChrome/SKILL.md`:
- `tabs_context_mcp` - Confirmed
- `navigate` - Confirmed
- `computer` (screenshot, click, drag) - Confirmed (with actions: screenshot, left_click, right_click, double_click, type, key, scroll, hover, wait)
- `read_console_messages` - Confirmed (in Debugging section)
- `read_network_requests` - Confirmed (in Debugging section)
- `javascript_tool` - Confirmed
- `gif_creator` - Confirmed (with start_recording, stop_recording, export actions)
- `form_input` - Confirmed
- `resize_window` - **NOT FOUND** (see issues below)
- `get_page_text` - Confirmed

**Status:** 9/10 tools verified. One tool (`resize_window`) not documented.

### 2. Phase Structure Follows FeatureBuilder Pattern
**Claim:** 8-phase structure mirrors proven FeatureBuilder pattern.

**Evidence:** FeatureBuilder v2.1 also uses 8 phases:
- LOAD, BUILD, VALIDATE, RESOLVE, STRESS TEST, BROWSER VALIDATION, HARDENING, REPORT

AppTester adapts this sensibly:
- SETUP, DISCOVER, SMOKE TEST, EXERCISE, FLOW TEST, EDGE CASES, RESPONSIVE, REPORT

**Status:** Pattern is proven. The adaptation for testing-only focus is reasonable.

### 3. Sentry Integration is Realistic
**Claim:** Can correlate browser errors with Sentry exceptions.

**Evidence:**
- Chi-Gateway MCP includes `mcp__chi-gateway__sentry_issues` tool
- Sentry org/project IDs documented in CLAUDE.md
- Time-based correlation (check Sentry for issues in last 15 min) is technically feasible

**Status:** Achievable with existing infrastructure.

### 4. Report Format is Well-Defined
**Claim:** Test report format is production-ready.

**Evidence:** The report format in the plan (lines 203-253) is detailed and includes:
- Test scores, pass/fail counts
- Critical issues with evidence
- Per-page and per-flow results
- Console/network summaries
- Evidence links

**Status:** Report format is comprehensive and actionable.

### 5. E-2 QA Relationship is Clear
**Claim:** AppTester complements (not replaces) E-2 QA.

**Evidence:** Plan explicitly states (line 526):
- E-2 QA remains for human-specific testing (UX feel, user acceptance)
- AppTester handles objective, repeatable tests

**Status:** Clear differentiation documented.

---

## UNVERIFIED (Needs More Work)

### 1. `resize_window` Tool Availability
**Claim:** Can resize browser for responsive testing (Phase 7).

**Risk:** Tool not documented in ClaudeInChrome SKILL.md. If unavailable:
- Responsive testing phase becomes impossible
- Would need alternative approach (CSS viewport simulation via JS?)

**How to Verify:** Actually call `mcp__claude-in-chrome__resize_window` and observe result.

**Recommendation:** Either confirm tool exists OR remove responsive testing from v1.0.

### 2. Fix Mode FeatureBuilder Integration
**Claim:** AppTester can "invoke FeatureBuilder" for automatic fixes (lines 304-341).

**Risk:** The mechanism is not specified:
- How does AppTester pass context to FeatureBuilder?
- Is there an MCP tool for this? A slash command?
- SelfCorrect skill handles retries, but not cross-skill invocation

**Evidence Gap:** SelfCorrect SKILL.md (lines 89-109) shows a single-skill retry loop, not inter-skill communication.

**How to Verify:** Define exact mechanism:
- Option A: AppTester generates fix spec file, user manually runs `/build-feature`
- Option B: New MCP tool `mcp__chi__invoke_skill`
- Option C: Use Orchestrator skill to coordinate

**Recommendation:** Start with Option A (manual handoff) for v1.0. Full automation is v2.0.

### 3. GIF Export Location
**Claim:** GIFs recorded for evidence (lines 84-85, 232).

**Risk:** Plan says "Evidence Location: [evidence folder]" but doesn't specify:
- Where exactly do GIFs get saved?
- How are they named?
- Are they committed to git or stored externally?

**Evidence:** ClaudeInChrome SKILL.md shows `filename="demo.gif"` but not destination path.

**How to Verify:** Test GIF export and observe where files land.

**Recommendation:** Define: `docs/06-reference/qa-evidence/[timestamp]-[flow-name].gif`

### 4. Authentication Testing
**Claim:** Can test login flows and auth state.

**Risk:** How does AppTester handle:
- Test credentials (where stored?)
- OAuth flows (multi-page redirects)
- Session persistence verification

**Evidence Gap:** No mention of test user credentials or auth handling.

**How to Verify:** Document auth testing approach:
- Use environment variables for test credentials?
- Skip auth by testing already-logged-in state?

**Recommendation:** Document auth testing strategy before implementing flow-test.md.

### 5. App Discovery Mechanism (Phase 2)
**Claim:** Can "inventory all pages/routes via navigation" and "map interactive elements."

**Risk:** How does AppTester know what routes exist?
- Parse sitemap.xml?
- Look for Next.js/React router config?
- Just click around?

**Evidence Gap:** `tools/discover-app.md` is listed but not defined.

**How to Verify:** Specify discovery strategy:
- Strategy A: User provides route list
- Strategy B: Parse common router patterns
- Strategy C: Crawl from root page

**Recommendation:** Start with Strategy A (user provides routes) for v1.0.

### 6. Duration Estimates
**Claim:** Smoke Mode 2-5 min, Full Mode 30-60 min.

**Risk:** These are guesses without timing data. If actual times are:
- 10x longer: User frustration
- Highly variable: Unreliable estimates

**How to Verify:** Implement Smoke Mode first, measure actual duration.

**Recommendation:** Add "Duration: TBD (first run)" until measured.

---

## FOUND ISSUES (Must Fix Before Implementation)

### Issue 1: resize_window Not in Documented Tools
**Impact:** Phase 7 (Responsive Testing) cannot work as designed.

**Plan Reference:** Lines 93-99, Table row "Responsive | resize_window"

**Recommended Fix:**
1. Verify if tool exists but undocumented
2. If not: Use `javascript_tool` to set viewport meta or CSS
3. If not possible: Remove Phase 7 from v1.0, document as future enhancement

### Issue 2: Fix Mode Has No Defined Integration Mechanism
**Impact:** The "closed-loop" claim (Class 1 Grade 4) is broken. Fix Mode becomes manual.

**Plan Reference:** Lines 304-348

**Recommended Fix:**
1. For v1.0: Fix Mode generates a FIX-SPEC.md file
2. User manually runs `/build-feature fix-specs/FIX-SPEC.md`
3. AppTester re-runs to verify (this part CAN be automated)
4. Document this as "semi-automated" fix mode

### Issue 3: 5 Modes + 8 Phases = Cognitive Overload for v1.0
**Impact:** Too many options before any are tested. Analysis paralysis.

**Plan Reference:** Lines 159-198

**Recommended Fix:** Start with 2 modes for v1.0:
1. **Smoke Mode** (quick health check) - Phases 1, 3, 8
2. **Full Mode** (comprehensive) - All 8 phases

Add Feature, Flow, Regression modes in v1.1 after validating core works.

### Issue 4: Element Inventory Strategy Undefined
**Impact:** Phase 4 (EXERCISE) says "click every clickable element" but how?

**Plan Reference:** Lines 74-79, `tools/element-inventory.md` (not created)

**Recommended Fix:** Define element detection strategy:
```javascript
// Via javascript_tool
document.querySelectorAll('button, a, [role="button"], [onclick], input[type="submit"]')
```
Document this in element-inventory.md BEFORE implementation.

### Issue 5: No Error Recovery for Browser Disconnection
**Impact:** If Claude in Chrome MCP disconnects mid-test, what happens?

**Plan Reference:** None (missing)

**Recommended Fix:** Add to setup.md:
```markdown
## Connection Loss Protocol
1. If MCP call fails mid-test: Log last successful step
2. Attempt reconnect (3 retries)
3. If reconnect fails: Save partial report with "INCOMPLETE" status
4. Resume from last checkpoint if user reruns
```

### Issue 6: Screenshot/Evidence File Naming Convention Missing
**Impact:** Evidence files could overwrite each other or be unorganized.

**Plan Reference:** Line 506 says "docs/06-reference/qa-evidence/" but no naming convention.

**Recommended Fix:** Define naming pattern:
```
qa-evidence/
  2026-01-01-smoke-test/
    01-initial-load.png
    02-console-errors.png
    03-final-state.png
  2026-01-01-flow-login/
    flow-login.gif
    01-login-page.png
    02-after-submit.png
```

---

## Recommendations

### Priority 1: Reduce Scope for v1.0
Start with the minimum viable skill:
- **2 modes only:** Smoke and Full
- **Skip Phase 7 (Responsive)** until resize_window verified
- **Fix Mode = Manual handoff** (generate spec, user runs FeatureBuilder)
- **App Discovery = User-provided route list**

### Priority 2: Define Missing Mechanisms BEFORE Implementation
Create these files FIRST (as design docs, not prompts):
1. `tools/element-inventory.md` - How to find clickable elements
2. `tools/discover-app.md` - What user provides vs what is auto-detected
3. `cookbook/sentry-correlation.md` - Exact timestamp matching logic
4. `cookbook/evidence-gathering.md` - File naming, storage location

### Priority 3: Add Fallback/Error Handling
Document in setup.md:
- MCP disconnection recovery
- Dev server won't start
- App requires authentication
- Test hangs (timeout strategy)

### Priority 4: Test on Real App ASAP
Implementation order:
1. Create SKILL.md (minimal)
2. Create `/test-app` command
3. Create setup.md + smoke-test.md prompts ONLY
4. **Run on War Room** - get real timing data
5. Iterate based on learnings
6. THEN add remaining phases

---

## Confidence Score: 6.5/10

**Explanation:**

**Strengths (+3.5):**
- Follows proven FeatureBuilder pattern
- Claude in Chrome tools mostly exist
- Sentry integration is realistic
- Report format is excellent
- Clear differentiation from E-2 QA

**Concerns (-3.5):**
- resize_window tool unverified (-0.5)
- Fix Mode integration undefined (-1.0) - breaks the "closed-loop" claim
- 5 modes + 8 phases is over-engineered for v1.0 (-0.5)
- Several "tools/" files undefined (-0.5)
- No error recovery strategy (-0.5)
- Duration estimates are guesses (-0.5)

**Bottom Line:**
The plan is **architecturally sound** but **implementation-incomplete**. It describes WHAT AppTester should do but not HOW for several critical pieces. The Fix Mode especially overpromises - calling it "Class 1 Grade 4 Closed-Loop" when the inter-skill communication mechanism doesn't exist.

**Recommendation:** Reduce scope to a provable v1.0 (Smoke + Full modes, manual Fix handoff), get it working on a real app, THEN expand.

---

## Files Reviewed

| File | Location | Purpose |
|------|----------|---------|
| AppTester Plan | `/Users/rodericandrews/_PAI/.claude/plans/polished-tickling-feather.md` | The plan under review |
| FeatureBuilder | `/Users/rodericandrews/_PAI/.claude/skills/FeatureBuilder/SKILL.md` | Base skill pattern |
| Browser Validation | `/Users/rodericandrews/_PAI/.claude/skills/FeatureBuilder/prompts/browser-validation.md` | Browser testing protocol |
| E-2 QA | `/Users/rodericandrews/_PAI/.claude/commands/E-2-qa.md` | Manual QA reference |
| ClaudeInChrome | `/Users/rodericandrews/_PAI/.claude/skills/ClaudeInChrome/SKILL.md` | Available browser tools |
| SelfCorrect | `/Users/rodericandrews/_PAI/.claude/skills/SelfCorrect/SKILL.md` | Self-correction pattern |

---

*Validation completed: 2026-01-01*

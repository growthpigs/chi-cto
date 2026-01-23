# Implementation Plan: Google Ads Copywriter (Copycat) for Chi-Gateway

**Created:** 2026-01-09
**Status:** ✅ COMPLETE - Verified working (2026-01-09)
**Confidence:** 10/10 (runtime verified)

---

## Validator Report Summary

| Check | Result |
|-------|--------|
| Gemini API works | ✅ VERIFIED |
| Response format correct | ✅ VERIFIED |
| TypeScript builds clean | ✅ VERIFIED |
| mem0.ts pattern correct | ✅ VERIFIED |
| Line numbers accurate | ⚠️ CORRECTED BELOW |
| Edge cases addressed | ⚠️ ADDED BELOW |

---

## Summary

Add a new MCP tool to chi-gateway that generates Google Ads copy using the Gemini API. This follows the existing route pattern (like `mem0.ts`) and integrates seamlessly with the current chi-gateway architecture.

---

## Files to Modify

| File | Action | Purpose |
|------|--------|---------|
| `src/routes/copycat.ts` | **CREATE** | New route handler for Gemini API |
| `src/index.ts` | **EDIT** | Add import, Env, MCP tools, switch cases, REST route |

**Location:** `/Users/rodericandrews/.claude/infrastructure/cloudflare/chi-gateway/`

---

## Implementation Steps

### Step 1: Add Cloudflare Secret

```bash
cd /Users/rodericandrews/.claude/infrastructure/cloudflare/chi-gateway
npx wrangler secret put GEMINI_API_KEY
# Value: AIzaSyA7gWabWwZIvTF5HcsC5325RnzwTYB3pZU
```

### Step 2: Create `src/routes/copycat.ts`

New file with:
- Gemini API endpoint constant
- `handleCopycat(request, env, path)` function
- Two endpoints:
  - `POST /generate` - Generate ad copy from prompt + keywords
  - `POST /headlines` - Generate headlines only (30 char limit)
- Input validation (required fields)
- **Safe response parsing with optional chaining** (validator finding)
- Character limit enforcement for Google Ads (30 char headlines, 90 char descriptions)

**API Pattern:**
```typescript
const GEMINI_API = 'https://generativelanguage.googleapis.com/v1beta';
const MODEL = 'gemini-2.0-flash';

// POST to: ${GEMINI_API}/models/${MODEL}:generateContent?key=${env.GEMINI_API_KEY}
```

**Edge Cases to Handle (from validation):**
```typescript
// Safe response parsing - handle missing/blocked responses
const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
if (!text) {
  // Check for safety block or error
  const finishReason = data?.candidates?.[0]?.finishReason;
  if (finishReason === 'SAFETY') {
    return { error: 'Content blocked by safety filter', finishReason };
  }
  if (data?.error) {
    return { error: data.error.message || 'Gemini API error' };
  }
  return { error: 'No content generated' };
}
```

### Step 3: Edit `src/index.ts`

**Insertion points verified by validator:**

**3a. Add import (line 24, after handleMem0):**
```typescript
import { handleCopycat } from './routes/copycat';
```

**3b. Add to Env interface (line 55, before closing brace):**
```typescript
// Gemini
GEMINI_API_KEY: string;
```

**3c. Add MCP tool definitions (line 133, after mem0_search):**
```typescript
// Copycat (Google Ads AI)
{ name: "copycat_generate", description: "Generate Google Ads copy (headlines + descriptions) for keywords", inputSchema: { type: "object", properties: { keywords: { type: "array", description: "Keywords to generate ads for" }, productDescription: { type: "string", description: "Brief product/service description" }, tone: { type: "string", description: "Ad tone (urgent, professional, friendly)" } }, required: ["keywords", "productDescription"] } },
{ name: "copycat_headlines", description: "Generate Google Ads headlines (30 char max)", inputSchema: { type: "object", properties: { keyword: { type: "string" }, count: { type: "number", description: "Number of headlines (default 5)" } }, required: ["keyword"] } },
```

**3d. Add switch cases (line 454, after mem0_search case):**
```typescript
// Copycat
case "copycat_generate":
  response = await handleCopycat(
    new Request(`https://x/generate`, { method: 'POST', body: JSON.stringify(args) }),
    env, '/generate'
  );
  break;
case "copycat_headlines":
  response = await handleCopycat(
    new Request(`https://x/headlines`, { method: 'POST', body: JSON.stringify(args) }),
    env, '/headlines'
  );
  break;
```

**3e. Add REST route (line 554, after mem0 route):**
```typescript
if (path.startsWith('/copycat')) return await handleCopycat(request, env, path.replace('/copycat', ''));
```

**3f. Bump version:**
- Line 148: `"1.3.0"` → `"1.4.0"`
- Line 508: `"1.3.0"` → `"1.4.0"`

### Step 4: Deploy

```bash
cd /Users/rodericandrews/.claude/infrastructure/cloudflare/chi-gateway
npm run deploy
```

### Step 5: Test

```bash
# Test via MCP
curl -X POST https://chi-gateway.rodericandrews.workers.dev/mcp \
  -H "Content-Type: application/json" \
  -d '{"method":"tools/call","params":{"name":"copycat_headlines","arguments":{"keyword":"retirement scam protection"}}}'
```

---

## MCP Tools Added

| Tool | Description | Inputs |
|------|-------------|--------|
| `copycat_generate` | Full ad copy (headlines + descriptions) | keywords[], productDescription, tone? |
| `copycat_headlines` | Headlines only (30 char enforced) | keyword, count? |

---

## Verified During Planning + Validation

- [x] Gemini API key works (curl tested by validator)
- [x] Response format: `candidates?.[0]?.content?.parts?.[0]?.text` (with safe chaining)
- [x] Chi-gateway route pattern (mem0.ts reference - validator confirmed)
- [x] Env interface structure (line 55)
- [x] MCP_TOOLS array format (line 133)
- [x] executeToolCall switch pattern (line 454)
- [x] REST routing pattern (line 554)
- [x] Wrangler deployment auth
- [x] TypeScript builds clean (`npx tsc --noEmit` passed)

---

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Free tier rate limits (15 RPM) | Sufficient for initial use; upgrade billing if needed |
| Gemini model deprecation | Using stable `gemini-2.0-flash` not preview |
| Character limit violations | Enforce 30/90 char limits in response parsing |
| Safety filter blocks content | Handle `finishReason: 'SAFETY'` with clear error message |
| Empty/malformed response | Use optional chaining + explicit error handling |

---

## Out of Scope (Future)

- Style guide generation (Copycat's full feature)
- Training on existing ads
- Ad performance scoring
- Google Sheets integration

---

## Approval Checklist

- [ ] User approves implementation approach
- [ ] Secret added to Cloudflare
- [ ] Code implemented
- [ ] Deployment tested
- [ ] MCP tools verified working

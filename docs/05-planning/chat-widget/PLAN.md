# Plan: Rebuild Chi ChatWidget to Match War Room Design

## Pre-Plan Audit (First Principles)

**Environmental Check:**
- Branch: `main` (clean, up to date)
- Recent: Phase 1 & 2 complete (ab3bb3f)
- Files verified: ChatWidget.tsx, types.ts, service.ts, route.ts exist

**Critical Discovery:**
War Room has TWO systems: hardcoded action buttons + AI-generated follow-ups.
User wants: **Unified AI-generated suggestion pills** (max 9 words, context-aware).

**Chi's Current Gap:**
```typescript
// ChatMessage - MISSING:
// ❌ suggestedActions?: string[]
// ❌ followUpQuestions?: string[]
```

**Confidence: 9/10** (verified all assumptions)

---

## Decisions Made (User Approved)

| Question | Decision |
|----------|----------|
| Follow-up suggestions | **Gemini generates them** - add to system prompt |
| Action buttons | **Intelligent suggestion pills** (not fixed buttons) - max 9 words, context-aware |
| Citations | **Parse [1] inline** (War Room style) |

## Current State vs Target

| Aspect | Chi (Current) | War Room (Target) |
|--------|---------------|-------------------|
| Size | 400px corner widget | Full-width centered panel (~90% viewport) |
| Position | Bottom-right corner | Centered, bottom of screen |
| Suggestion Pills | None | Dynamic, AI-generated context-aware actions (max 9 words) |
| Citations | Separate badges below | **Inline [1] in text** |
| Follow-ups | None | AI-generated question suggestions |
| Left sidebar | None | Chat history + Attachment icons |
| Input | Simple text input | Textarea with drag-drop |

## Implementation Steps

### Step 1: Update ChatMessage Types
**File:** `src/lib/chat/types.ts` (line 18-27)

```typescript
// ADD to ChatMessage interface:
suggestions?: string[];  // AI-generated action suggestions (max 9 words each)
```

```typescript
// ADD to StreamChunk interface (line 78-84):
suggestions?: string[];  // For streaming suggestions
```

### Step 2: Update System Prompt
**File:** `src/lib/chat/service.ts` (line 24-39)

```typescript
const SYSTEM_PROMPT = `You are Chi, an intelligent AI assistant.
// ... existing content ...

IMPORTANT: At the end of EVERY response, include a suggestions block:
---SUGGESTIONS---
["Short action 1 (max 9 words)", "Short action 2", "Follow-up question?"]

These should be context-aware next steps the user might want to take.`;
```

### Step 3: Parse Suggestions from Response
**File:** `src/lib/chat/service.ts` (in streamMessage, after line 134)

```typescript
// After streaming completes, before creating assistantMessage:
const suggestionsMatch = fullContent.match(/---SUGGESTIONS---\n?\[([^\]]+)\]/);
let suggestions: string[] = [];
if (suggestionsMatch) {
  try {
    suggestions = JSON.parse(`[${suggestionsMatch[1]}]`);
    fullContent = fullContent.replace(/---SUGGESTIONS---[\s\S]*$/, '').trim();
  } catch {}
}
```

### Step 4: Create CitationText Component
**File:** `src/components/chat/CitationText.tsx` (NEW)

```typescript
// Parse [1], [2] in text and replace with inline badges
// Regex: /\[(\d+)\]/g
// Render: <button className="inline-flex w-5 h-5 text-[11px] bg-blue-500 rounded-sm">{n}</button>
// Color: blue for 'rag', green for 'web'
```

### Step 5: Create SuggestionPills Component
**File:** `src/components/chat/SuggestionPills.tsx` (NEW)

```typescript
interface Props {
  suggestions: string[];
  onSelect: (suggestion: string) => void;
}

// Render as flex-wrap pills
// Each pill: px-3 py-2 bg-blue-600/20 border-blue-500/30 rounded-lg
// onClick: calls onSelect(suggestion) to send as new message
```

### Step 6: Rebuild ChatWidget Layout
**File:** `src/components/chat/ChatWidget.tsx` (MAJOR REWRITE)

**Key Changes:**
1. Position: `left: 50%, transform: translateX(-50%)` (centered, not corner)
2. Width: `90%, maxWidth: 1100px` (full-width, not 400px)
3. Handle bar at top for visual affordance
4. Left icons column (MessageSquare, Paperclip)
5. Textarea instead of input
6. Use CitationText for message content
7. Use SuggestionPills below assistant messages

```jsx
<div style={{
  position: 'fixed',
  bottom: '24px',
  left: '50%',
  transform: 'translateX(-50%)',
  width: '90%',
  maxWidth: '1100px',
  height: isExpanded ? '70vh' : '56px',
  background: 'rgba(30, 30, 30, 0.92)',
  backdropFilter: 'blur(16px)',
  borderRadius: '16px',
}}>
  {/* Handle bar: w-10 h-1 bg-white/30 rounded-full mx-auto mt-2 */}
  {/* Header: Chi icon + title + expand chevron */}

  {/* Messages area with overflow-y-auto */}
  {messages.map(msg => (
    <div>
      <RouteIndicator route={msg.route} />
      <CitationText content={msg.content} citations={msg.citations} />
      {msg.suggestions && <SuggestionPills suggestions={msg.suggestions} onSelect={sendMessage} />}
    </div>
  ))}

  {/* Input area */}
  <div className="flex items-center gap-3 p-4 border-t border-white/10">
    <div className="flex flex-col gap-2">
      <button><MessageSquare className="w-4 h-4" /></button>
      <button disabled><Paperclip className="w-4 h-4 opacity-50" /></button>
    </div>
    <textarea
      placeholder="Ask Chi anything..."
      className="flex-1 min-h-[48px] max-h-[120px] resize-none"
    />
    <button className="w-12 h-12 bg-blue-600 rounded-xl">
      <Send />
    </button>
  </div>
</div>
```

## Files to Modify/Create

| Action | File |
|--------|------|
| MODIFY | `src/lib/chat/types.ts` |
| MODIFY | `src/lib/chat/service.ts` |
| CREATE | `src/components/chat/CitationText.tsx` |
| CREATE | `src/components/chat/SuggestionPills.tsx` |
| REWRITE | `src/components/chat/ChatWidget.tsx` |
| MODIFY | `src/app/page.tsx` |

## War Room Reference Files

- `/war-room/client/src/components/IntelligentChat.tsx`
- `/war-room/client/src/components/shared/CitationText.tsx`

## Out of Scope (v1)

- Chat history sidebar (icon visible, not functional)
- File upload (icon visible, disabled)
- Mobile full-screen mode

## Validator Confidence: 8/10

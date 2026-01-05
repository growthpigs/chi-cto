# Tech Debt Register

> **Status:** Deferred until post-MVP validation
> **Last Updated:** 2024-12-24
> **Decision:** Ship MVP first, refactor after client validates concept

---

## Deferred Refactoring (V2)

### Priority 1: Quick Wins (~125 lines saved)

| Item | Files | Effort | Notes |
|------|-------|--------|-------|
| Extract `<DraggableHeader />` | CoachIntroScreen, CoachScreen | 1hr | Identical JSX in both |
| Extract `<StatusRow />` | CoachIntroScreen, CoachScreen | 1hr | Status dot + text + mute button |
| Apply `useDraggableSheet` to CoachIntroScreen | CoachIntroScreen | 30min | Hook already exists, screen uses inline PanResponder |
| Extract `useScrollToTop` hook | CoachScreen → shared | 30min | Better timeout cleanup pattern |

### Priority 2: Medium Refactoring (~75 lines saved)

| Item | Files | Effort | Notes |
|------|-------|--------|-------|
| Extract `<MessageList />` | CoachIntroScreen, CoachScreen | 2hr | Scroll + reverse + render |
| Extract `useConversationInit` hook | Both screens | 1hr | Identical useEffect for agent startup |

### Priority 3: Larger Refactoring (~200+ lines saved)

| Item | Files | Effort | Notes |
|------|-------|--------|-------|
| Consolidate stylesheets | Both screens | 3hr | 95% style duplication |
| Extract `useAbbyAgentSetup` factory | AbbyAgent + screens | 4hr | Screen-specific callbacks |

---

## Test Coverage Gap

**Current:** 251 static validation tests (grep source files for patterns)
**Missing:** Runtime unit tests that execute React Native code

### To Add Post-MVP

1. `@testing-library/react-native` setup
2. Mock ElevenLabs SDK
3. Mock Zustand stores
4. Component render tests
5. Hook behavior tests

---

## Why Deferred?

1. **MVP Goal:** Validate concept with client, not perfect code
2. **Code Works:** Voice functional, all tests pass
3. **Risk:** Over-engineering before product-market fit
4. **Time:** Every hour on refactoring = hour not on demo features

**Revisit After:**
- Client approves MVP
- V2 scope is defined
- Payment/matching features need stable foundation

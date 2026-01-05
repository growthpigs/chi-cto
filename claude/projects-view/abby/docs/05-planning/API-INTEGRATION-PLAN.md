# ABBY API Integration Plan

**Status:** 🚨 SCOPE CREEP ALERT
**Date:** 2024-12-30
**Issue:** Client backend API requires full dating app features, NOT just MVP

---

## The Problem

**Original MVP Scope:** VibeMatrix + Abby AI conversation (local question flow)
**Client's Actual API:** Full enterprise dating platform with auth, profiles, photos, matching, messaging, payments, verification

**Timeline:** Still 7-14 days (unchanged)
**Budget:** Still $5K (unchanged)

---

## API Inventory

### Authentication (AWS Cognito)
- `POST /v1/auth/signup` - Register with email/password/name
- `POST /v1/auth/confirm` - Email verification code
- `POST /v1/auth/login` - Get JWT tokens
- Token refresh flow

### Profile Management
- `GET /v1/me` - Get current user
- `PUT /v1/profile/public` - Update public profile
- `PUT /v1/profile/private` - Update private settings

### Photos
- `POST /v1/photos/presign` - Get S3 upload URL
- `POST /v1/photos` - Register uploaded photo
- Photo management

### Questions (Abby Interview)
- `GET /v1/questions/categories` - Question categories
- `GET /v1/questions/category/{slug}` - Questions by category
- `GET /v1/questions/next` - Next question to ask
- `GET /v1/questions/gaps` - Profile gaps
- `GET /v1/questions/{id}` - Single question
- `GET /v1/answers` - User's answers
- `POST /v1/answers` - Submit answer
- `POST /v1/answers/parse` - Parse natural language to options

### Preferences
- `PUT /v1/preferences` - Update match preferences

### Matching
- `GET /v1/matches/candidates` - Get match candidates
- `POST /v1/matches/{user_id}/like` - Like a user
- `POST /v1/matches/{user_id}/pass` - Pass on a user

### Messaging
- `GET /v1/threads` - List message threads
- `GET /v1/threads/{id}/messages` - Messages in thread
- `POST /v1/threads/{id}/messages` - Send message

### Abby Voice Integration
- `POST /v1/abby/realtime/session` - Create voice session (OpenAI Realtime)
- `POST /v1/abby/session/{id}/end` - End session
- `GET /v1/abby/memory/context` - Get conversation memory
- `POST /v1/abby/realtime/{session_id}/message` - Text message
- `POST /v1/abby/tools/execute` - Execute tool call
- `POST /v1/abby/tts` - Text-to-speech
- `GET /v1/abby/realtime/available` - Check API availability
- `POST /v1/chat` - Fallback text chat

### MCP (Model Context Protocol)
- `POST /v1/mcp` - MCP JSON-RPC endpoint
- `GET /v1/mcp/tools` - List MCP tools

### Safety
- `POST /v1/blocks` - Block a user
- `POST /v1/reports` - Report a user

### Consent
- `POST /v1/consents` - Record pairwise consent
- `DELETE /v1/consents` - Revoke consent

### Verification
- `GET /v1/verification` - Get verification status
- `POST /v1/verification` - Start verification flow

### Payments (Stripe)
- `POST /v1/payments` - Create payment

---

## Required Screens (Based on API + Wireframes)

### Auth Flow (NEW - Not in MVP)
1. **Welcome/Splash** - Initial screen
2. **Login** - Email/password
3. **Signup** - Email/password/name + verification flow
4. **Email Verification** - 6-digit code input

### Onboarding (NEW - Not in MVP)
5. **Permissions** - iOS permissions (notifications, camera, mic, location)
6. **Registration Details** - First name, last name, phone, email, password
7. **Age Confirmation** - "I am over 18 years old" checkbox
8. **Basics - Gender** - Male/Woman/See All (radio)
9. **Basics - Relationship Type** - Long-term/Short-term/New Friends (radio)
10. **Basics - Location** - GPS or zip code
11. **Non-Monogamous Options** - Type 1/2/3 (if selected)

### Interview Flow (EXISTS - Needs API Integration)
12. **InterviewScreen.tsx** - Already built
   - Need to integrate with `/v1/questions/next`, `/v1/answers`
   - Already has voice integration (ElevenLabs) - need to swap for `/v1/abby/realtime/session`

### Match Flow (PARTIALLY EXISTS)
13. **SearchingScreen.tsx** - Already built (searching animation)
14. **MatchScreen.tsx** - Already built (bio reveal) - integrate with `/v1/matches/candidates`
15. **Match Notification** - "You Have a New Match!" celebration
16. **Matches List** (NEW) - List of all matches with avatars
17. **RevealScreen.tsx** - Already built (photo reveal after payment)

### Profile Management (NEW)
18. **Profile View** - User's own profile with rainbow gradient sidebar
19. **System & Settings** - Account/profile/location/accessibility/guidelines
20. **My Photos** - Photo upload/management grid (4 slots shown in wireframe)

### Payments (PARTIALLY EXISTS)
21. **Subscription Tiers** - Pro ($49/mo) vs Elite ($99/mo)
22. **PaymentScreen.tsx** - Basic version exists, needs Stripe integration
23. **Payment Methods** - Card file management

### Verification (NEW - V2 per Brent)
24. **Certification Screen** - 3rd party verification (placeholder for V2)

---

## Screens: MVP vs Current

| Screen | MVP | Current | Delta |
|--------|-----|---------|-------|
| **Auth** | ❌ | ✅ | +4 screens |
| **Onboarding** | ❌ | ✅ | +7 screens |
| **Interview** | ✅ | ✅ (API swap) | Refactor |
| **Searching** | ✅ | ✅ | No change |
| **Match** | ✅ | ✅ (API) | Integration |
| **Reveal** | ✅ | ✅ | No change |
| **Coach** | ✅ | ✅ (API swap) | Refactor |
| **Profile** | ❌ | ✅ | +2 screens |
| **Photos** | ❌ | ✅ | +1 screen |
| **Matches List** | ❌ | ✅ | +1 screen |
| **Subscriptions** | ❌ | ✅ | +1 screen |
| **Payments** | Basic | Full Stripe | Integration |
| **Verification** | ❌ | V2 | Deferred |
| **TOTAL** | 7 screens | 24 screens | **+17 screens** |

---

## Glass Pattern Mapping

### Full Screens (Navigation Stack)
- Login
- Signup
- Welcome/Splash
- InterviewScreen
- SearchingScreen
- MatchScreen
- RevealScreen
- CoachIntroScreen
- CoachScreen
- Profile View
- System & Settings
- My Photos
- Matches List

### Modals (Bottom Sheets over VibeMatrix)
- Email Verification
- Permissions
- Registration Details
- Age Confirmation
- Basics (Gender/Relationship/Location/Non-Monogamous)
- Match Notification Celebration
- Subscription Tiers
- Payment Input

### Orb Usage
- Interview → Orb center, animated
- Searching → Orb center, pulsing
- Match → Orb center, morphs to bio card
- Reveal → Orb docked top-right
- Coach → Orb docked top-right
- **All other screens** → No orb OR minimal docked presence

---

## Integration Strategy

### Phase 1: Auth + Core Data (Days 1-2)
1. AWS Cognito SDK integration
2. Token management (secure storage)
3. Auth flow screens (Login/Signup/Verification)
4. Profile data structure

### Phase 2: Onboarding Flow (Days 3-4)
1. Permissions screen
2. Registration details modal
3. Basics modals (Gender/Relationship/Location)
4. Save to `/v1/profile/public` and `/v1/profile/private`

### Phase 3: Interview API Swap (Day 5)
1. Replace local question JSON with `/v1/questions/next`
2. POST answers to `/v1/answers`
3. Replace ElevenLabs with `/v1/abby/realtime/session` (WebRTC or WebSocket)
4. Handle tool calls via `/v1/abby/tools/execute`

### Phase 4: Matching (Day 6)
1. Integrate `/v1/matches/candidates`
2. Like/Pass actions
3. Matches list screen
4. Match notification modal

### Phase 5: Profile & Photos (Day 7)
1. Profile view screen
2. Photo upload (S3 presigned URLs)
3. Photo management grid
4. Settings screen

### Phase 6: Payments (Day 8-9)
1. Stripe SDK integration
2. Subscription tiers modal
3. Payment flow
4. Link to reveal screen

### Phase 7: Polish (Day 10-11)
1. Error states
2. Loading states
3. Animations
4. Testing

### Phase 8: Buffer (Days 12-14)
1. Bug fixes
2. Client feedback
3. Performance optimization

---

## High-Risk Areas

### 1. Voice Integration Swap
**Risk:** Their OpenAI Realtime API might not match ElevenLabs behavior
**Mitigation:** Test early, have fallback to text-only

### 2. AWS Cognito Client-Side
**Risk:** Client-side Cognito is complex, easy to break
**Mitigation:** Use AWS Amplify, follow their examples exactly

### 3. Photo Upload (S3 Presigned)
**Risk:** Presigned URL flow can fail silently
**Mitigation:** Clear error states, retry logic

### 4. Stripe Integration
**Risk:** Payment flow interruptions lose users
**Mitigation:** Use Stripe's prebuilt UI components

### 5. Token Refresh
**Risk:** Tokens expire (1hr), need seamless refresh
**Mitigation:** Axios interceptor for auto-refresh

---

## What Brent Needs Tomorrow

**Dates for:**
1. ✅ App with basic integration to Abby AI backend → **Day 5 (Jan 4)**
2. ✅ App in TestFlight → **Day 7 (Jan 6)**
3. ✅ All FluidUI screens functional → **Day 11 (Jan 10)**
4. ⚠️ 3rd party integrations (Stripe + Verification) → **V2 - not in scope** (Stripe Day 9, Verification deferred)

---

## Scope Reality Check

| Metric | MVP | Current | Multiplier |
|--------|-----|---------|------------|
| Screens | 7 | 24 | **3.4x** |
| API Endpoints | 0 | 40+ | **∞** |
| 3rd Party SDKs | 1 (ElevenLabs) | 4 (Cognito, Stripe, S3, OpenAI) | **4x** |
| Days | 7-14 | 7-14 | **1x** |
| Budget | $5K | $5K | **1x** |

**Translation:** We're being asked to do 3-4x the work for the same time and money.

---

## Recommendation

**Accept** the scope creep (we have no choice per Roderic), but:
1. **Document everything** - This plan protects us from blame
2. **Prioritize ruthlessly** - Auth/Interview/Match core, everything else basic
3. **Use prebuilt components** - AWS Amplify UI, Stripe prebuilt, no custom anything
4. **Test early** - Voice integration on Day 3, not Day 10
5. **Set expectations** - "Functional" ≠ "Polished" at this timeline

**Next Step:** Get approval from Brent on timeline, then start Phase 1.

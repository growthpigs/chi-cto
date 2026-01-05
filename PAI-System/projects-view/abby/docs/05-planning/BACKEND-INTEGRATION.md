# ABBY Backend Integration

> **Living Document** - Update this file, don't create new ones

**Last Updated:** 2025-12-31
**Status:** 🟡 Frontend ready, backend blocked
**Backend URL:** `https://dev.api.myaimatchmaker.ai`
**API Docs:** https://dev.api.myaimatchmaker.ai/docs#/

---

## TL;DR - Current State

**What works now (Expo Go):**
- All 17 screens render correctly
- Full user flow: login → verify → coach intro → interview → searching → match → payment → reveal → coach
- API service layer with automatic mock/real switching
- Questions load from API (mock returns demo questions)
- Answers submitted to API (mock stores in memory)

**What's blocked (needs client credentials):**
- Real authentication (AWS Cognito)
- Real API calls (all return 401/500)
- Voice features (needs dev build)

**To connect real backend:**
```typescript
// src/config.ts - flip ONE flag:
USE_REAL_API: true
```

---

## Table of Contents

1. [Current Status](#current-status)
2. [Architecture](#architecture)
3. [API Endpoint Status](#api-endpoint-status)
4. [Data Contracts (TypeScript)](#data-contracts)
5. [Screen-to-Endpoint Mapping](#screen-to-endpoint-mapping)
6. [Integration Checklist](#integration-checklist)
7. [Blockers & Issues](#blockers--issues)
8. [Session Log](#session-log)

---

## Current Status

### Backend Health

| Date | /v1/health | Notes |
|------|------------|-------|
| 2024-12-30 | ✅ 200 OK | Working, returned "healthy" |
| 2025-12-31 | 🔴 500 Error | "Internal server error" |

### Authentication Status

| What | Status | Notes |
|------|--------|-------|
| Test credentials | ❌ Missing | Requested from client |
| Signup endpoint | ❌ Returns 401 | Should be public |
| JWT token | ❌ Cannot obtain | Blocked by signup |
| API testing | ❌ BLOCKED | Cannot test any protected endpoint |

### Overall Readiness

| Component | Frontend | Backend | Integration |
|-----------|----------|---------|-------------|
| Auth | ✅ UI built | ❌ Blocked | ❌ |
| Questions | ✅ UI built | ❓ Unknown | ❌ |
| Voice/Abby | ⚠️ Mocked | ❓ Unknown | ❌ |
| Matching | ✅ UI built | ❓ Unknown | ❌ |
| Profile | ⚠️ Partial | ❓ Unknown | ❌ |
| Photos | ❌ Not built | ❓ Unknown | ❌ |
| Payments | ⚠️ Partial | ❓ Unknown | ❌ |

---

## Architecture

### Contract-First Development

We build against **TypeScript interfaces** that match the API spec. When backend is ready, we swap implementations.

```
src/services/
├── api/
│   ├── types.ts        # TypeScript contracts (THE SOURCE OF TRUTH)
│   ├── client.ts       # Real API client
│   ├── mock.ts         # Mock implementation (for dev)
│   └── index.ts        # Exports: USE_REAL_API ? client : mock
├── auth/
│   ├── AuthService.ts  # Cognito auth logic
│   └── TokenManager.ts # JWT storage/refresh
└── abby/
    └── AbbyService.ts  # Voice/Realtime integration
```

### Configuration

```typescript
// src/config.ts
export const API_CONFIG = {
  USE_REAL_API: false,  // 🔴 Set to true when backend ready
  BASE_URL: 'https://dev.api.myaimatchmaker.ai',
  COGNITO: {
    USER_POOL_ID: 'us-east-1_l3JxaWpl5',
    CLIENT_ID: '2ljj7mif1k7jjc2ajiq676fhm1',
    REGION: 'us-east-1',
  },
};
```

---

## API Endpoint Status

### Authentication (AWS Cognito)

| Endpoint | Method | Status | Tested | Notes |
|----------|--------|--------|--------|-------|
| Cognito SignUp | SDK | ❓ | ❌ | Direct SDK, not API |
| Cognito ConfirmSignUp | SDK | ❓ | ❌ | 6-digit code |
| Cognito InitiateAuth | SDK | ❓ | ❌ | Returns JWT |
| Cognito RefreshToken | SDK | ❓ | ❌ | Token refresh |

### Profile

| Endpoint | Method | Status | Tested | Notes |
|----------|--------|--------|--------|-------|
| `/v1/me` | GET | ❓ | ❌ | Get current user |
| `/v1/profile/public` | PUT | ❓ | ❌ | Update public profile |
| `/v1/profile/private` | PUT | ❓ | ❌ | Update private settings |

### Questions

| Endpoint | Method | Status | Tested | Notes |
|----------|--------|--------|--------|-------|
| `/v1/questions/categories` | GET | 401 | ❌ | Returns Unauthorized |
| `/v1/questions/category/{slug}` | GET | ❓ | ❌ | |
| `/v1/questions/next` | GET | ❓ | ❌ | |
| `/v1/questions/gaps` | GET | ❓ | ❌ | |
| `/v1/questions/{id}` | GET | ❓ | ❌ | |
| `/v1/answers` | GET | ❓ | ❌ | |
| `/v1/answers` | POST | ❓ | ❌ | |
| `/v1/answers/parse` | POST | ❓ | ❌ | NL to options |

### Abby Voice (OpenAI Realtime)

| Endpoint | Method | Status | Tested | Notes |
|----------|--------|--------|--------|-------|
| `/v1/abby/realtime/session` | POST | ❓ | ❌ | Create session |
| `/v1/abby/session/{id}/end` | POST | ❓ | ❌ | End session |
| `/v1/abby/memory/context` | GET | ❓ | ❌ | Conversation memory |
| `/v1/abby/realtime/{id}/message` | POST | ❓ | ❌ | Inject text |
| `/v1/abby/tools/execute` | POST | ❓ | ❌ | Tool calls |
| `/v1/abby/tts` | POST | ❓ | ❌ | Text-to-speech |
| `/v1/abby/realtime/available` | GET | 401 | ❌ | Check availability |
| `/v1/chat` | POST | ❓ | ❌ | Fallback text |

### Matching

| Endpoint | Method | Status | Tested | Notes |
|----------|--------|--------|--------|-------|
| `/v1/matches/candidates` | GET | ❓ | ❌ | |
| `/v1/matches/{user_id}/like` | POST | ❓ | ❌ | |
| `/v1/matches/{user_id}/pass` | POST | ❓ | ❌ | |

### Photos

| Endpoint | Method | Status | Tested | Notes |
|----------|--------|--------|--------|-------|
| `/v1/photos/presign` | POST | ❓ | ❌ | S3 upload URL |
| `/v1/photos` | POST | ❓ | ❌ | Register photo |

### Messaging

| Endpoint | Method | Status | Tested | Notes |
|----------|--------|--------|--------|-------|
| `/v1/threads` | GET | ❓ | ❌ | List threads |
| `/v1/threads/{id}/messages` | GET | ❓ | ❌ | Messages |
| `/v1/threads/{id}/messages` | POST | ❓ | ❌ | Send message |

### Safety & Consent

| Endpoint | Method | Status | Tested | Notes |
|----------|--------|--------|--------|-------|
| `/v1/blocks` | POST | ❓ | ❌ | Block user |
| `/v1/reports` | POST | ❓ | ❌ | Report user |
| `/v1/consents` | POST | ❓ | ❌ | Record consent |
| `/v1/consents` | DELETE | ❓ | ❌ | Revoke consent |

### Verification & Payments

| Endpoint | Method | Status | Tested | Notes |
|----------|--------|--------|--------|-------|
| `/v1/verification` | GET | ❓ | ❌ | Status |
| `/v1/verification` | POST | ❓ | ❌ | Start flow |
| `/v1/payments` | POST | ❓ | ❌ | Create payment |

---

## Data Contracts

### User & Profile

```typescript
interface User {
  id: string;
  email: string;
  displayName: string;
  createdAt: string;
}

interface UserProfile {
  id: string;
  firstName: string;
  lastName: string;
  displayName: string;
  dateOfBirth: string;
  gender: 'male' | 'female' | 'non_binary' | 'other';
  bio: string;
  photos: Photo[];
  location?: {
    latitude: number;
    longitude: number;
    city: string;
  };
  preferences: MatchPreferences;
}

interface MatchPreferences {
  ageMin: number;
  ageMax: number;
  genders: string[];
  distance: number;
  relationshipType: 'long_term' | 'short_term' | 'friends' | 'casual';
}

interface Photo {
  id: string;
  url: string;
  isPrimary: boolean;
  order: number;
}
```

### Questions & Answers

```typescript
interface QuestionCategory {
  id: string;
  slug: string;
  name: string;
  description: string;
  questionCount: number;
}

interface Question {
  id: string;
  categorySlug: string;
  text: string;
  voiceText: string;
  type: 'choice' | 'multi_choice' | 'scale' | 'text' | 'picturegram';
  options?: QuestionOption[];
  scaleMin?: number;
  scaleMax?: number;
  required: boolean;
  vibeState: 'TRUST' | 'DEEP' | 'CAUTION' | 'PASSION' | 'GROWTH';
}

interface QuestionOption {
  id: string;
  text: string;
  voiceText?: string;
}

interface UserAnswer {
  questionId: string;
  answer: {
    selected?: string | string[];
    value?: number;
    text?: string;
  };
  answeredAt: string;
  answerMethod: 'touch' | 'voice';
}
```

### Matching

```typescript
interface MatchCandidate {
  id: string;
  displayName: string;
  age: number;
  bio: string;
  photos: Photo[];
  compatibility: number; // 0-100
  commonInterests: string[];
}

interface Match {
  id: string;
  matchedAt: string;
  user: MatchCandidate;
  status: 'pending' | 'matched' | 'unmatched';
}
```

### Abby Voice Session

```typescript
interface AbbyRealtimeSession {
  sessionId: string;
  clientSecret: string; // For OpenAI Realtime
  expiresAt: string;
}

interface AbbyMemoryContext {
  entries: AbbyMemoryEntry[];
  summary: string;
}

interface AbbyMemoryEntry {
  type: 'user_fact' | 'preference' | 'conversation_topic';
  content: string;
  timestamp: string;
}
```

---

## Screen-to-Endpoint Mapping

### Auth Screens

| Screen | Endpoints Used | Mock Status |
|--------|----------------|-------------|
| LoginScreen | Cognito InitiateAuth | ✅ Mocked |
| PhoneNumberScreen | (future: phone auth) | ✅ Mocked |
| VerificationCodeScreen | (future: SMS code) | ✅ Mocked |
| EmailScreen | Cognito SignUp | ✅ Mocked |
| EmailVerificationScreen | Cognito ConfirmSignUp | ✅ Mocked |
| LoadingScreen | `/v1/me` (after auth) | ✅ Mocked |

### Core Flow Screens

| Screen | Endpoints Used | Mock Status |
|--------|----------------|-------------|
| CoachIntroScreen | `/v1/abby/realtime/session` | ✅ Mocked |
| InterviewScreen | `/v1/questions/next`, `/v1/answers` | ✅ API integrated |
| SearchingScreen | `/v1/matches/candidates` | ✅ Mocked |
| MatchScreen | `/v1/matches/{id}` | ✅ Mocked |
| PaymentScreen | `/v1/payments` | ⚠️ Partial |
| RevealScreen | `/v1/matches/{id}` (with photos) | ✅ Mocked |
| CoachScreen | `/v1/abby/realtime/session`, `/v1/chat` | ✅ Mocked |

### Profile Screens (TO BUILD)

| Screen | Endpoints Used | Mock Status |
|--------|----------------|-------------|
| ProfileScreen | `/v1/me`, `/v1/profile/public` | ❌ Not built |
| PhotosScreen | `/v1/photos/presign`, `/v1/photos` | ❌ Not built |
| SettingsScreen | `/v1/profile/private` | ❌ Not built |
| PreferencesScreen | `/v1/preferences` | ❌ Not built |

### Messaging Screens (TO BUILD)

| Screen | Endpoints Used | Mock Status |
|--------|----------------|-------------|
| MatchesListScreen | `/v1/matches/candidates` | ❌ Not built |
| ChatScreen | `/v1/threads/{id}/messages` | ❌ Not built |

---

## Integration Checklist

### Phase 1: Contract Layer ✅ COMPLETE
- [x] Create `src/services/api/types.ts` with all interfaces
- [x] Create `src/services/api/mock.ts` with mock implementations
- [x] Create `src/services/api/client.ts` with real API client (untested)
- [x] Create `src/services/api/index.ts` with USE_REAL_API switch
- [x] Create `src/config.ts` with API configuration

### Phase 2: Auth Integration (BLOCKED)
- [ ] Install `amazon-cognito-identity-js`
- [ ] Implement Cognito SignUp flow
- [ ] Implement Cognito ConfirmSignUp (email code)
- [ ] Implement Cognito InitiateAuth (login)
- [ ] Implement token refresh
- [ ] Test with real credentials (BLOCKED - need creds)

### Phase 3: Questions Integration (BLOCKED)
- [ ] Test `/v1/questions/categories` (need JWT)
- [ ] Test `/v1/questions/next` (need JWT)
- [ ] Test `/v1/answers` POST (need JWT)
- [ ] Replace local questions.json with API

### Phase 4: Voice Integration (BLOCKED)
- [ ] Test `/v1/abby/realtime/session` (need JWT)
- [ ] Implement WebRTC connection to OpenAI
- [ ] Test tool execution flow
- [ ] Replace ElevenLabs code with OpenAI Realtime

### Phase 5: Matching Integration (BLOCKED)
- [ ] Test `/v1/matches/candidates` (need JWT)
- [ ] Test like/pass endpoints
- [ ] Wire up UI to real endpoints

---

## Blockers & Issues

### 🔴 CRITICAL: No Test Access

**Problem:** Cannot test ANY protected endpoint.

**Root Cause:** Signup returns 401, creating chicken-and-egg problem.

**What We Need:**
1. Working test credentials (email/password)
2. OR: API key for dev environment
3. OR: Cognito admin access

**Requested:** 2024-12-30 via email to client

**Status:** Awaiting response

---

### 🔴 Backend Health Issues

**Problem:** Health endpoint returning 500.

| Date | Response |
|------|----------|
| 2024-12-30 | ✅ 200 "healthy" |
| 2025-12-31 | 🔴 500 "Internal server error" |

**Action:** Notify client of backend instability.

---

### ⚠️ Voice Architecture

**Two voice systems exist:**

| System | Branch | Status |
|--------|--------|--------|
| ElevenLabs | `main` | Demo/prototype, works in dev builds |
| OpenAI Realtime | (backend) | Real system, not yet integrated |

**In Expo Go:**
- Voice features disabled (requires native modules)
- Shows "Text mode" with purple indicator
- Abby shows welcome message automatically
- User can proceed to interview normally

**For real voice:**
- Build dev client: `npx expo run:ios`
- OR wait for OpenAI Realtime integration

**Action:** Replace ElevenLabs with OpenAI Realtime when backend accessible.

---

## Session Log

### 2025-12-31 (Session 2 - final)

**Done:**
- ✅ Fixed voice error display in CoachIntroScreen
- Shows "Text mode" with purple indicator instead of red error
- Abby auto-sends welcome message when voice unavailable
- User can proceed to interview normally in Expo Go

---

### 2025-12-31 (Session 2 - continued)

**Done:**
- ✅ Wired `InterviewScreen` to use API service
- Loads questions from `api.getNextQuestions(150)`
- Submits answers via `api.submitAnswer()`
- Falls back to local questions if API fails
- Added loading state and API error indicator

**Key Changes:**
```typescript
// InterviewScreen now uses:
import { api, Question } from '../../services/api';

// On mount:
const apiQuestions = await api.getNextQuestions(150);

// On answer:
api.submitAnswer({ questionId, answer, answerMethod: 'touch' });
```

---

### 2025-12-31 (Session 2)

**Done:**
- ✅ Created `src/config.ts` with USE_REAL_API flag
- ✅ Created `src/services/api/types.ts` - 50+ TypeScript interfaces
- ✅ Created `src/services/api/mock.ts` - Full mock implementation
- ✅ Created `src/services/api/client.ts` - Real API client structure
- ✅ Created `src/services/api/index.ts` - Auto-swap logic
- ✅ **Phase 1 Contract Layer COMPLETE**

**Files Created:**
```
src/config.ts                    # Central configuration
src/services/api/types.ts        # TypeScript contracts (IApiService interface)
src/services/api/mock.ts         # Mock implementation using demo data
src/services/api/client.ts       # Real API client with auth headers
src/services/api/index.ts        # Export with USE_REAL_API switch
```

**Usage:**
```typescript
import { api } from '@/services/api';

// Automatically uses mock or real based on config
const profile = await api.getMe();
const questions = await api.getNextQuestions();
const candidates = await api.getCandidates();
```

**Next:**
- Wire screens to use api service instead of local data
- Build remaining Profile/Messaging screens
- When client provides credentials: flip USE_REAL_API = true

---

### 2025-12-31 (Session 1)

**Done:**
- Fixed Expo Go render error (ElevenLabsProvider mock)
- Created metro resolver for native module mocks
- Updated CLAUDE.md with API documentation
- Created this living document

**Discovered:**
- Backend health returning 500 (was 200 yesterday)
- Same auth blockers persist
- Need to build contract-first architecture

**Next:**
- Build TypeScript contracts from API spec
- Build mock service layer
- Continue UI development against mocks

---

### 2024-12-30

**Done:**
- Tested API endpoints
- Documented auth blocking issue
- Sent email to client requesting credentials

**Discovered:**
- Signup returns 401 (should be public)
- All endpoints blocked without JWT
- Basic auth (engineer2/DevPass2025@) only works for Swagger docs

---

## Client Communication Log

| Date | Direction | Summary |
|------|-----------|---------|
| 2024-12-30 | OUT | Requested test credentials, reported auth issue |
| ??? | IN | (Awaiting response) |

---

## Quick Reference

### API Base
```
https://dev.api.myaimatchmaker.ai
```

### Cognito Config
```
User Pool: us-east-1_l3JxaWpl5
Client ID: 2ljj7mif1k7jjc2ajiq676fhm1
Region:    us-east-1
```

### Swagger Access
```
URL:      https://dev.api.myaimatchmaker.ai/docs
Username: engineer2
Password: DevPass2025@
```

### Test Flag
```typescript
// src/config.ts
USE_REAL_API: false  // Set true when backend ready
```

---

*This is a living document. Update here, don't create new files.*

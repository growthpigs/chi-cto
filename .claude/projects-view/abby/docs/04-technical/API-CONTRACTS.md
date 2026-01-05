# ABBY - API Contracts

**Product Name:** ABBY - The Anti-Dating App
**Version:** 1.0 MVP
**Last Updated:** December 20, 2024
**References:** PRD.md, DATA-MODEL.md

---

## Overview

This document defines the API contracts for ABBY. For MVP, these endpoints are **mocked locally**. V2 will integrate with Nathan's AWS backend using these same contracts.

**Base URL (V2):** `https://api.abby.app/v1`

---

## Authentication

All authenticated endpoints require Bearer token in Authorization header:
```
Authorization: Bearer <access_token>
```

### POST /auth/phone/send

Send verification code to phone number.

**Request:**
```typescript
{
  phoneNumber: string;  // E.164 format: +1234567890
}
```

**Response (200):**
```typescript
{
  success: true;
  expiresIn: number;    // Seconds until code expires (300)
  retryAfter: number;   // Seconds before can resend (60)
}
```

**Errors:**
- 400: Invalid phone number format
- 429: Too many requests (rate limited)

---

### POST /auth/phone/verify

Verify phone code and authenticate.

**Request:**
```typescript
{
  phoneNumber: string;
  code: string;  // 6-digit code
}
```

**Response (200):**
```typescript
{
  success: true;
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    phoneNumber: string;
    isNewUser: boolean;
    interviewStatus: "not_started" | "in_progress" | "completed";
  }
}
```

**Errors:**
- 400: Invalid code
- 401: Code expired
- 429: Too many attempts

---

### POST /auth/social

Authenticate via Apple, Google, or Facebook.

**Request:**
```typescript
{
  provider: "apple" | "google" | "facebook";
  idToken: string;  // Provider's ID token
}
```

**Response (200):**
```typescript
{
  success: true;
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    isNewUser: boolean;
    interviewStatus: "not_started" | "in_progress" | "completed";
  }
}
```

**Errors:**
- 400: Invalid provider
- 401: Invalid or expired token
- 500: Provider error

---

### POST /auth/refresh

Refresh access token.

**Request:**
```typescript
{
  refreshToken: string;
}
```

**Response (200):**
```typescript
{
  accessToken: string;
  refreshToken: string;
}
```

**Errors:**
- 401: Invalid or expired refresh token

---

## User Profile

### GET /user/profile

Get current user's profile.

**Response (200):**
```typescript
{
  id: string;
  displayName: string;
  dateOfBirth: string;  // ISO 8601
  age: number;
  gender: string;
  seekingGenders: string[];
  ethnicity: string;
  ethnicityPrefs: string[];
  relationshipType: string;
  smokingPref: string;
  interviewStatus: "not_started" | "in_progress" | "completed";
  createdAt: string;
}
```

---

### PUT /user/profile

Update user profile (onboarding or later edits).

**Request:**
```typescript
{
  fullName?: string;
  displayName?: string;
  dateOfBirth?: string;
  preferredAgeMin?: number;
  preferredAgeMax?: number;
  gender?: string;
  seekingGenders?: string[];
  ethnicity?: string;
  ethnicityPrefs?: string[];
  relationshipType?: string;
  smokingPref?: string;
}
```

**Response (200):**
```typescript
{
  success: true;
  user: { /* Updated user profile */ }
}
```

**Errors:**
- 400: Validation error (with field-level details)
- 401: Unauthorized

---

## Interview

### POST /interview/start

Start a new interview session.

**Request:**
```typescript
{
  // No body required
}
```

**Response (200):**
```typescript
{
  sessionId: string;
  firstQuestion: {
    id: string;
    category: string;
    vibeState: "TRUST" | "DEEP" | "CAUTION" | "PASSION" | "GROWTH";
    type: "choice" | "multi_choice" | "scale" | "text" | "picturegram";
    text: string;
    voiceText: string;
    options?: Array<{
      id: string;
      text: string;
      voiceText?: string;
    }>;
    scaleMin?: number;
    scaleMax?: number;
    scaleLabels?: string[];
    required: boolean;
  };
  progress: {
    current: number;
    total: number;
    percentComplete: number;
  };
}
```

---

### GET /interview/resume

Resume an existing interview session.

**Response (200):**
```typescript
{
  sessionId: string;
  currentQuestion: { /* Same as firstQuestion above */ };
  progress: {
    current: number;
    total: number;
    percentComplete: number;
  };
  lastUpdatedAt: string;
}
```

**Response (404):**
```typescript
{
  error: "no_active_session";
  message: "No interview session to resume";
}
```

---

### POST /interview/answer

Submit an answer to the current question.

**Request:**
```typescript
{
  sessionId: string;
  questionId: string;
  answer: {
    // For choice
    selected?: string;
    // For multi_choice
    selected?: string[];
    // For scale
    value?: number;
    // For text
    text?: string;
    // For picturegram
    categories?: string[];
    weights?: number[];
  };
  answerMethod: "touch" | "voice";
  voiceTranscript?: string;
}
```

**Response (200):**
```typescript
{
  success: true;
  nextQuestion: { /* Question object or null if complete */ };
  progress: {
    current: number;
    total: number;
    percentComplete: number;
    sectionComplete: boolean;
  };
  abbyResponse?: {
    text: string;      // What Abby says in response
    emotion: string;   // For orb animation
  };
}
```

**Errors:**
- 400: Invalid answer format
- 404: Session or question not found
- 409: Question already answered

---

### POST /interview/skip

Skip the current question (if allowed).

**Request:**
```typescript
{
  sessionId: string;
  questionId: string;
  reason?: string;  // Optional: "not_sure" | "prefer_not_to_say" | "ask_later"
}
```

**Response (200):**
```typescript
{
  success: true;
  nextQuestion: { /* Question object */ };
  progress: { /* Progress object */ };
}
```

**Errors:**
- 400: Question cannot be skipped (required: true)
- 404: Session or question not found

---

### GET /interview/progress

Get current interview progress.

**Response (200):**
```typescript
{
  sessionId: string;
  status: "active" | "paused" | "completed";
  progress: {
    current: number;
    total: number;
    percentComplete: number;
    byCategory: {
      [category: string]: {
        completed: number;
        total: number;
      };
    };
  };
  startedAt: string;
  estimatedTimeRemaining: number;  // Minutes
}
```

---

## Voice

### POST /voice/transcribe

Transcribe voice input and extract intent.

**Request:**
```
Content-Type: multipart/form-data

audio: File (audio/wav or audio/m4a)
context: string  // Current question ID for better transcription
```

**Response (200):**
```typescript
{
  transcription: string;
  intent: "answer" | "command" | "clarification" | "unclear";
  confidence: number;  // 0-1
  // If intent is "answer"
  extractedAnswer?: {
    type: "choice" | "scale" | "text";
    value: any;
  };
  // If intent is "command"
  command?: "go_back" | "skip" | "repeat" | "help";
}
```

**Errors:**
- 400: Invalid audio format
- 413: Audio too long (max 60 seconds)
- 500: Transcription service error

---

### POST /voice/conversation

Send message to ElevenLabs conversational agent.

**Request:**
```typescript
{
  sessionId: string;
  message: string;  // User's transcribed message
  context: {
    currentQuestion: string;
    vibeState: string;
    recentAnswers: string[];  // Last 3 for context
  };
}
```

**Response (200):**
```typescript
{
  response: {
    text: string;       // Abby's response text
    audioUrl?: string;  // Pre-generated audio URL (optional)
    emotion: "neutral" | "curious" | "empathetic" | "excited" | "thoughtful";
  };
  nextAction: "continue" | "wait_for_answer" | "transition";
  suggestedVibeState?: string;
}
```

---

## App State

### GET /app/config

Get app configuration (feature flags, etc.).

**Response (200):**
```typescript
{
  featureFlags: {
    voiceEnabled: boolean;
    lowPowerModeThreshold: number;  // Battery percentage
    maxVoiceDuration: number;       // Seconds
  };
  questionCount: number;
  appVersion: {
    minimum: string;
    current: string;
    updateUrl: string;
  };
}
```

---

## Error Response Format

All errors follow this structure:

```typescript
{
  error: string;           // Error code (snake_case)
  message: string;         // Human-readable message
  details?: {              // Field-level errors for validation
    [field: string]: string;
  };
  retryAfter?: number;     // For rate limiting (seconds)
}
```

**Common Error Codes:**
| Code | HTTP Status | Description |
|------|-------------|-------------|
| invalid_request | 400 | Malformed request body |
| validation_error | 400 | Field validation failed |
| unauthorized | 401 | Missing or invalid auth |
| forbidden | 403 | Insufficient permissions |
| not_found | 404 | Resource doesn't exist |
| conflict | 409 | Resource state conflict |
| rate_limited | 429 | Too many requests |
| server_error | 500 | Internal server error |
| service_unavailable | 503 | External service down |

---

## Rate Limits

| Endpoint | Limit | Window |
|----------|-------|--------|
| /auth/phone/send | 3 | 5 minutes |
| /auth/phone/verify | 5 | 5 minutes |
| /interview/answer | 60 | 1 minute |
| /voice/* | 30 | 1 minute |
| All others | 100 | 1 minute |

---

## Mock Implementation (MVP)

For MVP, all endpoints are mocked locally:

```typescript
// src/services/api.ts
const USE_MOCK = true;

export const api = {
  interview: {
    start: () => USE_MOCK ? mockInterviewStart() : fetch('/interview/start'),
    answer: (data) => USE_MOCK ? mockAnswer(data) : fetch('/interview/answer', { body: data }),
    // ...
  }
};
```

Questions loaded from `src/data/questions.json` - no network calls.

---

*Document created: December 20, 2024*

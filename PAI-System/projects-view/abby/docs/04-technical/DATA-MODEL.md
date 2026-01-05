# ABBY - Data Model

**Product Name:** ABBY - The Anti-Dating App
**Version:** 1.0 MVP
**Last Updated:** December 20, 2024
**References:** PRD.md (US-001 through US-010)

---

## Overview

This document defines the data entities, relationships, and storage strategy for ABBY MVP. For MVP, data is stored locally with mock backend. V2 will integrate with Nathan's AWS backend.

---

## Entities

### User

Core user profile information collected during onboarding (US-001, US-002).

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id | UUID | Yes | Primary key |
| phoneNumber | string | Yes | Primary auth method |
| email | string | No | Secondary auth (social login) |
| authProvider | enum | Yes | phone / apple / google / facebook |
| fullName | string | Yes | Legal name (private, never shown) |
| displayName | string | Yes | Public name for matches |
| dateOfBirth | Date | Yes | For age calculation |
| preferredAgeMin | number | Yes | Minimum age preference |
| preferredAgeMax | number | Yes | Maximum age preference |
| gender | enum | Yes | User's sexual identity |
| seekingGenders | enum[] | Yes | Who they're looking for |
| ethnicity | enum | Yes | User's ethnicity |
| ethnicityPrefs | enum[] | No | Preferences (empty = no preference) |
| relationshipType | enum | Yes | serious / casual / unsure |
| smokingPref | enum | Yes | never / sometimes / regularly / no_pref |
| createdAt | DateTime | Yes | Account creation timestamp |
| lastActiveAt | DateTime | Yes | Last app usage |
| interviewStatus | enum | Yes | not_started / in_progress / completed |

**Enum: Gender**
```
male | female | non_binary | transgender_male | transgender_female |
genderqueer | agender | two_spirit | other | prefer_not_to_say
```

**Enum: Ethnicity**
```
white | black | hispanic_latino | asian | south_asian | middle_eastern |
native_american | pacific_islander | mixed | other | prefer_not_to_say
```

---

### InterviewSession

Tracks interview progress for resume capability (US-005).

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id | UUID | Yes | Primary key |
| userId | UUID | Yes | Foreign key to User |
| startedAt | DateTime | Yes | When session began |
| lastUpdatedAt | DateTime | Yes | Last activity timestamp |
| currentQuestionId | string | Yes | Current question in flow |
| completedQuestions | number | Yes | Count of completed questions |
| totalQuestions | number | Yes | Total questions in flow |
| status | enum | Yes | active / paused / completed / abandoned |
| expiresAt | DateTime | Yes | Draft expires after 7 days |

---

### InterviewResponse

Individual question answers (US-005, US-007).

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id | UUID | Yes | Primary key |
| sessionId | UUID | Yes | Foreign key to InterviewSession |
| userId | UUID | Yes | Foreign key to User |
| questionId | string | Yes | Question identifier from questions.json |
| questionType | enum | Yes | choice / multi_choice / scale / text / picturegram |
| answer | JSON | Yes | Flexible answer storage |
| answerMethod | enum | Yes | touch / voice |
| confidence | float | No | 0-1 how certain user seemed (voice analysis) |
| skipped | boolean | Yes | If user skipped this question |
| timestamp | DateTime | Yes | When answered |
| voiceTranscript | string | No | Raw voice transcription if applicable |

**Answer JSON Examples:**
```typescript
// choice
{ "selected": "option_a" }

// multi_choice
{ "selected": ["option_a", "option_c"] }

// scale
{ "value": 7, "min": 0, "max": 10 }

// text
{ "text": "I value honesty above all..." }

// picturegram
{ "categories": ["athletic", "curvy"], "weights": [0.8, 0.6] }
```

---

### Question (Static - from questions.json)

Question definitions loaded from local JSON (not a database table).

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id | string | Yes | Unique question identifier |
| category | string | Yes | Question category (values, lifestyle, physical, etc.) |
| vibeState | enum | Yes | TRUST / DEEP / CAUTION / PASSION / GROWTH |
| type | enum | Yes | choice / multi_choice / scale / text / picturegram |
| text | string | Yes | Question text for display |
| voiceText | string | No | Alternative text for Abby to speak |
| options | Option[] | No | For choice/multi_choice types |
| scaleMin | number | No | For scale type |
| scaleMax | number | No | For scale type |
| scaleLabels | string[] | No | Labels for scale endpoints |
| required | boolean | Yes | If question can be skipped |
| followUpQuestions | string[] | No | Conditional follow-up question IDs |

---

### AppState (Local Only)

Zustand store state - persisted to AsyncStorage.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| hubState | enum | Yes | Current app state machine position |
| vibeState | enum | Yes | Current vibe for VibeMatrix |
| user | User | No | Current user if authenticated |
| sessionId | UUID | No | Current interview session |
| orbPosition | enum | Yes | centered / docked / hidden |
| orbState | enum | Yes | breathing / active / thinking / listening / speaking |
| voiceEnabled | boolean | Yes | If voice mode is active |
| lowPowerMode | boolean | Yes | If shaders should be disabled |

**Enum: HubState**
```
SPLASH | ONBOARDING | MEETING_ABBY | INTERVIEW | INTERVIEW_COMPLETE
```

**Enum: VibeState**
```
TRUST | DEEP | CAUTION | PASSION | GROWTH | ALERT
```

---

## Relationships

```
User 1──────* InterviewSession (one user, many sessions over time)
InterviewSession 1──────* InterviewResponse (one session, many responses)
User 1──────* InterviewResponse (denormalized for quick queries)
```

---

## Storage Strategy

### MVP (Local-First)

| Data | Storage | Persistence |
|------|---------|-------------|
| User profile | AsyncStorage | Permanent |
| Interview progress | AsyncStorage | 7 days |
| App state | Zustand + AsyncStorage | Session + persist |
| Questions | Static JSON bundle | App binary |

### V2 (Backend Integration)

| Data | Storage | Sync Strategy |
|------|---------|---------------|
| User profile | Nathan's PostgreSQL | On change |
| Interview responses | Nathan's PostgreSQL | Real-time |
| Voice recordings | AWS S3 | Upload on answer |
| Match data | Nathan's PostgreSQL | Push notifications |

---

## Database Choice (V2)

| Option | Decision | Reason |
|--------|----------|--------|
| Database | PostgreSQL (Nathan's AWS) | Team expertise, relational data |
| ORM | TBD (Nathan's choice) | Backend team decision |
| Hosting | AWS RDS | Nathan manages infrastructure |
| File Storage | AWS S3 | Voice recordings, photos |

---

## Security Considerations

1. **fullName** is private - never exposed in API responses to other users
2. **phoneNumber** used only for auth, never shared
3. **voiceTranscript** may contain sensitive info - encrypt at rest
4. **Interview responses** contain intimate personal data - strict access controls
5. All data encrypted in transit (HTTPS) and at rest (AES-256)

---

*Document created: December 20, 2024*

# Statement of Work: ABBY MVP

**Document Version:** 1.0
**Date:** December 31, 2024
**Client:** Manuel Negreiro
**Provider:** Badaboost LLC

---

## 1. Project Overview

### 1.1 Background
ABBY is a matchmaking application featuring an AI-driven interview experience. The Client engaged Provider to build the frontend design system and connect it to the Client's backend API, which was represented as 85% complete at project start.

### 1.2 Objective
Deliver a production-ready iOS application frontend that:
- Provides a "living interface" experience (VibeMatrix shaders, animated Orb)
- Implements glassmorphic UI design system
- Connects to Client's existing backend API
- Enables voice and text conversations with AI matchmaker

---

## 2. Scope of Work

### 2.1 Phase 1: Design System (COMPLETE)

| Deliverable | Description | Status |
|-------------|-------------|--------|
| VibeMatrix | GLSL shader background with 6 emotional states | ✅ Delivered |
| AbbyOrb | Animated AI entity with breathing/reaction states | ✅ Delivered |
| Glass UI Components | 11-component library (buttons, cards, inputs, sheets) | ✅ Delivered |
| Typography System | JetBrains Mono + SF Pro with glass effects | ✅ Delivered |
| Motion System | Reanimated-based animation constants | ✅ Delivered |
| Question Flow | Interview screen with voice/text input | ✅ Delivered |

### 2.2 Phase 2: Application Flow (DELIVERED - Pending Formal Agreement)

The following screens were built to deliver a complete application experience:

| Category | Screens | Count |
|----------|---------|-------|
| Authentication | Login, Email, Phone, Verification (x2) | 5 |
| Onboarding | Gender, Location, Relationship, Preferences, Permissions | 5 |
| Core Experience | CoachIntro, Interview, Loading | 3 |
| Match Flow | Searching, Match, Payment, Reveal, Coach | 5 |
| **Total** | | **18 screens** |

### 2.3 Phase 3: Backend Integration (BLOCKED)

| Deliverable | Description | Status |
|-------------|-------------|--------|
| API Client | Type-safe client matching backend contracts | ✅ Built |
| Mock Layer | Development mocking for all endpoints | ✅ Built |
| Integration | Connection to Client's API | ⏳ Awaiting credentials |

**Blocker:** Backend API credentials and documentation not yet provided by Client.

---

## 3. Deliverables Schedule

| Phase | Deliverables | Status |
|-------|--------------|--------|
| Phase 1 | Design system + core components | ✅ Complete |
| Phase 2 | Full application screens | ✅ Complete |
| Phase 3 | Backend integration | ⏳ Blocked |
| Phase 4 | TestFlight deployment | Pending Phase 3 |

---

## 4. Client Responsibilities

The Client agrees to provide:

| Item | Required By | Status |
|------|-------------|--------|
| Backend API credentials | Before Phase 3 | ⏳ Pending |
| API documentation | Before Phase 3 | ⏳ Pending |
| Test user accounts | Before Phase 3 | ⏳ Pending |
| ElevenLabs agent configuration | Before voice testing | ⏳ Pending |
| Apple Developer account access | Before TestFlight | ⏳ Pending |
| Timely feedback (within 48 hours) | Ongoing | Active |

---

## 5. Terms and Conditions

### 5.1 Scope Control

**Fixed Scope = Fixed Price.** Any work beyond the deliverables listed in Section 2 requires a written Change Order signed by both parties before work begins.

Scope changes include but are not limited to:
- Additional screens or features
- Changes to approved designs
- New API integrations
- Additional platform support (Android)

### 5.2 API Integration Clause

**Client API Responsibility.** The Client represented that their backend API is 85% complete. Provider's scope includes connecting to a functional API, not debugging, fixing, or completing the Client's backend.

If Provider encounters:
- Missing endpoints
- Incorrect API responses
- Authentication failures
- Data format issues
- Undocumented API behavior

Provider will document the issue and notify Client. Time spent investigating, working around, or waiting for Client API fixes is **not included** in the fixed scope and will be billed at the standard rate if Provider agrees to assist.

### 5.3 Revision Limits

The fixed scope includes:
- **Design iterations:** Up to 3 rounds of revision per screen
- **Shader tuning:** Up to 5 color palette variations
- **Component adjustments:** Within design system parameters

Additional revisions beyond these limits require a Change Order.

### 5.4 Response Time

Client agrees to respond to questions and provide feedback within **48 business hours**. Delays in Client response may extend project timeline proportionally.

### 5.5 Testing Environment

Client is responsible for providing a functional testing environment, including:
- Sandbox API access
- Test user credentials
- Payment gateway test mode (if applicable)

Provider cannot complete integration testing without these resources.

### 5.6 Intellectual Property

Upon full payment:
- Client owns all application code and designs created for this project
- Provider retains rights to general-purpose tools and libraries used
- Provider may reference project in portfolio (with Client approval)

---

## 6. Payment Terms

Payment terms to be discussed and agreed before signature. Options:

**Option A: Milestone-Based**
| Milestone | Trigger |
|-----------|---------|
| Deposit | Upon SOW signature |
| Backend Integration Complete | After successful API connection |
| Final Delivery | TestFlight build approved |

**Option B: Fixed Payment**
| Payment | Due |
|---------|-----|
| Full amount | Upon SOW signature |

*[Client to select preferred option and amounts before signing]*

---

## 7. Change Order Process

For any work outside the scope defined in Section 2:

1. **Request:** Client submits written request describing desired change
2. **Estimate:** Provider responds within 48 hours with DU estimate and timeline impact
3. **Approval:** Client approves in writing before work begins
4. **Execution:** Provider completes change and updates Work Ledger
5. **Billing:** Change is added to next invoice

**No verbal scope changes.** All scope modifications require written approval.

---

## 8. Signatures

By signing below, both parties agree to the terms of this Statement of Work.

**Provider: Badaboost LLC**

Signature: _________________________

Name: Roderic Andrews

Date: _________________________

---

**Client:**

Signature: _________________________

Name: Manuel Negreiro

Date: _________________________

---

## Appendix A: Screen Inventory

Complete list of screens delivered:

1. LoginScreen.tsx
2. EmailScreen.tsx
3. EmailVerificationScreen.tsx
4. PhoneNumberScreen.tsx
5. VerificationCodeScreen.tsx
6. BasicsGenderScreen.tsx
7. BasicsLocationScreen.tsx
8. BasicsRelationshipScreen.tsx
9. BasicsPreferencesScreen.tsx
10. PermissionsScreen.tsx
11. CoachIntroScreen.tsx
12. InterviewScreen.tsx
13. LoadingScreen.tsx
14. SearchingScreen.tsx
15. MatchScreen.tsx
16. PaymentScreen.tsx
17. RevealScreen.tsx
18. CoachScreen.tsx

---

## Appendix B: Component Library

UI components delivered:

1. GlassButton
2. GlassCard
3. GlassSheet
4. GlassInput
5. ChatInput
6. CodeInput
7. Checkbox
8. RadioGroup
9. ConversationOverlay
10. Typography
11. FormScreen

---

**Document Created:** 2024-12-31
**Status:** DRAFT - Pending Client Review and Signature

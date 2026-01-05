# ABBY - Product Requirements Document

**Product Name:** ABBY - The Anti-Dating App
**Version:** 1.0 MVP
**Last Updated:** December 22, 2024
**Client:** Manuel Negreiro

---

## Product Overview

### Vision
ABBY revolutionizes online dating by eliminating the "swipe grid" entirely. Instead of browsing endless profiles, users have intimate conversations with Abby, an AI matchmaker who learns their deepest compatibility needs and finds their person. The interface feels alive - a glass pane floating over a living, bioluminescent ocean that breathes and reacts to the emotional state of the conversation.

### Target Users
**Primary:** Adults 25-45 seeking serious relationships - Professionals, divorced individuals, and people burned out on traditional dating apps who value genuine connection over casual encounters.

**Secondary:** Dating-curious individuals 22-35 - People who find traditional dating apps overwhelming or superficial but are open to AI-guided matchmaking.

### Success Metrics
| Metric | Target |
|--------|--------|
| User Completion Rate | 80%+ complete the full Abby interview |
| Session Duration | Average 15+ minutes per session |
| Voice Usage | 60%+ of users engage with voice features |
| Frame Rate | Consistent 60fps during animations |
| Client Validation | Approved for V2 development funding |

---

## User Stories (MVP)

### Epic: Onboarding & Authentication

**US-001: Account Creation**
As a potential user, I want to create an account using phone/email/social login so that I can access the app securely.

Acceptance Criteria:
- [ ] User can enter phone number or email address
- [ ] User can continue with Apple, Facebook, or Google
- [ ] Phone verification with 6-digit code works
- [ ] User can change phone number during verification
- [ ] Account creation saves basic auth info

**US-002: Basic Profile Setup**
As a new user, I want to provide my basic information so that Abby can begin to understand who I am.

Acceptance Criteria:
- [ ] User enters full legal name (private) and display name (public)
- [ ] User enters date of birth and preferred age range
- [ ] User selects sexual identity from comprehensive list
- [ ] User selects who they're looking for from comprehensive list
- [ ] User selects ethnicity (theirs and preferences)
- [ ] User selects relationship type and smoking preferences

---

### Epic: Meeting Abby

**US-003: Abby Introduction**
As a user who completed basic setup, I want to meet Abby in a magical way so that I feel excited about the process.

Acceptance Criteria:
- [ ] VibeMatrix background renders smoothly with color morphing
- [ ] Abby orb appears with breathing animation
- [ ] Transition from onboarding to Abby is seamless
- [ ] User feels the interface is "alive" not static
- [ ] No white screens or jarring cuts

**US-004: Voice Conversation with Abby**
As a user meeting Abby, I want to have a natural voice conversation so that it feels like talking to a real matchmaker.

Acceptance Criteria:
- [ ] User can activate voice mode
- [ ] ElevenLabs agent responds in real-time
- [ ] Voice latency is under 500ms for response start
- [ ] User can switch between voice and text seamlessly
- [ ] Abby responds contextually to user hesitation or confusion

---

### Epic: The Interview Process

**US-005: Deep Compatibility Questions**
As a user, I want Abby to ask me thoughtful questions about relationships so that she can find someone truly compatible.

Acceptance Criteria:
- [ ] Questions appear as appropriate UI (buttons, sliders, text input)
- [ ] User can answer via voice or touch interface
- [ ] Progress is saved if user exits mid-interview
- [ ] Abby reacts to answers with appropriate responses
- [ ] Interface adapts to question type (multiple choice, scale, open-ended)

**US-006: Emotional State Visualization**
As a user, I want the background to reflect the mood of our conversation so that the experience feels emotionally connected.

Acceptance Criteria:
- [ ] VibeMatrix shifts to TRUST (blue) during onboarding
- [ ] VibeMatrix shifts to DEEP (violet) during intimate questions
- [ ] VibeMatrix shifts to CAUTION (orange) during deal-breaker topics
- [ ] Color transitions are smooth (800-1200ms) not jarring
- [ ] Abby orb position and breathing adapt to conversation state

**US-007: Physical Preferences (Picturegram)**
As a user, I want to communicate my physical preferences visually so that I can be honest about attraction.

Acceptance Criteria:
- [ ] User can select multiple physical preference categories
- [ ] Interface feels judgment-free and safe
- [ ] Preferences are captured with appropriate weights
- [ ] User understands their choices affect matching

---

### Epic: Glass Interface System

**US-008: Consistent Glass UI**
As a user, I want all interface elements to feel cohesive with the glass metaphor so that the experience feels premium and unified.

Acceptance Criteria:
- [ ] All UI components use BlurView consistently
- [ ] Text is always readable over the moving background
- [ ] Buttons and cards feel like they're floating on glass
- [ ] Touch feedback works properly through blur effects
- [ ] Interface never breaks the glass/ocean metaphor

---

### Epic: Performance & Polish

**US-009: Smooth Performance**
As a user, I want the app to run smoothly so that the magical feeling isn't broken by technical issues.

Acceptance Criteria:
- [ ] App maintains 60fps during normal usage
- [ ] Shader performance doesn't drain battery excessively
- [ ] Low power mode switches to static backgrounds when battery < 20%
- [ ] App launches in under 3 seconds
- [ ] No crashes during 10-minute usage sessions

**US-010: TestFlight Demo**
As a client, I want to see a working demo on my device so that I can evaluate the concept.

Acceptance Criteria:
- [ ] App is available via TestFlight
- [ ] Full user flow can be completed without crashes
- [ ] Core experience (VibeMatrix + Abby + Questions) is functional
- [ ] Voice integration works on physical device
- [ ] App demonstrates the "alive" feeling effectively

---

### Epic: Settings & Input Mode (Added 2024-12-22)

**US-011: Input Mode Selection**
As a user, I want to choose my preferred input mode (voice only, text only, or both) so that I can interact with Abby in my most comfortable way.

Acceptance Criteria:
- [ ] User can access Settings screen before interview starts
- [ ] 3 input modes available: voice only, text only, voice+text
- [ ] Selection persists across app sessions (AsyncStorage)
- [ ] Can change mode during interview (in voice+text mode via drag handle)
- [ ] Default mode is voice+text
- [ ] Settings accessible via gear icon on Onboarding screen

**US-012: Conversation Transcript Display**
As a user, I want to see the conversation with Abby as text so that I can follow along and reference what was said.

Acceptance Criteria:
- [ ] Transcript appears in blur overlay during interview
- [ ] Abby's messages and user responses both shown
- [ ] Text uses Merriweather 13pt, 5px padding, 125% line height
- [ ] Overlay height adapts to input mode (0%/50%/100%)
- [ ] Drag handle allows hiding text in voice+text mode
- [ ] Auto-scrolls to latest message

---

## User Stories (V2 / Future)

| ID | Story | Description |
|----|-------|-------------|
| US-F01 | Match Revelation Flow | User receives bio-only match, can pay to unlock photos, full reveal system |
| US-F02 | Verification & Certification | Identity verification system to eliminate bots and fake profiles |
| US-F03 | Coach Mode | Ongoing relationship guidance from Abby after matching |
| US-F04 | Premium Subscription Tiers | Gold/Platinum features with advanced matching and priority support |
| US-F05 | Android Version | Cross-platform compatibility for broader market reach |

---

## Non-Functional Requirements

### Performance
- Maintain 60fps during animations and shader rendering
- App launch time under 3 seconds
- Voice response latency under 500ms
- Memory usage under 200MB during normal operation

### Security
- All user data encrypted in transit and at rest
- No profile browsing prevents unauthorized access to user photos
- Secure storage of voice conversation metadata

### Scalability
- Architecture supports 1000+ concurrent users (V2)
- Question flow easily extensible without code changes
- Shader system supports additional vibe states

### Accessibility
- Voice-first design accommodates various abilities
- Text alternatives for all voice interactions
- High contrast mode for visual impairments

---

## Constraints & Assumptions

### Constraints
- iOS only for MVP (iPhone 12+ recommended)
- 14-day development timeline (hard deadline)
- $5K budget for MVP phase
- Must coordinate with Nathan's backend development

### Assumptions
- ElevenLabs agent is functional and credentials will be provided
- Apple Developer account access available for TestFlight
- Users are comfortable with AI-guided matchmaking
- Target demographic has modern iPhones capable of shader rendering

---

## Dependencies

| Dependency | Type | Status | Risk |
|------------|------|--------|------|
| ElevenLabs Agent Credentials | External | Pending | High |
| Apple Developer/TestFlight Access | External | Pending | High |
| Nathan's API Contracts | Internal | Can Mock | Medium |
| @shopify/react-native-skia | External | Stable | Low |
| Expo SDK 50+ | External | Stable | Low |

---

## Open Questions

- [ ] How many of the 100+ questions should be included in MVP vs V2?
- [ ] What fallback experience if voice fails or user prefers not to use it?
- [ ] Should we implement any basic matching algorithm for MVP demo?
- [ ] What happens after user completes interview - just end screen or preview flow?

---

*Document created: December 20, 2024*

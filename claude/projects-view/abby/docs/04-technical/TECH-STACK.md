# ABBY - Technology Stack

**Product Name:** ABBY - The Anti-Dating App
**Version:** 1.0 MVP
**Last Updated:** December 20, 2024
**References:** PRD.md

---

## Overview

Technology decisions for ABBY prioritize:
1. **Visual richness** - GLSL shaders, smooth animations
2. **Voice-first UX** - Low-latency conversational AI
3. **iOS performance** - 60fps on iPhone 12+
4. **Rapid development** - 14-day MVP timeline

---

## Frontend Stack

| Layer | Technology | Version | Why |
|-------|------------|---------|-----|
| Framework | Expo | 54.0 | Managed workflow, fast iteration, EAS builds |
| Runtime | React Native | 0.81.5 | iOS native performance, large ecosystem |
| Language | TypeScript | 5.9 | Type safety, better DX, fewer runtime errors |
| UI React | React | 19.1 | Latest features, concurrent rendering |

---

## Graphics & Animation

| Layer | Technology | Version | Why |
|-------|------------|---------|-----|
| Shaders | @shopify/react-native-skia | 2.4.7 | High-performance GLSL, GPU-accelerated |
| Animation | react-native-reanimated | 4.1.1 | 60fps UI animations, worklet-based |
| Worklets | react-native-worklets-core | 1.6.2 | Required for Skia + Reanimated |
| Gestures | react-native-gesture-handler | 2.29.1 | Native gesture recognition |
| Blur | expo-blur | 15.0.8 | Native BlurView for glass UI |
| Haptics | expo-haptics | 15.0.8 | Tactile feedback |

### Why Skia over Reanimated-only?

- **GLSL shaders** - True fragment shaders for the "bioluminescent ocean" effect
- **GPU rendering** - Offloads complex visuals from JS thread
- **Color morphing** - Smooth color space interpolation in shader code
- **Performance** - 60fps even with complex domain warping effects

---

## Voice & Conversation

| Layer | Technology | Version | Why |
|-------|------------|---------|-----|
| Voice SDK | @elevenlabs/react-native | 0.2.1 | Pre-built Abby agent, low latency |
| WebRTC | @livekit/react-native | 2.7.1 | Real-time audio streaming |
| WebRTC Core | @livekit/react-native-webrtc | 125.0.7 | Native WebRTC implementation |
| Audio Client | livekit-client | 2.9.5 | Audio session management |

### Voice Architecture

```
User speaks → LiveKit captures → ElevenLabs processes → Abby responds
     ↓              ↓                    ↓                   ↓
  Orb pulses    Stream audio      Agent generates       Play audio
  "Listening"   to ElevenLabs     contextual reply      + animate orb
```

ElevenLabs agent is **pre-configured** with Abby's personality and question flow.

---

## State Management

| Layer | Technology | Version | Why |
|-------|------------|---------|-----|
| State | Zustand | 4.5.7 | Simple, performant, TypeScript-first |
| Persistence | AsyncStorage (via Zustand) | - | Persist interview progress |

### Why Zustand over Redux/MobX?

- **Minimal boilerplate** - Critical for 14-day timeline
- **TypeScript native** - Full type inference
- **Small bundle** - ~1KB vs Redux ~7KB
- **Reanimated compatible** - Easy to share state with worklets

---

## Typography

| Layer | Technology | Version | Why |
|-------|------------|---------|-----|
| Fonts | @expo-google-fonts/merriweather | 0.4.2 | Serif font for premium feel |
| Font Loading | expo-font | 14.0.10 | Async font loading |

---

## Development & Testing

| Layer | Technology | Version | Why |
|-------|------------|---------|-----|
| Testing | Jest | 30.2.0 | Standard React Native testing |
| TS Jest | ts-jest | 29.4.6 | TypeScript test support |
| Type Defs | @types/react, @types/jest | Latest | Type definitions |
| Bundler | Metro (via Expo) | - | Default RN bundler |

---

## Build & Deploy

| Layer | Technology | Why |
|-------|------------|-----|
| Build Service | EAS Build | Cloud builds, no local Xcode needed |
| Distribution | TestFlight | Client demo distribution |
| App Store | EAS Submit | Automated submission |
| OTA Updates | EAS Update | Hot fixes without App Store review |

### Build Profiles

```javascript
// eas.json
{
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal",  // TestFlight
      "ios": {
        "simulator": false
      }
    },
    "production": {
      "autoIncrement": true
    }
  }
}
```

---

## Backend (V2 - Nathan's Scope)

| Layer | Technology | Managed By |
|-------|------------|------------|
| Runtime | Node.js / AWS Lambda | Nathan |
| Database | PostgreSQL (AWS RDS) | Nathan |
| Storage | AWS S3 | Nathan |
| Auth | AWS Cognito or custom | Nathan |
| API | REST or GraphQL | Nathan |

### MVP Mock Strategy

For MVP, all backend is mocked locally:

```typescript
// src/services/mockApi.ts
export const mockApi = {
  // All endpoints return static/generated data
  // Questions loaded from questions.json
  // User data stored in AsyncStorage
};
```

---

## Third-Party Integrations

| Service | Purpose | Integration |
|---------|---------|-------------|
| ElevenLabs | Conversational AI agent | SDK + pre-built agent |
| Apple Sign-In | Social auth | Expo AuthSession |
| Google Sign-In | Social auth | Expo AuthSession |
| Sentry | Error tracking | @sentry/react-native (V2) |

---

## Device Requirements

| Requirement | Minimum | Recommended |
|-------------|---------|-------------|
| iOS Version | 15.0 | 17.0+ |
| Device | iPhone 11 | iPhone 13+ |
| RAM | 4GB | 6GB |
| GPU | A13 Bionic | A15+ |

### Performance Budget

| Metric | Target | Fallback |
|--------|--------|----------|
| Frame Rate | 60fps | Reduce shader complexity |
| Memory | <200MB | Dispose shader resources |
| Battery | <10%/10min | Static gradient mode |
| Launch | <3s | Preload minimal assets |

---

## Security Considerations

| Layer | Approach |
|-------|----------|
| Token Storage | Expo SecureStore |
| Network | HTTPS only (App Transport Security) |
| Sensitive Data | Never log PII |
| Voice Data | Stream only, no local storage |

---

## Dependency Decisions Log

| Decision | Chosen | Rejected | Reason |
|----------|--------|----------|--------|
| Animation | Reanimated | Animated API | Worklet performance |
| Shaders | Skia | React Native GL | Better RN integration |
| State | Zustand | Redux | Simplicity, timeline |
| Voice | ElevenLabs | Whisper + custom | Pre-built agent |
| Blur | expo-blur | react-native-blur | Expo managed |

---

## File Structure

```
src/
├── components/
│   ├── layers/           # VibeMatrix, AbbyOrb, GlassInterface
│   ├── ui/               # GlassCard, RichButton, Typography
│   └── screens/          # InterviewScreen, etc.
├── store/
│   └── useAppStore.ts    # Zustand store
├── services/
│   ├── api.ts            # API client
│   ├── mockApi.ts        # MVP mocks
│   └── voice.ts          # ElevenLabs integration
├── shaders/
│   └── vibeMatrix.glsl   # GLSL shader code
├── constants/
│   ├── colors.ts
│   ├── typography.ts
│   └── motion.ts
├── types/
│   └── index.ts
└── data/
    └── questions.json    # Question flow data
```

---

*Document created: December 20, 2024*

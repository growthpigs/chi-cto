# ABBY Runbook

> **Client:** Manuel Negreiro
> **Project:** ABBY (The Anti-Dating App)
> Operational procedures and troubleshooting for the ABBY iOS app

---

## 🔴 CRITICAL: CORRECT WORKTREE

**ALWAYS work in `/abby-client-api` (client-api-integration branch)**

| Worktree | Branch | Purpose | Use For |
|----------|--------|---------|---------|
| `/abby-client-api` | `client-api-integration` | **ACTIVE WORK** | All development |
| `/abby` | `main` | Legacy ElevenLabs demo | Reference only |

```bash
# ALWAYS start here:
cd /Users/rodericandrews/_PAI/projects/abby-client-api
```

**Why:**
- `abby-client-api` uses mocks and client backend API
- `abby` uses ElevenLabs (legacy, don't modify)
- Making changes in wrong worktree breaks the app

---

## Project Info

### Google Drive Folders

| Folder | ID |
|--------|-----|
| Root (ABBY) | `1xKaC62ap5_gN2ZJo0MMiSfIin933Y-TH` |
| Client Intake | `1cm5pNEaLcDXRjAnaMzgmW7wubojT9CzM` |
| 00-OVERVIEW | `1Nm4gz5AQ30eayxRjMSWoM_lDIUiu47yU` |
| 01-INTAKE | `1Ss3z6NZy6QeMHa-KhmCr-XX8A_8ltF1v` |
| 02-PROPOSALS | `1FYd8FFOMMsXBRvxbwNyKQnyb8yQlX8Ez` |
| 03-SPECS | `1BUECvMqtlCBT9NfBg5pBPTWe3dSoW7pg` |
| 04-WORK | `1e9V8Seo1T7Lk7ZAXKDFMtnc2XojN8AOa` |
| 05-REPORTS | `1nHX_xjtcq7y2jBprgavmIIEyevG4dHAd` |
| 06-DELIVERED | `1JnB6HCp0rswJeSYBN12M3hBi9Vk-VCg6` |
| _INTERNAL | `1BPbvl0RENoQyvVldx8QU33E0AJ4M6cW4` |

### Key Contacts

| Role | Name | Responsibility |
|------|------|----------------|
| Client / Decision Maker | Manuel Negreiro | Approvals, direction |
| Client Contact | Brent | Communication |
| Frontend + Integration | Diiiploy | App development |
| Backend / AWS | Nathan | Heavy infrastructure, APIs, S3 |

### Third-Party Integrations

| Service | Purpose | Status |
|---------|---------|--------|
| ElevenLabs | Real-time voice conversation | ✅ Working |
| Sentry | Error tracking | To configure |
| AWS S3 (Nathan) | Voice file storage | Nathan manages |

### Performance Targets

| Metric | Target |
|--------|--------|
| App Launch | < 3 seconds |
| Frame Rate | 60fps sustained |
| Voice Latency | < 500ms response start |
| Memory Usage | < 200MB normal operation |
| Battery Impact | < 10%/10min active use |

---

## Development Startup

### TL;DR - Two Options

```bash
# Option 1: Single command (builds + runs + starts Metro)
npx expo run:ios

# Option 2: Separate Metro (faster for rebuilds)
npm start              # Terminal 1 - Metro bundler
npx expo run:ios       # Terminal 2 - Build & run app
```

### Port: 8081

Metro runs on `http://localhost:8081`. If you see "Could not connect to development server":

```bash
# Kill stale processes
pkill -f metro
pkill -f "expo start"
lsof -ti:8081 | xargs kill -9  # Nuclear option

# Then restart
npm start
```

### Why Dev Build (not Expo Go)?

**CRITICAL: NEVER use Expo Go for ABBY. Always use `npx expo run:ios`.**

Two features require native modules NOT available in Expo Go:

1. **Skia Shaders** (VibeMatrix background) - Requires native Skia runtime
   - Error: `Expected arraybuffer as first parameter` in Container.native.ts

2. **Voice Conversation** (ElevenLabs/OpenAI Realtime) - Requires LiveKit WebRTC
   - Error: `VOICE REQUIRES A DEVELOPMENT BUILD`

| Command | Mode | Shaders | Voice | Metro |
|---------|------|---------|-------|-------|
| `npx expo run:ios` | Dev Build | ✅ | ✅ | Starts automatically |
| `npm start` | Metro only | - | - | Must run app separately |
| `expo start` | Expo Go | ❌ | ❌ | **NEVER USE** |

**Visual perfection is non-negotiable** - The shader background and orb must render correctly.

---

## Common Issues & Fixes

### 1. "react-native-reanimated is not installed"

**Symptom:** App crashes on launch with reanimated error

**Root Cause:** CocoaPods not installed after npm install

**Fix:**
```bash
cd ios && pod install && cd ..
npm run ios
```

---

### 2. WorkletsError Version Mismatch

**Symptom:** `WorkletsError: [Reanimated] The JavaScript and native parts of Worklets are incompatible`

**Root Cause:** JS version (0.7.x) doesn't match native (0.5.x)

**Fix:**
```bash
npm install react-native-worklets@0.5.1 --legacy-peer-deps
cd ios && pod install && cd ..
rm -rf ~/Library/Developer/Xcode/DerivedData/Abby-*
npm run ios
```

---

### 3. "No script URL provided"

**Symptom:** Metro bundler crashed, app shows "No script URL" error

**Root Cause:** Metro process died or cache corrupted

**Fix:**
```bash
pkill -f "expo"
pkill -f "metro"
rm -rf node_modules/.cache/metro
npx expo start --clear --ios
```

---

### 4. ElevenLabs Agent Disconnects Immediately

**Symptom:**
- Abby connects (shows "Connected" briefly)
- Then immediately shows "Disconnected"
- Metro logs show: `Disconnected: {"reason": "agent"}`

**Root Causes (in order of likelihood):**

1. **Audio session not started before SDK** - SDK expects audio infrastructure ready
2. **stopAudioSession() called in onDisconnect** - Interrupts SDK cleanup
3. **Microphone not capturing** - Track publishes but no audio data

**Diagnostic Logs to Look For:**
```
[AbbyAgent] Pre-starting audio session...
[AbbyAgent] Audio session ready
[AbbyAgent] Starting session with agent: agent_32...
[AbbyAgent] Connected: conv_...
WARN could not find local track subscription  ← This is the smoking gun
[AbbyAgent] Disconnected: {"reason": "agent"}
```

**Fix Applied (2024-12-23):**
- Removed `stopAudioSession()` from `onDisconnect` handler
- Added explicit `startAudioSession()` BEFORE `conversation.startSession()`
- Audio cleanup now happens in `endConversation()` instead

**If Still Disconnecting:**
1. Check iOS Simulator has microphone input device (Simulator > I/O > Microphone)
2. Verify agent ID in `.env.local` matches ElevenLabs dashboard
3. Check agent is "Published" not "Draft" in dashboard
4. Try increasing agent "Max Duration" to 600s temporarily

---

### 4b. Voice Not Working on Simulator (Dec 2025 Investigation)

**Symptom:**
- Text messages appear in logs: `Message from ai: "Hey there..."`
- Mode transitions work: `Mode: speaking` / `Mode: listening`
- But user hears nothing and Abby can't hear user

**Diagnostic Logs:**
```
publishing track {"enabled": true, "trackID": undefined}
[AudioToolbox] error -66680 finding/initializing
Message from user: ...              ← No actual speech captured
Disconnected: {"reason": "agent"}   ← Agent timeout, no input
```

**Root Cause:** iOS Simulator has no audio hardware. Error `-66680` means "cannot find audio device."

**Key Insight:** The SDK connects successfully (text appears) but audio I/O fails silently because:
- Simulator has no physical microphone
- CoreAudio cannot initialize audio units
- Track publishes with `trackID: undefined` (no actual device)

**Solution:**
1. **Test on physical iPhone** - voice works immediately on real device
2. For simulator testing, configure: Simulator > I/O > Microphone > select input

**Code Status (Dec 2025):**
- Audio session lifecycle: ✅ Fixed (commit `ec95299`)
- SDK API v0.5.7: ✅ Fixed (commit `62a52cf`)
- `withTimeout` helper: ✅ Correct location
- Silent error catching: ⚠️ Acceptable (SDK fallback works)

**Files Verified Clean:**
- `src/services/AbbyAgent.ts` - Audio lifecycle correct
- `src/components/screens/CoachIntroScreen.tsx` - Uses hook correctly
- `src/components/screens/CoachScreen.tsx` - Uses hook correctly

---

### 5. Xcode Database Locked

**Symptom:** `error: unable to attach DB: error: accessing build database ... database is locked`

**Fix:**
```bash
rm -rf ~/Library/Developer/Xcode/DerivedData/Abby-*
npm run ios
```

---

### 6. Skia Header Build Errors

**Symptom:** `'RNSkiaModule.h' file not found` or similar Skia errors

**Fix:**
```bash
cd ios
rm -rf Pods Podfile.lock
pod cache clean --all
pod install
cd ..
npm run ios
```

---

## Dependency Version Matrix

These versions are tested and work together:

| Package | Version | Notes |
|---------|---------|-------|
| expo | ~54.0.30 | Must be 54.x |
| @elevenlabs/react-native | ^0.5.7 | Voice agent |
| @livekit/react-native | ^2.9.6 | WebRTC transport |
| @livekit/react-native-webrtc | ^137.0.2 | Must match LiveKit |
| react-native-worklets | 0.5.1 | NOT 0.7.x! |
| @config-plugins/react-native-webrtc | ^13.0.0 | Expo 54 support |
| event-target-shim | 6.0.2 | Direct dependency |

---

## Audio Session Lifecycle

```
┌─────────────────────────────────────────────────────────┐
│                    CORRECT FLOW                          │
├─────────────────────────────────────────────────────────┤
│  1. startConversation() called                          │
│  2. startAudioSession() ← BEFORE SDK                    │
│  3. selectAudioOutput('force_speaker')                  │
│  4. conversation.startSession({ agentId })              │
│  5. SDK negotiates WebRTC, publishes tracks             │
│  6. onConnect fires → agent starts talking              │
│  ...conversation happens...                             │
│  7. endConversation() called                            │
│  8. conversation.endSession()                           │
│  9. stopAudioSession() ← AFTER SDK cleanup              │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│                    WRONG (Old Bug)                       │
├─────────────────────────────────────────────────────────┤
│  ✗ stopAudioSession() in onDisconnect                   │
│    → Interrupts SDK's track management                  │
│    → Causes "could not find local track subscription"   │
│    → Agent disconnects immediately                      │
└─────────────────────────────────────────────────────────┘
```

---

## Environment Setup

### Required Environment Variables

Create `.env.local`:
```bash
# ElevenLabs Agent ID (from dashboard)
EXPO_PUBLIC_ELEVENLABS_AGENT_ID=agent_xxxx...

# Fal.ai API Key (for Orpheus TTS - optional)
EXPO_PUBLIC_FAL_KEY=xxxx...
```

### iOS Simulator Microphone

The simulator needs a microphone input device:
1. Open Simulator
2. Go to I/O > Microphone
3. Select an input device (not "None")

---

## Git Workflow

```bash
# Standard commit
git add .
git commit -m "fix: description"
git push origin main

# Update staging
git push origin main:staging

# Update production
git push origin main:production
```

---

## Useful Commands

```bash
# Clean everything
rm -rf node_modules ios/Pods ios/build
npm install
cd ios && pod install && cd ..

# Check for outdated packages
npx expo install --check

# Run tests
npm test

# TypeScript check
npx tsc --noEmit
```

---

## Demo Flow Known Issues (2024-12-23 Audit)

### CRITICAL - Blocks Demo Completion

| # | Issue | File:Line | Status |
|---|-------|-----------|--------|
| 1 | ~~COACH state unreachable~~ | `RevealScreen.tsx:57` | ✅ FIXED - Added "Meet Your Coach" button |
| 2 | ~~Shader progression broken~~ | `InterviewScreen.tsx` | ❌ FALSE POSITIVE - useEffect at line 111-115 calls onBackgroundChange correctly |
| 3 | ~~Vibe state desync~~ | `SearchingScreen.tsx:66` | ❌ FALSE POSITIVE - MATCH_FOUND is valid AppState, intentional visual anticipation |

### HIGH - UX Issues

| # | Issue | File:Line | Status |
|---|-------|-----------|--------|
| 4 | ~~endConversation() may hang~~ | `CoachIntroScreen.tsx:173` | ✅ FIXED - Added 2s timeout race |

### MEDIUM - Visual Inconsistency

| # | Issue | File:Line | Fix |
|---|-------|-----------|-----|
| 5 | Mute icon size: CoachIntroScreen=18px, CoachScreen=11px | Both screens | Unify to 11px |
| 6 | RevealScreen missing `onBackgroundChange` prop | `RevealScreen.tsx` | Add prop |
| 7 | Two parallel vibe stores | `useVibeStore.ts` | Remove unused |

### LOW - Code Cleanup

| # | Issue | File:Line | Fix |
|---|-------|-----------|-----|
| 8 | OnboardingScreen is dead code | `OnboardingScreen.tsx` | Delete |
| 9 | SettingsScreen is dead code | `SettingsScreen.tsx` | Delete |
| 10 | INTERVIEW_DEEP/SPICY unused | `useVibeController.ts` | Delete or use |

---

## Demo State Machine

**Flow (FIXED 2024-12-23):**
```
COACH_INTRO → INTERVIEW → SEARCHING → MATCH → PAYMENT → REVEAL → COACH ✅
```

User can now tap "Meet Your Coach" on RevealScreen to advance to COACH state.
"Start Over (Demo)" still available as secondary action to reset.

**Key Files:**
- `useDemoStore.ts` - STATE_ORDER array (line 91-99)
- `App.demo.tsx` - renderScreen() switch (line 133-151)
- Each screen calls `advance()` or `reset()`

---

## Key Parameters (DON'T CHANGE)

```typescript
// Modal height - shows conversation
const DEFAULT_SNAP = 0.55;  // 55%

// Shader sequence for interview
const BACKGROUND_SEQUENCE = [1,2,3,4,5,6,7,8,9,10];

// State order
const STATE_ORDER = ['COACH_INTRO','INTERVIEW','SEARCHING','MATCH','PAYMENT','REVEAL','COACH'];
```

---

---

## Verification Commands

**Rule:** Verification requires execution. File existence does not imply functionality. Run these commands after ANY changes to onboarding, auth flow, or stores.

### Onboarding Screens Verification

```bash
# 1. Verify no debug borders visible to users
grep -l "borderWidth" src/components/screens/{NameScreen,DOBScreen,EthnicityScreen,EthnicityPreferenceScreen,SmokingScreen}.tsx && echo "FAIL: Debug borders found" || echo "PASS: No debug borders"

# 2. Verify all screens exported from barrel
for screen in NameScreen DOBScreen BasicsGenderScreen BasicsPreferencesScreen EthnicityScreen EthnicityPreferenceScreen BasicsRelationshipScreen SmokingScreen BasicsLocationScreen PermissionsScreen; do
  grep -q "export.*${screen}" src/components/screens/index.ts || echo "MISSING: ${screen}"
done

# 3. Verify UI components exported
grep -E "^export.*RadioGroup|^export.*Checkbox" src/components/ui/index.ts || echo "MISSING: Form components"

# 4. Verify DOB calendar validation works
node -e "
const isValidCalendarDate = (m, d, y) => {
  if (m < 1 || m > 12 || d < 1) return false;
  const daysInMonth = new Date(y, m, 0).getDate();
  return d <= daysInMonth;
};
console.log('Feb 30:', isValidCalendarDate(2,30,2024) === false ? 'PASS' : 'FAIL');
console.log('Feb 29 leap:', isValidCalendarDate(2,29,2024) === true ? 'PASS' : 'FAIL');
console.log('Feb 29 non-leap:', isValidCalendarDate(2,29,2023) === false ? 'PASS' : 'FAIL');
"
```

### TypeScript Verification

```bash
# Check new files compile (ignore pre-existing node_modules errors)
npx tsc --noEmit 2>&1 | grep -E "src/components/screens/(Name|DOB|Ethnicity|SmokingScreen)" || echo "PASS: New screens compile"
```

### Store Verification

```bash
# Verify all store fields exist
grep -E "fullName|nickname|dateOfBirth|ageRange|ethnicity|ethnicityPreferences|smokingMe|smokingPartner" src/store/useOnboardingStore.ts | wc -l
# Should return 20+ matches
```

---

*Last Updated: 2025-12-31*

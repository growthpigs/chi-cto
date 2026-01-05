# ABBY Screen Specifications

**Purpose:** Map client wireframes → Glass design system components
**Updated:** 2024-12-30

---

## Design System Quick Reference

### Glass Components (Already Built)
- `GlassCard` - BlurView container (16px radius, white border)
- `GlassButton` - Touchable with scale feedback
- `GlassInput` - Text input with focus glow
- `Typography` - Playfair Display (headers) + Inter (body)

### Layout Patterns
- **Full Screen** - Navigation stack, full VibeMatrix background
- **Modal** - Bottom sheet, slides up, dismissible
- **Orb States** - Center (active), Docked (passive), Hidden (auth/settings)

### Colors (from DESIGN-BRIEF.md)
- Brand: `#021749` (Violet Pink) - CTAs
- Vibe States: Trust (Blue), Deep (Violet), Passion (Red), Growth (Green), Caution (Orange), Alert (Grey)

---

## AUTH FLOW

### 1. Welcome/Splash
**Type:** Full Screen
**Vibe:** TRUST (Blue)
**Orb:** Hidden

**Layout:**
```
┌─────────────────────┐
│   VibeMatrix BG     │
│                     │
│    [Abby Logo]      │  ← Gold script logo
│  "You Have 1 Match!"│  ← Red text, Playfair 24pt
│                     │
│    [Welcome]        │  ← Small text
│                     │
└─────────────────────┘
```

**Components:**
- Logo: Image (centered)
- Tagline: Typography variant="display" color="#E11D48"
- Subtext: Typography variant="body" opacity={0.8}

**Actions:** Auto-navigate to Login after 2s

---

### 2. Login
**Type:** Full Screen
**Vibe:** TRUST (Blue)
**Orb:** Hidden

**Layout:**
```
┌─────────────────────┐
│   VibeMatrix BG     │
│                     │
│    [Abby Logo]      │
│  "You Have 1 Match!"│
│                     │
│   GlassCard {       │
│     📧 Email        │
│     🔑 Password     │
│     [Log In]        │
│     Forgot pw?      │
│   }                 │
│                     │
│  Don't have account?│
│     Sign up         │
└─────────────────────┘
```

**Components:**
- 1x GlassCard (padding: 24px)
- 2x GlassInput (email, password)
- 1x GlassButton (primary) - "Log In"
- 2x TextButton - "Forgot password?", "Sign up"

**API:**
- `POST /v1/auth/login` with email/password
- Store JWT tokens in SecureStore

**Validation:**
- Email format
- Password not empty

---

### 3. Signup
**Type:** Full Screen
**Vibe:** TRUST (Blue)
**Orb:** Hidden

**Layout:**
```
┌─────────────────────┐
│   VibeMatrix BG     │
│                     │
│    [Abby Logo]      │
│  "You Have 1 Match!"│
│                     │
│   GlassCard {       │
│     First Name      │
│     Last Name       │
│     📧 Email        │
│     🔑 Password     │
│     [Sign Up]       │
│   }                 │
│                     │
│  Have an account?   │
│     Log in          │
└─────────────────────┘
```

**Components:**
- 1x GlassCard
- 4x GlassInput (first_name, family_name, email, password)
- 1x GlassButton - "Sign Up"
- 1x TextButton - "Log in"

**API:**
- `POST /v1/auth/signup` with email, password, UserAttributes: [email, given_name, family_name]

**Validation:**
- All fields required
- Email format
- Password requirements:
  - Min 8 characters
  - 1 uppercase
  - 1 lowercase
  - 1 number
  - 1 special character

**On Success:** Navigate to Email Verification

---

### 4. Email Verification
**Type:** Modal (Bottom Sheet)
**Vibe:** TRUST (Blue)
**Orb:** Hidden

**Layout:**
```
┌─────────────────────┐
│   VibeMatrix BG     │
│   (blurred)         │
│                     │
│ ╔═══════════════╗   │
│ ║ GlassCard     ║   │
│ ║ "Verify Email"║   │
│ ║               ║   │
│ ║ 6-digit code: ║   │
│ ║ [_][_][_][_]  ║   │
│ ║ [_][_]        ║   │
│ ║               ║   │
│ ║ [Continue]    ║   │
│ ║ Resend code   ║   │
│ ╚═══════════════╝   │
└─────────────────────┘
```

**Components:**
- 1x GlassCard (modal, 55% height)
- 6x CodeInput (1 digit each, auto-focus next)
- 1x GlassButton - "Continue"
- 1x TextButton - "Resend code"

**API:**
- `POST /v1/auth/confirm` with email + code

**Behavior:**
- Auto-submit when 6 digits entered
- Show error if code invalid
- Resend code countdown (60s)

**On Success:** Navigate to Permissions

---

## ONBOARDING FLOW

### 5. Permissions
**Type:** Modal
**Vibe:** TRUST (Blue)
**Orb:** Hidden

**Layout:**
```
┌─────────────────────┐
│   VibeMatrix BG     │
│                     │
│ ╔═══════════════╗   │
│ ║ Permissions   ║   │
│ ║               ║   │
│ ║ ☑️ Permission 1║   │
│ ║ ☑️ Permission 2║   │
│ ║ ☑️ Permission 3║   │
│ ║ ☑️ Permission 4║   │
│ ║ ☑️ Permission 5║   │
│ ║               ║   │
│ ║ [I Agree]     ║   │
│ ║ [Continue]    ║   │
│ ╚═══════════════╝   │
└─────────────────────┘
```

**Components:**
- 1x GlassCard
- 5x Checkbox (disabled, pre-checked for visual only)
- 1x GlassButton - "I Agree to the terms and conditions"
- 1x GlassButton - "Continue"

**Permissions:**
1. Notifications
2. Camera
3. Microphone
4. Location
5. (TBD - check wireframe text)

**Behavior:**
- Request iOS permissions on "Continue"
- Handle denied states gracefully

---

### 6. Basics - Gender
**Type:** Modal
**Vibe:** TRUST (Blue)
**Orb:** Hidden

**Layout:**
```
┌─────────────────────┐
│   VibeMatrix BG     │
│                     │
│ ╔═══════════════╗   │
│ ║ Basics        ║   │
│ ║               ║   │
│ ║ I am a...     ║   │
│ ║               ║   │
│ ║ ○ Man         ║   │
│ ║ ○ Woman       ║   │
│ ║               ║   │
│ ║ See All ▼     ║   │
│ ║               ║   │
│ ║ [Continue]    ║   │
│ ╚═══════════════╝   │
└─────────────────────┘
```

**Components:**
- 1x GlassCard
- RadioGroup with options: Man, Woman, See All (expands to full list)
- 1x GlassButton - "Continue"

**API:**
- Store in local state, batch POST at end of onboarding to `/v1/profile/public`

---

### 7. Basics - Relationship Type
**Type:** Modal
**Vibe:** TRUST (Blue)
**Orb:** Hidden

**Layout:**
```
┌─────────────────────┐
│   VibeMatrix BG     │
│                     │
│ ╔═══════════════╗   │
│ ║ Basics        ║   │
│ ║               ║   │
│ ║ Desired       ║   │
│ ║ Relationship  ║   │
│ ║ type          ║   │
│ ║               ║   │
│ ║ ○ Long-term   ║   │
│ ║ ○ Short-term  ║   │
│ ║ ○ New Friends ║   │
│ ║               ║   │
│ ║ See Non-      ║   │
│ ║ Monogamous ▼  ║   │
│ ║               ║   │
│ ║ [Continue]    ║   │
│ ╚═══════════════╝   │
└─────────────────────┘
```

**Components:**
- RadioGroup: Long-term, Short-term, New Friends
- Collapsible: "See Non-Monogamous Options" → expands to Type 1/2/3

---

### 8. Basics - Location
**Type:** Modal
**Vibe:** TRUST (Blue)
**Orb:** Hidden

**Layout:**
```
┌─────────────────────┐
│   VibeMatrix BG     │
│                     │
│ ╔═══════════════╗   │
│ ║ Basics        ║   │
│ ║               ║   │
│ ║ Please let us ║   │
│ ║ know approx   ║   │
│ ║ where you live║   │
│ ║               ║   │
│ ║ [Map Preview] ║   │
│ ║               ║   │
│ ║ [Use GPS]     ║   │
│ ║ Enter Zip Code║   │
│ ║               ║   │
│ ║ [Continue]    ║   │
│ ╚═══════════════╝   │
└─────────────────────┘
```

**Components:**
- MapView (static preview)
- 1x GlassButton - "Use GPS Location"
- 1x GlassInput - "Enter Zip Code" (alternative)

**API:**
- Request location permission
- POST to `/v1/profile/public` with location data

---

## INTERVIEW FLOW

### 9. InterviewScreen
**Type:** Full Screen (EXISTS)
**Vibe:** Dynamic (TRUST → DEEP → CAUTION → PASSION → GROWTH)
**Orb:** Center, Animated

**File:** `src/components/screens/InterviewScreen.tsx`

**Current State:** Uses local question JSON
**Needs:** API integration

**API Changes:**
1. Replace local questions with `GET /v1/questions/next`
2. POST answers to `POST /v1/answers`
3. Parse natural language: `POST /v1/answers/parse`

**Voice Integration:**
- Currently: ElevenLabs agent
- Change to: OpenAI Realtime via `/v1/abby/realtime/session`
- WebRTC or WebSocket connection
- Handle tool calls via data channel

**Components:** Already built, no visual changes

---

## MATCH FLOW

### 10. SearchingScreen
**Type:** Full Screen (EXISTS)
**Vibe:** CAUTION (Orange)
**Orb:** Center, Pulsing

**File:** `src/components/screens/SearchingScreen.tsx`

**Current State:** Mock searching animation
**Needs:** Real status polling

**API:**
- Poll `GET /v1/matches/candidates` until results available
- Show loading states from backend

**Components:** Already built

---

### 11. Match Notification Modal
**Type:** Modal
**Vibe:** PASSION (Red)
**Orb:** Center, Morphing to Card

**Layout:**
```
┌─────────────────────┐
│   VibeMatrix BG     │
│   (PASSION red)     │
│                     │
│ ╔═══════════════╗   │
│ ║               ║   │
│ ║   [Orb]       ║   │ ← Morphs to celebration
│ ║               ║   │
│ ║ You Have a    ║   │
│ ║ New Match!    ║   │
│ ║               ║   │
│ ║ [See Bio]     ║   │
│ ║ [Postpone]    ║   │
│ ║ [Uninterested]║   │
│ ║ [My Matches]  ║   │
│ ║ [See Deal]    ║   │
│ ║               ║   │
│ ║ [See Contact] ║   │
│ ╚═══════════════╝   │
└─────────────────────┘
```

**Components:**
- AbbyOrb (celebration animation)
- Confetti effect
- 5x GlassButton (stacked)

**Actions:**
- See Bio → MatchScreen
- Postpone → Dismiss modal
- Uninterested → POST `/v1/matches/{id}/pass`
- My Matches → Navigate to Matches List
- See Deal → TBD (payment?)
- See Contact → TBD (reveal?)

---

### 12. MatchScreen (Bio)
**Type:** Full Screen (EXISTS)
**Vibe:** PASSION (Red)
**Orb:** Docked top-right

**File:** `src/components/screens/MatchScreen.tsx`

**Current State:** Mock bio data
**Needs:** API integration

**API:**
- Display data from `GET /v1/matches/candidates`
- Show bio text (no photos yet)

**Components:** Already built

---

### 13. Matches List
**Type:** Full Screen
**Vibe:** TRUST (Blue)
**Orb:** Hidden

**Layout:**
```
┌─────────────────────┐
│ ┌─────────────────┐ │
│ │ [☰] Matches [🔍]│ │ ← Header
│ └─────────────────┘ │
│                     │
│ ┌─────────────────┐ │
│ │ [Avatar] Name   │ │
│ │ "Last message..." │
│ │ 🟢 Online       │ │
│ └─────────────────┘ │
│ ┌─────────────────┐ │
│ │ [Avatar] Name   │ │
│ │ "Last message..." │
│ └─────────────────┘ │
│ ┌─────────────────┐ │
│ │ [Avatar] Name   │ │
│ │ "Last message..." │
│ └─────────────────┘ │
│                     │
└─────────────────────┘
```

**Components:**
- FlatList
- MatchCard (custom component) per match
- Avatar, name, last message preview, online indicator

**API:**
- `GET /v1/matches/candidates`

---

### 14. RevealScreen (Photo)
**Type:** Full Screen (EXISTS)
**Vibe:** PASSION (Red)
**Orb:** Hidden

**File:** `src/components/screens/RevealScreen.tsx`

**Current State:** Mock photo reveal
**Needs:** Payment gate integration

**Flow:**
1. Match made
2. User pays
3. Photos revealed

**API:**
- Display photos from match candidate object

**Components:** Already built

---

## PROFILE MANAGEMENT

### 15. Profile View
**Type:** Full Screen
**Vibe:** Custom (Rainbow gradient sidebar)
**Orb:** Hidden

**Layout:**
```
┌─────────────────────┐
│ ┌─────────────────┐ │
│ │ [☰] Profile [⚙️]│ │
│ └─────────────────┘ │
│ ┏━┓                │ ← Rainbow gradient
│ ┃ ┃ [Avatar]       │   left sidebar
│ ┃ ┃                │
│ ┃ ┃ Name, Age      │
│ ┃ ┃                │
│ ┃ ┃ Bio text...    │
│ ┃ ┃                │
│ ┃ ┃ [Edit] →       │
│ ┗━┛                │
└─────────────────────┘
```

**Components:**
- LinearGradient (vertical, left edge) - Rainbow colors
- Avatar (large, 120px)
- Typography - Name, age, bio
- EditButton

**API:**
- `GET /v1/me`

---

### 16. System & Settings
**Type:** Full Screen
**Vibe:** TRUST (Blue)
**Orb:** Hidden

**Layout:**
```
┌─────────────────────┐
│ [☰] System/Settings │
│                     │
│ Typical Systems     │
│ options             │
│                     │
│ Account (phone/     │
│ email/pass/2FA)     │
│                     │
│ Profile visibility  │
│ triggers            │
│                     │
│ Location discovery  │
│ (show city/state?)  │
│                     │
│ Accessibility       │
│ text size, reduced  │
│ motion              │
│                     │
│ Laws (regional      │
│ experiments)        │
│                     │
│ Guidelines          │
│                     │
│ [Save]              │
└─────────────────────┘
```

**Components:**
- ScrollView
- Section headers
- Toggle switches
- TextInputs for editable fields
- SaveButton (sticky bottom)

**API:**
- `GET /v1/me` (load current)
- `PUT /v1/profile/private` (save changes)

---

### 17. My Photos
**Type:** Full Screen
**Vibe:** TRUST (Blue)
**Orb:** Hidden

**Layout:**
```
┌─────────────────────┐
│ ┌─────────────────┐ │
│ │ [☰] My Photos   │ │
│ └─────────────────┘ │
│                     │
│ Add your best       │
│ Photos. Show your   │
│ best self!          │
│                     │
│ ┌───────┬───────┐   │
│ │[Photo]│ [+]   │   │
│ ├───────┼───────┤   │
│ │ [+]   │ [+]   │   │
│ └───────┴───────┘   │
│                     │
│ [Upload a File]     │
│ [Done]              │
│                     │
│ See our Photo Rules │
│ (link)              │
└─────────────────────┘
```

**Components:**
- 2x2 Grid (4 photo slots)
- ImagePicker button
- Upload button
- GlassButton - "Done"

**API:**
1. `POST /v1/photos/presign` → Get S3 URL
2. Upload to S3 directly
3. `POST /v1/photos` → Register photo with backend

**Behavior:**
- Tap [+] → Open ImagePicker
- Select photo → Show preview
- Tap "Upload" → Upload to S3 → Confirm to backend
- Show loading state during upload

---

## PAYMENT FLOW

### 18. Subscription Tiers
**Type:** Modal
**Vibe:** PASSION (Red gradient)
**Orb:** Hidden

**Layout:**
```
┌─────────────────────┐
│   VibeMatrix BG     │
│   (PASSION)         │
│                     │
│ ╔═══════════════╗   │
│ ║ [Abby Logo]   ║   │
│ ║               ║   │
│ ║ ┌───────────┐ ║   │
│ ║ │ PRO       │ ║   │
│ ║ │ $49/mo    │ ║   │
│ ║ └───────────┘ ║   │
│ ║ ┌───────────┐ ║   │
│ ║ │ ELITE     │ ║   │
│ ║ │ $99/mo    │ ║   │
│ ║ └───────────┘ ║   │
│ ║               ║   │
│ ║ [Sen Code]    ║   │
│ ║               ║   │
│ ║ Features:     ║   │
│ ║ - Read Rcpts  ║   │
│ ║ - 15 Likes/wk ║   │
│ ║ - See Likes   ║   │
│ ║ - Free Boost  ║   │
│ ║               ║   │
│ ║ [Get 3mo/$99] ║   │
│ ║               ║   │
│ ║ Terms link    ║   │
│ ╚═══════════════╝   │
└─────────────────────┘
```

**Components:**
- 2x PricingCard (PRO, ELITE)
- GlassButton - "Sen Code" (unclear - maybe "Send Code"?)
- Features list
- GlassButton - CTA ("Get 3 Months for $99.99")

**API:**
- TBD - Stripe subscription creation

---

### 19. Payment Input
**Type:** Modal
**Vibe:** TRUST (Blue)
**Orb:** Hidden

**Layout:**
```
┌─────────────────────┐
│   VibeMatrix BG     │
│                     │
│ ╔═══════════════╗   │
│ ║ Payments      ║   │
│ ║               ║   │
│ ║ Typical Payment  ║
│ ║ Input Screen  ║   │
│ ║               ║   │
│ ║ [Card Icon]   ║   │
│ ║               ║   │
│ ║ [Save Card]   ║   │
│ ║               ║   │
│ ║ [Abby Logo]   ║   │
│ ╚═══════════════╝   │
└─────────────────────┘
```

**Components:**
- Stripe CardField (prebuilt)
- GlassButton - "Save Card"

**API:**
- Stripe Elements / Stripe SDK
- `POST /v1/payments` with payment method

---

### 20. Show Card on File
**Type:** Modal
**Vibe:** TRUST (Blue)
**Orb:** Hidden

**Layout:**
```
┌─────────────────────┐
│   VibeMatrix BG     │
│                     │
│ ╔═══════════════╗   │
│ ║ Payments      ║   │
│ ║               ║   │
│ ║ Show Card on  ║   │
│ ║ File to choose║   │
│ ║ from          ║   │
│ ║               ║   │
│ ║ [Use this one]║   │
│ ╚═══════════════╝   │
└─────────────────────┘
```

**Components:**
- List of saved payment methods
- GlassButton - "Use this one"

---

## VERIFICATION (V2 - Not Immediate)

### 21. Certification Screen
**Type:** Full Screen
**Vibe:** TRUST (Blue)
**Orb:** Hidden

**Layout:**
```
┌─────────────────────┐
│ Certification       │
│ Screen              │
│                     │
│ This will be the    │
│ 3rd party           │
│ certification       │
│ Screen              │
│                     │
│ [Start Cert]        │
└─────────────────────┘
```

**Note:** Placeholder only. 3rd party vendor TBD.

---

## IMPLEMENTATION PRIORITY

### P0 - Critical Path (Days 1-7)
1. Login
2. Signup
3. Email Verification
4. Permissions
5. Basics (Gender/Relationship/Location)
6. InterviewScreen (API integration)
7. SearchingScreen (API integration)
8. MatchScreen (API integration)

### P1 - Core Features (Days 8-10)
9. Match Notification
10. Matches List
11. RevealScreen (with payment gate)
12. Profile View
13. My Photos

### P2 - Monetization (Days 11-12)
14. Subscription Tiers
15. Payment Input
16. Stripe integration

### P3 - Settings (Day 13)
17. System & Settings

### P4 - V2 (Post-Launch)
18. Certification
19. Messaging
20. Safety (Block/Report)

---

## Component Reuse Strategy

### Create New Shared Components
1. **RadioGroup** - For Gender/Relationship selections
2. **CodeInput** - For verification code (6 digits)
3. **MatchCard** - For Matches List items
4. **PricingCard** - For subscription tiers
5. **PhotoGrid** - For photo management (2x2)
6. **ModalSheet** - Reusable bottom sheet wrapper

### Extend Existing Components
1. **GlassCard** - Add modal variant (with handle)
2. **GlassButton** - Add disabled/loading states
3. **GlassInput** - Add error states with red border

---

## Next Steps

1. ✅ Review this spec with Roderic
2. Create component library additions
3. Build auth screens first (Login → Signup → Verification)
4. Test Cognito integration early
5. Move to onboarding flow
6. API integration for InterviewScreen
7. Match flow screens
8. Profile/Photos
9. Payments last

---

*Document created: 2024-12-30*
*Based on: FluidUI wireframes + MyAIMatchmaker API docs*

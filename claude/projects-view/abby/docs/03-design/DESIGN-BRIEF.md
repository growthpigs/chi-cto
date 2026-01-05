# ABBY - Design Brief

**Product Name:** ABBY - The Anti-Dating App
**Version:** 1.0 MVP
**Last Updated:** December 20, 2024
**References:** PRD.md, FSD.md, ISD.md

---

## Project Overview

**Product:** ABBY - The Anti-Dating App
**Target Users:** Adults 25-45 seeking serious relationships, burned out on swipe culture
**Key Emotion:** Emotionally safe, hopeful, understood, premium

---

## Brand Status

- [x] Existing brand direction (from client creative brief)
- [ ] Creating new brand direction

---

## Design Goals

1. **Feel Alive, Not Static** - Interface breathes, morphs, reacts like a living organism
2. **Trust by Design** - Every element conveys safety, authenticity, premium quality
3. **Reduce Cognitive Load** - No swipes, no grids, no overwhelm; guided journey with AI matchmaker

---

## Target Audience

**Demographics:**
- Age: 25-45 (primary), 22-35 (secondary)
- Gender: All genders, all orientations
- Location: U.S. pilot (Miami-Dade, Broward, Palm Beach)

**Psychographics:**
- Values: Genuine connection, emotional depth, authenticity
- Lifestyle: Busy professionals, divorced individuals, relationship-serious
- Pain points: Swipe fatigue, fake profiles, superficial matches, feeling "used" by apps

---

## Competitive Landscape

| Competitor | Strengths | Weaknesses | Our Differentiation |
|------------|-----------|------------|---------------------|
| Tinder | Massive user base, fast onboarding | Bots, superficial, pay-to-play | No profiles to browse, AI vets |
| Bumble | Women-first, good brand | Timer anxiety, burnout | No timers, Abby guides pace |
| Hinge | Quality prompts, intent-based | Paywall for best matches | Pay only when you match |
| Inner Circle | Vetted community, events | Expensive, limited pool | AI-driven vetting, inclusive |

---

## Design Direction

### Visual Style

**Organic, fluid, bioluminescent** - Shapes morph and glow like deep-sea organisms. Nothing sharp, nothing static. Every element feels alive.

**Core Metaphor:** "A glass pane floating over a living, bioluminescent ocean."

### Color Palette

**Client-Defined Brand Colors:**

| Color | Hex | Usage |
|-------|-----|-------|
| Violet Pink | #021749 | CTAs, key accents |
| Wisteria Purple | #8e52b8 | Secondary accents |
| Royal Indigo | #4a4f92 | Text overlays |
| Deep Nebula | #4a73ab | Background depth |
| Abyss Teal | #649ca1 | Shadows, contrast |

**VibeMatrix State Colors:**

| State | Hex | Trigger |
|-------|-----|---------|
| TRUST | #3B82F6 (Blue) | Onboarding, safe topics |
| DEEP | #4C1D95 (Violet) | Intimate questions |
| CAUTION | #F59E0B (Orange) | Deal-breakers |
| PASSION | #E11D48 (Red) | Physical preferences, match reveal |
| GROWTH | #10B981 (Green) | Future planning, coach mode |
| ALERT | #374151 (Grey) | System messages, errors |

### Typography

| Use | Font | Style |
|-----|------|-------|
| Headers | Playfair Display | Elegant, high-contrast serif |
| Body | Inter | Clean, highly readable sans-serif |

### Imagery Style

- Fluid, organic, cloud-like, gently glowing shapes
- Layered with subtle transparency (AI/data visualization feel)

**Avoid:**
- Sexy beach photos
- Overly staged/glossy stock photos
- Heteronormative-only imagery
- High-contrast/nightclub aesthetics
- Anything overly feminine

---

## Inspiration / References

From client creative brief:
- Bioluminescent ocean creatures (jellyfish, deep-sea organisms)
- Glass morphism UI with depth and layers
- Premium app experiences (Calm, Headspace aesthetic warmth)
- The feeling of being understood by a wise friend

---

## Key Screens/Pages

Priority order for design:

1. **VibeMatrix + Abby Orb** - Core living background + AI entity; foundation for everything
2. **Interview Flow** - Question cards, sliders, voice activation states
3. **Onboarding Sequence** - Basic profile setup screens (2-11)
4. **Glass Interface System** - Component library (cards, buttons, inputs)

---

## Constraints

- **Technical:** GLSL shaders via @shopify/react-native-skia; must optimize for 60fps
- **Battery:** Low Power Mode switches to static gradients when battery < 20%
- **Accessibility:** Minimum 44x44px touch targets, VoiceOver labels, high contrast mode
- **Platform:** iOS only for v1.0 (iPhone 12+ recommended)

---

## Motion Design

| Element | Duration | Easing |
|---------|----------|--------|
| Color morphs | 800-1200ms | Heavy ease |
| Orb breathing | 3s cycle | Sine wave |
| State transitions | 600-1000ms | cubic-bezier(0.25, 0.46, 0.45, 0.94) |
| Button press | 150ms | ease-out |

**Critical Rules:**
1. Colors MORPH, never cross-fade
2. Nothing is ever static
3. Abby never disappears, only transforms position
4. Text always on Glass, never directly on background

---

## Glass Interface Components

### GlassCard
```
Background: BlurView (intensity: 40, tint: systemThinMaterial)
Border: 1px rgba(255,255,255,0.2)
Border Radius: 16px
Shadow: 0 8px 32px rgba(0,0,0,0.12)
Backdrop Filter: blur(20px) saturate(180%)
```

### GlassButton
```
Default State:
- Background: rgba(255,255,255,0.1)
- Border: 1px rgba(255,255,255,0.3)

Pressed State:
- Background: rgba(255,255,255,0.2)
- Scale: 0.98
- Transition: 150ms ease-out

Disabled State:
- Background: rgba(255,255,255,0.05)
- Text: rgba(255,255,255,0.4)
```

### Touch Feedback
- All interactive elements have haptic feedback (light impact)
- Buttons scale down 2% when pressed
- Cards lift with subtle shadow increase
- Text input fields show focus glow

---

## Accessibility Requirements

- Minimum touch target: 44x44px
- High contrast mode: Increase border opacity to 0.8
- VoiceOver: All elements properly labeled
- Voice-first design accommodates various abilities
- Text alternatives for all voice interactions

---

## Approval Process

**Who approves designs?** Manuel Negreiro (via Brent)
**Revision rounds included:** 2 rounds per major screen

---

*Document created: December 20, 2024*

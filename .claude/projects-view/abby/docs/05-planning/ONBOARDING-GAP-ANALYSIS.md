# Onboarding Gap Analysis

> **Source:** Client spreadsheet "List of most important questions w multiple choice and screen suggestions.xlsx" - Onboarding tab
> **Date:** 2025-12-31

---

## Client Specification (11 Screens)

| Screen | Title | Type | Options |
|--------|-------|------|---------|
| 2 | Login Method | Auth | Phone (required), Email (required), Apple/Facebook/Google (1 choice each) |
| 3 | Phone verification | Auth | 6-digit code input, resend button, change number link |
| 4 | **Name** | Profile | Full name (required, private), Nickname/first name (required, shown in profile) |
| 5 | **DOB** | Profile | Date of birth (required), Age range slider |
| 6 | Sexual Identity | Profile | man (1), woman (1), Other: Agender, Androgynous, Bygender, Cis Woman, Genderfluid, genderqueer, Gender Nonconforming, non-binary, other gender (Multi) |
| 7 | Sexual Preference | Profile | looking for man (1), looking for woman (1), Other: same expanded options (Multi) |
| 8 | **Ethnicity** | Profile | White, Black, Hispanic (1 choice), Other: asian, Indian, Middle Eastern, Native American, Caribbean, European (1 choice) |
| 9 | **Ethnicity Preferred** | Preference | Same as #8 but Multi-select + "Don't care" option |
| 10 | Relationship Type | Preference | long-term dating, marriage, Short term dating, New friends only (Multi) |
| 11 | **Smoking** | Preference | "Smoking - Me": yes/no/casually (1), "Smoking - other": yes/no/I don't care (1) |

---

## Current Implementation

| Screen | Status | Notes |
|--------|--------|-------|
| LoginScreen | ✅ Complete | Has create account + sign in |
| PhoneNumberScreen | ✅ Complete | Country code + phone number |
| VerificationCodeScreen | ✅ Complete | 6-digit code input |
| EmailScreen | ✅ Complete | Email input |
| EmailVerificationScreen | ✅ Complete | 6-digit code input |
| PermissionsScreen | ✅ Complete | Mic, location, notifications, camera |
| BasicsGenderScreen | ⚠️ Needs Update | Only 3 options (Man, Woman, Non-binary) |
| BasicsPreferencesScreen | ⚠️ Needs Update | Only 3 options (Men, Women, Everyone) |
| BasicsRelationshipScreen | ⚠️ Verify | Need to verify options match |
| BasicsLocationScreen | ✅ Complete | GPS or zip code |

---

## Gap Analysis

### Missing Screens (5)

| Priority | Screen | Fields | Notes |
|----------|--------|--------|-------|
| **P1** | NameScreen | `fullName`, `nickname` | Full name is private, nickname shown in profile |
| **P1** | DOBScreen | `dateOfBirth`, `ageRangeMin`, `ageRangeMax` | Date picker + dual-thumb slider |
| **P2** | EthnicityScreen | `ethnicity` | Single select from 9 options |
| **P2** | EthnicityPreferenceScreen | `ethnicityPreferences[]` | Multi-select from 10 options (includes "Don't care") |
| **P2** | SmokingScreen | `smokingMe`, `smokingPartner` | Two single-select questions |

### Screens Needing Updates (3)

| Screen | Current | Required | Changes |
|--------|---------|----------|---------|
| BasicsGenderScreen | 3 options | 12 options | Add: Agender, Androgynous, Bygender, Cis Woman, Genderfluid, genderqueer, Gender Nonconforming, other gender |
| BasicsPreferencesScreen | 3 options | 12 options | Match expanded gender options |
| BasicsRelationshipScreen | Verify | 4 options | Confirm: long-term, marriage, short-term, friends |

---

## Implementation Order

### Phase 1: Critical Profile Fields (before main app)
1. NameScreen (insert after EmailVerificationScreen)
2. DOBScreen (insert after NameScreen)

### Phase 2: Update Existing Screens
3. Update BasicsGenderScreen with expanded options
4. Update BasicsPreferencesScreen with expanded options
5. Verify BasicsRelationshipScreen

### Phase 3: Additional Preferences
6. EthnicityScreen (insert after BasicsPreferencesScreen)
7. EthnicityPreferenceScreen (insert after EthnicityScreen)
8. SmokingScreen (insert after EthnicityPreferenceScreen)

---

## Data Model Updates

### useOnboardingStore additions:

```typescript
interface OnboardingStoreState {
  // Existing
  gender: string | null;
  datingPreference: string | null;
  relationshipType: string | null;
  location: OnboardingLocation | null;

  // NEW: Name
  fullName: string | null;
  nickname: string | null;

  // NEW: DOB
  dateOfBirth: Date | null;
  ageRangeMin: number | null;  // default 18
  ageRangeMax: number | null;  // default 65

  // NEW: Ethnicity
  ethnicity: string | null;
  ethnicityPreferences: string[];

  // NEW: Smoking
  smokingMe: 'yes' | 'no' | 'casually' | null;
  smokingPartner: 'yes' | 'no' | 'dont_care' | null;
}
```

### Gender Options (12 total):
```typescript
const GENDER_OPTIONS = [
  { value: 'man', label: 'Man' },
  { value: 'woman', label: 'Woman' },
  { value: 'agender', label: 'Agender' },
  { value: 'androgynous', label: 'Androgynous' },
  { value: 'bigender', label: 'Bigender' },
  { value: 'cis_woman', label: 'Cis Woman' },
  { value: 'genderfluid', label: 'Genderfluid' },
  { value: 'genderqueer', label: 'Genderqueer' },
  { value: 'gender_nonconforming', label: 'Gender Nonconforming' },
  { value: 'non_binary', label: 'Non-binary' },
  { value: 'other', label: 'Other' },
];
```

### Ethnicity Options (10 total):
```typescript
const ETHNICITY_OPTIONS = [
  { value: 'white', label: 'White' },
  { value: 'black', label: 'Black' },
  { value: 'hispanic', label: 'Hispanic' },
  { value: 'asian', label: 'Asian' },
  { value: 'indian', label: 'Indian' },
  { value: 'middle_eastern', label: 'Middle Eastern' },
  { value: 'native_american', label: 'Native American' },
  { value: 'caribbean', label: 'Caribbean' },
  { value: 'european', label: 'European' },
  { value: 'dont_care', label: "Don't care" }, // Only for preferences
];
```

---

## New Auth Flow Order

```
LOGIN → PHONE → VERIFICATION → EMAIL → EMAIL_VERIFICATION →
NAME → DOB → PERMISSIONS →
BASICS_GENDER → BASICS_PREFERENCES → ETHNICITY → ETHNICITY_PREFERENCE →
BASICS_RELATIONSHIP → SMOKING → BASICS_LOCATION →
AUTHENTICATED
```

---

## Notes

- Client spec shows "Screen 2" as first (Login), implying Screen 1 is splash/logo (not in onboarding flow)
- Ethnicity is single-select for "me", multi-select for "preferred"
- Smoking has two parts in one screen: my smoking + partner preference
- "Don't care" option only appears in preference screens (ethnicity pref, smoking partner)
- Age range slider should likely default to 18-65 or configurable range

---

*Last Updated: 2025-12-31*

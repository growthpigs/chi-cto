# Data Model: AudienceOS Marketing Page

## Entities

### PageContent
Static content for the marketing page.

```typescript
interface HeroContent {
  headline: string;
  subheadline: string;
  ctaText: string;
  ctaLink: string;
}

interface FeatureCard {
  icon: string;
  title: string;
  description: string;
}

interface PageContent {
  hero: HeroContent;
  features: FeatureCard[];
}
```

## Notes
No database required - static HTML page.
Content hardcoded in markup for MVP.

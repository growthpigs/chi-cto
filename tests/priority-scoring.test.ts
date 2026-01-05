// tests/priority-scoring.test.ts

import { PriorityScorer, Feature, ScoredFeature } from '../src/priority-scoring';

const scorer = new PriorityScorer();

describe('PriorityScorer', () => {
  describe('Base Score Calculation', () => {
    test('calculates correct base score: 10+10+10+8=38', () => {
      const feature: Feature = {
        id: '1',
        name: 'Critical Bug',
        urgency: 10,
        importance: 10,
        confidence: 10,
        impact: 8
      };
      expect(scorer.calculateBaseScore(feature)).toBe(38);
    });

    test('handles zero inputs: 0+0+0+0=0', () => {
      const feature: Feature = {
        id: '2',
        name: 'Skip This',
        urgency: 0,
        importance: 0,
        confidence: 0,
        impact: 0
      };
      expect(scorer.calculateBaseScore(feature)).toBe(0);
    });

    test('max score is 40: 10+10+10+10', () => {
      const feature: Feature = {
        id: '3',
        name: 'Max Priority',
        urgency: 10,
        importance: 10,
        confidence: 10,
        impact: 10
      };
      expect(scorer.calculateBaseScore(feature)).toBe(40);
    });

    test('mixed values: 5+7+6+3=21', () => {
      const feature: Feature = {
        id: '4',
        name: 'Medium Priority',
        urgency: 5,
        importance: 7,
        confidence: 6,
        impact: 3
      };
      expect(scorer.calculateBaseScore(feature)).toBe(21);
    });
  });

  describe('Tier Mapping', () => {
    test('score 38 maps to IMMEDIATE', () => {
      expect(scorer.getTier(38)).toBe('IMMEDIATE');
    });

    test('score 25 (boundary) maps to IMMEDIATE', () => {
      expect(scorer.getTier(25)).toBe('IMMEDIATE');
    });

    test('score 24 maps to SOON', () => {
      expect(scorer.getTier(24)).toBe('SOON');
    });

    test('score 20 (boundary) maps to SOON', () => {
      expect(scorer.getTier(20)).toBe('SOON');
    });

    test('score 19 maps to LATER', () => {
      expect(scorer.getTier(19)).toBe('LATER');
    });

    test('score 10 (boundary) maps to LATER', () => {
      expect(scorer.getTier(10)).toBe('LATER');
    });

    test('score 9 maps to SKIP', () => {
      expect(scorer.getTier(9)).toBe('SKIP');
    });

    test('score 0 maps to SKIP', () => {
      expect(scorer.getTier(0)).toBe('SKIP');
    });

    test('score -1 maps to FLAGGED', () => {
      expect(scorer.getTier(-1)).toBe('FLAGGED');
    });
  });

  describe('Multipliers', () => {
    test('kids+school multiplier: U=5×1.5=7.5→7, final score=32', () => {
      const feature: Feature = {
        id: '5',
        name: 'Kids Issue',
        urgency: 5,
        importance: 10,
        confidence: 9,
        impact: 6,
        multiplier: 'kids+school'
      };
      const scored = scorer.scoreFeature(feature);
      expect(scored.baseScore).toBe(30); // 5+10+9+6
      expect(scored.finalScore).toBe(32); // 7+10+9+6 (U×1.5 rounded down)
      expect(scored.tier).toBe('IMMEDIATE');
      expect(scored.reason).toContain('Kids + school day');
    });

    test('lawyer email: I=10 floor, final score=25', () => {
      const feature: Feature = {
        id: '6',
        name: 'Lawyer Email',
        urgency: 3,
        importance: 7,
        confidence: 8,
        impact: 4,
        multiplier: 'lawyer'
      };
      const scored = scorer.scoreFeature(feature);
      expect(scored.baseScore).toBe(22); // 3+7+8+4
      expect(scored.finalScore).toBe(25); // 3+10+8+4 (I floored to 10)
      expect(scored.tier).toBe('IMMEDIATE');
      expect(scored.reason).toContain('Lawyer email');
    });

    test('payment failure (3rd+): U×1.5, final score=31', () => {
      const feature: Feature = {
        id: '7',
        name: 'Payment Failure',
        urgency: 6,
        importance: 8,
        confidence: 9,
        impact: 5,
        multiplier: 'payment-failure'
      };
      const scored = scorer.scoreFeature(feature);
      expect(scored.baseScore).toBe(28); // 6+8+9+5
      expect(scored.finalScore).toBe(31); // 9+8+9+5 (U×1.5=9)
      expect(scored.tier).toBe('IMMEDIATE');
      expect(scored.reason).toContain('Payment failure');
    });

    test('phishing flag: returns -1 and FLAGGED tier', () => {
      const feature: Feature = {
        id: '8',
        name: 'Phishing Email',
        urgency: 5,
        importance: 5,
        confidence: 5,
        impact: 5,
        multiplier: 'phishing'
      };
      const scored = scorer.scoreFeature(feature);
      expect(scored.finalScore).toBe(-1);
      expect(scored.tier).toBe('FLAGGED');
      expect(scored.reason).toContain('FLAGGED');
    });

    test('no multiplier: base score = final score', () => {
      const feature: Feature = {
        id: '9',
        name: 'Normal Feature',
        urgency: 6,
        importance: 7,
        confidence: 6,
        impact: 5
      };
      const scored = scorer.scoreFeature(feature);
      expect(scored.baseScore).toBe(24);
      expect(scored.finalScore).toBe(24);
      expect(scored.tier).toBe('SOON');
    });
  });

  describe('Single Feature Scoring', () => {
    test('returns ScoredFeature with all properties', () => {
      const feature: Feature = {
        id: '10',
        name: 'Complete Feature',
        urgency: 8,
        importance: 9,
        confidence: 8,
        impact: 6
      };
      const scored = scorer.scoreFeature(feature);

      expect(scored).toHaveProperty('id', '10');
      expect(scored).toHaveProperty('name', 'Complete Feature');
      expect(scored).toHaveProperty('baseScore', 31);
      expect(scored).toHaveProperty('finalScore', 31);
      expect(scored).toHaveProperty('tier', 'IMMEDIATE');
      expect(scored).toHaveProperty('reason');
    });
  });

  describe('Batch Scoring', () => {
    test('scores multiple features and sorts by priority', () => {
      const features: Feature[] = [
        { id: '1', name: 'Bug', urgency: 10, importance: 10, confidence: 10, impact: 8 }, // 38
        { id: '2', name: 'Refactor', urgency: 2, importance: 4, confidence: 7, impact: 2 }, // 15
        { id: '3', name: 'API', urgency: 8, importance: 9, confidence: 6, impact: 8 }, // 31
        { id: '4', name: 'DB Opt', urgency: 6, importance: 7, confidence: 7, impact: 5 }, // 25
      ];

      const sorted = scorer.scoreBatch(features);

      // Should be sorted descending by finalScore
      expect(sorted[0].name).toBe('Bug'); // 38
      expect(sorted[1].name).toBe('API'); // 31
      expect(sorted[2].name).toBe('DB Opt'); // 25
      expect(sorted[3].name).toBe('Refactor'); // 15
    });

    test('phishing flags appear first in batch', () => {
      const features: Feature[] = [
        { id: '1', name: 'Normal', urgency: 8, importance: 8, confidence: 8, impact: 8 }, // 32
        { id: '2', name: 'Phishing', urgency: 3, importance: 3, confidence: 3, impact: 3, multiplier: 'phishing' }, // -1
      ];

      const sorted = scorer.scoreBatch(features);

      expect(sorted[0].tier).toBe('FLAGGED');
      expect(sorted[0].name).toBe('Phishing');
      expect(sorted[1].tier).not.toBe('FLAGGED');
      expect(sorted[1].name).toBe('Normal');
    });

    test('scores 10 features correctly (validation from spec)', () => {
      const features: Feature[] = [
        { id: '1', name: 'Critical', urgency: 10, importance: 10, confidence: 10, impact: 8 }, // 38 IMMEDIATE
        { id: '2', name: 'Login', urgency: 9, importance: 10, confidence: 8, impact: 8 }, // 35 IMMEDIATE
        { id: '3', name: 'API', urgency: 8, importance: 9, confidence: 6, impact: 8 }, // 31 IMMEDIATE
        { id: '4', name: 'DB Opt', urgency: 6, importance: 7, confidence: 7, impact: 5 }, // 25 IMMEDIATE
        { id: '5', name: 'Refactor', urgency: 2, importance: 4, confidence: 7, impact: 2 }, // 15 LATER
        { id: '6', name: 'Docs', urgency: 1, importance: 3, confidence: 9, impact: 1 }, // 14 LATER
        { id: '7', name: 'Comments', urgency: 1, importance: 2, confidence: 8, impact: 1 }, // 12 LATER
        { id: '8', name: 'Typo', urgency: 1, importance: 1, confidence: 10, impact: 1 }, // 13 LATER
        { id: '9', name: 'Payment', urgency: 6, importance: 8, confidence: 9, impact: 5, multiplier: 'payment-failure' }, // 31 IMMEDIATE (escalated)
        { id: '10', name: 'Lawyer', urgency: 3, importance: 7, confidence: 8, impact: 4, multiplier: 'lawyer' }, // 25 IMMEDIATE (escalated)
      ];

      const sorted = scorer.scoreBatch(features);

      // Verify tiers are correct
      expect(sorted[0].finalScore).toBe(38); // Critical
      expect(sorted[sorted.length - 1].tier).toBe('LATER'); // Typo or Comments

      // Count by tier
      const immediates = sorted.filter(f => f.tier === 'IMMEDIATE').length;
      const laters = sorted.filter(f => f.tier === 'LATER').length;

      expect(immediates).toBe(6); // 38, 35, 31, 25, 31, 25
      expect(laters).toBe(4); // 15, 14, 12, 13
    });
  });
});

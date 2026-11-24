import { describe, it, expect } from 'vitest';
import {
  validateEvidenceOutput,
  normalizeForQuoteMatch,
} from '@/lib/evidence-validation';
import { EvaluatedCriterion, RubricCriterion } from '@/lib/types';

describe('Evidence Validation (validateEvidenceOutput)', () => {
  const approvedRubric: RubricCriterion[] = [
    { id: 'c1', label: 'TypeScript', description: 'Experience with TS', weight: 50 },
    { id: 'c2', label: 'LLM Integration', description: 'Experience with AI APIs', weight: 50 },
  ];

  const resumeText = `Alex Chen is a Senior Software Engineer with 6 years of experience in TypeScript and React.
He integrated Google Gemini API into customer-facing applications, reducing latency by 40%.`;

  it('passes when valid exact quotes are present for all criteria', () => {
    const evaluation: EvaluatedCriterion[] = [
      {
        criterion_id: 'c1',
        evidence_level: 'clear',
        quotes: ['6 years of experience in TypeScript and React.'],
        explanation: 'Clear TS experience documented',
      },
      {
        criterion_id: 'c2',
        evidence_level: 'clear',
        quotes: ['integrated Google Gemini API into customer-facing applications'],
        explanation: 'Direct AI integration documented',
      },
    ];

    const result = validateEvidenceOutput(evaluation, approvedRubric, resumeText);
    expect(result.valid).toBe(true);
  });

  it('passes when quotes match across irregular whitespace, newlines, and Unicode', () => {
    // Resume text with non-breaking space and irregular newlines
    const messyResume = 'Senior   Architect\u00A0at\t\tCloudCorp.\n\nLed\r\nAI   team.';
    const evaluation: EvaluatedCriterion[] = [
      {
        criterion_id: 'c1',
        evidence_level: 'clear',
        quotes: ['Senior Architect at CloudCorp.'], // Clean single spaces
        explanation: 'Matches after normalization',
      },
      {
        criterion_id: 'c2',
        evidence_level: 'limited',
        quotes: ['Led AI team.'],
        explanation: 'Matches after newline collapse',
      },
    ];

    const result = validateEvidenceOutput(evaluation, approvedRubric, messyResume);
    expect(result.valid).toBe(true);
  });

  it('rejects when fabricated or hallucinated quotes do not exist in the resume', () => {
    const evaluation: EvaluatedCriterion[] = [
      {
        criterion_id: 'c1',
        evidence_level: 'clear',
        quotes: ['Graduated top of class with PhD in TypeScript from MIT in 2020'], // Hallucinated
        explanation: 'Fabricated claim',
      },
      {
        criterion_id: 'c2',
        evidence_level: 'none',
        quotes: [],
        explanation: 'None',
      },
    ];

    const result = validateEvidenceOutput(evaluation, approvedRubric, resumeText);
    expect(result.valid).toBe(false);
    expect(result.reason).toContain('quotes could not be verified');
    expect(result.failedQuotes).toBeDefined();
  });

  it('rejects when an unknown criterion ID appears in evaluation', () => {
    const evaluation: EvaluatedCriterion[] = [
      {
        criterion_id: 'c1',
        evidence_level: 'clear',
        quotes: ['TypeScript and React.'],
        explanation: 'TS',
      },
      {
        criterion_id: 'c99_unknown',
        evidence_level: 'none',
        quotes: [],
        explanation: 'Invalid ID',
      },
    ];

    const result = validateEvidenceOutput(evaluation, approvedRubric, resumeText);
    expect(result.valid).toBe(false);
    expect(result.reason).toContain('Unknown criterion ID');
  });

  it('rejects when duplicate criterion IDs are returned', () => {
    const evaluation: EvaluatedCriterion[] = [
      {
        criterion_id: 'c1',
        evidence_level: 'clear',
        quotes: ['TypeScript and React.'],
        explanation: 'TS first',
      },
      {
        criterion_id: 'c1',
        evidence_level: 'limited',
        quotes: ['TypeScript and React.'],
        explanation: 'TS duplicate',
      },
    ];

    const result = validateEvidenceOutput(evaluation, approvedRubric, resumeText);
    expect(result.valid).toBe(false);
    expect(result.reason).toContain('Duplicate criterion ID');
  });

  it('rejects when an approved criterion is omitted/missing from the evaluation', () => {
    const evaluation: EvaluatedCriterion[] = [
      {
        criterion_id: 'c1',
        evidence_level: 'clear',
        quotes: ['TypeScript and React.'],
        explanation: 'Only c1 evaluated',
      },
    ];

    const result = validateEvidenceOutput(evaluation, approvedRubric, resumeText);
    expect(result.valid).toBe(false);
    expect(result.reason).toContain('Expected 2 evaluated criteria, but received 1');
  });

  it('rejects when evidence level is "clear" or "limited" but quotes array is empty', () => {
    const evaluation: EvaluatedCriterion[] = [
      {
        criterion_id: 'c1',
        evidence_level: 'clear',
        quotes: [], // Empty quotes for clear!
        explanation: 'Missing evidence quote',
      },
      {
        criterion_id: 'c2',
        evidence_level: 'none',
        quotes: [],
        explanation: 'None',
      },
    ];

    const result = validateEvidenceOutput(evaluation, approvedRubric, resumeText);
    expect(result.valid).toBe(false);
    expect(result.reason).toContain('has evidence_level \'clear\' but has no quotes');
  });

  it('rejects when evidence level is "none" but contains non-empty quotes', () => {
    const evaluation: EvaluatedCriterion[] = [
      {
        criterion_id: 'c1',
        evidence_level: 'clear',
        quotes: ['TypeScript and React.'],
        explanation: 'Valid',
      },
      {
        criterion_id: 'c2',
        evidence_level: 'none',
        quotes: ['integrated Google Gemini API'], // None must NOT have quotes
        explanation: 'Invalid: quotes provided for none',
      },
    ];

    const result = validateEvidenceOutput(evaluation, approvedRubric, resumeText);
    expect(result.valid).toBe(false);
    expect(result.reason).toContain('has evidence_level \'none\' but contains quotes');
  });
});

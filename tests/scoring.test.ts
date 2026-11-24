import { describe, it, expect } from 'vitest';
import { calculateEvidenceScore } from '@/lib/scoring';
import { EvaluatedCriterion, RubricCriterion } from '@/lib/types';

describe('Scoring Logic (calculateEvidenceScore)', () => {
  const sampleRubric: RubricCriterion[] = [
    { id: 'c1', label: 'Frontend', description: 'React/TS', weight: 40 },
    { id: 'c2', label: 'Backend', description: 'Node.js', weight: 30 },
    { id: 'c3', label: 'Architecture', description: 'System Design', weight: 20 },
    { id: 'c4', label: 'Testing', description: 'Vitest/Jest', weight: 10 },
  ];

  it('calculates 100% when all criteria have clear evidence (1.0x)', () => {
    const evaluation: EvaluatedCriterion[] = [
      { criterion_id: 'c1', evidence_level: 'clear', quotes: ['React quote'], explanation: 'Good' },
      { criterion_id: 'c2', evidence_level: 'clear', quotes: ['Node quote'], explanation: 'Good' },
      { criterion_id: 'c3', evidence_level: 'clear', quotes: ['System quote'], explanation: 'Good' },
      { criterion_id: 'c4', evidence_level: 'clear', quotes: ['Test quote'], explanation: 'Good' },
    ];

    const score = calculateEvidenceScore(evaluation, sampleRubric);
    expect(score).toBe(100);
  });

  it('calculates 0% when all criteria have no evidence (0.0x)', () => {
    const evaluation: EvaluatedCriterion[] = [
      { criterion_id: 'c1', evidence_level: 'none', quotes: [], explanation: 'None' },
      { criterion_id: 'c2', evidence_level: 'none', quotes: [], explanation: 'None' },
      { criterion_id: 'c3', evidence_level: 'none', quotes: [], explanation: 'None' },
      { criterion_id: 'c4', evidence_level: 'none', quotes: [], explanation: 'None' },
    ];

    const score = calculateEvidenceScore(evaluation, sampleRubric);
    expect(score).toBe(0);
  });

  it('calculates 50% when all criteria have limited evidence (0.5x)', () => {
    const evaluation: EvaluatedCriterion[] = [
      { criterion_id: 'c1', evidence_level: 'limited', quotes: ['q1'], explanation: 'Limited' },
      { criterion_id: 'c2', evidence_level: 'limited', quotes: ['q2'], explanation: 'Limited' },
      { criterion_id: 'c3', evidence_level: 'limited', quotes: ['q3'], explanation: 'Limited' },
      { criterion_id: 'c4', evidence_level: 'limited', quotes: ['q4'], explanation: 'Limited' },
    ];

    const score = calculateEvidenceScore(evaluation, sampleRubric);
    expect(score).toBe(50);
  });

  it('calculates mixed weighted scores accurately with 1 decimal precision', () => {
    // c1 (40 * 1.0) = 40
    // c2 (30 * 0.5) = 15
    // c3 (20 * 0.0) = 0
    // c4 (10 * 0.5) = 5
    // Total = 60
    const evaluation: EvaluatedCriterion[] = [
      { criterion_id: 'c1', evidence_level: 'clear', quotes: ['q1'], explanation: 'Clear' },
      { criterion_id: 'c2', evidence_level: 'limited', quotes: ['q2'], explanation: 'Limited' },
      { criterion_id: 'c3', evidence_level: 'none', quotes: [], explanation: 'None' },
      { criterion_id: 'c4', evidence_level: 'limited', quotes: ['q4'], explanation: 'Limited' },
    ];

    const score = calculateEvidenceScore(evaluation, sampleRubric);
    expect(score).toBe(60);
  });

  it('throws an error if an unknown criterion ID appears in evaluation', () => {
    const evaluation: EvaluatedCriterion[] = [
      { criterion_id: 'unknown_id', evidence_level: 'clear', quotes: ['q'], explanation: 'Error' },
    ];

    expect(() => calculateEvidenceScore(evaluation, sampleRubric)).toThrow(
      'Unknown criterion ID in evaluation: unknown_id'
    );
  });

  it('throws an error if an invalid evidence level is passed', () => {
    const evaluation: any = [
      { criterion_id: 'c1', evidence_level: 'exceptional', quotes: ['q'], explanation: 'Error' },
    ];

    expect(() => calculateEvidenceScore(evaluation, sampleRubric)).toThrow(
      'Invalid evidence level: exceptional'
    );
  });
});

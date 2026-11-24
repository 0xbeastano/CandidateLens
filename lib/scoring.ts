import { EvaluatedCriterion, RubricCriterion } from './types';

/**
 * Calculates candidate evidence score from evaluated criteria and approved rubric weights.
 *
 * Scoring multipliers:
 * - clear: 1.0
 * - limited: 0.5
 * - none: 0.0
 *
 * Formula: sum(criterion.weight * evidenceMultiplier)
 * Rounded once at the end to one decimal place.
 */
export function calculateEvidenceScore(
  evaluatedCriteria: EvaluatedCriterion[],
  rubricCriteria: RubricCriterion[]
): number {
  const weightMap = new Map<string, number>();
  for (const c of rubricCriteria) {
    weightMap.set(c.id, c.weight);
  }

  let totalScore = 0;

  for (const evaluated of evaluatedCriteria) {
    const weight = weightMap.get(evaluated.criterion_id);
    if (weight === undefined) {
      throw new Error(`Unknown criterion ID in evaluation: ${evaluated.criterion_id}`);
    }

    let multiplier = 0;
    if (evaluated.evidence_level === 'clear') {
      multiplier = 1.0;
    } else if (evaluated.evidence_level === 'limited') {
      multiplier = 0.5;
    } else if (evaluated.evidence_level === 'none') {
      multiplier = 0.0;
    } else {
      throw new Error(`Invalid evidence level: ${(evaluated as { evidence_level: string }).evidence_level}`);
    }

    totalScore += weight * multiplier;
  }

  // Round once at the end to one decimal place
  const rounded = Math.round(totalScore * 10) / 10;

  // Bound check
  if (rounded < 0 || rounded > 100) {
    throw new Error(`Calculated evidence score ${rounded} is out of 0-100 bounds`);
  }

  return rounded;
}

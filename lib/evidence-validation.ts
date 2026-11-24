import { EvaluatedCriterion, RubricCriterion } from './types';

export interface EvidenceValidationResult {
  valid: boolean;
  reason?: string;
  failedQuotes?: string[];
}

/**
 * Normalizes text for exact quote verification:
 * - Normalizes Unicode to NFKC
 * - Strips invisible zero-width spaces and soft hyphens
 * - Normalizes en-dash, em-dash, and minus signs to standard hyphen
 * - Normalizes smart single/double quotes to standard quotes
 * - Replaces non-breaking spaces and irregular whitespace characters with standard spaces
 * - Collapses consecutive whitespace characters (including newlines and tabs) to a single space
 * - Trims leading and trailing whitespace
 * - Converts to lowercase for case-insensitive exact matching
 */
export function normalizeForQuoteMatch(text: string): string {
  return text
    .normalize('NFKC')
    .replace(/[\u200B\u200C\u200D\uFEFF\u00AD]/g, '')
    .replace(/[\u2010\u2011\u2012\u2013\u2014\u2015\u2212]/g, '-')
    .replace(/[\u2018\u2019\u201A\u201B]/g, "'")
    .replace(/[\u201C\u201D\u201E\u201F]/g, '"')
    .replace(/[\u00A0\u1680\u2000-\u200A\u2028\u2029\u202F\u205F\u3000]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

/**
 * Verifies if a normalized quotation exists in the normalized resume text:
 * 1. Direct exact substring match.
 * 2. Exact match after stripping model-added edge punctuation (trailing period, leading bullet).
 * 3. Exact match for ellipsis-separated fragments (when model quotes with "...").
 */
export function quoteMatchesResume(normalizedQuote: string, normalizedResume: string): boolean {
  if (!normalizedQuote) return false;

  // 1. Direct exact match
  if (normalizedResume.includes(normalizedQuote)) {
    return true;
  }

  // 2. Strip model-added edge punctuation (trailing periods/commas or leading bullet markers)
  const trimmedPunct = normalizedQuote
    .replace(/^[•\-\*\s"'`]+/, '')
    .replace(/[\.\,\;\:\!\?\s"'`]+$/, '');

  if (trimmedPunct.length >= 3 && normalizedResume.includes(trimmedPunct)) {
    return true;
  }

  // 3. Handle ellipsis (...) if model quoted non-contiguous fragments from a single section
  if (normalizedQuote.includes('...') || normalizedQuote.includes('…')) {
    const fragments = normalizedQuote
      .split(/\.{3,}|…/)
      .map((f) => f.replace(/^[•\-\*\s"'`]+/, '').replace(/[\.\,\;\:\!\?\s"'`]+$/, ''))
      .filter((f) => f.length >= 3);

    if (fragments.length > 0 && fragments.every((frag) => normalizedResume.includes(frag))) {
      return true;
    }
  }

  return false;
}

/**
 * Strict evidence verification:
 * - Every approved rubric criterion must appear exactly once.
 * - No duplicate or unknown criterion IDs.
 * - Evidence levels must be 'clear', 'limited', or 'none'.
 * - If clear or limited: must have at least one quote; EVERY quote must exist in resume_text (normalized).
 * - If none: quotes array must be empty.
 *
 * If any check fails, returns valid: false with reason.
 * Never silently repairs or downgrades evidence.
 */
export function validateEvidenceOutput(
  evaluatedCriteria: EvaluatedCriterion[],
  approvedRubricCriteria: RubricCriterion[],
  resumeText: string
): EvidenceValidationResult {
  const approvedIds = new Set(approvedRubricCriteria.map((c) => c.id));
  const seenIds = new Set<string>();

  if (evaluatedCriteria.length !== approvedRubricCriteria.length) {
    return {
      valid: false,
      reason: `Expected ${approvedRubricCriteria.length} evaluated criteria, but received ${evaluatedCriteria.length}`,
    };
  }

  const normalizedResume = normalizeForQuoteMatch(resumeText);

  for (const criterion of evaluatedCriteria) {
    // Check known ID
    if (!approvedIds.has(criterion.criterion_id)) {
      return {
        valid: false,
        reason: `Unknown criterion ID in evaluation: "${criterion.criterion_id}"`,
      };
    }

    // Check duplicate ID
    if (seenIds.has(criterion.criterion_id)) {
      return {
        valid: false,
        reason: `Duplicate criterion ID in evaluation: "${criterion.criterion_id}"`,
      };
    }
    seenIds.add(criterion.criterion_id);

    // Validate evidence level and quotes
    if (criterion.evidence_level === 'none') {
      if (criterion.quotes && criterion.quotes.length > 0) {
        return {
          valid: false,
          reason: `Criterion "${criterion.criterion_id}" has evidence_level 'none' but contains quotes`,
        };
      }
    } else if (criterion.evidence_level === 'clear' || criterion.evidence_level === 'limited') {
      if (!criterion.quotes || criterion.quotes.length === 0) {
        return {
          valid: false,
          reason: `Criterion "${criterion.criterion_id}" has evidence_level '${criterion.evidence_level}' but has no quotes`,
        };
      }

      // Check each quote against normalized resume text
      const failedQuotes: string[] = [];
      for (const quote of criterion.quotes) {
        const normalizedQuote = normalizeForQuoteMatch(quote);
        if (!quoteMatchesResume(normalizedQuote, normalizedResume)) {
          failedQuotes.push(quote);
        }
      }

      if (failedQuotes.length > 0) {
        return {
          valid: false,
          reason: `Criterion "${criterion.criterion_id}" quotes could not be verified in the resume`,
          failedQuotes,
        };
      }
    } else {
      return {
        valid: false,
        reason: `Criterion "${criterion.criterion_id}" has invalid evidence level: "${(criterion as { evidence_level: string }).evidence_level}"`,
      };
    }
  }

  // Ensure every approved criterion was seen
  for (const approvedId of approvedIds) {
    if (!seenIds.has(approvedId)) {
      return {
        valid: false,
        reason: `Approved criterion "${approvedId}" was not evaluated`,
      };
    }
  }

  return { valid: true };
}

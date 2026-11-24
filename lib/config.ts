// CandidateLens Configuration & Limits

export const CONFIG = {
  // Limits
  MAX_RESUMES: 5,
  MAX_FILE_SIZE_BYTES: 2 * 1024 * 1024, // 2 MB
  MAX_PAGES_PER_PDF: 10,
  MIN_JD_CHARS: 100,
  MAX_JD_CHARS: 20000,
  MAX_RESUME_TEXT_CHARS: 60000,
  
  // Text Sufficiency Heuristic:
  // A heuristic minimum character count to detect empty/scanned PDFs.
  // Note: This is an empirical heuristic, not a guaranteed OCR detector.
  MIN_READABLE_TEXT_CHARS: 100,

  // Criteria generation range
  MIN_CRITERIA_COUNT: 4,
  MAX_CRITERIA_COUNT: 6,
  TARGET_TOTAL_WEIGHT: 100,

  // Default provider timeout in milliseconds (25 seconds)
  PROVIDER_TIMEOUT_MS: 25000,
} as const;

export const DISCLAIMER_TEXT =
  'AI-assisted review. Scores reflect documented resume evidence, not verified ability or a hiring decision.';

export const TRANSPARENCY_NOTE =
  'This transparent prototype rubric is not a validated predictor of job performance. Resume quotations are claims, not verified facts.';

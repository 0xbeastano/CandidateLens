// CandidateLens Core Domain Types

export type EvidenceLevel = 'clear' | 'limited' | 'none';

export interface RubricCriterion {
  id: string;
  label: string;
  description: string;
  weight: number;
}

export interface Rubric {
  rubric_id: string;
  criteria: RubricCriterion[];
}

export interface EvaluatedCriterion {
  criterion_id: string;
  evidence_level: EvidenceLevel;
  quotes: string[];
  explanation: string;
}

export type CandidateStatus =
  | 'queued'
  | 'extracting'
  | 'ready'
  | 'evaluating'
  | 'complete'
  | 'manual_review'
  | 'failed';

export interface CandidateEvaluationResult {
  candidate_id: string;
  status: 'complete' | 'manual_review' | 'failed';
  summary?: string;
  criteria?: EvaluatedCriterion[];
  evidence_score?: number; // 0 to 100
  missing_information?: string[];
  interview_questions?: [string, string, string] | string[];
  error_message?: string;
}

export interface CandidateFile {
  id: string; // crypto.randomUUID()
  file?: File;
  filename: string;
  fileSize: number;
  lastModified: number;
  extractedText: string;
  pageCount: number;
  status: CandidateStatus;
  statusMessage?: string;
  evaluation?: CandidateEvaluationResult;
}

export interface RankedCandidate {
  rank: number;
  candidate_id: string;
  filename: string;
  evidence_score: number;
  summary: string;
  missing_information_count: number;
  missing_information: string[];
  criteria: EvaluatedCriterion[];
  interview_questions: string[];
  isProvisional: boolean;
}

export interface ApiErrorResponse {
  error: {
    code: string;
    message: string;
    retryable: boolean;
  };
}

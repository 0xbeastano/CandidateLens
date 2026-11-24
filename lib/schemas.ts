import { z } from 'zod';
import { CONFIG } from './config';

// Rubric Criterion Schema
export const rubricCriterionSchema = z.object({
  id: z.string().min(1, 'Criterion ID cannot be empty'),
  label: z.string().min(1, 'Label cannot be empty').max(100, 'Label is too long'),
  description: z.string().min(1, 'Description cannot be empty').max(500, 'Description is too long'),
  weight: z
    .number()
    .int('Weight must be an integer')
    .positive('Weight must be greater than zero'),
});

// Full Rubric Schema
export const rubricSchema = z.object({
  rubric_id: z.string().uuid('rubric_id must be a valid UUID'),
  criteria: z
    .array(rubricCriterionSchema)
    .min(CONFIG.MIN_CRITERIA_COUNT, `Must contain at least ${CONFIG.MIN_CRITERIA_COUNT} criteria`)
    .max(CONFIG.MAX_CRITERIA_COUNT, `Cannot exceed ${CONFIG.MAX_CRITERIA_COUNT} criteria`)
    .refine((criteria) => {
      const ids = new Set(criteria.map((c) => c.id));
      return ids.size === criteria.length;
    }, { message: 'Criterion IDs must be unique' })
    .refine((criteria) => {
      const total = criteria.reduce((sum, c) => sum + c.weight, 0);
      return total === CONFIG.TARGET_TOTAL_WEIGHT;
    }, { message: `Criteria weights must sum to exactly ${CONFIG.TARGET_TOTAL_WEIGHT}` }),
});

// POST /api/rubric request schema
export const generateRubricRequestSchema = z.object({
  job_description: z
    .string()
    .min(CONFIG.MIN_JD_CHARS, `Job description must be at least ${CONFIG.MIN_JD_CHARS} characters`)
    .max(CONFIG.MAX_JD_CHARS, `Job description cannot exceed ${CONFIG.MAX_JD_CHARS} characters`),
});

// Evidence Criterion Output Schema from Model
export const evaluatedCriterionSchema = z.object({
  criterion_id: z.string().min(1),
  evidence_level: z.enum(['clear', 'limited', 'none']),
  quotes: z.array(z.string()),
  explanation: z.string().min(1),
});

// POST /api/evaluate request schema
export const evaluateRequestSchema = z.object({
  candidate_id: z.string().uuid('candidate_id must be a valid UUID'),
  filename: z.string().min(1, 'Filename required'),
  resume_text: z
    .string()
    .min(CONFIG.MIN_READABLE_TEXT_CHARS, 'Resume text is below minimum readability threshold')
    .max(CONFIG.MAX_RESUME_TEXT_CHARS, `Resume text exceeds ${CONFIG.MAX_RESUME_TEXT_CHARS} character limit`),
  rubric: rubricSchema,
});

// Model Evaluation raw output schema (before scoring calculation)
export const modelEvaluationOutputSchema = z.object({
  summary: z.string().min(1, 'Summary cannot be empty'),
  criteria: z.array(evaluatedCriterionSchema),
  missing_information: z.array(z.string()),
  interview_questions: z.array(z.string()).length(3, 'Exactly 3 interview questions are required'),
});

// POST /api/evaluate successful response schema
export const evaluateResponseSchema = z.object({
  candidate_id: z.string().uuid(),
  status: z.enum(['complete', 'manual_review', 'failed']),
  summary: z.string().optional(),
  criteria: z.array(evaluatedCriterionSchema).optional(),
  evidence_score: z.number().min(0).max(100).optional(),
  missing_information: z.array(z.string()).optional(),
  interview_questions: z.array(z.string()).optional(),
  error_message: z.string().optional(),
});

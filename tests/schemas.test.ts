import { describe, it, expect } from 'vitest';
import {
  rubricSchema,
  generateRubricRequestSchema,
  evaluateRequestSchema,
} from '@/lib/schemas';
import { CONFIG } from '@/lib/config';

describe('Zod Schemas and Domain Rules Validation', () => {
  const validRubricId = '11111111-2222-4333-8444-555555555555';

  describe('Rubric Schema', () => {
    it('accepts a valid 4-criteria rubric summing to exactly 100', () => {
      const validRubric = {
        rubric_id: validRubricId,
        criteria: [
          { id: 'c1', label: 'Frontend', description: 'React/TS', weight: 30 },
          { id: 'c2', label: 'Backend', description: 'Node.js/SQL', weight: 30 },
          { id: 'c3', label: 'Testing', description: 'Vitest/Jest', weight: 20 },
          { id: 'c4', label: 'Architecture', description: 'Systems', weight: 20 },
        ],
      };

      const result = rubricSchema.safeParse(validRubric);
      expect(result.success).toBe(true);
    });

    it('rejects rubrics whose weights sum to less than 100', () => {
      const invalidRubric = {
        rubric_id: validRubricId,
        criteria: [
          { id: 'c1', label: 'Frontend', description: 'React', weight: 20 },
          { id: 'c2', label: 'Backend', description: 'Node', weight: 20 },
          { id: 'c3', label: 'Testing', description: 'Vitest', weight: 20 },
          { id: 'c4', label: 'Architecture', description: 'Systems', weight: 20 },
        ], // sum = 80
      };

      const result = rubricSchema.safeParse(invalidRubric);
      expect(result.success).toBe(false);
      expect(result.error?.errors[0].message).toContain('Criteria weights must sum to exactly 100');
    });

    it('rejects rubrics with zero or negative weights', () => {
      const invalidRubric = {
        rubric_id: validRubricId,
        criteria: [
          { id: 'c1', label: 'Frontend', description: 'React', weight: 0 },
          { id: 'c2', label: 'Backend', description: 'Node', weight: 50 },
          { id: 'c3', label: 'Testing', description: 'Vitest', weight: 50 },
          { id: 'c4', label: 'Architecture', description: 'Systems', weight: 0 },
        ],
      };

      const result = rubricSchema.safeParse(invalidRubric);
      expect(result.success).toBe(false);
      expect(result.error?.errors[0].message).toContain('Weight must be greater than zero');
    });

    it('rejects non-integer weights', () => {
      const invalidRubric = {
        rubric_id: validRubricId,
        criteria: [
          { id: 'c1', label: 'Frontend', description: 'React', weight: 33.5 },
          { id: 'c2', label: 'Backend', description: 'Node', weight: 33.5 },
          { id: 'c3', label: 'Testing', description: 'Vitest', weight: 16.5 },
          { id: 'c4', label: 'Architecture', description: 'Systems', weight: 16.5 },
        ],
      };

      const result = rubricSchema.safeParse(invalidRubric);
      expect(result.success).toBe(false);
      expect(result.error?.errors[0].message).toContain('Weight must be an integer');
    });

    it('rejects duplicate criterion IDs', () => {
      const duplicateRubric = {
        rubric_id: validRubricId,
        criteria: [
          { id: 'c1', label: 'Frontend', description: 'React', weight: 30 },
          { id: 'c1', label: 'Frontend Duplicate', description: 'React', weight: 30 },
          { id: 'c3', label: 'Testing', description: 'Vitest', weight: 20 },
          { id: 'c4', label: 'Architecture', description: 'Systems', weight: 20 },
        ],
      };

      const result = rubricSchema.safeParse(duplicateRubric);
      expect(result.success).toBe(false);
      expect(result.error?.errors[0].message).toContain('Criterion IDs must be unique');
    });

    it('rejects criteria count less than 4 or greater than 6', () => {
      const tooFew = {
        rubric_id: validRubricId,
        criteria: [
          { id: 'c1', label: 'Frontend', description: 'React', weight: 50 },
          { id: 'c2', label: 'Backend', description: 'Node', weight: 50 },
        ],
      };
      expect(rubricSchema.safeParse(tooFew).success).toBe(false);

      const tooMany = {
        rubric_id: validRubricId,
        criteria: [
          { id: 'c1', label: 'Frontend', description: 'React', weight: 15 },
          { id: 'c2', label: 'Backend', description: 'Node', weight: 15 },
          { id: 'c3', label: 'Testing', description: 'Vitest', weight: 15 },
          { id: 'c4', label: 'Architecture', description: 'Systems', weight: 15 },
          { id: 'c5', label: 'DevOps', description: 'Docker', weight: 20 },
          { id: 'c6', label: 'Security', description: 'Auth', weight: 10 },
          { id: 'c7', label: 'Mobile', description: 'React Native', weight: 10 },
        ],
      };
      expect(rubricSchema.safeParse(tooMany).success).toBe(false);
    });
  });

  describe('Job Description Request Schema', () => {
    it('accepts JD within 100 to 20,000 characters', () => {
      const validText = 'a'.repeat(250);
      expect(generateRubricRequestSchema.safeParse({ job_description: validText }).success).toBe(true);
    });

    it('rejects JD under 100 characters', () => {
      const shortText = 'Too short job description.';
      const res = generateRubricRequestSchema.safeParse({ job_description: shortText });
      expect(res.success).toBe(false);
      expect(res.error?.errors[0].message).toContain(`at least ${CONFIG.MIN_JD_CHARS} characters`);
    });

    it('rejects JD exceeding 20,000 characters', () => {
      const longText = 'a'.repeat(20001);
      const res = generateRubricRequestSchema.safeParse({ job_description: longText });
      expect(res.success).toBe(false);
      expect(res.error?.errors[0].message).toContain(`cannot exceed ${CONFIG.MAX_JD_CHARS} characters`);
    });
  });

  describe('Candidate Evaluation Request Schema', () => {
    it('enforces UUID for candidate_id and preserves it', () => {
      const payload = {
        candidate_id: 'not-a-valid-uuid',
        filename: 'resume.pdf',
        resume_text: 'a'.repeat(200),
        rubric: {
          rubric_id: validRubricId,
          criteria: [
            { id: 'c1', label: 'A', description: 'A', weight: 25 },
            { id: 'c2', label: 'B', description: 'B', weight: 25 },
            { id: 'c3', label: 'C', description: 'C', weight: 25 },
            { id: 'c4', label: 'D', description: 'D', weight: 25 },
          ],
        },
      };

      const result = evaluateRequestSchema.safeParse(payload);
      expect(result.success).toBe(false);
      expect(result.error?.errors[0].message).toContain('candidate_id must be a valid UUID');
    });
  });
});

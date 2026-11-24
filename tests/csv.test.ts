import { describe, it, expect } from 'vitest';
import { sanitizeForCsv, generateCandidateSummaryCsv } from '@/lib/csv';
import { RankedCandidate } from '@/lib/types';

describe('CSV Generation & Injection Protection', () => {
  describe('Formula Injection Protection (sanitizeForCsv)', () => {
    it('prepends an apostrophe when value starts with = (formula trigger)', () => {
      const result = sanitizeForCsv('=SUM(A1:A10)');
      expect(result).toBe("\"'=SUM(A1:A10)\"");
    });

    it('prepends an apostrophe when value starts with +', () => {
      const result = sanitizeForCsv('+1234567890');
      expect(result).toBe("\"'+1234567890\"");
    });

    it('prepends an apostrophe when value starts with -', () => {
      const result = sanitizeForCsv('-cmd|/C calc!A0');
      expect(result).toBe("\"'-cmd|/C calc!A0\"");
    });

    it('prepends an apostrophe when value starts with @', () => {
      const result = sanitizeForCsv('@SUM(1+1)');
      expect(result).toBe("\"'@SUM(1+1)\"");
    });

    it('prepends an apostrophe when value starts with a tab character', () => {
      const result = sanitizeForCsv('\tDDE("cmd";"")');
      expect(result).toContain("'");
    });

    it('escapes embedded double quotes correctly by doubling them', () => {
      const result = sanitizeForCsv('Alex "The Architect" Chen');
      expect(result).toBe('"Alex ""The Architect"" Chen"');
    });

    it('wraps fields containing commas in quotes', () => {
      const result = sanitizeForCsv('San Francisco, CA, USA');
      expect(result).toBe('"San Francisco, CA, USA"');
    });

    it('wraps fields containing line breaks in quotes', () => {
      const result = sanitizeForCsv('Line 1\nLine 2');
      expect(result).toBe('"Line 1\nLine 2"');
    });

    it('handles null, undefined, and empty strings gracefully', () => {
      expect(sanitizeForCsv(null)).toBe('');
      expect(sanitizeForCsv(undefined)).toBe('');
      expect(sanitizeForCsv('')).toBe('');
    });
  });

  describe('Full CSV Summary Generation (generateCandidateSummaryCsv)', () => {
    it('generates compliant CSV with correct headers and sanitized cells', () => {
      const ranked: RankedCandidate[] = [
        {
          rank: 1,
          candidate_id: '11111111-1111-4111-8111-111111111111',
          filename: 'Alex_Chen_Staff.pdf',
          evidence_score: 95.5,
          summary: 'Experienced staff engineer, specialized in Next.js.',
          missing_information_count: 0,
          missing_information: [],
          criteria: [],
          interview_questions: [],
          isProvisional: false,
        },
        {
          rank: 2,
          candidate_id: '22222222-2222-4222-8222-222222222222',
          filename: '=Malicious_Filename.pdf', // Attempted injection in filename
          evidence_score: 40,
          summary: 'Junior developer.',
          missing_information_count: 2,
          missing_information: ['No Next.js experience', 'No LLM experience'],
          criteria: [],
          interview_questions: [],
          isProvisional: false,
        },
      ];

      const csv = generateCandidateSummaryCsv(ranked);
      const lines = csv.split('\r\n');

      // Check Header
      expect(lines[0]).toBe('rank,filename,evidence_score,summary,missing_information');

      // Check Row 1
      expect(lines[1]).toContain('1,Alex_Chen_Staff.pdf,95.5');
      expect(lines[1]).toContain('"Experienced staff engineer, specialized in Next.js."');
      expect(lines[1]).toContain('None identified');

      // Check Row 2 (sanitized formula trigger)
      expect(lines[2]).toContain('2,"\'=Malicious_Filename.pdf",40');
      expect(lines[2]).toContain('"No Next.js experience; No LLM experience"');
    });
  });
});

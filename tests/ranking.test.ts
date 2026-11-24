import { describe, it, expect } from 'vitest';
import { rankCandidates } from '@/lib/ranking';
import { CandidateFile } from '@/lib/types';

describe('Ranking Logic (rankCandidates)', () => {
  const createMockCandidate = (
    id: string,
    filename: string,
    status: CandidateFile['status'],
    score?: number
  ): CandidateFile => ({
    id,
    filename,
    fileSize: 100000,
    lastModified: 1000,
    extractedText: 'sample text',
    pageCount: 1,
    status,
    evaluation: score !== undefined ? {
      candidate_id: id,
      status: 'complete',
      summary: `Summary for ${filename}`,
      evidence_score: score,
      missing_information: [],
      criteria: [],
      interview_questions: ['q1', 'q2', 'q3'],
    } : undefined,
  });

  it('ranks completed candidates descending by evidence_score', () => {
    const candidates: CandidateFile[] = [
      createMockCandidate('c1', 'cand1.pdf', 'complete', 45),
      createMockCandidate('c2', 'cand2.pdf', 'complete', 90),
      createMockCandidate('c3', 'cand3.pdf', 'complete', 70),
    ];

    const { ranked } = rankCandidates(candidates);
    expect(ranked).toHaveLength(3);
    expect(ranked[0].filename).toBe('cand2.pdf');
    expect(ranked[0].rank).toBe(1);
    expect(ranked[0].evidence_score).toBe(90);

    expect(ranked[1].filename).toBe('cand3.pdf');
    expect(ranked[1].rank).toBe(2);
    expect(ranked[1].evidence_score).toBe(70);

    expect(ranked[2].filename).toBe('cand1.pdf');
    expect(ranked[2].rank).toBe(3);
    expect(ranked[2].evidence_score).toBe(45);
  });

  it('applies standard competition ranking (1, 2, 2, 4) for equal scores', () => {
    const candidates: CandidateFile[] = [
      createMockCandidate('c1', 'cand1.pdf', 'complete', 95), // Rank 1
      createMockCandidate('c2', 'cand2.pdf', 'complete', 80), // Rank 2 (tie)
      createMockCandidate('c3', 'cand3.pdf', 'complete', 80), // Rank 2 (tie)
      createMockCandidate('c4', 'cand4.pdf', 'complete', 60), // Rank 4
    ];

    const { ranked } = rankCandidates(candidates);
    expect(ranked[0].rank).toBe(1);
    expect(ranked[0].filename).toBe('cand1.pdf');

    expect(ranked[1].rank).toBe(2);
    expect(ranked[2].rank).toBe(2);

    expect(ranked[3].rank).toBe(4);
    expect(ranked[3].filename).toBe('cand4.pdf');
  });

  it('preserves original upload order for tied candidates', () => {
    const candidates: CandidateFile[] = [
      createMockCandidate('c-first', 'first_uploaded.pdf', 'complete', 75),
      createMockCandidate('c-second', 'second_uploaded.pdf', 'complete', 75),
    ];

    const { ranked } = rankCandidates(candidates);
    expect(ranked[0].filename).toBe('first_uploaded.pdf');
    expect(ranked[1].filename).toBe('second_uploaded.pdf');
    expect(ranked[0].rank).toBe(1);
    expect(ranked[1].rank).toBe(1);
  });

  it('excludes failed and manual_review candidates from ranking and places them in unranked', () => {
    const candidates: CandidateFile[] = [
      createMockCandidate('c1', 'good.pdf', 'complete', 85),
      createMockCandidate('c2', 'scanned.pdf', 'manual_review'),
      createMockCandidate('c3', 'corrupted.pdf', 'failed'),
    ];

    const { ranked, unranked } = rankCandidates(candidates);
    expect(ranked).toHaveLength(1);
    expect(ranked[0].filename).toBe('good.pdf');

    expect(unranked).toHaveLength(2);
    expect(unranked.map((u) => u.filename)).toEqual(['scanned.pdf', 'corrupted.pdf']);
  });

  it('marks results as provisional if any candidate is still in progress', () => {
    const candidates: CandidateFile[] = [
      createMockCandidate('c1', 'done.pdf', 'complete', 85),
      createMockCandidate('c2', 'evaluating.pdf', 'evaluating'),
    ];

    const { isProvisional } = rankCandidates(candidates);
    expect(isProvisional).toBe(true);
  });

  it('marks results as NOT provisional when all candidates reach terminal states', () => {
    const candidates: CandidateFile[] = [
      createMockCandidate('c1', 'done.pdf', 'complete', 85),
      createMockCandidate('c2', 'manual.pdf', 'manual_review'),
      createMockCandidate('c3', 'failed.pdf', 'failed'),
    ];

    const { isProvisional } = rankCandidates(candidates);
    expect(isProvisional).toBe(false);
  });
});

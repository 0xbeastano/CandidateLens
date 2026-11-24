import { CandidateFile, RankedCandidate } from './types';

/**
 * Computes ranked comparison from candidate files.
 *
 * Rules:
 * - Only rank candidates with status === 'complete' and valid evaluation with evidence_score.
 * - Sort descending by evidence_score.
 * - Equal scores share a rank using competition ranking: 1, 2, 2, 4.
 * - Preserves original upload order for displaying tied candidates.
 * - Failed and manual_review candidates are excluded from ranking.
 * - Results are marked provisional if any candidate file is still queued, extracting, ready, or evaluating.
 */
export function rankCandidates(candidateFiles: CandidateFile[]): {
  ranked: RankedCandidate[];
  isProvisional: boolean;
  unranked: CandidateFile[];
} {
  // Check if any candidate has not reached a terminal state
  const isProvisional = candidateFiles.some(
    (c) => c.status === 'queued' || c.status === 'extracting' || c.status === 'ready' || c.status === 'evaluating'
  );

  const completeCandidates: { candidate: CandidateFile; originalIndex: number }[] = [];
  const unranked: CandidateFile[] = [];

  candidateFiles.forEach((c, index) => {
    if (c.status === 'complete' && c.evaluation?.evidence_score !== undefined && c.evaluation.criteria) {
      completeCandidates.push({ candidate: c, originalIndex: index });
    } else {
      unranked.push(c);
    }
  });

  // Sort descending by score; tie-break by original upload index
  completeCandidates.sort((a, b) => {
    const scoreDiff = (b.candidate.evaluation?.evidence_score ?? 0) - (a.candidate.evaluation?.evidence_score ?? 0);
    if (Math.abs(scoreDiff) > 0.0001) {
      return scoreDiff;
    }
    return a.originalIndex - b.originalIndex;
  });

  // Assign competition ranking (1, 2, 2, 4)
  const ranked: RankedCandidate[] = [];
  let currentRank = 1;

  for (let i = 0; i < completeCandidates.length; i++) {
    const item = completeCandidates[i];
    const score = item.candidate.evaluation?.evidence_score ?? 0;

    if (i > 0) {
      const prevScore = completeCandidates[i - 1].candidate.evaluation?.evidence_score ?? 0;
      if (Math.abs(score - prevScore) > 0.0001) {
        // Next distinct score gets rank i + 1 (1-based index)
        currentRank = i + 1;
      }
      // If score equals prevScore, currentRank remains unchanged (shared rank)
    }

    const evaluation = item.candidate.evaluation!;
    ranked.push({
      rank: currentRank,
      candidate_id: item.candidate.id,
      filename: item.candidate.filename,
      evidence_score: score,
      summary: evaluation.summary || 'Summary unavailable',
      missing_information_count: evaluation.missing_information?.length || 0,
      missing_information: evaluation.missing_information || [],
      criteria: evaluation.criteria || [],
      interview_questions: evaluation.interview_questions || [],
      isProvisional,
    });
  }

  return { ranked, isProvisional, unranked };
}

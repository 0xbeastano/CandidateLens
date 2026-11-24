'use client';

import React from 'react';
import { Play, RotateCw, AlertTriangle, CheckCircle, ShieldCheck } from 'lucide-react';
import { CandidateFile } from '@/lib/types';

interface ProcessingStatusProps {
  candidates: CandidateFile[];
  isEvaluating: boolean;
  isRubricConfirmed: boolean;
  onStartEvaluation: () => void;
  onRetryCandidate: (candidateId: string) => void;
  evaluatingIndex: number;
  totalToEvaluate: number;
  isDemoMode: boolean;
}

export function ProcessingStatus({
  candidates,
  isEvaluating,
  isRubricConfirmed,
  onStartEvaluation,
  onRetryCandidate,
  evaluatingIndex,
  totalToEvaluate,
  isDemoMode,
}: ProcessingStatusProps) {
  const readyCount = candidates.filter((c) => c.status === 'ready').length;
  const completeCount = candidates.filter((c) => c.status === 'complete').length;
  const manualReviewCount = candidates.filter((c) => c.status === 'manual_review').length;
  const failedCount = candidates.filter((c) => c.status === 'failed').length;

  const failedCandidates = candidates.filter((c) => c.status === 'failed');

  const canStart = isRubricConfirmed && readyCount > 0 && !isEvaluating;

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-base font-semibold text-slate-900">
              Stage 3: Evidence Evaluation
            </h2>
            {isDemoMode && (
              <span className="inline-flex items-center rounded-md bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-800 border border-amber-200">
                Synthetic Demo Mode
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Evaluates candidates sequentially against the confirmed rubric. Each candidate is isolated in an individual request.
          </p>
        </div>

        <div>
          <button
            type="button"
            onClick={onStartEvaluation}
            disabled={!canStart}
            className="inline-flex items-center rounded-lg bg-indigo-600 px-5 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:bg-slate-300 disabled:cursor-not-allowed transition-all"
          >
            {isEvaluating ? (
              <>
                <RotateCw className="mr-2 h-4 w-4 animate-spin" />
                Evaluating {evaluatingIndex} of {totalToEvaluate}...
              </>
            ) : (
              <>
                <Play className="mr-2 h-4 w-4 fill-white" />
                Evaluate Candidates ({readyCount} Ready)
              </>
            )}
          </button>
        </div>
      </div>

      {/* Progress & Summary Bar */}
      <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2 pt-4 border-t border-slate-100 text-xs">
        <div className="rounded-lg bg-slate-50 p-2.5 border border-slate-100">
          <span className="text-slate-500 block text-[11px]">Ready to Process</span>
          <span className="text-base font-semibold text-slate-800">{readyCount}</span>
        </div>
        <div className="rounded-lg bg-emerald-50/70 p-2.5 border border-emerald-100">
          <span className="text-emerald-700 block text-[11px]">Completed & Validated</span>
          <span className="text-base font-semibold text-emerald-900">{completeCount}</span>
        </div>
        <div className="rounded-lg bg-amber-50/70 p-2.5 border border-amber-100">
          <span className="text-amber-800 block text-[11px]">Manual Review Needed</span>
          <span className="text-base font-semibold text-amber-900">{manualReviewCount}</span>
        </div>
        <div className="rounded-lg bg-rose-50/70 p-2.5 border border-rose-100">
          <span className="text-rose-700 block text-[11px]">Failed Requests</span>
          <span className="text-base font-semibold text-rose-900">{failedCount}</span>
        </div>
      </div>

      {/* Warnings / Explanations */}
      {!isRubricConfirmed && candidates.length > 0 && (
        <div className="mt-4 rounded-lg bg-slate-50 p-3 text-xs text-slate-600 border border-slate-200 flex items-start space-x-2">
          <ShieldCheck className="h-4 w-4 text-slate-400 mt-0.5 shrink-0" />
          <span>
            Please review and click <strong>Confirm Rubric</strong> in Stage 1 above before starting the evaluation.
          </span>
        </div>
      )}

      {/* Retry Failed Candidates Button */}
      {failedCandidates.length > 0 && !isEvaluating && (
        <div className="mt-4 rounded-lg bg-rose-50 p-3 border border-rose-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div className="flex items-center space-x-2 text-xs text-rose-800">
            <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0" />
            <span>
              {failedCandidates.length} candidate evaluation{failedCandidates.length > 1 ? 's' : ''} encountered a temporary error.
            </span>
          </div>
          <div className="flex items-center space-x-2">
            {failedCandidates.map((fc) => (
              <button
                key={fc.id}
                type="button"
                onClick={() => onRetryCandidate(fc.id)}
                className="inline-flex items-center rounded bg-white px-2.5 py-1 text-xs font-medium text-rose-700 border border-rose-300 hover:bg-rose-50 shadow-xs"
              >
                <RotateCw className="mr-1 h-3 w-3" />
                Retry {fc.filename.length > 15 ? fc.filename.substring(0, 15) + '...' : fc.filename}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

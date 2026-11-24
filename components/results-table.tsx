'use client';

import React from 'react';
import { Download, Award, AlertCircle, Eye, Info, Clock } from 'lucide-react';
import { CandidateFile, RankedCandidate } from '@/lib/types';
import { generateCandidateSummaryCsv } from '@/lib/csv';

interface ResultsTableProps {
  rankedCandidates: RankedCandidate[];
  isProvisional: boolean;
  unrankedCandidates: CandidateFile[];
  onSelectCandidate: (candidateId: string) => void;
  isEvaluating: boolean;
  isDemoMode: boolean;
}

export function ResultsTable({
  rankedCandidates,
  isProvisional,
  unrankedCandidates,
  onSelectCandidate,
  isEvaluating,
  isDemoMode,
}: ResultsTableProps) {
  if (rankedCandidates.length === 0 && unrankedCandidates.length === 0) {
    return null;
  }

  const handleExportCsv = () => {
    if (rankedCandidates.length === 0) return;
    const csvContent = generateCandidateSummaryCsv(rankedCandidates);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `candidatelens-summary-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const manualOrFailedUnranked = unrankedCandidates.filter(
    (c) => c.status === 'manual_review' || c.status === 'failed' || c.status === 'complete'
  );

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
      {/* Header and CSV Export */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-slate-100 gap-3">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-base font-semibold text-slate-900">
              Ranked Evidence Comparison
            </h2>
            {isProvisional && (
              <span className="inline-flex items-center rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-800 border border-amber-200">
                <Clock className="mr-1 h-3 w-3" />
                Provisional (Batch in Progress)
              </span>
            )}
            {isDemoMode && (
              <span className="inline-flex items-center rounded bg-slate-100 px-2 py-0.5 text-[10px] font-mono text-slate-600">
                Synthetic Fixture Output
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Ranking within this uploaded batch only. Scores reflect documented resume evidence.
          </p>
        </div>

        <div>
          <button
            type="button"
            onClick={handleExportCsv}
            disabled={rankedCandidates.length === 0 || isEvaluating}
            className="inline-flex items-center rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-40"
          >
            <Download className="mr-1.5 h-4 w-4 text-slate-500" />
            Export Summary CSV
          </button>
        </div>
      </div>

      {/* Permanent Notice */}
      <div className="rounded-lg bg-slate-50 p-3 text-xs text-slate-600 border border-slate-200 flex items-start space-x-2">
        <Info className="h-4 w-4 text-slate-400 mt-0.5 shrink-0" />
        <div>
          <span className="font-semibold">AI-assisted review:</span> Scores reflect documented resume
          evidence against confirmed criteria, not verified ability or a hiring decision. Equal scores
          share a rank using standard competition ranking (1, 2, 2, 4).
        </div>
      </div>

      {/* Main Ranked Table */}
      {rankedCandidates.length > 0 ? (
        <div className="overflow-x-auto rounded-lg border border-slate-200">
          <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
            <thead className="bg-slate-50 text-slate-700 font-semibold">
              <tr>
                <th scope="col" className="px-4 py-3 w-16 text-center">
                  Rank
                </th>
                <th scope="col" className="px-4 py-3">
                  Candidate Filename
                </th>
                <th scope="col" className="px-4 py-3 w-32 text-center">
                  Evidence Score
                </th>
                <th scope="col" className="px-4 py-3">
                  Evidence Summary
                </th>
                <th scope="col" className="px-4 py-3 w-36 text-center">
                  Missing Info
                </th>
                <th scope="col" className="px-4 py-3 w-28 text-right">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {rankedCandidates.map((c) => (
                <tr key={c.candidate_id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="px-4 py-3.5 text-center font-bold text-slate-900">
                    <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-xs text-slate-800">
                      #{c.rank}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 font-medium text-slate-900 max-w-[200px] truncate">
                    {c.filename}
                  </td>
                  <td className="px-4 py-3.5 text-center">
                    <span
                      className={`inline-flex items-center px-2.5 py-1 rounded-md font-bold text-xs ${
                        c.evidence_score >= 80
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          : c.evidence_score >= 50
                          ? 'bg-blue-50 text-blue-800 border border-blue-200'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {c.evidence_score} / 100
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-slate-600 line-clamp-2 max-w-md leading-relaxed">
                    {c.summary}
                  </td>
                  <td className="px-4 py-3.5 text-center">
                    {c.missing_information_count > 0 ? (
                      <span className="inline-flex items-center rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-800 border border-amber-200">
                        {c.missing_information_count} missing
                      </span>
                    ) : (
                      <span className="text-slate-400 text-[11px]">None flagged</span>
                    )}
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    <button
                      type="button"
                      onClick={() => onSelectCandidate(c.candidate_id)}
                      className="inline-flex items-center rounded-md bg-indigo-50 px-2.5 py-1.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 transition-colors"
                    >
                      <Eye className="mr-1 h-3.5 w-3.5" />
                      Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="p-6 text-center text-xs text-slate-500 bg-slate-50 rounded-lg border border-slate-200">
          No candidates evaluated yet. Complete Stage 1 and Stage 2 to begin.
        </div>
      )}

      {/* Unranked / Manual Review / Failed Files Section */}
      {manualOrFailedUnranked.length > 0 && (
        <div className="space-y-3 pt-2">
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-4 w-4 text-amber-600" />
            <h3 className="text-xs font-semibold text-slate-800 uppercase tracking-wider">
              Unranked Files / Manual Review Required ({manualOrFailedUnranked.length})
            </h3>
          </div>
          <p className="text-xs text-slate-500">
            Files excluded from batch ranking because they could not be reliably extracted, failed
            quote verification, or exceeded platform limits.
          </p>

          <div className="space-y-2">
            {manualOrFailedUnranked.map((uf) => (
              <div
                key={uf.id}
                className="flex items-center justify-between rounded-lg border border-amber-200 bg-amber-50/50 p-3 text-xs"
              >
                <div className="space-y-0.5">
                  <span className="font-semibold text-slate-900">{uf.filename}</span>
                  <p className="text-amber-800">
                    {uf.statusMessage || uf.evaluation?.error_message || 'Flagged for recruiter manual review.'}
                  </p>
                </div>

                <div className="flex items-center space-x-2">
                  <span className="inline-flex items-center rounded bg-amber-100 px-2 py-0.5 font-medium text-amber-900 text-[10px]">
                    Unranked
                  </span>
                  {uf.evaluation && (
                    <button
                      type="button"
                      onClick={() => onSelectCandidate(uf.id)}
                      className="inline-flex items-center rounded bg-white px-2.5 py-1 text-xs font-medium text-slate-700 border border-slate-300 hover:bg-slate-50"
                    >
                      <Eye className="mr-1 h-3 w-3" />
                      Review
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

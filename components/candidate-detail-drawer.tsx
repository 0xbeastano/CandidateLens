'use client';

import React, { useEffect } from 'react';
import { X, Quote, HelpCircle, CheckCircle, AlertTriangle, MinusCircle, Shield } from 'lucide-react';
import { CandidateFile, RubricCriterion } from '@/lib/types';
import { TRANSPARENCY_NOTE } from '@/lib/config';

interface CandidateDetailDrawerProps {
  candidate: CandidateFile | null;
  rubricCriteria: RubricCriterion[];
  isOpen: boolean;
  onClose: () => void;
}

export function CandidateDetailDrawer({
  candidate,
  rubricCriteria,
  isOpen,
  onClose,
}: CandidateDetailDrawerProps) {
  // Handle escape key to close drawer
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !candidate) return null;

  const evaluation = candidate.evaluation;
  const criteriaMap = new Map<string, RubricCriterion>();
  rubricCriteria.forEach((rc) => criteriaMap.set(rc.id, rc));

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/50 backdrop-blur-xs flex justify-end">
      {/* Backdrop overlay click */}
      <div className="absolute inset-0" onClick={onClose} aria-hidden="true" />

      {/* Drawer content panel */}
      <aside
        className="relative z-10 flex h-full w-full max-w-2xl flex-col bg-white shadow-2xl overflow-y-auto"
        role="dialog"
        aria-modal="true"
        aria-labelledby="candidate-detail-title"
      >
        {/* Sticky Header */}
        <div className="sticky top-0 z-20 flex items-center justify-between border-b border-slate-200 bg-white/95 px-6 py-4 backdrop-blur-sm">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-mono font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                Candidate Detail
              </span>
              {evaluation?.evidence_score !== undefined && (
                <span className="text-xs font-bold text-slate-800 bg-slate-100 px-2.5 py-0.5 rounded-full">
                  Score: {evaluation.evidence_score} / 100
                </span>
              )}
            </div>
            <h2 id="candidate-detail-title" className="text-base font-bold text-slate-900 mt-1">
              {candidate.filename}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            aria-label="Close candidate details"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Drawer Body */}
        <div className="p-6 space-y-6 text-xs text-slate-700">
          {/* Transparency Disclaimer */}
          <div className="rounded-lg bg-indigo-50/70 p-3.5 border border-indigo-100 text-indigo-950 flex items-start space-x-2.5">
            <Shield className="h-4 w-4 text-indigo-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-semibold">{TRANSPARENCY_NOTE}</p>
              <p className="text-[11px] text-indigo-900 leading-relaxed">
                CandidateLens provides evidence extraction assistance only. No automated accept or
                reject decision is made or implied. All evaluation outcomes require human recruiter validation.
              </p>
            </div>
          </div>

          {/* Factual Summary */}
          {evaluation?.summary && (
            <div className="space-y-2">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Factual Evidence Summary
              </h3>
              <p className="rounded-lg bg-slate-50 p-3.5 text-xs text-slate-700 leading-relaxed border border-slate-200">
                {evaluation.summary}
              </p>
            </div>
          )}

          {/* Criteria Evidence Evaluation Breakdown */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Rubric Criteria Evidence Breakdown
            </h3>

            {evaluation?.criteria && evaluation.criteria.length > 0 ? (
              <div className="space-y-4">
                {evaluation.criteria.map((ec) => {
                  const rubricMeta = criteriaMap.get(ec.criterion_id);
                  const label = rubricMeta?.label || ec.criterion_id;
                  const weight = rubricMeta?.weight ?? 0;

                  return (
                    <div
                      key={ec.criterion_id}
                      className="rounded-lg border border-slate-200 bg-white p-4 space-y-3 shadow-xs"
                    >
                      {/* Criterion Header */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="font-mono text-[10px] font-semibold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">
                            {ec.criterion_id}
                          </span>
                          <span className="font-semibold text-slate-900">{label}</span>
                          <span className="text-[11px] text-slate-500">({weight}% weight)</span>
                        </div>

                        {/* Evidence Level Badge */}
                        {ec.evidence_level === 'clear' && (
                          <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700 border border-emerald-200">
                            <CheckCircle className="mr-1 h-3 w-3 text-emerald-600" />
                            Clear Evidence (1.0x)
                          </span>
                        )}
                        {ec.evidence_level === 'limited' && (
                          <span className="inline-flex items-center rounded-full bg-amber-50 px-2.5 py-0.5 text-[11px] font-semibold text-amber-800 border border-amber-200">
                            <AlertTriangle className="mr-1 h-3 w-3 text-amber-600" />
                            Limited Evidence (0.5x)
                          </span>
                        )}
                        {ec.evidence_level === 'none' && (
                          <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-semibold text-slate-600 border border-slate-200">
                            <MinusCircle className="mr-1 h-3 w-3 text-slate-500" />
                            No Evidence (0.0x)
                          </span>
                        )}
                      </div>

                      {/* Supporting Quotations */}
                      {ec.quotes && ec.quotes.length > 0 ? (
                        <div className="space-y-1.5">
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                            Documented Resume Quotation(s) [Verified Exact Match]:
                          </span>
                          {ec.quotes.map((q, qIdx) => (
                            <div
                              key={qIdx}
                              className="rounded bg-indigo-50/40 p-2 text-[11px] text-indigo-950 italic border-l-2 border-indigo-500 flex items-start space-x-1.5"
                            >
                              <Quote className="h-3 w-3 text-indigo-400 shrink-0 mt-0.5" />
                              <span className="leading-relaxed">&ldquo;{q}&rdquo;</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-[11px] text-slate-500 italic bg-slate-50 p-2 rounded">
                          No direct supporting quotations found in resume.
                        </p>
                      )}

                      {/* Model Explanation */}
                      {ec.explanation && (
                        <div className="pt-1 text-[11px] text-slate-600 leading-relaxed">
                          <strong className="text-slate-700">Analysis:</strong> {ec.explanation}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-slate-500 italic">No evaluated criteria available.</p>
            )}
          </div>

          {/* Missing Information Section */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Relevant Missing Information
            </h3>
            {evaluation?.missing_information && evaluation.missing_information.length > 0 ? (
              <ul className="list-disc pl-5 space-y-1 rounded-lg bg-amber-50/40 p-3.5 border border-amber-200 text-xs text-amber-900">
                {evaluation.missing_information.map((item, idx) => (
                  <li key={idx} className="leading-relaxed">
                    {item}
                  </li>
                ))}
              </ul>
            ) : (
              <div className="rounded-lg bg-slate-50 p-3 text-xs text-slate-500 border border-slate-200">
                No notable gaps or missing requirements flagged for this candidate.
              </div>
            )}
          </div>

          {/* Suggested Interview Questions */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Suggested Job-Relevant Interview Questions
            </h3>
            {evaluation?.interview_questions && evaluation.interview_questions.length > 0 ? (
              <div className="space-y-2">
                {evaluation.interview_questions.map((iq, idx) => (
                  <div
                    key={idx}
                    className="rounded-lg bg-slate-50 p-3 text-xs text-slate-800 border border-slate-200 flex items-start space-x-2"
                  >
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-600 text-[10px] font-bold text-white shrink-0 mt-0.5">
                      Q{idx + 1}
                    </span>
                    <p className="leading-relaxed">{iq}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500 italic">No interview questions generated.</p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 border-t border-slate-200 bg-slate-50 px-6 py-3 flex items-center justify-between text-xs text-slate-500">
          <span>CandidateLens Interview Prototype</span>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md bg-white border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100"
          >
            Close Drawer
          </button>
        </div>
      </aside>
    </div>
  );
}

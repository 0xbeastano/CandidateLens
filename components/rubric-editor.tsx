'use client';

import React, { useState } from 'react';
import { Sliders, CheckCircle2, AlertTriangle, Lock, Unlock, AlertCircle } from 'lucide-react';
import { RubricCriterion } from '@/lib/types';
import { CONFIG } from '@/lib/config';

interface RubricEditorProps {
  criteria: RubricCriterion[];
  onCriteriaChange: (updated: RubricCriterion[]) => void;
  isConfirmed: boolean;
  onConfirm: () => void;
  onUnlock: () => void;
  isEvaluating: boolean;
  hasEvaluations: boolean;
}

export function RubricEditor({
  criteria,
  onCriteriaChange,
  isConfirmed,
  onConfirm,
  onUnlock,
  isEvaluating,
  hasEvaluations,
}: RubricEditorProps) {
  const [showInvalidateWarning, setShowInvalidateWarning] = useState(false);

  if (!criteria || criteria.length === 0) {
    return null;
  }

  const totalWeight = criteria.reduce((sum, c) => sum + (Number.isFinite(c.weight) ? c.weight : 0), 0);
  const isWeightValid = totalWeight === CONFIG.TARGET_TOTAL_WEIGHT;
  const hasZeroOrNegative = criteria.some((c) => !c.weight || c.weight <= 0);
  const canConfirm = isWeightValid && !hasZeroOrNegative && criteria.length >= CONFIG.MIN_CRITERIA_COUNT;

  const handleUpdateCriterion = (index: number, field: keyof RubricCriterion, val: string | number) => {
    const updated = [...criteria];
    if (field === 'weight') {
      const parsed = parseInt(String(val), 10);
      updated[index] = { ...updated[index], weight: isNaN(parsed) ? 0 : parsed };
    } else {
      updated[index] = { ...updated[index], [field]: val };
    }
    onCriteriaChange(updated);
  };

  const handleUnlockClick = () => {
    if (hasEvaluations) {
      setShowInvalidateWarning(true);
    } else {
      onUnlock();
    }
  };

  const handleConfirmUnlock = () => {
    setShowInvalidateWarning(false);
    onUnlock();
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-slate-100 gap-2">
        <div className="flex items-center space-x-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
            <Sliders className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              Evaluation Rubric ({criteria.length} Criteria)
            </h2>
            <p className="text-xs text-slate-500">
              Review, adjust wording, and calibrate integer weights. Recruiter confirmation is mandatory.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-1.5 text-xs">
            <span className="text-slate-500">Total Weight:</span>
            <span
              className={`font-semibold px-2 py-0.5 rounded-full ${
                isWeightValid && !hasZeroOrNegative
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-rose-50 text-rose-700 border border-rose-200'
              }`}
            >
              {totalWeight} / {CONFIG.TARGET_TOTAL_WEIGHT}
            </span>
          </div>

          {isConfirmed ? (
            <button
              type="button"
              onClick={handleUnlockClick}
              disabled={isEvaluating}
              className="inline-flex items-center rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              <Unlock className="mr-1.5 h-3.5 w-3.5 text-slate-500" />
              Edit Criteria
            </button>
          ) : (
            <button
              type="button"
              onClick={onConfirm}
              disabled={!canConfirm || isEvaluating}
              className="inline-flex items-center rounded-md bg-indigo-600 px-3.5 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-slate-300 disabled:cursor-not-allowed"
            >
              <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
              Confirm Rubric
            </button>
          )}
        </div>
      </div>

      {/* Warning when weights do not equal 100 or has zero/negative */}
      {!isWeightValid && (
        <div className="mt-4 rounded-lg bg-rose-50 p-3 text-xs text-rose-800 border border-rose-100 flex items-start space-x-2">
          <AlertCircle className="h-4 w-4 text-rose-600 mt-0.5 shrink-0" />
          <div>
            <span className="font-semibold">Weights must sum to exactly 100.</span> Currently{' '}
            {totalWeight}. Please adjust individual criterion weights before confirming.
          </div>
        </div>
      )}

      {hasZeroOrNegative && (
        <div className="mt-2 rounded-lg bg-amber-50 p-3 text-xs text-amber-800 border border-amber-100 flex items-start space-x-2">
          <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
          <div>
            <span className="font-semibold">Positive weights required.</span> Each criterion must have
            a weight greater than zero.
          </div>
        </div>
      )}

      {/* Invalidate Warning Modal / Alert */}
      {showInvalidateWarning && (
        <div className="mt-4 rounded-lg bg-amber-50 p-4 border border-amber-200">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-amber-900">
                Editing the rubric invalidates previous evaluations
              </h4>
              <p className="text-xs text-amber-800">
                You currently have completed or in-progress candidate evaluations. Modifying criteria or
                weights invalidates these results to maintain strict comparability across the batch.
                Candidates will need to be re-evaluated against the new rubric.
              </p>
              <div className="flex items-center space-x-2 pt-1">
                <button
                  type="button"
                  onClick={handleConfirmUnlock}
                  className="rounded bg-amber-700 px-3 py-1 text-xs font-medium text-white hover:bg-amber-800"
                >
                  Proceed & Invalidate Evaluations
                </button>
                <button
                  type="button"
                  onClick={() => setShowInvalidateWarning(false)}
                  className="rounded border border-amber-300 bg-white px-3 py-1 text-xs font-medium text-amber-900 hover:bg-amber-100"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Criteria Cards */}
      <div className="mt-4 space-y-3">
        {criteria.map((c, index) => (
          <div
            key={c.id}
            className={`rounded-lg border p-4 transition-colors ${
              isConfirmed
                ? 'border-slate-200 bg-slate-50/50'
                : 'border-slate-200 bg-white hover:border-slate-300'
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
              <div className="flex-1 space-y-2">
                <div className="flex items-center space-x-2">
                  <span className="inline-flex items-center rounded bg-slate-200 px-1.5 py-0.5 text-xs font-mono font-medium text-slate-800">
                    {c.id}
                  </span>
                  {isConfirmed ? (
                    <span className="text-sm font-medium text-slate-900">{c.label}</span>
                  ) : (
                    <input
                      type="text"
                      value={c.label}
                      onChange={(e) => handleUpdateCriterion(index, 'label', e.target.value)}
                      placeholder="Criterion title..."
                      disabled={isConfirmed || isEvaluating}
                      className="w-full max-w-md rounded-md border border-slate-300 px-2.5 py-1 text-sm font-medium text-slate-900 focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600"
                    />
                  )}
                </div>

                {isConfirmed ? (
                  <p className="text-xs text-slate-600 leading-relaxed pl-7">{c.description}</p>
                ) : (
                  <div className="pl-7">
                    <textarea
                      rows={2}
                      value={c.description}
                      onChange={(e) => handleUpdateCriterion(index, 'description', e.target.value)}
                      placeholder="Specific evidence requirement description..."
                      disabled={isConfirmed || isEvaluating}
                      className="w-full rounded-md border border-slate-300 px-2.5 py-1 text-xs text-slate-700 focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600"
                    />
                  </div>
                )}
              </div>

              {/* Weight Input / Display */}
              <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center pl-7 sm:pl-0 pt-2 sm:pt-0">
                <label className="text-xs font-medium text-slate-500 sm:mb-1">Weight (%)</label>
                {isConfirmed ? (
                  <span className="inline-flex items-center rounded-md bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700 border border-indigo-100">
                    <Lock className="mr-1 h-3 w-3 text-indigo-500" />
                    {c.weight}%
                  </span>
                ) : (
                  <div className="flex items-center space-x-1">
                    <input
                      type="number"
                      min={1}
                      max={100}
                      value={c.weight}
                      onChange={(e) => handleUpdateCriterion(index, 'weight', e.target.value)}
                      disabled={isConfirmed || isEvaluating}
                      className="w-16 rounded-md border border-slate-300 px-2 py-1 text-center text-sm font-semibold text-slate-900 focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600"
                    />
                    <span className="text-xs text-slate-500">%</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

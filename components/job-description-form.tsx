'use client';

import React from 'react';
import { Briefcase, Sparkles, AlertCircle, RefreshCw } from 'lucide-react';
import { CONFIG } from '@/lib/config';

interface JobDescriptionFormProps {
  roleTitle: string;
  onRoleTitleChange: (title: string) => void;
  jobDescription: string;
  onJobDescriptionChange: (jd: string) => void;
  onPrepareCriteria: () => void;
  isLoading: boolean;
  isRubricConfirmed: boolean;
  isEvaluating: boolean;
}

export function JobDescriptionForm({
  roleTitle,
  onRoleTitleChange,
  jobDescription,
  onJobDescriptionChange,
  onPrepareCriteria,
  isLoading,
  isRubricConfirmed,
  isEvaluating,
}: JobDescriptionFormProps) {
  const charCount = jobDescription.length;
  const isTooShort = charCount > 0 && charCount < CONFIG.MIN_JD_CHARS;
  const isTooLong = charCount > CONFIG.MAX_JD_CHARS;
  const isValidLength = charCount >= CONFIG.MIN_JD_CHARS && charCount <= CONFIG.MAX_JD_CHARS;

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between pb-4 border-b border-slate-100">
        <div className="flex items-center space-x-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
            <Briefcase className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-slate-900">Stage 1: Job Description</h2>
            <p className="text-xs text-slate-500">
              Paste the role description to derive transparent, candidate-facing evaluation criteria.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
              isValidLength
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'bg-slate-100 text-slate-600'
            }`}
          >
            {charCount.toLocaleString()} / {CONFIG.MAX_JD_CHARS.toLocaleString()} chars
          </span>
        </div>
      </div>

      <div className="mt-4 space-y-4">
        <div>
          <label htmlFor="role-title" className="block text-xs font-medium text-slate-700">
            Role Title (Optional)
          </label>
          <input
            id="role-title"
            type="text"
            value={roleTitle}
            onChange={(e) => onRoleTitleChange(e.target.value)}
            disabled={isRubricConfirmed || isEvaluating || isLoading}
            placeholder="e.g. Senior Full-Stack Engineer"
            className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600 disabled:bg-slate-50 disabled:text-slate-500"
          />
        </div>

        <div>
          <div className="flex items-center justify-between">
            <label htmlFor="job-description" className="block text-xs font-medium text-slate-700">
              Job Description Content <span className="text-rose-500">*</span>
            </label>
            {isTooShort && (
              <span className="flex items-center text-xs text-amber-600">
                <AlertCircle className="mr-1 h-3.5 w-3.5" />
                Minimum {CONFIG.MIN_JD_CHARS} characters required ({CONFIG.MIN_JD_CHARS - charCount} more needed)
              </span>
            )}
            {isTooLong && (
              <span className="flex items-center text-xs text-rose-600">
                <AlertCircle className="mr-1 h-3.5 w-3.5" />
                Exceeds maximum limit of {CONFIG.MAX_JD_CHARS.toLocaleString()} characters
              </span>
            )}
          </div>
          <textarea
            id="job-description"
            rows={7}
            value={jobDescription}
            onChange={(e) => onJobDescriptionChange(e.target.value)}
            disabled={isRubricConfirmed || isEvaluating || isLoading}
            placeholder="Paste complete job description requirements and responsibilities here..."
            className={`mt-1 block w-full rounded-lg border px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 disabled:bg-slate-50 disabled:text-slate-500 ${
              isTooLong || isTooShort
                ? 'border-amber-300 focus:border-amber-500 focus:ring-amber-500'
                : 'border-slate-300 focus:border-indigo-600 focus:ring-indigo-600'
            }`}
          />
        </div>

        <div className="flex items-center justify-between pt-1">
          <p className="text-xs text-slate-500">
            Treated as untrusted source text. Prompt instructions inside JD will be ignored.
          </p>

          <button
            type="button"
            onClick={onPrepareCriteria}
            disabled={!isValidLength || isLoading || isRubricConfirmed || isEvaluating}
            className="inline-flex items-center rounded-lg bg-indigo-600 px-4 py-2 text-xs font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? (
              <>
                <RefreshCw className="mr-2 h-3.5 w-3.5 animate-spin" />
                Generating Criteria...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-3.5 w-3.5" />
                Prepare Criteria
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

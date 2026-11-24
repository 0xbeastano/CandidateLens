'use client';

import React, { useState, useMemo } from 'react';
import { Sparkles, RotateCcw, KeyRound, ShieldAlert, FileText, CheckCircle2 } from 'lucide-react';
import { CandidateFile, Rubric, RubricCriterion } from '@/lib/types';
import { CONFIG, DISCLAIMER_TEXT } from '@/lib/config';
import {
  DEMO_JOB_DESCRIPTION,
  DEMO_JOB_TITLE,
  DEMO_MOCK_RUBRIC,
  SYNTHETIC_FIXTURES,
} from '@/lib/fixtures';
import { rankCandidates } from '@/lib/ranking';
import { JobDescriptionForm } from './job-description-form';
import { RubricEditor } from './rubric-editor';
import { ResumeUpload } from './resume-upload';
import { ProcessingStatus } from './processing-status';
import { ResultsTable } from './results-table';
import { CandidateDetailDrawer } from './candidate-detail-drawer';
import { DemoAccessForm } from './demo-access-form';

export function ScreeningApp() {
  // Session & Prototype Access State (Memory Only)
  const [accessCode, setAccessCode] = useState<string>('candidate-lens-demo-2025');
  const [isAccessModalOpen, setIsAccessModalOpen] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState(false);

  // Stage 1: Role & Rubric State
  const [roleTitle, setRoleTitle] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [isGeneratingRubric, setIsGeneratingRubric] = useState(false);
  const [rubric, setRubric] = useState<Rubric | null>(null);
  const [isRubricConfirmed, setIsRubricConfirmed] = useState(false);
  const [rubricError, setRubricError] = useState<string | null>(null);

  // Stage 2: Candidates State
  const [candidates, setCandidates] = useState<CandidateFile[]>([]);

  // Stage 3: Evaluation & Processing State
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evaluatingIndex, setEvaluatingIndex] = useState(0);
  const [totalToEvaluate, setTotalToEvaluate] = useState(0);
  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null);

  // Compute Ranking dynamically using pure domain logic
  const { ranked, isProvisional, unranked } = useMemo(() => {
    return rankCandidates(candidates);
  }, [candidates]);

  const hasEvaluations = candidates.some((c) => c.status === 'complete');

  // Find candidate selected for detail drawer
  const selectedCandidate = useMemo(() => {
    return candidates.find((c) => c.id === selectedCandidateId) || null;
  }, [candidates, selectedCandidateId]);

  // Stage 1: Generate Rubric (Live or Demo)
  const handlePrepareCriteria = async () => {
    setRubricError(null);
    setIsGeneratingRubric(true);

    if (isDemoMode) {
      // In demo mode, use pre-calibrated rubric fixture
      setTimeout(() => {
        setRubric(DEMO_MOCK_RUBRIC);
        setIsRubricConfirmed(false);
        setIsGeneratingRubric(false);
      }, 500);
      return;
    }

    try {
      const response = await fetch('/api/rubric', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-demo-access-code': accessCode,
        },
        body: JSON.stringify({ job_description: jobDescription }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error?.message || `Failed to generate criteria (${response.status})`);
      }

      setRubric({
        rubric_id: data.rubric_id,
        criteria: data.criteria,
      });
      setIsRubricConfirmed(false);
    } catch (err: any) {
      setRubricError(err?.message || 'Error communicating with criteria generation API.');
    } finally {
      setIsGeneratingRubric(false);
    }
  };

  // Rubric Editing & Confirmation
  const handleCriteriaChange = (updated: RubricCriterion[]) => {
    if (rubric) {
      setRubric({ ...rubric, criteria: updated });
    }
  };

  const handleConfirmRubric = () => {
    setIsRubricConfirmed(true);
  };

  const handleUnlockRubric = () => {
    setIsRubricConfirmed(false);
    // If evaluations already existed, rule states:
    // "Editing the rubric afterward invalidates all previous evaluations and requires confirmation."
    if (hasEvaluations) {
      setCandidates((prev) =>
        prev.map((c) => {
          if (c.status === 'complete' || c.status === 'failed') {
            return {
              ...c,
              status: 'ready',
              statusMessage: undefined,
              evaluation: undefined,
            };
          }
          return c;
        })
      );
    }
  };

  // Stage 2: Candidate Management
  const handleAddCandidates = (newCandidates: CandidateFile[]) => {
    setCandidates((prev) => [...prev, ...newCandidates]);
  };

  const handleRemoveCandidate = (id: string) => {
    setCandidates((prev) => prev.filter((c) => c.id !== id));
    if (selectedCandidateId === id) {
      setSelectedCandidateId(null);
    }
  };

  // Stage 3: Sequential Candidate Evaluation
  const evaluateSingleCandidate = async (candidate: CandidateFile, activeRubric: Rubric) => {
    if (isDemoMode) {
      // Synthetic Demo mode: use mock fixture matching candidate filename or fallback
      await new Promise((resolve) => setTimeout(resolve, 800)); // Simulate brief realistic async step
      const fixture = SYNTHETIC_FIXTURES.find((f) => f.filename === candidate.filename);
      if (fixture?.mockEvaluation) {
        return fixture.mockEvaluation;
      }
      // If user uploaded a custom file in demo mode:
      return {
        candidate_id: candidate.id,
        status: 'manual_review' as const,
        error_message: 'Custom files in synthetic demo mode require live API mode with a valid GEMINI_API_KEY.',
      };
    }

    // Live API Mode:
    const response = await fetch('/api/evaluate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-demo-access-code': accessCode,
      },
      body: JSON.stringify({
        candidate_id: candidate.id,
        filename: candidate.filename,
        resume_text: candidate.extractedText,
        rubric: activeRubric,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        candidate_id: candidate.id,
        status: 'failed' as const,
        error_message: data?.error?.message || `Evaluation request failed with code ${response.status}`,
      };
    }

    return data;
  };

  const handleStartEvaluation = async () => {
    if (!rubric || !isRubricConfirmed || isEvaluating) return;

    const candidatesToProcess = candidates.filter((c) => c.status === 'ready');
    if (candidatesToProcess.length === 0) return;

    setIsEvaluating(true);
    setTotalToEvaluate(candidatesToProcess.length);

    for (let i = 0; i < candidatesToProcess.length; i++) {
      const candidate = candidatesToProcess[i];
      setEvaluatingIndex(i + 1);

      // Set candidate status to evaluating
      setCandidates((prev) =>
        prev.map((c) => (c.id === candidate.id ? { ...c, status: 'evaluating' } : c))
      );

      try {
        const result = await evaluateSingleCandidate(candidate, rubric);

        setCandidates((prev) =>
          prev.map((c) => {
            if (c.id !== candidate.id) return c;
            if (result.status === 'complete') {
              return {
                ...c,
                status: 'complete',
                evaluation: result,
                statusMessage: undefined,
              };
            } else if (result.status === 'manual_review') {
              return {
                ...c,
                status: 'manual_review',
                evaluation: result,
                statusMessage: result.error_message || 'Flagged for manual review.',
              };
            } else {
              return {
                ...c,
                status: 'failed',
                evaluation: result,
                statusMessage: result.error_message || 'Evaluation request failed.',
              };
            }
          })
        );
      } catch (err: any) {
        setCandidates((prev) =>
          prev.map((c) =>
            c.id === candidate.id
              ? {
                  ...c,
                  status: 'failed',
                  statusMessage: err?.message || 'Network error during evaluation.',
                }
              : c
          )
        );
      }
    }

    setIsEvaluating(false);
    setEvaluatingIndex(0);
    setTotalToEvaluate(0);
  };

  // Retry a failed candidate
  const handleRetryCandidate = async (candidateId: string) => {
    if (!rubric || !isRubricConfirmed || isEvaluating) return;

    const targetCandidate = candidates.find((c) => c.id === candidateId);
    if (!targetCandidate) return;

    setIsEvaluating(true);
    setEvaluatingIndex(1);
    setTotalToEvaluate(1);

    setCandidates((prev) =>
      prev.map((c) => (c.id === candidateId ? { ...c, status: 'evaluating' } : c))
    );

    try {
      const result = await evaluateSingleCandidate(targetCandidate, rubric);
      setCandidates((prev) =>
        prev.map((c) => {
          if (c.id !== candidateId) return c;
          if (result.status === 'complete') {
            return {
              ...c,
              status: 'complete',
              evaluation: result,
              statusMessage: undefined,
            };
          } else if (result.status === 'manual_review') {
            return {
              ...c,
              status: 'manual_review',
              evaluation: result,
              statusMessage: result.error_message,
            };
          } else {
            return {
              ...c,
              status: 'failed',
              evaluation: result,
              statusMessage: result.error_message,
            };
          }
        })
      );
    } catch (err: any) {
      setCandidates((prev) =>
        prev.map((c) =>
          c.id === candidateId
            ? { ...c, status: 'failed', statusMessage: err?.message || 'Retry failed.' }
            : c
        )
      );
    } finally {
      setIsEvaluating(false);
      setEvaluatingIndex(0);
      setTotalToEvaluate(0);
    }
  };

  // Load Synthetic Demo Fixtures
  const handleLoadSyntheticDemo = () => {
    setIsDemoMode(true);
    setRoleTitle(DEMO_JOB_TITLE);
    setJobDescription(DEMO_JOB_DESCRIPTION);
    setRubric(DEMO_MOCK_RUBRIC);
    setIsRubricConfirmed(true);

    // Map synthetic fixtures into candidate files
    const demoCandidates: CandidateFile[] = SYNTHETIC_FIXTURES.map((fixture) => ({
      id: fixture.id,
      filename: fixture.filename,
      fileSize: fixture.fileSize,
      lastModified: fixture.lastModified,
      extractedText: fixture.extractedText,
      pageCount: fixture.pageCount,
      status: fixture.isInvalid ? 'manual_review' : 'ready',
      statusMessage: fixture.isInvalid
        ? 'Insufficient readable text extracted (heuristic threshold not met). Document appears to be a scanned image or empty PDF.'
        : undefined,
    }));

    setCandidates(demoCandidates);
    setSelectedCandidateId(null);
  };

  // Clear Session
  const handleClearSession = () => {
    if (confirm('Clear current review session? All in-memory text and evaluations will be reset.')) {
      setRoleTitle('');
      setJobDescription('');
      setRubric(null);
      setIsRubricConfirmed(false);
      setCandidates([]);
      setIsDemoMode(false);
      setSelectedCandidateId(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-16 font-sans">
      {/* Permanent Header */}
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur-sm shadow-xs">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            {/* Brand Logo & Subtitle */}
            <div className="flex items-center space-x-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-xs">
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h1 className="text-base font-bold text-slate-900">CandidateLens</h1>
                  <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
                    Interview prototype
                  </span>
                  {isDemoMode && (
                    <span className="rounded-md bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-800 border border-amber-200">
                      Synthetic Demo
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500">
                  Evidence-based resume comparison & transparent rubric alignment
                </p>
              </div>
            </div>

            {/* Header Action Controls */}
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={handleLoadSyntheticDemo}
                disabled={isEvaluating}
                className="inline-flex items-center rounded-lg border border-indigo-200 bg-indigo-50/70 px-3 py-1.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 transition-colors"
                title="Loads 3 sample candidates + 1 error fixture without API calls"
              >
                <Sparkles className="mr-1.5 h-3.5 w-3.5 text-indigo-600" />
                Load Synthetic Demo
              </button>

              <button
                type="button"
                onClick={() => setIsAccessModalOpen(true)}
                className="inline-flex items-center rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                title="View or modify in-memory access code"
              >
                <KeyRound className="mr-1.5 h-3.5 w-3.5 text-slate-500" />
                Access Code
              </button>

              <button
                type="button"
                onClick={handleClearSession}
                disabled={isEvaluating}
                className="inline-flex items-center rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                title="Clear current session and reset in-memory data"
              >
                <RotateCcw className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Permanent Compliance Notice Banner */}
        <div className="border-t border-slate-100 bg-slate-100/60 px-4 py-1.5 text-center text-[11px] text-slate-600">
          <p>{DISCLAIMER_TEXT}</p>
        </div>
      </header>

      {/* Main Container */}
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mt-6 space-y-6">
        {/* Error notification banner if rubric generation failed */}
        {rubricError && (
          <div className="rounded-lg bg-rose-50 p-4 border border-rose-200 flex items-start space-x-3 text-xs text-rose-800">
            <ShieldAlert className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Criteria Generation Failed</p>
              <p className="mt-0.5">{rubricError}</p>
            </div>
          </div>
        )}

        {/* Stage 1: Job Description Form */}
        <JobDescriptionForm
          roleTitle={roleTitle}
          onRoleTitleChange={setRoleTitle}
          jobDescription={jobDescription}
          onJobDescriptionChange={setJobDescription}
          onPrepareCriteria={handlePrepareCriteria}
          isLoading={isGeneratingRubric}
          isRubricConfirmed={isRubricConfirmed}
          isEvaluating={isEvaluating}
        />

        {/* Rubric Review & Calibration */}
        {rubric && (
          <RubricEditor
            criteria={rubric.criteria}
            onCriteriaChange={handleCriteriaChange}
            isConfirmed={isRubricConfirmed}
            onConfirm={handleConfirmRubric}
            onUnlock={handleUnlockRubric}
            isEvaluating={isEvaluating}
            hasEvaluations={hasEvaluations}
          />
        )}

        {/* Stage 2: Resume Upload & Local PDF Extraction */}
        <ResumeUpload
          candidateFiles={candidates}
          onAddCandidates={handleAddCandidates}
          onRemoveCandidate={handleRemoveCandidate}
          isEvaluating={isEvaluating}
        />

        {/* Stage 3: Candidate Processing Controller */}
        {candidates.length > 0 && (
          <ProcessingStatus
            candidates={candidates}
            isEvaluating={isEvaluating}
            isRubricConfirmed={isRubricConfirmed}
            onStartEvaluation={handleStartEvaluation}
            onRetryCandidate={handleRetryCandidate}
            evaluatingIndex={evaluatingIndex}
            totalToEvaluate={totalToEvaluate}
            isDemoMode={isDemoMode}
          />
        )}

        {/* Results & Ranked Comparison Table */}
        <ResultsTable
          rankedCandidates={ranked}
          isProvisional={isProvisional}
          unrankedCandidates={unranked}
          onSelectCandidate={setSelectedCandidateId}
          isEvaluating={isEvaluating}
          isDemoMode={isDemoMode}
        />
      </main>

      {/* Candidate Detail Drawer */}
      <CandidateDetailDrawer
        candidate={selectedCandidate}
        rubricCriteria={rubric?.criteria || []}
        isOpen={Boolean(selectedCandidateId)}
        onClose={() => setSelectedCandidateId(null)}
      />

      {/* Demo Access Code Modal */}
      <DemoAccessForm
        accessCode={accessCode}
        onSaveAccessCode={setAccessCode}
        isOpen={isAccessModalOpen}
        onClose={() => setIsAccessModalOpen(false)}
        isConfigured={Boolean(accessCode)}
      />
    </div>
  );
}

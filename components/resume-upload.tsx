'use client';

import React, { useRef, useState } from 'react';
import { Upload, FileText, Trash2, ChevronDown, ChevronRight, AlertCircle, CheckCircle, HelpCircle } from 'lucide-react';
import { CandidateFile } from '@/lib/types';
import { CONFIG } from '@/lib/config';
import { extractTextFromPdf } from '@/lib/pdf';

interface ResumeUploadProps {
  candidateFiles: CandidateFile[];
  onAddCandidates: (newCandidates: CandidateFile[]) => void;
  onRemoveCandidate: (id: string) => void;
  isEvaluating: boolean;
  onOpenApiKeyModal?: () => void;
}

export function ResumeUpload({
  candidateFiles,
  onAddCandidates,
  onRemoveCandidate,
  isEvaluating,
  onOpenApiKeyModal,
}: ResumeUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [expandedPreviewId, setExpandedPreviewId] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const availableSlots = CONFIG.MAX_RESUMES - candidateFiles.length;

  const processSelectedFiles = async (files: FileList | File[]) => {
    setUploadError(null);
    const fileArray = Array.from(files);

    if (fileArray.length === 0) return;

    if (candidateFiles.length + fileArray.length > CONFIG.MAX_RESUMES) {
      setUploadError(
        `Batch limit exceeded. You can evaluate a maximum of ${CONFIG.MAX_RESUMES} resumes per batch. (Currently ${candidateFiles.length} uploaded).`
      );
      return;
    }

    const newCandidates: CandidateFile[] = [];

    for (const file of fileArray) {
      // 1. Check duplicate selection using filename + size + lastModified
      const isDuplicate = candidateFiles.some(
        (c) =>
          c.filename === file.name &&
          c.fileSize === file.size &&
          c.lastModified === file.lastModified
      ) || newCandidates.some(
        (c) =>
          c.filename === file.name &&
          c.fileSize === file.size &&
          c.lastModified === file.lastModified
      );

      if (isDuplicate) {
        setUploadError(`Duplicate file "${file.name}" was skipped.`);
        continue;
      }

      // 2. Generate candidate_id in code using crypto.randomUUID()
      const candidateId = typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : 'cand-' + Math.random().toString(36).substring(2, 11);

      // Create initial candidate record in extracting status
      const candidateRecord: CandidateFile = {
        id: candidateId,
        file,
        filename: file.name,
        fileSize: file.size,
        lastModified: file.lastModified,
        extractedText: '',
        pageCount: 0,
        status: 'extracting',
      };

      // Perform client-side PDF extraction
      try {
        const extraction = await extractTextFromPdf(file);
        if (extraction.success) {
          candidateRecord.extractedText = extraction.text;
          candidateRecord.pageCount = extraction.pageCount;
          candidateRecord.status = 'ready';
        } else {
          candidateRecord.extractedText = extraction.text || '';
          candidateRecord.pageCount = extraction.pageCount;
          candidateRecord.status = extraction.isManualReview ? 'manual_review' : 'failed';
          candidateRecord.statusMessage = extraction.errorMessage || 'Failed to extract readable text.';
        }
      } catch (err: any) {
        candidateRecord.status = 'manual_review';
        candidateRecord.statusMessage = err?.message || 'Unreadable PDF document.';
      }

      newCandidates.push(candidateRecord);
    }

    if (newCandidates.length > 0) {
      onAddCandidates(newCandidates);
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (isEvaluating) return;
    if (e.dataTransfer.files) {
      await processSelectedFiles(e.dataTransfer.files);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between pb-4 border-b border-slate-100">
        <div className="flex items-center space-x-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
            <Upload className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              Stage 2: Candidate Resumes ({candidateFiles.length} / {CONFIG.MAX_RESUMES})
            </h2>
            <p className="text-xs text-slate-500">
              Upload up to 5 text-based PDF resumes (max 2 MB and 10 pages each).
            </p>
          </div>
        </div>

        <span className="text-xs text-slate-500">
          {availableSlots > 0 ? `${availableSlots} slots remaining` : 'Batch full'}
        </span>
      </div>

      {uploadError && (
        <div className="mt-4 rounded-lg bg-rose-50 p-3 text-xs text-rose-800 border border-rose-200 flex items-start space-x-2">
          <AlertCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
          <span>{uploadError}</span>
        </div>
      )}

      {/* Drag & Drop Upload Zone */}
      {candidateFiles.length < CONFIG.MAX_RESUMES && (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragOver(true);
          }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={handleDrop}
          onClick={() => !isEvaluating && fileInputRef.current?.click()}
          className={`mt-4 flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 text-center transition-colors cursor-pointer ${
            isDragOver
              ? 'border-indigo-500 bg-indigo-50/50'
              : 'border-slate-300 hover:border-indigo-400 bg-slate-50/30'
          } ${isEvaluating ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf,.pdf"
            multiple
            disabled={isEvaluating}
            onChange={(e) => e.target.files && processSelectedFiles(e.target.files)}
            className="hidden"
          />
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-50 text-indigo-600 mb-2">
            <Upload className="h-5 w-5" />
          </div>
          <p className="text-sm font-medium text-slate-700">
            Click to upload or drag & drop PDF files
          </p>
          <p className="text-xs text-slate-500 mt-1">
            Text-based PDFs only • Max 2 MB and 10 pages per file • Up to 5 candidates per batch
          </p>
        </div>
      )}

      {/* Heuristic Notice */}
      <div className="mt-3 flex items-start space-x-1.5 text-[11px] text-slate-500">
        <HelpCircle className="h-3.5 w-3.5 text-slate-400 shrink-0 mt-0.5" />
        <span>
          <strong className="text-slate-600">Text Sufficiency Heuristic:</strong> Files with fewer than{' '}
          {CONFIG.MIN_READABLE_TEXT_CHARS} extractable characters are marked for manual review. This is
          an empirical heuristic to catch scanned/empty PDFs, not an OCR replacement.
        </span>
      </div>

      {/* Candidate List */}
      {candidateFiles.length > 0 && (
        <div className="mt-4 space-y-2">
          {candidateFiles.map((c) => {
            const isExpanded = expandedPreviewId === c.id;
            const hasText = c.extractedText && c.extractedText.length > 0;

            return (
              <div
                key={c.id}
                className="rounded-lg border border-slate-200 bg-white p-3 shadow-xs hover:border-slate-300 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3 min-w-0">
                    <FileText className="h-5 w-5 text-indigo-500 shrink-0" />
                    <div className="min-w-0">
                      <div className="flex items-center space-x-2">
                        {/* Filename identity rule */}
                        <p className="text-xs font-semibold text-slate-900 truncate">
                          {c.filename}
                        </p>
                        {c.pageCount > 0 && (
                          <span className="text-[10px] text-slate-400">
                            ({c.pageCount} {c.pageCount === 1 ? 'page' : 'pages'})
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500">
                        {formatFileSize(c.fileSize)} • ID:{' '}
                        <span className="font-mono text-[10px] text-slate-400">
                          {c.id.substring(0, 8)}...
                        </span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    {/* Status Badge */}
                    {c.status === 'extracting' && (
                      <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-700">
                        Extracting...
                      </span>
                    )}
                    {c.status === 'ready' && (
                      <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-medium text-blue-700 border border-blue-200">
                        <CheckCircle className="mr-1 h-3 w-3 text-blue-600" />
                        Ready
                      </span>
                    )}
                    {c.status === 'evaluating' && (
                      <span className="inline-flex items-center rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-medium text-indigo-700 animate-pulse border border-indigo-200">
                        Evaluating...
                      </span>
                    )}
                    {c.status === 'complete' && (
                      <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700 border border-emerald-200">
                        Complete
                      </span>
                    )}
                    {c.status === 'manual_review' && (
                      <span className="inline-flex items-center rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-800 border border-amber-200">
                        Manual Review
                      </span>
                    )}
                    {c.status === 'failed' && (
                      <span className="inline-flex items-center rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-medium text-rose-700 border border-rose-200">
                        Failed
                      </span>
                    )}

                    {/* Preview Toggle */}
                    {hasText && (
                      <button
                        type="button"
                        onClick={() => setExpandedPreviewId(isExpanded ? null : c.id)}
                        className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                        title={isExpanded ? 'Hide extracted text' : 'View extracted text'}
                      >
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </button>
                    )}

                    {/* Remove button */}
                    <button
                      type="button"
                      onClick={() => onRemoveCandidate(c.id)}
                      disabled={isEvaluating}
                      className="rounded p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600 focus:outline-none focus:ring-1 focus:ring-rose-500 disabled:opacity-30"
                      title="Remove candidate"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Specific Error Message if manual_review or failed */}
                {c.statusMessage && (
                  <div className="mt-2 text-[11px] text-amber-800 bg-amber-50 p-2.5 rounded border border-amber-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div className="flex items-start space-x-1.5">
                      <AlertCircle className="h-3.5 w-3.5 text-amber-600 shrink-0 mt-0.5" />
                      <span>{c.statusMessage}</span>
                    </div>
                    {onOpenApiKeyModal &&
                      (c.statusMessage.toLowerCase().includes('api key') ||
                        c.statusMessage.toLowerCase().includes('leaked') ||
                        c.statusMessage.toLowerCase().includes('authentication')) && (
                        <button
                          type="button"
                          onClick={onOpenApiKeyModal}
                          className="shrink-0 rounded bg-amber-600 hover:bg-amber-700 text-white font-semibold px-2.5 py-1 text-[11px]"
                        >
                          Paste New API Key
                        </button>
                      )}
                  </div>
                )}

                {/* Collapsed Extracted Text Preview */}
                {isExpanded && hasText && (
                  <div className="mt-3 border-t border-slate-100 pt-3">
                    <div className="flex items-center justify-between pb-1">
                      <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                        Extracted Text Preview ({c.extractedText.length.toLocaleString()} chars)
                      </span>
                    </div>
                    <pre className="max-h-40 overflow-y-auto rounded bg-slate-50 p-2.5 text-[11px] text-slate-700 font-mono whitespace-pre-wrap leading-relaxed border border-slate-200">
                      {c.extractedText}
                    </pre>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

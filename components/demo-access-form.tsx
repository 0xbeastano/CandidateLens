'use client';

import React, { useState } from 'react';
import { KeyRound, ShieldAlert, X, Check } from 'lucide-react';

interface DemoAccessFormProps {
  accessCode: string;
  onSaveAccessCode: (code: string) => void;
  isOpen: boolean;
  onClose: () => void;
  isConfigured: boolean;
}

export function DemoAccessForm({
  accessCode,
  onSaveAccessCode,
  isOpen,
  onClose,
  isConfigured,
}: DemoAccessFormProps) {
  const [inputVal, setInputVal] = useState(accessCode);
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveAccessCode(inputVal.trim());
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div
        className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl border border-slate-200"
        role="dialog"
        aria-modal="true"
        aria-labelledby="access-dialog-title"
      >
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center space-x-2">
            <KeyRound className="h-5 w-5 text-indigo-600" />
            <h3 id="access-dialog-title" className="text-lg font-semibold text-slate-900">
              Prototype Access Code
            </h3>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            aria-label="Close dialog"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-4 space-y-3 text-sm text-slate-600">
          <div className="rounded-lg bg-indigo-50/60 p-3 text-indigo-900 text-xs border border-indigo-100 flex items-start space-x-2">
            <ShieldAlert className="h-4 w-4 text-indigo-600 mt-0.5 shrink-0" />
            <div>
              <span className="font-semibold">Prototype Protection:</span> This code is verified
              server-side on every live Gemini API request to protect model quotas. It is held in browser
              memory only, never persisted in cookies, URLs, or local storage.
            </div>
          </div>

          <p className="text-xs text-slate-500">
            For local evaluation or demonstrations, this must match the server{"'"}s{' '}
            <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-800">DEMO_ACCESS_CODE</code>{' '}
            environment variable.
          </p>

          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            <div>
              <label htmlFor="access-code-input" className="block text-xs font-medium text-slate-700">
                Access Code
              </label>
              <input
                id="access-code-input"
                type="password"
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                placeholder="Enter access code..."
                className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600 font-mono"
                autoFocus
              />
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="inline-flex items-center rounded-md bg-indigo-600 px-4 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1"
              >
                {savedSuccess ? (
                  <>
                    <Check className="mr-1.5 h-3.5 w-3.5" />
                    Updated
                  </>
                ) : (
                  'Set in Memory'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

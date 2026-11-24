'use client';

import React, { useState } from 'react';
import { Key, ExternalLink, X, Check, ShieldAlert, Eye, EyeOff } from 'lucide-react';

interface GeminiApiKeyModalProps {
  apiKey: string;
  onSaveApiKey: (key: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

export function GeminiApiKeyModal({
  apiKey,
  onSaveApiKey,
  isOpen,
  onClose,
}: GeminiApiKeyModalProps) {
  const [inputVal, setInputVal] = useState(apiKey);
  const [showKey, setShowKey] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveApiKey(inputVal.trim());
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div
        className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl border border-slate-200"
        role="dialog"
        aria-modal="true"
        aria-labelledby="gemini-key-title"
      >
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center space-x-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
              <Key className="h-4 w-4" />
            </div>
            <h3 id="gemini-key-title" className="text-base font-bold text-slate-900">
              Set Gemini API Key
            </h3>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-4 space-y-4 text-xs text-slate-600">
          <div className="rounded-lg bg-amber-50 p-3 text-amber-900 border border-amber-200 flex items-start space-x-2">
            <ShieldAlert className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
            <div>
              <strong>Security Notice:</strong> Google automatically revokes API keys if they are posted publicly. Paste your private key here to keep it secure in browser memory.
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="gemini-key-input" className="block text-xs font-semibold text-slate-700">
                Google Gemini API Key
              </label>
              <div className="relative mt-1">
                <input
                  id="gemini-key-input"
                  type={showKey ? 'text' : 'password'}
                  value={inputVal}
                  onChange={(e) => setInputVal(e.target.value)}
                  placeholder="AIzaSy..."
                  className="block w-full rounded-lg border border-slate-300 pr-10 pl-3 py-2 text-xs font-mono text-slate-900 placeholder-slate-400 focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600"
                >
                  {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
              <span>Don{"'"}t have a key?</span>
              <a
                href="https://aistudio.google.com/apikey"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center font-semibold text-indigo-600 hover:text-indigo-700 hover:underline"
              >
                Get key from Google AI Studio
                <ExternalLink className="ml-1 h-3 w-3" />
              </a>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-slate-300 bg-white px-3.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!inputVal.trim()}
                className="inline-flex items-center rounded-lg bg-indigo-600 px-4 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700 disabled:opacity-40"
              >
                {savedSuccess ? (
                  <>
                    <Check className="mr-1.5 h-3.5 w-3.5" />
                    Saved!
                  </>
                ) : (
                  'Save & Apply'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

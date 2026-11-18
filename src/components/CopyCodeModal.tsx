import React, { useEffect, useMemo, useState } from 'react';
import { Check, Copy, X } from 'lucide-react';
import {
  generateJavaScriptSnippet,
  generatePythonSnippet,
} from '../utils/codeSnippets';

interface CopyCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  model: string;
  systemInstruction: string;
  userPrompt: string;
  temperature: number;
  topP: number;
  maxOutputTokens: number;
}

export const CopyCodeModal: React.FC<CopyCodeModalProps> = ({
  isOpen,
  onClose,
  model,
  systemInstruction,
  userPrompt,
  temperature,
  topP,
  maxOutputTokens,
}) => {
  const [lang, setLang] = useState<'javascript' | 'python'>('javascript');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  const code = useMemo(() => {
    const params = {
      model,
      systemInstruction,
      userPrompt,
      temperature,
      topP,
      maxOutputTokens,
    };
    return lang === 'javascript'
      ? generateJavaScriptSnippet(params)
      : generatePythonSnippet(params);
  }, [lang, model, systemInstruction, userPrompt, temperature, topP, maxOutputTokens]);

  if (!isOpen) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // Ignore clipboard failures
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-4 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="copy-code-modal-title"
      onClick={onClose}
    >
      <div
        className="flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-4 border-b border-slate-200 px-5 py-4 dark:border-slate-800">
          <div>
            <h2
              id="copy-code-modal-title"
              className="font-display text-base font-semibold text-slate-900 dark:text-white"
            >
              Export Gemini SDK Code
            </h2>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              Ready-to-run snippet using your active system prompt and sampling settings.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close code modal"
            className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-slate-50 px-5 py-2.5 dark:border-slate-800 dark:bg-slate-950/60">
          <div
            role="tablist"
            aria-label="SDK Language"
            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white p-1 dark:border-slate-800 dark:bg-slate-900"
          >
            <button
              type="button"
              role="tab"
              aria-selected={lang === 'javascript'}
              onClick={() => setLang('javascript')}
              className={`rounded-md px-3 py-1 text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                lang === 'javascript'
                  ? 'bg-slate-900 text-white dark:bg-sky-500 dark:text-slate-950 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white'
              }`}
            >
              JavaScript (@google/genai)
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={lang === 'python'}
              onClick={() => setLang('python')}
              className={`rounded-md px-3 py-1 text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                lang === 'python'
                  ? 'bg-slate-900 text-white dark:bg-sky-500 dark:text-slate-950 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white'
              }`}
            >
              Python (google-genai)
            </button>
          </div>

          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-slate-800 dark:bg-sky-500 dark:text-slate-950 dark:hover:bg-sky-400 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Copied Snippet</span>
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Copy Snippet</span>
              </>
            )}
          </button>
        </div>

        <div className="overflow-auto bg-slate-950 p-5">
          <pre className="font-mono text-xs leading-relaxed text-slate-100 whitespace-pre">
            <code>{code}</code>
          </pre>
        </div>
      </div>
    </div>
  );
};

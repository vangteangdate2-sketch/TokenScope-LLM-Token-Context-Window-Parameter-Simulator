import React, { useMemo, useState } from 'react';
import { Trash2 } from 'lucide-react';
import type { TokenSegment } from '../types/simulator';
import { countTextStats, tokenizeText } from '../utils/tokenizer';

interface PromptPlaygroundProps {
  systemInstruction: string;
  userPrompt: string;
  onChangeSystem: (value: string) => void;
  onChangePrompt: (value: string) => void;
}

const TOKEN_PALETTE = [
  'bg-sky-500/20 text-sky-900 border-sky-500/30 dark:bg-sky-500/20 dark:text-sky-200 dark:border-sky-400/30',
  'bg-emerald-500/20 text-emerald-900 border-emerald-500/30 dark:bg-emerald-500/20 dark:text-emerald-200 dark:border-emerald-400/30',
  'bg-amber-500/20 text-amber-900 border-amber-500/30 dark:bg-amber-500/20 dark:text-amber-200 dark:border-amber-400/30',
  'bg-indigo-500/20 text-indigo-900 border-indigo-500/30 dark:bg-indigo-500/20 dark:text-indigo-200 dark:border-indigo-400/30',
  'bg-rose-500/20 text-rose-900 border-rose-500/30 dark:bg-rose-500/20 dark:text-rose-200 dark:border-rose-400/30',
  'bg-teal-500/20 text-teal-900 border-teal-500/30 dark:bg-teal-500/20 dark:text-teal-200 dark:border-teal-400/30',
];

const KIND_LABELS: Record<TokenSegment['kind'], string> = {
  word: 'Word root',
  subword: 'Sub-word suffix/chunk',
  number: 'Numeric chunk',
  punctuation: 'Punctuation / symbol',
  whitespace: 'Whitespace / newline',
};

export const PromptPlayground: React.FC<PromptPlaygroundProps> = ({
  systemInstruction,
  userPrompt,
  onChangeSystem,
  onChangePrompt,
}) => {
  const [inspectSource, setInspectSource] = useState<'combined' | 'system' | 'prompt'>('combined');
  const [showWhitespace, setShowWhitespace] = useState(true);
  const [hoveredToken, setHoveredToken] = useState<TokenSegment | null>(null);

  const systemStats = useMemo(() => countTextStats(systemInstruction), [systemInstruction]);
  const promptStats = useMemo(() => countTextStats(userPrompt), [userPrompt]);

  const systemTokens = useMemo(() => tokenizeText(systemInstruction), [systemInstruction]);
  const promptTokens = useMemo(() => tokenizeText(userPrompt), [userPrompt]);

  const inspectedTokens = useMemo(() => {
    if (inspectSource === 'system') return systemTokens;
    if (inspectSource === 'prompt') return promptTokens;
    return [...systemTokens, ...promptTokens];
  }, [inspectSource, systemTokens, promptTokens]);

  const visibleTokens = useMemo(() => {
    if (showWhitespace) return inspectedTokens;
    return inspectedTokens.filter((t) => t.kind !== 'whitespace');
  }, [inspectedTokens, showWhitespace]);

  return (
    <div className="space-y-6">
      {/* Playground Editors */}
      <section
        id="playground"
        aria-label="Prompt and System Instruction Playground"
        className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6 dark:border-slate-800 dark:bg-slate-900/75"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="font-display text-lg font-semibold tracking-tight text-slate-900 dark:text-slate-50">
              Prompt & System Instruction Playground
            </h1>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              Live character, word, and estimated token counts (~1 token per 4 characters).
            </p>
          </div>
          <div className="text-xs font-mono tabular-nums text-slate-600 dark:text-slate-300">
            Combined:{' '}
            <span className="font-semibold text-slate-900 dark:text-white">
              {(systemStats.estimatedTokens + promptStats.estimatedTokens).toLocaleString()}
            </span>{' '}
            est. tokens
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-5">
          {/* System Instructions */}
          <div className="space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label
                htmlFor="system-instruction-input"
                className="text-xs font-semibold text-slate-800 dark:text-slate-200"
              >
                System Instructions
              </label>
              <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 font-mono tabular-nums">
                <span>{systemStats.chars.toLocaleString()} chars</span>
                <span aria-hidden="true">·</span>
                <span>{systemStats.words.toLocaleString()} words</span>
                <span aria-hidden="true">·</span>
                <span className="font-medium text-sky-600 dark:text-sky-400">
                  ~{systemStats.estimatedTokens.toLocaleString()} tokens
                </span>
                {systemInstruction.length > 0 && (
                  <button
                    type="button"
                    onClick={() => onChangeSystem('')}
                    aria-label="Clear system instructions"
                    className="ml-1 inline-flex items-center text-slate-400 hover:text-rose-500 transition-colors cursor-pointer"
                  >
                    <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                )}
              </div>
            </div>
            <textarea
              id="system-instruction-input"
              rows={4}
              value={systemInstruction}
              onChange={(e) => onChangeSystem(e.target.value)}
              placeholder="Define persona, output format constraints, or domain rules..."
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2.5 font-mono text-xs sm:text-[13px] leading-relaxed text-slate-900 placeholder:text-slate-400 focus:border-sky-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/20 dark:border-slate-700/80 dark:bg-slate-950/70 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-sky-500 dark:focus:bg-slate-950 transition-colors resize-y"
            />
          </div>

          {/* User Prompt */}
          <div className="space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label
                htmlFor="user-prompt-input"
                className="text-xs font-semibold text-slate-800 dark:text-slate-200"
              >
                User Prompt
              </label>
              <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 font-mono tabular-nums">
                <span>{promptStats.chars.toLocaleString()} chars</span>
                <span aria-hidden="true">·</span>
                <span>{promptStats.words.toLocaleString()} words</span>
                <span aria-hidden="true">·</span>
                <span className="font-medium text-emerald-600 dark:text-emerald-400">
                  ~{promptStats.estimatedTokens.toLocaleString()} tokens
                </span>
                {userPrompt.length > 0 && (
                  <button
                    type="button"
                    onClick={() => onChangePrompt('')}
                    aria-label="Clear user prompt"
                    className="ml-1 inline-flex items-center text-slate-400 hover:text-rose-500 transition-colors cursor-pointer"
                  >
                    <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                )}
              </div>
            </div>
            <textarea
              id="user-prompt-input"
              rows={7}
              value={userPrompt}
              onChange={(e) => onChangePrompt(e.target.value)}
              placeholder="Enter the prompt, code snippet, or document payload to analyze and run..."
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2.5 font-mono text-xs sm:text-[13px] leading-relaxed text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-700/80 dark:bg-slate-950/70 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-emerald-500 dark:focus:bg-slate-950 transition-colors resize-y"
            />
          </div>
        </div>
      </section>

      {/* Color-Coded Sub-Word Token Block Inspector */}
      <section
        id="token-map"
        aria-label="Sub-Word Token Inspector"
        className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6 dark:border-slate-800 dark:bg-slate-900/75"
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-display text-sm font-semibold text-slate-900 dark:text-slate-100">
              Sub-Word Token Map
            </h2>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              Color-coded chunks showing how text splits into BPE-style sub-word tokens. Hover any block to inspect its token ID.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div
              role="group"
              aria-label="Token inspector source"
              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 p-1 dark:border-slate-800 dark:bg-slate-950"
            >
              {(
                [
                  { id: 'combined', label: 'Combined' },
                  { id: 'system', label: 'System' },
                  { id: 'prompt', label: 'Prompt' },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setInspectSource(tab.id)}
                  className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    inspectSource === tab.id
                      ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-800 dark:text-white'
                      : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setShowWhitespace((w) => !w)}
              aria-pressed={showWhitespace}
              className={`rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                showWhitespace
                  ? 'border-sky-500/40 bg-sky-500/10 text-sky-700 dark:text-sky-300'
                  : 'border-slate-200 bg-white text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400'
              }`}
            >
              Show spaces
            </button>
          </div>
        </div>

        {/* Token Blocks Canvas */}
        <div className="mt-4 max-h-60 overflow-y-auto rounded-lg border border-slate-200 bg-slate-50 p-3.5 dark:border-slate-800 dark:bg-slate-950/80">
          {visibleTokens.length === 0 ? (
            <p className="py-6 text-center text-xs text-slate-500 dark:text-slate-400">
              Type in System Instructions or User Prompt above to inspect sub-word token boundaries.
            </p>
          ) : (
            <div className="flex flex-wrap gap-1 font-mono text-xs leading-6">
              {visibleTokens.slice(0, 450).map((seg, idx) => (
                <span
                  key={`${seg.id}-${idx}`}
                  onMouseEnter={() => setHoveredToken(seg)}
                  onMouseLeave={() => setHoveredToken(null)}
                  className={`inline-flex items-center rounded-sm border px-1.5 py-0.5 transition-transform duration-100 hover:scale-105 cursor-default ${
                    seg.kind === 'whitespace'
                      ? 'border-slate-300/60 bg-slate-200/60 text-slate-500 dark:border-slate-700 dark:bg-slate-800/70 dark:text-slate-400'
                      : TOKEN_PALETTE[seg.colorIndex]
                  }`}
                >
                  {seg.displayText}
                </span>
              ))}
              {visibleTokens.length > 450 && (
                <span className="px-2 py-0.5 text-xs text-slate-500 dark:text-slate-400">
                  + {(visibleTokens.length - 450).toLocaleString()} more tokens
                </span>
              )}
            </div>
          )}
        </div>

        {/* Footer Readout */}
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
          <div className="font-mono tabular-nums">
            Sub-word segments:{' '}
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              {inspectedTokens.length.toLocaleString()}
            </span>
          </div>
          <div className="font-mono tabular-nums min-h-[1.25rem]">
            {hoveredToken ? (
              <span>
                Token <span className="text-slate-900 dark:text-white font-semibold">"{hoveredToken.displayText}"</span> · ID #{hoveredToken.tokenId} · {KIND_LABELS[hoveredToken.kind]}
              </span>
            ) : (
              <span>Hover a token block to inspect ID and type</span>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

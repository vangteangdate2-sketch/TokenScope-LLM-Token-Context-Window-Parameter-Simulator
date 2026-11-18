import React, { useState } from 'react';
import {
  AlertCircle,
  Check,
  Clock,
  Copy,
  Play,
  RotateCcw,
  Trash2,
  WifiOff,
} from 'lucide-react';
import type { ModelPreset, QueuedRun, RunMetrics } from '../types/simulator';
import { estimateCostPer1k, estimateSimulatedLatencyMs } from '../utils/tokenizer';

interface LiveRunnerPanelProps {
  activeModel: ModelPreset;
  estimatedInputTokens: number;
  maxOutputTokens: number;
  isOnline: boolean;
  isRunning: boolean;
  error: string | null;
  currentRun: RunMetrics | null;
  history: RunMetrics[];
  queuedRuns: QueuedRun[];
  onRunPrompt: () => void;
  onRestoreRun: (run: RunMetrics) => void;
  onClearHistory: () => void;
  onRemoveQueued: (id: string) => void;
}

export const LiveRunnerPanel: React.FC<LiveRunnerPanelProps> = ({
  activeModel,
  estimatedInputTokens,
  maxOutputTokens,
  isOnline,
  isRunning,
  error,
  currentRun,
  history,
  queuedRuns,
  onRunPrompt,
  onRestoreRun,
  onClearHistory,
  onRemoveQueued,
}) => {
  const [copiedOutput, setCopiedOutput] = useState(false);

  // Pre-run projection if no completed run is active yet
  const projectedOutputTokens = Math.min(maxOutputTokens, 256);
  const projectedCost = estimateCostPer1k(
    estimatedInputTokens,
    projectedOutputTokens,
    activeModel
  );
  const projectedLatency = estimateSimulatedLatencyMs(
    estimatedInputTokens,
    projectedOutputTokens,
    activeModel.apiModel
  );

  const displayInput = currentRun ? currentRun.inputTokens : estimatedInputTokens;
  const displayOutput = currentRun ? currentRun.outputTokens : projectedOutputTokens;
  const displayLatency = currentRun ? currentRun.latencyMs : projectedLatency;
  const displayCost1k = currentRun
    ? currentRun.costPer1kRequests
    : projectedCost.costPer1kRequests;

  const handleCopyOutput = async () => {
    if (!currentRun?.outputText) return;
    try {
      await navigator.clipboard.writeText(currentRun.outputText);
      setCopiedOutput(true);
      setTimeout(() => setCopiedOutput(false), 1800);
    } catch {
      // Ignore clipboard failures
    }
  };

  return (
    <div className="space-y-6">
      {/* Execution & Live Output Card */}
      <section
        aria-label="Live Gemini API Execution and Metrics"
        className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6 dark:border-slate-800 dark:bg-slate-900/75"
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-display text-base font-semibold text-slate-900 dark:text-slate-50">
              Live Gemini Execution & Cost Estimator
            </h2>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              Executes against <span className="font-mono text-slate-700 dark:text-slate-200">{activeModel.apiModel}</span> with your active System Instructions, Temperature, Top-P, and Max Output Tokens.
            </p>
          </div>

          <button
            type="button"
            disabled={isRunning}
            onClick={onRunPrompt}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-sky-500 px-5 py-2.5 text-sm font-semibold text-slate-950 hover:bg-sky-400 disabled:opacity-60 transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900"
          >
            {isRunning ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-950 border-t-transparent" />
                <span>Generating...</span>
              </>
            ) : !isOnline ? (
              <>
                <WifiOff className="h-4 w-4" aria-hidden="true" />
                <span>Queue Offline Run</span>
              </>
            ) : (
              <>
                <Play className="h-4 w-4 fill-current" aria-hidden="true" />
                <span>Run Prompt</span>
              </>
            )}
          </button>
        </div>

        {/* 4-Column Real-Time Metrics Strip */}
        <div className="mt-5 grid grid-cols-2 gap-4 border-y border-slate-200 py-4 dark:border-slate-800 lg:grid-cols-4">
          <div>
            <div className="text-xs text-slate-500 dark:text-slate-400">
              {currentRun ? 'Input Tokens (API)' : 'Est. Input Tokens'}
            </div>
            <div className="mt-1 font-mono text-lg font-semibold tabular-nums text-slate-900 dark:text-slate-50">
              {displayInput.toLocaleString()}
            </div>
          </div>

          <div>
            <div className="text-xs text-slate-500 dark:text-slate-400">
              {currentRun ? 'Output Tokens (API)' : 'Projected Output'}
            </div>
            <div className="mt-1 font-mono text-lg font-semibold tabular-nums text-slate-900 dark:text-slate-50">
              {displayOutput.toLocaleString()}
            </div>
          </div>

          <div>
            <div className="text-xs text-slate-500 dark:text-slate-400">
              {currentRun ? 'Actual / Sim Latency' : 'Simulated Latency'}
            </div>
            <div className="mt-1 font-mono text-lg font-semibold tabular-nums text-slate-900 dark:text-slate-50">
              {displayLatency.toLocaleString()} ms
              {currentRun && (
                <span className="ml-1.5 text-xs font-normal text-slate-500 dark:text-slate-400">
                  (sim {currentRun.simulatedLatencyMs} ms)
                </span>
              )}
            </div>
          </div>

          <div>
            <div className="text-xs text-slate-500 dark:text-slate-400">
              Est. Cost / 1K Requests
            </div>
            <div className="mt-1 font-mono text-lg font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
              ${displayCost1k < 0.01 ? displayCost1k.toFixed(4) : displayCost1k.toFixed(2)}
            </div>
          </div>
        </div>

        {/* Queued Offline Runs Banner (inside console if any exist) */}
        {queuedRuns.length > 0 && (
          <div className="mt-4 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-800 dark:text-amber-200">
            <div className="flex items-center justify-between gap-2 font-semibold">
              <span className="inline-flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Offline Sync Queue ({queuedRuns.length})</span>
              </span>
              <span className="font-normal">Runs automatically upon reconnect</span>
            </div>
            <ul className="mt-2 space-y-1.5">
              {queuedRuns.map((q) => (
                <li
                  key={q.id}
                  className="flex items-center justify-between gap-3 rounded-md bg-white/60 px-2.5 py-1.5 dark:bg-slate-900/60"
                >
                  <span className="truncate font-mono text-[11px]">
                    {q.model} · {q.prompt.slice(0, 72)}
                    {q.prompt.length > 72 ? '...' : ''}
                  </span>
                  <button
                    type="button"
                    onClick={() => onRemoveQueued(q.id)}
                    className="text-xs font-medium text-rose-600 hover:underline dark:text-rose-400 shrink-0 cursor-pointer"
                  >
                    Cancel
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div
            role="alert"
            className="mt-4 flex items-start gap-2.5 rounded-lg border border-rose-500/30 bg-rose-500/10 p-3.5 text-xs text-rose-800 dark:text-rose-200"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600 dark:text-rose-400" aria-hidden="true" />
            <div>
              <p className="font-semibold">Execution Error</p>
              <p className="mt-0.5 leading-relaxed">{error}</p>
            </div>
          </div>
        )}

        {/* Response Output Console */}
        <div className="mt-4">
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                Model Output
              </span>
              {currentRun && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="font-mono">Finish: {currentRun.finishReason}</span>
                  {currentRun.syncedFromOffline && (
                    <>
                      <span aria-hidden="true">·</span>
                      <span className="text-sky-600 dark:text-sky-400">Synced from offline queue</span>
                    </>
                  )}
                </>
              )}
            </div>

            {currentRun?.outputText && (
              <button
                type="button"
                onClick={handleCopyOutput}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors cursor-pointer"
              >
                {copiedOutput ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-500" aria-hidden="true" />
                    <span>Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>Copy Output</span>
                  </>
                )}
              </button>
            )}
          </div>

          <div className="min-h-[160px] max-h-[380px] overflow-y-auto rounded-lg border border-slate-200 bg-slate-50 p-4 font-mono text-xs sm:text-[13px] leading-relaxed text-slate-800 whitespace-pre-wrap dark:border-slate-800 dark:bg-slate-950/85 dark:text-slate-200">
            {isRunning ? (
              <div className="space-y-2.5 animate-pulse">
                <div className="h-3.5 w-3/4 rounded bg-slate-200 dark:bg-slate-800" />
                <div className="h-3.5 w-5/6 rounded bg-slate-200 dark:bg-slate-800" />
                <div className="h-3.5 w-2/3 rounded bg-slate-200 dark:bg-slate-800" />
              </div>
            ) : currentRun ? (
              currentRun.outputText || '(Model returned an empty response.)'
            ) : (
              <span className="text-slate-500 dark:text-slate-400">
                Click "Run Prompt" to execute your prompt against Gemini and inspect real token usage, latency, and cost metrics.
              </span>
            )}
          </div>
        </div>
      </section>

      {/* Run History Table */}
      <section
        id="history"
        aria-label="Run History"
        className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6 dark:border-slate-800 dark:bg-slate-900/75"
      >
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="font-display text-sm font-semibold text-slate-900 dark:text-slate-100">
              Execution History
            </h2>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              Stored locally in your browser for offline review and parameter comparison.
            </p>
          </div>
          {history.length > 0 && (
            <button
              type="button"
              onClick={onClearHistory}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 transition-colors cursor-pointer"
            >
              <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Clear</span>
            </button>
          )}
        </div>

        {history.length === 0 ? (
          <div className="mt-4 rounded-lg border border-dashed border-slate-200 py-8 text-center dark:border-slate-800">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              No runs recorded yet. Execute a prompt above to compare token consumption and cost across parameter configurations.
            </p>
          </div>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[600px] border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 dark:border-slate-800 dark:text-slate-400">
                  <th className="py-2.5 pr-4 font-medium">Time</th>
                  <th className="py-2.5 pr-4 font-medium">Model & Params</th>
                  <th className="py-2.5 pr-4 text-right font-medium">In / Out</th>
                  <th className="py-2.5 pr-4 text-right font-medium">Latency</th>
                  <th className="py-2.5 pr-4 text-right font-medium">Cost / 1K</th>
                  <th className="py-2.5 text-right font-medium">Restore</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/70">
                {history.map((run) => (
                  <tr
                    key={run.id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="py-2.5 pr-4 font-mono tabular-nums text-slate-500 dark:text-slate-400 whitespace-nowrap">
                      {new Date(run.timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })}
                    </td>
                    <td className="py-2.5 pr-4">
                      <div className="font-medium text-slate-800 dark:text-slate-200 truncate max-w-[240px]">
                        {run.promptSnippet}
                      </div>
                      <div className="font-mono text-[11px] text-slate-500 dark:text-slate-400">
                        {run.model} · T={run.temperature.toFixed(2)} · P={run.topP.toFixed(2)}
                      </div>
                    </td>
                    <td className="py-2.5 pr-4 text-right font-mono tabular-nums text-slate-700 dark:text-slate-300 whitespace-nowrap">
                      {run.inputTokens.toLocaleString()} / {run.outputTokens.toLocaleString()}
                    </td>
                    <td className="py-2.5 pr-4 text-right font-mono tabular-nums text-slate-700 dark:text-slate-300 whitespace-nowrap">
                      {run.latencyMs} ms
                    </td>
                    <td className="py-2.5 pr-4 text-right font-mono tabular-nums font-medium text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                      ${run.costPer1kRequests < 0.01
                        ? run.costPer1kRequests.toFixed(4)
                        : run.costPer1kRequests.toFixed(2)}
                    </td>
                    <td className="py-2.5 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => onRestoreRun(run)}
                        className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                      >
                        <RotateCcw className="h-3 w-3" aria-hidden="true" />
                        <span>Load</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
};

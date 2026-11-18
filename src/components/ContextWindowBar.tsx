import React from 'react';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';

interface ContextWindowBarProps {
  modelLabel: string;
  systemTokens: number;
  promptTokens: number;
  maxOutputTokens: number;
  contextLimit: number;
}

export const ContextWindowBar: React.FC<ContextWindowBarProps> = ({
  modelLabel,
  systemTokens,
  promptTokens,
  maxOutputTokens,
  contextLimit,
}) => {
  const totalInput = systemTokens + promptTokens;
  const totalAllocated = totalInput + maxOutputTokens;
  const safeLimit = Math.max(1, contextLimit);

  const systemPct = Math.min(100, (systemTokens / safeLimit) * 100);
  const promptPct = Math.min(100 - systemPct, (promptTokens / safeLimit) * 100);
  const outputPct = Math.min(
    100 - systemPct - promptPct,
    (maxOutputTokens / safeLimit) * 100
  );

  const totalUtilizationPct = (totalAllocated / safeLimit) * 100;
  const isOverflow = totalAllocated > safeLimit;
  const isNearLimit = !isOverflow && totalUtilizationPct >= 80;
  const remainingTokens = Math.max(0, safeLimit - totalAllocated);

  return (
    <section
      aria-label="Context Window Allocation"
      className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900/75"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-display text-sm font-semibold text-slate-900 dark:text-slate-100">
            Context Window Budget
          </h2>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
            {modelLabel} · Limit{' '}
            <span className="font-mono tabular-nums text-slate-700 dark:text-slate-200">
              {safeLimit.toLocaleString()}
            </span>{' '}
            tokens
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-4 text-xs">
          <div className="font-mono tabular-nums text-slate-700 dark:text-slate-200">
            <span className="font-semibold">{totalAllocated.toLocaleString()}</span>
            <span className="text-slate-400 dark:text-slate-500">
              {' '}
              / {safeLimit.toLocaleString()}
            </span>{' '}
            <span className="text-slate-500 dark:text-slate-400">
              ({totalUtilizationPct < 0.01 && totalAllocated > 0 ? '<0.01' : totalUtilizationPct.toFixed(2)}%)
            </span>
          </div>

          {isOverflow ? (
            <span className="inline-flex items-center gap-1.5 font-medium text-rose-600 dark:text-rose-400">
              <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Exceeds window by {(totalAllocated - safeLimit).toLocaleString()} tokens</span>
            </span>
          ) : isNearLimit ? (
            <span className="inline-flex items-center gap-1.5 font-medium text-amber-600 dark:text-amber-400">
              <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" />
              <span>High utilization · {remainingTokens.toLocaleString()} remaining</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 font-medium text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Nominal · {remainingTokens.toLocaleString()} tokens free</span>
            </span>
          )}
        </div>
      </div>

      {/* Stacked Context Bar */}
      <div
        className="mt-4 h-3.5 w-full overflow-hidden rounded-md bg-slate-100 dark:bg-slate-800/90 flex"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={safeLimit}
        aria-valuenow={Math.min(totalAllocated, safeLimit)}
        aria-label="Context window usage"
      >
        {systemPct > 0 && (
          <div
            style={{ width: `${Math.max(systemPct, 0.4)}%` }}
            className="h-full bg-sky-500 transition-all duration-200"
            title={`System Instructions: ${systemTokens.toLocaleString()} tokens`}
          />
        )}
        {promptPct > 0 && (
          <div
            style={{ width: `${Math.max(promptPct, 0.4)}%` }}
            className="h-full bg-emerald-500 transition-all duration-200"
            title={`User Prompt: ${promptTokens.toLocaleString()} tokens`}
          />
        )}
        {outputPct > 0 && (
          <div
            style={{ width: `${Math.max(outputPct, 0.4)}%` }}
            className={`h-full transition-all duration-200 ${
              isOverflow ? 'bg-rose-500' : 'bg-amber-500'
            }`}
            title={`Reserved Max Output: ${maxOutputTokens.toLocaleString()} tokens`}
          />
        )}
      </div>

      {/* Unboxed Legend with tabular figures */}
      <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-slate-600 dark:text-slate-300">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-xs bg-sky-500" aria-hidden="true" />
          <span>System:</span>
          <span className="font-mono tabular-nums font-medium text-slate-900 dark:text-slate-100">
            {systemTokens.toLocaleString()}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-xs bg-emerald-500" aria-hidden="true" />
          <span>User Prompt:</span>
          <span className="font-mono tabular-nums font-medium text-slate-900 dark:text-slate-100">
            {promptTokens.toLocaleString()}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`h-2.5 w-2.5 rounded-xs ${isOverflow ? 'bg-rose-500' : 'bg-amber-500'}`}
            aria-hidden="true"
          />
          <span>Reserved Output:</span>
          <span className="font-mono tabular-nums font-medium text-slate-900 dark:text-slate-100">
            {maxOutputTokens.toLocaleString()}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-xs bg-slate-200 dark:bg-slate-700" aria-hidden="true" />
          <span>Total Input:</span>
          <span className="font-mono tabular-nums font-medium text-slate-900 dark:text-slate-100">
            {totalInput.toLocaleString()}
          </span>
        </div>
      </div>
    </section>
  );
};

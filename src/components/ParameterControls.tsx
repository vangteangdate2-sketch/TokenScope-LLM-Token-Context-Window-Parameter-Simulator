import React from 'react';
import { RotateCcw } from 'lucide-react';

interface ParameterControlsProps {
  temperature: number;
  topP: number;
  maxOutputTokens: number;
  onChangeTemperature: (val: number) => void;
  onChangeTopP: (val: number) => void;
  onChangeMaxOutputTokens: (val: number) => void;
  onReset: () => void;
}

export const ParameterControls: React.FC<ParameterControlsProps> = ({
  temperature,
  topP,
  maxOutputTokens,
  onChangeTemperature,
  onChangeTopP,
  onChangeMaxOutputTokens,
  onReset,
}) => {
  const tempLabel =
    temperature <= 0.15
      ? 'Deterministic / Greedy'
      : temperature <= 0.75
      ? 'Balanced Precision'
      : temperature <= 1.25
      ? 'Creative Variance'
      : 'High Entropy / Exploratory';

  return (
    <section
      aria-label="Sampling Parameter Controls"
      className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6 dark:border-slate-800 dark:bg-slate-900/75"
    >
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-sm font-semibold text-slate-900 dark:text-slate-100">
            Sampling Parameters
          </h2>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
            Tune decoding randomness and output length budget.
          </p>
        </div>

        <button
          type="button"
          onClick={onReset}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
        >
          <RotateCcw className="h-3 w-3" aria-hidden="true" />
          <span>Reset</span>
        </button>
      </div>

      <div className="mt-5 space-y-5">
        {/* Temperature */}
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <label
              htmlFor="temperature-slider"
              className="text-xs font-semibold text-slate-800 dark:text-slate-200"
            >
              Temperature
            </label>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 dark:text-slate-400">{tempLabel}</span>
              <input
                type="number"
                aria-label="Temperature numeric input"
                min={0}
                max={2}
                step={0.05}
                value={temperature}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  if (!Number.isNaN(v)) onChangeTemperature(Math.min(2, Math.max(0, v)));
                }}
                className="w-16 rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-right font-mono text-xs tabular-nums text-slate-900 focus:border-sky-500 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              />
            </div>
          </div>
          <input
            id="temperature-slider"
            type="range"
            min={0}
            max={2}
            step={0.05}
            value={temperature}
            onChange={(e) => onChangeTemperature(Number(e.target.value))}
            className="sim-slider w-full bg-slate-200 dark:bg-slate-700"
          />
          <div className="flex justify-between font-mono text-[11px] text-slate-400 dark:text-slate-500">
            <span>0.0 (Greedy)</span>
            <span>1.0 (Default)</span>
            <span>2.0 (Flat)</span>
          </div>
        </div>

        {/* Top-P */}
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <label
              htmlFor="top-p-slider"
              className="text-xs font-semibold text-slate-800 dark:text-slate-200"
            >
              Top-P (Nucleus)
            </label>
            <input
              type="number"
              aria-label="Top-P numeric input"
              min={0}
              max={1}
              step={0.05}
              value={topP}
              onChange={(e) => {
                const v = Number(e.target.value);
                if (!Number.isNaN(v)) onChangeTopP(Math.min(1, Math.max(0, v)));
              }}
              className="w-16 rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-right font-mono text-xs tabular-nums text-slate-900 focus:border-sky-500 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
            />
          </div>
          <input
            id="top-p-slider"
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={topP}
            onChange={(e) => onChangeTopP(Number(e.target.value))}
            className="sim-slider w-full bg-slate-200 dark:bg-slate-700"
          />
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Considers only the smallest token set whose cumulative probability reaches{' '}
            <span className="font-mono tabular-nums text-slate-700 dark:text-slate-200">
              {(topP * 100).toFixed(0)}%
            </span>
            .
          </p>
        </div>

        {/* Max Output Tokens */}
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <label
              htmlFor="max-tokens-slider"
              className="text-xs font-semibold text-slate-800 dark:text-slate-200"
            >
              Max Output Tokens
            </label>
            <input
              type="number"
              aria-label="Max Output Tokens numeric input"
              min={64}
              max={8192}
              step={64}
              value={maxOutputTokens}
              onChange={(e) => {
                const v = Number(e.target.value);
                if (!Number.isNaN(v)) {
                  onChangeMaxOutputTokens(Math.min(8192, Math.max(64, Math.round(v))));
                }
              }}
              className="w-20 rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-right font-mono text-xs tabular-nums text-slate-900 focus:border-sky-500 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
            />
          </div>
          <input
            id="max-tokens-slider"
            type="range"
            min={64}
            max={8192}
            step={64}
            value={maxOutputTokens}
            onChange={(e) => onChangeMaxOutputTokens(Number(e.target.value))}
            className="sim-slider w-full bg-slate-200 dark:bg-slate-700"
          />
          <div className="flex justify-between font-mono text-[11px] text-slate-400 dark:text-slate-500">
            <span>64</span>
            <span>2,048</span>
            <span>4,096</span>
            <span>8,192</span>
          </div>
        </div>
      </div>
    </section>
  );
};

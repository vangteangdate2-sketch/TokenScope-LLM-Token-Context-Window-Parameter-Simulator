import React, { useMemo, useState } from 'react';
import { PROBABILITY_SCENARIOS } from '../data/presets';
import { computeTokenDistribution } from '../utils/tokenizer';

interface TokenProbabilityVisualizerProps {
  temperature: number;
  topP: number;
}

export const TokenProbabilityVisualizer: React.FC<TokenProbabilityVisualizerProps> = ({
  temperature,
  topP,
}) => {
  const [scenarioId, setScenarioId] = useState(PROBABILITY_SCENARIOS[0].id);

  const scenario = useMemo(
    () => PROBABILITY_SCENARIOS.find((s) => s.id === scenarioId) ?? PROBABILITY_SCENARIOS[0],
    [scenarioId]
  );

  const distribution = useMemo(
    () => computeTokenDistribution(scenario.candidates, temperature, topP),
    [scenario, temperature, topP]
  );

  const nucleusCount = distribution.filter((d) => d.inNucleus).length;

  return (
    <section
      id="distribution"
      aria-label="Token Probability Visualizer"
      className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6 dark:border-slate-800 dark:bg-slate-900/75"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="font-display text-sm font-semibold text-slate-900 dark:text-slate-100">
            Token Probability Visualizer
          </h2>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
            Live softmax redistribution across next-token candidates at{' '}
            <span className="font-mono tabular-nums text-slate-700 dark:text-slate-200">
              T={temperature.toFixed(2)}
            </span>{' '}
            and{' '}
            <span className="font-mono tabular-nums text-slate-700 dark:text-slate-200">
              Top-P={topP.toFixed(2)}
            </span>
            .
          </p>
        </div>

        <div
          role="group"
          aria-label="Probability scenario"
          className="inline-flex flex-wrap items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 p-1 dark:border-slate-800 dark:bg-slate-950"
        >
          {PROBABILITY_SCENARIOS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setScenarioId(item.id)}
              className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                item.id === scenario.id
                  ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-800 dark:text-white'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Prompt Prefix Preview */}
      <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2.5 font-mono text-xs text-slate-700 dark:border-slate-800 dark:bg-slate-950/70 dark:text-slate-300">
        <span className="text-slate-400 dark:text-slate-500 select-none">Prefix: </span>
        <span>{scenario.prefix}</span>
        <span className="ml-1 inline-block h-3.5 w-2 align-middle bg-sky-500/70" aria-hidden="true" />
      </div>

      {/* Horizontal Probability Bar Chart */}
      <div className="mt-4 space-y-2.5">
        {distribution.map((item) => {
          const pct = item.probability * 100;
          const barWidth = Math.max(pct, item.probability > 0 ? 1.2 : 0);
          return (
            <div
              key={item.token}
              className={`grid grid-cols-[110px_1fr_88px] sm:grid-cols-[132px_1fr_112px] items-center gap-3 text-xs transition-opacity duration-150 ${
                item.inNucleus ? 'opacity-100' : 'opacity-45'
              }`}
            >
              <div className="truncate font-mono font-medium text-slate-800 dark:text-slate-100" title={item.token}>
                <span className="rounded-sm bg-slate-100 px-1.5 py-0.5 dark:bg-slate-800">
                  {item.token.replace(/^ /, '·')}
                </span>
              </div>

              <div className="relative h-6 w-full overflow-hidden rounded-md bg-slate-100 dark:bg-slate-800/80">
                <div
                  style={{ width: `${barWidth}%` }}
                  className={`h-full transition-all duration-200 ${
                    item.inNucleus
                      ? 'bg-sky-500 dark:bg-sky-500'
                      : 'bg-slate-400 dark:bg-slate-600'
                  }`}
                />
                <span className="absolute inset-y-0 left-2 flex items-center text-[11px] font-medium text-slate-700 dark:text-slate-200 mix-blend-normal pointer-events-none">
                  {pct >= 18 ? item.category : ''}
                </span>
              </div>

              <div className="flex items-center justify-end gap-2 font-mono tabular-nums">
                <span className="font-semibold text-slate-900 dark:text-slate-100">
                  {pct.toFixed(1)}%
                </span>
                <span
                  className={`text-[10px] font-sans font-medium ${
                    item.inNucleus
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-slate-400 dark:text-slate-500'
                  }`}
                >
                  {item.inNucleus ? 'Keep' : 'Pruned'}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3 text-xs text-slate-500 dark:border-slate-800/80 dark:text-slate-400">
        <span>
          Active Nucleus Pool:{' '}
          <span className="font-mono tabular-nums font-semibold text-slate-800 dark:text-slate-200">
            {nucleusCount} / {distribution.length}
          </span>{' '}
          candidates
        </span>
        <span>
          {temperature <= 0.15
            ? 'Low temperature concentrates mass onto the highest-logit token.'
            : temperature >= 1.2
            ? 'High temperature flattens probabilities, elevating tail candidates.'
            : 'Balanced softmax preserves primary structure with controlled variation.'}
        </span>
      </div>
    </section>
  );
};

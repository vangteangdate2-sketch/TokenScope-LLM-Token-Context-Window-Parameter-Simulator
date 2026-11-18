import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ContextWindowBar } from './components/ContextWindowBar';
import { CopyCodeModal } from './components/CopyCodeModal';
import { LiveRunnerPanel } from './components/LiveRunnerPanel';
import { OfflineBanner } from './components/OfflineBanner';
import { ParameterControls } from './components/ParameterControls';
import { PromptPlayground } from './components/PromptPlayground';
import { TokenProbabilityVisualizer } from './components/TokenProbabilityVisualizer';
import { TopBar } from './components/TopBar';
import { WorkspaceToolbar } from './components/WorkspaceToolbar';
import { MODEL_PRESETS } from './data/presets';
import { useLocalWorkspace } from './hooks/useLocalWorkspace';
import { useOnlineStatus } from './hooks/useOnlineStatus';
import type { ExamplePreset, QueuedRun, RunMetrics } from './types/simulator';
import {
  countTextStats,
  estimateCostPer1k,
  estimateSimulatedLatencyMs,
} from './utils/tokenizer';

export default function App() {
  const {
    workspace,
    updateWorkspace,
    addRunToHistory,
    queueOfflineRun,
    removeQueuedRun,
    clearHistory,
  } = useLocalWorkspace();

  const isOnline = useOnlineStatus();

  const [isDark, setIsDark] = useState<boolean>(() => {
    if (typeof document === 'undefined') return true;
    return document.documentElement.classList.contains('dark');
  });

  const [isCodeModalOpen, setIsCodeModalOpen] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [isSyncingQueue, setIsSyncingQueue] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentRun, setCurrentRun] = useState<RunMetrics | null>(() => {
    return workspace.history[0] ?? null;
  });

  const syncingRef = useRef(false);

  const toggleTheme = useCallback(() => {
    setIsDark((prev) => {
      const next = !prev;
      document.documentElement.classList.toggle('dark', next);
      try {
        localStorage.setItem('tokenscope_theme', next ? 'dark' : 'light');
      } catch {
        // Ignore storage restrictions
      }
      return next;
    });
  }, []);

  const activeModelPreset = useMemo(() => {
    const found =
      MODEL_PRESETS.find((m) => m.id === workspace.modelPresetId) ?? MODEL_PRESETS[0];
    if (found.id === 'custom') {
      return {
        ...found,
        contextLimit: workspace.customContextLimit,
      };
    }
    return found;
  }, [workspace.modelPresetId, workspace.customContextLimit]);

  const systemStats = useMemo(
    () => countTextStats(workspace.systemInstruction),
    [workspace.systemInstruction]
  );
  const promptStats = useMemo(
    () => countTextStats(workspace.userPrompt),
    [workspace.userPrompt]
  );

  const totalEstimatedInputTokens =
    systemStats.estimatedTokens + promptStats.estimatedTokens;

  const executeApiRun = useCallback(
    async (payload: {
      model: 'gemini-2.5-flash' | 'gemini-2.5-pro';
      systemInstruction: string;
      prompt: string;
      temperature: number;
      topP: number;
      maxOutputTokens: number;
      syncedFromOffline?: boolean;
    }): Promise<RunMetrics> => {
      const res = await fetch('/api/gemini/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: payload.model,
          systemInstruction: payload.systemInstruction,
          prompt: payload.prompt,
          temperature: payload.temperature,
          topP: payload.topP,
          maxOutputTokens: payload.maxOutputTokens,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || `Request failed with status ${res.status}`);
      }

      const fallbackInputTokens =
        countTextStats(payload.systemInstruction).estimatedTokens +
        countTextStats(payload.prompt).estimatedTokens;
      const fallbackOutputTokens = countTextStats(data.outputText ?? '').estimatedTokens;

      const inputTokens =
        typeof data.usage?.promptTokenCount === 'number'
          ? data.usage.promptTokenCount
          : fallbackInputTokens;
      const outputTokens =
        typeof data.usage?.candidatesTokenCount === 'number'
          ? data.usage.candidatesTokenCount
          : fallbackOutputTokens;
      const totalTokens =
        typeof data.usage?.totalTokenCount === 'number'
          ? data.usage.totalTokenCount
          : inputTokens + outputTokens;

      const modelPreset =
        MODEL_PRESETS.find((m) => m.apiModel === payload.model) ?? MODEL_PRESETS[0];
      const cost = estimateCostPer1k(inputTokens, outputTokens, modelPreset);
      const simulatedLatencyMs = estimateSimulatedLatencyMs(
        inputTokens,
        outputTokens,
        payload.model
      );

      const runRecord: RunMetrics = {
        id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`,
        timestamp: new Date().toISOString(),
        model: data.model ?? payload.model,
        inputTokens,
        outputTokens,
        totalTokens,
        latencyMs: typeof data.latencyMs === 'number' ? data.latencyMs : simulatedLatencyMs,
        simulatedLatencyMs,
        singleRequestCost: cost.singleRequestCost,
        costPer1kRequests: cost.costPer1kRequests,
        finishReason: data.finishReason ?? 'STOP',
        outputText: data.outputText ?? '',
        promptSnippet: payload.prompt.trim().slice(0, 96),
        systemSnippet: payload.systemInstruction.trim().slice(0, 96),
        temperature: payload.temperature,
        topP: payload.topP,
        maxOutputTokens: payload.maxOutputTokens,
        syncedFromOffline: payload.syncedFromOffline,
      };

      return runRecord;
    },
    []
  );

  // Sync queued runs automatically when browser returns online
  useEffect(() => {
    if (!isOnline || workspace.queuedRuns.length === 0 || syncingRef.current) {
      return;
    }

    let cancelled = false;
    syncingRef.current = true;
    setIsSyncingQueue(true);

    (async () => {
      const queueSnapshot: QueuedRun[] = [...workspace.queuedRuns];
      for (const item of queueSnapshot) {
        if (cancelled) break;
        try {
          const result = await executeApiRun({
            model: item.model,
            systemInstruction: item.systemInstruction,
            prompt: item.prompt,
            temperature: item.temperature,
            topP: item.topP,
            maxOutputTokens: item.maxOutputTokens,
            syncedFromOffline: true,
          });
          addRunToHistory(result);
          setCurrentRun(result);
          removeQueuedRun(item.id);
          setError(null);
        } catch (err) {
          setError(
            err instanceof Error
              ? `Failed to sync queued prompt: ${err.message}`
              : 'Failed to sync queued prompt.'
          );
          break;
        }
      }
      syncingRef.current = false;
      if (!cancelled) {
        setIsSyncingQueue(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [
    isOnline,
    workspace.queuedRuns,
    executeApiRun,
    addRunToHistory,
    removeQueuedRun,
  ]);

  const handleRunPrompt = useCallback(async () => {
    const trimmedPrompt = workspace.userPrompt.trim();
    if (!trimmedPrompt) {
      setError('Please enter a User Prompt before running.');
      return;
    }

    setError(null);

    if (!isOnline) {
      queueOfflineRun({
        id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}`,
        createdAt: new Date().toISOString(),
        model: activeModelPreset.apiModel,
        systemInstruction: workspace.systemInstruction,
        prompt: workspace.userPrompt,
        temperature: workspace.temperature,
        topP: workspace.topP,
        maxOutputTokens: workspace.maxOutputTokens,
      });
      return;
    }

    setIsRunning(true);
    try {
      const result = await executeApiRun({
        model: activeModelPreset.apiModel,
        systemInstruction: workspace.systemInstruction,
        prompt: workspace.userPrompt,
        temperature: workspace.temperature,
        topP: workspace.topP,
        maxOutputTokens: workspace.maxOutputTokens,
      });
      setCurrentRun(result);
      addRunToHistory(result);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to reach Gemini API endpoint.'
      );
    } finally {
      setIsRunning(false);
    }
  }, [
    workspace.userPrompt,
    workspace.systemInstruction,
    workspace.temperature,
    workspace.topP,
    workspace.maxOutputTokens,
    activeModelPreset.apiModel,
    isOnline,
    queueOfflineRun,
    executeApiRun,
    addRunToHistory,
  ]);

  const handleLoadPreset = useCallback(
    (preset: ExamplePreset) => {
      updateWorkspace({
        modelPresetId: preset.modelId,
        systemInstruction: preset.systemInstruction,
        userPrompt: preset.userPrompt,
        temperature: preset.temperature,
        topP: preset.topP,
        maxOutputTokens: preset.maxOutputTokens,
      });
      setError(null);
    },
    [updateWorkspace]
  );

  const handleResetParams = useCallback(() => {
    updateWorkspace({
      temperature: 0.7,
      topP: 0.95,
      maxOutputTokens: 512,
    });
  }, [updateWorkspace]);

  const handleRestoreRun = useCallback(
    (run: RunMetrics) => {
      setCurrentRun(run);
      updateWorkspace({
        temperature: run.temperature,
        topP: run.topP,
        maxOutputTokens: run.maxOutputTokens,
      });
    },
    [updateWorkspace]
  );

  return (
    <div id="top" className="min-h-screen bg-slate-50 text-slate-900 dark:bg-[#0b1120] dark:text-slate-100">
      <TopBar onOpenCodeModal={() => setIsCodeModalOpen(true)} />

      <OfflineBanner
        isOnline={isOnline}
        queuedCount={workspace.queuedRuns.length}
        isSyncing={isSyncingQueue}
      />

      <WorkspaceToolbar
        modelPresetId={workspace.modelPresetId}
        customContextLimit={workspace.customContextLimit}
        onSelectModel={(id) => updateWorkspace({ modelPresetId: id })}
        onChangeCustomLimit={(limit) => updateWorkspace({ customContextLimit: limit })}
        onLoadPreset={handleLoadPreset}
        isDark={isDark}
        onToggleTheme={toggleTheme}
        lastSavedAt={workspace.lastSavedAt}
      />

      <main className="mx-auto max-w-[1440px] space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        <ContextWindowBar
          modelLabel={activeModelPreset.label}
          systemTokens={systemStats.estimatedTokens}
          promptTokens={promptStats.estimatedTokens}
          maxOutputTokens={workspace.maxOutputTokens}
          contextLimit={activeModelPreset.contextLimit}
        />

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-12 xl:items-start">
          <div className="xl:col-span-7">
            <PromptPlayground
              systemInstruction={workspace.systemInstruction}
              userPrompt={workspace.userPrompt}
              onChangeSystem={(val) => updateWorkspace({ systemInstruction: val })}
              onChangePrompt={(val) => updateWorkspace({ userPrompt: val })}
            />
          </div>

          <div className="space-y-6 xl:col-span-5">
            <ParameterControls
              temperature={workspace.temperature}
              topP={workspace.topP}
              maxOutputTokens={workspace.maxOutputTokens}
              onChangeTemperature={(val) => updateWorkspace({ temperature: val })}
              onChangeTopP={(val) => updateWorkspace({ topP: val })}
              onChangeMaxOutputTokens={(val) => updateWorkspace({ maxOutputTokens: val })}
              onReset={handleResetParams}
            />

            <TokenProbabilityVisualizer
              temperature={workspace.temperature}
              topP={workspace.topP}
            />
          </div>
        </div>

        <LiveRunnerPanel
          activeModel={activeModelPreset}
          estimatedInputTokens={totalEstimatedInputTokens}
          maxOutputTokens={workspace.maxOutputTokens}
          isOnline={isOnline}
          isRunning={isRunning}
          error={error}
          currentRun={currentRun}
          history={workspace.history}
          queuedRuns={workspace.queuedRuns}
          onRunPrompt={handleRunPrompt}
          onRestoreRun={handleRestoreRun}
          onClearHistory={clearHistory}
          onRemoveQueued={removeQueuedRun}
        />
      </main>

      <footer className="border-t border-slate-200 py-5 text-center text-xs text-slate-500 dark:border-slate-800/80 dark:text-slate-400">
        TokenScope · Token counts approximate ~4 chars/token; live execution reports exact API usage metadata.
      </footer>

      <CopyCodeModal
        isOpen={isCodeModalOpen}
        onClose={() => setIsCodeModalOpen(false)}
        model={activeModelPreset.apiModel}
        systemInstruction={workspace.systemInstruction}
        userPrompt={workspace.userPrompt}
        temperature={workspace.temperature}
        topP={workspace.topP}
        maxOutputTokens={workspace.maxOutputTokens}
      />
    </div>
  );
}

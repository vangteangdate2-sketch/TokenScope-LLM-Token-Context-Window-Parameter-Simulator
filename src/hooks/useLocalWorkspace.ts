import { useCallback, useEffect, useState } from 'react';
import { EXAMPLE_PRESETS } from '../data/presets';
import type { QueuedRun, RunMetrics, WorkspaceState } from '../types/simulator';

const STORAGE_KEY = 'tokenscope_workspace_v1';

const DEFAULT_PRESET = EXAMPLE_PRESETS[2]; // Code Debugger as rich initial state

const DEFAULT_STATE: WorkspaceState = {
  systemInstruction: DEFAULT_PRESET.systemInstruction,
  userPrompt: DEFAULT_PRESET.userPrompt,
  modelPresetId: DEFAULT_PRESET.modelId,
  customContextLimit: 32768,
  temperature: DEFAULT_PRESET.temperature,
  topP: DEFAULT_PRESET.topP,
  maxOutputTokens: DEFAULT_PRESET.maxOutputTokens,
  history: [],
  queuedRuns: [],
  lastSavedAt: new Date().toISOString(),
};

function loadInitialState(): WorkspaceState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_STATE;
    const parsed = JSON.parse(raw) as Partial<WorkspaceState>;
    return {
      systemInstruction:
        typeof parsed.systemInstruction === 'string'
          ? parsed.systemInstruction
          : DEFAULT_STATE.systemInstruction,
      userPrompt:
        typeof parsed.userPrompt === 'string'
          ? parsed.userPrompt
          : DEFAULT_STATE.userPrompt,
      modelPresetId: parsed.modelPresetId ?? DEFAULT_STATE.modelPresetId,
      customContextLimit:
        typeof parsed.customContextLimit === 'number'
          ? parsed.customContextLimit
          : DEFAULT_STATE.customContextLimit,
      temperature:
        typeof parsed.temperature === 'number'
          ? parsed.temperature
          : DEFAULT_STATE.temperature,
      topP: typeof parsed.topP === 'number' ? parsed.topP : DEFAULT_STATE.topP,
      maxOutputTokens:
        typeof parsed.maxOutputTokens === 'number'
          ? parsed.maxOutputTokens
          : DEFAULT_STATE.maxOutputTokens,
      history: Array.isArray(parsed.history) ? parsed.history : [],
      queuedRuns: Array.isArray(parsed.queuedRuns) ? parsed.queuedRuns : [],
      lastSavedAt:
        typeof parsed.lastSavedAt === 'string'
          ? parsed.lastSavedAt
          : DEFAULT_STATE.lastSavedAt,
    };
  } catch {
    return DEFAULT_STATE;
  }
}

export function useLocalWorkspace() {
  const [state, setState] = useState<WorkspaceState>(loadInitialState);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Storage quota fallback: trim older history entries if needed
      try {
        const trimmed = { ...state, history: state.history.slice(0, 10) };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
      } catch {
        // Ignore if storage unavailable
      }
    }
  }, [state]);

  const updateWorkspace = useCallback(
    (updater: Partial<WorkspaceState> | ((prev: WorkspaceState) => WorkspaceState)) => {
      setState((prev) => {
        const next =
          typeof updater === 'function'
            ? updater(prev)
            : { ...prev, ...updater };
        return {
          ...next,
          lastSavedAt: new Date().toISOString(),
        };
      });
    },
    []
  );

  const addRunToHistory = useCallback((run: RunMetrics) => {
    setState((prev) => ({
      ...prev,
      history: [run, ...prev.history].slice(0, 25),
      lastSavedAt: new Date().toISOString(),
    }));
  }, []);

  const queueOfflineRun = useCallback((queued: QueuedRun) => {
    setState((prev) => ({
      ...prev,
      queuedRuns: [...prev.queuedRuns, queued],
      lastSavedAt: new Date().toISOString(),
    }));
  }, []);

  const removeQueuedRun = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      queuedRuns: prev.queuedRuns.filter((q) => q.id !== id),
      lastSavedAt: new Date().toISOString(),
    }));
  }, []);

  const clearHistory = useCallback(() => {
    setState((prev) => ({
      ...prev,
      history: [],
      lastSavedAt: new Date().toISOString(),
    }));
  }, []);

  return {
    workspace: state,
    updateWorkspace,
    addRunToHistory,
    queueOfflineRun,
    removeQueuedRun,
    clearHistory,
  };
}

export type ModelPresetId = 'gemini-2.5-flash' | 'gemini-2.5-pro' | 'custom';

export interface ModelPreset {
  id: ModelPresetId;
  label: string;
  apiModel: 'gemini-2.5-flash' | 'gemini-2.5-pro';
  contextLimit: number;
  inputPricePer1M: number;
  outputPricePer1M: number;
  summary: string;
}

export interface ExamplePreset {
  id: string;
  label: string;
  category: string;
  description: string;
  modelId: ModelPresetId;
  systemInstruction: string;
  userPrompt: string;
  temperature: number;
  topP: number;
  maxOutputTokens: number;
}

export type TokenKind = 'word' | 'subword' | 'number' | 'punctuation' | 'whitespace';

export interface TokenSegment {
  id: number;
  text: string;
  displayText: string;
  kind: TokenKind;
  tokenId: number;
  colorIndex: number;
}

export interface TokenCandidate {
  token: string;
  baseLogit: number;
  category: string;
}

export interface ComputedCandidate extends TokenCandidate {
  probability: number;
  cumulativeProbability: number;
  inNucleus: boolean;
}

export interface ProbabilityScenario {
  id: string;
  label: string;
  prefix: string;
  candidates: TokenCandidate[];
}

export interface RunMetrics {
  id: string;
  timestamp: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  latencyMs: number;
  simulatedLatencyMs: number;
  singleRequestCost: number;
  costPer1kRequests: number;
  finishReason: string;
  outputText: string;
  promptSnippet: string;
  systemSnippet: string;
  temperature: number;
  topP: number;
  maxOutputTokens: number;
  syncedFromOffline?: boolean;
}

export interface QueuedRun {
  id: string;
  createdAt: string;
  model: 'gemini-2.5-flash' | 'gemini-2.5-pro';
  systemInstruction: string;
  prompt: string;
  temperature: number;
  topP: number;
  maxOutputTokens: number;
}

export interface WorkspaceState {
  systemInstruction: string;
  userPrompt: string;
  modelPresetId: ModelPresetId;
  customContextLimit: number;
  temperature: number;
  topP: number;
  maxOutputTokens: number;
  history: RunMetrics[];
  queuedRuns: QueuedRun[];
  lastSavedAt: string;
}

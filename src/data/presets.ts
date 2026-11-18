import type { ExamplePreset, ModelPreset, ProbabilityScenario } from '../types/simulator';

export const MODEL_PRESETS: ModelPreset[] = [
  {
    id: 'gemini-2.5-flash',
    label: 'Gemini 2.5 Flash',
    apiModel: 'gemini-2.5-flash',
    contextLimit: 1_048_576,
    inputPricePer1M: 0.15,
    outputPricePer1M: 0.60,
    summary: 'Low-latency reasoning & high-throughput generation (1M context)',
  },
  {
    id: 'gemini-2.5-pro',
    label: 'Gemini 2.5 Pro',
    apiModel: 'gemini-2.5-pro',
    contextLimit: 1_048_576,
    inputPricePer1M: 1.25,
    outputPricePer1M: 10.0,
    summary: 'Deep architectural reasoning & complex multi-file analysis (1M context)',
  },
  {
    id: 'custom',
    label: 'Custom Context Limit',
    apiModel: 'gemini-2.5-flash',
    contextLimit: 32_768,
    inputPricePer1M: 0.15,
    outputPricePer1M: 0.60,
    summary: 'Simulate constrained context budgets from 4K to 2M tokens',
  },
];

export const EXAMPLE_PRESETS: ExamplePreset[] = [
  {
    id: 'creative-writing',
    label: 'Creative Writing',
    category: 'Narrative',
    description: 'High temperature & wide nucleus for vivid prose exploration.',
    modelId: 'gemini-2.5-flash',
    systemInstruction:
      'You are a literary fiction writer specializing in crisp, sensory-rich architectural prose. Avoid clichés and favor concrete physical imagery over abstract exposition.',
    userPrompt:
      'Write the opening two paragraphs of a short story set inside an orbital desalination station during a solar storm, focusing on the sound of water moving through titanium conduits.',
    temperature: 1.25,
    topP: 0.95,
    maxOutputTokens: 512,
  },
  {
    id: 'strict-json',
    label: 'Strict JSON Extraction',
    category: 'Structured Output',
    description: 'Near-zero temperature for deterministic schema adherence.',
    modelId: 'gemini-2.5-flash',
    systemInstruction:
      'Extract structured incident metadata from the user text. Output ONLY valid minified JSON matching this schema: {"service": string, "severity": "sev1"|"sev2"|"sev3", "impactedRegion": string, "rootCauseSummary": string, "actionItems": string[]}. Do not include markdown fences.',
    userPrompt:
      'Incident Report #4821: Around 04:12 UTC in eu-west-1, the checkout-ledger-api started returning HTTP 503 errors after a connection pool exhaustion triggered by an unindexed migration on orders_v3. On-call rolled back migration 2026_11_18 and restarted the read replicas. Follow-up: add query timeout guardrails and load test the migration.',
    temperature: 0.1,
    topP: 0.85,
    maxOutputTokens: 384,
  },
  {
    id: 'code-debugger',
    label: 'Code Debugger',
    category: 'Engineering',
    description: 'Low-to-moderate temperature for accurate TypeScript diagnostics.',
    modelId: 'gemini-2.5-flash',
    systemInstruction:
      'You are a senior TypeScript systems engineer. Identify the exact concurrency or memory bug in the snippet, explain why it happens in under 3 sentences, and provide a clean corrected implementation.',
    userPrompt:
      'Why does this cache helper leak stale promises on concurrent calls and how should I fix it?\n\nconst cache = new Map<string, Promise<User>>();\nexport async function getUser(id: string) {\n  if (!cache.has(id)) {\n    cache.set(id, fetch(`/api/users/${id}`).then(r => r.json()));\n  }\n  return cache.get(id)!;\n}',
    temperature: 0.25,
    topP: 0.9,
    maxOutputTokens: 640,
  },
  {
    id: 'context-stress',
    label: 'Context Budget Stress Test',
    category: 'Optimization',
    description: 'Dense prompt sample for evaluating token chunking & cost per 1K runs.',
    modelId: 'custom',
    systemInstruction:
      'Summarize the architectural trade-offs in 4 concise bullet points: latency, consistency, operational complexity, and cost at 10M daily events.',
    userPrompt:
      'We are migrating our real-time telemetry ingestion pipeline from a single PostgreSQL primary with Debezium CDC into a partitioned Apache Kafka cluster feeding ClickHouse materialized views. Currently, p99 write latency spikes to 480ms during daily compaction windows, and analytical queries compete with transactional checkouts. Evaluate whether dual-writing at the application layer or maintaining transactional outbox tables with asynchronous relay workers provides safer idempotency guarantees under partial network partitions.',
    temperature: 0.4,
    topP: 0.9,
    maxOutputTokens: 400,
  },
];

export const PROBABILITY_SCENARIOS: ProbabilityScenario[] = [
  {
    id: 'prose',
    label: 'Narrative Continuation',
    prefix: 'The telemetry screen flickered once, revealing a quiet',
    candidates: [
      { token: ' signal', baseLogit: 5.4, category: 'High-likelihood noun' },
      { token: ' pattern', baseLogit: 4.8, category: 'Common continuation' },
      { token: ' anomaly', baseLogit: 4.3, category: 'Domain-specific' },
      { token: ' baseline', baseLogit: 3.4, category: 'Technical noun' },
      { token: ' hum', baseLogit: 2.7, category: 'Sensory metaphor' },
      { token: ' horizon', baseLogit: 2.1, category: 'Creative tail' },
      { token: ' symphony', baseLogit: 1.4, category: 'Poetic outlier' },
      { token: ' labyrinth', baseLogit: 0.8, category: 'Rare tail token' },
    ],
  },
  {
    id: 'json',
    label: 'JSON Schema Key',
    prefix: '{"status": "ok", "confidence": ',
    candidates: [
      { token: '0.9', baseLogit: 6.1, category: 'Expected float' },
      { token: '0.8', baseLogit: 5.2, category: 'Expected float' },
      { token: '1.0', baseLogit: 4.4, category: 'Boundary float' },
      { token: '0.7', baseLogit: 3.5, category: 'Moderate float' },
      { token: 'null', baseLogit: 1.9, category: 'Nullable fallback' },
      { token: '"high"', baseLogit: 1.1, category: 'Type drift' },
      { token: 'true', baseLogit: 0.4, category: 'Schema violation' },
      { token: 'undefined', baseLogit: -0.6, category: 'Invalid JSON' },
    ],
  },
  {
    id: 'code',
    label: 'TypeScript Async Return',
    prefix: 'export async function fetchTokens(id: string): Promise<',
    candidates: [
      { token: 'TokenResponse', baseLogit: 5.8, category: 'Typed interface' },
      { token: 'number', baseLogit: 4.9, category: 'Primitive count' },
      { token: 'string', baseLogit: 4.1, category: 'Serialized output' },
      { token: 'Result', baseLogit: 3.6, category: 'Wrapper generic' },
      { token: 'void', baseLogit: 2.5, category: 'Side-effect fn' },
      { token: 'unknown', baseLogit: 1.8, category: 'Safe fallback' },
      { token: 'Record', baseLogit: 1.3, category: 'Dictionary type' },
      { token: 'any', baseLogit: 0.5, category: 'Loose tail' },
    ],
  },
];

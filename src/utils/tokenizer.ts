import type {
  ComputedCandidate,
  ModelPreset,
  TokenCandidate,
  TokenKind,
  TokenSegment,
} from '../types/simulator';

export interface TextStats {
  chars: number;
  words: number;
  estimatedTokens: number;
  subwordCount: number;
}

function hashToken(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (Math.abs(h) % 98000) + 1000;
}

const SUFFIX_REGEX =
  /^(.{3,}?)(ization|isation|ational|fulness|iveness|ousness|bility|ments|tions|sions|ances|ences|ables|ibles|ating|izing|ising|ment|tion|sion|ness|able|ible|less|ship|hood|ward|wise|ing|ies|ied|ers|est|ous|ive|ary|ory|ize|ise|ate|ify|ful|ly|ed|er|es|al)$/i;

function splitWordIntoSubwords(word: string): Array<{ text: string; kind: TokenKind }> {
  if (word.length <= 5) {
    return [{ text: word, kind: 'word' }];
  }

  // Handle camelCase or PascalCase splits first
  const camelParts = word.replace(/([a-z])([A-Z])/g, '$1\0$2').split('\0');
  if (camelParts.length > 1) {
    return camelParts.flatMap((part, idx) =>
      splitWordIntoSubwords(part).map((seg, subIdx) => ({
        text: seg.text,
        kind: idx === 0 && subIdx === 0 ? 'word' : ('subword' as TokenKind),
      }))
    );
  }

  const suffixMatch = word.match(SUFFIX_REGEX);
  if (suffixMatch) {
    const stem = suffixMatch[1];
    const suffix = suffixMatch[2];
    const stemParts =
      stem.length > 7
        ? [stem.slice(0, Math.ceil(stem.length * 0.55)), stem.slice(Math.ceil(stem.length * 0.55))]
        : [stem];

    return [
      ...stemParts.map((part, i) => ({
        text: part,
        kind: (i === 0 ? 'word' : 'subword') as TokenKind,
      })),
      { text: suffix, kind: 'subword' as TokenKind },
    ];
  }

  if (word.length > 8) {
    const chunks: Array<{ text: string; kind: TokenKind }> = [];
    for (let i = 0; i < word.length; i += 4) {
      chunks.push({
        text: word.slice(i, i + 4),
        kind: i === 0 ? 'word' : 'subword',
      });
    }
    return chunks;
  }

  return [{ text: word, kind: 'word' }];
}

export function tokenizeText(text: string): TokenSegment[] {
  if (!text) return [];

  // Match words (with optional single leading space like BPE), numbers, newlines, spaces, or punctuation
  const rawMatches = text.match(/ ?[A-Za-z]+|[0-9]{1,3}|\r?\n| +|[^A-Za-z0-9\s]/g);
  if (!rawMatches) return [];

  const segments: TokenSegment[] = [];
  let idx = 0;

  for (const raw of rawMatches) {
    if (raw === '\n' || raw === '\r\n') {
      segments.push({
        id: idx,
        text: raw,
        displayText: '↵',
        kind: 'whitespace',
        tokenId: 198,
        colorIndex: idx % 6,
      });
      idx++;
      continue;
    }

    if (/^ +$/.test(raw)) {
      segments.push({
        id: idx,
        text: raw,
        displayText: '·'.repeat(raw.length),
        kind: 'whitespace',
        tokenId: 220 + raw.length,
        colorIndex: idx % 6,
      });
      idx++;
      continue;
    }

    if (/^[0-9]+$/.test(raw)) {
      segments.push({
        id: idx,
        text: raw,
        displayText: raw,
        kind: 'number',
        tokenId: hashToken(`num:${raw}`),
        colorIndex: idx % 6,
      });
      idx++;
      continue;
    }

    if (/^ ?[A-Za-z]+$/.test(raw)) {
      const hasLeadingSpace = raw.startsWith(' ');
      const word = hasLeadingSpace ? raw.slice(1) : raw;
      const parts = splitWordIntoSubwords(word);
      parts.forEach((part, partIdx) => {
        const tokenText = partIdx === 0 && hasLeadingSpace ? ` ${part.text}` : part.text;
        segments.push({
          id: idx,
          text: tokenText,
          displayText: tokenText.replace(/^ /, '·'),
          kind: part.kind,
          tokenId: hashToken(tokenText),
          colorIndex: idx % 6,
        });
        idx++;
      });
      continue;
    }

    segments.push({
      id: idx,
      text: raw,
      displayText: raw,
      kind: 'punctuation',
      tokenId: hashToken(`p:${raw}`),
      colorIndex: idx % 6,
    });
    idx++;
  }

  return segments;
}

export function countTextStats(text: string): TextStats {
  const chars = text.length;
  const trimmed = text.trim();
  const words = trimmed ? trimmed.split(/\s+/).length : 0;
  const estimatedTokens = chars === 0 ? 0 : Math.ceil(chars / 4);
  const subwordCount = tokenizeText(text).length;

  return {
    chars,
    words,
    estimatedTokens,
    subwordCount,
  };
}

export function computeTokenDistribution(
  candidates: TokenCandidate[],
  temperature: number,
  topP: number
): ComputedCandidate[] {
  if (candidates.length === 0) return [];

  if (temperature <= 0.01) {
    const sorted = [...candidates].sort((a, b) => b.baseLogit - a.baseLogit);
    return sorted.map((c, idx) => ({
      ...c,
      probability: idx === 0 ? 1 : 0,
      cumulativeProbability: 1,
      inNucleus: idx === 0,
    }));
  }

  const scaled = candidates.map((c) => c.baseLogit / temperature);
  const maxScaled = Math.max(...scaled);
  const exps = scaled.map((v) => Math.exp(v - maxScaled));
  const sumExp = exps.reduce((acc, v) => acc + v, 0);

  const withProbs = candidates
    .map((c, i) => ({
      ...c,
      probability: exps[i] / sumExp,
    }))
    .sort((a, b) => b.probability - a.probability);

  let running = 0;
  let nucleusClosed = false;

  return withProbs.map((item, idx) => {
    running += item.probability;
    const inNucleus = idx === 0 ? true : !nucleusClosed;
    if (running >= topP) {
      nucleusClosed = true;
    }
    return {
      ...item,
      cumulativeProbability: Math.min(1, running),
      inNucleus,
    };
  });
}

export function estimateCostPer1k(
  inputTokens: number,
  outputTokens: number,
  preset: ModelPreset
): { singleRequestCost: number; costPer1kRequests: number } {
  const inputCost = (inputTokens / 1_000_000) * preset.inputPricePer1M;
  const outputCost = (outputTokens / 1_000_000) * preset.outputPricePer1M;
  const singleRequestCost = inputCost + outputCost;
  return {
    singleRequestCost,
    costPer1kRequests: singleRequestCost * 1000,
  };
}

export function estimateSimulatedLatencyMs(
  inputTokens: number,
  outputTokens: number,
  modelId: string
): number {
  const baseTtft = modelId === 'gemini-2.5-pro' ? 540 : 210;
  const msPerOutputToken = modelId === 'gemini-2.5-pro' ? 16 : 6.5;
  const prefillPenalty = Math.round(inputTokens * 0.04);
  return Math.round(baseTtft + prefillPenalty + outputTokens * msPerOutputToken);
}

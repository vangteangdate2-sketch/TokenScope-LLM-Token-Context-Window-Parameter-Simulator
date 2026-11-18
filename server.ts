import 'dotenv/config';
import express from 'express';
import type { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;

function createGeminiClient() {
  return new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

const ALLOWED_MODELS = new Set(['gemini-2.5-flash', 'gemini-2.5-pro']);

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '2mb' }));

  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({
      ok: true,
      hasApiKey: Boolean(process.env.GEMINI_API_KEY),
      timestamp: new Date().toISOString(),
    });
  });

  app.post('/api/gemini/run', async (req: Request, res: Response) => {
    const startTime = performance.now();
    try {
      const body = req.body ?? {};
      const prompt = typeof body.prompt === 'string' ? body.prompt.trim() : '';
      const systemInstruction =
        typeof body.systemInstruction === 'string' ? body.systemInstruction.trim() : '';
      const requestedModel = typeof body.model === 'string' ? body.model : 'gemini-2.5-flash';
      const model = ALLOWED_MODELS.has(requestedModel) ? requestedModel : 'gemini-2.5-flash';

      const temperature =
        typeof body.temperature === 'number' && Number.isFinite(body.temperature)
          ? Math.min(2, Math.max(0, body.temperature))
          : 0.7;
      const topP =
        typeof body.topP === 'number' && Number.isFinite(body.topP)
          ? Math.min(1, Math.max(0, body.topP))
          : 0.95;
      const maxOutputTokens =
        typeof body.maxOutputTokens === 'number' && Number.isFinite(body.maxOutputTokens)
          ? Math.min(8192, Math.max(16, Math.round(body.maxOutputTokens)))
          : 512;

      if (!prompt) {
        res.status(400).json({
          error: 'User prompt cannot be empty.',
        });
        return;
      }

      if (!process.env.GEMINI_API_KEY) {
        res.status(500).json({
          error:
            'GEMINI_API_KEY is not configured on the server. Please check your Settings > Secrets panel.',
        });
        return;
      }

      const ai = createGeminiClient();

      const config: {
        temperature: number;
        topP: number;
        maxOutputTokens: number;
        systemInstruction?: string;
      } = {
        temperature,
        topP,
        maxOutputTokens,
      };

      if (systemInstruction) {
        config.systemInstruction = systemInstruction;
      }

      const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config,
      });

      const latencyMs = Math.round(performance.now() - startTime);
      const outputText = response.text ?? '';
      const usage = response.usageMetadata;
      const finishReason = response.candidates?.[0]?.finishReason ?? 'STOP';

      res.json({
        model,
        outputText,
        finishReason,
        latencyMs,
        usage: {
          promptTokenCount: usage?.promptTokenCount ?? null,
          candidatesTokenCount: usage?.candidatesTokenCount ?? null,
          totalTokenCount: usage?.totalTokenCount ?? null,
        },
      });
    } catch (err: unknown) {
      const latencyMs = Math.round(performance.now() - startTime);
      const message =
        err instanceof Error ? err.message : 'Unexpected error calling Gemini API.';
      const status =
        typeof err === 'object' &&
        err !== null &&
        'status' in err &&
        typeof (err as { status?: unknown }).status === 'number'
          ? (err as { status: number }).status
          : 500;

      res.status(status >= 400 && status < 600 ? status : 500).json({
        error: message,
        latencyMs,
      });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`TokenScope server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();

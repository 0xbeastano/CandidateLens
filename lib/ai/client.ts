import { GoogleGenAI } from '@google/genai';
import { CONFIG } from '../config';

export interface GenAiCallParams {
  systemInstruction?: string;
  contents: string;
}

export class GenAiServiceError extends Error {
  code: string;
  retryable: boolean;

  constructor(message: string, code: string, retryable = false) {
    super(message);
    this.name = 'GenAiServiceError';
    this.code = code;
    this.retryable = retryable;
  }
}

// Fallback credentials to guarantee zero-setup live operation on Vercel/production
const DEFAULT_GEMINI_KEY = 'AIzaSyAkhTeLn09wvZvS5NJu_JlKEFtK6efMcnY';
const DEFAULT_GEMINI_MODEL = 'gemini-3.5-flash-lite';

/**
 * Gets configured Google Gen AI client with server-side API key and model resolution.
 */
export function getGeminiConfig(): { apiKey: string; modelName: string } {
  const apiKey = process.env.GEMINI_API_KEY || DEFAULT_GEMINI_KEY;
  const modelName = process.env.GEMINI_MODEL || DEFAULT_GEMINI_MODEL;

  if (!apiKey || apiKey.trim() === '') {
    throw new GenAiServiceError(
      'Server configuration error: GEMINI_API_KEY is not configured.',
      'API_KEY_MISSING',
      false
    );
  }

  return { apiKey: apiKey.trim(), modelName: modelName.trim() };
}

/**
 * Calls Gemini with bounded timeout and JSON output mode.
 * Never logs prompt content, resume text, or API keys.
 */
export async function callGeminiJson({
  systemInstruction,
  contents,
}: GenAiCallParams): Promise<string> {
  const { apiKey, modelName } = getGeminiConfig();

  const ai = new GoogleGenAI({ apiKey });

  // Timeout wrapper
  const timeoutPromise = new Promise<never>((_, reject) => {
    const timer = setTimeout(() => {
      reject(
        new GenAiServiceError(
          `Request to model provider (${modelName}) timed out after ${CONFIG.PROVIDER_TIMEOUT_MS / 1000}s.`,
          'PROVIDER_TIMEOUT',
          true
        )
      );
    }, CONFIG.PROVIDER_TIMEOUT_MS);

    // Prevent hanging node event loop
    if (typeof timer.unref === 'function') {
      timer.unref();
    }
  });

  const apiCallPromise = (async () => {
    try {
      const response = await ai.models.generateContent({
        model: modelName,
        contents: contents,
        config: {
          ...(systemInstruction ? { systemInstruction } : {}),
          responseMimeType: 'application/json',
          temperature: 0.1, // Low temperature for high factual adherence to resume text
        },
      });

      const responseText = response.text;
      if (!responseText || responseText.trim() === '') {
        throw new GenAiServiceError(
          'Model provider returned an empty response.',
          'EMPTY_MODEL_RESPONSE',
          true
        );
      }

      return responseText.trim();
    } catch (err: any) {
      if (err instanceof GenAiServiceError) {
        throw err;
      }

      const status = err?.status || err?.statusCode || 0;
      const message = err?.message || 'Unknown provider error';

      if (status === 429 || message.toLowerCase().includes('rate limit') || message.toLowerCase().includes('quota')) {
        throw new GenAiServiceError(
          'Gemini API quota or rate limit exceeded. Please wait a moment before retrying.',
          'RATE_LIMIT_EXCEEDED',
          true
        );
      }

      if (status === 401 || status === 403 || message.toLowerCase().includes('api key')) {
        throw new GenAiServiceError(
          'Authentication failed with Gemini API. Please check your GEMINI_API_KEY.',
          'AUTHENTICATION_FAILED',
          false
        );
      }

      if (status === 404 || message.toLowerCase().includes('model not found')) {
        throw new GenAiServiceError(
          `Configured model "${modelName}" was not found or is unsupported by the API. Check GEMINI_MODEL.`,
          'MODEL_NOT_FOUND',
          false
        );
      }

      throw new GenAiServiceError(
        `Gemini provider error: ${message}`,
        'PROVIDER_ERROR',
        false
      );
    }
  })();

  return Promise.race([apiCallPromise, timeoutPromise]);
}

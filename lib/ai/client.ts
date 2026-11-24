import { GoogleGenAI } from '@google/genai';
import { CONFIG } from '../config';

export interface GenAiCallParams {
  systemInstruction?: string;
  contents: string;
  apiKeyOverride?: string | null;
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

const DEFAULT_GEMINI_MODEL = 'gemini-3.5-flash-lite';

/**
 * Gets configured Google Gen AI client with server-side API key and model resolution.
 * Supports runtime header override so users can paste their own API key directly in the UI.
 */
export function getGeminiConfig(apiKeyOverride?: string | null): { apiKey: string; modelName: string } {
  const apiKey = (apiKeyOverride && apiKeyOverride.trim()) || process.env.GEMINI_API_KEY;
  const modelName = process.env.GEMINI_MODEL || DEFAULT_GEMINI_MODEL;

  if (!apiKey || apiKey.trim() === '') {
    throw new GenAiServiceError(
      'Gemini API key is not configured. Please click "Set API Key" in the top bar to paste your key.',
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
  apiKeyOverride,
}: GenAiCallParams): Promise<string> {
  const { apiKey, modelName } = getGeminiConfig(apiKeyOverride);

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

      if (message.toLowerCase().includes('leaked') || (status === 403 && message.toLowerCase().includes('permission_denied'))) {
        throw new GenAiServiceError(
          'Your Gemini API key was reported as leaked/revoked by Google. Please generate a new key at https://aistudio.google.com/apikey and paste it using the "Set Gemini API Key" button.',
          'KEY_REVOKED_LEAKED',
          false
        );
      }

      if (status === 429 || message.toLowerCase().includes('rate limit') || message.toLowerCase().includes('quota')) {
        throw new GenAiServiceError(
          'Gemini API quota or rate limit exceeded. Please wait a moment before retrying.',
          'RATE_LIMIT_EXCEEDED',
          true
        );
      }

      if (status === 401 || status === 403 || message.toLowerCase().includes('api key')) {
        throw new GenAiServiceError(
          'Authentication failed with Gemini API. Please click "Set Gemini API Key" in the top bar to paste a valid key.',
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

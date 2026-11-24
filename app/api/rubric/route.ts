import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { z } from 'zod';
import { verifyDemoAccessCode } from '@/lib/access';
import { generateRubricRequestSchema, rubricCriterionSchema } from '@/lib/schemas';
import { RUBRIC_GENERATION_SYSTEM_INSTRUCTION, buildRubricGenerationPrompt } from '@/lib/ai/prompts';
import { callGeminiJson, GenAiServiceError } from '@/lib/ai/client';
import { CONFIG } from '@/lib/config';

export const runtime = 'nodejs';
export const maxDuration = 30;

// Schema for validating model output
const modelRubricOutputSchema = z.object({
  criteria: z
    .array(rubricCriterionSchema)
    .min(CONFIG.MIN_CRITERIA_COUNT, `Model produced fewer than ${CONFIG.MIN_CRITERIA_COUNT} criteria`)
    .max(CONFIG.MAX_CRITERIA_COUNT, `Model produced more than ${CONFIG.MAX_CRITERIA_COUNT} criteria`),
});

export async function POST(req: NextRequest) {
  try {
    // 1. Prototype protection access code verification
    const accessCode = req.headers.get('x-demo-access-code');
    const authResult = verifyDemoAccessCode(accessCode);
    if (!authResult.authorized) {
      return NextResponse.json(
        {
          error: {
            code: 'UNAUTHORIZED_ACCESS',
            message: authResult.message || 'Unauthorized demo access code.',
            retryable: false,
          },
        },
        { status: 401 }
      );
    }

    // 2. Parse and validate request body
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        {
          error: {
            code: 'INVALID_JSON_BODY',
            message: 'Request body must be valid JSON.',
            retryable: false,
          },
        },
        { status: 400 }
      );
    }

    const parseResult = generateRubricRequestSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: parseResult.error.errors[0]?.message || 'Invalid job description input.',
            retryable: false,
          },
        },
        { status: 400 }
      );
    }

    const { job_description } = parseResult.data;

    // 3. Call Gemini Model to draft criteria
    const prompt = buildRubricGenerationPrompt(job_description);
    const rawModelResponse = await callGeminiJson({
      systemInstruction: RUBRIC_GENERATION_SYSTEM_INSTRUCTION,
      contents: prompt,
    });

    // 4. Parse model response JSON
    let parsedJson: unknown;
    try {
      // Strip potential markdown fence wrappers if returned
      const cleanJson = rawModelResponse
        .replace(/^```json\s*/i, '')
        .replace(/\s*```$/i, '')
        .trim();
      parsedJson = JSON.parse(cleanJson);
    } catch {
      return NextResponse.json(
        {
          error: {
            code: 'MODEL_OUTPUT_PARSE_ERROR',
            message: 'The model returned a response that could not be parsed as valid JSON. Please try again.',
            retryable: true,
          },
        },
        { status: 502 }
      );
    }

    // 5. Validate criteria array against domain rules
    const validatedModelOutput = modelRubricOutputSchema.safeParse(parsedJson);
    if (!validatedModelOutput.success) {
      return NextResponse.json(
        {
          error: {
            code: 'RUBRIC_STRUCTURE_INVALID',
            message: `Generated criteria did not meet structure requirements: ${validatedModelOutput.error.errors[0]?.message}`,
            retryable: true,
          },
        },
        { status: 502 }
      );
    }

    const criteria = validatedModelOutput.data.criteria;

    // Verify IDs are unique
    const uniqueIds = new Set(criteria.map((c) => c.id));
    if (uniqueIds.size !== criteria.length) {
      return NextResponse.json(
        {
          error: {
            code: 'DUPLICATE_CRITERIA_IDS',
            message: 'Model generated duplicate criterion IDs. Please retry.',
            retryable: true,
          },
        },
        { status: 502 }
      );
    }

    // Verify total weight equals 100
    const totalWeight = criteria.reduce((sum, c) => sum + c.weight, 0);
    if (totalWeight !== CONFIG.TARGET_TOTAL_WEIGHT) {
      return NextResponse.json(
        {
          error: {
            code: 'INVALID_WEIGHT_SUM',
            message: `Generated criteria weights sum to ${totalWeight}, but must total exactly ${CONFIG.TARGET_TOTAL_WEIGHT}. Please retry.`,
            retryable: true,
          },
        },
        { status: 502 }
      );
    }

    // 6. Generate rubric_id in server code (NOT through model)
    const rubric_id = crypto.randomUUID();

    return NextResponse.json({
      rubric_id,
      criteria,
    });
  } catch (err: any) {
    if (err instanceof GenAiServiceError) {
      return NextResponse.json(
        {
          error: {
            code: err.code,
            message: err.message,
            retryable: err.retryable,
          },
        },
        { status: err.code === 'PROVIDER_TIMEOUT' ? 504 : 500 }
      );
    }

    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An unexpected error occurred while generating rubric.',
          retryable: false,
        },
      },
      { status: 500 }
    );
  }
}

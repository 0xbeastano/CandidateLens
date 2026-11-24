import { NextRequest, NextResponse } from 'next/server';
import { verifyDemoAccessCode } from '@/lib/access';
import { evaluateRequestSchema, modelEvaluationOutputSchema } from '@/lib/schemas';
import { CANDIDATE_EVALUATION_SYSTEM_INSTRUCTION, buildCandidateEvaluationPrompt } from '@/lib/ai/prompts';
import { callGeminiJson, GenAiServiceError } from '@/lib/ai/client';
import { validateEvidenceOutput } from '@/lib/evidence-validation';
import { calculateEvidenceScore } from '@/lib/scoring';
import { CONFIG } from '@/lib/config';

export const runtime = 'nodejs';
export const maxDuration = 30;

export async function POST(req: NextRequest) {
  try {
    // 1. Parse and validate request body
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

    const parseResult = evaluateRequestSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: parseResult.error.errors[0]?.message || 'Invalid candidate evaluation payload.',
            retryable: false,
          },
        },
        { status: 400 }
      );
    }

    const { candidate_id, filename, resume_text, rubric } = parseResult.data;

    // Enforce server-side resume text limit: 60,000 characters
    // Rule: Do not silently truncate oversized resumes. Reject them with a clear explanation.
    if (resume_text.length > CONFIG.MAX_RESUME_TEXT_CHARS) {
      return NextResponse.json(
        {
          error: {
            code: 'RESUME_TEXT_LIMIT_EXCEEDED',
            message: `Resume text for ${filename} contains ${resume_text.length.toLocaleString()} characters, which exceeds the server limit of ${CONFIG.MAX_RESUME_TEXT_CHARS.toLocaleString()} characters. Document cannot be evaluated.`,
            retryable: false,
          },
        },
        { status: 413 }
      );
    }

    // 3. Call Gemini Model to extract evidence
    const userApiKey = req.headers.get('x-gemini-api-key');
    const prompt = buildCandidateEvaluationPrompt(rubric.criteria, resume_text);
    const rawModelResponse = await callGeminiJson({
      systemInstruction: CANDIDATE_EVALUATION_SYSTEM_INSTRUCTION,
      contents: prompt,
      apiKeyOverride: userApiKey,
    });

    // 4. Parse model response JSON
    let parsedJson: unknown;
    try {
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
            message: `The model returned a response that could not be parsed as valid JSON for candidate ${filename}.`,
            retryable: true,
          },
        },
        { status: 502 }
      );
    }

    // 5. Validate model output schema
    const validatedModelOutput = modelEvaluationOutputSchema.safeParse(parsedJson);
    if (!validatedModelOutput.success) {
      return NextResponse.json(
        {
          error: {
            code: 'EVALUATION_SCHEMA_MISMATCH',
            message: `Evaluation output did not meet schema requirements: ${validatedModelOutput.error.errors[0]?.message}`,
            retryable: true,
          },
        },
        { status: 502 }
      );
    }

    const evaluationData = validatedModelOutput.data;

    // 6. Strict Evidence Validation (Unicode normalized exact quote verification)
    const validationResult = validateEvidenceOutput(
      evaluationData.criteria,
      rubric.criteria,
      resume_text
    );

    // Rule: "If verification fails, return manual_review without a score.
    // Never silently downgrade, fabricate, or repair evidence."
    if (!validationResult.valid) {
      return NextResponse.json({
        candidate_id, // Attached from original request
        status: 'manual_review',
        summary: evaluationData.summary,
        criteria: evaluationData.criteria,
        error_message: `Evidence verification failed: ${validationResult.reason}. Flagged for manual recruiter review.`,
        missing_information: evaluationData.missing_information,
        interview_questions: evaluationData.interview_questions,
      });
    }

    // 7. Calculate Evidence Score in TypeScript only
    let evidence_score: number;
    try {
      evidence_score = calculateEvidenceScore(evaluationData.criteria, rubric.criteria);
    } catch (err: any) {
      return NextResponse.json({
        candidate_id,
        status: 'manual_review',
        summary: evaluationData.summary,
        criteria: evaluationData.criteria,
        error_message: `Scoring calculation error: ${err.message}. Flagged for manual recruiter review.`,
      });
    }

    // 8. Return successfully completed evaluation
    return NextResponse.json({
      candidate_id, // Attached from original request; never trust model
      status: 'complete',
      summary: evaluationData.summary,
      criteria: evaluationData.criteria,
      evidence_score,
      missing_information: evaluationData.missing_information,
      interview_questions: evaluationData.interview_questions,
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
          message: 'An unexpected error occurred during candidate evaluation.',
          retryable: false,
        },
      },
      { status: 500 }
    );
  }
}

/**
 * Server-side Demo Access Code verification.
 *
 * Prototype protection check: validates that the incoming request supplies
 * the configured DEMO_ACCESS_CODE.
 *
 * NOTE: This is prototype protection to prevent unauthorized consumption
 * of model API quotas, not an enterprise authentication / RBAC system.
 */
export function verifyDemoAccessCode(providedCode: string | null | undefined): {
  authorized: boolean;
  message?: string;
} {
  const serverCode = process.env.DEMO_ACCESS_CODE;

  // If no DEMO_ACCESS_CODE is configured on server, access is allowed by default or rejected?
  // User spec: "Never invent API credentials. Validate the demo access code on every real API request."
  if (!serverCode) {
    return {
      authorized: false,
      message: 'Server DEMO_ACCESS_CODE environment variable is not configured.',
    };
  }

  if (!providedCode || providedCode.trim() !== serverCode.trim()) {
    return {
      authorized: false,
      message: 'Invalid or missing demo access code. Please enter the correct code.',
    };
  }

  return { authorized: true };
}

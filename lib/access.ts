/**
 * Access verification: Direct live mode enabled without demo code gate.
 */
export function verifyDemoAccessCode(_providedCode?: string | null): {
  authorized: boolean;
  message?: string;
} {
  return { authorized: true };
}

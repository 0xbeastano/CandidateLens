import { RankedCandidate } from './types';

/**
 * Sanitizes cell values to prevent CSV formula injection (CSV Injection / CWE-1236).
 *
 * If a field begins with `=`, `+`, `-`, `@`, `\t`, or `\r`, spreadsheet applications
 * (Excel, Google Sheets, LibreOffice Calc) may interpret it as a formula or executable command.
 * We prefix such values with an apostrophe `'` to force string interpretation.
 */
export function sanitizeForCsv(value: string | number | null | undefined): string {
  if (value === null || value === undefined) {
    return '';
  }
  let str = String(value);

  // Strip or replace carriage returns
  str = str.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  // Check for formula trigger characters
  if (/^[=+\-@\t\r]/.test(str)) {
    str = `'${str}`;
  }

  // Escape double quotes by doubling them
  const escaped = str.replace(/"/g, '""');

  // If contains commas, newlines, quotes, or semicolons (regional CSV delimiter), wrap in quotes
  if (/[",\n;]/.test(escaped) || str.startsWith("'")) {
    return `"${escaped}"`;
  }

  return escaped;
}

/**
 * Generates RFC 4180-compliant CSV string for candidate evaluation summary.
 * Fields: rank, filename, evidence_score, summary, missing_information
 */
export function generateCandidateSummaryCsv(rankedCandidates: RankedCandidate[]): string {
  const headers = ['rank', 'filename', 'evidence_score', 'summary', 'missing_information'];

  const rows = rankedCandidates.map((c) => {
    const missingInfoText = c.missing_information && c.missing_information.length > 0
      ? c.missing_information.join('; ')
      : 'None identified';

    return [
      sanitizeForCsv(c.rank),
      sanitizeForCsv(c.filename),
      sanitizeForCsv(c.evidence_score),
      sanitizeForCsv(c.summary),
      sanitizeForCsv(missingInfoText),
    ].join(',');
  });

  return [headers.join(','), ...rows].join('\r\n');
}

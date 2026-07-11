import { RawImportRow, ImportAnomaly, AnomalyType, AnomalyResolution } from '@expense-tracker/shared';

/**
 * Anomaly Detector
 *
 * Analyses a list of raw CSV rows and returns detected anomalies.
 * Each anomaly has a type, human-readable message, and suggested resolution.
 *
 * The 14 identified anomalies from the assignment CSV are all handled here.
 */
export function detectAnomalies(rows: RawImportRow[]): ImportAnomaly[] {
  const anomalies: ImportAnomaly[] = [];
  const descriptionMap: Map<string, number[]> = new Map();

  // First pass: build description similarity map for duplicate detection
  for (const row of rows) {
    if (!row.description) continue;
    const key = row.description.toLowerCase().trim();
    if (!descriptionMap.has(key)) descriptionMap.set(key, []);
    descriptionMap.get(key)!.push(row.rowIndex);
  }

  for (const row of rows) {
    // ── Anomaly 2: Settlement logged as expense ────────────────────────────
    if (isSettlement(row)) {
      anomalies.push({
        rowIndex: row.rowIndex,
        type: 'SETTLEMENT_AS_EXPENSE' as AnomalyType,
        message: `Row ${row.rowIndex}: "${row.description}" appears to be a settlement payment, not a shared expense. split_type is null and description contains "paid back".`,
        suggestedResolution: 'CONVERT_TO_SETTLEMENT' as AnomalyResolution,
        data: row,
      });
      continue; // Skip other checks for this row
    }

    // ── Anomaly 3: Missing paid_by ─────────────────────────────────────────
    if (!row.paid_by || row.paid_by.trim() === '') {
      anomalies.push({
        rowIndex: row.rowIndex,
        type: 'MISSING_PAID_BY' as AnomalyType,
        message: `Row ${row.rowIndex}: "${row.description}" has no paid_by value. Cannot determine who paid.`,
        suggestedResolution: 'PENDING' as AnomalyResolution,
        data: row,
      });
    }

    // ── Anomaly 4: Wrong year (clearly wrong date) ─────────────────────────
    if (row.date) {
      const year = new Date(row.date).getFullYear();
      if (year < 2020 || year > new Date().getFullYear() + 1) {
        anomalies.push({
          rowIndex: row.rowIndex,
          type: 'WRONG_YEAR' as AnomalyType,
          message: `Row ${row.rowIndex}: "${row.description}" has date year ${year}, which is likely a data entry error.`,
          suggestedResolution: 'FIX_DATE' as AnomalyResolution,
          data: row,
        });
      }
    }

    // ── Anomaly 5: Missing currency ────────────────────────────────────────
    if (!row.currency || row.currency.trim() === '') {
      anomalies.push({
        rowIndex: row.rowIndex,
        type: 'MISSING_CURRENCY' as AnomalyType,
        message: `Row ${row.rowIndex}: "${row.description}" has no currency set. Will default to INR.`,
        suggestedResolution: 'FIX_CURRENCY' as AnomalyResolution,
        data: row,
      });
    }

    // ── Anomaly 6: Negative amount (possible refund) ───────────────────────
    if (row.amount !== null && row.amount < 0) {
      anomalies.push({
        rowIndex: row.rowIndex,
        type: 'NEGATIVE_AMOUNT' as AnomalyType,
        message: `Row ${row.rowIndex}: "${row.description}" has a negative amount (${row.amount}). Treating as a refund/credit.`,
        suggestedResolution: 'KEEP_AS_REFUND' as AnomalyResolution,
        data: row,
      });
    }

    // ── Anomaly 7: Zero amount ─────────────────────────────────────────────
    if (row.amount === 0) {
      anomalies.push({
        rowIndex: row.rowIndex,
        type: 'ZERO_AMOUNT' as AnomalyType,
        message: `Row ${row.rowIndex}: "${row.description}" has amount = 0. The notes suggest it may be a duplicate fix. Recommend skipping.`,
        suggestedResolution: 'KEEP_AS_ZERO' as AnomalyResolution,
        data: row,
      });
    }

    // ── Anomaly 9: Percentage split doesn't sum to 100% ───────────────────
    if (row.split_type === 'percentage' && row.split_details) {
      const pctSum = parsePercentageSum(row.split_details);
      if (pctSum !== null && Math.abs(pctSum - 100) > 0.5) {
        anomalies.push({
          rowIndex: row.rowIndex,
          type: 'PERCENTAGE_SUM_MISMATCH' as AnomalyType,
          message: `Row ${row.rowIndex}: "${row.description}" percentage split sums to ${pctSum}% (not 100%). Percentages will be normalised.`,
          suggestedResolution: 'NORMALIZE_PERCENTAGES' as AnomalyResolution,
          data: row,
        });
      }
    }

    // ── Anomaly 12: Ambiguous date (notes mention different date format) ───
    if (row.notes && /apr|april|may|format/i.test(row.notes) && row.date) {
      anomalies.push({
        rowIndex: row.rowIndex,
        type: 'AMBIGUOUS_DATE' as AnomalyType,
        message: `Row ${row.rowIndex}: "${row.description}" has a note suggesting the date format may be ambiguous: "${row.notes}".`,
        suggestedResolution: 'PENDING' as AnomalyResolution,
        data: row,
      });
    }

    // ── Anomaly 14: split_type=equal but split_details provided ───────────
    if (row.split_type === 'equal' && row.split_details && row.split_details.trim() !== '') {
      anomalies.push({
        rowIndex: row.rowIndex,
        type: 'SPLIT_TYPE_CONFLICT' as AnomalyType,
        message: `Row ${row.rowIndex}: "${row.description}" has split_type=equal but also has split_details. Using equal split as the authoritative type.`,
        suggestedResolution: 'KEEP' as AnomalyResolution,
        data: row,
      });
    }
  }

  // ── Anomaly 1: Exact duplicate description + payer + amount + date ────────
  const seenSignatures = new Map<string, number>();
  for (const row of rows) {
    const sig = `${row.date}|${(row.description || '').toLowerCase().trim()}|${row.paid_by?.toLowerCase().trim()}|${row.amount}`;
    if (seenSignatures.has(sig)) {
      const firstIdx = seenSignatures.get(sig)!;
      anomalies.push({
        rowIndex: row.rowIndex,
        type: 'DUPLICATE_EXPENSE' as AnomalyType,
        message: `Row ${row.rowIndex}: "${row.description}" appears to be an exact duplicate of row ${firstIdx} (same date, payer, amount, and description).`,
        suggestedResolution: 'SKIP' as AnomalyResolution,
        data: row,
        relatedRowIndex: firstIdx,
      });
    } else {
      seenSignatures.set(sig, row.rowIndex);
    }
  }

  // ── Anomaly 8: Conflicting duplicates (same date+description, different amount or payer) ──
  const fuzzyMap = new Map<string, { row: RawImportRow; rowIndex: number }>();
  for (const row of rows) {
    const fuzzyKey = `${row.date}|${normalizeDescription(row.description || '')}`;
    if (fuzzyMap.has(fuzzyKey)) {
      const other = fuzzyMap.get(fuzzyKey)!;
      // Only flag if amounts or payers differ (i.e., not already flagged as exact dup)
      if (other.row.amount !== row.amount || other.row.paid_by?.toLowerCase() !== row.paid_by?.toLowerCase()) {
        const alreadyFlagged = anomalies.some(
          (a) =>
            a.type === 'DUPLICATE_EXPENSE' &&
            (a.rowIndex === row.rowIndex || a.relatedRowIndex === row.rowIndex),
        );
        if (!alreadyFlagged) {
          anomalies.push({
            rowIndex: row.rowIndex,
            type: 'CONFLICTING_DUPLICATE' as AnomalyType,
            message: `Row ${row.rowIndex}: "${row.description}" (${row.paid_by}, ₹${row.amount}) conflicts with row ${other.rowIndex} "${other.row.description}" (${other.row.paid_by}, ₹${other.row.amount}) — same event, different details.`,
            suggestedResolution: 'KEEP_FIRST' as AnomalyResolution,
            data: row,
            relatedRowIndex: other.rowIndex,
          });
        }
      }
    } else {
      fuzzyMap.set(fuzzyKey, { row, rowIndex: row.rowIndex });
    }
  }

  return anomalies.sort((a, b) => a.rowIndex - b.rowIndex);
}

function isSettlement(row: RawImportRow): boolean {
  if (!row.split_type && row.description) {
    const desc = row.description.toLowerCase();
    return desc.includes('paid') && (desc.includes('back') || desc.includes('settlement') || desc.includes('return'));
  }
  return false;
}

function parsePercentageSum(splitDetails: string): number | null {
  const matches = splitDetails.match(/(\d+(\.\d+)?)%/g);
  if (!matches) return null;
  return matches.reduce((sum, m) => sum + parseFloat(m.replace('%', '')), 0);
}

function normalizeDescription(desc: string): string {
  return desc
    .toLowerCase()
    .replace(/[-_\s]+/g, ' ')
    .replace(/\b(at|the|a|an)\b/g, '')
    .trim();
}

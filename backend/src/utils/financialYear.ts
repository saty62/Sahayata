/**
 * Utility to calculate Indian Financial Year (April 1 - March 31)
 * Example: Date in Nov 2026 => "2026-27"
 * Key format: "FY2026-27"
 */
export function getFinancialYearString(date: Date = new Date()): string {
  const month = date.getMonth(); // 0-indexed: 0 = Jan, 3 = Apr
  const year = date.getFullYear();

  if (month >= 3) {
    // April to December
    const startYear = year;
    const endYear = (year + 1) % 100;
    return `${startYear}-${endYear.toString().padStart(2, '0')}`;
  } else {
    // January to March
    const startYear = year - 1;
    const endYear = year % 100;
    return `${startYear}-${endYear.toString().padStart(2, '0')}`;
  }
}

export function getFinancialYearCounterKey(date: Date = new Date()): string {
  return `FY${getFinancialYearString(date)}`;
}

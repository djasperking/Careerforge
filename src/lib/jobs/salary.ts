/**
 * Turns a free-text salary ("$20 – $22 per hour", "USD 50k-70k / year", "₦300,000 monthly")
 * into Google's JobPosting `baseSalary`. Returns null when the amount, currency or
 * pay period cannot be read with confidence, so nothing is ever invented.
 */

const SYMBOLS: Record<string, string> = { "$": "USD", "£": "GBP", "€": "EUR", "₦": "NGN" };
const CODE = /\b(USD|NGN|GBP|EUR|CAD|AUD|KES|GHS|ZAR)\b/i;
const UNITS: [RegExp, "HOUR" | "DAY" | "WEEK" | "MONTH" | "YEAR"][] = [
  [/\b(?:per|a|an|\/|ph\b)?\s*(?:hour|hourly|hr)\b|\/\s*h\b/i, "HOUR"],
  [/\b(?:per\s)?(?:day|daily)\b/i, "DAY"],
  [/\b(?:per\s)?(?:week|weekly|wk)\b/i, "WEEK"],
  [/\b(?:per\s)?(?:month|monthly|mo)\b/i, "MONTH"],
  [/\b(?:per\s)?(?:year|yearly|annum|annual|annually|yr|pa)\b/i, "YEAR"],
];

function amount(token: string): number {
  const k = /k$/i.test(token);
  const n = Number(token.replace(/[^\d.]/g, "").replace(/\.(?=.*\.)/g, ""));
  return k ? n * 1000 : n;
}

export interface BaseSalary {
  "@type": "MonetaryAmount";
  currency: string;
  value: { "@type": "QuantitativeValue"; minValue: number; maxValue?: number; unitText: string };
}

export function salaryToSchema(text: string | null | undefined): BaseSalary | null {
  const t = (text ?? "").trim();
  if (!t) return null;

  const symbol = (t.match(/[$£€₦]/) ?? [])[0];
  const code = t.match(CODE)?.[1]?.toUpperCase();
  const currency = code ?? (symbol ? SYMBOLS[symbol] : undefined);
  if (!currency) return null;

  const nums = [...t.matchAll(/\d[\d,]*(?:\.\d+)?\s?k?\b/gi)].map((m) => amount(m[0].trim())).filter((n) => n > 0);
  if (nums.length === 0) return null;

  // No pay period written: small amounts (under 300) are almost always hourly rates. Anything else is left out.
  const unit = UNITS.find(([re]) => re.test(t))?.[1] ?? (Math.max(...nums) < 300 ? "HOUR" : undefined);
  if (!unit) return null;

  const min = Math.min(nums[0], nums[1] ?? nums[0]);
  const max = nums[1] !== undefined ? Math.max(nums[0], nums[1]) : undefined;
  return {
    "@type": "MonetaryAmount",
    currency,
    value: { "@type": "QuantitativeValue", minValue: min, ...(max !== undefined && max !== min ? { maxValue: max } : {}), unitText: unit },
  };
}

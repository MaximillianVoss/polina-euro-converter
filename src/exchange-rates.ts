const endpoint = 'https://api.apilayer.com/exchangerates_data/latest?base=EUR';

export type Rates = Readonly<Record<string, number>>;

export type RatesResult =
  | { readonly ok: true; readonly rates: Rates }
  | { readonly ok: false; readonly error: string };

export type ConversionResult =
  | { readonly ok: true; readonly value: number }
  | { readonly ok: false; readonly error: string };

export type FetchResponse = Readonly<{
  ok: boolean;
  json: () => Promise<unknown>;
}>;

export type FetchImplementation = (
  input: string,
  init?: RequestInit,
) => Promise<FetchResponse>;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function parseRates(payload: unknown): Rates | null {
  if (!isRecord(payload) || !isRecord(payload.rates)) {
    return null;
  }

  const entries = Object.entries(payload.rates);
  if (entries.length === 0) {
    return null;
  }

  const rates: Record<string, number> = {};
  for (const [code, rate] of entries) {
    if (code.trim() === '' || typeof rate !== 'number' || !Number.isFinite(rate) || rate <= 0) {
      return null;
    }
    rates[code] = rate;
  }

  return rates;
}

export function currencyCodes(rates: Rates): string[] {
  return Object.keys(rates).sort();
}

export async function fetchEuroRates(
  apiKey: string | undefined,
  fetchImpl: FetchImplementation = fetch,
): Promise<RatesResult> {
  const normalizedApiKey = apiKey?.trim();
  if (!normalizedApiKey) {
    return { ok: false, error: 'Add EXPO_PUBLIC_EXCHANGE_RATES_API_KEY to .env.' };
  }

  try {
    const response = await fetchImpl(endpoint, {
      headers: { apikey: normalizedApiKey },
    });
    if (!response.ok) {
      return { ok: false, error: 'Could not load rates. Check the API key and connection.' };
    }

    const payload: unknown = await response.json();
    const rates = parseRates(payload);
    return rates
      ? { ok: true, rates }
      : { ok: false, error: 'The rates response is invalid.' };
  } catch {
    return { ok: false, error: 'Could not load rates. Check the API key and connection.' };
  }
}

export function convertToEuro(
  amountText: string,
  currency: string,
  rates: Rates,
): ConversionResult {
  const normalized = amountText.trim().replace(',', '.');
  const amount = Number(normalized);
  if (normalized === '' || !Number.isFinite(amount)) {
    return { ok: false, error: 'Enter a valid amount.' };
  }

  const rate = rates[currency];
  if (!Number.isFinite(rate) || rate <= 0) {
    return { ok: false, error: 'The selected currency has no rate.' };
  }

  return { ok: true, value: amount / rate };
}

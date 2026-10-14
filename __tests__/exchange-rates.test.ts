import {
  convertToEuro,
  currencyCodes,
  fetchEuroRates,
  type FetchImplementation,
  type FetchResponse,
} from '../src/exchange-rates';

function response(payload: unknown, ok = true): FetchResponse {
  return { ok, json: async (): Promise<unknown> => payload };
}

test('loads validated numeric rates with the APILayer apikey header', async () => {
  const fetchImpl = jest.fn<Promise<FetchResponse>, Parameters<FetchImplementation>>();
  fetchImpl.mockResolvedValue(response({ rates: { USD: 1.25, EUR: 1 } }));

  await expect(fetchEuroRates('test-key', fetchImpl)).resolves.toEqual({
    ok: true,
    rates: { USD: 1.25, EUR: 1 },
  });
  expect(fetchImpl).toHaveBeenCalledWith(
    'https://api.apilayer.com/exchangerates_data/latest?base=EUR',
    { headers: { apikey: 'test-key' } },
  );
});

test.each<unknown>([
  null,
  {},
  { rates: null },
  { rates: [] },
  { rates: {} },
  { rates: { USD: '1.25' } },
  { rates: { USD: -1 } },
])('rejects an invalid rates payload: %p', async (payload) => {
  const fetchImpl = jest.fn<Promise<FetchResponse>, Parameters<FetchImplementation>>();
  fetchImpl.mockResolvedValue(response(payload));

  await expect(fetchEuroRates('test-key', fetchImpl)).resolves.toEqual({
    ok: false,
    error: 'The rates response is invalid.',
  });
});

test('reports absent credentials before making a request', async () => {
  const fetchImpl = jest.fn<Promise<FetchResponse>, Parameters<FetchImplementation>>();

  await expect(fetchEuroRates(undefined, fetchImpl)).resolves.toEqual({
    ok: false,
    error: 'Add EXPO_PUBLIC_EXCHANGE_RATES_API_KEY to .env.',
  });
  expect(fetchImpl).not.toHaveBeenCalled();
});

test('reports an HTTP or network error', async () => {
  const httpFetch = jest.fn<Promise<FetchResponse>, Parameters<FetchImplementation>>();
  httpFetch.mockResolvedValue(response({}, false));
  const offlineFetch = jest.fn<Promise<FetchResponse>, Parameters<FetchImplementation>>();
  offlineFetch.mockRejectedValue(new Error('offline'));

  await expect(fetchEuroRates('test-key', httpFetch)).resolves.toEqual({
    ok: false,
    error: 'Could not load rates. Check the API key and connection.',
  });
  await expect(fetchEuroRates('test-key', offlineFetch)).resolves.toEqual({
    ok: false,
    error: 'Could not load rates. Check the API key and connection.',
  });
});

test('sorts currency codes and converts comma decimals using the EUR-base rate', () => {
  const rates = { USD: 1.25, EUR: 1 };

  expect(currencyCodes(rates)).toEqual(['EUR', 'USD']);
  expect(convertToEuro('125,50', 'USD', rates)).toEqual({ ok: true, value: 100.4 });
});

test.each([
  ['', 'USD', { USD: 1.25 }],
  ['x', 'USD', { USD: 1.25 }],
  ['20', 'GBP', { USD: 1.25 }],
])('rejects an invalid conversion input', (amount, currency, rates) => {
  expect(convertToEuro(amount, currency, rates)).toEqual(
    amount === '' || amount === 'x'
      ? { ok: false, error: 'Enter a valid amount.' }
      : { ok: false, error: 'The selected currency has no rate.' },
  );
});

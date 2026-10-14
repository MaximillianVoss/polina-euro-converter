import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import App from '../App';
import type { FetchImplementation, FetchResponse } from '../src/exchange-rates';

function response(payload: unknown, ok = true): FetchResponse {
  return { ok, json: async (): Promise<unknown> => payload };
}

const apiKeyName: string = 'EXPO_PUBLIC_EXCHANGE_RATES_API_KEY';

beforeEach(() => {
  process.env[apiKeyName] = 'test-key';
});

afterEach(() => {
  delete process.env[apiKeyName];
});

test('loads picker codes and converts USD to EUR', async () => {
  const fetchImpl = jest.fn<Promise<FetchResponse>, Parameters<FetchImplementation>>();
  fetchImpl.mockResolvedValue(response({ rates: { USD: 1.25, EUR: 1 } }));
  const ui = render(<App fetchImpl={fetchImpl} />);

  expect(ui.getByText('Loading rates…')).toHaveProp('accessibilityLiveRegion', 'polite');
  await waitFor(() => expect(ui.getByLabelText('Currency picker')).toBeTruthy());
  fireEvent(ui.getByLabelText('Currency picker'), 'valueChange', 'USD');
  fireEvent.changeText(ui.getByLabelText('Amount'), '125,5');
  fireEvent.press(ui.getByRole('button', { name: 'CONVERT TO EUR' }));

  expect(ui.getByLabelText('Conversion result')).toHaveTextContent('100.40 EUR');
});

test('shows an accessible missing-key error without requesting rates', async () => {
  delete process.env[apiKeyName];
  const fetchImpl = jest.fn<Promise<FetchResponse>, Parameters<FetchImplementation>>();
  const ui = render(<App fetchImpl={fetchImpl} />);

  await waitFor(() => expect(ui.getByRole('alert', { name: 'Converter error' })).toHaveTextContent(
    'Add EXPO_PUBLIC_EXCHANGE_RATES_API_KEY to .env.',
  ));
  expect(fetchImpl).not.toHaveBeenCalled();
});

test('shows an accessible error when the API returns no usable rates', async () => {
  const fetchImpl = jest.fn<Promise<FetchResponse>, Parameters<FetchImplementation>>();
  fetchImpl.mockResolvedValue(response({ rates: {} }));
  const ui = render(<App fetchImpl={fetchImpl} />);

  await waitFor(() => expect(ui.getByRole('alert', { name: 'Converter error' })).toHaveTextContent(
    'The rates response is invalid.',
  ));
  expect(ui.queryByLabelText('Currency picker')).not.toBeOnTheScreen();
  expect(ui.getByRole('button', { name: 'CONVERT TO EUR' })).toBeDisabled();
});

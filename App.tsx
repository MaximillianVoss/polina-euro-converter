import { useEffect, useState } from 'react';
import { Button, Text, TextInput, View } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import {
  convertToEuro,
  currencyCodes,
  fetchEuroRates,
  type FetchImplementation,
  type Rates,
} from './src/exchange-rates';

type AppProps = Readonly<{
  fetchImpl?: FetchImplementation;
}>;

export default function App({ fetchImpl }: AppProps): React.JSX.Element {
  const [amount, setAmount] = useState<string>('');
  const [rates, setRates] = useState<Rates | null>(null);
  const [codes, setCodes] = useState<string[]>([]);
  const [currency, setCurrency] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [result, setResult] = useState<string>('');

  useEffect(() => {
    async function loadRates(): Promise<void> {
      const rawApiKey: unknown = process.env.EXPO_PUBLIC_EXCHANGE_RATES_API_KEY;
      const apiKey = typeof rawApiKey === 'string' ? rawApiKey.trim() : undefined;
      const response = await fetchEuroRates(apiKey, fetchImpl);

      setLoading(false);
      if (!response.ok) {
        setErrorMessage(response.error);
        return;
      }

      const nextCodes = currencyCodes(response.rates);
      setRates(response.rates);
      setCodes(nextCodes);
      setCurrency(nextCodes[0] ?? '');
    }

    void loadRates();
  }, [fetchImpl]);

  function convert(): void {
    const conversion = convertToEuro(amount, currency, rates ?? {});
    if (!conversion.ok) {
      setErrorMessage(conversion.error);
      return;
    }

    setErrorMessage('');
    setResult(`${conversion.value.toFixed(2)} EUR`);
  }

  return (
    <View style={{ gap: 12, padding: 16 }}>
      <Text>Amount</Text>
      <TextInput
        accessibilityLabel="Amount"
        keyboardType="decimal-pad"
        placeholder="e.g. 125.50"
        value={amount}
        onChangeText={setAmount}
      />
      {loading ? <Text accessibilityLiveRegion="polite">Loading rates…</Text> : null}
      {codes.length > 0 ? (
        <Picker<string>
          accessibilityLabel="Currency picker"
          selectedValue={currency}
          onValueChange={(value: string): void => setCurrency(value)}
        >
          {codes.map((code) => <Picker.Item key={code} label={code} value={code} />)}
        </Picker>
      ) : null}
      <Button title="CONVERT TO EUR" disabled={loading || rates === null} onPress={convert} />
      {errorMessage ? (
        <Text
          accessibilityLabel="Converter error"
          accessibilityRole="alert"
          accessibilityLiveRegion="assertive"
        >
          {errorMessage}
        </Text>
      ) : null}
      {result ? (
        <Text accessibilityLabel="Conversion result" accessibilityLiveRegion="polite">
          {result}
        </Text>
      ) : null}
    </View>
  );
}

# Euro Converter

## Условие и результат

**Original:** load currency rates from APILayer and convert a selected currency to EUR.  
**Перевод:** загрузить курсы APILayer и конвертировать выбранную валюту в евро.

При запуске загружаются коды из `rates`, сортируются и заполняют Picker. Endpoint: `https://api.apilayer.com/exchangerates_data/latest?base=EUR`; ключ передаётся в заголовке `apikey`. Для EUR-base ответов используется формула `amount / rates[currency]`.

## Установка на macOS

Скопировать `.env.example` в `.env` и вписать собственный учебный ключ; файл `.env` игнорируется. Затем выполнить `npm ci`, `npm run typecheck`, `npm test -- --runInBand`, `npx expo-doctor`, `npm run export:web`, `npx expo start`.

## Безопасность и реализация

`EXPO_PUBLIC_` попадает в клиентский bundle: это приемлемо только для учебной работы. В production ключ хранится за backend/proxy. `src/exchange-rates.ts` принимает внедряемый `fetchImpl`, отклоняет пустой или некорректный rates и конвертирует десятичную запятую; тесты не используют сеть и не содержат настоящего ключа. `App.tsx` сохраняет последний успешный результат при ошибке следующего действия и объявляет загрузку/результат через polite live region, а ошибки — как alert. Web export поддержан зависимостями `react-dom` и `react-native-web`.

## Проверка и защита

Проверить USD `125,5`, неверную сумму, отсутствующий ключ и ошибку сети.  
Вопрос: «Почему деление?» Ответ: один EUR соответствует rate единиц выбранной валюты, поэтому обратное преобразование делит сумму на курс.  
Question: “Why use a Picker?” Answer: it prevents arbitrary currency codes and reflects the loaded API data.

## Сдача

Не добавлять `.env` в Git. Повторить команды проверки, затем с ключом ученицы показать обычную конвертацию и обработку ошибки.

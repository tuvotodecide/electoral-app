// Mock for expo-localization
export const getLocales = jest.fn(() => [
  {
    languageCode: 'en',
    languageTag: 'en-US',
    regionCode: 'US',
    textDirection: 'ltr',
    decimalSeparator: '.',
    digitGroupingSeparator: ',',
    measurementSystem: 'us',
    currencyCode: 'USD',
    temperatureUnit: 'fahrenheit',
  },
]);

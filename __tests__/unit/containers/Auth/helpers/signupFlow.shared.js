jest.mock('react-native-country-picker-modal', () => {
  const React = require('react');
  const {View} = require('react-native');

  const MockCountryPicker = () => React.createElement(View, {testID: 'mockCountryPicker'});

  return {
    __esModule: true,
    default: MockCountryPicker,
    FlagButton: () => React.createElement(View, {testID: 'mockFlagButton'}),
    DARK_THEME: {},
    DEFAULT_THEME: {},
  };
});

jest.mock('react-native-otp-textinput', () => {
  const React = require('react');
  const {TextInput} = require('react-native');

  return ({testID, handleTextChange, inputCount, secureTextEntry}) =>
    React.createElement(TextInput, {
      testID: testID || 'otpInput',
      onChangeText: handleTextChange,
      maxLength: inputCount,
      secureTextEntry,
    });
});

export const limpiarMocksSignup = () => {
  jest.clearAllMocks();
};

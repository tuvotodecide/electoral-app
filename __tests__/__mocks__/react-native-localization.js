// Mock para react-native-localization
export default class LocalizedStrings {
  constructor(props) {
    this._props = props;
    this._language = 'en';
    this.setLanguage(this._language);
  }

  setLanguage(language) {
    this._language = language;
    if (this._props[language]) {
      for (const key in this._props[language]) {
        this[key] = this._props[language][key];
      }
    }
  }

  getLanguage() {
    return this._language;
  }

  formatString(str, ...values) {
    return str.replace(/{(\d+)}/g, (match, index) => {
      return values[index] !== undefined ? values[index] : match;
    });
  }
}
import * as Localization from 'expo-localization';
import enI18n from './en';

const translations = {
  en: enI18n,
};

const deviceLanguage = Localization.getLocales()?.[0]?.languageCode || 'en';
const strings = translations[deviceLanguage] || translations.en;

export default strings;

import { IntlMessageFormat } from 'intl-messageformat';

import { languages } from './languageImports';

const DEFAULT_LANG = 'en';

function getTranslatedString(key: string, lang: string): string | undefined {
  try {
    return key.split('.').reduce((o, i) => (o as Record<string, unknown>)[i], languages[lang]) as string;
    //eslint-disable-next-line
  } catch (_) {
    return undefined;
  }
}

export default function setupTranslation(selectedLang?: string) {
  return function (key: string, argObject: Record<string, any> = {}) {
    const lang = selectedLang ?? DEFAULT_LANG;

    let translated = getTranslatedString(key, lang);
    if (!translated) translated = getTranslatedString(key, DEFAULT_LANG);
    if (!translated) return key;
    try {
      const translatedMessage = new IntlMessageFormat(translated, lang);
      return translatedMessage.format<string>(argObject) as string;
    } catch (e) {
      console.error(`Error formatting message for key "${key}" with lang "${lang}":`, e);
      return translated;
    }
  };
}

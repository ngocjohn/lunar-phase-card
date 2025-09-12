/* eslint-disable */
import { languages, languageOptions } from './languageImports';

export { languageOptions };

function getTranslatedString(key: string, lang: string): string | undefined {
  try {
    return key.split('.').reduce((o, i) => (o as Record<string, unknown>)[i], languages[lang]) as string;
  } catch (e) {
    return undefined;
  }
}
export function localize(string: string, lang: string, search = '', replace = ''): string {
  let translated = getTranslatedString(string, lang);
  if (!translated) translated = getTranslatedString(string, 'en');
  if (!translated) translated = string;

  if (search !== '' && replace !== '') {
    translated = translated.replace(search, replace);
  }
  return translated;
}
// export function localize(string: string, lang: string, search = '', replace = ''): string {
//   const language = lang.replace(/['"]+/g, '').replace('-', '_');

//   let translated: string;

//   try {
//     translated = string.split('.').reduce((o, i) => o[i], languages[language]);
//   } catch (e) {
//     translated = string.split('.').reduce((o, i) => o[i], languages['en']);
//   }

//   if (translated === undefined || translated === '')
//     translated = string.split('.').reduce((o, i) => o[i], languages['en']);

//   if (search !== '' && replace !== '') {
//     translated = translated.replace(search, replace);
//   }
//   return translated;
// }

export function dayFormatter(day: number, lang: string): string {
  const dayFormat = new Intl.RelativeTimeFormat(lang, { numeric: 'auto' });
  return dayFormat.format(day, 'day');
}

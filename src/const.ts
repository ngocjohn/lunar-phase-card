import { version, repository } from '../package.json';
import { FontSizeOptions, FontTextTransformOptions } from './types';

export const REPOSITORY = repository.repo;
export const CARD_VERSION = `v${version}`;
export const BASE_REFRESH_INTERVAL = 60 * 1000; // 1 minute

import background from './images/bkg.png';

export const BACKGROUND = background;

export const FONTSIZES: FontSizeOptions[] = ['auto', 'small', 'medium', 'large', 'x-large', 'xx-large'];
export const FONTSTYLES: FontTextTransformOptions[] = ['none', 'capitalize', 'uppercase', 'lowercase'];

export const FONTCOLORS: string[] = [
  'white',
  'black',
  'red',
  'green',
  'blue',
  'yellow',
  'orange',
  'purple',
  'pink',
  'brown',
  'gray',
];

export const enum CurrentPage {
  CALENDAR = 'calendar',
  BASE = 'base',
  HORIZON = 'horizon',
}

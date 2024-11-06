import {
  mdiCalendarMonthOutline,
  mdiCalendarSearch,
  mdiChartBellCurve,
  mdiChevronLeft,
  mdiChevronRight,
  mdiMoonFull,
  mdiMoonNew,
  mdiRestore,
  mdiWeatherNight,
} from '@mdi/js';

import { version, repository } from '../package.json';
import { FontSizeOptions, FontTextTransformOptions } from './types';

export const BASE_BACKGROUND_URL =
  'https://raw.githubusercontent.com/ngocjohn/lunar-phase-card/refs/heads/main/assets/card-bkg.png';

export const REPOSITORY = repository.repo;
export const CARD_VERSION = `v${version}`;
export const BASE_REFRESH_INTERVAL = 15 * 1000;

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

export const enum PageType {
  CALENDAR = 'calendar',
  BASE = 'base',
  HORIZON = 'horizon',
}

export const enum MoonState {
  READY = 'ready',
  LOADING = 'loading',
}

export const ICON = {
  CALENDAR: mdiCalendarMonthOutline,
  SEARCH: mdiCalendarSearch,
  CHART: mdiChartBellCurve,
  LEFT: mdiChevronLeft,
  RIGHT: mdiChevronRight,
  MOONFULL: mdiMoonFull,
  MOONNEW: mdiMoonNew,
  RESTORE: mdiRestore,
  WEATHER: mdiWeatherNight,
};

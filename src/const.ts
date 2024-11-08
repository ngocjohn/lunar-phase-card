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
import background from './images/bkg.png';
import blueBackground from './images/blue-bg.png';
import { FontSizeOptions, FontTextTransformOptions } from './types';

const COMMIT_SHA = '3ae3789a888f7749545560214246cbc410502a6d';
const PIC_URL = `https://cdn.jsdelivr.net/gh/ngocjohn/lunar-phase-card@${COMMIT_SHA}/background/`;
const BACKGROUND_URL = (index: number) => `${PIC_URL}moon_bg_${index}.png`;

export const CUSTOM_BG = [blueBackground, BACKGROUND_URL(1), BACKGROUND_URL(2), BACKGROUND_URL(3), BACKGROUND_URL(4)];

export const REPOSITORY = repository.repo;
export const CARD_VERSION = `v${version}`;
export const BASE_REFRESH_INTERVAL = 15 * 1000;

export const BACKGROUND = background;
export const BLUE_BG = blueBackground;

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

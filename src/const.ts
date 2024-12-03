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

const VERSION_TAG = '1.7.3';
const PIC_URL = `https://cdn.jsdelivr.net/gh/ngocjohn/lunar-phase-card@${VERSION_TAG}/background/`;
const BACKGROUND_URL = (index: number) => `${PIC_URL}moon_bg_${index}.png`;

export const CUSTOM_BG = [blueBackground, BACKGROUND_URL(1), BACKGROUND_URL(2), BACKGROUND_URL(3)];

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

export const enum CHART_DATA {
  OFFSET_TIME = 6,
  BORDER_WIDTH_BOLD = 1.2,
  BORDER_WIDTH_LIGHT = 1,
}
// TODAY_FILL = '#316474', // green bg
// NEXTDAY_FILL = '#044258', // green bg

export const enum CHART_COLOR {
  TODAY_FILL = '#47546b', // Original
  NEXTDAY_FILL = '#3d4b63', // Original
  STROKE_LINE = '#7a8eaa',
  SECONDARY_TEXT = '#9b9b9b',
  PRIMARY_TEXT = '#e1e1e1',
  SUN_LINE_BOLD = '#f4da95',
  SUN_LINE_LIGHT = '#b4ae95',
  MOON_LINE_BOLD = '#fefffeaa',
  MOON_LINE_LIGHT = '#b9c0ca',
  MOON_SHADOW = '#161616',
  TOOLTIP_BACKGROUND = '#1f1f1f',
}

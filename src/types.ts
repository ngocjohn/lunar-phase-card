// Cutom card helpers:
import { LovelaceCardConfig, Themes, HomeAssistant, Theme } from 'custom-card-helpers';
import { HassEntity } from 'home-assistant-js-websocket';

import { PageType } from './const';

export interface ModeSpecificTheme {
  light: Partial<Theme>;
  dark: Partial<Theme>;
}

export interface ExtendedTheme extends Theme {
  modes?: ModeSpecificTheme;
}

export interface ExtendedThemes extends Themes {
  darkMode: boolean;
  default_theme: string;
  theme: string;
  themes: {
    [key: string]: ExtendedTheme;
  };
}

/**
 * HomeAssistantExtended extends the existing HomeAssistant interface with additional properties.
 */

export type HomeAssistantExtended = HomeAssistant & {
  themes: ExtendedThemes;
  formatEntityState: (stateObj: HassEntity) => string;
  formatAttributeName: (entityId: string, attribute: string) => string;
  formatEntityAttributeValue: (entityId: string, attribute: string) => string;
};

export type FontSizeOptions = 'auto' | 'small' | 'medium' | 'large' | 'x-large' | 'xx-large';
export type FontTextTransformOptions = 'none' | 'capitalize' | 'uppercase' | 'lowercase';

export interface FontCustomStyles {
  header_font_size: FontSizeOptions;
  header_font_style: FontTextTransformOptions;
  header_font_color: string;
  label_font_size: FontSizeOptions;
  label_font_style: FontTextTransformOptions;
  label_font_color: string;
  hide_label: boolean;
}
export type DefaultPage = 'calendar' | 'base' | 'horizon';

export interface HorizonGraphConfig {
  y_ticks?: boolean;
  x_ticks?: boolean;
  show_time?: boolean;
  show_current?: boolean;
  show_legend?: boolean;
  show_highest?: boolean;
  y_ticks_position?: 'left' | 'right';
  y_ticks_step_size?: number;
  legend_position?: 'top' | 'bottom';
  legend_align?: 'start' | 'center' | 'end';
  time_step_size?: number;
}

export interface LunarPhaseCardConfig extends LovelaceCardConfig {
  type: string;
  entity?: string;
  use_default?: boolean;
  use_custom?: boolean;
  use_entity?: boolean;
  show_background?: boolean;
  compact_view?: boolean;
  '12hr_format'?: boolean;
  mile_unit?: boolean;
  number_decimals?: number;
  default_card?: PageType.BASE | PageType.CALENDAR | PageType.HORIZON;
  selected_language: string;
  moon_position?: 'left' | 'right';
  southern_hemisphere?: boolean;
  latitude: number;
  longitude: number;
  font_customize: FontCustomStyles;
  graph_config?: HorizonGraphConfig;
  cardId?: string;
}

export const defaultConfig: Partial<LunarPhaseCardConfig> = {
  type: 'custom:lunar-phase-card',
  entity: '',
  use_default: true,
  use_custom: false,
  use_entity: false,
  show_background: true,
  selected_language: 'en',
  compact_view: true,
  '12hr_format': false,
  mile_unit: false,
  default_card: PageType.BASE,
  moon_position: 'left',
  southern_hemisphere: false,
  number_decimals: 2,
  graph_config: {
    y_ticks: false,
    x_ticks: true,
    show_time: true,
    show_current: true,
    show_legend: true,
    show_highest: true,
    y_ticks_position: 'left',
    y_ticks_step_size: 30,
    legend_position: 'top',
    legend_align: 'center',
    time_step_size: 30,
  },
  font_customize: {
    header_font_size: 'x-large',
    header_font_style: 'capitalize',
    header_font_color: '',
    label_font_size: 'auto',
    label_font_style: 'none',
    label_font_color: '',
    hide_label: false,
  },
};

export type Location = {
  latitude: number;
  longitude: number;
};

export type MoonDataItem = {
  label: string;
  value: string;
  secondValue?: string;
};
export type MoonImage = {
  moonPic: string;
  rotateDeg: number;
};

export interface MoonData {
  moonFraction: MoonDataItem;
  moonAge: MoonDataItem;
  moonRise: MoonDataItem;
  moonSet: MoonDataItem;
  moonHighest?: MoonDataItem;
  distance: MoonDataItem;
  azimuthDegress: MoonDataItem;
  altitudeDegrees: MoonDataItem;
  nextFullMoon: MoonDataItem;
  nextNewMoon: MoonDataItem;
  direction: MoonDataItem;
  position: MoonDataItem;
}

export type ChartColors = {
  primaryTextColor: string;
  secondaryTextColor: string;
  fillColor: string;
  fillBelowColor: string;
  fillBelowLineColor: string;
  [key: string]: string;
};

export type LocationAddress = {
  country: string;
  city: string;
};

export type SearchResults = {
  display_name: string;
  name: string;
  lat: number;
  lon: number;
};

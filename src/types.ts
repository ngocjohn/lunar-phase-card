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
  y_ticks?: boolean;
  x_ticks?: boolean;
  default_card?: PageType.BASE | PageType.CALENDAR | PageType.HORIZON;
  selected_language: string;
  moon_position?: 'left' | 'right';
  latitude: number;
  longitude: number;
  font_customize: FontCustomStyles;
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
  y_ticks: false,
  x_ticks: true,
  default_card: PageType.BASE,
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
  direction?: MoonDataItem;
  position?: MoonDataItem;
}

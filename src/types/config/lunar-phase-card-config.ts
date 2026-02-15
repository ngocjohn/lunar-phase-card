import { SECTION } from '../../const';
import { LovelaceCardConfig } from '../../ha';
import { FontCustomStyles } from './font-config';
import { GraphConfig } from './graph-config';

export type Section = SECTION.BASE | SECTION.CALENDAR | SECTION.HORIZON | SECTION.FULL_CALENDAR;

export const LOC_SOURCE = ['default', 'entity', 'custom'] as const;

export type LocationSource = (typeof LOC_SOURCE)[number];

export const COMPACT_MODE = ['default', 'minimal', 'moon-only'] as const;
export type CompactMode = (typeof COMPACT_MODE)[number];

export const MOON_POSITION = ['left', 'right', 'center'] as const;
export type MoonPosition = (typeof MOON_POSITION)[number];

export const THEME_MODE = ['auto', 'light', 'dark'] as const;
export type ThemeMode = (typeof THEME_MODE)[number];

export const HIDDEN_ITEMS = [
  'moonAge',
  'moonFraction',
  'azimuthDegress',
  'altitudeDegrees',
  'distance',
  'position',
  'moonRise',
  'moonSet',
  'moonHighest',
  'nextFullMoon',
  'nextNewMoon',
  'nextPhase',
] as const;

export type HiddenItem = (typeof HIDDEN_ITEMS)[number];

export interface LunarPhaseCardConfig extends LovelaceCardConfig {
  /**
   * Source of location for lat lon values
   * 'default' - use Home Assistant config location
   * 'custom' - use lat lon from config
   * 'entity' - use entity to pull lat lon from state attributes
   * Default is 'default'
   */
  location_source?: LocationSource;
  /**
   * Entity to use for location (if location_source is set to 'entity')
   * Lat lon will be pulled from the state attributes
   */
  entity?: string;
  /**
   * Set to true if the location is in the southern hemisphere
   * This will adjust moon phase display accordingly
   */
  southern_hemisphere?: boolean;
  /**
   * Lat & Long dynamically set by user (if location_source is set to 'custom')
   */
  latitude?: number;
  longitude?: number;
  //
  // APPEARANCE & BEHAVIOR CONFIG
  /*
    Language for the card, if not set, default 'en' will be used
  */
  language?: string;
  /*
    Section to show by default
  */
  default_section?: Section;
  /*
		Show a more compact view, hiding some details
	*/
  compact_view?: boolean;
  compact_mode?: CompactMode;
  /*
  Size of the moon image in compact view (only applicable for 'moon-only' compact mode)
  Default is 100 (representing 100% of the original size)
  */
  moon_size?: number;
  /*
   * Position of the moon phase image on base section
   */
  moon_position?: MoonPosition;
  /*
   * Show or hide card background
   */
  hide_background?: boolean;
  /**
   * Custom background image url
   */
  custom_background?: string;
  /**
   * Hide star field background
   */
  hide_starfield?: boolean;
  /**
   * Hide menu button to switch between sections
   */
  hide_buttons?: boolean;
  /**
   * Compack menu button style
   */
  compact_menu_button?: boolean;
  /**
   * Hide label in compact view
   */
  hide_compact_label?: boolean;
  /**
   * Use a modal popup for calendar section
   */
  calendar_modal?: boolean;
  /**
   * Custom theme name for the card
   */
  custom_theme?: string;
  /**
   * Theme mode for the card: auto, light, dark
   * Default is 'auto'
   */
  theme_mode?: ThemeMode;
  //
  // LAYOUT & DATA VISUALIZATION CONFIG
  /**
   * List of items to hide from data display
   */
  hide_items?: HiddenItem[];
  /**
   * Max data items per page to show in data-info view
   */
  max_data_per_page?: number;
  /**
   * Number of decimals to show for numeric values
   */
  number_decimals?: number;
  /**
   * Use mile unit for distance display (otherwise km unit will be used)
   */
  mile_unit?: boolean;
  /**
   * Use 12hr format for time display (otherwise 24hr format will be used)
   */
  '12hr_format'?: boolean;
  /**
   * Font custom styles for the card
   */
  font_config?: FontCustomStyles;
  /**
   * Graph layout config for horizon section
   */
  graph_chart_config?: GraphConfig;
  //
  // Deprecated options - to be removed in future releases
  /**
   * @deprecated use 'language' instead
   */
  selected_language?: string;
  /**
   * @deprecated use 'theme_mode' and 'custom_theme' instead
   */
  theme?: ThemeConfig;
  /**
   * @deprecated use 'hide_background' instead
   */
  show_background?: boolean;
  /**
   * @deprecated use `font_config` instead
   */
  font_customize?: FontCustomStyles;
  /**
   * @deprecated use `graph_chart_config` instead
   */
  graph_config?: HorizonGraphConfig;
  /**
   * @deprecated use `default_section` instead
   */
  default_card?: 'calendar' | 'base' | 'horizon';

  /**
   * @deprecated use `location_source` instead
   */
  use_custom?: boolean;
  /**
   * @deprecated use `location_source` instead
   */
  use_default?: boolean;
  /**
   * @deprecated use `location_source` instead
   */
  use_entity?: boolean;
  /**
   * Only for editor to display the detected location
   */
  location?: LocationAddress;
  cardId?: string;
}

export const LocationConfigKeys = [
  'location_source',
  'entity',
  'southern_hemisphere',
  'latitude',
  'longitude',
] as const;

export type LocationConfig = Pick<LunarPhaseCardConfig, (typeof LocationConfigKeys)[number]>;

export const VisualBackgroundOptions = [
  'language',
  'hide_background',
  'hide_starfield',
  'custom_background',
  'custom_theme',
  'theme_mode',
] as const;

export type VisualBackgroundConfig = Pick<LunarPhaseCardConfig, (typeof VisualBackgroundOptions)[number]>;

export const AppearanceLayoutKeys = [
  'default_section',
  'compact_view',
  'compact_mode',
  'moon_size',
  'moon_position',
  'hide_buttons',
  'compact_menu_button',
  'hide_compact_label',
  'calendar_modal',
] as const;

export type AppearanceLayoutConfig = Pick<LunarPhaseCardConfig, (typeof AppearanceLayoutKeys)[number]>;

export const CardAppearanceLayoutKeys = [...VisualBackgroundOptions, ...AppearanceLayoutKeys] as const;

export type CardAppearance = Pick<LunarPhaseCardConfig, (typeof CardAppearanceLayoutKeys)[number]>;

export const DataVisualKeys = [
  'hide_items',
  'max_data_per_page',
  'number_decimals',
  'mile_unit',
  '12hr_format',
  'font_config',
  'graph_chart_config',
] as const;

export type DataVisualConfig = Pick<LunarPhaseCardConfig, (typeof DataVisualKeys)[number]>;

export const ConfigFieldOrder = [
  'type',
  ...LocationConfigKeys,
  ...CardAppearanceLayoutKeys,
  ...DataVisualKeys,
] as const;
/** @deprecated use 'graph_chart_config' instead
 */
interface HorizonGraphConfig {
  graph_type?: 'default' | 'dynamic';
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

/**
 * @deprecated use 'theme' and 'theme_mode' instead
 */
interface ThemeConfig {
  selected_theme?: string;
  theme_mode?: ThemeMode;
}

export type LocationAddress = {
  country: string;
  city: string;
};

export type SearchResults = {
  addresstype: string;
  display_name: string;
  name: string;
  lat: number;
  lon: number;
};

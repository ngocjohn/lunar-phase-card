import { PageType } from '../../const';
import { LovelaceCardConfig } from '../../ha';
import { FontConfig } from './font-config';
import { GraphConfig } from './graph-config';

export type Section = 'base' | 'calendar' | 'horizon';
export enum SECTION {
  BASE = 'base',
  CALENDAR = 'calendar',
  HORIZON = 'horizon',
}

export const LOC_SOURCE = ['default', 'entity', 'custom'] as const;
export type LocationSource = (typeof LOC_SOURCE)[number];

export const COMPACT_MODE = ['default', 'minimal'] as const;
export type CompactMode = (typeof COMPACT_MODE)[number];

export const MOON_POSITION = ['left', 'right'] as const;
export type MoonPosition = (typeof MOON_POSITION)[number];

export const THEME_MODE = ['auto', 'light', 'dark'] as const;
export type ThemeMode = (typeof THEME_MODE)[number];

export interface LunarPhaseCardConfig extends LovelaceCardConfig {
  default_section?: Section;

  location_source?: LocationSource;
  /**
   * Lat & Lon from config, change dynamically with location_source
   * if location_source is set to 'default', lat lon will be pulled from Home Assistant config
   * if location_source is set to 'custom', lat lon will be pulled from config
   * if location_source is set to 'entity', lat lon will be pulled from the state attributes of the defined entity
   */
  latitude?: number;
  longitude?: number;
  /**
   * Entity to use for location (if location_source is set to 'entity')
   * Lat lon will be pulled from the state attributes
   */
  entity?: string;
  southern_hemisphere?: boolean;
  /*
		Show a more compact view, hiding some details
	*/
  compact_view?: boolean;
  compact_mode?: CompactMode;
  /*
   * Position of the moon image in content
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
   * Hide menu button to switch between sections
   */
  hide_buttons?: boolean;
  /**
   * Show a button to open the calendar in a modal
   */
  calendar_modal?: boolean;
  /**
   * theme mode for the card
   * 'auto' will match the system / Home Assistant theme
   */
  theme_mode?: ThemeMode;
  custom_theme?: string;
  // DATA Visualization
  language?: string;
  number_decimals?: number;
  mile_unit?: boolean;
  '12hr_format'?: boolean;
  hide_items?: string[];
  /**
   * Font config for data display
   */
  font_config?: FontConfig;
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
  default_card?: PageType.BASE | PageType.CALENDAR | PageType.HORIZON;

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

export type FontSizeOptions = 'auto' | 'small' | 'medium' | 'large' | 'x-large' | 'xx-large';
export type FontTextTransformOptions = 'none' | 'capitalize' | 'uppercase' | 'lowercase';
/**
 * @deprecated use 'font_config' instead
 */
export interface FontCustomStyles {
  header_font_size?: FontSizeOptions;
  header_font_style?: FontTextTransformOptions;
  header_font_color?: string;
  label_font_size?: FontSizeOptions;
  label_font_style?: FontTextTransformOptions;
  label_font_color?: string;
  hide_label?: boolean;
}
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
 * @deprecated use 'theme' and 'them_mode' instead
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

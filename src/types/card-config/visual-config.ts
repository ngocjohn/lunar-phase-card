export const COMPATE_MODE = ['default', 'minimal'] as const;
export type CompactMode = (typeof COMPATE_MODE)[number];

export const MOON_POSITION = ['left', 'right'] as const;
export type MoonPosition = (typeof MOON_POSITION)[number];

export const THEME_MODE = ['auto', 'light', 'dark'] as const;
export type ThemeMode = (typeof THEME_MODE)[number];

/**
 * Layout and Appearance configurations
 * This settings control the overall look and feel of the card.
 * @interface AppearanceConfig
 */
export interface AppearanceConfig {
  compact_view?: boolean;
  compact_mode?: CompactMode;
  moon_position?: MoonPosition;
  theme_mode?: ThemeMode;
  theme?: string;
  show_background?: boolean;
  custom_background?: string;
  calendar_modal?: boolean;
  hide_buttons?: boolean;
}

/**
 * Visual customization for data representation
 * This settings control how data is visually represented in the card.
 * @interface DataVisualConfig
 */
export interface DataVisualConfig {
  lang?: string;
  number_decimals?: number;
  '12hr_format'?: boolean;
  mile_unit?: boolean;
  hide_items?: string[];
}

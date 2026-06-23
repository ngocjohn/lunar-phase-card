import { LovelaceBadgeConfig } from '../../ha';
import { LocationConfigKeys, LocationSource } from './location-source-config';
import { MOON_DATA_KEYS } from './lunar-phase-card-config';

export const BADGE_ICON_TYPE = ['image', 'emoji', 'icon'] as const;
export const APPEARANCE_CONFIG_KEYS = ['language', 'number_decimals', 'mile_unit', '12hr_format', 'icon_type'] as const;
export const CONTENT_CONFIG_KEYS = [
  'custom_name',
  'name',
  'state_content',
  'show_name',
  'show_icon',
  'show_state',
] as const;

export type BadgeIconType = (typeof BADGE_ICON_TYPE)[number];
export type MoonDataItem = (typeof MOON_DATA_KEYS | 'phaseName')[number];

export interface LunarPhaseBadgeConfig extends LovelaceBadgeConfig {
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
   * Type of icon to display on the badge
   * Defaults to 'image'.
   */
  icon_type?: BadgeIconType;
  /**
   * Use custom name instead of current phase name.
   */
  custom_name?: boolean;
  name?: string | MoonDataItem;

  /**
   * State content to display
   */
  state_content?: MoonDataItem | MoonDataItem[];
  show_name?: boolean;
  show_icon?: boolean;
  show_state?: boolean;
}

export type LocationBadgeConfig = Pick<LovelaceBadgeConfig, (typeof LocationConfigKeys)[number]>;
export type AppearanceBadgeConfig = Pick<LunarPhaseBadgeConfig, (typeof APPEARANCE_CONFIG_KEYS)[number]>;
export type ContentBadgeConfig = Pick<LunarPhaseBadgeConfig, (typeof CONTENT_CONFIG_KEYS)[number]>;

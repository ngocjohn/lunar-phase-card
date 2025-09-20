import { LovelaceCardConfig } from '../home-assistant-frontend';
import { FontConfig } from './font-config';
import { GraphConfig } from './graph-config';
import { AppearanceConfig, DataVisualConfig } from './visual-config';

export type Section = 'base' | 'calendar' | 'horizon';
export enum SECTION {
  BASE = 'base',
  CALENDAR = 'calendar',
  HORIZON = 'horizon',
}

export const LOC_SOURCE = ['default', 'entity', 'custom'] as const;
export type LocationSource = (typeof LOC_SOURCE)[number];

/**
 * Main configuration interface for the Lunar Phase Card
 * This interface combines appearance, data visualization, and other card-specific settings.
 * @interface LunarCardConfig
 */
export interface LunarCardConfig extends AppearanceConfig, DataVisualConfig, LovelaceCardConfig {
  location_source?: LocationSource;
  latitude?: number;
  longitude?: number;
  entity?: string;
  southern_hemisphere?: boolean;
  default_card?: Section;
  font_customize?: FontConfig;
  graph_config?: GraphConfig;
  cardId?: string;
}

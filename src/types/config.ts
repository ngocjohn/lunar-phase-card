// Cutom card helpers:
import { LovelaceCardConfig } from 'custom-card-helpers';

import { PageType } from '../const';

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
  hide_header?: boolean;
  calendar_modal?: boolean;
  default_card?: PageType.BASE | PageType.CALENDAR | PageType.HORIZON;
  selected_language: string;
  moon_position?: 'left' | 'right';
  southern_hemisphere?: boolean;
  latitude: number;
  longitude: number;
  location?: LocationAddress;
  font_customize: FontCustomStyles;
  graph_config?: HorizonGraphConfig;
  cardId?: string;
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

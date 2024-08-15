// Cutom card helpers:
import { LovelaceCardConfig, Themes, HomeAssistant, Theme } from 'custom-card-helpers';
import { HassEntity } from 'home-assistant-js-websocket';

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

export interface LunarPhaseCardConfig extends LovelaceCardConfig {
  type: string;
  entity?: string;
  use_default?: boolean;
  use_custom?: boolean;
  use_entity?: boolean;
  show_background?: boolean;
  compact_view?: boolean;
  '12hr_format'?: boolean;
  custom_background?: string;
  selected_language?: string | null;
  latitude: number;
  longitude: number;
}

export const defaultConfig: Partial<LunarPhaseCardConfig> = {
  type: 'custom:lunar-phase-card',
  entity: '',
  use_default: true,
  use_custom: false,
  use_entity: false,
  show_background: true,
  compact_view: true,
  '12hr_format': false,
};

export interface LunarPhaseData {
  illumination: Illumination;
  zenithAngle: number;
  azimuth: number;
  altitude: number;
  azimuthDegrees: number;
  altitudeDegrees: number;
  distance: number;
  parallacticAngle: number;
  parallacticAngleDegrees: number;
}

export interface Illumination {
  fraction: number;
  phase: Phase;
  phaseValue: number;
  angle: number;
  next: NextPhases;
}

export interface Phase {
  from: number;
  to: number;
  id: string;
  emoji: string;
  code: string;
  name: string;
  weight: number;
  css: string;
}

export interface NextPhases {
  value: number;
  date: string;
  type: string;
  newMoon: PhaseDate;
  fullMoon: PhaseDate;
  firstQuarter: PhaseDate;
  thirdQuarter: PhaseDate;
}

export interface PhaseDate {
  value: number;
  date: string;
}

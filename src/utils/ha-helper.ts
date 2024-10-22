/* eslint-disable @typescript-eslint/no-explicit-any */
import { LunarPhaseCardConfig } from '../types';

export function deepMerge(target: any, source: any): any {
  for (const key of Object.keys(source)) {
    if (source[key] instanceof Object && key in target) {
      // Recursively merge nested objects
      target[key] = deepMerge(target[key], source[key]);
    } else {
      // Assign the value from source if it isn't an object or doesn't exist in target
      target[key] = source[key];
    }
  }
  return target;
}

export function InitializeDefaultConfig(): Record<string, unknown> {
  const defaultConfig: Partial<LunarPhaseCardConfig> = {
    type: 'custom:lunar-phase-card',
    entity: '',
    use_default: true,
    use_custom: false,
    use_entity: false,
    show_background: true,
    selected_language: 'en',
    compact_view: true,
    '12hr_format': false,
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
  return defaultConfig;
}

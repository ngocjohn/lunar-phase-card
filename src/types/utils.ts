import { isEmpty } from 'es-toolkit/compat';

import { LunarPhaseNewCardConfig } from './lunar-phase-card-config';

export const migrateConfig = (config: LunarPhaseNewCardConfig): LunarPhaseNewCardConfig => {
  if (!cardNeedsMigration(config)) {
    return config;
  }
  console.debug('Starting migration for config:', config);
  // deep clone config to avoid mutating the original object
  const newConfig = { ...config } as Record<string, any>;
  for (const [key, value] of Object.entries(newConfig)) {
    if (value === null || value === undefined || value === '' || (Array.isArray(value) && value.length === 0)) {
      delete newConfig[key];
    }
  }
  // check for location_source, based on use_custom, use_default, use_entity
  if (!newConfig.location_source) {
    if (newConfig.use_custom) {
      newConfig.location_source = 'custom';
    } else if (newConfig.use_entity) {
      newConfig.location_source = 'entity';
    } else {
      newConfig.location_source = 'default';
    }
    // remove deprecated options
    delete (newConfig as any).use_custom;
    delete (newConfig as any).use_default;
    delete (newConfig as any).use_entity;
  }

  if ('default_card' in newConfig) {
    newConfig.default_section = newConfig.default_card;
    delete (newConfig as any).default_card;
  }
  if ('show_background' in newConfig) {
    newConfig.hide_background = !newConfig.show_background;
    delete (newConfig as any).show_background;
  }
  if ('font_customize' in newConfig) {
    for (const [key, value] of Object.entries(newConfig.font_customize || {})) {
      if (!newConfig.font_config) {
        newConfig.font_config = {};
      }
      (newConfig.font_config as any)[key] = value;
    }
    delete (newConfig as any).font_customize;
  }
  if ('graph_config' in newConfig) {
    newConfig.graph_chart_config = config.graph_config;
    delete (newConfig as any).graph_config;
  }
  if ('theme' in newConfig && typeof newConfig.theme === 'object') {
    newConfig.custom_theme = newConfig.theme.selected_theme;
    newConfig.theme_mode = newConfig.theme.theme_mode;
    delete (newConfig as any).theme;
  }
  if ('selected_language' in newConfig) {
    newConfig.language = newConfig.selected_language;
    delete (newConfig as any).selected_language;
  }
  console.debug('Migration completed:', newConfig);
  return newConfig as LunarPhaseNewCardConfig;
};

export const cardNeedsMigration = (config: LunarPhaseNewCardConfig): boolean => {
  return Boolean(
    config.use_custom ||
      config.use_default ||
      config.use_entity ||
      config.default_card ||
      config.show_background ||
      config.font_customize ||
      config.graph_config ||
      (config.theme && typeof config.theme === 'object') ||
      config.selected_language
  );
};

export const cleanConfig = (config: LunarPhaseNewCardConfig): LunarPhaseNewCardConfig => {
  // deep clone config to avoid mutating the original object
  const cleanedConfig = JSON.parse(JSON.stringify(config));
  // find the difference between config and cleanedConfig
  const diff: string[] = [];
  Object.keys(cleanedConfig).forEach((key) => {
    const keyToRemove = isEmpty((cleanedConfig as any)[key]);
    if (keyToRemove) {
      delete (cleanedConfig as any)[key];
      diff.push(key);
    }
  });
  if (diff.length > 0) {
    console.debug('Cleaned config, removed undefined or empty properties:', diff);
  }
  return cleanedConfig;
};

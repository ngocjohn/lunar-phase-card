import { applyThemesOnElement } from 'custom-card-helpers';

import { HA, LunarPhaseCardConfig, defaultConfig } from '../types';

export const generateConfig = (config: LunarPhaseCardConfig): LunarPhaseCardConfig => {
  const defaultConf = defaultConfig;
  const { y_ticks, x_ticks } = config;
  if (y_ticks !== undefined && x_ticks !== undefined) {
    defaultConf.graph_config = {
      ...defaultConf.graph_config,
      y_ticks,
      x_ticks,
    };
    config = { ...config, y_ticks: undefined, x_ticks: undefined };
  }

  const conf = {
    ...defaultConf,
    ...config,
    font_customize: { ...defaultConf.font_customize, ...config.font_customize },
    graph_config: { ...defaultConf.graph_config, ...config.graph_config },
  };

  return conf;
};

export const applyTheme = (element: any, hass: HA, theme: string, mode?: string): void => {
  if (!element) return;
  // console.log('applyTheme', theme, mode);
  const themeData = hass.themes.themes[theme];
  if (themeData) {
    // Filter out only top-level properties for CSS variables and the modes property
    const filteredThemeData = Object.keys(themeData)
      .filter((key) => key !== 'modes')
      .reduce((obj, key) => {
        obj[key] = themeData[key];
        return obj;
      }, {} as Record<string, string>);

    if (!mode || mode === 'auto') {
      mode = hass.themes.darkMode ? 'dark' : 'light';
      // Get the current mode (light or dark)
    } else {
      mode = mode;
    }
    const modeData = themeData.modes && typeof themeData.modes === 'object' ? themeData.modes[mode] : {};
    // Merge the top-level and mode-specific variables
    // const allThemeData = { ...filteredThemeData, ...modeData };
    const allThemeData = { ...filteredThemeData, ...modeData };
    const allTheme = { default_theme: hass.themes.default_theme, themes: { [theme]: allThemeData } };
    applyThemesOnElement(element, allTheme, theme, false);
  }
};

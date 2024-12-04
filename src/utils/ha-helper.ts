/* eslint-disable @typescript-eslint/no-explicit-any */
import { LunarPhaseCardConfig, defaultConfig } from '../types';

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

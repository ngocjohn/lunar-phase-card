/* eslint-disable @typescript-eslint/no-explicit-any */
import { LunarPhaseCardConfig, defaultConfig } from '../types';

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

export default generateConfig;

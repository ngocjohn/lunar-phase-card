import { createConsola, LogLevels } from 'consola';

const logLevel = LogLevels.info;

export const logger = createConsola({
  level: logLevel,
}).withTag('lunar-phase-card');

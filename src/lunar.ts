import { version } from '../package.json';
import './lunar-phase-legacy-card/lunar-phase-card';
import './lunar-phase-card/new-lunar-phase-card';

console.info(
  `%c LUNAR CARD %c ${version}`,
  'color: orange; font-weight: bold; background: black',
  'color: white; font-weight: bold; background: dimgray'
);

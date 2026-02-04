import type { Palette } from '@vibrant/color';

import { Vibrant } from 'node-vibrant/browser';
import tinycolor from 'tinycolor2';

import { FILL_COLORS } from '../types/config/chart-config';

const extractColorData = (palette: Palette): FILL_COLORS => {
  const colors = {} as FILL_COLORS;
  for (const [key, value] of Object.entries(palette)) {
    if (value && key === 'Vibrant') {
      const todayFillColor = value.hex;
      const fillAboveColor = tinycolor(todayFillColor).setAlpha(0.2).toHex8String();
      const nextDayFillColor = tinycolor(todayFillColor).darken(10).toHexString();
      colors.today = todayFillColor;
      colors.nextDay = nextDayFillColor;
      colors.fillAbove = fillAboveColor;
    }
  }
  return colors;
};

export default async (picture: string): Promise<FILL_COLORS> => {
  const vibrant = new Vibrant(picture, { colorCount: 250 });
  return vibrant.getPalette().then((palette) => extractColorData(palette));
};

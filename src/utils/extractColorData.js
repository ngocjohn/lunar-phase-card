import Vibrant from 'node-vibrant/dist/vibrant';
import tinycolor from 'tinycolor2';

const extractColorData = (palette) => {
  const colors = {};
  for (const [key, value] of Object.entries(palette)) {
    // console.log(key, value.getHex());
    if (key === 'Vibrant') {
      const todayFillColor = value.getHex();
      const nextDayFillColor = tinycolor(todayFillColor).darken(10).toHexString();
      colors.todayFillColor = todayFillColor;
      colors.nextDayFillColor = nextDayFillColor;
    }
  }
  // console.log(colors);
  return colors;
};

export default async (picture) => {
  const vibrant = new Vibrant(picture, { colorCount: 250 });
  const palette = await vibrant.getPalette();
  const colorData = extractColorData(palette);
  return colorData;
};

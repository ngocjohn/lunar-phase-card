import Vibrant from 'node-vibrant/dist/vibrant';

const extractColorData = (palette) => {
  const colors = [];
  for (const [key, value] of Object.entries(palette)) {
    // console.log(key, value.getHex());
    if (key === 'Vibrant' || key === 'DarkMuted') {
      colors.push(value.getHex());
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

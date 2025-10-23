import { IMoonData, IMoonIllumination } from '@noim/suncalc3';

export type MoonDataItem = {
  label: string;
  value: string;
  secondValue?: string;
};
export type MoonImage = {
  moonPic: string;
  rotateDeg: number;
  southernHemisphere?: boolean;
};

export const MoonDataKeys = [
  'moonFraction',
  'moonAge',
  'moonRise',
  'moonSet',
  'moonHighest',
  'distance',
  'azimuthDegress',
  'altitudeDegrees',
  'nextFullMoon',
  'nextNewMoon',
  'nextPhase',
  'direction',
  'position',
] as const;

export type MoonDataKey = (typeof MoonDataKeys)[number];
export type MoonData = Partial<Record<MoonDataKey, MoonDataItem>>;

export const filterItemFromMoonData = (moonData: MoonData, itemsToRemove: MoonDataKey[]): MoonData => {
  const dataEntries = Object.entries(moonData).filter(([key]) => !itemsToRemove.includes(key as MoonDataKey));
  return Object.fromEntries(dataEntries) as MoonData;
};

export type ChartColors = {
  primaryTextColor: string;
  secondaryTextColor: string;
  fillColor: string;
  fillBelowColor: string;
  fillBelowLineColor: string;
  [key: string]: string;
};

export type DynamicChartData = {
  chartData: {
    timeLabel: number;
    moon: {
      altitude: number;
      azimuth: string;
    };
  }[];
  times: {
    moon: number[];
  };
  moonIllumination: IMoonIllumination;
  moonData: IMoonData;
};

export interface FILL_COLORS {
  today: string;
  nextDay: string;
  fillAbove: string;
  [key: string]: string;
}

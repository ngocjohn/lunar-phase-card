import { IMoonData, IMoonIllumination } from '@noim/suncalc3';

export type MoonDataItem = {
  label: string;
  value: string;
  secondValue?: string;
};
export type MoonImage = {
  moonPic: string;
  rotateDeg: number;
};

export interface MoonData {
  moonFraction: MoonDataItem;
  moonAge: MoonDataItem;
  moonRise: MoonDataItem;
  moonSet: MoonDataItem;
  moonHighest?: MoonDataItem;
  distance: MoonDataItem;
  azimuthDegress: MoonDataItem;
  altitudeDegrees: MoonDataItem;
  nextFullMoon: MoonDataItem;
  nextNewMoon: MoonDataItem;
  direction: MoonDataItem;
  position: MoonDataItem;
}

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

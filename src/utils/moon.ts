import * as SunCalc from '@noim/suncalc3';
import { FrontendLocaleData, formatNumber, relativeTime, formatTime } from 'custom-card-helpers';

import { localize } from '../localize/localize';
import { LunarPhaseCardConfig, MoonData, MoonDataItem, MoonImage, Location } from '../types';
import { MOON_IMAGES } from '../utils/moon-pic';
import { convertKmToMiles, compareTime } from './helpers';

export class Moon {
  readonly _date: Date;
  readonly location: Location;
  readonly config: LunarPhaseCardConfig;
  readonly locale: FrontendLocaleData;
  readonly useMiles: boolean;
  readonly lang: string;

  constructor(data: { date: Date; config: LunarPhaseCardConfig; locale: FrontendLocaleData }) {
    this._date = data.date;
    this.lang = data.locale.language;
    this.config = data.config;
    this.location = { latitude: data.config.latitude, longitude: data.config.longitude } as Location;
    this.locale = data.locale;
    this.useMiles = this.config.mile_unit || false;
  }

  private localize = (string: string, search = '', replace = ''): string => {
    return localize(string, this.lang, search, replace);
  };

  private formatTime = (time: number | Date): string => {
    return formatTime(new Date(time), this.locale);
  };

  private convertKmToMiles = (km: number): number => {
    return convertKmToMiles(km, this.useMiles);
  };

  private formatNumber = (num: number): string => {
    const decimal = this.config.number_decimals;
    const numberValue = num.toFixed(decimal);
    return formatNumber(numberValue, this.locale);
  };

  get _moonTime(): SunCalc.IMoonTimes {
    return SunCalc.getMoonTimes(this._date, this.location.latitude, this.location.longitude);
  }

  get _moonData(): SunCalc.IMoonData {
    return SunCalc.getMoonData(this._date, this.location.latitude, this.location.longitude);
  }

  get moonTransit() {
    const riseTime = this._moonTime.rise;
    const setTime = this._moonTime.set;
    return SunCalc.moonTransit(riseTime, setTime, this.location.latitude, this.location.longitude);
  }

  get _moonPosition(): SunCalc.IMoonPosition {
    return SunCalc.getMoonPosition(this._date, this.location.latitude, this.location.longitude);
  }

  get phaseName(): string {
    return this.localize(`card.phase.${this._moonData.illumination.phase.id}`);
  }

  blankBeforeUnit = (unit: string): string => {
    if (unit === '°') {
      return '';
    }
    if (unit === '%') {
      if (['cs', 'de', 'fi', 'fr', 'sk', 'sv'].includes(this.lang)) {
        return ' ';
      } else {
        return '';
      }
    }
    return ' ';
  };

  createItem = (label: string, value: string, unit?: string, secondValue?: string): MoonDataItem => ({
    label: this.localize(`card.${label}`),
    value: `${value}${unit ? this.blankBeforeUnit(unit) + unit : ''}`,
    secondValue: secondValue ? `${secondValue}` : '',
  });

  createMoonTime = (key: string, time: number | Date): MoonDataItem => {
    const timeString = this.formatTime(time);
    const secondValue = compareTime(new Date(time)) ? relativeTime(new Date(time), this.locale) : '';
    return this.createItem(key, timeString, '', secondValue);
  };

  get moonImage(): MoonImage {
    const phaseIndex = Math.floor(this._moonData.illumination.phaseValue * 31) % 31;
    const { zenithAngle, parallacticAngle } = this._moonData;
    const rotateDeg = (zenithAngle - parallacticAngle) * (180 / Math.PI);
    return {
      moonPic: MOON_IMAGES[phaseIndex],
      rotateDeg: rotateDeg,
    };
  }

  _getMoonRotation() {
    const { zenithAngle, parallacticAngle } = this._moonData;
    const rotateDeg = (zenithAngle - parallacticAngle) * (180 / Math.PI);
    return rotateDeg;
  }

  get moonData(): MoonData {
    const { createItem, createMoonTime, convertKmToMiles, formatNumber, localize, useMiles, lang, convertCardinal } =
      this;
    const decimal = this.config.number_decimals;
    // Helper function to format date as short time string
    const shortTime = (date: number | Date) =>
      new Date(date).toLocaleDateString(lang, { weekday: 'short', month: 'short', day: 'numeric' });

    // Destructure relevant data
    const { distance, azimuthDegrees, altitudeDegrees, illumination } = this._moonData;
    const {
      fraction,
      phaseValue,
      next: { fullMoon, newMoon },
    } = illumination;
    const { rise, set, highest } = this._moonTime;

    // Format numeric values
    const formatted = {
      moonFraction: formatNumber(fraction * 100),
      moonAge: formatNumber(phaseValue * 29.53),
      distance: formatNumber(convertKmToMiles(distance)),
      azimuth: formatNumber(azimuthDegrees),
      altitude: formatNumber(altitudeDegrees),
    };

    const cardinal = convertCardinal(azimuthDegrees);
    // Construct moon data items
    return {
      moonAge: createItem('moonAge', formatted.moonAge, localize('card.relativeTime.days')),
      moonFraction: createItem('illumination', formatted.moonFraction, '%'),
      azimuthDegress: createItem('azimuth', formatted.azimuth, '°', cardinal),
      altitudeDegrees: createItem('altitude', formatted.altitude, '°'),
      distance: createItem('distance', formatted.distance, useMiles ? 'mi' : 'km'),
      moonRise: createMoonTime('moonRise', rise),
      moonSet: createMoonTime('moonSet', set),
      moonHighest: highest ? createMoonTime('moonHigh', highest) : undefined,
      nextFullMoon: createItem('fullMoon', shortTime(fullMoon.value)),
      nextNewMoon: createItem('newMoon', shortTime(newMoon.value)),
      direction: createItem('direction', formatted.azimuth, '°', cardinal),
      position: createItem('position', localize(`card.${altitudeDegrees > 0 ? 'overHorizon' : 'underHorizon'}`)),
    };
  }

  get todayDataItem() {
    const { position, direction, altitudeDegrees, moonFraction, distance } = this.moonData;
    return {
      position,
      direction,
      altitudeDegrees,
      moonFraction,
      distance,
    };
  }

  get todayData() {
    const today = new Date();
    const startTime = new Date(today.setHours(0, 0, 0, 0));
    const _altitudeData = this._getAltituteData(startTime);
    const timeToday = SunCalc.getMoonTimes(today, this.location.latitude, this.location.longitude);

    const timeMarkers = ['rise', 'set'].map((key) => this.timeDataSet(key));

    const dataCotent = {
      time: timeToday,
      altitude: this._getDataAltitude(startTime),
      timeLabels: Object.keys(_altitudeData),
      altitudeData: Object.values(_altitudeData),
      minMaxY: {
        sugestedYMax: Math.ceil(Math.max(...Object.values(_altitudeData)) + 10),
        sugestedYMin: Math.min(...Object.values(_altitudeData)) - 10,
      },
      moonPhase: this._moonData.illumination,
      lang: {
        rise: this.localize('card.moonRise'),
        set: this.localize('card.moonSet'),
      },
      timeMarkers,
    };

    return dataCotent;
  }

  _getDataInRange = () => {
    const now = new Date();
    const timeRange = new Date(now.getTime() - 12 * 60 * 60 * 1000);
    const dataSet = this._getDataAltitude(timeRange);
    return dataSet;
  };

  _getAltituteData = (startTime: Date) => {
    const result: { [key: string]: number } = {};

    for (let i = 0; i < 48; i++) {
      const time = new Date(startTime.getTime() + i * 30 * 60 * 1000);
      const formatedTime = this.formatTime(time);
      const position = SunCalc.getMoonPosition(time, this.location.latitude, this.location.longitude);
      result[formatedTime] = Number(position.altitudeDegrees.toFixed(2));
    }
    return result;
  };

  _getDataAltitude = (startTime: Date) => {
    const result: { x: number; y: number }[] = [];

    for (let i = 0; i < 48; i++) {
      const time = new Date(startTime.getTime() + i * 30 * 60 * 1000);
      const formatedTime = time.getTime();
      const position = SunCalc.getMoonPosition(time, this.location.latitude, this.location.longitude);
      result.push({ x: formatedTime, y: Number(position.altitudeDegrees.toFixed(2)) });
    }
    return result;
  };

  _getMoonTime = (today: Date): SunCalc.IMoonTimes => {
    return SunCalc.getMoonTimes(today, this.location.latitude, this.location.longitude);
  };

  _getMoonPosition = (today: Date): SunCalc.IMoonPosition => {
    return SunCalc.getMoonPosition(today, this.location.latitude, this.location.longitude);
  };

  _getMoonTransit = (rise: Date, set: Date): { main: Date | null; invert: Date | null } => {
    return SunCalc.moonTransit(rise, set, this.location.latitude, this.location.longitude);
  };

  convertCardinal = (degrees: number): string => {
    const pointsMap = [
      'N',
      'NNE',
      'NE',
      'ENE',
      'E',
      'ESE',
      'SE',
      'SSE',
      'S',
      'SSW',
      'SW',
      'WSW',
      'W',
      'WNW',
      'NW',
      'NNW',
    ];
    const index = Math.round(degrees / 22.5) % 16;
    const value = pointsMap[index];
    return this.localize(`card.cardinalShort.${value}`);
  };

  timeDataSet = (timeKey: string): Record<string, any> => {
    const showOnChart = (time: Date): boolean => {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      const todayEnd = new Date();
      todayEnd.setHours(23, 59, 59, 999);
      return time > todayStart && time < todayEnd;
    };

    const today = new Date();
    const timeData = SunCalc.getMoonTimes(today, this.location.latitude, this.location.longitude);
    const time = new Date(timeData[timeKey]);
    const timePosition = SunCalc.getMoonPosition(time, this.location.latitude, this.location.longitude);
    const altitude = timePosition.altitudeDegrees;
    // Formated direction data
    const azimuth = timePosition.azimuthDegrees;
    const cardinal = this.convertCardinal(azimuth);
    const formatedAzimuth = this.formatNumber(azimuth);
    const direction = `${formatedAzimuth}° ${cardinal}`;

    // Formated time
    const formatedTime = this.formatTime(time);

    // Show on chart
    const show = showOnChart(time);
    const label = this.localize(`card.moon${timeKey.charAt(0).toUpperCase() + timeKey.slice(1)}`);
    const lineOffset = timeKey === 'set' ? -20 : 20;
    const textOffset = timeKey === 'set' ? -30 : 60;
    const position = {
      index: Math.round((time.getHours() + time.getMinutes() / 60) * 2),
      altitude,
    };

    return { show, position, label, formatedTime, lineOffset, textOffset, direction };
  };

  get calendarEvents() {
    const events: { title: string; start: string; allDay: boolean }[] = [];
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();

    const daysInMonth = new Date(year, month + 1, 0).getDate();
    for (let i = 1; i <= daysInMonth; i++) {
      const day = new Date(year, month, i);
      const moonIlumin = SunCalc.getMoonIllumination(day);
      const phaseEmoji = moonIlumin.phase.emoji;
      const phaseAge = this.formatNumber(moonIlumin.phaseValue * 29.53);

      events.push({
        title: `${phaseEmoji} ${phaseAge}`,
        start: day.toISOString().split('T')[0],
        allDay: true,
      });
    }
    return events;
  }

  // Helper method to generate events for a specific date range
  getEventsForRange(start: Date, end: Date): { title: string; start: string; allDay: boolean }[] {
    const events: { title: string; start: string; allDay: boolean }[] = [];
    const daysInRange = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);

    for (let i = 0; i <= daysInRange; i++) {
      const day = new Date(start.getTime() + i * 1000 * 60 * 60 * 24);
      const moonIllumination = SunCalc.getMoonIllumination(day);
      const phaseEmoji = moonIllumination.phase.emoji;

      events.push({
        title: `${phaseEmoji}`,
        start: day.toISOString().split('T')[0],
        allDay: true,
      });
    }
    return events;
  }

  setMoonImagesToStorage = () => {
    // set as array
    const moonImages = MOON_IMAGES;
    // set to storage
    localStorage.setItem('moonImages', JSON.parse(JSON.stringify(moonImages)));
  };
}

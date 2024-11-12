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

  formatTime = (time: number | Date): string => {
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
    const phaseIndex = Math.round(this._moonData.illumination.phaseValue * 31) % 31;
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
    const { rise, set } = this._moonTime;
    const { main } = this.moonTransit;
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
      moonHighest: createMoonTime('moonHigh', new Date(main || 0)),
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
    const startTime = new Date(today.setHours(0, 30, 0, 0));
    const timeToday = SunCalc.getMoonTimes(today, this.location.latitude, this.location.longitude);
    // moon highest
    const moonHighest = this._getMoonHighest(timeToday.rise, timeToday.set);
    // current moon
    const currentMoon = this._fetchtCurrentMoon();
    // time markers

    // dataset

    let dataWithXY = this._getDataAltitude(startTime);
    const changedIndexWithHighest = this._getClosestIndex(moonHighest.rawData.x, dataWithXY);
    dataWithXY[changedIndexWithHighest] = moonHighest.rawData;
    dataWithXY = dataWithXY.sort((a, b) => a.x - b.x);

    const timeLabels = Object.values(dataWithXY).map((item) => item.x);
    const altitudeValues = Object.values(dataWithXY).map((item) => item.y);
    const minMaxY = {
      sugestedYMax: Math.round(Math.max(...altitudeValues) + 10),
      sugestedYMin: Math.round(Math.min(...altitudeValues) - 10),
    };

    const dataCotent = {
      time: timeToday,
      moonHighest,
      altitude: dataWithXY,
      timeLabels,
      altitudeValues,
      minMaxY,
      moonPhase: this._moonData.illumination,
      lang: {
        rise: this.localize('card.moonRise'),
        set: this.localize('card.moonSet'),
      },
      currentMoon,
    };

    return dataCotent;
  }

  get timeMarkers() {
    const timeMarkers = ['rise', 'set'].map((key) => this.timeDataSet(key));
    return timeMarkers;
  }

  _getMoonHighest = (rise: number | Date, set: number | Date): Record<string, any> => {
    const { formatNumber } = this;

    const moonTransit = SunCalc.moonTransit(rise, set, this.location.latitude, this.location.longitude);
    const { main } = moonTransit;
    const moonTransitTime = new Date(main || 0);
    const moonTransitPosition = SunCalc.getMoonPosition(
      moonTransitTime,
      this.location.latitude,
      this.location.longitude
    );
    const altitude = `${formatNumber(moonTransitPosition.altitudeDegrees)}°`;
    const azimuth = formatNumber(moonTransitPosition.azimuthDegrees);
    const cardinal = this.convertCardinal(moonTransitPosition.azimuthDegrees);
    const direction = `${azimuth}° ${cardinal}`;
    const formatedTime = this.formatTime(moonTransitTime);
    const rawData = {
      x: moonTransitTime.getTime(),
      y: Number(moonTransitPosition.altitudeDegrees.toFixed(2)),
    };

    const contentBody: string[] = [];
    contentBody.push(altitude);
    contentBody.push(direction);
    return { formatedTime, contentBody, rawData };
  };

  _getCurrentMoonData = (): string => {
    const now = new Date();
    const currentData = SunCalc.getMoonData(now, this.location.latitude, this.location.longitude);
    const { azimuthDegrees } = currentData;
    const formatNumber = this.formatNumber(azimuthDegrees);
    const cardinal = this.convertCardinal(azimuthDegrees);
    const direction = `${formatNumber}° ${cardinal}`;
    const formatedTime = this.formatTime(now);

    const contentText = `${formatedTime} - ${direction}`;
    return contentText;
  };

  _getAltituteData = (startTime: Date): { [key: string]: number } => {
    const result: { [key: string]: number } = {};
    const stepSize = 15 * 60 * 1000; // 15 minutes
    // time range 1 day
    const timeRange = 24 * 60 * 60 * 1000;
    const steps = timeRange / stepSize;

    for (let i = 0; i < steps; i++) {
      const time = new Date(startTime.getTime() + i * stepSize);
      const formatedTime = this.formatTime(time);
      const position = SunCalc.getMoonPosition(time, this.location.latitude, this.location.longitude);
      result[formatedTime] = Number(position.altitudeDegrees.toFixed(2));
    }

    return result;
  };

  _getDataAltitude = (startTime: Date) => {
    const stepConfig = this.config.graph_config?.time_step_size ?? 30;
    const result: { x: number; y: number }[] = [];
    const stepSize = stepConfig * 60 * 1000; // time step in minutes
    const timeRange = 24 * 60 * 60 * 1000; // 1 day
    const steps = timeRange / stepSize;

    for (let i = 0; i < steps; i++) {
      const time = new Date(startTime.getTime() + i * stepSize);
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

  _fetchtCurrentMoon = (): Record<string, any> => {
    const now = new Date();
    const hour = (now.getHours() + now.getMinutes() / 60) * 2;
    const index = Math.floor(hour) % 48;
    const currentData = SunCalc.getMoonData(now, this.location.latitude, this.location.longitude);
    const { azimuthDegrees, altitudeDegrees } = currentData;
    const formatNumber = this.formatNumber(azimuthDegrees);
    const cardinal = this.convertCardinal(azimuthDegrees);
    const direction = `${formatNumber}° ${cardinal}`;
    const formatedTime = this.formatTime(now);
    const altitude = `${this.formatNumber(altitudeDegrees)}°`;
    const rawData = {
      x: now.getTime(),
      y: Number(altitudeDegrees.toFixed(2)),
    };

    const contentBody: string[] = [];
    contentBody.push(altitude);
    contentBody.push(direction);

    return { currentHourIndex: index, body: contentBody, title: formatedTime, altitudeDegrees, rawData };
  };

  private convertCardinal = (degrees: number): string => {
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
    const direction = `${formatedAzimuth}°${cardinal}`;

    // Formated time
    const formatedTime = this.formatTime(time);

    const rawData = {
      x: time.getTime(),
      y: 'N/A',
    };

    // Show on chart
    const show = showOnChart(time);
    const isUp = timeKey === 'set' ? false : true;
    const lineOffset = 30;
    const timeValue = (time.getHours() + time.getMinutes() / 60) * 2;
    const index = Math.round(timeValue);
    const randomNum = Math.floor(Math.random() * (47 - 0 + 1)) + 0;
    const closetIndex = this._getClosestIndex(rawData.x, this.todayData.altitude);
    const position = {
      index: closetIndex,
      altitude,
      closetIndex,
    };

    return { show, position, isUp, formatedTime, lineOffset, direction, rawData };
  };

  _getClosestIndex = (time: number, data: { x: number; y: number }[]): number => {
    const closest = data.reduce((prev, curr) => {
      return Math.abs(curr.x - time) < Math.abs(prev.x - time) ? curr : prev;
    });
    return data.indexOf(closest);
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

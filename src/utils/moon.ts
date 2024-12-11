import * as SunCalc from '@noim/suncalc3';
import { FrontendLocaleData, formatNumber, relativeTime, formatTime } from 'custom-card-helpers';
import { DateTime, WeekdayNumbers } from 'luxon';

import { CHART_DATA } from '../const';
import { localize } from '../localize/localize';
import { LunarPhaseCardConfig, MoonData, MoonDataItem, MoonImage, DynamicChartData } from '../types';
import { MOON_IMAGES } from '../utils/moon-pic';
import { convertKmToMiles, compareTime } from './helpers';

type Location = {
  latitude: number;
  longitude: number;
};

// Moon class
export class Moon {
  readonly _date: Date;
  readonly location: Location;
  readonly config: LunarPhaseCardConfig;
  readonly locale: FrontendLocaleData;
  readonly useMiles: boolean;
  readonly lang: string;
  public dateTime: typeof DateTime;

  constructor(data: { date: Date; config: LunarPhaseCardConfig; locale: FrontendLocaleData }) {
    this._date = data.date;
    this.lang = data.locale.language;
    this.config = data.config;
    this.location = { latitude: data.config.latitude, longitude: data.config.longitude } as Location;
    this.locale = data.locale;
    this.useMiles = this.config.mile_unit || false;
    this.dateTime = DateTime;
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

  public get _dynamicDate(): Date {
    const now = DateTime.now();
    return now.toJSDate();
  }

  get _moonTime(): SunCalc.IMoonTimes {
    return SunCalc.getMoonTimes(this._date, this.location.latitude, this.location.longitude);
  }

  get _moonData(): SunCalc.IMoonData {
    return SunCalc.getMoonData(this._date, this.location.latitude, this.location.longitude);
  }

  get _moonIllimination(): SunCalc.IMoonIllumination {
    return SunCalc.getMoonIllumination(this._date);
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
      moonHighest: createMoonTime('moonHigh', new Date(highest as Date)),
      nextFullMoon: createItem('fullMoon', shortTime(fullMoon.value)),
      nextNewMoon: createItem('newMoon', shortTime(newMoon.value)),
      direction: createItem('azimuth', formatted.azimuth, '°', cardinal),
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
    const moonHighest = this._getMoonHighest(timeToday.highest as Date);
    // current moon

    // time markers

    // dataset

    let dataWithXY = this._getDataAltitude(startTime);

    if (moonHighest.rawData.y >= 0) {
      const changedIndexWithHighest = this._getClosestIndex(moonHighest.rawData.x, dataWithXY);
      dataWithXY[changedIndexWithHighest] = moonHighest.rawData;
    }

    dataWithXY = dataWithXY.sort((a, b) => a.x - b.x);

    const timeLabels = Object.values(dataWithXY).map((item) => item.x);
    const altitudeValues = Object.values(dataWithXY).map((item) => item.y);
    const minMaxY = {
      sugestedYMax: Math.round(Math.max(...altitudeValues)),
      sugestedYMin: Math.round(Math.min(...altitudeValues)),
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
    };

    return dataCotent;
  }

  get currentMoonData() {
    const currentMoon = this._fetchtCurrentMoon();
    return currentMoon;
  }

  get timeMarkers() {
    const timeMarkers = ['rise', 'set'].map((key) => this.timeDataSet(key));
    return timeMarkers;
  }

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

  get _dynamicChartData(): DynamicChartData {
    const now = this._dynamicDate;
    const offsetTime = new Date(now);
    offsetTime.setHours(now.getHours() - CHART_DATA.OFFSET_TIME, now.getMinutes());

    const startTime = offsetTime;
    const chartData = this._getDynamicDataAltitude(startTime);
    const moonTimes = this._getDynamicMoonTime(startTime);
    const moonIluumination = SunCalc.getMoonIllumination(startTime);
    const moonData = SunCalc.getMoonData(now, this.location.latitude, this.location.longitude);

    const dataResult = {
      chartData,
      times: {
        moon: moonTimes,
      },
      moonIllumination: moonIluumination,
      moonData,
    };
    return dataResult;
  }

  get timeData() {
    return {
      moon: this._getTimeData('moon'),
    };
  }

  private _getDynamicDataAltitude = (startTime: Date) => {
    const step = 5;
    const location = this.location;
    const stepSize = step * 60 * 1000;
    const timeRange = 24 * 60 * 60 * 1000;
    const steps = timeRange / stepSize;
    const result: { timeLabel: number; moon: { altitude: number; azimuth: string } }[] = [];
    for (let i = 0; i < steps; i++) {
      const time = new Date(startTime.getTime() + i * stepSize);
      const { altitudeDegrees, azimuthDegrees } = SunCalc.getMoonPosition(time, location.latitude, location.longitude);
      const azimuth = this.formatNumber(azimuthDegrees);
      const cardinal = this.convertCardinal(azimuthDegrees);
      const direction = `${azimuth}° ${cardinal}`;
      result.push({
        timeLabel: time.getTime(),
        moon: {
          altitude: Number(altitudeDegrees.toFixed(2)),
          azimuth: direction,
        },
      });
    }
    return result;
  };

  private _getDynamicMoonTime(startTime: Date): number[] {
    const location = this.location;
    const nextDay = new Date(startTime);
    nextDay.setDate(nextDay.getDate() + 1);
    const todayMoonTimes = SunCalc.getMoonTimes(startTime, location.latitude, location.longitude);
    const tomorrowMoonTimes = SunCalc.getMoonTimes(nextDay, location.latitude, location.longitude);
    return [todayMoonTimes.rise, todayMoonTimes.set, tomorrowMoonTimes.rise, tomorrowMoonTimes.set].map((time) =>
      new Date(time).getTime()
    );
  }

  private _getTimeData = (
    type: 'moon' | 'sun'
  ): { time: string; index: number; opacity: number; originalTime: number }[] => {
    const timeLabels = this._dynamicChartData.chartData.map((data) => data.timeLabel);
    const inrange = (time: number): boolean => {
      const startTime = timeLabels[0];
      const endTime = timeLabels[timeLabels.length - 1];
      return time >= startTime && time <= endTime;
    };

    const closestTime = (time: number): number => {
      const closest = timeLabels.reduce((prev, curr) => (Math.abs(curr - time) < Math.abs(prev - time) ? curr : prev));
      return closest;
    };

    const isPast = (time: number): Boolean => {
      return new Date(closestTime(time)) < this._date ? true : false;
    };

    const times = this._dynamicChartData.times[type];
    return times
      .filter((time: number) => inrange(time))
      .map((time: number) => ({
        time: formatTime(new Date(time), this.locale),
        index: timeLabels.indexOf(closestTime(time)),
        opacity: isPast(time) ? 0.5 : 1,
        originalTime: time,
      }));
  };

  _getMoonHighest = (highest: number | Date): Record<string, any> => {
    const { formatNumber } = this;
    const time = new Date(highest);
    const moonTransitPosition = SunCalc.getMoonPosition(time, this.location.latitude, this.location.longitude);

    const altitude = `${formatNumber(moonTransitPosition.altitudeDegrees)}°`;
    const azimuth = formatNumber(moonTransitPosition.azimuthDegrees);
    const cardinal = this.convertCardinal(moonTransitPosition.azimuthDegrees);
    const direction = `${azimuth}° ${cardinal}`;
    const formatedTime = this.formatTime(time);
    const rawData = {
      x: time.getTime(),
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

    const currentHourIndex = this._getClosestIndex(rawData.x, this.todayData.altitude);

    const contentBody: string[] = [];
    contentBody.push(altitude);
    contentBody.push(direction);

    return { currentHourIndex, body: contentBody, title: formatedTime, altitudeDegrees, rawData };
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
    const formattedAltitude = this.formatNumber(altitude);

    // Formated time
    const formatedTime = this.formatTime(time);

    const rawData = {
      x: time.getTime(),
      y: Number(altitude),
    };

    const body: string[] = [];
    body.push(`${formattedAltitude}°`);
    body.push(direction);

    // Show on chart
    const show = showOnChart(time);
    const isUp = timeKey === 'set' ? false : true;
    const lineOffset = 30;
    const closetIndex = this._getClosestIndex(rawData.x, this.todayData.altitude);
    const position = {
      index: closetIndex,
      altitude,
      closetIndex,
    };

    return { show, position, isUp, formatedTime, lineOffset, direction, rawData, body };
  };

  _getClosestIndex = (time: number, data: { x: number; y: number }[]): number => {
    const closest = data.reduce((prev, curr) => {
      return Math.abs(curr.x - time) < Math.abs(prev.x - time) ? curr : prev;
    });
    return data.indexOf(closest);
  };

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

  _getDaysOfWeek(lang: string): string[] {
    const daysOfTheWeek = Array.from({ length: 7 }, (_, i) => {
      return DateTime.local()
        .set({ weekday: (i + 1) as WeekdayNumbers })
        .setLocale(lang)
        .toFormat('ccc');
    });
    return daysOfTheWeek;
  }

  _getEmojiForPhase(date: Date): string {
    const moonIllumination = SunCalc.getMoonIllumination(date);
    return moonIllumination.phase.emoji;
  }

  _getPhaseNameForPhase(date: Date): string {
    const moonIllumination = SunCalc.getMoonIllumination(date);
    return this.localize(`card.phase.${moonIllumination.phase.id}`);
  }
}

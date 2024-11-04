import * as SunCalc from '@noim/suncalc3';
import { localize } from '../localize/localize';
import { LunarPhaseCardConfig, MoonData, MoonDataItem, MoonImage, Location } from '../types';
import { formatRelativeTime, formatedTime, convertKmToMiles } from './helpers';
import { MOON_IMAGES } from '../utils/moon-pic';
import { FrontendLocaleData, formatNumber } from 'custom-card-helpers';

export class Moon {
  readonly _date: Date;
  readonly lang: string;
  readonly location: Location;
  readonly config: LunarPhaseCardConfig;
  readonly locale: FrontendLocaleData;
  readonly amPm: boolean;
  readonly useMiles: boolean;

  constructor(data: { date: Date; lang: string; config: LunarPhaseCardConfig; locale: FrontendLocaleData }) {
    this._date = data.date;
    this.lang = data.lang;
    this.config = data.config;
    this.location = { latitude: data.config.latitude, longitude: data.config.longitude } as Location;
    this.locale = data.locale;
    this.amPm = this.config['12hr_format'] || false;
    this.useMiles = this.config.mile_unit || false;
  }

  private localize = (string: string, search = '', replace = ''): string => {
    return localize(string, this.lang, search, replace);
  };

  private formatTime = (time: number | Date): string => {
    return formatedTime(time, this.amPm, this.lang);
  };

  private convertKmToMiles = (km: number): number => {
    return convertKmToMiles(km, this.useMiles);
  };

  private formatNumber = (num: string | number): string => {
    return formatNumber(num, this.locale);
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
    const localizeRelativeTime = (time: number | Date) => {
      const relativeTime = formatRelativeTime(new Date(time).toISOString());
      return relativeTime.value
        ? this.localize(relativeTime.key, '{0}', relativeTime.value)
        : this.localize(relativeTime.key);
    };

    const timeString = this.formatTime(time);

    // const value = formatTimeToHHMM(new Date(time).toISOString(), this.lang, timeFormat);
    const secondValue = localizeRelativeTime(time);
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
      moonFraction: formatNumber((fraction * 100).toFixed(2)),
      moonAge: formatNumber((phaseValue * 29.53).toFixed(2)),
      distance: formatNumber(convertKmToMiles(distance).toFixed(2)),
      azimuth: formatNumber(azimuthDegrees.toFixed(2)),
      altitude: formatNumber(altitudeDegrees.toFixed(2)),
    };

    const cardinal = convertCardinal(azimuthDegrees);
    // Construct moon data items
    return {
      moonFraction: createItem('illumination', formatted.moonFraction, '%'),
      moonAge: createItem('moonAge', formatted.moonAge, localize('card.relativeTime.days')),
      moonRise: createMoonTime('moonRise', rise),
      moonSet: createMoonTime('moonSet', set),
      moonHighest: highest ? createMoonTime('moonHigh', highest) : undefined,
      distance: createItem('distance', formatted.distance, useMiles ? 'mi' : 'km'),
      azimuthDegress: createItem('azimuth', formatted.azimuth, '°'),
      altitudeDegrees: createItem('altitude', formatted.altitude, '°'),
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
    const dataCotent = {
      time: timeToday,
      altitude: this._getAltituteData(startTime),
      direction: {
        rise: this.timePostion('rise'),
        set: this.timePostion('set'),
      },
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
    };

    return dataCotent;
  }

  _getRiseSetData = (timeKey: string) => {
    const today = new Date();
    const timeData = SunCalc.getMoonTimes(today, this.location.latitude, this.location.longitude);
    const time = new Date(timeData[timeKey]);
    const hour = time.getHours() + time.getMinutes() / 60;
    const index = Math.floor(hour * 2);
    const postition = this._getMoonPosition(time);
    const altitude = postition.altitudeDegrees;

    return { index, altitude };
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

  timePostion = (timeKey: string): string => {
    const today = new Date();
    const timeData = SunCalc.getMoonTimes(today, this.location.latitude, this.location.longitude);
    const time = new Date(timeData[timeKey]);
    const position = this._getMoonPosition(time);
    const azimuth = position.azimuthDegrees;
    const cardinal = this.convertCardinal(azimuth);

    const formatedAzimuth = this.formatNumber(azimuth.toFixed(2));
    return `${formatedAzimuth}° ${cardinal}`;
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
      const phaseAge = this.formatNumber((moonIlumin.phaseValue * 29.53).toFixed(0));

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
      const phaseAge = this.formatNumber((moonIllumination.phaseValue * 29.53).toFixed(0));

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

import * as SunCalc from '@noim/suncalc3';
import { localize } from '../localize/localize';
import { LunarPhaseCardConfig, MoonData, MoonDataItem, MoonImage, Location } from '../types';
import { formatTimeToHHMM, formatRelativeTime } from './helpers';
import { MOON_IMAGES } from '../utils/moon-pic';
import { FrontendLocaleData, formatTime } from 'custom-card-helpers';

export class Moon {
  readonly _date: Date;
  readonly lang: string;
  readonly location: Location;
  readonly config: LunarPhaseCardConfig;
  readonly locale: FrontendLocaleData;

  constructor(data: { date: Date; lang: string; config: LunarPhaseCardConfig; locale: FrontendLocaleData }) {
    this._date = data.date;
    this.lang = data.lang;
    this.config = data.config;
    this.location = { latitude: data.config.latitude, longitude: data.config.longitude } as Location;
    this.locale = data.locale;
  }

  private localize = (string: string, search = '', replace = ''): string => {
    return localize(string, this.lang, search, replace);
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

  createItem = (label: string, value: string, unit?: string, secondValue?: string): MoonDataItem => ({
    label: this.localize(`card.${label}`),
    value: `${value}${unit ? ` ${unit}` : ''}`,
    secondValue: secondValue ? `${secondValue}` : '',
  });

  createMoonTime = (key: string, time: number | Date): MoonDataItem => {
    const timeFormat = this.config['12hr_format'] || false;
    const localizeRelativeTime = (time: number | Date) => {
      const relativeTime = formatRelativeTime(new Date(time).toISOString());
      return relativeTime.value
        ? this.localize(relativeTime.key, '{0}', relativeTime.value)
        : this.localize(relativeTime.key);
    };
    const value = formatTimeToHHMM(new Date(time).toISOString(), this.lang, timeFormat);
    const secondValue = localizeRelativeTime(time);
    return this.createItem(key, value, '', secondValue);
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
    const { createItem, createMoonTime } = this;
    const shortTime = (date: number | Date) =>
      new Date(date).toLocaleDateString(this.lang, { weekday: 'short', month: 'short', day: 'numeric' });

    const { distance, azimuthDegrees, altitudeDegrees } = this._moonData;
    const { fraction, phaseValue } = this._moonData.illumination;
    const { fullMoon, newMoon } = this._moonData.illumination.next;
    const { rise, set, highest } = this._moonTime;
    const data = {
      moonFraction: createItem('illumination', `${(fraction * 100).toFixed(2)}%`),
      moonAge: createItem('moonAge', `${(phaseValue * 29.53).toFixed(2)}`, this.localize('card.relativeTime.days')),
      moonRise: createMoonTime('moonRise', rise),
      moonSet: createMoonTime('moonSet', set),
      moonHighest: highest ? createMoonTime('moonHigh', highest) : undefined,
      distance: createItem('distance', distance.toFixed(2), 'km'),
      azimuthDegress: createItem('azimuth', azimuthDegrees.toFixed(2), '°'),
      altitudeDegrees: createItem('altitude', altitudeDegrees.toFixed(2), '°'),
      nextFullMoon: createItem('fullMoon', shortTime(fullMoon.value)),
      nextNewMoon: createItem('newMoon', shortTime(newMoon.value)),
    };

    return data;
  }
  _getMoonTime = (today: Date): SunCalc.IMoonTimes => {
    return SunCalc.getMoonTimes(today, this.location.latitude, this.location.longitude);
  };

  _getMoonTransit = (rise: Date, set: Date): { main: Date | null; invert: Date | null } => {
    return SunCalc.moonTransit(rise, set, this.location.latitude, this.location.longitude);
  };

  _convertCardinal = (degrees: number): string => {
    const cardinalPoints = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW', 'N'];
    return cardinalPoints[Math.round(degrees / 45)];
  };

  _getDirection() {
    const { azimuthDegrees, altitudeDegrees } = this._moonData;
    const formatedPosition = altitudeDegrees > 0 ? 'overHorizon' : 'underHorizon';
    const cardiNalValue = this._convertCardinal(azimuthDegrees);
    const data = {
      positionFormated: this.createItem('position', this.localize(`card.${formatedPosition}`)),
      azimuthCardinal: this.createItem('direction', azimuthDegrees.toFixed(0), '°', cardiNalValue),
    };
    return data;
  }
  _getAltituteData = (startTime: Date) => {
    const result: { [key: string]: number } = {};
    for (let i = 0; i < 24; i++) {
      const time = new Date(startTime.getTime() + i * 60 * 60 * 1000);
      const formatedTime = formatTime(time, this.locale);
      const position = SunCalc.getMoonPosition(time, this.location.latitude, this.location.longitude);
      result[formatedTime] = Number(position.altitudeDegrees.toFixed(2));
    }
    return result;
  };

  _getAltitudeToday = () => {
    const today = new Date();

    const startTime = new Date(today.setHours(0, 0, 0, 0));
    const { altitudeDegrees, moonFraction } = this.moonData;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data: { [key: string]: any } = {};

    data['time'] = SunCalc.getMoonTimes(today, this.location.latitude, this.location.longitude);
    const altitudeData = this._getAltituteData(startTime);
    data['altitude'] = altitudeData;
    data['moonPhase'] = SunCalc.getMoonIllumination(today);
    data['moonPhase'] = {
      ...data['moonPhase'],
    };
    const direction = this._getDirection();
    data['dataItem'] = {
      ...direction,
      altitudeDegrees,
      moonFraction,
    };

    data['lang'] = {
      rise: this.localize('card.moonRise'),
      set: this.localize('card.moonSet'),
    };
    return data;
  };
}

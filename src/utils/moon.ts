import * as SunCalc from '@noim/suncalc3';
import { localize } from '../localize/localize';
import { LunarPhaseCardConfig, MoonData, MoonDataItem, MoonImage, Location } from '../types';
import { formatTimeToHHMM, formatRelativeTime } from './helpers';
import { MOON_IMAGES } from '../const';

export class Moon {
  _date: Date;
  lang: string;
  location: Location;
  config: LunarPhaseCardConfig;

  constructor(date: Date, location: Location, lang: string, config: LunarPhaseCardConfig) {
    this._date = date;
    this.lang = lang;
    this.location = location;
    this.config = config;
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
    const phaseIndex = Math.round(this._moonData.illumination.phaseValue * 16) % 16;
    const rotateDeg = this._moonData.parallacticAngle ? 180 - (this._moonData.parallacticAngle * 180) / Math.PI : 0;
    return {
      moonPic: MOON_IMAGES[phaseIndex],
      rotateDeg: rotateDeg,
    };
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
}

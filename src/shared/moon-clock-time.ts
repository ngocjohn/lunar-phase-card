import { LitElement, html, css, nothing, PropertyValues } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';

import { FrontendLocaleData, HomeAssistant } from '../ha';
import { resolveTimeZone } from '../ha/common/datetime/resolve-time-zone';
import { useAmPm } from '../utils/helpers';

const INTERVAL = 1000;

@customElement('lunar-moon-clock-time')
export class LunarMoonClockTime extends LitElement {
  @property({ attribute: false }) public hass?: HomeAssistant;
  @property({ attribute: false }) public configLocale?: FrontendLocaleData;

  @state() private _dateTimeFormat?: Intl.DateTimeFormat;

  @state() private _timeHour?: string;

  @state() private _timeMinute?: string;

  @state() private _timeSecond?: string;

  @state() private _timeAmPm?: string;

  private _tickInterval?: undefined | number;

  private _initDate() {
    if (!this.configLocale || !this.hass) {
      return;
    }

    const locale = this.configLocale;

    const h12 = useAmPm(locale);

    this._dateTimeFormat = new Intl.DateTimeFormat(locale.language, {
      hour: h12 ? 'numeric' : '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hourCycle: h12 ? 'h12' : 'h23',
      timeZone: resolveTimeZone(locale.time_zone, this.hass.config.time_zone),
    });

    this._tick();
  }

  protected updated(changedProps: PropertyValues) {
    if (changedProps.has('configLocale') && this.configLocale) {
      this._initDate();
    }
  }

  public connectedCallback() {
    super.connectedCallback();
    this._startTick();
  }

  public disconnectedCallback() {
    super.disconnectedCallback();
    this._stopTick();
  }

  private _startTick() {
    this._tickInterval = window.setInterval(() => this._tick(), INTERVAL);
    this._tick();
  }

  private _stopTick() {
    if (this._tickInterval) {
      clearInterval(this._tickInterval);
      this._tickInterval = undefined;
    }
  }

  private _tick() {
    if (!this._dateTimeFormat) return;

    const parts = this._dateTimeFormat.formatToParts();

    this._timeHour = parts.find((part) => part.type === 'hour')?.value;
    this._timeMinute = parts.find((part) => part.type === 'minute')?.value;
    this._timeSecond = parts.find((part) => part.type === 'second')?.value;
    this._timeAmPm = parts.find((part) => part.type === 'dayPeriod')?.value;
  }

  protected render() {
    if (!this.configLocale) return nothing;

    return html`
      <div class="time-container">
        <span class="time-hour">${this._timeHour}</span>: <span class="time-minute">${this._timeMinute}</span>:
        <span class="time-second">${this._timeSecond}</span>
        ${this._timeAmPm !== undefined ? html` <span class="time-ampm">${this._timeAmPm}</span>` : nothing}
      </div>
    `;
  }
  static styles = css`
    :host {
      display: block;
    }
    .time-container {
      font-size: inherit;
      font-weight: inherit;
      color: inherit;
    }
    .time-hour,
    .time-minute,
    .time-second,
    .time-ampm {
      display: inline-block;
    }
  `;
}

declare global {
  interface HTMLElementTagNameMap {
    'lunar-moon-clock-time': LunarMoonClockTime;
  }
}

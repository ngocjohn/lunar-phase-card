/* eslint-disable @typescript-eslint/no-explicit-any */
import { LitElement, html, TemplateResult, PropertyValues, CSSResultGroup } from 'lit';
import { customElement, property, state } from 'lit/decorators';
import { classMap } from 'lit/directives/class-map.js';
import { styleMap } from 'lit-html/directives/style-map.js';

import SunCalc from 'suncalc3';
import { LovelaceCardEditor, hasConfigOrEntityChanged } from 'custom-card-helpers';
import { HomeAssistantExtended as HomeAssistant, LunarPhaseCardConfig, defaultConfig } from './types';
import { formatRelativeTime, formatTimeToHHMM, formatDate } from './utils/helpers';
import { BACKGROUND } from './const';
import { MOON_IMAGES } from './const';
import { BASE_REFRESH_INTERVAL } from './const';

import style from './css/style.css';

import './components/moon-data';

@customElement('lunar-phase-card')
export class LunarPhaseCard extends LitElement {
  public static async getConfigElement(): Promise<LovelaceCardEditor> {
    await import('./editor');
    return document.createElement('lunar-phase-card-editor');
  }

  @property({ attribute: false }) public hass!: HomeAssistant;
  @property({ type: Object }) private config!: LunarPhaseCardConfig;

  @state() private _activeCard: string = 'base';
  @state() private _baseMoonData: Record<string, any> = {};
  @state() private latitude: number = 0;
  @state() private longitude: number = 0;
  @state() private selectedDate: Date | undefined;
  @state() private _connected: boolean = false;
  @state() private _refreshInterval: number | undefined;

  public static getStubConfig = (): Record<string, unknown> => {
    return {
      ...defaultConfig,
    };
  };

  public async setConfig(config: LunarPhaseCardConfig): Promise<void> {
    if (!config) {
      throw new Error('Invalid configuration');
    }

    this.config = {
      ...config,
    };
  }

  private getGridRowSize(): number {
    const isCompact = this.config.compact_view;
    const isCalendar = this._activeCard === 'calendar';
    let gridRowSize = 2; // 1 = 56px + gutter 8px
    if (!isCompact) gridRowSize += 2;
    if (isCalendar) gridRowSize += 6;
    return gridRowSize;
  }

  public getLayoutOptions() {
    const gridRowSize = this.getGridRowSize();
    return {
      grid_min_rows: gridRowSize,
      grid_max_rows: 8,
      grid_columns: 4,
      grid_min_columns: 4,
    };
  }

  public getCardSize(): number {
    return this.getGridRowSize();
  }

  protected firstUpdated(changedProps: PropertyValues) {
    super.firstUpdated(changedProps);
    this._setBackgroundCss();
    this.getLatLong();
  }

  connectedCallback(): void {
    super.connectedCallback();
    if (process.env.ROLLUP_WATCH === 'true') {
      window.LunarCard = this;
    }
    this._connected = true;
    this.fetchBaseMoonData();
    this.startRefreshInterval();
  }

  disconnectedCallback(): void {
    if (process.env.ROLLUP_WATCH === 'true' && window.LunarCard === this) {
      window.LunarCard = undefined;
    }
    this.clearRefreshInterval();
    this._connected = false;
    super.disconnectedCallback();
  }

  protected updated(changedProps: PropertyValues) {
    super.updated(changedProps);
    if (changedProps.has('_activeCard')) {
      if (this._activeCard === 'base') {
        this.selectedDate = undefined;
        this.fetchBaseMoonData();
        this.startRefreshInterval();
      } else {
        this.clearRefreshInterval();
      }
    }
    if (changedProps.has('config')) {
      this.getLatLong();
      this.fetchBaseMoonData();
    }
  }

  private fetchBaseMoonData() {
    this._baseMoonData = this._getBaseMoonData();
  }

  private getLatLong(): { latitude: number; longitude: number } {
    if (this.config.latitude !== undefined && this.config.longitude !== undefined) {
      this.latitude = this.config.latitude;
      this.longitude = this.config.longitude;
      this.config.use_default = false; // Changed to assignment
    }
    if (!this.config.latitude && !this.config.longitude) {
      const { latitude, longitude } = this.hass.config;
      this.latitude = latitude;
      this.longitude = longitude;
      this.config.use_default = true; // Changed to assignment
    }

    if (this.config.entity) {
      this.config.use_default = false; // Changed to assignment

      const entity = this.hass.states[this.config.entity];
      if (entity) {
        this.latitude = entity.attributes.location.latitude;
        this.longitude = entity.attributes.location.longitude;
      }
    }

    return { latitude: this.latitude, longitude: this.longitude };
  }

  get _isCalendar(): boolean {
    return this._activeCard === 'calendar';
  }

  get _showBackground(): boolean {
    return this.config.show_background || false;
  }

  get _today() {
    const date = new Date();
    return date;
  }

  get _moonIllumination() {
    const date = this.selectedDate ? new Date(this.selectedDate) : this._today;
    return this._getMoonIllumination(date);
  }

  get _moonPosition() {
    const date = this.selectedDate ? new Date(this.selectedDate) : this._today;
    return this._getMoonPosition(date, this.latitude, this.longitude);
  }

  get _moonTimes() {
    const date = this.selectedDate ? new Date(this.selectedDate) : this._today;
    return this._getMoonTimes(date, this.latitude, this.longitude);
  }

  get _moonPhaseName(): string {
    return this._moonIllumination.phase.name;
  }

  private startRefreshInterval() {
    // Clear any existing interval to avoid multiple intervals running
    if (this._refreshInterval) {
      clearInterval(this._refreshInterval);
    }

    // Set up a new interval
    this._refreshInterval = window.setInterval(() => {
      if (this._activeCard === 'base') {
        this.fetchBaseMoonData();
      } else {
        this.clearRefreshInterval();
      }
    }, BASE_REFRESH_INTERVAL);
  }

  private clearRefreshInterval() {
    if (this._refreshInterval) {
      clearInterval(this._refreshInterval);
      this._refreshInterval = undefined;
    }
  }

  protected shouldUpdate(changedProps: PropertyValues): boolean {
    if (changedProps.has('hass') || changedProps.has('config')) {
      return true;
    }

    return hasConfigOrEntityChanged(this, changedProps, false);
  }

  protected render(): TemplateResult {
    if (!this.hass || !this.config) {
      return html``;
    }

    return html`
      <ha-card class=${this._computeClasses()}>
        ${this.renderHeader()}
        <div class="lunar-card-content ${this._isCalendar ? 'flex-col' : ''}">
        ${this.renderPage(this._activeCard)}
      </ha-card>
    `;
  }

  private renderPage(page: string): TemplateResult | void {
    switch (page) {
      case 'base':
        return this.renderBaseCard();
      case 'calendar':
        return this.renderCalendar();
      default:
        return this.renderBaseCard();
    }
  }

  private renderBaseCard(): TemplateResult | void {
    return html` ${this.renderMoonImage()} ${this.renderMoonData()} `;
  }

  private renderHeader(): TemplateResult | void {
    if (this.config.compact_view && this._activeCard === 'base') return;

    return html`
      <div class="lunar-card-header">
        <h1>${this._moonPhaseName}</h1>
        <div @click=${() => this.togglePage()} class="btn-calendar click-shrink">
          <ha-icon icon="mdi:calendar-search"></ha-icon>
        </div>
      </div>
    `;
  }

  private renderMoonImage(): TemplateResult {
    const moonSize = this._isCalendar ? 'calc(30% - 1px)' : 'calc(25% - 1px)';
    const { moonImage, rotateDeg } = this._baseMoonData.moonImage;

    const style = {
      maxWidth: moonSize,
      transform: `rotate(${rotateDeg}deg)`,
    };

    return html` <div class="moon-image" style="${styleMap(style)}">
      <img src=${moonImage} class="rotatable" />
    </div>`;
  }

  private renderMoonData(): TemplateResult {
    const compactView = this.config.compact_view && this._activeCard === 'base';
    return html`
      ${compactView
        ? this.renderCompactView()
        : html`<lunar-base-data .baseMoonData=${this._baseMoonData}></lunar-base-data> `}
    `;
  }

  private renderCompactView(): TemplateResult {
    const { moonFraction, moonRise, moonSet, moonAge } = this._baseMoonData;
    const renderCompactItem = (icon: string, value: string, unit: string, label: string): TemplateResult => {
      return html`
        <div class="compact-item">
          <div class="icon-value">
            <ha-icon icon=${icon}></ha-icon>
            <span class="label">${value} ${unit}</span>
          </div>
          <span class="value">${label}</span>
        </div>
      `;
    };

    return html`
      <div @click=${this.togglePage} class="btn-calendar compact click-shrink">
        <ha-icon icon="mdi:calendar-search"></ha-icon>
      </div>
      <div class="compact-view">
        <div class="moon-phase-name"><h1>${this._moonPhaseName}</h1></div>
        <div class="moon-fraction">${moonFraction.value} ${moonFraction.unit} Illuminated</div>
        <div class="compact-view-items">
          ${renderCompactItem('mdi:progress-clock', moonAge.value, moonAge.unit, moonAge.label)}
          ${renderCompactItem('mdi:weather-moonset-up', moonRise.value, '', moonRise.label)}
          ${renderCompactItem('mdi:weather-moonset', moonSet.value, '', moonSet.label)}
        </div>
      </div>
    `;
  }

  private renderCalendar(): TemplateResult | void {
    if (this._activeCard === 'base') return;
    // Initialize selectedDate to today if it is not already set
    if (!this.selectedDate) {
      this.selectedDate = this._today;
    }

    const formattedDate = formatDate(this.selectedDate);

    const dateInput = html`<div class="date-input-wrapper">
      <button @click=${() => this.updateDate('prev')} class="date-input-btn click-shrink"><</button>

      <input type="date" class="date-input" .value=${formattedDate} @input=${this._handleDateChange} />
      <button @click=${() => this.updateDate('next')} class="date-input-btn click-shrink">></button>
    </div>`;

    return html`
      ${this.renderMoonImage()}
      <div class="calendar-wrapper">${dateInput}${this.renderMoonData()}</div>
    `;
  }

  private updateDate(action?: 'next' | 'prev') {
    const date = new Date(this.selectedDate || this._today);
    if (action === 'next') {
      date.setDate(date.getDate() + 1);
    } else if (action === 'prev') {
      date.setDate(date.getDate() - 1);
    }
    this.selectedDate = date;
    this.fetchBaseMoonData();
  }

  private _handleDateChange(event: Event) {
    const input = event.target as HTMLInputElement;
    this.selectedDate = new Date(input.value);

    this.fetchBaseMoonData();
    // Handle the date change logic as needed
  }

  private togglePage(): void {
    this._activeCard = this._activeCard === 'base' ? 'calendar' : 'base';
  }

  private _getBaseMoonData() {
    const { rise, set, highest } = this._moonTimes;
    const { phaseValue, fraction } = this._moonIllumination;
    const { fullMoon, newMoon } = this._moonIllumination.next;
    const parallacticAngle = this._moonPosition.parallacticAngle;
    // const parallacticAngleDeg = this._moonPosition.parallacticAngleDegrees;
    const phaseName = this._moonIllumination.phase.name;
    const { distance, azimuthDegrees, altitudeDegrees } = this._moonPosition;
    const phaseIndex = Math.round(phaseValue * 16) % 16;

    const rotateDeg = parallacticAngle ? 180 - (parallacticAngle * 180) / Math.PI : 0;

    const formatDate = (date: string) => new Date(date).toISOString();

    const createMoonDataItem = (label: string, value: string, secondValue: string = '', unit: string = '') => ({
      label,
      value,
      secondValue,
      unit,
    });
    const createMoonImageData = (moonImage: string, moonPhaseName: string, rotateDeg: number) => ({
      moonImage,
      moonPhaseName,
      rotateDeg,
    });

    return {
      moonFraction: createMoonDataItem('Illumination', (fraction * 100).toFixed(2), '', '%'),
      moonAge: createMoonDataItem('Moon Age', (phaseValue * 29.5).toFixed(2), '', 'days'),
      moonRise: createMoonDataItem(
        'Moonrise',
        formatTimeToHHMM(formatDate(rise)),
        formatRelativeTime(formatDate(rise)),
      ),
      moonSet: createMoonDataItem('Moonset', formatTimeToHHMM(formatDate(set)), formatRelativeTime(formatDate(set))),
      moonHighest: createMoonDataItem(
        'Moon Highest',
        formatTimeToHHMM(formatDate(highest || '')),
        formatRelativeTime(formatDate(highest || '')),
        '',
      ),
      distance: createMoonDataItem('Distance', distance.toFixed(2), '', 'km'),
      azimuthDegress: createMoonDataItem('Azimuth', azimuthDegrees.toFixed(2), '', '°'),
      altitudeDegrees: createMoonDataItem('Altitude', altitudeDegrees.toFixed(2), '', '°'),
      nextFullMoon: createMoonDataItem(
        'Full Moon',
        new Date(fullMoon.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
        '',
        '',
      ),
      nextNewMoon: createMoonDataItem(
        'New Moon',
        new Date(newMoon.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
        '',
        '',
      ),
      phaseName: createMoonDataItem('Phase Name', phaseName, '', ''),
      moonImage: createMoonImageData(MOON_IMAGES[phaseIndex], phaseName, rotateDeg),
    };
  }

  private _getMoonIllumination(date) {
    const moonIllumination = SunCalc.getMoonIllumination(date);
    return moonIllumination;
  }

  private _getMoonPosition(date, latitude: number, longitude: number) {
    const moonPosition = SunCalc.getMoonPosition(date, latitude, longitude);
    return moonPosition;
  }

  private _getMoonTimes = (date, latitude: number, longitude: number) => {
    const moonTimes = SunCalc.getMoonTimes(date, latitude, longitude);
    return moonTimes;
  };

  private _computeClasses() {
    return classMap({
      '--background': this._showBackground,
    });
  }

  private _setBackgroundCss() {
    const background = this.config.custom_background || BACKGROUND;
    this.style.setProperty('--lunar-background-image', `url(${background})`);
  }

  // https://lit.dev/docs/components/styles/
  public static get styles(): CSSResultGroup {
    return [style];
  }
}

(window as any).customCards = (window as any).customCards || [];
(window as any).customCards.push({
  type: 'lunar-phase-card',
  name: 'Lunar Phase Card',
  preview: true,
  description: 'A custom card to display the current lunar phase.',
});

declare global {
  interface Window {
    LunarCard: LunarPhaseCard | undefined;
  }
  interface HTMLElementTagNameMap {
    'lunar-phase-card': LunarPhaseCard;
  }
}

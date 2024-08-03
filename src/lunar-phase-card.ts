/* eslint-disable @typescript-eslint/no-explicit-any */
import { LitElement, html, TemplateResult, PropertyValues, CSSResultGroup } from 'lit';
import { customElement, property, state } from 'lit/decorators';
import { classMap } from 'lit/directives/class-map.js';
import { styleMap } from 'lit-html/directives/style-map.js';

import SunCalc from 'suncalc3';
import { LovelaceCardEditor, hasConfigOrEntityChanged, fireEvent } from 'custom-card-helpers';
import { HomeAssistantExtended as HomeAssistant, LunarPhaseCardConfig, defaultConfig } from './types';
import { formatRelativeTime, formatTimeToHHMM } from './utils/helpers';
import { BACKGROUND } from './const';
import { MOON_IMAGES } from './const';
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

  @state() private _activeCard: string = '' || 'base';
  @state() private _baseMoonData: Record<string, any> = {};
  @property({ type: Number }) private latitude: number = 0;
  @property({ type: Number }) private longitude: number = 0;
  @state() private selectedDate: string | undefined;

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

  protected firstUpdated(changedProps: PropertyValues) {
    super.firstUpdated(changedProps);
    this._setBackgroundCss();
    this.fetchBaseMoonData();
  }

  private fetchBaseMoonData() {
    this._baseMoonData = this._getBaseMoonData();
    this.requestUpdate();
  }

  private getLatLong(): { latitude: number; longitude: number } {
    if (this.config.latitude !== undefined && this.config.longitude !== undefined) {
      this.latitude = this.config.latitude;
      this.longitude = this.config.longitude;
      this.config.use_default = false; // Changed to assignment
    } else if (!this.config.latitude && !this.config.longitude) {
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

    // Ensure the state updates and reflects in the UI
    this.requestUpdate();

    return { latitude: this.latitude, longitude: this.longitude };
  }

  get _showBackground(): boolean {
    return this.config.show_background || false;
  }

  get _today(): Date {
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

  connectedCallback(): void {
    super.connectedCallback();
    if (process.env.ROLLUP_WATCH === 'true') {
      window.LunarCard = this;
    }
    this.fetchBaseMoonData();
  }

  disconnectedCallback(): void {
    if (process.env.ROLLUP_WATCH === 'true' && window.LunarCard === this) {
      window.LunarCard = undefined;
    }
    super.disconnectedCallback();
  }

  protected updated(changedProps: PropertyValues) {
    super.updated(changedProps);
    if (changedProps.has('_activeCard') && this._activeCard === 'base') {
      this.selectedDate = undefined;
      this.fetchBaseMoonData();
    }
    if (changedProps.has('config')) {
      this.getLatLong();
    }
  }

  protected shouldUpdate(changedProps: PropertyValues): boolean {
    if (changedProps.has('hass') || changedProps.has('config')) {
      return true;
    }
    if (changedProps.has('_activeCard')) {
      return true;
    }

    if (changedProps.has('selectedDate') || changedProps.has('_baseMoonData')) {
      return true;
    }

    return hasConfigOrEntityChanged(this, changedProps, true);
  }

  protected render(): TemplateResult {
    if (!this.hass || !this.config) {
      return html``;
    }
    const isCalendar = this._activeCard === 'calendar';
    return html`
      <ha-card class=${this._computeClasses()}>
        ${this.renderHeader()}
        <div class="lunar-card-content ${isCalendar ? 'flex-col' : ''}">
        ${this.renderPage(this._activeCard)}
      </ha-card>
    `;
  }

  private renderPage(page: string): TemplateResult | void {
    switch (page) {
      case 'base':
        return this.renderBaseMoonData();
      case 'calendar':
        return this.renderCalendar();
      default:
        return this.renderBaseMoonData();
    }
  }

  private renderBaseMoonData(): TemplateResult | void {
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
    const moonImageData = this._getMoonImageData();
    const style = {
      transform: `rotate(${moonImageData.rotateDeg}deg)`,
      marginBottom: `${this.config.compact_view ? '' : '2rem'}`,
    };
    return html` <div class="moon-image slide-animation " style=${styleMap(style)}>
      <img src=${moonImageData.moonImage} alt="${moonImageData.moonPhaseName}" />
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
    const { moonFraction, moonRise, moonSet, moonAge } = this._baseMoonData || {};

    if (!moonFraction || !moonRise || !moonSet || !moonAge) {
      return html`<div>Loading...</div>`;
    }

    return html`
      <div @click=${this.togglePage} class="btn-calendar compact click-shrink">
        <ha-icon icon="mdi:calendar-search"></ha-icon>
      </div>
      <div class="compact-view">
        <div class="moon-phase-name"><h1>${this._moonPhaseName}</h1></div>
        <div class="moon-fraction">${moonFraction.value} ${moonFraction.unit} Illuminated</div>
        <div class="compact-view-items">
          ${this.renderCompactItem('mdi:progress-clock', moonAge.value, moonAge.unit, moonAge.label)}
          ${this.renderCompactItem('mdi:weather-sunset-up', moonRise.value, '', moonRise.label)}
          ${this.renderCompactItem('mdi:weather-sunset-down', moonSet.value, '', moonSet.label)}
        </div>
      </div>
    `;
  }

  private renderCompactItem(icon: string, value: string, unit: string, label: string): TemplateResult {
    return html`
      <div class="compact-item">
        <div class="icon-value">
          <ha-icon icon=${icon}></ha-icon>
          <span class="label">${value} ${unit}</span>
        </div>
        <span class="value">${label}</span>
      </div>
    `;
  }

  private renderCalendar(): TemplateResult | void {
    // Initialize selectedDate to today if it is not already set
    if (!this.selectedDate) {
      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0'); // Months are 0-indexed
      const day = String(today.getDate()).padStart(2, '0');
      this.selectedDate = `${year}-${month}-${day}`;
    }
    const dateInput = html`<div class="date-input-wrapper">
      <input type="date" class="date-input" .value=${this.selectedDate} @input=${this._handleDateChange} />
      <button @click=${() => this.updateDate('today')} class="date-input-btn click-shrink">Today</button>
      <button @click=${() => this.updateDate('prev')} class="date-input-btn click-shrink">Previous day</button>
      <button @click=${() => this.updateDate('next')} class="date-input-btn click-shrink">Next day</button>
    </div>`;

    return html`
      ${this.renderMoonImage()}
      <div class="calendar-wrapper">${dateInput}${this.renderMoonData()}</div>
    `;
  }

  private updateDate(action?: 'next' | 'prev' | 'today') {
    const date = new Date(this.selectedDate || this._today);
    if (action === 'next') {
      date.setDate(date.getDate() + 1);
    } else if (action === 'prev') {
      date.setDate(date.getDate() - 1);
    } else {
      date.setDate(this._today.getDate());
    }
    this.selectedDate = date.toISOString().split('T')[0];
    this.fetchBaseMoonData();
  }

  private _handleDateChange(event: Event) {
    const input = event.target as HTMLInputElement;
    this.selectedDate = input.value;
    this.fetchBaseMoonData();
    // Handle the date change logic as needed
  }

  private togglePage(): void {
    this._activeCard = this._activeCard === 'base' ? 'calendar' : 'base';
  }

  private _getMoonImageData(): { moonImage: string; moonPhaseName: string; rotateDeg: number } {
    const moonIllumination = this._moonIllumination;
    const phaseIndex = Math.round(moonIllumination.phaseValue * 16) % 16;
    const moonImage = MOON_IMAGES[phaseIndex];
    const moonPhaseName = moonIllumination.phase.name;
    const rotateDeg = 180 - (this._moonPosition.parallacticAngle * 180) / Math.PI;
    return { moonImage, moonPhaseName, rotateDeg };
  }

  private _getBaseMoonData() {
    const { rise, set, highest } = this._moonTimes as any;
    const { phaseValue, fraction } = this._moonIllumination;
    const { fullMoon, newMoon } = this._moonIllumination.next;
    const phaseName = this._moonIllumination.phase.name;
    const { distance, azimuthDegrees, altitudeDegrees } = this._moonPosition;

    const formatDate = (date: string) => new Date(date).toISOString();
    const createMoonDataItem = (label: string, value: string, secondValue: string = '', unit: string = '') => ({
      label,
      value,
      secondValue,
      unit,
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
      azimuthDegress: createMoonDataItem('Moon Azimuth', azimuthDegrees.toFixed(2), '', '°'),
      altitudeDegrees: createMoonDataItem('Moon Altitude', altitudeDegrees.toFixed(2), '', '°'),
      nextFullMoon: createMoonDataItem('Next Full Moon', new Date(fullMoon.date).toDateString(), '', ''),
      nextNewMoon: createMoonDataItem('Next New Moon', new Date(newMoon.date).toDateString(), '', ''),
      phaseName: createMoonDataItem('Phase Name', phaseName, '', ''),
    };
  }

  private _getMoonIllumination(date: Date) {
    const moonIllumination = SunCalc.getMoonIllumination(date);
    return moonIllumination;
  }

  private _getMoonPosition(date: Date, latitude: number, longitude: number) {
    const moonPosition = SunCalc.getMoonPosition(date, latitude, longitude);
    return moonPosition;
  }

  private _getMoonTimes = (date: Date, latitude: number, longitude: number) => {
    const moonTimes = SunCalc.getMoonTimes(date, latitude, longitude);
    return moonTimes;
  };

  private _computeClasses() {
    return classMap({
      '--background': this._showBackground,
    });
  }

  private _setBackgroundCss() {
    this.style.setProperty('--lunar-background-image', `url(${BACKGROUND})`);
  }

  // https://lit.dev/docs/components/styles/
  public static get styles(): CSSResultGroup {
    return [style];
  }

  public getCardSize(): number {
    return 4;
  }
}

(window as any).customCards = (window as any).customCards || [];
(window as any).customCards.push({
  type: 'lunar-phase-card',
  name: 'Lunar Phase Card',
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

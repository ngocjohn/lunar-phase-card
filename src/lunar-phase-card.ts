/* eslint-disable @typescript-eslint/no-explicit-any */
import { LitElement, html, TemplateResult, PropertyValues, CSSResultGroup, nothing } from 'lit';
import { customElement, property, query, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { styleMap } from 'lit-html/directives/style-map.js';
import { LovelaceCardEditor } from 'custom-card-helpers';
import { HomeAssistantExtended as HomeAssistant, LunarPhaseCardConfig, defaultConfig } from './types';
import { BASE_REFRESH_INTERVAL, BACKGROUND } from './const';
import { localize } from './localize/localize';

import { Moon } from './utils/moon';
import './components/moon-data';
import { LunarBaseData } from './components/moon-data';
import style from './css/style.css';

@customElement('lunar-phase-card')
export class LunarPhaseCard extends LitElement {
  public static async getConfigElement(): Promise<LovelaceCardEditor> {
    await import('./editor');
    return document.createElement('lunar-phase-card-editor');
  }

  @property({ attribute: false })
  set hass(hass: HomeAssistant) {
    this._hass = hass;
  }

  @state() _hass!: HomeAssistant;
  @state() config!: LunarPhaseCardConfig;
  @property({ type: Object }) protected moon!: Moon;
  @state() private _activeCard: string = 'base';
  @state() private selectedDate: Date | undefined;
  @state() _connected: boolean = false;
  @state() _refreshInterval: number | undefined;

  @query('lunar-base-data') _data!: LunarBaseData;
  public static getStubConfig = (hass: HomeAssistant): Record<string, unknown> => {
    const defaultLatitude = hass.config.latitude || 0;
    const defaultLongitude = hass.config.longitude || 0;
    const lang = hass.language;
    return {
      ...defaultConfig,
      latitude: defaultLatitude,
      longitude: defaultLongitude,
      selected_language: lang,
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

  connectedCallback(): void {
    super.connectedCallback();
    if (process.env.ROLLUP_WATCH === 'true') {
      window.LunarCard = this;
    }
    this._connected = true;
    this.startRefreshInterval();
  }

  disconnectedCallback(): void {
    this.clearRefreshInterval();
    this._connected = false;
    super.disconnectedCallback();
  }

  protected shouldUpdate(changedProps: PropertyValues): boolean {
    if (changedProps.has('_activeCard') && this._activeCard === 'calendar') {
      // console.log('shouldUpdate', this._activeCard);
      this.clearRefreshInterval();
    } else if (changedProps.has('_activeCard') && this._activeCard === 'base') {
      // console.log('shouldUpdate', this._activeCard);
      if (this.selectedDate !== undefined) {
        this.selectedDate = undefined;
        this.startRefreshInterval();
      }
    }
    return changedProps.has('_activeCard') || (changedProps.has('selectedDate') && this.selectedDate !== undefined);
  }

  get hass(): HomeAssistant {
    return this._hass;
  }

  private get selectedLanguage(): string {
    return this.config?.selected_language || this._hass.language;
  }

  private localize = (string: string, search = '', replace = ''): string => {
    return localize(string, this.selectedLanguage, search, replace);
  };

  get _isCalendar(): boolean {
    return this._activeCard === 'calendar';
  }

  get _showBackground(): boolean {
    return this.config.show_background || false;
  }

  get _date(): Date {
    const date = this.selectedDate ? new Date(this.selectedDate) : new Date();
    return date;
  }

  private startRefreshInterval() {
    // Clear any existing interval to avoid multiple intervals running
    if (this._refreshInterval !== undefined) {
      clearInterval(this._refreshInterval);
    }

    // Set up a new interval
    this._refreshInterval = window.setInterval(() => {
      if (this._activeCard === 'base') {
        this.requestUpdate();
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

  protected render(): TemplateResult {
    if (!this._hass || !this.config) {
      return html``;
    }
    this.createMoon();
    const header = !this.config.compact_view || this._isCalendar ? this.renderHeader() : nothing;
    const baseCard = html` ${this.renderMoonImage()} ${this.renderMoonData()} `;
    return html`
      <ha-card class=${this._computeClasses()} style=${this._computeStyles()}>
        ${header}
        <div class="lunar-card-content">${!this._isCalendar ? baseCard : this.renderCalendar()}</div>
      </ha-card>
    `;
  }

  private createMoon() {
    const initData = {
      date: this._date,
      lang: this.selectedLanguage,
      config: this.config,
    };
    this.moon = new Moon(initData);
    // console.log('createMoon');
  }

  private renderHeader(): TemplateResult | void {
    return html`
      <div class="lunar-card-header">
        <h1>${this.moon?.phaseName}</h1>
        <div @click=${() => this.togglePage()} class="btn-calendar click-shrink">
          <ha-icon icon="mdi:calendar-search"></ha-icon>
        </div>
      </div>
    `;
  }

  private renderMoonImage(): TemplateResult | void {
    if (!this.moon) return;
    const { moonPic } = this.moon.moonImage;

    const style = {
      maxWidth: this._isCalendar ? 'calc(40% - 1px)' : 'calc(27% - 1px)',
      maxHeight: `185px`,
      // transform: `rotate(${rotateDeg}deg)`,
    };

    return html` <div class="moon-image" style=${styleMap(style)}>
      <img src=${moonPic} class="rotatable" />
    </div>`;
  }

  private renderMoonData(): TemplateResult {
    const compactView = this.config.compact_view && this._activeCard === 'base';
    return html`
      ${compactView ? this.renderCompactView() : html`<lunar-base-data .moon=${this.moon}></lunar-base-data>`}
    `;
  }

  private renderCompactView(): TemplateResult | typeof nothing {
    if (!this.config.compact_view) return nothing;
    const moonData = this.moon.moonData;
    const items = {
      moonAge: 'mdi:progress-clock',
      moonRise: 'mdi:weather-moonset-up',
      moonSet: 'mdi:weather-moonset',
    };

    const renderCompactItem = (key: string): TemplateResult => {
      const { label, value } = moonData[key];
      const icon = items[key];
      return html`
        <div class="compact-item">
          <div class="icon-value">
            <ha-icon icon=${icon}></ha-icon>
            <span class="label">${value}</span>
          </div>
          ${this.config.font_customize?.hide_label ? html`` : html` <span class="value">${label}</span>`}
        </div>
      `;
    };

    return html`
      <div class="compact-view">
        ${this.renderHeader()}

        <div class="moon-fraction">${moonData.moonFraction.value} ${this.localize('card.illuminated')}</div>
        <div class="compact-view-items">${Object.keys(items).map((key) => renderCompactItem(key))}</div>
      </div>
    `;
  }

  private renderCalendar(): TemplateResult | void {
    // Initialize selectedDate to today if it is not already set
    const initValue = this._date.toISOString().split('T')[0];

    const dateInput = html`<div class="date-input-wrapper">
      <button @click=${() => this.updateDate('prev')} class="date-input-btn click-shrink"><</button>
      <input type="date" class="date-input" .value=${initValue} @input=${this._handleDateChange} />
      <button @click=${() => this.updateDate('next')} class="date-input-btn click-shrink">></button>
    </div>`;

    return html`
      ${this.renderMoonImage()}
      <div class="calendar-wrapper">${dateInput}${this.renderMoonData()}</div>
    `;
  }

  private updateDate(action?: 'next' | 'prev') {
    const date = new Date(this._date);
    if (action === 'next') {
      date.setDate(date.getDate() + 1);
    } else if (action === 'prev') {
      date.setDate(date.getDate() - 1);
    }
    this.selectedDate = date;
  }

  private _handleDateChange(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.value) {
      input.value = new Date().toISOString().split('T')[0];
    }
    this.selectedDate = new Date(input.value);
  }

  private togglePage(): void {
    this._activeCard = this._activeCard === 'base' ? 'calendar' : 'base';
    console.log('togglePage', this._activeCard);
  }

  private _computeClasses() {
    const reverse = this.config.moon_position === 'right';
    const compactHeader = Boolean(this.config.compact_view && !this._isCalendar);
    return classMap({
      __background: this._showBackground,
      '__flex-col': this._isCalendar,
      __reverse: reverse && !this._isCalendar,
      '__compact-header': compactHeader,
    });
  }

  private _computeStyles() {
    const fontOptions = this.config?.font_customize;
    const background = this.config.custom_background || BACKGROUND;
    const varCss = {
      '--lunar-card-header-font-size': fontOptions.header_font_size,
      '--lunar-card-header-text-transform': fontOptions.header_font_style,
      '--lunar-card-header-font-color': fontOptions.header_font_color,
      '--lunar-card-label-font-size': fontOptions.label_font_size,
      '--lunar-card-label-text-transform': fontOptions.label_font_style,
      '--lunar-card-label-font-color': fontOptions.label_font_color,
    };
    return styleMap({
      '--lunar-background-image': `url(${background})`,
      ...varCss,
    });
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
    LunarCard: LunarPhaseCard;
  }
  interface HTMLElementTagNameMap {
    'lunar-phase-card': LunarPhaseCard;
  }
}

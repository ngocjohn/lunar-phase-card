/* eslint-disable @typescript-eslint/no-explicit-any */
import { LitElement, html, TemplateResult, PropertyValues, CSSResultGroup, nothing } from 'lit';
import { customElement, property, query, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { LovelaceCardEditor } from 'custom-card-helpers';
import { HomeAssistantExtended as HomeAssistant, LunarPhaseCardConfig, defaultConfig } from './types';
import { BASE_REFRESH_INTERVAL, BACKGROUND, CurrentPage } from './const';
import { localize } from './localize/localize';
import { useAmPm } from './utils/helpers';

import { Moon } from './utils/moon';
import './components/moon-data';
import './components/moon-horizon';
import { LunarBaseData } from './components/moon-data';
import { MoonHorizon } from './components/moon-horizon';

import style from './css/style.css';
import { mdiCalendarSearch, mdiChartBellCurve } from '@mdi/js';
import { MOON_IMAGES } from './utils/moon-pic';

interface Image {
  filesize: number;
  name: string;
  uploaded_at: string; // isoformat date
  content_type: string;
  id: string;
}

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
  @state() private _activeCard: CurrentPage = CurrentPage.BASE;
  @state() private selectedDate: Date | undefined;
  @state() _connected: boolean = false;
  @state() _refreshInterval: number | undefined;

  @state() _cardWidth: number = 0;

  @query('lunar-base-data') _data!: LunarBaseData;
  @query('moon-horizon') _moonHorizon!: MoonHorizon;

  public static getStubConfig = (hass: HomeAssistant): Record<string, unknown> => {
    const defaultLatitude = hass.config.latitude || 0;
    const defaultLongitude = hass.config.longitude || 0;
    const lang = hass.language;
    const timeFormat = useAmPm(hass.locale);
    console.log('timeFormat', timeFormat);
    return {
      ...defaultConfig,
      latitude: defaultLatitude,
      longitude: defaultLongitude,
      selected_language: lang,
      '12hr_format': timeFormat,
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
    const isCalendar = this._activeCard === CurrentPage.CALENDAR;
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
    // return this.getGridRowSize();
    return 5;
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

  protected firstUpdated(_changedProperties: PropertyValues): void {
    super.firstUpdated(_changedProperties);
    this.measureCard();
    this._computeStyles();
  }

  protected shouldUpdate(changedProps: PropertyValues): boolean {
    if (changedProps.has('_activeCard') && this._activeCard !== CurrentPage.BASE) {
      // console.log('shouldUpdate', this._activeCard);
      this.clearRefreshInterval();
    } else if (
      (changedProps.has('_activeCard') && this._activeCard === CurrentPage.BASE) ||
      this._activeCard === CurrentPage.HORIZON
    ) {
      // console.log('shouldUpdate', this._activeCard);
      if (this.selectedDate !== undefined) {
        this.selectedDate = undefined;
        this.startRefreshInterval();
      }
    }

    return true;
  }

  get hass(): HomeAssistant {
    return this._hass;
  }

  get selectedLanguage(): string {
    return this.config?.selected_language || this._hass.language;
  }

  public localize = (string: string, search = '', replace = ''): string => {
    return localize(string, this.selectedLanguage, search, replace);
  };

  get _isCalendar(): boolean {
    return this._activeCard === CurrentPage.CALENDAR;
  }

  get _showBackground(): boolean {
    return this.config.show_background || false;
  }

  get _date(): Date {
    const date = this.selectedDate ? new Date(this.selectedDate) : new Date();
    return date;
  }

  getMoonImage(index: number): string {
    return MOON_IMAGES[index];
  }

  private startRefreshInterval() {
    // Clear any existing interval to avoid multiple intervals running
    if (this._refreshInterval !== undefined) {
      clearInterval(this._refreshInterval);
    }

    // Set up a new interval
    this._refreshInterval = window.setInterval(() => {
      if (this._activeCard === CurrentPage.BASE || this._activeCard === CurrentPage.HORIZON) {
        this.requestUpdate();
        // console.log('requestUpdate');
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
    const header =
      !this.config.compact_view || this._activeCard === CurrentPage.CALENDAR || this._activeCard === CurrentPage.HORIZON
        ? this.renderHeader()
        : nothing;

    return html`
      <ha-card class=${this._computeClasses()}>
        ${header}
        <div class="lunar-card-content">${this._renderPage()}</div>
      </ha-card>
    `;
  }

  private _renderPage(): TemplateResult | void {
    const baseCard = html` ${this.renderMoonImage()} ${this.renderMoonData()} `;
    switch (this._activeCard) {
      case CurrentPage.CALENDAR:
        return this.renderCalendar();
      case CurrentPage.HORIZON:
        return this.renderHorizon();
      default:
        return baseCard;
    }
  }

  private createMoon() {
    const initData = {
      date: this._date,
      lang: this.selectedLanguage,
      config: this.config,
      locale: this._hass.locale,
    };
    this.moon = new Moon(initData);
    // console.log('createMoon');
  }

  private renderHeader(): TemplateResult | void {
    const headerContent = {
      [CurrentPage.CALENDAR]: this.moon?.phaseName,
      [CurrentPage.BASE]: this.moon?.phaseName,
      [CurrentPage.HORIZON]: this.localize('card.horizonTitle'),
    };
    return html`
      <div class="lunar-card-header">
        <h1>${headerContent[this._activeCard]}</h1>
        <div class="action-btns">
          <ha-icon-button
            @click=${() => this.togglePage(CurrentPage.CALENDAR)}
            class="btn-action click-shrink"
            .path=${mdiCalendarSearch}
            ?active=${this._activeCard === CurrentPage.CALENDAR}
          >
          </ha-icon-button>
          <ha-icon-button
            @click=${() => this.togglePage(CurrentPage.HORIZON)}
            .path=${mdiChartBellCurve}
            class="btn-action click-shrink"
            ?active=${this._activeCard === CurrentPage.HORIZON}
          >
          </ha-icon-button>
        </div>
      </div>
    `;
  }

  private renderMoonImage(): TemplateResult | void {
    if (!this.moon) return;
    const { moonPic } = this.moon.moonImage;

    return html` <div class="moon-image" ?calendar=${this._isCalendar}>
      <img src=${moonPic} class="rotatable" />
    </div>`;
  }

  private renderMoonData(): TemplateResult {
    const compactView = this.config.compact_view && this._activeCard === CurrentPage.BASE;
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
      <button @click=${() => this.updateDate('prev')} class="date-input-btn click-shrink">
        <ha-icon icon="mdi:chevron-left"></ha-icon>
      </button>
      <input type="date" class="date-input" .value=${initValue} @input=${this._handleDateChange} />
      <button @click=${() => this.updateDate('next')} class="date-input-btn click-shrink">
        <ha-icon icon="mdi:chevron-right"></ha-icon>
      </button>
    </div>`;

    return html`
      ${this.renderMoonImage()}
      <div class="calendar-wrapper">${dateInput}${this.renderMoonData()}</div>
    `;
  }

  private renderHorizon(): TemplateResult | void {
    return html`<moon-horizon .hass=${this.hass} .moon=${this.moon} .card=${this}></moon-horizon>`;
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

  private togglePage = (page: CurrentPage) => {
    this._activeCard = this._activeCard === page ? CurrentPage.BASE : page;
  };

  private measureCard() {
    const card = this.shadowRoot?.querySelector('ha-card');
    if (card) {
      this._cardWidth = card.clientWidth;
    }
  }
  private _computeClasses() {
    const reverse = this.config.moon_position === 'right';
    const compactHeader = Boolean(this.config.compact_view && this._activeCard === CurrentPage.BASE);
    return classMap({
      '--background': this._showBackground,
      '--flex-col': this._isCalendar,
      '--reverse': reverse && !this._isCalendar,
      '--compact-header': compactHeader,
      '--default-header': !compactHeader,
    });
  }

  private _computeStyles() {
    const fontOptions = this.config?.font_customize;
    const background = this.config.custom_background || BACKGROUND;
    const varCss = {
      '--lunar-card-header-font-size': fontOptions.header_font_size,
      '--lunar-card-header-text-transform': fontOptions.header_font_style,
      '--lunar-card-header-font-color': fontOptions.header_font_color
        ? fontOptions.header_font_color
        : this._showBackground
          ? '#e1e1e1'
          : 'var(--primary-text-color)',
      '--lunar-card-label-font-size': fontOptions.label_font_size,
      '--lunar-card-label-text-transform': fontOptions.label_font_style,
      '--lunar-card-label-font-color': fontOptions.label_font_color
        ? fontOptions.label_font_color
        : this._showBackground
          ? '#e1e1e1'
          : 'var(--primary-text-color)',
      '--swiper-theme-color': `var(--lunar-card-label-font-color, var(--primary-color))`,
      '--lunar-background-image': `url(${background})`,
      '--lunar-fill-color': this._showBackground ? 'rgba(255,255,255,0.12157)' : 'var(--divider-color)',
      '--lunar-fill-bellow-color': this._showBackground ? '#e1e0dd0f' : 'rgba(0, 0, 0, 0.06)',
    };
    Object.entries(varCss).forEach(([key, value]) => {
      if (value) {
        this.style.setProperty(key, value);
      }
    });
  }

  // https://lit.dev/docs/components/styles/
  static get styles(): CSSResultGroup {
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

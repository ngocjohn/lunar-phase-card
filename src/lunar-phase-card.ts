import { LovelaceCardEditor, formatDate, FrontendLocaleData, TimeFormat } from 'custom-card-helpers';
import { LitElement, html, TemplateResult, PropertyValues, CSSResultGroup, nothing } from 'lit';
import { customElement, property, query, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';

import { LunarBaseData } from './components/moon-data';
import { MoonHorizon } from './components/moon-horizon';
import { BACKGROUND, CurrentPage, MoonState, ICON } from './const';
import style from './css/style.css';
import './components/moon-data';
import './components/moon-horizon';
import './components/moon-phase-calendar';
import { localize } from './localize/localize';
import { HomeAssistantExtended as HomeAssistant, LunarPhaseCardConfig, defaultConfig } from './types';
import { getDefaultConfig } from './utils/helpers';
import { Moon } from './utils/moon';

const BASE_REFRESH_INTERVAL = 15 * 1000;
const LOADING_TIMEOUT = 1500;

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
  @state() selectedDate: Date | undefined;
  @state() _refreshInterval: number | undefined;

  @state() _cardWidth: number = 0;
  @state() _calendarPopup: boolean = false;
  @state() _state: MoonState = MoonState.READY;

  @query('lunar-base-data') _data!: LunarBaseData;
  @query('moon-horizon') _moonHorizon!: MoonHorizon;

  // https://lit.dev/docs/components/styles/
  static get styles(): CSSResultGroup {
    return [style];
  }

  public static getStubConfig = (hass: HomeAssistant): Record<string, unknown> => {
    const initConfig = getDefaultConfig(hass);
    return {
      ...defaultConfig,
      ...initConfig,
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

  connectedCallback(): void {
    super.connectedCallback();
    if (process.env.ROLLUP_WATCH === 'true') {
      window.LunarCard = this;
      window.Moon = this.moon;
    }
    this.startRefreshInterval();
  }

  disconnectedCallback(): void {
    this.clearRefreshInterval();
    super.disconnectedCallback();
  }

  protected firstUpdated(_changedProperties: PropertyValues): void {
    super.firstUpdated(_changedProperties);
    this.measureCard();
    this._computeStyles();
  }

  protected shouldUpdate(changedProps: PropertyValues): boolean {
    if (changedProps.has('_activeCard') && this._activeCard === CurrentPage.CALENDAR) {
      // console.log('shouldUpdate', this._activeCard);
      this.clearRefreshInterval();
    } else if (changedProps.has('_activeCard') && this._activeCard === CurrentPage.BASE) {
      // console.log('shouldUpdate', this._activeCard);
      if (this.selectedDate !== undefined) {
        this.selectedDate = undefined;
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

  get _locale(): FrontendLocaleData {
    const locale = this._hass.locale;
    const timeFormat = this.config['12hr_format'] ? TimeFormat.am_pm : TimeFormat.twenty_four;
    const language = this.selectedLanguage;
    const newLocale = {
      ...locale,
      language,
      time_format: timeFormat,
    };
    return newLocale;
  }

  get _showBackground(): boolean {
    return this.config.show_background || false;
  }

  get _date(): Date {
    const date = this.selectedDate ? new Date(this.selectedDate) : new Date();
    return date;
  }

  private startRefreshInterval() {
    console.log('refresh start', new Date().toLocaleTimeString());
    // Clear any existing interval to avoid multiple intervals running
    if (this._refreshInterval !== undefined) {
      clearInterval(this._refreshInterval);
    }

    // Set up a new interval
    this._refreshInterval = window.setInterval(() => {
      if (this._activeCard === CurrentPage.BASE || this._activeCard === CurrentPage.HORIZON) {
        this._state = MoonState.LOADING;
        setTimeout(() => {
          this._state = MoonState.READY;
        }, LOADING_TIMEOUT);
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
    const header =
      !this.config.compact_view || this._activeCard === CurrentPage.CALENDAR || this._activeCard === CurrentPage.HORIZON
        ? this.renderHeader()
        : nothing;

    const renderCardMap = {
      [CurrentPage.BASE]: this.renderBaseCard(),
      [CurrentPage.CALENDAR]: this.renderCalendar(),
      [CurrentPage.HORIZON]: this.renderHorizon(),
    };

    return html`
      <ha-card class=${this._computeClasses()}>
        <div class="loading" ?hidden=${this._state !== MoonState.LOADING}>
          <ha-circular-progress indeterminate size="tiny"></ha-circular-progress>
        </div>

        ${header}
        <div class="lunar-card-content">${renderCardMap[this._activeCard]}</div>
      </ha-card>
    `;
  }

  private renderBaseCard(): TemplateResult | void {
    return html` ${this.renderMoonImage()} ${this.renderMoonData()} `;
  }
  private createMoon() {
    const initData = {
      date: this._date,
      config: this.config,
      locale: this._locale,
    };
    this.moon = new Moon(initData);
    // console.log('createMoon');
  }

  private renderHeader(): TemplateResult | void {
    const headerContent =
      this._activeCard !== CurrentPage.HORIZON ? this.moon?.phaseName : this.localize('card.horizonTitle');

    const buttons = [
      { icon: ICON.WEATHER, page: CurrentPage.BASE },
      { icon: ICON.SEARCH, page: CurrentPage.CALENDAR },
      { icon: ICON.CHART, page: CurrentPage.HORIZON },
    ];

    if (this._activeCard === CurrentPage.BASE) {
      buttons.splice(0, 1);
    }

    return html`
      <div class="lunar-card-header">
        <h1>${headerContent}</h1>
        <div class="action-btns">
          ${buttons.map(
            (btn) => html`
              <ha-icon-button
                @click=${() => this.togglePage(btn.page)}
                class="btn-action click-shrink"
                .path=${btn.icon}
                ?active=${this._activeCard === btn.page}
              ></ha-icon-button>
            `
          )}
        </div>
      </div>
    `;
  }

  private renderMoonImage(): TemplateResult | void {
    if (!this.moon) return;
    const { moonPic } = this.moon.moonImage;

    return html` <div class="moon-image animate" ?calendar=${this._isCalendar}>
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

    const dateInput = html` <div class="date-input-wrapper">
      <ha-icon-button .path=${ICON.CALENDAR} @click=${() => (this._calendarPopup = true)}> </ha-icon-button>

      <div class="date-row">
        <ha-icon-button .path=${ICON.LEFT} @click=${() => this.updateDate('prev')}> </ha-icon-button>
        <div>${formatDate(this._date, this._locale)}</div>
        <ha-icon-button .path=${ICON.RIGHT} @click=${() => this.updateDate('next')}> </ha-icon-button>
      </div>
      <ha-icon-button
        .disabled=${!this.selectedDate}
        .path=${ICON.RESTORE}
        @click=${() => (this.selectedDate = undefined)}
      >
      </ha-icon-button>
    </div>`;

    return html`
      <div class="calendar-container">
        <div class="calendar-mini-popup" ?hidden=${!this._calendarPopup}>
          <moon-phase-calendar .card=${this as any} .moon=${this.moon}></moon-phase-calendar>
        </div>
        <div class="calendar-wrapper">${this.renderMoonImage()}${dateInput}${this.renderMoonData()}</div>
      </div>
    `;
  }

  private renderHorizon(): TemplateResult | void {
    return html`<moon-horizon .hass=${this.hass} .moon=${this.moon} .card=${this as any}></moon-horizon>`;
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
      '--lunar-fill-line-bellow-color': this._showBackground ? '#e1e0dd30' : 'var(--divider-color)',
    };
    Object.entries(varCss).forEach(([key, value]) => {
      if (value) {
        this.style.setProperty(key, value);
      }
    });
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
    Moon: Moon;
  }
  interface HTMLElementTagNameMap {
    'lunar-phase-card': LunarPhaseCard;
  }
}

import { LovelaceCardEditor, formatDate, FrontendLocaleData, TimeFormat } from 'custom-card-helpers';
import { LitElement, html, TemplateResult, PropertyValues, CSSResultGroup, nothing } from 'lit';
import { customElement, property, query, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
// Local types
import { HomeAssistantExtended as HomeAssistant, LunarPhaseCardConfig, defaultConfig } from './types';

// Helpers
import { BLUE_BG, PageType, MoonState, ICON } from './const';
import { localize } from './localize/localize';
import { getDefaultConfig } from './utils/helpers';

// components
import { LunarBaseData } from './components/moon-data';
import { MoonHorizon } from './components/moon-horizon';
import { Moon } from './utils/moon';
import './components/moon-data';
import './components/moon-horizon';
import './components/moon-phase-calendar';

// styles
import style from './css/style.css';

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
  @property({ attribute: false }) config!: LunarPhaseCardConfig;
  @property({ type: Object }) protected moon!: Moon;

  @state() _activeCard: PageType | null = null;
  @state() selectedDate: Date | undefined;
  @state() _refreshInterval: number | undefined;

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

  constructor() {
    super();
    this._handleEditorEvent = this._handleEditorEvent.bind(this);
  }

  connectedCallback(): void {
    super.connectedCallback();
    if (process.env.ROLLUP_WATCH === 'true') {
      window.LunarCard = this;
      window.Moon = this.moon;
    }
    this.startRefreshInterval();
    document.addEventListener('lunar-card-event', (ev) => this._handleEditorEvent(ev));
  }

  disconnectedCallback(): void {
    this.clearRefreshInterval();
    super.disconnectedCallback();
  }

  private _handleEditorEvent(ev: any): void {
    ev.stopPropagation();
    if (!this.isEditorPreview) return;
    console.log('editor event', ev.detail);
    const activeTabIndex = ev.detail.activeTabIndex;
    if (activeTabIndex === 3 && this._activeCard !== PageType.HORIZON) {
      this._activeCard = PageType.HORIZON;
      this.requestUpdate();
    } else if (activeTabIndex !== 3) {
      return;
    }
  }

  protected firstUpdated(_changedProperties: PropertyValues): void {
    super.firstUpdated(_changedProperties);

    // Initial style computation and first render handling
    this._computeStyles();
    this._handleFirstRender();
  }

  protected updated(changedProps: PropertyValues): void {
    super.updated(changedProps);
    if (!this.config || !this._hass) {
      return;
    }
  }

  protected shouldUpdate(changedProps: PropertyValues): boolean {
    if (changedProps.has('_activeCard') && this._activeCard) {
      if (this._activeCard === PageType.CALENDAR) {
        this.clearRefreshInterval();
      } else if ([PageType.BASE, PageType.HORIZON].includes(this._activeCard)) {
        // console.log('base or horizon page, start interval, reset date, start refresh');
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
    return this._activeCard === PageType.CALENDAR;
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

  get _defaultCard(): PageType {
    return this.config.default_card || PageType.BASE;
  }

  get isEditorPreview(): boolean {
    const parentElementClassPreview = this.offsetParent?.classList.contains('element-preview');
    return parentElementClassPreview || false;
  }

  private _handleFirstRender() {
    if (this.isEditorPreview && this.config.activeGraphTab === 3) {
      this._activeCard = PageType.HORIZON;
    } else {
      this._activeCard = this._defaultCard;
    }
  }

  private startRefreshInterval() {
    // console.log('refresh start', new Date().toLocaleTimeString());
    // Clear any existing interval to avoid multiple intervals running
    if (this._refreshInterval !== undefined) {
      clearInterval(this._refreshInterval);
    }

    // Set up a new interval
    this._refreshInterval = window.setInterval(() => {
      if (this._activeCard === PageType.BASE || this._activeCard === PageType.HORIZON) {
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
    const card = !this._activeCard ? this._defaultCard : this._activeCard;

    const header =
      !this.config.compact_view || this._activeCard === PageType.CALENDAR || this._activeCard === PageType.HORIZON
        ? this.renderHeader()
        : nothing;

    const renderCardMap = {
      [PageType.BASE]: this.renderBaseCard(),
      [PageType.CALENDAR]: this.renderCalendar(),
      [PageType.HORIZON]: this.renderHorizon(),
    };

    return html`
      <ha-card class=${this._computeClasses()}>
        <div class="loading" ?hidden=${this._state !== MoonState.LOADING}>
          <ha-circular-progress indeterminate size="tiny"></ha-circular-progress>
        </div>

        ${header}
        <div class="lunar-card-content">${renderCardMap[card]}</div>
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
      this._activeCard !== PageType.HORIZON ? this.moon?.phaseName : this.localize('card.horizonTitle');

    const buttons = [
      { icon: ICON.WEATHER, page: PageType.BASE },
      { icon: ICON.SEARCH, page: PageType.CALENDAR },
      { icon: ICON.CHART, page: PageType.HORIZON },
    ];

    if (this._activeCard === this._defaultCard) {
      const defaultIndex = buttons.findIndex((btn) => btn.page === this._defaultCard);
      buttons.splice(defaultIndex, 1);
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
    const animate = !this.isEditorPreview ? 'moon-image animate' : 'moon-image';
    return html` <div class=${animate} ?calendar=${this._isCalendar}>
      <img src=${moonPic} class="rotatable" />
    </div>`;
  }

  private renderMoonData(): TemplateResult {
    const compactView = this.config.compact_view && this._activeCard === PageType.BASE;
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

  private togglePage = (page: PageType) => {
    this._activeCard = this._activeCard === page ? this._defaultCard : page;
  };

  private _computeClasses() {
    const reverse = this.config.moon_position === 'right';
    const compactHeader = Boolean(this.config.compact_view && this._activeCard === PageType.BASE);
    return classMap({
      '--background': this._showBackground,
      '--flex-col': this._isCalendar,
      '--reverse': reverse && !this._isCalendar,
      '--compact-header': compactHeader,
      '--default-header': !compactHeader,
      '--horizon': this._activeCard === PageType.HORIZON,
    });
  }

  private _computeStyles() {
    const fontOptions = this.config?.font_customize;
    const background = this.config.custom_background || BLUE_BG;
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
    const isCalendar = this._activeCard === PageType.CALENDAR;
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

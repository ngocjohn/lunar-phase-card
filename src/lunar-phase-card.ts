import { LovelaceCardEditor, formatDate, FrontendLocaleData, TimeFormat } from 'custom-card-helpers';
import { LitElement, html, TemplateResult, PropertyValues, CSSResultGroup, nothing } from 'lit';
import { customElement, property, query, state } from 'lit/decorators.js';
import { choose } from 'lit/directives/choose.js';
import { classMap } from 'lit/directives/class-map.js';
import { styleMap } from 'lit/directives/style-map.js';
// Local types
import { HA as HomeAssistant, LunarPhaseCardConfig, defaultConfig } from './types';

// Helpers
import { BLUE_BG, PageType, MoonState, ICON } from './const';
import { dayFormatter, localize } from './localize/localize';
import { generateConfig } from './utils/ha-helper';
import { _handleOverflow, _setEventListeners, getDefaultConfig } from './utils/helpers';
import { isEditorMode } from './utils/loader';

// components
import { LunarBaseData } from './components/moon-base-data';
import { LunarHorizonChart } from './components/moon-horizon-chart';
import { LunarHorizonDynamic } from './components/moon-horizon-dynamic';
import { LunarStarField } from './components/moon-star-field';
import { Moon } from './utils/moon';
import './components';
// styles
import style from './css/style.css';

const BASE_REFRESH_INTERVAL = 60 * 1000;
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

  @state() private _hass!: HomeAssistant;
  @property({ attribute: false }) config!: LunarPhaseCardConfig;
  @property({ attribute: false }) moon!: Moon;
  @state() _activeCard: PageType | null = null;
  @state() selectedDate: Date | undefined;

  @state() _calendarPopup: boolean = false;
  @state() _calendarInfo: boolean = false;
  @state() _resizeInitiated = false;

  @state() _connected = false;
  @state() _cardReady = false;
  @state() private _state: MoonState = MoonState.READY;
  @state() private _refreshInterval: number | undefined;

  @state() private _resizeObserver: ResizeObserver | null = null;
  @state() private _resizeEntries: ResizeObserverEntry[] = [];
  @state() private _cardWidth: number = 0;
  @state() private _cardHeight: number = 0;

  @query('lunar-base-data') _data!: LunarBaseData;
  @query('lunar-horizon-chart') _moonHorizon!: LunarHorizonChart;
  @query('lunar-horizon-dynamic') _moonHorizonDynamic!: LunarHorizonDynamic;
  @query('moon-star-field') _starField!: LunarStarField;

  constructor() {
    super();
  }

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

    this.config = generateConfig({ ...config });
  }

  connectedCallback(): void {
    super.connectedCallback();
    if (process.env.ROLLUP_WATCH === 'true') {
      window.LunarCard = this;
      window.Moon = this.moon;
    }
    this._connected = true;

    if (isEditorMode(this)) {
      document.addEventListener('toggle-graph-editor', (ev) => this._handleEditorEvent(ev as CustomEvent));
    }
    if (!this._resizeInitiated && !this._resizeObserver) {
      this.delayedAttachResizeObserver();
    }
    this.startRefreshInterval();
  }

  disconnectedCallback(): void {
    this.clearRefreshInterval();
    this.detachResizeObserver();
    this._connected = false;

    this._resizeInitiated = false;
    document.removeEventListener('toggle-graph-editor', (ev) => this._handleEditorEvent(ev as CustomEvent));
    super.disconnectedCallback();
  }

  delayedAttachResizeObserver(): void {
    setTimeout(() => {
      this.attachResizeObserver();
      this._resizeInitiated = true;
    }, 0);
  }

  attachResizeObserver(): void {
    const ro = new ResizeObserver((entries: ResizeObserverEntry[]) => {
      this._resizeEntries = entries;
      this.measureCard();
      _handleOverflow(this);
    });

    const card = this.shadowRoot?.querySelector('ha-card') as HTMLElement;
    if (card) {
      ro.observe(card);
      this._resizeObserver = ro;
    }
  }

  detachResizeObserver(): void {
    if (this._resizeObserver) {
      this._resizeObserver.disconnect();
      this._resizeObserver = null;
    }
  }

  private measureCard(): void {
    if (this._resizeEntries.length > 0) {
      const entry = this._resizeEntries[0];
      this._cardWidth = entry.contentRect.width;
      this._cardHeight = entry.contentRect.height;
    }
  }

  private _handleEditorEvent(event: CustomEvent) {
    event.stopPropagation();
    if (!isEditorMode(this) || this._defaultCard === PageType.HORIZON) {
      return;
    }
    this._handleFirstRender();
  }

  protected async firstUpdated(_changedProperties: PropertyValues): Promise<void> {
    super.firstUpdated(_changedProperties);
    this._handleFirstRender();
    this.measureCard();
    await new Promise((resolve) => setTimeout(resolve, 0));
    _setEventListeners(this as any);
    this._computeStyles();
  }

  protected shouldUpdate(changedProps: PropertyValues): boolean {
    if (changedProps.has('_activeCard') && this._activeCard) {
      if (this._activeCard === PageType.CALENDAR) {
        this.clearRefreshInterval();
      } else if ([PageType.BASE, PageType.HORIZON].includes(this._activeCard)) {
        // console.log('base or horizon page, start interval, reset date, start refresh');
        if (this.selectedDate !== undefined) {
          this.selectedDate = undefined;
        }
        if (this._calendarPopup === true) {
          this._calendarPopup = false;
        }
      }
    }
    return true;
  }

  protected updated(changedProps: PropertyValues): void {
    super.updated(changedProps);
    if (changedProps.has('selectedDate') && this.selectedDate !== undefined && this._activeCard) {
      if ([PageType.BASE, PageType.CALENDAR].includes(this._activeCard)) {
        _handleOverflow(this as any);
      }
    }
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

  get _headerHidden(): boolean {
    return this.config.hide_header || false;
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

  get _isCompactMode(): boolean {
    return this.config.compact_view || false;
  }

  get isEditorPreview(): boolean {
    const parentElementClassPreview = this.offsetParent?.classList.contains('element-preview');
    return parentElementClassPreview || false;
  }

  private _handleFirstRender() {
    if (isEditorMode(this)) {
      this._cardReady = false;
      const activeGraphEditor = this.isGraphEditor;
      if (activeGraphEditor && this._activeCard !== PageType.HORIZON) {
        this._activeCard = PageType.HORIZON;
        this._cardReady = true;
      } else if (!activeGraphEditor && this._defaultCard === PageType.HORIZON) {
        this._activeCard = PageType.BASE;
        setTimeout(() => {
          this._activeCard = PageType.HORIZON;
        }, 150);
        this._cardReady = true;
      } else {
        this._activeCard = this._defaultCard;
        this._cardReady = true;
      }
    } else {
      if (PageType.HORIZON === this._defaultCard) {
        this._activeCard = PageType.BASE;
        setTimeout(() => {
          this._activeCard = PageType.HORIZON;
        }, 0);
        this._cardReady = true;
      } else {
        this._activeCard = this._defaultCard;
        this._cardReady = true;
      }
    }
  }

  private get isGraphEditor(): Boolean {
    const value = sessionStorage.getItem('activeGraphEditor');
    return value === 'true';
  }

  async startRefreshInterval(): Promise<void> {
    if (!this._connected || this._activeCard === PageType.CALENDAR) {
      this.clearRefreshInterval();
      return;
    }
    if (this._refreshInterval !== undefined) {
      clearInterval(this._refreshInterval);
    }
    // Calculate the remaining time until the next full minute
    const now = new Date();
    const remainingMs = (60 - now.getSeconds()) * 1000;

    // Set up a new interval
    setTimeout(() => {
      // Set up the regular interval to refresh every full minute
      this.refreshData();
      this._refreshInterval = window.setInterval(() => {
        this.refreshData();
      }, BASE_REFRESH_INTERVAL);
    }, remainingMs);
  }

  private refreshData() {
    if (!this._connected) {
      return;
    }
    if (this._state !== MoonState.LOADING) {
      // console.log('Refreshing data');
      this._state = MoonState.LOADING;
      setTimeout(() => {
        this._state = MoonState.READY;
        // console.log('Data refreshed');
      }, LOADING_TIMEOUT);
    }
  }

  private clearRefreshInterval() {
    if (this._refreshInterval) {
      clearInterval(this._refreshInterval);
      this._refreshInterval = undefined;
      // console.log('Clearing refresh interval');
    }
  }

  protected render(): TemplateResult {
    if (!this._hass || !this.config || !this._cardReady) {
      return html``;
    }
    this.createMoon();
    // const isHeaderHidden = this.config?.hide_header;
    const card = !this._activeCard ? this._defaultCard : this._activeCard;
    const header = !this.config.compact_view || [PageType.HORIZON].includes(card) ? this.renderHeader() : nothing;
    const shouldAddPadding = [PageType.BASE].includes(card) && !this.config.compact_view;

    return html`
      <ha-card class=${this._computeClasses()} style=${this._computeHeight()}>
        <ha-circular-progress
          indeterminate
          size="tiny"
          class="loading"
          ?hidden=${this._state !== MoonState.LOADING}
        ></ha-circular-progress>
        ${this.config.hide_header || [PageType.CALENDAR].includes(card) ? nothing : header}
        <div class="lunar-card-content" id="main-content" ?padding=${shouldAddPadding}>
          ${choose(card, [
            [PageType.BASE, () => this.renderBaseCard()],
            [PageType.CALENDAR, () => this.renderCalendar()],
            [PageType.HORIZON, () => this.renderHorizon()],
          ])}
        </div>
        <lunar-star-field ._card=${this as any}></lunar-star-field>
      </ha-card>
    `;
  }

  private renderBaseCard(): TemplateResult | void {
    return html` ${this.renderMoonImage()} ${this.renderMoonData()}`;
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
      <div class="lunar-card-header" id="lpc-header">
        <div class="header-title" ?full=${this.config.hide_header}>
          <h1>${headerContent}</h1>
        </div>
        <div class="action-btns" ?hidden=${this.config.hide_header}>
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

    const southernHemisphere = this.config.southern_hemisphere ?? false;
    return html` <div
      id="moon-image"
      class="moon-image"
      ?no-header=${this.config.hide_header}
      ?calendar=${this._isCalendar}
      ?compact=${this.config.compact_view}
      style=${this._computeMoonImageStyles()}
    >
      <img src=${moonPic} ?southern=${southernHemisphere} />
    </div>`;
  }

  private _computeMoonImageStyles() {
    if (!this._activeCard || this._activeCard === PageType.HORIZON) return;
    const activeCard = this._activeCard;
    const headerOffset = this._headerHidden ? 48 : 96;
    const width = this._cardWidth;
    let moonWidth = activeCard === PageType.CALENDAR ? width * 0.5 - headerOffset : width / 3.5;
    return styleMap({ maxWidth: `${moonWidth}px` });
  }

  private renderMoonData(): TemplateResult {
    const compactView = this.config.compact_view && this._activeCard === PageType.BASE;
    const replacer = (key: string, value: any) => {
      if (['direction', 'position'].includes(key)) {
        return undefined;
      }
      return value;
    };
    const moonData = JSON.parse(JSON.stringify(this.moon.moonData, replacer));
    return html`
      ${compactView
        ? this.renderCompactView()
        : html`<lunar-base-data .moon=${this.moon} .moonData=${moonData}></lunar-base-data>`}
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
    const isToday = this._date.toDateString() === new Date().toDateString();
    const todayToLocale = dayFormatter(0, this.selectedLanguage);
    const dateInput = html` <div class="date-input-wrapper">
      <div class="inline-btns">
        <ha-icon-button .path=${ICON.CALENDAR} @click="${() => this._handleCalendarPopup()}"> </ha-icon-button>
        <ha-icon-button
          .disabled=${!this.selectedDate}
          .path=${ICON.RESTORE}
          @click=${() => (this.selectedDate = undefined)}
          style="visibility: ${!isToday ? 'visible' : 'hidden'}"
        >
        </ha-icon-button>
        <ha-icon-button .path=${ICON.LEFT} @click=${() => this.updateDate('prev')}> </ha-icon-button>
      </div>
      <div class="date-name">
        ${formatDate(this._date, this._locale)} ${isToday ? html`<span>${todayToLocale}</span>` : nothing}
      </div>

      <div class="inline-btns">
        <ha-icon-button .path=${ICON.RIGHT} @click=${() => this.updateDate('next')}> </ha-icon-button>
        <ha-icon-button
          class="calendar-info-btn"
          .path=${ICON.CHEVRON_DOWN}
          @click=${() => (this._calendarInfo = !this._calendarInfo)}
          ?active=${this._calendarInfo}
        >
        </ha-icon-button>
      </div>
    </div>`;

    return html`
      <div class="calendar-container">
        ${this.config.hide_header ? nothing : this.renderHeader()}
        <div class="calendar-wrapper">
          ${this.renderMoonImage()}${dateInput}
          <div class="calendar-info" show=${this._calendarInfo}>${this.renderMoonData()}</div>
        </div>
        <div class="calendar-mini-popup" ?hidden=${!this._calendarPopup}>
          <lunar-calendar-popup .card=${this as any} .moon=${this.moon}></lunar-calendar-popup>
        </div>
      </div>
    `;
  }

  private _handleCalendarPopup() {
    if (!this._calendarInfo) {
      this._calendarInfo = true;
      setTimeout(() => {
        this._calendarPopup = !this._calendarPopup;
      }, 100);
    } else {
      this._calendarPopup = !this._calendarPopup;
    }
  }

  private renderHorizon(): TemplateResult {
    const graphType = this.config.graph_config?.graph_type;
    const defaultGraph = html`<lunar-horizon-chart
      .hass=${this.hass}
      .moon=${this.moon}
      .card=${this as any}
      .cardWidth=${this._cardWidth}
    ></lunar-horizon-chart>`;
    const dynamicGraph = html`<lunar-horizon-dynamic
      .hass=${this.hass}
      .moon=${this.moon}
      .card=${this as any}
      .cardWidth=${this._cardWidth}
    ></lunar-horizon-dynamic>`;

    return html`
      ${choose(
        graphType,
        [
          ['dynamic', () => dynamicGraph],
          ['default', () => defaultGraph],
        ],
        () => defaultGraph
      )}
    `;
  }

  private updateDate(action?: 'next' | 'prev') {
    const date = new Date(this._date);
    date.setHours(0, 0, 0, 0);
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

  _switchPage(action: 'next' | 'prev') {
    const cardElement = this.shadowRoot?.getElementById('main-content');
    if (!this._activeCard || !cardElement) return;
    const pages = [PageType.BASE, PageType.CALENDAR, PageType.HORIZON];
    const currentIndex = pages.indexOf(this._activeCard);
    let newIndex = currentIndex;
    if (action === 'next') {
      newIndex = currentIndex + 1;
    } else if (action === 'prev') {
      newIndex = currentIndex - 1;
    }
    if (newIndex < 0) {
      newIndex = pages.length - 1;
    } else if (newIndex >= pages.length) {
      newIndex = 0;
    }
    cardElement.style.animation = 'none';
    setTimeout(() => {
      this._activeCard = pages[newIndex];
      cardElement.style.animation = 'fadeIn 400ms ease-in-out';
    }, 300);
  }

  private _computeHeight() {
    if (!this._activeCard) return;
    const isCompact = this.config.compact_view;
    const isHeaderHidden = this._headerHidden;
    const width = this._cardWidth;
    const height = [PageType.BASE].includes(this._activeCard) && !isCompact && !isHeaderHidden ? width * 0.5 : '';
    const justify = [PageType.BASE].includes(this._activeCard) && !isCompact && !isHeaderHidden ? 'space-between' : '';
    return styleMap({ minHeight: height ? `${height}px` : '', justifyContent: justify });
  }

  private _computeClasses() {
    const isHeaderHidden = this.config?.hide_header || false;
    const reverse = this.config.moon_position === 'right';
    const compactHeader = Boolean(this.config.compact_view && this._activeCard === PageType.BASE);
    const dynamicGraph = this.config.graph_config?.graph_type === 'dynamic';
    return classMap({
      '--background': this._showBackground,
      '--reverse': reverse && !this._isCalendar,
      '--default-header': !compactHeader && !isHeaderHidden,
      '--horizon': this._activeCard === PageType.HORIZON && !dynamicGraph,
      '--dynamic-graph': this._activeCard === PageType.HORIZON && dynamicGraph,
      '--no-header': isHeaderHidden,
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

  public getCardSize(): number {
    return 4;
  }
}

window.customCards = window.customCards || [];
window.customCards.push({
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
  interface Window {
    customCards: CustomCard[];
  }

  interface CustomCard {
    type: string;
    name: string;
    preview: boolean;
    description: string;
  }

  interface HTMLElementTagNameMap {
    'lunar-phase-card': LunarPhaseCard;
  }
}

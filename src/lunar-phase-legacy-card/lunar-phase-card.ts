import { formatDateTime } from 'custom-card-helpers';
import { LitElement, html, TemplateResult, PropertyValues, CSSResultGroup, nothing, css } from 'lit';
import { customElement, property, query, state } from 'lit/decorators.js';
import { choose } from 'lit/directives/choose.js';
import { classMap } from 'lit/directives/class-map.js';
import { styleMap } from 'lit/directives/style-map.js';

// Helpers
import { BLUE_BG, PageType, MoonState, ICON } from '../const';
import { LovelaceCardEditor, FrontendLocaleData, TimeFormat, LovelaceCard } from '../ha';
import { HomeAssistant } from '../ha';
import { localize } from '../localize/localize';
import { LunarPhaseCardConfig } from '../types/config/lunar-phase-card-config';
// Local types
import { defaultConfig } from '../types/legacy-card-config/default-config';
import { registerCustomCard } from '../utils/custom-card-register';
import { applyTheme, generateConfig } from '../utils/ha-helper';
import { _handleOverflow, _setEventListeners, getDefaultConfig } from '../utils/helpers';
import { isEditorMode } from '../utils/loader';
import { Moon } from '../utils/moon';
// components
import { LunarBaseData } from './components/moon-base-data';
import { LunarCalendarPage } from './components/moon-calendar-page';
import './components';
import { LunarHorizonChart } from './components/moon-horizon-chart';
import { LunarHorizonDynamic } from './components/moon-horizon-dynamic';
import { LunarStarField } from './components/moon-star-field';
import { LUNAR_PHASE_CARD_EDITOR_NAME, LUNAR_PHASE_CARD_NAME } from './const';
// styles
import style from './css/style.css';
const BASE_REFRESH_INTERVAL = 60 * 1000;
const LOADING_TIMEOUT = 1500;

@customElement(LUNAR_PHASE_CARD_NAME)
export class LunarPhaseCard extends LitElement implements LovelaceCard {
  constructor() {
    super();
  }

  public static async getConfigElement(): Promise<LovelaceCardEditor> {
    await import('./editor');
    return document.createElement(LUNAR_PHASE_CARD_EDITOR_NAME) as LovelaceCardEditor;
  }

  @property({ attribute: false })
  set hass(hass: HomeAssistant) {
    this._hass = hass;
  }

  @state() private _hass!: HomeAssistant;
  @property({ attribute: false }) config!: LunarPhaseCardConfig;
  @property({ attribute: false }) moon!: Moon;
  @property({ type: String }) public layout?: string;
  @state() _activeCard: PageType | null = null;
  @state() selectedDate: Date | undefined;
  @state() _cardReady = false;

  @state() _connected = false;
  @state() _resizeInitiated = false;
  @state() private _state: MoonState = MoonState.READY;
  @state() private _refreshInterval: number | undefined;

  @state() private _resizeObserver: ResizeObserver | null = null;
  @state() private _resizeEntries: ResizeObserverEntry[] = [];
  @state() private _cardWidth: number = 0;
  @state() private _cardHeight: number = 0;

  @state() public _dialogOpen!: boolean;

  @query('lunar-base-data') _DATA_SWIPER!: LunarBaseData;
  @query('lunar-horizon-chart') _HORIZON_DEFAULT!: LunarHorizonChart;
  @query('lunar-horizon-dynamic') _HORIZON_DYNAMIC!: LunarHorizonDynamic;
  @query('lunar-calendar-page') _CALENDAR_PAGE!: LunarCalendarPage;
  @query('lunar-star-field') _starField!: LunarStarField;
  @query('#calendar-dialog') _calendarDialog!: HTMLDialogElement;

  // https://lit.dev/docs/components/styles/
  static get styles(): CSSResultGroup {
    return [
      style,
      css`
        :host {
          display: block;
          position: relative;
          width: 100%;
          height: 100%;
        }
        lunar-star-field {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
          z-index: 0;
        }
      `,
    ];
  }

  public static getStubConfig = (hass: HomeAssistant): Record<string, unknown> => {
    const initConfig = getDefaultConfig(hass);
    return {
      type: `custom:${LUNAR_PHASE_CARD_NAME}`,
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
      window.LunarCardLegacy = this;
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
    await new Promise((resolve) => setTimeout(resolve, 0));
    this.measureCard();
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
      }
    }
    if (changedProps.has('config') && this.config.theme?.selected_theme !== 'default') {
      applyTheme(this, this._hass, this.config.theme?.selected_theme!, this.config.theme?.theme_mode);
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
    if (changedProps.has('_dialogOpen')) {
      this._attachEventListeners();
      this.updateBodyScroll();
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
    return this.config.hide_buttons || false;
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

  private get isGraphEditor(): Boolean {
    const value = sessionStorage.getItem('activeGraphEditor');
    return value === 'true';
  }

  private _handleFirstRender() {
    this._cardReady = false;

    const _setActiveCard = (card: PageType) => {
      this._activeCard = card;
      this._cardReady = true;
    };

    const _setCardTransition = (initialCard: PageType, finalCard: PageType, delay = 0) => {
      setTimeout(() => {
        this._activeCard = initialCard;
        setTimeout(() => {
          this._activeCard = finalCard;
        }, delay);
      }, 0);
      this._cardReady = true;
    };

    if (this.isEditorPreview) {
      const activeGraphEditor = this.isGraphEditor;

      if (activeGraphEditor && this._activeCard !== PageType.HORIZON) {
        _setActiveCard(PageType.HORIZON);
      } else if (!activeGraphEditor && this._defaultCard === PageType.HORIZON) {
        _setCardTransition(PageType.BASE, PageType.HORIZON, 50);
      } else {
        _setActiveCard(this._defaultCard);
      }
    } else {
      if (this._defaultCard === PageType.HORIZON) {
        _setCardTransition(PageType.BASE, PageType.HORIZON);
      } else {
        _setActiveCard(this._defaultCard);
      }
    }
  }

  async startRefreshInterval(): Promise<void> {
    if (!this._connected || this._activeCard === PageType.CALENDAR) {
      this.clearRefreshInterval();
      return;
    }
    if (this._refreshInterval !== undefined) {
      clearInterval(this._refreshInterval);
    }

    const refreshData = () => {
      if (!this._connected) {
        this.clearRefreshInterval();
        return;
      }
      if (this._state !== MoonState.LOADING) {
        this._state = MoonState.LOADING;
        setTimeout(() => {
          this._state = MoonState.READY;
          // console.log('Data refreshed', this.config?.cardId);
        }, LOADING_TIMEOUT);
      }
    };
    // Calculate the remaining time until the next full minute
    const now = new Date();
    const remainingMs = (60 - now.getSeconds()) * 1000;

    // Set up a new interval
    setTimeout(() => {
      // Set up the regular interval to refresh every full minute
      refreshData();
      this._refreshInterval = window.setInterval(() => {
        refreshData();
      }, BASE_REFRESH_INTERVAL);
    }, remainingMs);
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
        ${this.config.hide_buttons || [PageType.CALENDAR].includes(card) ? nothing : header}
        <div class="lunar-card-content" id="main-content" ?padding=${shouldAddPadding}>
          ${choose(card, [
            [PageType.BASE, () => this.renderBaseCard()],
            [PageType.CALENDAR, () => this.renderCalendar()],
            [PageType.HORIZON, () => this.renderHorizon()],
          ])}
        </div>
      </ha-card>
      <lunar-star-field></lunar-star-field>
      ${this.renderCalendarDialog()}
    `;
  }

  private renderCalendarDialog(): TemplateResult | typeof nothing {
    if (!this.config.calendar_modal || !this._dialogOpen) return nothing;
    const isGridMode = this.layout === 'grid';
    return html`<dialog id="calendar-dialog" ?grid=${isGridMode}>
      <div class="dialog-content" style="max-width: ${this._cardWidth}px">
        <lunar-calendar-popup
          .card=${this as any}
          .moon=${this.moon}
          @calendar-action=${(ev: CustomEvent) => this._CALENDAR_PAGE._handleCalAction(ev)}
        ></lunar-calendar-popup>
      </div>
    </dialog>`;
  }

  private renderBaseCard(): TemplateResult | void {
    if (this._activeCard !== PageType.BASE) return;
    const { compact_view, compact_mode } = this.config;
    const isMinimalMode = compact_view && compact_mode === 'minimal';

    return html`<div class="base-card">
      ${isMinimalMode
        ? html` ${this.renderCompactMinimalView()}`
        : html` ${this.renderMoonImage()} ${this.renderMoonData()}`}
    </div>`;
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

  renderHeader(): TemplateResult | void {
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
        <div class="header-title" ?full=${this.config.hide_buttons}>
          <span class="title" ?not-compact=${!this._isCompactMode}>${headerContent}</span>
        </div>
        <div class="action-btns" ?hidden=${this.config.hide_buttons}>
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

  renderMoonImage(): TemplateResult | void {
    if (!this.moon) return;
    const { moonPic } = this.moon.moonImage;

    const southernHemisphere = this.config.southern_hemisphere ?? false;
    return html` <div
      id="moon-image"
      class="moon-image"
      ?no-header=${this.config.hide_buttons}
      ?calendar=${this._isCalendar}
      ?compact=${this.config.compact_view}
      style=${this._computeMoonImageStyles()}
    >
      <img src=${moonPic} ?southern=${southernHemisphere} />
    </div>`;
  }

  renderMoonData(): TemplateResult {
    const compactView =
      this.config.compact_view && this.config?.compact_mode !== 'minimal' && this._activeCard === PageType.BASE;
    const hiddenItems = this.config?.hide_items || [];
    const removedItems = ['direction', ...hiddenItems];
    const replacer = (key: string, value: any) => {
      if (removedItems.includes(key)) {
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

  private renderCompactMinimalView(): TemplateResult {
    const hiddenItems = this.config?.hide_items || [];
    const hideItems = ['nextFullMoon', ...hiddenItems];
    const { moonData, phaseName, nextPhase } = this.moon;
    const timeRange = this.moon._getMinimalData();
    const moonImage = this.renderMoonImage();

    const renderCompactItem = (key: string, secondValue: boolean = false): TemplateResult => {
      const { label, value, secondValue: second } = timeRange[key];
      return html`
        <div class="compact-item-minimal">
          <div class="item-value">
            <span class="value">${label}</span>
            <span class="label">${value}</span>
          </div>
          <span class="second-value">${secondValue && second ? second : '\u00A0'}</span>
        </div>
      `;
    };

    const replacer = (key: string, value: any) => (hideItems.includes(key) ? undefined : value);

    const filteredData = JSON.parse(JSON.stringify(moonData, replacer));
    const addedData = { ...filteredData, nextPhase };
    const currentDate = new Date();
    const timeStr = formatDateTime(currentDate, this._locale);
    return html`
      <div class="compact-view-minimal">
        ${renderCompactItem('start', true)}
        <div class="minimal-moon-image-container" @click=${this._toggleMinimalData}>
          ${moonImage}
          <span class="minimal-title">${phaseName}</span>
        </div>
        ${renderCompactItem('end', true)}
      </div>

      <div class="moon-data-minimal" ?hidden=${true} @click=${this._toggleMinimalData}>
        <span>${timeStr}</span>
        <lunar-base-data .moon=${this.moon} .moonData=${addedData} .chunkedLimit=${4}></lunar-base-data>
      </div>
    `;
  }

  private _toggleMinimalData = (e: Event): void => {
    e.stopPropagation();

    const root = this.shadowRoot;
    if (!root) return;

    const minimal = root.querySelector('.compact-view-minimal') as HTMLElement;
    const details = root.querySelector('.moon-data-minimal') as HTMLElement;

    if (!minimal || !details) return;

    const showDetails = minimal.hasAttribute('hidden');

    if (showDetails) {
      details.setAttribute('hidden', '');
      minimal.removeAttribute('hidden');
      minimal.style.animation = 'fadeIn 400ms ease-in-out';
    } else {
      minimal.setAttribute('hidden', '');
      details.removeAttribute('hidden');
      details.style.animation = 'fadeIn 400ms ease-in-out';
    }
  };

  private renderCalendar(): TemplateResult {
    return html` <lunar-calendar-page .card=${this as any} ._moon=${this.moon}></lunar-calendar-page> `;
  }
  private _attachEventListeners() {
    const dialog = this.shadowRoot?.getElementById('calendar-dialog') as HTMLDialogElement;
    if (!dialog) return;
    const dialogContent = dialog.querySelector('.dialog-content');
    if (!dialogContent) return;
    dialogContent.classList.toggle('slide-in');
    // console.log('dialog', dialog);
    dialog.addEventListener('click', (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (target === dialog) {
        this._dialogOpen = false;
      }
    });
  }
  private updateBodyScroll(): void {
    const body = document.querySelector('body') as HTMLElement;
    if (this._dialogOpen) {
      body.style.overflow = 'hidden';
    } else {
      body.style.overflow = '';
    }
    this.requestUpdate();
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
          ['default', () => defaultGraph],
          ['dynamic', () => dynamicGraph],
        ],
        () => defaultGraph
      )}
    `;
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
    const isCompact = this.config.compact_view;
    const isHeaderHidden = this._headerHidden;
    const width = this._cardWidth;
    const height = [PageType.BASE].includes(this._activeCard!) && !isCompact ? width * 0.5 : '';
    const justify =
      [PageType.BASE].includes(this._activeCard!) && !isCompact && !isHeaderHidden ? 'space-between' : 'center';
    return styleMap({ minHeight: height ? `${height}px` : '', justifyContent: justify });
  }

  private _computeMoonImageStyles() {
    // if (!this._activeCard || this._activeCard === PageType.HORIZON) return;
    const activeCard = this._activeCard;
    const headerOffset = this._headerHidden ? 48 : 96;
    const width = this._cardWidth;
    let moonWidth = activeCard === PageType.CALENDAR ? width * 0.5 - headerOffset : width / 3.5;
    return styleMap({ maxWidth: `${moonWidth}px`, maxHeight: `${moonWidth}px` });
  }

  private _computeClasses() {
    const isHeaderHidden = this.config?.hide_buttons || false;
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
    const fontOptions = this.config?.font_customize || {};
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
    return 2;
  }
}

// Register the card in the UI
registerCustomCard({
  type: LUNAR_PHASE_CARD_NAME,
  name: 'Lunar Phase Card',
  description: 'A custom card to display the current lunar phase.',
});

declare global {
  interface Window {
    LunarCardLegacy: LunarPhaseCard;
    Moon: Moon;
  }
}

import { css, CSSResultGroup, html, nothing, PropertyValues, TemplateResult } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { choose } from 'lit/directives/choose.js';
import { classMap } from 'lit/directives/class-map.js';
import { styleMap } from 'lit/directives/style-map.js';

import { MoonState, SECTION } from '../const';
import './components/card';
import './components/moon-compact-view';
import './components/moon-base';
import './components/moon-data-info';
import './components/moon-calendar-popup';
import './components/moon-calendar-footer';
import './components/moon-chart-dynamic';
import './components/moon-chart-horizon';
import './components/lunar-phase-header';
import '../shared/lunar-star-particles';
import { HomeAssistant, LovelaceCardEditor } from '../ha';
import { Moon } from '../model/moon';
import { Store } from '../model/store';
import { filterItemFromMoonData, MoonData } from '../types/config/chart-config';
import { CSS_FONT_SIZE } from '../types/config/font-config';
import { LunarPhaseCardConfig } from '../types/config/lunar-phase-card-config';
import { computeCssColor } from '../utils/compute-color';
import { computeStubConfig } from '../utils/compute-stub-config';
import { debounce } from '../utils/debounce';
import { applyTheme } from '../utils/ha-helper';
import { LunarBaseCard } from './base-card';
import { LUNAR_PHASE_CARD_EDITOR_NAME, LUNAR_PHASE_CARD_NAME } from './const';
import { DEFAULT_BG_URL } from './css/card-styles';

@customElement(LUNAR_PHASE_CARD_NAME)
export class LunarPhaseCard extends LunarBaseCard {
  public static async getConfigElement(): Promise<LovelaceCardEditor> {
    await import('./editor/lunar-phase-card-editor');
    return document.createElement(LUNAR_PHASE_CARD_EDITOR_NAME) as LovelaceCardEditor;
  }

  public static async getStubConfig(hass: HomeAssistant): Promise<LunarPhaseCardConfig> {
    const initConfig = computeStubConfig(hass);
    return {
      type: `custom:${LUNAR_PHASE_CARD_NAME}`,
      ...initConfig,
    };
  }

  @state() private _state: MoonState = MoonState.READY;
  @state() private _activePage: SECTION = SECTION.BASE;
  @state() private _cardWidth = 0;
  @state() private _cardHeight = 0;
  @state() _cardReady: boolean = false;
  @property() public _selectedDate?: Date;

  @state() _calendarPopup: boolean = false;

  private _resizeObserver?: ResizeObserver;

  public setConfig(config: LunarPhaseCardConfig): void {
    super.setConfig(config);
    this._cardReady = false;
    this._activePage = this.config?.default_section || SECTION.BASE;
    this._cardReady = true;
  }

  public connectedCallback(): void {
    super.connectedCallback();
    window.LunarCard = this as LunarPhaseCard;
    this.updateComplete.then(() => this._attachObserver());
  }

  private async _attachObserver(): Promise<void> {
    if (!this._resizeObserver) {
      this._resizeObserver = new ResizeObserver(debounce(() => this._measureCard(), 250));
    }
    const card = this.shadowRoot!.querySelector('ha-card');
    // If we show an error or warning there is no ha-card
    if (!card) {
      return;
    }
    this._resizeObserver.observe(card);
  }

  public disconnectedCallback(): void {
    super.disconnectedCallback();

    if (this._resizeObserver) {
      this._resizeObserver.disconnect();
    }
  }

  protected willUpdate(_changedProperties: PropertyValues): void {
    super.willUpdate(_changedProperties);

    if (_changedProperties.has('config') && this.config?.custom_theme) {
      const oldTheme = _changedProperties.get('config')?.custom_theme;
      const newTheme = this.config?.custom_theme;
      if (oldTheme !== newTheme && newTheme !== 'default') {
        console.debug('Applying custom theme:', newTheme);
        applyTheme(this, this.hass, newTheme!);
      }
    }
  }

  protected updated(_changedProperties: PropertyValues): void {
    super.updated(_changedProperties);
    if (_changedProperties.has('_activePage')) {
      const oldPage = _changedProperties.get('_activePage') as SECTION;
      if (oldPage && oldPage !== this._activePage && this._selectedDate) {
        console.debug('Reset selected date on page change');
        this._selectedDate = undefined;
      }
    }
  }

  get _date(): Date {
    return this._selectedDate ? new Date(this._selectedDate) : new Date();
  }

  get _filteredData(): MoonData {
    const hiddenItems = ['direction', ...(this.config?.hide_items || [])];
    const dataItems = Object.fromEntries(
      Object.entries(this.moon.moonData).filter(([key]) => !hiddenItems.includes(key))
    );
    return dataItems as MoonData;
  }

  private _measureCard(): void {
    const card = this.shadowRoot!.querySelector('ha-card') as HTMLElement;
    if (!card) {
      return;
    }
    this._cardWidth = card.clientWidth;
    this._cardHeight = card.clientHeight;
    // console.debug('Measured card size:', this._cardWidth, this._cardHeight);
  }

  protected render(): TemplateResult {
    if (!this.config || !this.hass || !this._cardReady) {
      return html``;
    }
    // create store if not exists
    this.createStore();
    // create moon
    this.createMoon();

    const appearance = this._configAppearance;
    return html`
      <ha-card
        class=${this._computeClasses()}
        style=${styleMap(this._computeStyles())}
        ?raised=${appearance.hide_background !== true}
      >
        <lunar-card
          .cardWidth=${this._cardWidth}
          .cardHeight=${this._cardHeight}
          .appearance=${appearance}
          .calendarPopup=${this._activePage === SECTION.FULL_CALENDAR}
          .activePage=${this._activePage}
          .changingContent=${this._state === MoonState.CONTENT_CHANGING}
        >
          ${choose(this._activePage, [
            [SECTION.BASE, () => this._renderBaseSection()],
            [SECTION.CALENDAR, () => this._renderCalendarSection()],
            [SECTION.HORIZON, () => this._renderHorizonSection()],
            [SECTION.FULL_CALENDAR, () => this._renderCalendarSection()],
          ])}
        </lunar-card>
      </ha-card>
      ${appearance.hide_starfield ? nothing : html`<lunar-star-particles></lunar-star-particles>`}
    `;
  }

  private _renderBaseSection() {
    const appearance = this._configAppearance;
    const configLayout = this._configLayout;
    const moonData = this._filteredData;
    const moonImage = this.renderMoonImage();
    const isButtonHidden = appearance.hide_buttons === true;
    // determine chunk limit for data info based on card width and config
    // by default for card width > 460 show 6 items per page, else undefined
    // allow config to override this value via max_data_per_page setting but only apply if card width is > 460
    const chunkLimit = this._cardWidth > 460 ? configLayout.max_data_per_page || 6 : undefined;

    return html` ${appearance.compact_view === true
      ? html` <lunar-moon-compact-view
          .moonData=${moonData}
          .moon=${this.moon}
          .store=${this.store}
          .config=${this.config}
          .hass=${this.hass}
          .appearance=${appearance}
          .header=${this._renderHeader('moon-header', this.moon.phaseName, isButtonHidden)}
          slot="content"
        ></lunar-moon-compact-view>`
      : html` ${!isButtonHidden ? this._renderHeader('header') : nothing}
          <lunar-moon-base
            slot="content"
            .moon=${this.moon}
            .store=${this.store}
            .config=${this.config}
            .hass=${this.hass}
            .activePage=${this._activePage}
            .appearance=${appearance}
          >
            ${moonImage} ${isButtonHidden ? this._renderHeader('moon-header', undefined, true) : nothing}
            <lunar-moon-data-info
              slot="moon-info"
              .moonData=${moonData}
              .chunkedLimit=${chunkLimit}
            ></lunar-moon-data-info
          ></lunar-moon-base>`}`;
  }

  private _renderCalendarSection(): TemplateResult {
    const moonData = filterItemFromMoonData(this._filteredData, ['position', 'nextPhase']);
    if (this._activePage === SECTION.FULL_CALENDAR) {
      return html`
        <lunar-moon-calendar-popup
          slot="content"
          .hass=${this.hass}
          .store=${this.store}
          .card=${this}
          .config=${this.config}
          .moon=${this.moon}
          .moonData=${moonData}
          .south=${this._configLocation?.southern_hemisphere === true}
          @calendar-action=${this._handleCalendarAction}
        >
        </lunar-moon-calendar-popup>
      `;
    }

    return html`
      ${this._renderHeader('header')}
      <lunar-moon-base slot="content" .activePage=${this._activePage} .store=${this.store}>
        ${this.renderMoonImage()}
        <lunar-moon-calendar-footer
          slot="moon-info"
          .hass=${this.hass}
          .store=${this.store}
          .config=${this.config}
          .card=${this}
          .moonData=${moonData}
          @popup-show=${this._handleCalendarPopup}
        ></lunar-moon-calendar-footer>
      </lunar-moon-base>
    `;
  }

  private _handleCalendarPopup(ev: CustomEvent) {
    ev.stopPropagation();
    this._activePage = SECTION.FULL_CALENDAR;
  }
  private _handleCalendarAction(ev: CustomEvent) {
    ev.stopPropagation();
    const action = ev.detail.action;
    if (action === 'close') {
      this._activePage = SECTION.CALENDAR;
    } else if (action === 'date-select' && ev.detail.date) {
      this._selectedDate = ev.detail.date;
      this._calendarPopup = false;
    }
  }

  private _renderHorizonSection(): TemplateResult {
    if (this._configGraph?.graph_type === 'dynamic') {
      return html`
        ${this._renderHeader('header')}
        <lunar-moon-chart-dynamic
          slot="content"
          .hass=${this.hass}
          .store=${this.store}
          .config=${this.config}
          .moon=${this.moon}
          .cardWidth=${this._cardWidth}
        ></lunar-moon-chart-dynamic>
      `;
    }
    const headerTitle = this.store.translate('card.horizonTitle');
    return html`
      ${this._renderHeader('header', headerTitle)}
      <lunar-moon-chart-horizon
        slot="content"
        .hass=${this.hass}
        .store=${this.store}
        .config=${this.config}
        .moon=${this.moon}
        .cardWidth=${this._cardWidth}
      ></lunar-moon-chart-horizon>
    `;
  }

  public _renderHeader(slot: string, title?: string, force: boolean = false): TemplateResult {
    const appearance = this._configAppearance;
    if (appearance.hide_buttons === true && !force) {
      return html``;
    }

    if (!title) {
      title = this.moon.phaseName;
    }
    return html`
      <lunar-phase-header
        slot=${slot}
        .activePage=${this._activePage}
        .moonName=${title}
        .hideButtons=${appearance.hide_buttons}
        .store=${this.store}
        .config=${this.config}
        ._buttonDisabled=${this._state === MoonState.CONTENT_CHANGING}
        @change-section=${this._handleChangeSection.bind(this)}
      ></lunar-phase-header>
    `;
  }

  public _resetSelectedDate(): void {
    if (this._selectedDate !== undefined) {
      this._selectedDate = undefined;
    }
  }
  private createStore() {
    if (this.store) {
      return;
    }
    this.store = new Store(this.hass, this.config, this);
  }
  private createMoon() {
    const initData = {
      date: this._date,
      config: this.config,
      locale: this._configLocale,
    };
    this.moon = new Moon(initData);
  }

  private _handleChangeSection(ev: CustomEvent) {
    ev.stopPropagation();
    const section = ev.detail.section;
    this._state = MoonState.CONTENT_CHANGING;
    this._activePage = section;
    setTimeout(() => {
      this._state = MoonState.READY;
    }, 500);
  }

  private _computeClasses() {
    const appearance = this._configAppearance;
    const classes = {
      compact: appearance?.compact_view === true,
      '--has-bg': appearance?.hide_background !== true,
    };
    return classMap(classes);
  }

  private _computeStyles() {
    const appearance = this._configAppearance;
    const styles: Record<string, string> = {};
    const bg = appearance?.custom_background;
    if (bg && appearance.hide_background !== true) {
      styles['--lpc-bg-image'] = `url(${bg})`;
    }
    // header styles
    const { _configHeaderStyles, _configLabelStyles } = this;
    Object.entries({ ..._configHeaderStyles, ..._configLabelStyles }).forEach(([key, value]) => {
      // only set style if value is valid, not undefined, not empty, and not 'auto' or 'none'
      if (Boolean(value !== undefined && value !== '' && !['auto', 'none'].includes(value as string))) {
        styles[`--lpc-${key.replace(/_/g, '-')}`] = key.includes('font_size')
          ? CSS_FONT_SIZE[value] || value
          : key.includes('font_color')
            ? computeCssColor(value)
            : value;
      }
    });

    return styles;
  }

  static get styles(): CSSResultGroup {
    return [
      super.styles,
      css`
        :host {
          display: block;
          width: 100%;
          height: 100%;
          /* margin: calc(-1 * var(--ha-card-border-width, 1px)); */
          padding: 0;
          position: relative;
        }
        ${DEFAULT_BG_URL}
        lunar-star-particles {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
          z-index: 0;
        }
        ha-card {
          position: relative;
          overflow: hidden;
          display: flex;
          width: 100%;
          height: fit-content;
          flex-direction: column;
        }
        ha-card.--has-bg {
          background-size: cover;
          background-position: center;
          background-repeat: no-repeat;
          background-image: var(--lpc-bg-image);
          --primary-text-color: var(--lpc-label-font-color, #e1e1e1);
          box-shadow: none !important;
        }
      `,
    ];
  }
}

declare global {
  interface Window {
    LunarCard: LunarPhaseCard;
  }
}

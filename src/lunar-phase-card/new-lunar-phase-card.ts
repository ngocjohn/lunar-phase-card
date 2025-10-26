import { css, CSSResultGroup, html, nothing, PropertyValues, TemplateResult } from 'lit';
import { customElement, query, state } from 'lit/decorators.js';
import { choose } from 'lit/directives/choose.js';
import { classMap } from 'lit/directives/class-map.js';
import { styleMap } from 'lit/directives/style-map.js';

import { MoonState, SECTION } from '../const';
import './components';
import '../shared/moon-star-field';
import { HomeAssistant, LovelaceCard, LovelaceCardEditor } from '../ha';
import { Moon } from '../model/moon';
import { Store } from '../model/store';
import { filterItemFromMoonData, MoonData } from '../types/config/chart-config';
import { CSS_FONT_SIZE } from '../types/config/font-config';
import { LunarPhaseCardConfig } from '../types/config/lunar-phase-card-config';
import { computeStubConfig } from '../utils/compute-stup-config';
import { registerCustomCard } from '../utils/custom-card-register';
import { debounce } from '../utils/debounce';
import { applyTheme } from '../utils/ha-helper';
import { LunarBaseCard } from './base-card';
import { LunarMoonCalendarFooter } from './components';
import { COMPONENT, LUNAR_PHASE_CARD_EDITOR_NEW_NAME, LUNAR_PHASE_CARD_NEW_NAME } from './const';
import { DEFAULT_BG_URL } from './css/card-styles';

registerCustomCard({
  type: LUNAR_PHASE_CARD_NEW_NAME,
  name: 'Lunar Phase Card',
  description: 'A card to display lunar phases and related information.',
});

@customElement(LUNAR_PHASE_CARD_NEW_NAME)
export class LunarPhaseNewCard extends LunarBaseCard implements LovelaceCard {
  public static async getConfigElement(): Promise<LovelaceCardEditor> {
    await import('./editor/lunar-phase-card-editor');
    return document.createElement(LUNAR_PHASE_CARD_EDITOR_NEW_NAME) as LovelaceCardEditor;
  }

  public static async getStubConfig(hass: HomeAssistant): Promise<LunarPhaseCardConfig> {
    const initConfig = computeStubConfig(hass);
    return {
      type: `custom:${LUNAR_PHASE_CARD_NEW_NAME}`,
      ...initConfig,
    };
  }

  @state() private _state: MoonState = MoonState.READY;
  @state() private _activePage: SECTION = SECTION.BASE;
  @state() private _cardWidth = 0;
  @state() private _cardHeight = 0;
  @state() _cardReady: boolean = false;
  @state() _selectedDate?: Date;

  @state() _calendarPopup: boolean = false;
  @query(COMPONENT.CALENDAR) _elCalendar!: LunarMoonCalendarFooter;

  private _resizeObserver?: ResizeObserver;

  public setConfig(config: LunarPhaseCardConfig): void {
    super.setConfig(config);
    this._cardReady = false;
    this._activePage = this.config?.default_section || SECTION.BASE;
    this._cardReady = true;
    this.updateComplete.then(() => this._measureCard());
  }

  public connectedCallback(): void {
    super.connectedCallback();
    window.LunarCard = this;
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
    if ((_changedProperties.has('config') && this.config.custom_theme) || this.config.theme_mode) {
      applyTheme(this, this.hass, this.config.custom_theme!, this.config.theme_mode);
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
    if (_changedProperties.has('_selectedDate') && this._selectedDate !== undefined) {
      console.debug('update:', new Date(this._selectedDate).toLocaleString());
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

  private _measureCard() {
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
      <ha-card class=${this._computeClasses()} style=${this._computeStyles()}>
        <lunar-card
          .cardWidth=${this._cardWidth}
          .cardHeight=${this._cardHeight}
          .appearance=${appearance}
          .calendarPopup=${this._calendarPopup}
          .activePage=${this._activePage}
          .changingContent=${this._state === MoonState.CONTENT_CHANGING}
        >
          ${choose(this._activePage, [
            [SECTION.BASE, () => this._renderBaseSection()],
            [SECTION.CALENDAR, () => this._renderCalendarSection()],
            [SECTION.HORIZON, () => this._renderHorizonSection()],
          ])}
        </lunar-card>
      </ha-card>
      <lunar-star-field></lunar-star-field>
    `;
  }

  private _renderBaseSection(): TemplateResult {
    const appearance = this._configAppearance;
    const moonData = this._filteredData;
    const moonImage = this.renderMoonImage();
    const isButtonHidden = appearance.hide_buttons === true;
    const chunkLimit = this._cardWidth > 460 ? 6 : undefined;
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
            .activePage=${this._activePage}
            .appearance=${appearance}
            .store=${this.store}
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
    if (this._calendarPopup) {
      return html`
        <lunar-moon-calendar-popup
          slot="content"
          .card=${this}
          .config=${this.config}
          .moon=${this.moon}
          @calendar-action=${this._handleCalendarAction}
        >
        </lunar-moon-calendar-popup>
      `;
    }
    const moonData = filterItemFromMoonData(this._filteredData, ['position', 'nextPhase']);
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
    this._calendarPopup = true;
  }
  private _handleCalendarAction(ev: CustomEvent) {
    ev.stopPropagation();
    const action = ev.detail.action;
    if (action === 'close') {
      this._calendarPopup = false;
    } else if (action === 'date-select' && ev.detail.date) {
      this._selectedDate = ev.detail.date;
      this._calendarPopup = false;
      // toggle calendar footer active
      setTimeout(() => {
        this._elCalendar?._toggleFooter();
      }, 100);
    }
  }

  private _renderHorizonSection(): TemplateResult {
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

  public _renderHeader(slot?: string, title?: string, force: boolean = false): TemplateResult {
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

  private createStore() {
    if (this.store) {
      return;
    }
    console.debug('Create store for card');
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
    if (bg) {
      styles['--lpc-bg-image'] = `url(${bg})`;
    }
    // header styles
    const { _configHeaderStyles, _configLabelStyles } = this;
    Object.entries({ ..._configHeaderStyles, ..._configLabelStyles }).forEach(([key, value]) => {
      if (value !== undefined || value !== null || !['auto', 'none'].includes(value as string)) {
        styles[`--lpc-${key.replace(/_/g, '-')}`] = CSS_FONT_SIZE[value];
      }
    });

    return styleMap(styles);
  }

  static get styles(): CSSResultGroup {
    return [
      super.styles,
      css`
        :host {
          display: block;
          width: 100%;
          height: 100%;
          margin: cal(-1 * var(--ha-card-border-width, 1px));
          padding: 0;
          position: relative;
        }
        ${DEFAULT_BG_URL}
        lunar-star-field {
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
        }
      `,
    ];
  }
}

declare global {
  interface Window {
    LunarCard: LunarPhaseNewCard;
  }
}

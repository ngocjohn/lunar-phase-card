import { css, CSSResultGroup, html, nothing, PropertyValues, TemplateResult } from 'lit';
import { customElement, query, state } from 'lit/decorators.js';
import { choose } from 'lit/directives/choose.js';
import { classMap } from 'lit/directives/class-map.js';
import { styleMap } from 'lit/directives/style-map.js';

import { MoonState, SECTION } from '../const';
import './components';
import '../shared/moon-star-field';
import { HomeAssistant, LovelaceCard, LovelaceCardEditor } from '../ha';
import { Store } from '../model/store';
import { MoonData } from '../types/config/chart-config';
import { CSS_FONT_SIZE } from '../types/config/font-config';
import { LunarPhaseCardConfig } from '../types/config/lunar-phase-card-config';
import { computeStubConfig } from '../utils/compute-stup-config';
import { registerCustomCard } from '../utils/custom-card-register';
import { debounce } from '../utils/debounce';
import { Moon } from '../utils/moon';
import { LunarBaseCard } from './base-card';
import { Card, LunarHeader, LunarMoonBase, LunarMoonCalendarFooter } from './components';
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

  @state() private _activePage: SECTION = SECTION.BASE;
  @state() private _cardWidth = 0;
  @state() private _cardHeight = 0;
  @state() _calendarPopup: boolean = false;
  @state() _selectedDate?: Date;
  @state() private _state: MoonState = MoonState.READY;
  @query(COMPONENT.HEADER) _elHeader!: LunarHeader;
  @query(COMPONENT.CARD) _elCard!: Card;
  @query(COMPONENT.BASE) _elBase!: LunarMoonBase;
  @query(COMPONENT.CALENDAR) _elCalendar!: LunarMoonCalendarFooter;

  private _resizeObserver?: ResizeObserver;

  public setConfig(config: LunarPhaseCardConfig): void {
    super.setConfig(config);
    this.updateComplete.then(() => this._measureCard());
  }

  public connectedCallback(): void {
    super.connectedCallback();
    window.LunarCard = this;
    this.updateComplete.then(() => this._attachObserver());
  }

  protected updated(_changedProperties: PropertyValues): void {
    super.updated(_changedProperties);
    if (_changedProperties.has('_activePage')) {
      const oldPage = _changedProperties.get('_activePage') as SECTION;
      if (oldPage && oldPage !== this._activePage && this._selectedDate) {
        this._selectedDate = undefined;
      }
    }
  }

  get _date(): Date {
    return this._selectedDate ? new Date(this._selectedDate) : new Date();
  }

  get _filteredData(): MoonData {
    const hiddenItems = ['direction', ...(this.config?.hide_items || [])];
    const replacer = (key: string, value: any) => {
      if (hiddenItems.includes(key)) {
        return undefined;
      }
      return value;
    };
    return JSON.parse(JSON.stringify(this.moon.moonData, replacer));
  }

  private _measureCard() {
    const card = this.shadowRoot!.querySelector('ha-card') as HTMLElement;
    if (!card) {
      return;
    }
    this._cardWidth = card.offsetWidth;
    this._cardHeight = card.offsetHeight;
  }

  private async _attachObserver(): Promise<void> {
    if (!this._resizeObserver) {
      this._resizeObserver = new ResizeObserver(debounce(() => this._measureCard(), 250, false));
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
  protected render(): TemplateResult {
    if (!this.config || !this.hass) {
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
          ${!appearance.hide_header ? this._renderHeader('header') : nothing}
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
    return html` <lunar-moon-base slot="content" .activePage=${this._activePage} .store=${this.store}>
      ${this.renderMoonImage()}
      ${appearance.compact_view === true
        ? this._renderCompactBaseSection(moonData)
        : html` ${appearance.hide_header ? this._renderHeader('moon-header') : nothing}
            <lunar-moon-data-info slot="moon-info" .moonData=${moonData} .chunkedLimit=${5}></lunar-moon-data-info>`}
    </lunar-moon-base>`;
  }

  private _renderCompactBaseSection(moonData: MoonData): TemplateResult {
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
            <ha-icon .icon=${icon}></ha-icon>
            ${value}
          </div>
          ${this.config.font_config?.hide_label ? html`` : html` <span class="value">${label}</span>`}
        </div>
      `;
    };
    return html` ${this._renderHeader('moon-header')}
      <div slot="moon-info" class="compact-view-container">
        <div class="moon-fraction">${moonData.moonFraction.value} ${this.store.translate('card.illuminated')}</div>
        <div class="compact-view-items">${Object.keys(items).map((key) => renderCompactItem(key))}</div>
      </div>`;
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
    return html`
      <lunar-moon-base slot="content" .activePage=${this._activePage} .store=${this.store}>
        ${this.renderMoonImage()}
        <lunar-moon-calendar-footer
          slot="moon-info"
          .hass=${this.hass}
          .store=${this.store}
          .config=${this.config}
          .card=${this}
          .moonData=${this._filteredData}
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
    return html`<div slot="content">This is the horizon section.</div>`;
  }

  private _renderHeader(slot: string): TemplateResult {
    const appearance = this._configAppearance;
    return html`
      <lunar-phase-header
        slot=${slot}
        .activePage=${this._activePage}
        .moonName=${this.moon.phaseName}
        .hideButtons=${appearance.hide_header || appearance.hide_buttons}
        .store=${this.store}
        .config=${this.config}
        @change-section=${this._handleChangeSection}
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

  private _handleChangeSection(ev: CustomEvent): void {
    ev.stopPropagation();
    const section = ev.detail.section;
    if (section === this._activePage) {
      return;
    }
    this._state = MoonState.CONTENT_CHANGING;
    this._activePage = section;
    setTimeout(() => {
      this._state = MoonState.READY;
    }, 300);
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
      if (value !== undefined) {
        styles[`--lpc-${key.replace(/_/g, '-')}`] = CSS_FONT_SIZE[value] || value;
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
          transition: all 0.5s ease;
          border: none;
        }
        .compact-view-container {
          display: flex;
          width: 100%;
          gap: var(--lunar-card-padding);
          /* margin-inline: 8px; */
          overflow: hidden;
          --mdc-icon-size: 17px;
          flex-direction: column;
          align-items: flex-start;
          justify-content: space-between;
        }
        .moon-fraction {
          font-size: var(--ha-font-size-l);
          letter-spacing: 1px;
          color: rgba(from var(--primary-text-color) r g b / 0.8);
          margin-inline-start: var(--lunar-card-gutter);
        }
        .compact-view-items {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: var(--lunar-card-gutter);
          width: 100%;
        }

        .compact-item {
          display: flex;
          width: 100%;
          flex-direction: column;
          font-size: var(--lpc-label-font-size, var(--ha-font-size-m));
          align-items: center;
          justify-content: space-between;
        }
        .compact-item .icon-value {
          display: flex;
          align-items: flex-end;
          flex-direction: row;
        }

        .compact-item span.value {
          color: rgba(from var(--primary-text-color) r g b / 0.7);
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

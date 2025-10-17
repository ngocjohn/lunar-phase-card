import { css, CSSResultGroup, html, nothing, TemplateResult } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';

import { SECTION } from '../const';
import { HomeAssistant, LovelaceCard, LovelaceCardEditor } from '../ha';
import { Store } from '../model/store';
import './card';
import './components/lunar-phase-header';
import { LunarPhaseCardConfig } from '../types/config/lunar-phase-card-config';
import { computeStubConfig } from '../utils/compute-stup-config';
import { registerCustomCard } from '../utils/custom-card-register';
import { Moon } from '../utils/moon';
import { LunarBaseCard } from './base-card';
import { LUNAR_PHASE_CARD_EDITOR_NEW_NAME, LUNAR_PHASE_CARD_NEW_NAME } from './const';

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

  public setConfig(config: LunarPhaseCardConfig): void {
    super.setConfig(config);
  }

  @state() private _activePage: SECTION = SECTION.BASE;
  @state() private _selectedDate?: Date;

  public connectedCallback(): void {
    super.connectedCallback();
    window.LunarCard = this;
  }

  get _date(): Date {
    return this._selectedDate ? new Date(this._selectedDate) : new Date();
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
      <ha-card class=${classMap({ compact: Boolean(this.config.compact_view) })}>
        <lunar-card .appearance=${appearance}>
          ${!appearance.hide_header
            ? html`<lunar-phase-header
                slot="header"
                .activePage=${this._activePage}
                .moonName=${this.moon.phaseName}
                .hideButtons=${appearance.hide_buttons}
                @change-section=${this._handleChangeSection}
              ></lunar-phase-header>`
            : nothing}
          <div slot="content">${this._activePage}</div>
          <div slot="footer">Footer Content</div>
        </lunar-card>
      </ha-card>
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
    this._activePage = section;
  }

  static get styles(): CSSResultGroup {
    return [
      super.styles,
      css`
        :host {
          display: block;
          width: 100%;
          height: 100%;
          box-sizing: border-box;
        }
        ha-card {
          display: flex;
          height: 100%;
          box-sizing: border-box;
          overflow: hidden;
          width: 100%;
          padding: 0;
          margin: 0;
          /* min-height: 250px; */
        }
        /* ha-card.compact {
          min-height: 150px;
        } */
      `,
    ];
  }
}

declare global {
  interface Window {
    LunarCard: LunarPhaseNewCard;
  }
}

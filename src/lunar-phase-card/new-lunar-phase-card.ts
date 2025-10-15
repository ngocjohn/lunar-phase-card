import { css, CSSResultGroup, html, TemplateResult } from 'lit';
import { customElement } from 'lit/decorators.js';

import { HomeAssistant, LovelaceCard, LovelaceCardEditor } from '../ha';
import { Store } from '../model/store';
import { LunarPhaseNewCardConfig } from '../types/lunar-phase-card-config';
import './card';
import { registerCustomCard } from '../utils/custom-card-register';
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
  public static async getStubConfig(hass: HomeAssistant): Promise<LunarPhaseNewCardConfig> {
    const { latitude, longitude } = hass.config;
    return {
      type: `custom:${LUNAR_PHASE_CARD_NEW_NAME}`,
      location_source: 'default',
      latitude: latitude ?? 0,
      longitude: longitude ?? 0,
    };
  }

  public setConfig(config: LunarPhaseNewCardConfig): void {
    super.setConfig(config);
  }

  public connectedCallback(): void {
    super.connectedCallback();
    window.LunarCard = this;
  }

  protected render(): TemplateResult {
    if (!this.config || !this.hass) {
      return html``;
    }
    // create store if not exists
    this.createStore();
    // use config
    const { latitude, longitude } = this.config;
    return html`
      <ha-card>
        <lunar-card .appearance=${{ compact: this.config.compact_view }}>
          <div slot="header">
            <div>Lunar Phase Card</div>
            <ha-icon icon="mdi:moon-waxing-crescent"></ha-icon>
          </div>
          <div slot="content">${latitude}, ${longitude}</div>
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

  static get styles(): CSSResultGroup {
    return [
      super.styles,
      css`
        ha-card {
          display: flex;
          height: auto;
          box-sizing: border-box;
          overflow: hidden;
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

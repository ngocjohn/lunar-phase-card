import { css, CSSResultGroup, html, nothing, TemplateResult } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';

import { HomeAssistant, LovelaceBadgeEditor } from '../../ha';
import './badge-location-editor';
import './badge-content-editor';
import { BaseBadgeEditor } from './base-badge-editor';

const tabs = ['location', 'content'] as const;

@customElement('lunar-phase-badge-editor')
export class LunarPhaseBadgeEditor extends BaseBadgeEditor implements LovelaceBadgeEditor {
  @property({ attribute: false }) public _hass!: HomeAssistant;
  @state() private _currTab: (typeof tabs)[number] = tabs[0];

  constructor() {
    super();
  }

  connectedCallback() {
    super.connectedCallback();
    window.LunarBadgeEditor = this;
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
  }

  set hass(hass: HomeAssistant) {
    this._hass = hass;
  }

  get hass(): HomeAssistant {
    return this._hass;
  }

  protected render(): TemplateResult {
    if (!this.config || !this._hass) {
      return html``;
    }

    let content: TemplateResult<1> | typeof nothing = nothing;

    switch (this._currTab) {
      case 'location':
        content = html`<lpc-badge-location-editor
          .config=${this.config}
          ._hass=${this._hass}
        ></lpc-badge-location-editor>`;
        break;
      case 'content':
        content = html`<lpc-badge-content-editor
          .config=${this.config}
          ._hass=${this._hass}
        ></lpc-badge-content-editor>`;
        break;
    }

    return html`
      <ha-tab-group @wa-tab-show=${this._handleTabChange}>
        ${tabs.map(
          (tab) => html`
            <ha-tab-group-tab slot="nav" .active=${this._currTab === tab} panel=${tab}> ${tab} </ha-tab-group-tab>
          `
        )}
      </ha-tab-group>

      ${content}
    `;
  }

  private _handleTabChange(ev: CustomEvent): void {
    const newTab = ev.detail.name;
    if (newTab === this._currTab) {
      return;
    }
    this._currTab = newTab as (typeof tabs)[number];
  }

  static get styles(): CSSResultGroup {
    return [
      super.styles,
      css`
        ha-tab-group {
          margin-bottom: 16px;
        }

        ha-tab-group-tab {
          flex: 1;
          text-transform: capitalize;
        }

        ha-tab-group-tab::part(base) {
          width: 100%;
          justify-content: center;
        }
      `,
    ];
  }
}

declare global {
  interface Window {
    LunarBadgeEditor: LunarPhaseBadgeEditor;
  }
}

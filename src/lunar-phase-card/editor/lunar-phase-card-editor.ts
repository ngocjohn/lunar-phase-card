// lovelace card imports.
import { CSSResultGroup, html, nothing, TemplateResult } from 'lit';
import { property, state } from 'lit/decorators.js';

import { HomeAssistant, LovelaceCardEditor } from '../../ha';
import './components/general-area';
import './components/location-area';
import './components/appearance-area';
import './components/yaml-editor';
import './components/form-editor';
import './shared/nav-bar';
import { Store } from '../../model/store';
import { loadHaComponents, refactorEditDialog } from '../../utils/loader';
import { LUNAR_PHASE_CARD_EDITOR_NEW_NAME } from '../const';
import { BaseEditor } from './base-editor';
import { EditorArea } from './editor-area-config';

export class LunarPhaseCardEditor extends BaseEditor implements LovelaceCardEditor {
  @property({ attribute: false }) public _hass!: HomeAssistant;

  @state() private editorArea: EditorArea = EditorArea.DEFAULT;
  constructor() {
    super(EditorArea.DEFAULT);
  }
  connectedCallback() {
    super.connectedCallback();
    void loadHaComponents();
    void refactorEditDialog();
    window.LunarEditor = this;
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
    // crate store if not exists
    this.createStore();

    return html` <div class="base-config">
      <lpc-general-area
        ._hass=${this._hass}
        .config=${this.config}
        .store=${this.store}
        .value=${this.editorArea}
        @area-changed=${this._areaChanged}
      ></lpc-general-area>
      ${this._renderSelectedConfigType()}
    </div>`;
  }
  private _renderSelectedConfigType(): TemplateResult | typeof nothing {
    const selected = this.editorArea;
    const areaMap: Record<EditorArea | string, TemplateResult | typeof nothing> = {
      [EditorArea.LOCATION]: this._renderLocationArea(),
      [EditorArea.APPEARANCE]: this._renderAppearanceArea(),
      [EditorArea.LAYOUT]: this._renderLayoutArea(),
    };
    return areaMap[selected] || nothing;
  }
  private _renderLocationArea(): TemplateResult {
    return html`<lpc-location-area
      ._hass=${this._hass}
      .config=${this.config}
      .store=${this.store}
    ></lpc-location-area>`;
  }
  private _renderAppearanceArea(): TemplateResult {
    return html`<lpc-appearance-area
      ._hass=${this._hass}
      .config=${this.config}
      .store=${this.store}
    ></lpc-appearance-area>`;
  }
  private _renderLayoutArea(): TemplateResult {
    return html`<div>This is Layout Area Editor (to be implemented)</div>`;
  }

  private _areaChanged(ev: CustomEvent): void {
    ev.stopPropagation();
    const area = ev.detail.area || null;
    const editorArea = area ? (area as EditorArea) : EditorArea.DEFAULT;
    this.editorArea = editorArea as EditorArea;
  }
  private createStore(): void {
    this.store = new Store(this._hass, this.config, this);
  }
  static get styles(): CSSResultGroup {
    return [super.styles];
  }
}

customElements.define(LUNAR_PHASE_CARD_EDITOR_NEW_NAME, LunarPhaseCardEditor);

declare global {
  interface Window {
    LunarEditor: LunarPhaseCardEditor;
  }
}

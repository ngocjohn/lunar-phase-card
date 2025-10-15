// lovelace card imports.
import { html, TemplateResult } from 'lit';

import { LUNAR_PHASE_CARD_EDITOR_NEW_NAME } from '../const';
import { BaseEditor } from './base-editor';

class LunarPhaseCardEditor extends BaseEditor {
  public connectedCallback(): void {
    super.connectedCallback();
    window.LunarEditor = this;
  }

  protected render(): TemplateResult | void {
    if (!this.config || !this.hass) {
      return html``;
    }
    // crate store if not exists
    super.createStore();
    return html`<div>Lunar Phase Card Editor</div>`;
  }
}

customElements.define(LUNAR_PHASE_CARD_EDITOR_NEW_NAME, LunarPhaseCardEditor);

declare global {
  interface Window {
    LunarEditor: LunarPhaseCardEditor;
  }
}

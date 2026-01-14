import { pick } from 'es-toolkit';
import { css, CSSResultGroup, TemplateResult, PropertyValues, html } from 'lit';
import { customElement, state } from 'lit/decorators.js';

import { AppearanceOptions, CardAppearance } from '../../../types/config/lunar-phase-card-config';
import { BaseEditor } from '../base-editor';
import { EditorArea } from '../editor-area-config';
import { APPEARANCE_FORM_SCHEMA } from '../forms/appearance-schema';
import { createSecondaryCodeLabel } from '../shared/nav-bar';

@customElement('lpc-appearance-area')
export class AppearanceArea extends BaseEditor {
  constructor() {
    super(EditorArea.APPEARANCE);
    window.LunarAppearanceArea = this;
  }
  @state() protected _appearance?: CardAppearance;
  @state() private _yamlActive: boolean = false;

  protected willUpdate(_changedProperties: PropertyValues): void {
    super.willUpdate(_changedProperties);
    if (_changedProperties.has('config') && this.config) {
      this._appearance = pick(this.config, [...AppearanceOptions]);
    }
  }

  protected render(): TemplateResult {
    const customLocalize = this.store.translate;
    const DATA = { ...this._appearance };
    const schema = APPEARANCE_FORM_SCHEMA(DATA, customLocalize);
    const formEl = this.createLpcForm(DATA, schema);
    return html`
      ${this._yamlActive ? this.createYamlEditor(DATA) : formEl}
      <lpc-nav-bar
        hide-primary
        .secondaryAction=${createSecondaryCodeLabel(this._yamlActive)}
        @secondary-action=${() => {
          this._yamlActive = !this._yamlActive;
        }}
      ></lpc-nav-bar>
    `;
  }

  static get styles(): CSSResultGroup {
    return [super.styles, css``];
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'lpc-appearance-area': AppearanceArea;
  }
}

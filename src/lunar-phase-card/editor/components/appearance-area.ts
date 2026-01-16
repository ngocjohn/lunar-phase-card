import { pick } from 'es-toolkit';
import { css, CSSResultGroup, TemplateResult, PropertyValues, html } from 'lit';
import { customElement, state } from 'lit/decorators.js';

import { VisualBackgroundConfig, VisualBackgroundOptions } from '../../../types/config/lunar-phase-card-config';
import { BaseEditor } from '../base-editor';
import { EditorArea } from '../editor-area-config';
import { VISUAL_SCHEMA } from '../forms';
import { createSecondaryCodeLabel } from '../shared/nav-bar';

@customElement('lpc-appearance-area')
export class AppearanceArea extends BaseEditor {
  constructor() {
    super(EditorArea.APPEARANCE);
    window.LunarAppearanceArea = this;
  }
  @state() protected _visualConfig?: VisualBackgroundConfig;
  @state() private _yamlActive: boolean = false;

  protected willUpdate(_changedProperties: PropertyValues): void {
    super.willUpdate(_changedProperties);
    if (_changedProperties.has('config') && this.config) {
      this._visualConfig = pick(this.config, [...VisualBackgroundOptions]);
    }
  }

  protected render(): TemplateResult {
    const customLocalize = this.store.translate;
    const VISUAL_DATA = { ...this._visualConfig };
    const visualSchema = VISUAL_SCHEMA(VISUAL_DATA, customLocalize);
    const visualFormEl = this.createLpcForm(VISUAL_DATA, visualSchema);
    return html`
      ${this._yamlActive ? this.createYamlEditor(VISUAL_DATA) : visualFormEl}
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

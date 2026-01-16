import { pick } from 'es-toolkit';
import { css, CSSResultGroup, TemplateResult, PropertyValues, html } from 'lit';
import { customElement, state } from 'lit/decorators.js';

import {
  AppearanceLayoutConfig,
  AppearanceLayoutKeys,
  DataVisualConfig,
  DataVisualKeys,
} from '../../../types/config/lunar-phase-card-config';
import { BaseEditor } from '../base-editor';
import { EditorArea } from '../editor-area-config';
import { APPEARANCE_FORM_SCHEMA } from '../forms';
import { LAYOUT_SCHEMA } from '../forms/layout-schema';
import { createSecondaryCodeLabel } from '../shared/nav-bar';

@customElement('lpc-layout-area')
export class LayoutArea extends BaseEditor {
  constructor() {
    super(EditorArea.LAYOUT);
    window.LunarLayoutArea = this;
  }

  @state() private _appearanceLayoutConfig?: AppearanceLayoutConfig;
  @state() private _dataVisualConfig?: DataVisualConfig;
  @state() private _apearanceDataLayoutConfig?: AppearanceLayoutConfig & DataVisualConfig;
  @state() private _yamlActive: boolean = false;

  protected willUpdate(_changedProperties: PropertyValues): void {
    super.willUpdate(_changedProperties);
    if (_changedProperties.has('config') && this.config) {
      this._appearanceLayoutConfig = pick(this.config, [...AppearanceLayoutKeys]);
      this._dataVisualConfig = pick(this.config, [...DataVisualKeys]);
    }
  }
  protected render(): TemplateResult {
    const customLocalize = this.store.translate;
    const appearanceConfig = { ...this._appearanceLayoutConfig };
    const dataVisualConfig = { ...this._dataVisualConfig };

    const dataVisualConfigCombined = {
      ...this._appearanceLayoutConfig,
      ...this._dataVisualConfig,
    };
    const combinedSchema = [
      ...APPEARANCE_FORM_SCHEMA(appearanceConfig, customLocalize),
      ...LAYOUT_SCHEMA(dataVisualConfig, customLocalize),
    ];

    const combinedForm = this.createLpcForm(dataVisualConfigCombined, combinedSchema);

    return html`
      ${this._yamlActive ? this.createYamlEditor(dataVisualConfig) : combinedForm}
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
    'lpc-layout-area': LayoutArea;
  }
}

import { pick } from 'es-toolkit';
import { css, CSSResultGroup, TemplateResult, PropertyValues, html } from 'lit';
import { customElement, state } from 'lit/decorators.js';

import { LayoutConfig, LayoutConfigKeys } from '../../../types/config/lunar-phase-card-config';
import { BaseEditor } from '../base-editor';
import { EditorArea } from '../editor-area-config';
import { LAYOUT_SCHEMA } from '../forms/layout-schema';
import { createSecondaryCodeLabel } from '../shared/nav-bar';

@customElement('lpc-layout-area')
export class LayoutArea extends BaseEditor {
  constructor() {
    super(EditorArea.LAYOUT);
    window.LunarLayoutArea = this;
  }
  @state() private layoutConfig?: LayoutConfig;
  @state() private _yamlActive: boolean = false;

  protected willUpdate(_changedProperties: PropertyValues): void {
    super.willUpdate(_changedProperties);
    if (_changedProperties.has('config') && this.config) {
      this.layoutConfig = pick(this.config, [...LayoutConfigKeys]);
    }
  }
  protected render(): TemplateResult {
    const customLocalize = this.store.translate;
    const layoutConfig = { ...this.layoutConfig };
    const SCHEMA = LAYOUT_SCHEMA(layoutConfig, customLocalize);
    const layoutForm = this.createLpcForm(layoutConfig, SCHEMA);
    return html`
      ${this._yamlActive ? this.createYamlEditor(layoutConfig) : layoutForm}
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

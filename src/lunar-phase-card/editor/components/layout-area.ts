import { pick } from 'es-toolkit';
import { css, CSSResultGroup, TemplateResult, PropertyValues } from 'lit';
import { customElement, state } from 'lit/decorators.js';

import { LayoutConfig, LayoutConfigKeys } from '../../../types/config/lunar-phase-card-config';
import { BaseEditor } from '../base-editor';
import { EditorArea } from '../editor-area-config';
import { LAYOUT_SCHEMA } from '../forms/layout-schema';

@customElement('lpc-layout-area')
export class LayoutArea extends BaseEditor {
  constructor() {
    super(EditorArea.LAYOUT);
    window.LunarLayoutArea = this;
  }
  @state() private layoutConfig?: LayoutConfig;

  protected willUpdate(_changedProperties: PropertyValues): void {
    super.willUpdate(_changedProperties);
    if (_changedProperties.has('config') && this.config) {
      this.layoutConfig = pick(this.config, [...LayoutConfigKeys]);
    }
  }
  protected render(): TemplateResult {
    const layoutConfig = { ...this.layoutConfig };
    const SCHEMA = LAYOUT_SCHEMA(layoutConfig);
    const layoutForm = this.createLpcForm(layoutConfig, SCHEMA);
    return layoutForm;
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

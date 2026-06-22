import { pick } from 'es-toolkit';
import { css, CSSResultGroup, TemplateResult, PropertyValues, html } from 'lit';
import { customElement, state } from 'lit/decorators.js';

import setupTranslation from '../../localize/translate';
import { APPEARANCE_CONFIG_KEYS, AppearanceBadgeConfig } from '../../types/config/lunar-phase-badge-config';
import { BADGE_APPEARANCE_SCHEMA } from '../forms/badge-appearance-schema';
import { BaseBadgeEditor } from './base-badge-editor';

@customElement('lpc-badge-content-editor')
export class BadgeContentEditor extends BaseBadgeEditor {
  constructor() {
    super();
  }
  @state() private _appearanceConfig?: AppearanceBadgeConfig;

  protected willUpdate(_changedProperties: PropertyValues): void {
    super.willUpdate(_changedProperties);
    if (_changedProperties.has('config') && this.config) {
      this._appearanceConfig = pick(this.config, [...APPEARANCE_CONFIG_KEYS]) as AppearanceBadgeConfig;
    }
  }

  protected render(): TemplateResult {
    const configData = { ...this._appearanceConfig };
    const customLocalize = setupTranslation(
      this.config?.language || this.hass?.selectedLanguage || this.hass.locale.language
    );
    const schema = BADGE_APPEARANCE_SCHEMA(customLocalize);
    return html` ${this.createLpcForm(configData, schema)} `;
  }

  static get styles(): CSSResultGroup {
    return [super.styles, css``];
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'lpc-badge-content-editor': BadgeContentEditor;
  }
}

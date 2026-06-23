import { pick } from 'es-toolkit';
import { css, CSSResultGroup, TemplateResult, PropertyValues, html } from 'lit';
import { customElement, state } from 'lit/decorators.js';

import setupTranslation from '../../localize/translate';
import {
  APPEARANCE_CONFIG_KEYS,
  AppearanceBadgeConfig,
  CONTENT_CONFIG_KEYS,
  ContentBadgeConfig,
} from '../../types/config/lunar-phase-badge-config';
import { BADGE_APPEARANCE_SCHEMA, BADGE_CONTENT_SCHEMA } from '../forms/badge-appearance-schema';
import { BaseBadgeEditor } from './base-badge-editor';

@customElement('lpc-badge-content-editor')
export class BadgeContentEditor extends BaseBadgeEditor {
  constructor() {
    super();
  }
  @state() private _appearanceConfig?: AppearanceBadgeConfig;
  @state() private _contentConfig?: ContentBadgeConfig;
  protected willUpdate(_changedProperties: PropertyValues): void {
    super.willUpdate(_changedProperties);
    if (_changedProperties.has('config') && this.config) {
      this._appearanceConfig = pick(this.config, [...APPEARANCE_CONFIG_KEYS]) as AppearanceBadgeConfig;
      this._contentConfig = pick(this.config, [...CONTENT_CONFIG_KEYS]) as ContentBadgeConfig;
    }
  }

  protected render(): TemplateResult {
    const appearanceConfigData = { ...this._appearanceConfig };
    const contentData = { ...this._contentConfig };
    const customLocalize = setupTranslation(
      this.config?.language || this.hass?.selectedLanguage || this.hass.locale.language
    );
    const appearanceSchema = BADGE_APPEARANCE_SCHEMA(customLocalize);
    const contentSchema = BADGE_CONTENT_SCHEMA(customLocalize, contentData);

    return html`
      <div class="container">
        ${this.createLpcForm(appearanceConfigData, appearanceSchema)} ${this.createLpcForm(contentData, contentSchema)}
      </div>
    `;
  }

  static get styles(): CSSResultGroup {
    return [
      super.styles,
      css`
        .container {
          --ha-input-padding-bottom: 0;
          display: flex;
          flex-direction: column;
          gap: var(--ha-space-2);
        }
      `,
    ];
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'lpc-badge-content-editor': BadgeContentEditor;
  }
}

import { css, CSSResultGroup, html, LitElement, TemplateResult } from 'lit';
import { property } from 'lit/decorators.js';

import { HomeAssistant } from '../../ha';
import { fireEvent } from '../../ha';
import setupTranslation from '../../localize/translate';
import '../../shared/form-editor';
import { editorStyle } from '../../shared/css/styles';
import { LunarPhaseBadgeConfig } from '../../types/config/lunar-phase-badge-config';
import { getObjectDifferences, hasObjectDifferences, logChangedValues } from '../../utils/object-differences';

export class BaseBadgeEditor extends LitElement {
  @property({ attribute: false }) _hass!: HomeAssistant;
  @property({ attribute: false }) config!: LunarPhaseBadgeConfig;

  constructor() {
    super();
  }

  set hass(hass: HomeAssistant) {
    this._hass = hass;
  }

  get hass(): HomeAssistant {
    return this._hass;
  }

  public setConfig(config: LunarPhaseBadgeConfig): void {
    this.config = JSON.parse(JSON.stringify(config));
  }

  protected configChanged(changedConfig: Partial<LunarPhaseBadgeConfig> | undefined = undefined) {
    if (changedConfig) {
      const newConfig = { ...this.config, ...changedConfig };
      this.config = newConfig;
      fireEvent(this, 'config-changed', { config: newConfig });
    }
  }

  protected createLpcForm(data: any, schema: any, key?: string | number, subKey?: string | number): TemplateResult {
    const customLocalize = setupTranslation(
      this.config?.language || this.hass?.selectedLanguage || this.hass.locale.language
    );
    return html`<lpc-form-editor
      ._hass=${this._hass}
      .data=${data}
      .schema=${schema}
      .key=${key}
      .subKey=${subKey}
      .localize=${customLocalize}
      @value-changed=${this._onValueChanged}
    ></lpc-form-editor>`;
  }

  protected _onValueChanged(ev: CustomEvent): void {
    ev.stopPropagation();
    const currentConfig = { ...(this.config || {}) };
    if (!currentConfig || typeof currentConfig !== 'object') return;

    const value = { ...ev.detail.value };
    const { key, subKey } = ev.target as any;

    if (!hasObjectDifferences(currentConfig, { ...currentConfig, ...value })) {
      return;
    }

    let updates: Partial<LunarPhaseBadgeConfig> = {};
    if (key && subKey) {
      updates[key] = {
        ...(this.config[key] || {}),
        [subKey]: value,
      };
    } else if (key) {
      updates[key] = value;
    } else {
      updates = value;
    }
    let newConfig = {
      ...this.config,
      ...updates,
    };

    const changedValues = getObjectDifferences(this.config, newConfig);
    console.debug({ changedValues });
    if (Boolean(changedValues && Object.keys(changedValues).length > 0)) {
      logChangedValues(changedValues!);
      console.groupEnd();
      fireEvent(this, 'config-changed', { config: newConfig });
      return;
    }
  }
  static get styles(): CSSResultGroup {
    return [editorStyle, css``];
  }
}

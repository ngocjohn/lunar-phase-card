import { HomeAssistantStylesManager } from 'home-assistant-styles-manager';
import { css, CSSResultGroup, html, LitElement, TemplateResult } from 'lit';
import { property, state } from 'lit/decorators.js';

import { HomeAssistant } from '../../ha';
import { fireEvent } from '../../ha';
import { Store } from '../../model/store';
import { ConfigFieldOrder, LunarPhaseCardConfig } from '../../types/config/lunar-phase-card-config';
import { cardNeedsMigration, migrateConfig } from '../../types/utils';
import { getObjectDifferences, hasObjectDifferences, logChangedValues } from '../../utils/object-differences';
import { orderProperties } from '../../utils/order-properties';
import { editorStyle } from '../css/card-styles';
import { createEditorMenuItems, EditorArea, EditorMenuItems } from './editor-area-config';

export class BaseEditor extends LitElement {
  @property({ attribute: false }) _hass!: HomeAssistant;
  @property({ attribute: false }) config!: LunarPhaseCardConfig;
  @property({ attribute: false }) store!: Store;

  @state() private _legacyConfig?: LunarPhaseCardConfig;

  protected _stylesManager: HomeAssistantStylesManager;

  protected _editorArea?: EditorArea;

  constructor(area?: EditorArea) {
    super();
    this._stylesManager = new HomeAssistantStylesManager({
      prefix: 'lpc-editor',
      throwWarnings: true,
    });
    if (area) {
      this._editorArea = area;
    }
  }
  set hass(hass: HomeAssistant) {
    this._hass = hass;
  }

  get hass(): HomeAssistant {
    return this._hass;
  }

  get AreaMenuItems(): EditorMenuItems {
    return createEditorMenuItems(this.store!.translate);
  }

  public setConfig(config: LunarPhaseCardConfig): void {
    if (cardNeedsMigration(config)) {
      console.debug('Config needs migration. Migrating now...');
      let newConfig = migrateConfig(config);
      newConfig = orderProperties(newConfig, ConfigFieldOrder);
      fireEvent(this, 'config-changed', { config: newConfig });
      return;
    } else {
      delete this._legacyConfig;
      // console.debug('Config does not need migration.');
      this.config = JSON.parse(JSON.stringify(config));
      // console.debug('Config set to:', this.config);
    }
  }

  protected configChanged(changedConfig: Partial<LunarPhaseCardConfig> | undefined = undefined) {
    if (changedConfig) {
      let newConfig = {
        ...this.config,
        ...changedConfig,
      };
      newConfig = orderProperties(newConfig, ConfigFieldOrder);
      this.config = newConfig;
    }
    fireEvent(this, 'config-changed', { config: this.config });
    console.log('Config update fired from', this._editorArea);
    super.requestUpdate();
  }

  protected createLpcForm(data: any, schema: any, key?: string | number, subKey?: string | number): TemplateResult {
    const currentConfig = { ...(this.config || {}) };
    return html`<lpc-form-editor
      .hass=${this.hass}
      .store=${this.store}
      .data=${data}
      .schema=${schema}
      .currentConfig=${currentConfig}
      .key=${key}
      .subKey=${subKey}
      @value-changed=${this._onValueChanged}
    ></lpc-form-editor>`;
  }

  protected _onValueChanged(ev: CustomEvent): void {
    ev.stopPropagation();
    const currentConfig = { ...(this.config || {}) };
    if (!currentConfig || typeof currentConfig !== 'object') return;

    const value = { ...ev.detail.value };
    const { key, subKey } = ev.target as any;
    // console.debug('Form changes:', { key, subKey, value });
    // console.debug({ currentConfig, incoming: value });
    if (!hasObjectDifferences(currentConfig, { ...currentConfig, ...value })) {
      return;
    }

    let updates: Partial<LunarPhaseCardConfig> = {};
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
      console.group('Config change from:', this._editorArea);
      logChangedValues(changedValues!);
      console.groupEnd();
      newConfig = orderProperties(newConfig, ConfigFieldOrder);
      fireEvent(this, 'config-changed', { config: newConfig });
      return;
    }
  }

  protected createYamlEditor(
    defaultConfig: any,
    key?: string | number,
    subKey?: string | number,
    hasExtraActions = false
  ): TemplateResult {
    return html`<lpc-yaml-editor
      ._hass=${this._hass}
      .configDefault=${defaultConfig}
      .hasExtraActions=${hasExtraActions}
      .key=${key}
      .subKey=${subKey}
      @yaml-value-changed=${this._onYamlValueChanged}
      @yaml-editor-closed=${this._onYamlEditorClosed}
    ></lpc-yaml-editor>`;
  }
  protected _onYamlValueChanged(ev: CustomEvent): void {
    ev.stopPropagation();
    const { key, subKey } = ev.target as any;
    const value = ev.detail.value;
    // console.debug('YAML changes:', { key, subKey, value });
    let updates: Partial<LunarPhaseCardConfig> = {};
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
    this.configChanged(updates);
  }

  protected _onYamlEditorClosed(ev: CustomEvent): void {
    ev.stopPropagation();
    const { key, subKey } = ev.target as any;
    console.debug('YAML Editor closed:', { key, subKey });
    fireEvent(this, 'yaml-editor-closed', undefined);
  }

  static get styles(): CSSResultGroup {
    return [editorStyle, css``];
  }
}

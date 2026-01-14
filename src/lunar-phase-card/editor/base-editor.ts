import { HomeAssistantStylesManager } from 'home-assistant-styles-manager';
import { css, CSSResultGroup, html, LitElement, TemplateResult } from 'lit';
import { property, state } from 'lit/decorators.js';

import { HomeAssistant } from '../../ha';
import { fireEvent } from '../../ha';
import { Store } from '../../model/store';
import { LunarPhaseCardConfig } from '../../types/config/lunar-phase-card-config';
import { cardNeedsMigration, migrateConfig } from '../../types/utils';
import { getObjectDifferences } from '../../utils/object-differences';
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
      const newConfig = migrateConfig(config);
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
      this.config = {
        ...this.config,
        ...changedConfig,
      };
    }
    fireEvent(this, 'config-changed', { config: this.config });
    console.log('Config update fired from', this._editorArea);
    super.requestUpdate();
  }

  protected createLpcForm(data: any, schema: any, key?: string | number, subKey?: string | number): TemplateResult {
    const currentConfig = { ...(this.config || {}) };
    return html`<lpc-form-editor
      ._hass=${this._hass}
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

    // console.debug({ currentConfig, incoming: value });
    let changedValues: any = {};
    changedValues = getObjectDifferences(currentConfig, { ...currentConfig, ...value });
    const hasChanges = Boolean(changedValues && Object.keys(changedValues).length > 0);

    if (!hasChanges) {
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

    if (hasChanges) {
      console.group('Config change from:', this._editorArea);
      Object.entries(changedValues).forEach(([k, v]) => {
        const [oldValue, newValue] = v as [any, any];
        console.log(`%c${k}`, 'color: #2196F3; font-weight: bold;', oldValue, '→', newValue);
      });
      console.groupEnd();
      this.configChanged(updates);
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

import { HomeAssistantStylesManager } from 'home-assistant-styles-manager';
import { css, CSSResultGroup, html, LitElement, TemplateResult } from 'lit';
import { property, state } from 'lit/decorators.js';

import { HomeAssistant } from '../../ha';
import { fireEvent } from '../../ha';
import { hasLocation } from '../../ha/common/entity/has_location';
import { Store } from '../../model/store';
import { LunarPhaseCardConfig } from '../../types/config/lunar-phase-card-config';
import { cardNeedsMigration, migrateConfig } from '../../types/utils';
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
      console.debug('Config does not need migration.');
      this.config = JSON.parse(JSON.stringify(config));
      console.debug('Config set to:', this.config);
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
    console.debug('onValueChanged (BaseEditor)');
    ev.stopPropagation();

    const { key, subKey, currentConfig } = ev.target as any;
    const value = { ...ev.detail.value };

    if (!currentConfig || typeof currentConfig !== 'object') return;

    const updates: Partial<LunarPhaseCardConfig> = {};
    if (key && key === 'location-area') {
      // special handling for location-area
      if (value.location) {
        updates.latitude = value.location.latitude;
        updates.longitude = value.location.longitude;
        delete value.location;
      } else if (value.location_source === 'entity' && value.entity !== undefined) {
        const entityObj = this._hass.states[value.entity];
        if (hasLocation(entityObj)) {
          updates.latitude = entityObj.attributes.latitude;
          updates.longitude = entityObj.attributes.longitude;
        } else {
          // entity does not have location attribute, we cannot set location
          updates.entity = undefined;
          delete value.entity;
        }
      }
      Object.assign(updates, value);
      if (Object.keys(updates).length > 0) {
        console.debug('Location-area updates to apply:', updates);
        this.configChanged(updates);
      }
      return;
    } else if (key && subKey) {
      if (typeof currentConfig[key] === 'object' && currentConfig[key] === null) {
        currentConfig[key] = {};
      }
      currentConfig[key][subKey] = value;
      updates[key] = currentConfig[key];
    } else if (key) {
      updates[key] = value;
    } else {
      Object.assign(updates, value);
    }

    console.debug('updates to apply:', updates);
    if (Object.keys(updates).length > 0) {
      this.configChanged(updates);
    }
    return;
  }

  static get styles(): CSSResultGroup {
    return [editorStyle, css``];
  }
}

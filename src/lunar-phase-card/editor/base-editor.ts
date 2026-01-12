import { css, CSSResultGroup, LitElement } from 'lit';
import { property, state } from 'lit/decorators.js';

import { HomeAssistant } from '../../ha';
import { fireEvent } from '../../ha';
import { Store } from '../../model/store';
import { LunarPhaseCardConfig } from '../../types/config/lunar-phase-card-config';
import { cardNeedsMigration, migrateConfig } from '../../types/utils';
import { editorStyle } from '../css/card-styles';
import { createEditorMenuItems, EditorArea, EditorMenuItems } from './const';

export class BaseEditor extends LitElement {
  @property({ attribute: false }) _hass!: HomeAssistant;
  @property({ attribute: false }) config!: LunarPhaseCardConfig;
  @property({ attribute: false }) store!: Store;

  @state() private _legacyConfig?: LunarPhaseCardConfig;

  protected _editorArea?: EditorArea;

  constructor(area?: EditorArea) {
    super();
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

  protected configChanged(changedConfig: LunarPhaseCardConfig | undefined = undefined) {
    if (changedConfig) {
      this.config = {
        ...this.config,
        ...changedConfig,
      };
    }
    fireEvent(this, 'config-changed', { config: this.config });

    super.requestUpdate();
  }

  static get styles(): CSSResultGroup {
    return [editorStyle, css``];
  }
}

import { css, LitElement } from 'lit';
import { property, state } from 'lit/decorators.js';

import { HomeAssistant } from '../../ha';
import { fireEvent } from '../../ha';
import { Store } from '../../model/store';
import { LunarPhaseCardConfig } from '../../types/config/lunar-phase-card-config';
import { cardNeedsMigration, migrateConfig } from '../../types/utils';

export abstract class BaseEditor extends LitElement {
  @property({ attribute: false }) hass!: HomeAssistant;
  @property({ attribute: false }) config!: LunarPhaseCardConfig;
  @property({ attribute: false }) store!: Store;

  @state() private _legacyConfig?: LunarPhaseCardConfig;

  constructor() {
    super();
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

  public createStore(): void {
    if (this.store) {
      return;
    }
    console.debug('Create store for editor');
    this.store = new Store(this.hass, this.config, this);
  }

  static get styles() {
    return css``;
  }
}

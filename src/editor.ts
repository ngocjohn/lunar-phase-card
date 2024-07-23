import { LitElement, html, TemplateResult, css, CSSResultGroup } from 'lit';
import { customElement, property, state } from 'lit/decorators';

// Custom card helpers
import { fireEvent, LovelaceCardEditor } from 'custom-card-helpers';

import { HomeAssistantExtended as HomeAssistant, LunarPhaseCardConfig } from './types';
import { CARD_VERSION } from './const';

@customElement('lunar-phase-card-editor')
export class LunarPhaseCardEditor extends LitElement implements LovelaceCardEditor {
  @property({ attribute: false }) public hass!: HomeAssistant;

  @state() private _config?: LunarPhaseCardConfig;

  public setConfig(config: LunarPhaseCardConfig): void {
    this._config = config;
    if (this._config.entity) {
      this._config.use_default = false;
    }
  }

  get _entity(): string {
    return this._config?.entity || '';
  }

  get _use_default(): boolean {
    return this._config?.use_default || true;
  }

  get _show_background(): boolean {
    return this._config?.show_background || false;
  }

  get _compact_view(): boolean {
    return this._config?.compact_view || false;
  }

  protected render(): TemplateResult {
    if (!this.hass) {
      return html``;
    }
    const entities = Object.keys(this.hass.states)
      .filter((entity) => entity.startsWith('sensor') && entity.endsWith('_moon_phase'))
      .sort();

    return html`
      <div class="card-config">
        <ha-select
          naturalMenuWidth
          fixedMenuPosition
          label="Entity (optional)"
          .configValue=${'entity'}
          .value=${this._entity}
          @selected=${this._valueChanged}
          @closed=${(ev) => ev.stopPropagation()}
        >
          <mwc-list-item value=""></mwc-list-item>
          ${entities.map((entity) => {
            return html`<mwc-list-item .value=${entity}>${entity}</mwc-list-item>`;
          })}
        </ha-select>
        ${this.renderCustomLatLon()} ${this.renderSwitches()}
      </div>
      <div class="version">Version: ${CARD_VERSION}</div>
    `;
  }

  private renderSwitches(): TemplateResult {
    return html`
      <div class="switches">
        <ha-formfield .label=${`Compact view`}>
          <ha-switch
            .checked=${this._compact_view !== false}
            .configValue=${'compact_view'}
            @change=${this._valueChanged}
          ></ha-switch>
        </ha-formfield>
        <ha-formfield .label=${`Default latitude & longitude`}>
          <ha-switch
            .disabled=${this._config?.entity !== undefined}
            .checked=${this._use_default !== false}
            .configValue=${'use_default'}
            @change=${this._valueChanged}
          ></ha-switch>
        </ha-formfield>
        <ha-formfield .label=${`Show background`}>
          <ha-switch
            .checked=${this._show_background !== false}
            .configValue=${'show_background'}
            @change=${this._valueChanged}
          ></ha-switch>
        </ha-formfield>
      </div>
    `;
  }

  private renderCustomLatLon(): TemplateResult {
    const content = html`
      <ha-textfield
        .label=${'Latitude'}
        .configValue=${'latitude'}
        .value=${this._config?.latitude || ''}
        @value-changed=${this._valueChanged}
      ></ha-textfield>
      <ha-textfield
        .label=${'Longitude'}
        .configValue=${'longitude'}
        .value=${this._config?.longitude || ''}
        @value-changed=${this._valueChanged}
      ></ha-textfield>
    `;
    return this.panelTemplate('Latitude & Longitude', 'Set custom latitude and longitude', 'mdi:map-marker', content);
  }

  private panelTemplate(title: string, secondary: string, icon: string, content: TemplateResult): TemplateResult {
    return html`
      <div class="panel-container">
        <ha-expansion-panel .expanded=${false} .outlined=${true} .header=${title} .secondary=${secondary} leftChevron>
          <div class="right-icon" slot="icons">
            <ha-icon icon=${icon}></ha-icon>
          </div>
          <div class="card-config">${content}</div>
        </ha-expansion-panel>
      </div>
    `;
  }
  private _valueChanged(ev): void {
    if (!this._config || !this.hass) {
      return;
    }
    const target = ev.target;
    if (this[`_${target.configValue}`] === target.value) {
      return;
    }
    if (target.configValue) {
      if (target.value === '') {
        const tmpConfig = { ...this._config };
        delete tmpConfig[target.configValue];
        this._config = tmpConfig;
      } else {
        this._config = {
          ...this._config,
          [target.configValue]: target.checked !== undefined ? target.checked : target.value,
        };
      }
    }
    fireEvent(this, 'config-changed', { config: this._config });
  }
  static styles: CSSResultGroup = css`
    .card-config {
      width: 100%;
      margin-block: 0.5rem;
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .switches {
      margin: 0.5rem;
      display: grid;
      grid-template-columns: 1fr 1fr;
      grid-gap: 1rem;
    }
    ha-select {
      --mdc-menu-max-height: 200px;
    }
    ha-select,
    ha-textfield {
      margin-bottom: 16px;
      display: block;
      width: 100%;
    }
    ha-formfield {
      padding-bottom: 8px;
      width: 100%;
    }
    ha-switch {
      --mdc-theme-secondary: var(--switch-checked-color);
    }

    ha-expansion-panel .container {
      padding: 0px 1rem !important;
    }
    .right-icon {
      padding-inline: 0.5rem;
    }
    .version {
      margin-top: 1rem;
      color: var(--secondary-text-color);
      text-align: start;
    }
  `;
}

declare global {
  interface HTMLElementTagNameMap {
    'lunar-phase-card-editor': LunarPhaseCardEditor;
  }
}

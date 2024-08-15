/* eslint-disable @typescript-eslint/no-explicit-any */
import { LitElement, html, TemplateResult, css, CSSResultGroup, PropertyValues } from 'lit';
import { customElement, property, state } from 'lit/decorators';

// Custom card helpers
import { fireEvent, LovelaceCardEditor } from 'custom-card-helpers';

import { HomeAssistantExtended as HomeAssistant, LunarPhaseCardConfig } from './types';
import { languageOptions, localize } from './localize/localize';
import { loadHaComponents } from './utils/loader';
import { CARD_VERSION } from './const';

@customElement('lunar-phase-card-editor')
export class LunarPhaseCardEditor extends LitElement implements LovelaceCardEditor {
  @property({ attribute: false }) public hass!: HomeAssistant;

  @state() private _config?: LunarPhaseCardConfig;
  @property({ type: String }) selectedOption: string = 'url';

  public setConfig(config: LunarPhaseCardConfig): void {
    this._config = config;
  }

  private get selectedLanguage(): string {
    return this._config?.selected_language || localStorage.getItem('selectedLanguage') || 'en';
  }
  private localize = (string: string, search = '', replace = ''): string => {
    return localize(string, this.selectedLanguage, search, replace);
  };

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

  get _latitude(): number {
    return this._config?.latitude || 0;
  }

  get _longitude(): number {
    return this._config?.longitude || 0;
  }

  get _custom_background(): string {
    return this._config?.custom_background || '';
  }

  connectedCallback() {
    super.connectedCallback();
    void loadHaComponents();
  }
  disconnectedCallback(): void {
    super.disconnectedCallback();
  }

  protected shouldUpdate(changedProps: PropertyValues): boolean {
    if (!this._config || !this.hass) {
      return false;
    }
    return super.shouldUpdate(changedProps);
  }

  protected render(): TemplateResult {
    if (!this.hass) {
      return html``;
    }
    const entities = Object.keys(this.hass.states)
      .filter(
        (entity) =>
          entity.startsWith('sensor') && entity.endsWith('_moon_phase') && !entity.endsWith('_next_moon_phase'),
      )
      .sort();

    return html`
      <div class="card-config">
        <ha-entity-picker
          .hass=${this.hass}
          .value=${this._entity}
          .required=${false}
          .configValue=${'entity'}
          @value-changed=${this._valueChanged}
          allow-custom-entity
          .includeEntities=${entities}
        ></ha-entity-picker>

        ${this.renderImageUpload()} ${this.renderCustomLatLon()} ${this.renderSwitches()}
      </div>
      <div class="version">Version: ${CARD_VERSION}</div>
    `;
  }

  private renderImageUpload(): TemplateResult {
    const sysLang = localStorage.getItem('selectedLanguage') || 'en';
    const langOpts = [
      { key: sysLang, name: 'System', nativeName: 'System' },
      ...languageOptions.sort((a, b) => a.name.localeCompare(b.name)),
    ];

    const languageSelect = html`
      <ha-select
        .label=${this.hass.localize('ui.panel.profile.language.dropdown_label') || 'Language'}
        .value=${this.selectedLanguage}
        .configValue=${'selected_language'}
        @selected=${this._valueChanged}
        @closed=${(ev: Event) => ev.stopPropagation()}
      >
        ${langOpts.map(
          (lang) =>
            html`<mwc-list-item value=${lang.key}>${lang.nativeName ? lang.nativeName : lang.name}</mwc-list-item> `,
        )}
      </ha-select>
    `;

    const textFormInput = html`
      <div class="custom-background-wrapper">
        <ha-textfield
          .label=${'Custom Background'}
          .configValue=${'custom_background'}
          .value=${this._custom_background}
          @input=${this._valueChanged}
        ></ha-textfield>
        ${!this._custom_background
          ? html`
              <label for="file-upload" class="file-upload">
                Choose file<input
                  type="file"
                  id="file-upload"
                  class="file-input"
                  @change=${this._handleFilePicked.bind(this)}
                  accept="image/*"
                />
              </label>
            `
          : html`
              <div class="right-icon">
                <ha-icon icon="mdi:delete" @click=${this.handleRemoveBackground}></ha-icon>
              </div>
            `}
      </div>
    `;
    const content = html` ${languageSelect} ${textFormInput} `;
    return this.panelTemplate('background', 'background', 'mdi:image', content);
  }

  private async _handleFilePicked(ev: Event): Promise<void> {
    const input = ev.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) {
      return;
    }

    const file = input.files[0];
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/image/upload', {
        method: 'POST',
        body: formData,
        headers: {
          Authorization: `Bearer ${this.hass.auth.data.access_token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to upload image');
      }

      const data = await response.json();
      console.log('Upload response:', data); // Debugging line to check the response structure
      const imageId = data.id; // Adjust this line to match the correct field in the response

      if (!imageId) {
        console.error('Response structure:', data); // Log the response structure for debugging
        throw new Error('Image ID is missing in the response');
      }

      const imageUrl = `/api/image/serve/${imageId}/original`;
      console.log('Uploaded image URL:', imageUrl);

      // Add the new image URL to the list of image links
      if (this._config) {
        this._config = { ...this._config, custom_background: imageUrl };
        fireEvent(this, 'config-changed', { config: this._config });
        this.requestUpdate();
      }
    } catch (error) {
      console.error('Error uploading image:', error);
    }
  }

  private handleRemoveBackground(): void {
    if (this._config) {
      this._config = { ...this._config, custom_background: undefined };
      fireEvent(this, 'config-changed', { config: this._config });
      this.requestUpdate();
    }
  }

  private renderSwitches(): TemplateResult {
    const defaultDisabled = this._config?.entity || (this._config?.latitude && this._config?.longitude) ? true : false;
    return html`
      <div class="switches">
        <ha-formfield .label=${this.localize('editor.compactView')}>
          <ha-switch
            .checked=${this._compact_view}
            .configValue=${'compact_view'}
            @change=${this._valueChanged}
          ></ha-switch>
        </ha-formfield>
        <ha-formfield .label=${this.localize('editor.defaultLatLong')}>
          <ha-switch
            .disabled=${defaultDisabled}
            .checked=${this._use_default}
            .configValue=${'use_default'}
            @change=${this._valueChanged}
          ></ha-switch>
        </ha-formfield>
        <ha-formfield .label=${this.localize('editor.showBackground')}>
          <ha-switch
            .checked=${this._show_background}
            .configValue=${'show_background'}
            @change=${this._valueChanged}
          ></ha-switch>
        </ha-formfield>
      </div>
    `;
  }

  private renderCustomLatLon(): TemplateResult {
    const disabled = this._config?.entity ? true : false;
    const note = "If entity is set, latitude and longitude won't be used.";
    const content = html`
      <ha-alert alert-type="info">${note}</ha-alert>
      <ha-textfield
        .disabled=${disabled}
        .label=${'Latitude'}
        .configValue=${'latitude'}
        .value=${this._config?.latitude || ''}
        @input=${this._valueChanged}
      ></ha-textfield>
      <ha-textfield
        .disabled=${disabled}
        .label=${'Longitude'}
        .configValue=${'longitude'}
        .value=${this._config?.longitude || ''}
        @input=${this._valueChanged}
      ></ha-textfield>
    `;
    return this.panelTemplate('customLatLong', 'customLatLong', 'mdi:map-marker', content);
  }

  private panelTemplate(title: string, secondary: string, icon: string, content: TemplateResult): TemplateResult {
    const localTitle = this.localize(`editor.${title}.title`);
    const localDesc = this.localize(`editor.${secondary}.description`);
    return html`
      <div class="panel-container">
        <ha-expansion-panel .expanded=${false} .outlined=${true} .header=${localTitle} .secondary=${localDesc}>
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
    const configValue = target.configValue;

    if (this[`_${configValue}`] === target.value) {
      return;
    }

    let newValue: any;

    if (['latitude', 'longitude'].includes(configValue)) {
      newValue = Number(target.value);
      this._config = {
        ...this._config,
        [configValue]: newValue,
      };
    } else if (newValue && newValue.length === 0) {
      // Check for an empty array
      const tmpConfig = { ...this._config };
      delete tmpConfig[configValue];
      this._config = tmpConfig;
    } else {
      newValue = target.checked !== undefined ? target.checked : target.value;
      this._config = {
        ...this._config,
        [configValue]: newValue,
      };
    }

    if (newValue && newValue.length === 0) {
      // Check for an empty array
      const tmpConfig = { ...this._config };
      delete tmpConfig[configValue];
      this._config = tmpConfig;
    }
    console.log('value changed', this._config);
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
      cursor: pointer;
    }
    .custom-background-wrapper {
      display: inline-flex;
      align-items: center;
      gap: 1rem;
      text-wrap: nowrap;
    }
    .file-input {
      display: none;
    }
    .file-upload {
      cursor: pointer;
      display: inline-block;
      padding: 0.5rem 1rem;
      border: 1px solid var(--divider-color);
      border-radius: 8px;
      color: var(--primary-text-color);
    }
    .file-upload:hover {
      background-color: var(--primary-color);
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

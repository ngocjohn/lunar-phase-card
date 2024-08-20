/* eslint-disable @typescript-eslint/no-explicit-any */
import { LitElement, html, TemplateResult, css, CSSResultGroup, PropertyValues } from 'lit';
import { customElement, property, state } from 'lit/decorators';

// Custom card helpers
import { fireEvent, LovelaceCardEditor } from 'custom-card-helpers';

import { HomeAssistantExtended as HomeAssistant, LunarPhaseCardConfig } from './types';

import { languageOptions, localize } from './localize/localize';
import { loadHaComponents, fetchLatestReleaseTag } from './utils/loader';
import { compareVersions } from './utils/helpers';

import { CARD_VERSION } from './const';
import editorcss from './css/editor.css';

@customElement('lunar-phase-card-editor')
export class LunarPhaseCardEditor extends LitElement implements LovelaceCardEditor {
  @property({ attribute: false }) public hass!: HomeAssistant;

  @state() private _config?: LunarPhaseCardConfig;
  @property({ type: String }) selectedOption: string = 'url';

  @state() private _newLatitude: number | string = '';
  @state() private _newLongitude: number | string = '';
  @state() private _latestRelease = '';

  private _systemLanguage = this.hass?.language;

  public setConfig(config: LunarPhaseCardConfig): void {
    this._config = config;
  }

  protected firstUpdated(changedProps: PropertyValues): void {
    super.firstUpdated(changedProps);

    if (this._compareVersions() !== 0) {
      const toast = this.shadowRoot?.getElementById('toast') as HTMLElement;
      const version = this.shadowRoot?.querySelector('.version') as HTMLElement;
      version.style.visibility = 'hidden';
      toast.classList.add('show');
    }
  }

  private get selectedLanguage(): string {
    return this._config?.selected_language || 'en';
  }

  private localize = (string: string, search = '', replace = ''): string => {
    return localize(string, this.selectedLanguage, search, replace);
  };

  get _show_background(): boolean {
    return this._config?.show_background || false;
  }

  get _compact_view(): boolean {
    return this._config?.compact_view || false;
  }

  get _custom_background(): string {
    return this._config?.custom_background || '';
  }

  connectedCallback() {
    super.connectedCallback();
    void loadHaComponents();
    void fetchLatestReleaseTag().then((releaseTag) => {
      this._latestRelease = releaseTag;
    });
    if (process.env.ROLLUP_WATCH === 'true') {
      window.LunarEditor = this;
    }
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
  }

  protected render(): TemplateResult {
    if (!this.hass) {
      return html``;
    }

    return html`
      ${this._renderToast()}
      <div class="card-config">${this._renderBaseConfigSelector()} ${this.renderViewConfiguration()}</div>
      <div class="version">
        <span
          >${CARD_VERSION === this._latestRelease
            ? CARD_VERSION
            : html`version: ${CARD_VERSION} -> <span class="update">${this._latestRelease}</span>`}</span
        >
      </div>
    `;
  }

  private _handleRadioChange(ev): void {
    if (!this._config || !this.hass) {
      return;
    }
    const target = ev.target;
    const configValue = target.value;

    if (this._config[configValue] === true) {
      return;
    }

    const updates: Partial<LunarPhaseCardConfig> = {};
    const radiosOptions = this._getBaseConfigSelector().options.map((item) => item.key);
    radiosOptions.forEach((item) => {
      if (item === configValue) {
        updates[item] = true;
      } else {
        updates[item] = false;
      }
    });

    if (configValue === 'use_custom') {
      updates.entity = '';
    }
    if (configValue === 'use_entity') {
      this._newLatitude = '';
      this._newLongitude = '';
    }

    if (configValue === 'use_default') {
      updates.entity = '';
      updates.latitude = this.hass.config.latitude;
      updates.longitude = this.hass.config.longitude;
    }

    if (Object.keys(updates).length > 0) {
      this._config = { ...this._config, ...updates };
      console.log('updates', updates);
      fireEvent(this, 'config-changed', { config: this._config });
    }
  }

  private _renderBaseConfigSelector(): TemplateResult {
    const radiosOptions = this._getBaseConfigSelector().options;

    const radios = radiosOptions.map((item) => {
      return html`
        <ha-formfield .label=${item.label}>
          <ha-radio
            .checked=${this._config ? this._config[item.key] : false}
            .value=${item.key}
            @change=${this._handleRadioChange}
          ></ha-radio>
        </ha-formfield>
      `;
    });

    const customLatLongForms = html`
      <ha-textfield
        .label=${this.localize('editor.placeHolder.latitude')}
        .configValue=${'latitude'}
        .value=${this._newLatitude}
        @input=${this._customLatLongChanged}
      ></ha-textfield>
      <ha-textfield
        .label=${this.localize('editor.placeHolder.longitude')}
        .configValue=${'longitude'}
        .value=${this._newLongitude}
        @input=${this._customLatLongChanged}
      ></ha-textfield>
    `;

    const contentWrapp = html`
      <div class="radios-btn">${radios}</div>
      <div class="base-config-selector">
        ${this._config?.use_default ? this._renderUseDefault() : ''}
        ${this._config?.use_custom ? customLatLongForms : ''}
        ${this._config?.use_entity ? this._renderEntityPicker() : ''}
      </div>
    `;
    return this.panelTemplate('baseConfig', 'baseConfig', 'mdi:cog', contentWrapp);
  }

  private _renderUseDefault(): TemplateResult {
    const latitude = this._config?.latitude || this.hass.config.latitude;
    const longitude = this._config?.longitude || this.hass.config.longitude;
    const content = html`
      <ha-textfield .disabled=${true} .label=${'Latitude'} .configValue=${'latitude'} .value=${latitude}></ha-textfield>
      <ha-textfield
        .disabled=${true}
        .label=${'Longitude'}
        .configValue=${'longitude'}
        .value=${longitude}
      ></ha-textfield>
    `;
    return content;
  }

  private _renderEntityPicker(): TemplateResult {
    const entities = Object.keys(this.hass.states)
      .filter((entity) => entity.startsWith('sensor') && entity.endsWith('_moon_phase'))
      .filter((entity) => entity.startsWith('sensor') && !entity.endsWith('next_moon_phase'))
      .sort();
    const entityPicker = html`
      <ha-entity-picker
        .hass=${this.hass}
        .value=${this._config?.entity}
        .configValue=${'entity'}
        @value-changed=${this._entityChanged}
        .label=${'Entity'}
        .required=${false}
        .includeEntities=${entities}
        allow-custom-entity
      ></ha-entity-picker>
    `;
    const entitySelected = this._config?.entity ? true : false;
    const entityLatLong = this._getEntityLatLong();
    const entityContent = entityLatLong.map((item) => {
      return html` <ha-textfield .disabled=${true} .label=${item.label} .value=${item.value}></ha-textfield> `;
    });

    const content = html` ${entityPicker} ${entitySelected ? entityContent : ''} `;
    return content;
  }

  private _getEntityLatLong(): { label: string; value: number | string }[] {
    if (!this._config?.entity) {
      return [];
    }

    const entity = this.hass.states[this._config.entity];
    if (!entity || !entity.attributes) {
      return [];
    }

    return [
      {
        label: 'City',
        value: entity.attributes.location.name,
      },
      {
        label: 'Latitude',
        value: entity.attributes.location.latitude,
      },
      {
        label: 'Longitude',
        value: entity.attributes.location.longitude,
      },
    ];
  }

  private renderViewConfiguration(): TemplateResult {
    const langOpts = [...languageOptions.sort((a, b) => a.name.localeCompare(b.name))];

    const viewOptions = html`
      <div class="switches">
        <ha-formfield .label=${this.localize('editor.compactView')}>
          <ha-checkbox
            .checked=${this._compact_view}
            .configValue=${'compact_view'}
            @change=${this._valueChanged}
          ></ha-checkbox>
        </ha-formfield>
        <ha-formfield .label=${this.localize('editor.showBackground')}>
          <ha-checkbox
            .checked=${this._show_background}
            .configValue=${'show_background'}
            @change=${this._valueChanged}
          ></ha-checkbox>
        </ha-formfield>
        <ha-formfield .label=${this.localize('editor.timeFormat')}>
          <ha-checkbox
            .checked=${this._config?.['12hr_format'] !== false}
            .configValue=${'12hr_format'}
            @change=${this._valueChanged}
          ></ha-checkbox>
      </div>
    `;
    const languageSelect = html`
      <ha-select
        .label=${this.localize('editor.placeHolder.language')}
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
          .label=${this.localize('editor.placeHolder.customBackground')}
          .configValue=${'custom_background'}
          .value=${this._custom_background}
          @input=${this._valueChanged}
        ></ha-textfield>
        ${!this._custom_background
          ? html`
              <ha-button @click=${() => this.shadowRoot?.getElementById('file-upload-new')?.click()}>
                Upload
              </ha-button>
              <input
                type="file"
                id="file-upload-new"
                class="file-input"
                @change=${this._handleFilePicked.bind(this)}
                accept="image/*"
              />
            `
          : html`
              <div class="right-icon">
                <ha-icon icon="mdi:delete" @click=${this.handleRemoveBackground}></ha-icon>
              </div>
            `}
      </div>
    `;
    const content = html` ${viewOptions} ${languageSelect} ${textFormInput} `;
    return this.panelTemplate('viewConfig', 'viewConfig', 'mdi:image', content);
  }

  private panelTemplate(title: string, secondary: string, icon: string, content: TemplateResult): TemplateResult {
    const localTitle = this.localize(`editor.${title}.title`);
    const localDesc = this.localize(`editor.${secondary}.description`);
    return html`
      <div class="panel-container">
        <ha-expansion-panel .expanded=${true} .outlined=${true} .header=${localTitle} .secondary=${localDesc}>
          <div class="right-icon" slot="icons">
            <ha-icon icon=${icon}></ha-icon>
          </div>
          <div class="card-config">${content}</div>
        </ha-expansion-panel>
      </div>
    `;
  }

  private _renderToast(): TemplateResult {
    const compareVersionsResult = this._compareVersions();
    if (compareVersionsResult === 0) {
      return html``;
    }

    const content = {
      '-1': {
        title: 'New version available',
        icon: '🎉',
      },
      1: {
        title: 'You are using a beta version',
        icon: '🚨',
      },
    };

    return html`
      <div id="toast">
        <ha-alert
          alert-type="info"
          title="${content[compareVersionsResult].title}"
          dismissable="true"
          @alert-dismissed-clicked=${this._handleAlertDismissed}
        >
          <span class="alert-icon" slot="icon">${content[compareVersionsResult].icon}</span>
          <span class="content">Latest: ${this._latestRelease}</span>
        </ha-alert>
      </div>
    `;
  }

  private _handleAlertDismissed(): void {
    const toast = this.shadowRoot?.getElementById('toast') as HTMLElement;
    const version = this.shadowRoot?.querySelector('.version') as HTMLElement;
    if (toast) {
      toast.classList.remove('show');
      version.style.visibility = 'visible';
    }
  }

  private _compareVersions() {
    return compareVersions(CARD_VERSION, this._latestRelease);
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

  private _getBaseConfigSelector(): any {
    return {
      options: [
        {
          key: 'use_default',
          label: this.localize('editor.optionsConfig.useDefault'),
        },
        {
          key: 'use_custom',
          label: this.localize('editor.optionsConfig.useCustom'),
        },
        {
          key: 'use_entity',
          label: this.localize('editor.optionsConfig.useEntity'),
        },
      ],
    };
  }

  private _entityChanged(ev): void {
    if (!this._config || !this.hass) {
      return;
    }
    const entity = ev.detail.value;
    if (this._config.entity === entity) {
      return;
    }
    const location = this.hass.states[entity].attributes.location;
    const latitude = location.latitude;
    const longitude = location.longitude;

    const updates: Partial<LunarPhaseCardConfig> = { entity, latitude, longitude };
    this._config = { ...this._config, ...updates };
    fireEvent(this, 'config-changed', { config: this._config });
  }

  private _customLatLongChanged(ev): void {
    if (!this._config || !this.hass) {
      return;
    }
    const target = ev.target;
    const configValue = target.configValue;

    if (this[`${configValue}`] === target.value) {
      return;
    }

    if (configValue === 'latitude') {
      this._newLatitude = target.value;
    }
    if (configValue === 'longitude') {
      this._newLongitude = target.value;
    }

    this._config = {
      ...this._config,
      [configValue]: parseFloat(target.value),
    };
    console.log(configValue, target.value);
    fireEvent(this, 'config-changed', { config: this._config });
  }

  private _valueChanged(ev): void {
    if (!this._config || !this.hass) {
      return;
    }
    const target = ev.target;
    const configValue = target.configValue;

    if (this[`${configValue}`] === target.value) {
      return;
    }

    let newValue: any;

    if (['custom_latitude', 'custom_longitude'].includes(configValue)) {
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
    fireEvent(this, 'config-changed', { config: this._config });
  }

  static get styles(): CSSResultGroup {
    return css`
      ${editorcss}
    `;
  }
}

declare global {
  interface Window {
    LunarEditor: LunarPhaseCardEditor;
  }

  interface HTMLElementTagNameMap {
    'lunar-phase-card-editor': LunarPhaseCardEditor;
  }
}

/* eslint-disable @typescript-eslint/no-explicit-any */
import { LitElement, html, TemplateResult, css, CSSResultGroup, PropertyValues } from 'lit';
import { customElement, property, state } from 'lit/decorators';

// Custom card helpers
import { fireEvent, LovelaceCardEditor } from 'custom-card-helpers';

import { HomeAssistantExtended as HomeAssistant, LunarPhaseCardConfig, FontCustomStyles, defaultConfig } from './types';

import { languageOptions, localize } from './localize/localize';
import { loadHaComponents, fetchLatestReleaseTag } from './utils/loader';
import { compareVersions } from './utils/helpers';
import { deepMerge, InitializeDefaultConfig } from './utils/ha-helper';

import { CARD_VERSION, FONTCOLORS, FONTSTYLES, FONTSIZES } from './const';
import editorcss from './css/editor.css';

@customElement('lunar-phase-card-editor')
export class LunarPhaseCardEditor extends LitElement implements LovelaceCardEditor {
  @property({ attribute: false }) public hass!: HomeAssistant;

  @state() private _config!: LunarPhaseCardConfig;
  @state() private _latestRelease = '';

  private _systemLanguage = this.hass?.language;

  public async setConfig(config: LunarPhaseCardConfig): Promise<void> {
    this._config = this._config ? config : deepMerge(InitializeDefaultConfig(), config);
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

  /* --------------------------------- RENDERS -------------------------------- */

  protected render(): TemplateResult {
    if (!this.hass) {
      return html``;
    }

    return html`
      ${this._renderToast()}
      <div class="card-config">${this._renderBaseConfigSelector()} ${this._renderViewConfiguration()}
      ${this._renderFontConfiguration()}</div>
      </div>
      <div class="version">
        <span
          >${
            CARD_VERSION === this._latestRelease
              ? CARD_VERSION
              : html`version: ${CARD_VERSION} -> <span class="update">${this._latestRelease}</span>`
          }</span
        >
      </div>
    `;
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

    const contentWrapp = html`
      <div class="radios-btn">${radios}</div>
      <div class="base-config-selector">
        ${this._config?.use_default
          ? this._renderUseDefault()
          : this._config?.use_custom
            ? this._renderCustomLatLong()
            : this._config?.use_entity
              ? this._renderEntityPicker()
              : ''}
      </div>
    `;

    return this.panelTemplate('baseConfig', 'baseConfig', 'mdi:cog', contentWrapp, true);
  }

  private _renderUseDefault(): TemplateResult {
    const latLong = [
      { label: 'Latitude', value: this._config?.latitude },
      { label: 'Longitude', value: this._config?.longitude },
    ];

    return html`<div class="font-config-content">
      ${latLong.map((item) => {
        return html` <ha-textfield .disabled=${true} .label=${item.label} .value=${item.value}></ha-textfield> `;
      })}
    </div> `;
  }

  private _renderCustomLatLong(): TemplateResult {
    const latLong = [
      { label: this.localize('editor.placeHolder.latitude'), configKey: 'latitude' },
      { label: this.localize('editor.placeHolder.longitude'), configKey: 'longitude' },
    ];

    return html`<div class="font-config-content">
      ${latLong.map((item) => {
        return html`
          <ha-textfield
            .label=${item.label}
            .configValue=${item.configKey}
            .value=${this._config?.[item.configKey] || ''}
            @change=${this._handleValueChange}
          ></ha-textfield>
        `;
      })}
    </div> `;
  }

  private _renderEntityPicker(): TemplateResult {
    // Filter entities with moon_phase
    const entities = Object.keys(this.hass.states)
      .filter((entity) => entity.startsWith('sensor') && entity.endsWith('_moon_phase'))
      .filter((entity) => entity.startsWith('sensor') && !entity.endsWith('next_moon_phase'));

    // Filter entities with latitude and longitude
    const entitiesWithLatLong = Object.keys(this.hass.states).filter(
      (entity) => this.hass.states[entity].attributes.latitude && this.hass.states[entity].attributes.longitude,
    );

    const combinedEntities = [...entities, 'separator', ...entitiesWithLatLong];

    const entityPicker = html`
      <ha-entity-picker
        .hass=${this.hass}
        .value=${this._config?.entity}
        .configValue=${'entity'}
        @value-changed=${this._entityChanged}
        .label=${'Entity'}
        .required=${false}
        .includeEntities=${combinedEntities}
        allow-custom-entity
      ></ha-entity-picker>
    `;

    const entitySelected = this._config?.entity ? true : false;
    const entityLatLong = this._getEntityLatLong();

    const entityContent = html` <div class="font-config-content">
      ${entityLatLong.map((item) => {
        return html` <ha-textfield .disabled=${true} .label=${item.label} .value=${item.value}></ha-textfield> `;
      })}
    </div>`;

    const content = html` ${entityPicker} ${entitySelected ? entityContent : ''} `;

    return content;
  }

  private _renderViewConfiguration(): TemplateResult {
    const langOpts = [...languageOptions.sort((a, b) => a.name.localeCompare(b.name))];
    // Map langOpts to the format expected by _haComboBox
    const itemsLang = langOpts.map((lang) => ({
      value: lang.key,
      label: `${lang.name} (${lang.nativeName})`,
    }));

    const viewItemMap = [
      { label: 'compactView', configValue: 'compact_view' },
      { label: 'showBackground', configValue: 'show_background' },
      { label: 'timeFormat', configValue: '12hr_format' },
    ];

    const viewOptions = html`
      <div class="switches">
        ${viewItemMap.map((item) => this._tempCheckBox(item.label, item.configValue, item.configValue))}
      </div>
    `;

    // Create the ha-combo-box using the _haComboBox method
    const langComboBox = html`
      ${this._haComboBox(
        itemsLang, // Passing the mapped language options
        'placeHolder.language', // Localization key for the label
        this._config?.selected_language || this._systemLanguage, // Currently selected language
        'selected_language', // Config value key
        false, // Allow custom value
      )}
    `;

    const textFormInput = html`
      <div class="custom-background-wrapper">
        <ha-textfield
          .label=${this.localize('editor.placeHolder.customBackground')}
          .configValue=${'custom_background'}
          .value=${this._config?.custom_background || ''}
          @change=${this._handleValueChange}
        ></ha-textfield>
        ${!this._config?.custom_background
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
    const content = html` ${viewOptions} ${langComboBox} ${textFormInput} `;
    return this.panelTemplate('viewConfig', 'viewConfig', 'mdi:image', content);
  }

  private _renderFontConfiguration(): TemplateResult {
    const _fontPrefix = 'fontOptions';

    // Helper function for localization
    const localizeKey = (key: string) => this.localize(`editor.${_fontPrefix}.${key}`);

    const createFontConfigRow = (prefix: 'header' | 'label') => {
      // Function to generate the ha-combo-box elements
      const createComboBox = (type: 'size' | 'style' | 'color', allowCustomValue = true) => {
        const configKey = `${prefix}_font_${type}`;

        // Ensure font_customize is defined, fallback to defaults if undefined
        const fontCustomize = this._config?.font_customize ?? defaultConfig.font_customize;

        const items =
          type === 'color'
            ? FONTCOLORS.map((color) => ({ value: color, label: color }))
            : type === 'size'
              ? FONTSIZES.map((size) => ({ value: size, label: size }))
              : FONTSTYLES.map((style) => ({ value: style, label: style }));

        return this._haComboBox(
          items,
          `${_fontPrefix}.${prefix}Font${type.charAt(0).toUpperCase() + type.slice(1)}`,
          fontCustomize[configKey] || (type === 'size' ? 'auto' : type === 'style' ? 'none' : ''),
          configKey,
          allowCustomValue,
        );
      };

      return html` ${createComboBox('size')} ${createComboBox('style', false)} ${createComboBox('color')} `;
    };

    const hideLabelCompactView = this._config?.compact_view
      ? this._tempCheckBox('fontOptions.hideLabel', 'font_customize.hide_label', 'hide_label')
      : '';

    return this.panelTemplate(
      'fontOptions',
      'fontOptions',
      'mdi:format-font',
      html`
        <div class="font-config-wrapper">
          <div class="font-config-type">
            <span class="title">${localizeKey('headerFontConfig.title')}</span>
            <span class="desc">${localizeKey('headerFontConfig.description')}</span>
          </div>
          <div class="font-config-content">${createFontConfigRow('header')}</div>
        </div>

        <div class="font-config-wrapper">
          <div class="font-config-type">
            <span class="title">${localizeKey('labelFontConfig.title')}</span>
            <span class="desc">${localizeKey('labelFontConfig.description')}</span>
          </div>
          <div class="font-config-content">${createFontConfigRow('label')} ${hideLabelCompactView}</div>
        </div>
      `,
    );
  }

  private panelTemplate(
    title: string,
    secondary: string,
    icon: string,
    content: TemplateResult,
    expanded: boolean = false,
  ): TemplateResult {
    const localTitle = this.localize(`editor.${title}.title`);
    const localDesc = this.localize(`editor.${secondary}.description`);
    return html`
      <div class="panel-container">
        <ha-expansion-panel .expanded=${expanded} .outlined=${true} .header=${localTitle} .secondary=${localDesc}>
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

  /* ---------------------------- RENDER TEMPLATES ---------------------------- */

  private _haComboBox = (
    items: { value: string; label: string }[],
    labelKey: string,
    valueKey: string,
    configValue: string,
    allowCustomValue = true,
  ): TemplateResult => {
    return html`
      <ha-combo-box
        item-value-path="value"
        item-label-path="label"
        .items=${items}
        .label=${this.localize(`editor.${labelKey}`)}
        .value=${valueKey}
        .configValue=${configValue}
        .allowCustomValue=${allowCustomValue}
        @value-changed=${this._handleValueChange}
      ></ha-combo-box>
    `;
  };

  private _tempCheckBox = (labelKey: string, checkedValue, configValueKey: string): TemplateResult => {
    return html` <ha-formfield .label=${this.localize(`editor.${labelKey}`)}>
      <ha-checkbox
        .checked=${this._config?.[checkedValue] !== false}
        .configValue=${configValueKey}
        @change=${this._handleValueChange}
      ></ha-checkbox>
    </ha-formfield>`;
  };

  /* ----------------------------- HANDLER METHODS ---------------------------- */

  private _handleValueChange(ev) {
    if (!this._config || !this.hass) {
      return;
    }

    const target = ev.target as any;
    const configValue = target?.configValue;

    // Safely access the value, add a fallback to an empty string if undefined
    const value = target?.checked !== undefined ? target.checked : ev.detail.value;

    const updates: Partial<LunarPhaseCardConfig> = {};

    // Define default values for FontCustomStyles
    const defaultFontCustomStyles: FontCustomStyles = {
      header_font_size: 'x-large',
      header_font_style: 'capitalize',
      header_font_color: '',
      label_font_size: 'auto',
      label_font_style: 'none',
      label_font_color: '',
      hide_label: false,
    };

    // Check if the configValue is a key of FontCustomStyles
    if (configValue in this._config.font_customize) {
      const key = configValue as keyof FontCustomStyles;

      // If the current value is undefined, use the default value
      const updatedValue = value !== undefined ? value : defaultFontCustomStyles[key];

      updates.font_customize = {
        ...this._config.font_customize,
        [key]: updatedValue,
      };
    } else {
      // Update the main configuration object
      updates[configValue] = value;
    }

    if (Object.keys(updates).length > 0) {
      this._config = { ...this._config, ...updates };
      fireEvent(this, 'config-changed', { config: this._config });
    }
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
        label: 'Latitude',
        value: entity.attributes.latitude ?? entity.attributes.location.latitude,
      },
      {
        label: 'Longitude',
        value: entity.attributes.longitude ?? entity.attributes.location.longitude,
      },
    ];
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
    if (this._config.entity === entity || !entity) {
      return;
    }
    const attribute = this.hass.states[entity].attributes;

    const latitude = attribute.latitude ?? attribute.location.latitude;
    const longitude = attribute.longitude ?? attribute.location.longitude;

    const updates: Partial<LunarPhaseCardConfig> = { entity, latitude, longitude };
    this._config = { ...this._config, ...updates };
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

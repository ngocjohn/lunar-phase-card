/*  @typescript-eslint/no-explicit-any */
import { LitElement, html, TemplateResult, css, CSSResultGroup, PropertyValues } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';

// Custom card helpers
import { fireEvent, LovelaceCardEditor, HomeAssistant } from 'custom-card-helpers';

import { CARD_VERSION, FONTCOLORS, FONTSTYLES, FONTSIZES } from './const';
import { CUSTOM_BG } from './const';
import editorcss from './css/editor.css';
import { languageOptions, localize } from './localize/localize';
import { LunarPhaseCardConfig, FontCustomStyles, defaultConfig, LocationAddress } from './types';
import { generateConfig } from './utils/ha-helper';
import { compareConfig, getAddressFromOpenStreet } from './utils/helpers';
import { loadHaComponents, stickyPreview, _saveConfig } from './utils/loader';

// Components
import './components/moon-editor-search';
import { mdiMagnify } from '@mdi/js';

@customElement('lunar-phase-card-editor')
export class LunarPhaseCardEditor extends LitElement implements LovelaceCardEditor {
  @property({ attribute: false }) public hass!: HomeAssistant;

  @state() _config!: LunarPhaseCardConfig;
  @state() private _activeTabIndex?: number;
  @state() _activeGraphEditor = false;

  @state() private _searchLocation: boolean = false;

  public async setConfig(config: LunarPhaseCardConfig): Promise<void> {
    this._config = { ...config };
  }

  connectedCallback(): void {
    super.connectedCallback();
    sessionStorage.removeItem('activeGraphEditor');
    void loadHaComponents();
    void stickyPreview();
    if (process.env.ROLLUP_WATCH === 'true') {
      window.LunarEditor = this;
    }
  }

  disconnectedCallback(): void {
    sessionStorage.removeItem('activeGraphEditor');
    super.disconnectedCallback();
  }

  protected async firstUpdated(changedProps: PropertyValues): Promise<void> {
    super.firstUpdated(changedProps);
    await new Promise((resolve) => setTimeout(resolve, 0));
    this._handleFirstConfig(this._config);
  }

  protected updated(_changedProperties: PropertyValues): void {
    super.updated(_changedProperties);
    if (_changedProperties.has('_activeTabIndex')) {
      if (this._activeTabIndex === 3) {
        this._activeGraphEditor = true;
      } else {
        this._activeGraphEditor = false;
      }
      this._setToStorage('activeGraphEditor', this._activeGraphEditor);
      this._toggleGraphEditor();
    }
  }

  private async _handleFirstConfig(config: LunarPhaseCardConfig): Promise<void> {
    if (!config.location) {
      console.log('No location found, fetching location');
      const location = await getAddressFromOpenStreet(config.latitude, config.longitude);
      config = { ...config, location };
      this._config = { ...config };
      fireEvent(this, 'config-changed', { config: this._config });
    }

    const isValid = compareConfig({ ...defaultConfig }, { ...config });
    if (!isValid) {
      console.log('Invalid config, generating new config');
      const cardId = `lmc-${Math.random().toString(36).substring(2, 9)}`;
      const newConfig = generateConfig({ ...config });
      newConfig.cardId ?? (newConfig.cardId = cardId);
      this._config = newConfig;
      fireEvent(this, 'config-changed', { config: this._config });
      await _saveConfig(cardId, this._config);
      console.log('Config is valid');
    } else if (isValid && config.cardId !== undefined) {
      this._config = { ...config, cardId: undefined };
      fireEvent(this, 'config-changed', { config: this._config });
      console.log('Config is valid, removing cardId', config.cardId);
    }
  }

  private get selectedLanguage(): string {
    return this._config?.selected_language || this.hass?.language;
  }

  private get location(): LocationAddress {
    return this._config?.location || { city: '', country: '' };
  }

  private localize = (string: string, search = '', replace = ''): string => {
    return localize(string, this.selectedLanguage, search, replace);
  };

  private _setToStorage(key: string, value: any): void {
    sessionStorage.setItem(key, JSON.stringify(value));
  }

  private getLocation = () => {
    this.updateComplete.then(async () => {
      console.log('getLocation');
      const { latitude, longitude } = this._config;
      if (latitude && longitude) {
        const location = await getAddressFromOpenStreet(latitude, longitude);
        this._config = { ...this._config, location };
        fireEvent(this, 'config-changed', { config: this._config });
      }
    });
  };

  private _toggleGraphEditor(): void {
    const event = new CustomEvent('toggle-graph-editor', {
      detail: {
        activeGraphEditor: this._activeGraphEditor,
      },
      bubbles: true,
      composed: true,
    });
    this.dispatchEvent(event);
  }

  /* --------------------------------- RENDERS -------------------------------- */

  protected render(): TemplateResult {
    if (!this.hass) {
      return html``;
    }

    const tabsConfig = [
      {
        label: 'Lat & Long',
        content: this._renderBaseConfigSelector(),
      },
      {
        label: 'View',
        content: this._renderViewConfiguration(),
      },
      {
        label: 'Font',
        content: this._renderFontConfiguration(),
      },
      {
        label: 'Graph',
        content: this._renderGraphConfig(),
      },
    ];

    return this.TabBar({
      activeTabIndex: this._activeTabIndex || 0,
      onTabChange: (index) => (this._activeTabIndex = index),
      tabs: tabsConfig,
    });
  }

  private _renderBaseConfigSelector(): TemplateResult {
    const radiosOptions = this._getBaseConfigSelector().options;
    const radios = radiosOptions.map((item) => {
      return html`
        <ha-formfield .label=${item.label} .title=${item.title} style="cursor: help;">
          <ha-radio
            .checked=${this._config ? this._config[item.key] : false}
            .value=${item.key}
            @change=${this._handleValueChange}
            .configKey=${'location'}
          ></ha-radio>
        </ha-formfield>
      `;
    });

    const southern = html` <ha-formfield .label=${'Southern Hemisphere'}>
      <ha-checkbox
        .checked=${this._config?.southern_hemisphere}
        .configValue=${'southern_hemisphere'}
        @change=${this._handleValueChange}
      ></ha-checkbox>
    </ha-formfield>`;

    const searchWrapper = html` <moon-editor-search
      ._editor=${this}
      @location-update=${(ev: CustomEvent) => this._handleLocationChange(ev)}
    ></moon-editor-search>`;

    const contentWrapp = html`${this._renderLocation()}
    ${this._searchLocation
      ? html`<div class="sub-config-wrapper">${searchWrapper}</div>`
      : html`
          <div>
            ${this._config?.use_default
              ? this._renderUseDefault()
              : this._config?.use_custom
              ? this._renderCustomLatLong()
              : this._config?.use_entity
              ? this._renderEntityPicker()
              : ''}
          </div>

          <div class="comboboxes">${radios} ${southern}</div>
        `}`;

    return this.contentTemplate('baseConfig', 'baseConfig', 'mdi:longitude', contentWrapp);
  }

  private _renderLocation(): TemplateResult {
    const location = this.location;

    const markerStyle = `color: var(--secondary-text-color); margin-right: 0.5rem;`;
    const headerStyle = `border: none; min-height: auto;`;

    const locationHeader = html` <ha-icon icon="mdi:map-marker" style=${markerStyle}></ha-icon>
      <div class="header-title">
        <div>${location.city}</div>
        <span class="secondary">${location.country}</span>
      </div>
      <ha-icon-button
        .path=${mdiMagnify}
        @click=${() => (this._searchLocation = !this._searchLocation)}
      ></ha-icon-button>`;

    return html`
      <div class="header-container" style=${headerStyle}>
        ${this._searchLocation
          ? html`<ha-button @click=${() => (this._searchLocation = !this._searchLocation)}>Back</ha-button> `
          : locationHeader}
      </div>
    `;
  }

  private _renderUseDefault(): TemplateResult {
    const latLong = [
      { label: 'Latitude', value: this._config?.latitude },
      { label: 'Longitude', value: this._config?.longitude },
    ];

    return html`<div class="sub-config-content">
      ${latLong.map((item) => {
        return html` <ha-textfield .disabled=${true} .label=${item.label} .value=${item.value}></ha-textfield> `;
      })}
    </div> `;
  }

  private _renderCustomLatLong(): TemplateResult {
    const latLong = [
      { label: this.localize('editor.placeHolder.latitude'), configValue: 'latitude' },
      { label: this.localize('editor.placeHolder.longitude'), configValue: 'longitude' },
    ];

    return html`<div class="sub-config-content">
      ${latLong.map((item) => {
        return html`
          <ha-textfield
            .label=${item.label}
            .configKey=${'latLong'}
            .configValue=${item.configValue}
            .value=${this._config?.[item.configValue] || ''}
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
      (entity) => this.hass.states[entity].attributes.latitude && this.hass.states[entity].attributes.longitude
    );

    const combinedEntities = [...entities, 'separator', ...entitiesWithLatLong];

    const entityPicker = html`
      <ha-entity-picker
        .hass=${this.hass}
        .value=${this._config?.entity}
        .configValue=${'entity'}
        @value-changed=${this._handleValueChange}
        .label=${'Entity'}
        .required=${false}
        .includeEntities=${combinedEntities}
        allow-custom-entity
      ></ha-entity-picker>
    `;

    const entitySelected = this._config?.entity ? true : false;
    const entityLatLong = [
      { label: 'Latitude', value: this._config?.latitude },
      { label: 'Longitude', value: this._config?.longitude },
    ];

    const entityContent = html` <div class="sub-config-content">
      ${entityLatLong.map((item) => {
        return html` <ha-textfield .disabled=${true} .label=${item.label} .value=${item.value}></ha-textfield> `;
      })}
    </div>`;

    const content = html` ${entityPicker} ${entitySelected ? entityContent : ''} `;

    return content;
  }

  private _renderViewConfiguration(): TemplateResult {
    const content: TemplateResult[][] = [];
    const langOpts = [
      { key: 'system', name: 'System', nativeName: this.hass?.language },
      ...languageOptions.sort((a, b) => a.name.localeCompare(b.name)),
    ];

    // Map langOpts to the format expected by _haComboBox
    const itemsLang = langOpts.map((lang) => ({
      value: lang.key,
      label: `${lang.name} (${lang.nativeName})`,
    }));

    const viewItemMap = [
      { label: 'compactView', configValue: 'compact_view' },
      { label: 'showBackground', configValue: 'show_background' },
      { label: 'timeFormat', configValue: '12hr_format' },
      { label: 'mileUnit', configValue: 'mile_unit' },
      { label: 'hideButtons', configValue: 'hide_buttons' },
      { label: 'calendarModal', configValue: 'calendar_modal' },
    ];

    const viewOptions = html`
      <div class="switches">${viewItemMap.map((item) => this._tempCheckBox(item.label, item.configValue))}</div>
    `;

    // Create the ha-combo-box using the _haComboBox method
    const langComboBox = html`
      ${this._haComboBox(
        itemsLang, // Passing the mapped language options
        'placeHolder.language', // Localization key for the label
        this._config?.selected_language || '', // Currently selected language
        'selected_language', // Config value key
        false // Allow custom value
      )}
    `;

    const defaultCard = this._haComboBox(
      [
        { value: 'base', label: 'Default' },
        { value: 'calendar', label: 'Calendar' },
        { value: 'horizon', label: 'Horizon' },
      ],
      'placeHolder.defaultCard',
      this._config?.default_card || 'base',
      'default_card',
      false
    );

    const moonPositon = this._haComboBox(
      [
        { value: 'left', label: 'Left' },
        { value: 'right', label: 'Right' },
      ],
      'placeHolder.moonPosition',
      this._config?.moon_position || 'left',
      'moon_position',
      false
    );

    const numberDecimals = html` <ha-selector
      .hass=${this.hass}
      .value=${this._config?.number_decimals as number}
      .configValue=${'number_decimals'}
      .selector=${{ number: { max: 10, min: 0, mode: 'box', step: 1 } }}
      .label=${'Number Decimals'}
      .required=${true}
      @value-changed=${this._handleValueChange}
    ></ha-selector>`;

    const customBackgroundInput = this._renderCustomBackground();

    const comboboxex = html`
      <div class="comboboxes">${langComboBox} ${defaultCard} ${moonPositon} ${numberDecimals}</div>
    `;

    content.push([viewOptions, comboboxex, customBackgroundInput]);

    return this.contentTemplate('viewConfig', 'viewConfig', 'mdi:image', html`${content}`);
  }

  private _renderGraphConfig(): TemplateResult {
    const subheader = (key: string) => {
      const title = this.localize(`editor.graphConfig.${key}.title`);
      const desc = this.localize(`editor.graphConfig.${key}.description`);
      return html`<div class="sub-config-type">
        <span class="title">${title}</span>
        <span class="desc">${desc}</span>
      </div>`;
    };

    const viewItemMap = [
      { label: 'yTicks', configValue: 'y_ticks' },
      { label: 'xTicks', configValue: 'x_ticks' },
      { label: 'showTime', configValue: 'show_time' },
      { label: 'showCurrent', configValue: 'show_current' },
      // { label: 'showLegend', configValue: 'show_legend' },
      // { label: 'showHighest', configValue: 'show_highest' },
    ];

    const checkBoxes = html`
      <div class="switches">
        ${viewItemMap.map((item) => this._tempCheckBox(item.label, item.configValue, 'graph_config'))}
      </div>
    `;

    const generateComboBox = (items: { value: string; label: string }[], labelKey: string, valueKey: string) => {
      return this._haComboBox(
        items,
        `placeHolder.${labelKey}`,
        this._config?.graph_config?.[valueKey] ?? defaultConfig.graph_config?.[valueKey],
        valueKey,
        false,
        'graph_config'
      );
    };

    const graphType = [{ items: ['default', 'dynamic'], label: 'graphType', value: 'graph_type' }];

    const comboBoxes = [
      // { items: ['top', 'bottom'], label: 'legendPosition', value: 'legend_position' },
      // { items: ['start', 'center', 'end'], label: 'legendAlign', value: 'legend_align' },
      { items: ['left', 'right'], label: 'yTicksPosition', value: 'y_ticks_position' },
    ];

    const yTicksPosition = html`
      ${comboBoxes.map((item) =>
        generateComboBox(
          item.items.map((i) => ({ value: i, label: i.charAt(0).toUpperCase() + i.slice(1) })),
          item.label,
          item.value
        )
      )}
    `;

    const graphTypeSelector = html`
      ${graphType.map((item) =>
        generateComboBox(
          item.items.map((i) => ({ value: i, label: i.charAt(0).toUpperCase() + i.slice(1) })),
          item.label,
          item.value
        )
      )}
    `;

    const numberSelector = [
      {
        label: 'Y Ticks Step Size',
        value: 'y_ticks_step_size',
        selector: { number: { max: 90, min: 5, mode: 'box', step: 5 } },
      },
      {
        label: 'Time Step Size',
        value: 'time_step_size',
        selector: { number: { max: 60, min: 5, mode: 'slider', step: 5 } },
      },
    ].map((item) => {
      return html` <ha-selector
        .hass=${this.hass}
        .value=${(this._config?.graph_config?.[item.value] as number) ?? 30}
        .configValue=${item.value}
        .selector=${item.selector}
        .label=${item.label}
        .required=${false}
        .configKey=${'graph_config'}
        @value-changed=${this._handleValueChange}
      ></ha-selector>`;
    });

    const graphConfig = html`
      <div class="sub-config-wrapper">
        ${subheader('type')}
        <div class="sub-config-content">${graphTypeSelector}</div>
      </div>
      ${this._config?.graph_config?.graph_type === 'default' || !this._config?.graph_config?.graph_type
        ? html`
            <div class="sub-config-wrapper">
              ${subheader('visibility')}
              <div class="sub-config-content">${checkBoxes}</div>
            </div>
            <div class="sub-config-wrapper">
              ${subheader('customization')}
              <div class="sub-config-content">${yTicksPosition} ${numberSelector}</div>
            </div>
          `
        : ''}
    `;

    return this.contentTemplate('graphConfig', 'graphConfig', 'mdi:chart-bell-curve', graphConfig);
  }

  private _renderCustomBackground(): TemplateResult {
    const backgroundOptions = html`
      ${Array.from({ length: CUSTOM_BG.length }).map(
        (_, i) => html`
          <ha-formfield>
            <img src=${CUSTOM_BG[i]} class="bg-thumbnail" slot="label" />
            <ha-radio
              .checked=${this._config?.custom_background === CUSTOM_BG[i] ||
              (this._config?.custom_background === undefined && i === null) ||
              (this._config?.show_background && this._config?.custom_background === undefined && i === 0)}
              .value=${i}
              .configKey=${'custom_bg'}
              @change=${this._handleValueChange}
            ></ha-radio>
          </ha-formfield>
        `
      )}
    `;

    const customBackgroundInput = html`
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

    const backgroundContainer = html`
      <div class="sub-config-wrapper">
        <div class="sub-config-type">
          <span class="title">${this.localize(`editor.viewConfig.customBackground.title`)}</span>
          <span class="desc">${this.localize(`editor.viewConfig.customBackground.description`)}</span>
        </div>
        <div class="sub-config-content">${backgroundOptions}</div>
        <div class="sub-config-content">${customBackgroundInput}</div>
      </div>
    `;

    return backgroundContainer;
  }

  private _renderFontConfiguration(): TemplateResult {
    const _fontPrefix = 'fontOptions';

    // Helper function for localization
    const localizeKey = (key: string) => this.localize(`editor.${_fontPrefix}.${key}`);

    const createFontConfigRow = (prefix: 'header' | 'label') => {
      // Function to generate the ha-combo-box elements
      const createComboBox = (type: 'size' | 'style' | 'color', allowCustomValue = true) => {
        const configValueKey = `${prefix}_font_${type}`;

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
          fontCustomize[configValueKey] || (type === 'size' ? 'auto' : type === 'style' ? 'none' : ''),
          configValueKey,
          allowCustomValue,
          'font_customize'
        );
      };

      return html` ${createComboBox('size')} ${createComboBox('style', false)} ${createComboBox('color')} `;
    };

    const hideLabelCompactView = this._config?.compact_view
      ? this._tempCheckBox('fontOptions.hideLabel', 'hide_label', 'font_customize')
      : '';

    return this.contentTemplate(
      'fontOptions',
      'fontOptions',
      'mdi:format-font',
      html`
        <div class="sub-config-wrapper">
          <div class="sub-config-type">
            <span class="title">${localizeKey('headerFontConfig.title')}</span>
            <span class="desc">${localizeKey('headerFontConfig.description')}</span>
          </div>
          <div class="sub-config-content">${createFontConfigRow('header')}</div>
        </div>

        <div class="sub-config-wrapper">
          <div class="sub-config-type">
            <span class="title">${localizeKey('labelFontConfig.title')}</span>
            <span class="desc">${localizeKey('labelFontConfig.description')}</span>
          </div>
          <div class="sub-config-content">${createFontConfigRow('label')} ${hideLabelCompactView}</div>
        </div>
      `
    );
  }

  private TabBar = ({
    activeTabIndex,
    onTabChange,
    tabs,
  }: {
    activeTabIndex: number;
    onTabChange: (index: number) => void;
    tabs: { content: TemplateResult; icon?: string; key?: string; label: string; stacked?: boolean }[];
  }): TemplateResult => {
    return html`
      <mwc-tab-bar class="vic-tabbar" @MDCTabBar:activated=${(e: Event) => onTabChange((e.target as any).activeIndex)}>
        ${tabs.map(
          (tab) => html`<mwc-tab label=${tab.label} icon=${tab.icon || ''} ?stacked=${tab.stacked || false}></mwc-tab>`
        )}
      </mwc-tab-bar>

      <div>${tabs[activeTabIndex]?.content || html`<div>No content available</div>`}</div>
      <div class="version">
        <span> version: ${CARD_VERSION}</span>
      </div>
    `;
  };

  private contentTemplate(title: string, secondary: string, icon: string, content: TemplateResult): TemplateResult {
    const localTitle = this.localize(`editor.${title}.title`);
    const localDesc = this.localize(`editor.${secondary}.description`);
    return html`
      <div class="card-config">
        <div class="header-container">
          <div class="header-title">
            <div>${localTitle}</div>
            <span class="secondary">${localDesc}</span>
          </div>
          <ha-icon icon=${icon}></ha-icon>
        </div>
        ${content}
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
    configKey?: string
  ): TemplateResult => {
    return html`
      <ha-combo-box
        item-value-path="value"
        item-label-path="label"
        .items=${items}
        .label=${this.localize(`editor.${labelKey}`)}
        .value=${valueKey}
        .configValue=${configValue}
        .configKey=${configKey}
        .allowCustomValue=${allowCustomValue}
        @value-changed=${this._handleValueChange}
      ></ha-combo-box>
    `;
  };

  private _tempCheckBox = (labelKey: string, configValueKey: string, configKey?: string): TemplateResult => {
    const checkedValue = configKey ? this._config?.[configKey]?.[configValueKey] : this._config?.[configValueKey];
    const titleHelper = labelKey === 'fontOptions.hideLabel' ? 'hideLabel' : labelKey;
    return html` <ha-selector
      .hass=${this.hass}
      .value=${checkedValue}
      .configValue=${configValueKey}
      .label=${this.localize(`editor.${labelKey}`)}
      .title=${this.localize(`editor.titleHelper.${titleHelper}`)}
      .required=${false}
      .configKey=${configKey}
      .selector=${{
        boolean: {},
      }}
      @value-changed=${this._handleValueChange}
      style="cursor: help;"
    ></ha-selector>`;
  };

  /* ----------------------------- HANDLER METHODS ---------------------------- */

  private _handleLocationChange(ev: CustomEvent): void {
    const { latitude, longitude } = ev.detail;
    const newConfig = {
      use_custom: true,
      use_default: false,
      use_entity: false,
      latitude,
      longitude,
    };
    this._config = { ...this._config, ...newConfig };
    fireEvent(this, 'config-changed', { config: this._config });
    if (this._searchLocation) {
      setTimeout(() => {
        this._searchLocation = false;
        this.getLocation();
      }, 1500);
    }
  }

  private _handleValueChange(event: any): void {
    event.stopPropagation();
    const ev = event as CustomEvent;
    if (!this._config || !this.hass) {
      return;
    }

    const target = ev.target as any;
    const configValue = target?.configValue;
    let configKey = target?.configKey || ev.detail?.configKey;

    let value: any = target.checked !== undefined ? target.checked : ev.detail?.value;

    // console.log('configKey', configKey, 'configValue', configValue, 'value', value);
    const updates: Partial<LunarPhaseCardConfig> = {};

    // Check if the configValue is a key of FontCustomStyles
    if (configKey === 'font_customize') {
      const key = configValue as keyof FontCustomStyles;
      // If the current value is undefined, use the default value
      const updatedValue = value !== undefined ? value : defaultConfig[key];

      updates.font_customize = {
        ...this._config.font_customize,
        [key]: updatedValue,
      };
    } else if (configKey === 'graph_config') {
      value = target.checked !== undefined ? target.checked : ev.detail?.value;
      updates.graph_config = {
        ...this._config.graph_config,
        [configValue]: value,
      };
      this._activeGraphEditor = true;
    } else if (configValue === 'selected_language') {
      if (value === 'system' || value === undefined) {
        updates.selected_language = this.hass?.language;
      } else {
        updates.selected_language = value;
      }
    } else if (configKey === 'custom_bg') {
      value = event.target.value;
      updates.custom_background = value === 0 ? undefined : CUSTOM_BG[value];
    } else if (configValue === 'entity') {
      const attribute = this.hass.states[value].attributes;
      updates.latitude = attribute.latitude ?? attribute.location.latitude;
      updates.longitude = attribute.longitude ?? attribute.location.longitude;
      updates.entity = value;
      console.log('updates', updates);
    } else if (configKey === 'location') {
      value = event.target.value;
      const radiosOptions = this._getBaseConfigSelector().options.map((item: { key: string }) => item.key);
      radiosOptions.forEach((item: string) => {
        if (item === value) {
          updates[item] = true;
        } else {
          updates[item] = false;
        }
      });
      if (value === 'use_custom') {
        updates.entity = '';
      } else if (value === 'use_default') {
        updates.entity = '';
        updates.latitude = this.hass.config.latitude;
        updates.longitude = this.hass.config.longitude;
      }
    } else if (['latitude', 'longitude'].includes(configValue)) {
      value = event.target?.value;
      updates[configValue] = value.trim();
    } else {
      // Update the main configuration object
      updates[configValue] = value;
    }
    if (Object.keys(updates).length > 0) {
      this._config = { ...this._config, ...updates };
      fireEvent(this, 'config-changed', { config: this._config });
    }
    if ('latitude' in updates || 'longitude' in updates) {
      this.getLocation();
    }
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
      const response = await this.hass.fetchWithAuth('/api/image/upload', {
        method: 'POST',
        body: formData,
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

  private _getBaseConfigSelector(): { options: { key: string; label: string; title: string }[] } {
    return {
      options: [
        {
          key: 'use_default',
          label: this.localize('editor.optionsConfig.useDefault'),
          title: this.localize('editor.titleHelper.useDefault'),
        },
        {
          key: 'use_custom',
          label: this.localize('editor.optionsConfig.useCustom'),
          title: this.localize('editor.titleHelper.useCustom'),
        },
        {
          key: 'use_entity',
          label: this.localize('editor.optionsConfig.useEntity'),
          title: this.localize('editor.titleHelper.useEntity'),
        },
      ],
    };
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

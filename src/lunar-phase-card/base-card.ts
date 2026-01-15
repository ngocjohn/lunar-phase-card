import { pick } from 'es-toolkit';
import { CSSResultGroup, html, TemplateResult } from 'lit';
import { property, state } from 'lit/decorators.js';

import { FrontendLocaleData, TimeFormat } from '../ha';
import { getLatLonFromEntity, hasEntityLocation } from '../ha/common/entity/has_location';
import { Moon } from '../model/moon';
import { Store } from '../model/store';
import { CardArea } from '../types/card-area';
import {
  HeaderFontConfig,
  HeaderFontConfigKeys,
  LabelFontConfig,
  LabelFontConfigKeys,
} from '../types/config/font-config';
import {
  AppearanceOptions,
  CardAppearance,
  ConfigFieldOrder,
  LayoutConfig,
  LayoutConfigKeys,
  LocationConfig,
  LocationConfigKeys,
  LunarPhaseCardConfig,
} from '../types/config/lunar-phase-card-config';
import { FrontendLocaleDataExtended, LatLon } from '../types/config/types';
import { migrateConfig } from '../types/utils';
import './components/moon-image';
import '../shared/moon-clock-time';
import * as Chunk from '../utils/chunk-object';
import { orderProperties } from '../utils/order-properties';
import { LunarBaseElement } from './base-element';

export class LunarBaseCard extends LunarBaseElement {
  @property({ attribute: false }) protected store!: Store;
  @property({ attribute: false }) protected moon!: Moon;
  @property({ attribute: false }) public appearance?: CardAppearance;
  @state() protected config!: LunarPhaseCardConfig;

  protected _chunk = Chunk;

  protected _cardArea?: CardArea;

  constructor(cardArea?: CardArea) {
    super();
    if (cardArea) {
      this._cardArea = cardArea;
    }
  }
  setConfig(config: LunarPhaseCardConfig): void {
    this.config = {
      ...migrateConfig(config),
    };
  }

  get _configLanguage(): string {
    return this.config?.language || this.hass.selectedLanguage || this.hass.config.language;
  }

  get _configLatLong(): LatLon {
    const config = this._configLocation;
    const source = config?.location_source || 'default';
    if (source === 'entity' && config.entity) {
      const stateObj = this.hass.states[config.entity];
      if (hasEntityLocation(stateObj)) {
        return getLatLonFromEntity(stateObj);
      }
    } else if (source === 'custom' && config.latitude && config.longitude) {
      return { latitude: config.latitude, longitude: config.longitude };
    }
    // default to hass config
    return {
      latitude: this.hass.config.latitude,
      longitude: this.hass.config.longitude,
    };
  }

  get _locale(): FrontendLocaleData {
    const haLocale = this.hass.locale;
    const time_format = this.config?.['12hr_format'] ? TimeFormat.am_pm : TimeFormat.twenty_four;
    const language = this._configLanguage;
    const newLocale: FrontendLocaleData = {
      ...haLocale,
      language,
      time_format,
    };
    return newLocale;
  }

  get _configLocale(): FrontendLocaleDataExtended {
    const _locale = this._locale;
    const location = this._configLatLong;
    const number_decimals = this.config?.number_decimals;
    return {
      ..._locale,
      location,
      number_decimals,
    };
  }

  get _configLocation(): LocationConfig {
    return pick(this.config || {}, [...LocationConfigKeys]);
  }

  get _configAppearance(): CardAppearance {
    const appearance = pick(this.config || {}, [...AppearanceOptions]);
    return appearance;
  }

  get _configLayout(): LayoutConfig {
    return pick(this.config || {}, [...LayoutConfigKeys]);
  }

  get _configHeaderStyles(): HeaderFontConfig {
    return pick(this.config.font_config || {}, [...HeaderFontConfigKeys]);
  }

  get _configLabelStyles(): LabelFontConfig {
    return pick(this.config.font_config || {}, [...LabelFontConfigKeys]);
  }

  get _configGraph(): LunarPhaseCardConfig['graph_chart_config'] {
    return this.config.graph_chart_config || {};
  }

  public getOrderedConfigFields(): LunarPhaseCardConfig {
    if (!this.config) {
      return {} as LunarPhaseCardConfig;
    }
    const orderedConfig = orderProperties(this.config, [...ConfigFieldOrder]);
    return orderedConfig as LunarPhaseCardConfig;
  }

  public getCardSize(): number | Promise<number> {
    let height = 1;
    if (!this.config) {
      return height;
    }
    return 1;
  }

  public renderMoonImage(): TemplateResult {
    return html`<lunar-moon-image slot="moon-pic" .imageData=${this.moon.moonImage}></lunar-moon-image>`;
  }

  public renderTimeClock(): TemplateResult {
    return html`<lunar-moon-clock-time .hass=${this.hass} .configLocale=${this._locale}></lunar-moon-clock-time>`;
  }

  static get styles(): CSSResultGroup {
    return super.styles;
  }
}

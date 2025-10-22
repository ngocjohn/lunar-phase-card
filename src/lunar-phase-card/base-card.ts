import { pick } from 'es-toolkit';
import { CSSResultGroup, html, TemplateResult } from 'lit';
import { property, state } from 'lit/decorators.js';

import { SECTION } from '../const';
import { FrontendLocaleData, TimeFormat } from '../ha';
import { hasLocation } from '../ha/common/entity/has_location';
import { Store } from '../model/store';
import { CardArea } from '../types/card-area';
import {
  HeaderFontConfig,
  HeaderFontConfigKeys,
  LabelFontConfig,
  LabelFontConfigKeys,
} from '../types/config/font-config';
import { AppareanceKeys, CardAppareance, LunarPhaseCardConfig, Section } from '../types/config/lunar-phase-card-config';
import { FrontendLocaleDataExtended, LatLon } from '../types/config/types';
import { migrateConfig } from '../types/utils';
import { Moon } from '../utils/moon';
import { LunarBaseElement } from './base-element';
import './components/moon-image';

export class LunarBaseCard extends LunarBaseElement {
  @property({ attribute: false }) protected store!: Store;
  @property({ attribute: false }) protected moon!: Moon;
  @state() protected config!: LunarPhaseCardConfig;
  @state() _initSection: Section = SECTION.BASE;

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
    if (this.config.default_section) {
      this._initSection = this.config.default_section;
    }
  }

  get _configLanguage(): string {
    return this.config?.language || this.hass.selectedLanguage || this.hass.config.language;
  }
  get _configLocation(): LatLon {
    const source = this.config?.location_source || 'default';
    if (source === 'entity' && this.config?.location_entity) {
      const stateObj = this.hass.states[this.config.location_entity];
      if (stateObj && hasLocation(stateObj)) {
        const { latitude, longitude } = stateObj.attributes;
        return { latitude, longitude };
      }
    } else if (source === 'custom' && this.config.latitude && this.config.longitude) {
      return { latitude: this.config.latitude, longitude: this.config.longitude };
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
    const location = this._configLocation;
    const number_decimals = this.config?.number_decimals;
    return {
      ..._locale,
      location,
      number_decimals,
    };
  }

  get _configAppearance(): CardAppareance {
    const appearance = pick(this.config, [...AppareanceKeys]);
    return appearance;
  }

  get _configHeaderStyles(): HeaderFontConfig {
    return pick(this.config.font_config || {}, [...HeaderFontConfigKeys]);
  }

  get _configLabelStyles(): LabelFontConfig {
    return pick(this.config.font_config || {}, [...LabelFontConfigKeys]);
  }

  public getCardSize(): number | Promise<number> {
    let height = 1;
    if (!this.config) {
      return height;
    }
    const appearance = this._configAppearance;
    if (appearance.compact_view === true) {
      height += 1;
    } else {
      height += 2;
    }
    if (appearance.hide_header !== true) {
      height += 1;
    }
    return height;
  }

  public renderMoonImage(): TemplateResult {
    return html`<lunar-moon-image slot="moon-pic" .imageData=${this.moon.moonImage}></lunar-moon-image>`;
  }

  static get styles(): CSSResultGroup {
    return super.styles;
  }
}

import { pick } from 'es-toolkit';
import { html, TemplateResult } from 'lit';
import { property, state } from 'lit/decorators.js';

import { SECTION } from '../const';
import { TimeFormat } from '../ha';
import { hasLocation } from '../ha/common/entity/has_location';
import { Store } from '../model/store';
import { AppareanceKeys, CardAppareance, LunarPhaseCardConfig, Section } from '../types/config/lunar-phase-card-config';
import { FrontendLocaleDataExtended, LatLon } from '../types/config/types';
import { migrateConfig } from '../types/utils';
import { Moon } from '../utils/moon';
import { LunarBaseElement } from './base-element';

export class LunarBaseCard extends LunarBaseElement {
  @property({ attribute: false }) protected store!: Store;
  @property({ attribute: false }) protected moon!: Moon;

  @state() protected config!: LunarPhaseCardConfig;
  @property({ reflect: true, type: String })
  public layout: string | undefined;

  @state() private _initSection: Section = SECTION.BASE;

  setConfig(config: LunarPhaseCardConfig): void {
    this.config = {
      ...migrateConfig(config),
    };
    if (this.config.default_section) {
      this._initSection = this.config.default_section;
    }
  }

  get _configLanguage(): string {
    return this.config.language || this.hass.selectedLanguage || this.hass.config.language;
  }
  get _configLocation(): LatLon {
    const source = this.config.location_source || 'default';
    if (source === 'entity' && this.config.location_entity) {
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

  get _configLocale(): FrontendLocaleDataExtended {
    const haLocale = this.hass.locale;
    const time_format = this.config['12hr_format'] ? TimeFormat.am_pm : TimeFormat.twenty_four;
    const language = this._configLanguage;
    const location = this._configLocation;
    const number_decimals = this.config?.number_decimals;
    return {
      ...haLocale,
      language,
      time_format,
      location,
      number_decimals,
    };
  }

  get _configAppearance(): CardAppareance {
    const appearance = pick(this.config, [...AppareanceKeys]);
    return appearance;
  }

  public getCardSize(): number | Promise<number> {
    return 1;
  }

  protected renderMoon(img: string): TemplateResult {
    return html`<div slot="moon-img">
      <img src="${img}" alt="moon" />
    </div> `;
  }
}

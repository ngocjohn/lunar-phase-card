import { html, TemplateResult } from 'lit';
import { property, state } from 'lit/decorators.js';

import { FrontendLocaleData, TimeFormat } from '../ha';
import { Store } from '../model/store';
import { LunarPhaseCardConfig } from '../types/config/lunar-phase-card-config';
import { migrateConfig } from '../types/utils';
import { LunarBaseElement } from './base-element';

export class LunarBaseCard extends LunarBaseElement {
  @property({ attribute: false }) protected store!: Store;
  @state() protected config!: LunarPhaseCardConfig;

  @property({ reflect: true, type: String }) public layout: string | undefined;

  setConfig(config: LunarPhaseCardConfig): void {
    this.config = {
      ...migrateConfig(config),
    };
  }

  get _configLanguage(): string {
    return this.config.language || this.hass.selectedLanguage || this.hass.config.language;
  }
  get _configLocale(): FrontendLocaleData {
    const haLocale = this.hass.locale;
    const time_format = this.config['12hr_format'] ? TimeFormat.am_pm : TimeFormat.twenty_four;
    const language = this._configLanguage;
    return {
      ...haLocale,
      language,
      time_format,
    };
  }

  public getCardSize(): number | Promise<number> {
    return 3;
  }

  protected renderMoon(img: string): TemplateResult {
    return html`<div slot="moon-img">
      <img src="${img}" alt="moon" />
    </div> `;
  }
}

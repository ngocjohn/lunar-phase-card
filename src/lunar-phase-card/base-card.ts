import { html, TemplateResult } from 'lit';
import { property, state } from 'lit/decorators.js';

import { Store } from '../model/store';
import { LunarPhaseNewCardConfig } from '../types/lunar-phase-card-config';
import { migrateConfig } from '../types/utils';
import { LunarBaseElement } from './base-element';

export class LunarBaseCard extends LunarBaseElement {
  @property({ attribute: false }) protected store!: Store;
  @state() protected config!: LunarPhaseNewCardConfig;

  @property({ reflect: true, type: String }) public layout: string | undefined;

  setConfig(config: LunarPhaseNewCardConfig): void {
    this.config = {
      ...migrateConfig(config),
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

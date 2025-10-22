import { html, css, TemplateResult, CSSResultGroup } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { styleMap } from 'lit/directives/style-map.js';

import { SECTION } from '../../const';
import { CardArea } from '../../types/card-area';
import { LunarBaseCard } from '../base-card';

@customElement('lunar-moon-base')
export class LunarMoonBase extends LunarBaseCard {
  constructor() {
    super(CardArea.BASE);
  }
  @property({ type: String, reflect: true }) public activePage?: SECTION;

  protected render(): TemplateResult {
    const moonPicStyles = {
      maxWidth: 'calc(100% / 3.5)',
      width: '100%',
      height: 'auto',
    };
    return html`
      <div
        class=${classMap({
          container: true,
          '--vertical': this.activePage === SECTION.CALENDAR,
        })}
      >
        <div class="moon-pic" style=${styleMap(moonPicStyles)}>
          <slot name="moon-pic"></slot>
        </div>
        <div class="info">
          <slot name="moon-header"></slot>
          <slot name="moon-info"></slot>
        </div>
      </div>
    `;
  }

  static get styles(): CSSResultGroup {
    return css`
      :host {
        display: block;
      }
      .container {
        display: flex;
        padding-inline: 8px;
        align-items: stretch;
        gap: var(--lunar-card-gutter);
      }
      .container.--vertical {
        flex-direction: column;
        align-items: center;
        padding: 0 !important;
      }

      .moon-pic {
        display: flex;
        justify-content: center;
        align-items: center;
      }
      .container.--vertical .info {
        width: 100%;
        padding: 0;
      }
      .info {
        /* padding-inline: var(--lunar-card-gutter, 8px); */
        display: -ms-inline-grid;
        display: inline-grid;
        width: 100%;
        backdrop-filter: blur(2px);
      }

      .info ::slotted([slot='moon-header']) {
        min-height: var(--lpc-unit);
      }

      .info ::slotted([slot='moon-info']) {
        z-index: 1;
      }
    `;
  }
}

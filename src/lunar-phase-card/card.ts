import { css, CSSResultGroup, html, LitElement, TemplateResult } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';

import { CardAppareance } from '../types/config/lunar-phase-card-config';

@customElement('lunar-card')
export class Card extends LitElement {
  @property({ attribute: false }) public appearance?: CardAppareance;

  protected render(): TemplateResult {
    return html`
      <div class=${classMap({ container: true, __header: !this.appearance?.hide_header })}>
        <slot name="header"></slot>
        <slot name="content"></slot>
        <slot name="footer"></slot>
      </div>
    `;
  }

  static get styles(): CSSResultGroup {
    return css`
      :host {
        width: 100%;
        display: block;
        margin: cal(-1 * var(--ha-card-border-width, 1px));
      }
      .container {
        position: relative;
        display: flex;
        flex-shrink: 0;
        flex-grow: 0;
        box-sizing: border-box;
        height: auto;
      }

      .container > ::slotted([slot='header']) {
        position: absolute;
        z-index: 2;
        top: 0;
        left: 0;
        right: 0;
        height: fit-content;
        width: 100%;
      }
      .container.__header > ::slotted([slot='content']) {
        padding-top: var(--lunar-card-header-height, 36px);
      }
      .container > ::slotted([slot='content']) {
        position: relative;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 100%;
        height: 100%;
        z-index: 1;
      }
      .container > ::slotted([slot='footer']) {
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        width: 100%;
      }
    `;
  }
}

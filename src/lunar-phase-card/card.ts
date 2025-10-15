import { css, CSSResultGroup, html, LitElement, TemplateResult } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';

@customElement('lunar-card')
export class Card extends LitElement {
  @property({ attribute: false }) public appearance?: any;

  protected render(): TemplateResult {
    return html`
      <div class=${classMap({ container: true, compact: this.appearance?.compact })}>
        <slot name="header"></slot>
        <slot name="content"></slot>
        <slot name="footer"></slot>
      </div>
    `;
  }

  static get styles(): CSSResultGroup {
    return css`
      :host {
        flex: 1;
        display: flex;
        margin: cal(-1 * var(--ha-card-border-width, 1px));
      }
      .container {
        position: relative;
        display: flex;
        flex-shrink: 0;
        flex-grow: 0;
        box-sizing: border-box;
        height: 100%;
        min-height: 100px;
      }
      .container > ::slotted([slot='header']) {
        flex: 1;
        position: absolute;
        z-index: 2;
        top: 0;
        left: 0;
        right: 0;
        height: fit-content;
        width: 100%;
      }
      .container > ::slotted([slot='content']) {
        flex: 1 1 auto;
        position: relative;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 100%;
        height: 100%;
        z-index: 1;
      }
      .container > ::slotted([slot='footer']) {
        flex: 1 1 auto;
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
      }
    `;
  }
}

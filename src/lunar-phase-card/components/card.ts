import { css, CSSResultGroup, html, LitElement, PropertyValues, TemplateResult } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';

import { CardAppareance } from '../../types/config/lunar-phase-card-config';

@customElement('lunar-card')
export class Card extends LitElement {
  @property({ attribute: false }) public appearance!: CardAppareance;
  @property({ type: Number }) public cardWidth = 0;
  @property({ type: Number }) public cardHeight = 0;
  @property({ type: Boolean }) public calendarPopup = false;

  protected willUpdate(_changedProperties: PropertyValues): void {
    if (_changedProperties.has('cardWidth') || _changedProperties.has('cardHeight')) {
      const minHeight = this.cardWidth * 0.5;
      this.style.setProperty('min-height', `${minHeight}px`);
    }
  }

  protected render(): TemplateResult {
    return html`
      <div class=${this._computeClasses()}>
        <slot name="header"></slot>
        <slot name="content"></slot>
      </div>
    `;
  }

  private _computeClasses({ appearance } = this) {
    const hasPopup = this.calendarPopup;
    const classes = {
      container: true,
      '--no-header': appearance?.hide_header === true || hasPopup,
      '--has-popup': hasPopup,
    };
    return classMap(classes);
  }

  static get styles(): CSSResultGroup {
    return css`
      :host {
        width: 100%;
        height: 100%;
        display: block;
        box-sizing: border-box;
        min-height: 150px;
      }
      .container {
        position: relative;
        display: flex;
        flex-shrink: 0;
        flex-grow: 0;
        box-sizing: border-box;
        height: 100%;
        width: 100%;
        flex-direction: column;
      }

      .container > ::slotted([slot='header']) {
        position: absolute;
        z-index: 2;
        top: 0;
        left: 0;
        right: 0;
        height: fit-content;
        width: 100%;
        padding-inline-start: var(--lunar-card-gutter, 8px);
      }

      .container.--has-popup > ::slotted([slot='header']) {
        display: none;
      }
      .container.--has-popup > ::slotted([slot='content']) {
        margin-top: 0 !important;
      }

      .container.--no-header > ::slotted([slot='content']) {
        margin-top: var(--lunar-card-gutter, 8px);
      }
      .container > ::slotted([slot='content']) {
        position: relative;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 100%;
        height: 100%;
        z-index: 1;
        margin-top: var(--lunar-card-header-height, 48px);
        /* margin-bottom: var(--lunar-card-gutter, 8px); */
        flex: 1;
      }
    `;
  }
}

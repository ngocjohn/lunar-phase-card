import { css, CSSResultGroup, html, LitElement, PropertyValues, TemplateResult } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';

import { SECTION } from '../../const';
import { CardAppareance } from '../../types/config/lunar-phase-card-config';

@customElement('lunar-card')
export class Card extends LitElement {
  @property({ attribute: false }) public appearance!: CardAppareance;
  @property({ type: Number }) public cardWidth = 0;
  @property({ type: Number }) public cardHeight = 0;
  @property({ type: Boolean }) public calendarPopup = false;
  @property({ type: String }) public activePage?: SECTION;
  @property({ type: Boolean, reflect: true }) public changingContent = false;

  protected willUpdate(_changedProperties: PropertyValues): void {
    if (_changedProperties.has('cardWidth') || _changedProperties.has('cardHeight')) {
      if (this.appearance.compact_view === true) {
        return;
      }
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
    const isCompact = appearance?.compact_view === true;
    const compactAndBase = isCompact && this.activePage === SECTION.BASE;
    const classes = {
      container: true,
      '--no-header': appearance?.hide_header === true || hasPopup || compactAndBase,
      '--has-popup': hasPopup,
      '--compact': isCompact,
      '--changing-content': this.changingContent,
    };
    return classMap(classes);
  }

  static get styles(): CSSResultGroup {
    return css`
      :host {
        width: 100%;
        height: 100%;
        display: block;
        overflow: hidden;
      }

      .container {
        position: relative;
        box-sizing: border-box;
        height: 100%;
        width: 100%;
        display: flex;
        align-items: center;
        flex-direction: column;
      }

      .container.--compact {
        min-height: 180px;
      }
      /* .container {
        min-height: 235px;
      } */
      .container > ::slotted([slot='header']) {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        width: 100%;
        padding-inline-start: var(--lunar-card-gutter, 8px);
      }

      .container.--no-header > ::slotted([slot='header']),
      .container.--has-popup > ::slotted([slot='header']) {
        display: none;
      }
      .container.--no-header > ::slotted([slot='content']),
      .container.--has-popup > ::slotted([slot='content']) {
        margin-top: 0 !important;
      }

      .container > ::slotted([slot='content']) {
        position: relative;
        /* display: flex; */
        align-items: center;
        /* justify-content: center; */
        width: 100%;
        /* height: 100%; */
        margin-top: var(--lunar-card-header-height);
        flex: 1;
        /* z-index: 1; */
        /* padding-inline: var(--lunar-card-padding); */
      }

      .container.--changing-content > ::slotted([slot='content']) {
        animation: fade-in 0.3s ease-in-out;
        animation-fill-mode: forwards;
      }
    `;
  }
}

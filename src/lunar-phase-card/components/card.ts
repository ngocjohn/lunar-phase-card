import { css, CSSResultGroup, html, PropertyValues, TemplateResult } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';

import { SECTION } from '../../const';
import { CardAppearance } from '../../types/config/lunar-phase-card-config';
import { LunarBaseCard } from '../base-card';

@customElement('lunar-card')
export class Card extends LunarBaseCard {
  @property({ type: Number }) public cardWidth = 0;
  @property({ type: Number }) public cardHeight = 0;
  @property({ type: Boolean }) public calendarPopup = false;
  @property({ type: String }) public activePage?: SECTION;
  @property({ attribute: false }) private appearance!: CardAppearance;
  @property({ type: Boolean, reflect: true }) public changingContent = false;

  @state() private _contentMinHeight = 'initial';

  protected willUpdate(_changedProperties: PropertyValues): void {
    if (_changedProperties.has('cardWidth') || _changedProperties.has('cardHeight')) {
      const { compact_view, hide_buttons } = this.appearance || {};
      if (compact_view === true || hide_buttons === true) {
        return;
      }
      const hasTopMargin = this.appearance.hide_buttons !== true;
      const idealContentHeight = this.cardWidth * 0.5 - (hasTopMargin ? 44 : 0);
      const minHeight = Math.max(180, idealContentHeight);
      this._contentMinHeight = `${minHeight}px`;
      this.style.setProperty('--lpc-content-min-height', this._contentMinHeight);
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

  private _computeClasses() {
    const _configAppearance = this.appearance;
    const hasPopup = this.calendarPopup;
    const isCompact = _configAppearance?.compact_view === true;
    const isCompactMinimal = isCompact && _configAppearance?.compact_mode === 'minimal';
    const compactAndBase = isCompact && this.activePage === SECTION.BASE;
    const noHeader = _configAppearance?.hide_buttons === true;
    const isChartPage = this.activePage === SECTION.HORIZON;
    const classes = {
      container: true,
      '--no-header': noHeader || hasPopup || compactAndBase,
      '--has-popup': hasPopup,
      '--compact': isCompact,
      '--minimal': isCompactMinimal,
      '--changing-content': this.changingContent,
      '--chart-page': isChartPage,
    };
    return classMap(classes);
  }

  static get styles(): CSSResultGroup {
    return [
      super.styles,
      css`
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

        .container.--compact > ::slotted([slot='content']) {
          min-height: 150px;
        }
        .container.--compact.--minimal > ::slotted([slot='content']) {
          min-height: inherit;
        }

        .container > ::slotted([slot='header']) {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          width: 100%;
          /* padding-inline-start: var(--lunar-card-gutter, 8px); */
        }

        .container.--no-header > ::slotted([slot='header']),
        .container.--has-popup > ::slotted([slot='header']) {
          display: none;
        }
        /* .container.--compact > ::slotted([slot='content']), */
        .container.--no-header > ::slotted([slot='content']),
        .container.--has-popup > ::slotted([slot='content']) {
          margin-top: 0 !important;
        }

        .container > ::slotted([slot='content']) {
          position: relative;
          align-items: center;
          width: 100%;
          margin-top: var(--lunar-card-header-height);
          flex: 1;
        }

        .container.--changing-content > ::slotted([slot='content']) {
          animation: fade-in 500ms ease-in-out;
          animation-fill-mode: forwards;
        }
      `,
    ];
  }
}

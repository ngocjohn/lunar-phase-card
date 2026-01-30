import { html, css, TemplateResult, CSSResultGroup } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { styleMap } from 'lit/directives/style-map.js';

import { SECTION } from '../../const';
import { CardArea } from '../../types/card-area';
import { LunarBaseCard } from '../base-card';

@customElement('lunar-moon-base')
export class LunarMoonBase extends LunarBaseCard {
  constructor() {
    super(CardArea.BASE);
    window.LunarMoonBase = this;
  }

  @property({ type: String, reflect: true }) public activePage?: SECTION;
  @state() private _cardWidth = 0;
  @state() private _cardOffsetTop = 0;
  @state() private _cardHeight = 0;

  private get _isCompactView(): boolean {
    return this.appearance?.compact_view === true;
  }

  protected firstUpdated(): void {
    this._measureCard();
    new ResizeObserver(() => this._measureCard()).observe(this);
  }

  private _measureCard() {
    const { offsetWidth: width, offsetHeight: height, offsetTop: top } = this;
    this._cardWidth = width;
    this._cardOffsetTop = top;
    this._cardHeight = height;
  }

  protected render(): TemplateResult {
    const { moon_position } = this.appearance || {};
    return html`
      <div
        class=${classMap({
          content: true,
          '--compact-view': this._isCompactView,
          '--vertical': this.activePage === SECTION.CALENDAR || moon_position === 'center',
          '--calendar-page': this.activePage === SECTION.CALENDAR,
          '--reverse': moon_position === 'right',
        })}
      >
        <div class="moon-pic" style=${this._computeMoonPicStyle()}>
          <slot name="moon-pic"></slot>
        </div>
        <div class="info">
          <slot name="moon-header"></slot>
          <slot name="moon-info"></slot>
        </div>
      </div>
    `;
  }

  private _computeMoonPicStyle() {
    if (this._isCompactView) {
      return {};
    }

    const width = this._cardWidth;
    const offsetTop = this._cardOffsetTop;
    const availableHeight = width * 0.5 - offsetTop;
    const moonSize = Math.min(width / 3.2, availableHeight, 150);
    // console.debug('moonSize calculation:', { width, offsetTop, availableHeight, moonSize });

    return styleMap({
      'max-width': `${moonSize}px`,
    });
  }

  static get styles(): CSSResultGroup {
    return [
      super.styles,
      css`
        :host {
          display: block;
        }

        .content {
          display: flex;
          gap: var(--lunar-card-gutter);
          padding-inline: var(--lunar-card-padding);
          min-height: var(--lpc-content-min-height, initial);
        }
        .content.--reverse {
          flex-direction: row-reverse;
        }
        .content.--calendar-page {
          padding: 0px !important;
        }
        .content.--vertical {
          display: grid;
          align-items: end;
          justify-items: center;
          gap: calc(var(--lunar-card-gutter) * 0.5);
          /* min-height: inherit; */
        }
        .content.--compact-view > .moon-pic {
          max-width: calc(100% / 3.5);
        }

        .moon-pic {
          /* max-width: 150px; */
          width: 100%;
          height: auto;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .info {
          display: inline-grid;
          grid-template-rows: auto auto;
          align-content: center;
          width: 100%;
        }
        .content.--compact-view .info {
          align-content: space-between;
        }
        .content.--vertical .info {
          width: 100%;
          padding: 0;
        }

        .info ::slotted([slot='moon-header']) {
          min-height: var(--lpc-unit);
        }

        .info ::slotted([slot='moon-info']) {
          z-index: 1;
        }
      `,
    ];
  }
}

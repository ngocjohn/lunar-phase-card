import { clamp } from 'es-toolkit';
import { html, css, LitElement, TemplateResult, PropertyValues } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';
import { deepQuerySelector } from 'shadow-dom-selector';

export interface TooltipPosition {
  x: number;
  y: number;
}
@customElement('lunar-moon-calendar-tooltip')
export class LunarMoonCalendarTooltip extends LitElement {
  @property({ attribute: false }) public dateBoxRect?: DOMRect;
  @property({ attribute: false }) private position: TooltipPosition = { x: 0, y: 0 };
  @query('.tooltip') private tooltipElement!: HTMLElement;

  protected async firstUpdated(_changedProperties: PropertyValues): Promise<void> {
    super.firstUpdated(_changedProperties);
    // Initial position adjustment
    if (this.dateBoxRect) {
      this._adjustPosition();
    }
  }

  private async _adjustPosition(): Promise<void> {
    const huiView = deepQuerySelector('hui-view') as HTMLElement;
    if (!huiView || !this.dateBoxRect) return;

    const tooltipElement = this.tooltipElement;

    await new Promise((r) => requestAnimationFrame(() => r(null)));

    const tooltipRect = tooltipElement.getBoundingClientRect();
    const huiViewRect = huiView.getBoundingClientRect();
    const { left, top, width, height } = this.dateBoxRect;

    const padding = 8;
    const gap = 8;

    // initial position in viewport coords
    let x = left + width / 2 - tooltipRect.width / 2;
    let y = top + height + gap;

    // bounds in viewport coords (IMPORTANT: right/bottom, not offsetWidth/Height)
    const minX = huiViewRect.left + padding;
    const maxX = huiViewRect.right - tooltipRect.width - padding;

    const minY = huiViewRect.top + padding;
    const maxY = huiViewRect.bottom - tooltipRect.height - padding;

    x = clamp(x, minX, maxX);
    y = clamp(y, minY, maxY);

    this.style.setProperty('--tooltip-x', `${x}px`);
    this.style.setProperty('--tooltip-y', `${y}px`);

    tooltipElement.classList.replace('hide', 'fade-in');
  }

  protected render(): TemplateResult {
    return html`
      <div id="shadow-container" @click=${() => this._handleClose()}></div>
      <div class="tooltip hide">
        <slot name="moon-header"> </slot>
        <slot name="phase-name"></slot>
        <slot name="moon-pic"></slot>
        <slot name="moon-info"></slot>
      </div>
    `;
  }

  private _handleClose(): void {
    this.tooltipElement.classList.add('fade-out');
    this.tooltipElement.addEventListener(
      'animationend',
      () => {
        this.dispatchEvent(new CustomEvent('closing', { bubbles: true, composed: true }));
      },
      { once: true }
    );
  }

  static styles = css`
    :host {
      position: fixed;
      top: var(--tooltip-y, 50px);
      left: var(--tooltip-x, 50px);
      z-index: 1000;
      pointer-events: auto;
    }
    #shadow-container {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: rgba(0, 0, 0, 0.15);
      /* backdrop-filter: blur(2px); */
      z-index: -1;
      animation-duration: 500ms;
      animation-fill-mode: both;
      animation-name: fadeIn;
    }
    .tooltip.hide {
      visibility: hidden;
    }
    .tooltip {
      display: flex;
      flex-direction: column;
      background-color: rgba(var(--rgb-card-background-color), 0.95);
      border-radius: var(--ha-card-border-radius, var(--ha-border-radius-lg));
      padding: 1rem;
      height: fit-content;
      min-width: 200px;
      overflow: hidden;
      backdrop-filter: blur(4px);
    }
    .tooltip ::slotted([slot='moon-header']) {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      font-weight: bold;
      font-size: 1.2em;
      padding-inline: 1em;
      /* margin-bottom: 8px; */
      text-align: center;
    }
    .tooltip ::slotted([slot='phase-name']) {
      font-weight: normal !important;
      margin-top: 0.2em !important;
      text-align: center;
      color: var(--secondary-text-color, #666) !important;
    }

    .tooltip ::slotted([slot='moon-pic']) {
      align-self: center;
      max-width: 150px;
      width: 100%;
      margin-block: 0.5em;
    }

    /* Card fade-in and fade-out animations */
    .fade-in {
      animation: fadeIn 0.2s ease-in;
    }

    .fade-out {
      animation: fadeOut 0.3s ease-in-out;
    }

    .clip-from-side {
      animation: clipFromSide 1s ease-in-out forwards;
    }

    @keyframes fadeIn {
      from {
        opacity: 0;
      }
      to {
        opacity: 1;
      }
    }

    @keyframes fadeOut {
      from {
        opacity: 1;
        transform: scale(1);
      }
      to {
        opacity: 0;
        transform: scale(0.5);
      }
    }

    @keyframes clipFromSide {
      from {
        clip-path: inset(0 0 0 0);
      }
      to {
        clip-path: inset(0 100% 0 100%);
      }
    }
  `;
}

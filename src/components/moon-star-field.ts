import { html, css, LitElement, CSSResultGroup, PropertyValues } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';

import { LunarPhaseCard } from '../lunar-phase-card';

@customElement('lunar-star-field')
export class LunarStarField extends LitElement {
  @property({ attribute: false }) _card!: LunarPhaseCard;
  @state() _baseCardReady!: boolean;
  @state() private count: number = 10;

  protected firstUpdated(_changedProperties: PropertyValues): void {
    super.firstUpdated(_changedProperties);
  }

  protected updated(_changedProperties: PropertyValues): void {
    super.updated(_changedProperties);
    if (_changedProperties.has('_baseCardReady') && this._baseCardReady) {
      setTimeout(() => {
        this._createStarfield();
      }, 1000);
    }
  }

  static get styles(): CSSResultGroup {
    return [
      css`
        #starfield {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
          overflow: hidden;
          z-index: 0;
        }

        .big-star,
        .star {
          position: absolute;
          width: 2px;
          height: 2px;
          background: white;
          border-radius: 50%;
          opacity: 0;
          animation: blink 1s infinite ease-in-out;
        }

        .big-star {
          width: 6px;
          height: 6px;
        }

        @keyframes blink {
          0%,
          100% {
            opacity: 0;
          }
          50% {
            opacity: 0.3;
          }
        }
      `,
    ];
  }
  protected render() {
    if (!this._card._cardReady) return html``;
    return html`<div id="starfield"></div>`;
  }

  private _createStarfield(): void {
    const starfield = this.shadowRoot?.getElementById('starfield');
    if (!starfield) return;

    const numberOfStars = this.count;
    starfield.innerHTML = ''; // Clear previous stars

    for (let i = 0; i < numberOfStars; i++) {
      const star = document.createElement('div');
      star.classList.add('star');

      // Random position
      const x = Math.random() * starfield.offsetWidth;
      const y = (Math.random() * starfield.offsetHeight) / 4;

      // Random blink delay
      const delay = 3 + Math.random() * 3;
      star.style.left = `${x}px`;
      star.style.top = `${y}px`;
      star.style.animationDelay = `${delay}s`;
      starfield.appendChild(star);
    }
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'lunar-star-field': LunarStarField;
  }
}

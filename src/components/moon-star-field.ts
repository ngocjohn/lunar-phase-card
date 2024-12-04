import { html, css, LitElement, CSSResultGroup, PropertyValues } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';

import { LunarPhaseCard } from '../lunar-phase-card';

@customElement('moon-star-field')
export class MoonStarField extends LitElement {
  @property({ attribute: false }) _card!: LunarPhaseCard;
  @state() public count: number = 30;

  protected firstUpdated(_changedProperties: PropertyValues): void {
    super.firstUpdated(_changedProperties);
    this._createStarfield();
  }

  static get styles(): CSSResultGroup {
    return [
      css`
        #starfield {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 20%;
          pointer-events: none;
          overflow: hidden;
          z-index: 0;
        }

        .star {
          position: absolute;
          width: 2px;
          height: 2px;
          background: white;
          border-radius: 50%;
          opacity: 0;
          animation: blink 1s infinite ease-in-out;
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
      const y = Math.random() * starfield.offsetHeight;

      // Random blink delay
      const delay = 20 + Math.random() * 5;
      star.style.left = `${x}px`;
      star.style.top = `${y}px`;
      star.style.animationDelay = `${delay}s`;
      starfield.appendChild(star);
    }
  }
}

import { css, CSSResultGroup, html, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';

import { LunarBaseElement } from '../base-element';

function random(min: number, max: number, floating?: boolean): number {
  if (floating) {
    return Math.random() * (max - min) + min;
  }
  const minCeiled = Math.ceil(min);
  const maxFloored = Math.floor(max);
  return Math.floor(Math.random() * (maxFloored - minCeiled) + minCeiled);
}

type BaseParticle = {
  x: string;
  delay: string;
  duration?: string;
};

type Star = BaseParticle & {
  type: 'star';
  y: string;
  size: string;
  opacity: string;
};

@customElement('moon-stars-sky')
export class MoonStarsSky extends LunarBaseElement {
  @property({ type: Boolean }) public disabled = false;

  @state() _isDark: boolean = false;
  @state() _containerHeight: number = 0;

  private _stars: Star[] = [];
  private _resizeObserver?: ResizeObserver;

  public connectedCallback(): void {
    super.connectedCallback();

    this._resizeObserver?.disconnect();
    this._resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0];
      const height = Math.round(entry?.contentRect.height || 0);

      if (this._containerHeight !== height) {
        this._containerHeight = height;
        this._stars = this._computeStars();
      }
    });

    this._resizeObserver.observe(this);
  }

  public disconnectedCallback() {
    super.disconnectedCallback();
    this._resizeObserver?.disconnect();
  }

  private _computeStars(): Star[] {
    const stars: Star[] = [];
    const starCount = 30;
    const columns = 6;
    const rows = 5;

    for (let i = 0; i < starCount; i++) {
      const col = i % columns;
      const row = Math.floor(i / columns);

      const cellWidth = 100 / columns;
      const cellHeight = 30 / rows;

      const x = random(col * cellWidth + cellWidth * 0.15, (col + 1) * cellWidth - cellWidth * 0.15);

      const y = random(row * cellHeight + cellHeight * 0.15, (row + 1) * cellHeight - cellHeight * 0.15);

      const size = random(1, 3);
      const opacity = random(0.1, 0.8, true);
      const twinkleDelay = random(0, 5, true);

      stars.push({
        type: 'star',
        x: `${x.toFixed(0)}`,
        y: `${y.toFixed(0)}`,
        size: `${size}`,
        opacity: opacity.toFixed(2),
        delay: twinkleDelay.toFixed(1),
      });
    }

    return stars;
  }

  protected render() {
    if (this.disabled) {
      return nothing;
    }

    return html` <div class="night-sky"></div>
      ${this._renderStars()}`;
  }

  private _renderStars() {
    return html`
      ${this._stars.map(
        (star) =>
          html`<div
            class="star"
            style=${styleMap({
              left: `${star.x}%`,
              top: `${star.y}%`,
              width: `${star.size}px`,
              height: `${star.size}px`,
              opacity: star.opacity,
              animationDelay: `${star.delay}s`,
            })}
          ></div>`
      )}
    `;
  }

  static get styles(): CSSResultGroup {
    return [
      css`
        :host {
          --sun-size: var(--weather-forecast-card-effects-sun-size, 140px);
          --sun-spin-duration: var(--weather-forecast-card-effects-sun-spin-duration, 100s);
          --moon-size: var(--weather-forecast-card-effects-moon-size, 80px);
          --sky-visibility: var(--weather-forecast-card-effects-sky-visibility, visible);
          --drop-color-start: color-mix(in srgb, var(--rain-color), transparent 100%);
          --drop-color-end: color-mix(in srgb, var(--rain-color), transparent 40%);
          --drop-height: var(--weather-forecast-card-effects-drop-height, 20px);
          --drop-start-pos-diff-y: 50px;
          --snow-glow-color: var(--snow-color);
          --container-height: 0px; /* Set dynamically in TS */
          display: block;
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          overflow: hidden;
          pointer-events: none;
          z-index: 0;
          box-sizing: border-box;
          border-radius: var(--ha-card-border-radius, var(--ha-border-radius-lg));
        }
        :host(:not([dark-mode])) {
          --sun-color: var(--weather-forecast-card-effects-sun-color, #facc15);
          --sun-ray-color: var(--weather-forecast-card-effects-sun-ray-color, rgba(253, 224, 71, 0.4));
          --sun-ray-opacity: 0.25;
          --moon-color: var(--weather-forecast-card-effects-moon-color, rgba(220, 220, 230, 1));
          --star-color: var(--weather-forecast-card-effects-star-color, #ffffff);
          --snow-color: var(--weather-forecast-card-effects-snow-color, #cbd5e1);
          --glow-intensity: 0.9;
          --rain-color: var(--weather-forecast-card-effects-rain-color, #2563eb);
          --clear-sky-color: var(--weather-forecast-card-effects-clear-sky-color, rgba(30, 130, 230, 0.6));
          --clear-sky-accent: var(--weather-forecast-card-effects-clear-sky-accent, rgba(100, 180, 240, 0.45));
          --clear-sky-horizon: var(--weather-forecast-card-effects-clear-sky-horizon, rgba(210, 235, 255, 0.3));
          --clear-night-sky-color: var(--weather-forecast-card-effects-clear-night-sky-color, rgba(49, 46, 129, 0.7));
          --clear-night-sky-accent: var(
            --weather-forecast-card-effects-clear-night-sky-accent,
            rgba(88, 28, 135, 0.55)
          );
          --clear-night-horizon: var(--weather-forecast-card-effects-clear-night-horizon, rgba(236, 72, 153, 0.4));
        }

        :host([dark-mode]) {
          --sun-color: var(--weather-forecast-card-effects-sun-color, #fbbf24);
          --sun-ray-color: var(--weather-forecast-card-effects-sun-ray-color, rgba(251, 191, 36, 0.5));
          --sun-ray-opacity: 0.15;
          --moon-color: var(--weather-forecast-card-effects-moon-color, rgba(220, 220, 230, 1));
          --star-color: var(--weather-forecast-card-effects-star-color, #ffffff);
          --snow-color: var(--weather-forecast-card-effects-snow-color, #ffffff);
          --glow-intensity: 0.6;
          --rain-color: var(--weather-forecast-card-effects-rain-color, #6cb4ee);
          --clear-sky-color: var(--weather-forecast-card-effects-clear-sky-color, rgba(3, 105, 161, 0.8));
          --clear-sky-accent: var(--weather-forecast-card-effects-clear-sky-accent, rgba(7, 89, 133, 0.6));
          --clear-sky-horizon: var(--weather-forecast-card-effects-clear-sky-horizon, rgba(12, 74, 110, 0.4));
          --clear-night-sky-color: var(--weather-forecast-card-effects-clear-night-sky-color, rgba(10, 15, 40, 0.85));
          --clear-night-sky-accent: var(--weather-forecast-card-effects-clear-night-sky-accent, rgba(20, 30, 80, 0.6));
          --clear-night-horizon: var(--weather-forecast-card-effects-clear-night-horizon, rgba(40, 25, 100, 0.4));
        }
        .night-sky {
          position: absolute;
          visibility: var(--sky-visibility);
          z-index: 0;
          top: 0;
          left: 0;
          right: 0;
          height: 100%;
          border-radius: inherit;
          /* background: linear-gradient(
            180deg,
            var(--clear-night-sky-color) 0%,
            var(--clear-night-sky-accent) 50%,
            var(--clear-night-horizon) 100%
          ); */
        }

        .night-sky::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: radial-gradient(circle at 70% 20%, rgba(255, 255, 255, 0.15) 0%, transparent 60%);
          pointer-events: none;
        }

        .star {
          position: absolute;
          background: var(--star-color);
          border-radius: 50%;
          animation: twinkle 3s ease-in-out infinite;
          box-shadow: 0 0 3px 1px var(--star-color);
        }

        @keyframes twinkle {
          0%,
          100% {
            opacity: var(--star-opacity, 1);
          }
          50% {
            opacity: 0.3;
          }
        }
      `,
    ];
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'moon-stars-sky': MoonStarsSky;
  }
}

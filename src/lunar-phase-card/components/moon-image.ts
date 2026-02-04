import { html, css, TemplateResult, LitElement } from 'lit';
import { customElement, property, query, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';

import { MoonImage } from '../../types/config/chart-config';
// import { LunarBaseElement } from '../base-element';

@customElement('lunar-moon-image')
export class LunarMoonImage extends LitElement {
  @property({ attribute: false }) public imageData!: MoonImage;

  @query('.moon-image img') private _imgElement!: HTMLImageElement;

  @state() public _hover = false;
  @state() public _focused = false;

  private _touchStarted = false;

  public connectedCallback(): void {
    super.connectedCallback();
    window.LunarMoonPic = this;
  }

  protected firstUpdated(): void {
    if (this._imgElement) {
      this._imgElement.addEventListener('dragstart', (e) => e.preventDefault());
      this._imgElement.addEventListener('contextmenu', (e) => e.preventDefault());
      this._imgElement.draggable = false;

      this._imgElement.addEventListener('focus', () => {
        this._focused = true;
      });
      this._imgElement.addEventListener('blur', () => {
        this._focused = false;
      });

      this._imgElement.addEventListener(
        'touchstart',
        () => {
          this._touchStarted = true;
        },
        { passive: true }
      );

      this._imgElement.addEventListener('touchend', () => {
        setTimeout(() => {
          this._touchStarted = false;
        }, 100);
      });

      this._imgElement.addEventListener('mouseenter', () => {
        if (this._touchStarted) return;
        this._hover = true;
      });
      this._imgElement.addEventListener('mouseleave', () => {
        this._hover = false;
        this.style.removeProperty('--pointer-x');
        this.style.removeProperty('--pointer-y');
      });
      this._imgElement.addEventListener('mousemove', this._handlePointerMove.bind(this));
    }
  }

  private _handlePointerMove(event: MouseEvent) {
    if (!this._hover) return;
    const rect = this._imgElement.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const xPercent = (x / rect.width) * 100;
    const yPercent = (y / rect.height) * 100;
    this.style.setProperty('--pointer-x', `${xPercent}%`);
    this.style.setProperty('--pointer-y', `${yPercent}%`);
  }

  protected render(): TemplateResult {
    if (!this.imageData) {
      return html``;
    }

    const showOverlay = this._hover || this._focused;
    const imageUrl = this.imageData.moonPic;
    const lightFraction = this.imageData.fraction && this.imageData.fraction >= 60 ? true : false;
    return html`
      <div
        class=${classMap({
          'moon-image': true,
          hovered: showOverlay,
          'light-fraction': lightFraction,
        })}
      >
        <img src="${imageUrl}" ?southern=${this.imageData.southernHemisphere} />
      </div>
    `;
  }

  static get styles() {
    return css`
      :host {
        display: block;
      }
      .moon-image {
        display: flex;
        /* min-width: 100px;
        min-height: 100px; */
        transition: transform 0.5s;
        -webkit-user-select: none;
        -moz-user-select: none;
        user-select: none;
        aspect-ratio: 1;
        flex-shrink: 0;
        /* max-width: 150px; */
        position: relative;
      }

      .moon-image img {
        max-width: 100%;
        max-height: 100%;
        object-fit: contain;
        transform: rotate(0deg);
        filter: grayscale(1) brightness(1) drop-shadow(2px 2px 6px rgba(255, 255, 255, 0.2));
      }

      .moon-image img[southern] {
        transform: scaleX(-1) scaleY(-1);
        transition: none;
      }
      .moon-image.hovered img {
        filter: grayscale(1) brightness(2);
        cursor: zoom-in;
      }
      .moon-image.hovered.light-fraction img {
        filter: grayscale(1);
      }
      .moon-image.hovered::after {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: radial-gradient(
          circle at var(--pointer-x, 50%) var(--pointer-y, 50%),
          rgba(255, 255, 255, 0.2),
          rgba(0, 0, 0, 0.4) 60%
        );
        pointer-events: none;
        border-radius: 50%;
        border: 1px solid rgba(255, 255, 255, 0.1);
        transition: background 0.3s;
      }
    `;
  }
}

declare global {
  interface Window {
    LunarMoonPic: LunarMoonImage;
  }
}

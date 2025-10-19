import { html, css, TemplateResult } from 'lit';
import { customElement, property } from 'lit/decorators.js';

import { MoonImage } from '../../types/config/chart-config';
import { LunarBaseElement } from '../base-element';

@customElement('lunar-moon-image')
export class LunarMoonImage extends LunarBaseElement {
  @property({ attribute: false }) public imageData!: MoonImage;

  protected render(): TemplateResult {
    if (!this.imageData) {
      return html``;
    }

    const imageSrc = this.imageData.moonPic;
    return html`
      <div class="moon-image">
        <img src="${imageSrc}" ?southern=${this.imageData.southernHemisphere} />
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
        min-width: 100px;
        min-height: 100px;
        transition: transform 0.5s;
        -webkit-user-select: none;
        -moz-user-select: none;
        user-select: none;
        aspect-ratio: 1;
        flex-shrink: 0;
      }

      .moon-image img {
        max-width: 100%;
        max-height: 100%;
        object-fit: contain;
        transform: rotate(0deg);
        /* Initial state */
        filter: grayscale(1) brightness(1) drop-shadow(2px 2px 6px rgba(255, 255, 255, 0.2));
      }

      .moon-image img[southern] {
        transform: scaleX(-1) scaleY(-1);
        transition: none;
      }
    `;
  }
}

import { LitElement, html, TemplateResult, CSSResultGroup, PropertyValues, unsafeCSS, css } from 'lit';
import { customElement, state, property } from 'lit/decorators.js';
import Swiper from 'swiper';
import { Pagination } from 'swiper/modules';
import swiperStyleCss from 'swiper/swiper-bundle.css';

import mainStyles from '../css/style.css';
import { MoonData, MoonDataItem } from '../types';
import { Moon } from '../utils/moon';

@customElement('lunar-base-data')
export class LunarBaseData extends LitElement {
  @property({ attribute: false }) moon!: Moon;
  @property({ attribute: false }) moonData!: MoonData;
  @state() swiper: Swiper | null = null;

  static get styles(): CSSResultGroup {
    return [
      mainStyles,
      unsafeCSS(swiperStyleCss),
      css`
        #moon-data-container {
          padding-inline: 12px;
        }

        .moon-phase-name {
          font-size: 1.5rem;
          padding: 0.5rem;
        }
      `,
    ];
  }

  protected async firstUpdated(changedProps: PropertyValues): Promise<void> {
    super.firstUpdated(changedProps);
    this.initSwiper();
  }

  private initSwiper(): void {
    const swiperCon = this.shadowRoot?.querySelector('.swiper-container') as HTMLElement;
    if (!swiperCon) return;
    const paginationEl = swiperCon.querySelector('.swiper-pagination') as HTMLElement;
    this.swiper = new Swiper(swiperCon as HTMLElement, {
      modules: [Pagination],
      centeredSlides: true,
      grabCursor: true,
      roundLengths: true,
      spaceBetween: 12,
      keyboard: {
        enabled: true,
        onlyInViewport: true,
      },
      loop: false,
      slidesPerView: 1,
      pagination: {
        el: paginationEl,
        clickable: true,
      },
    });
  }

  protected render(): TemplateResult {
    // const newMoonData = this.baseMoonData;
    const baseMoonData = (this.moonData as MoonData) || {};
    const chunkedData = this._chunkObject(baseMoonData, 5);
    const dataContainer = Object.keys(chunkedData).map((key) => {
      return html`
        <div class="swiper-slide">
          <div class="moon-data">
            ${Object.keys(chunkedData[key]).map((key) => {
              return html`${this.renderItem(key)}`;
            })}
          </div>
        </div>
      `;
    });
    const phaseName = this._renderPhaseName();
    return html`
      <div id="moon-data-container">
        ${phaseName}
        <section id="swiper">
          <div class="swiper-container">
            <div class="swiper-wrapper">${dataContainer}</div>
            <div class="swiper-pagination"></div>
          </div>
        </section>
      </div>
    `;
  }

  private _renderPhaseName(): TemplateResult {
    if (!this.moon.config.hide_header) return html``;
    return html` <div class="moon-phase-name">${this.moon.phaseName}</div> `;
  }

  private _chunkObject = (obj: MoonData, size: number): MoonDataItem => {
    const keys = Object.keys(obj);

    return keys.reduce((chunked: MoonDataItem, key: string, index: number) => {
      const chunkIndex = Math.floor(index / size);

      if (!chunked[chunkIndex]) {
        chunked[chunkIndex] = {} as MoonDataItem;
      }

      chunked[chunkIndex][key] = obj[key];

      return chunked;
    }, {} as MoonDataItem);
  };

  private renderItem(key: string): TemplateResult {
    const { label, value, secondValue } = this.moonData[key];
    return html`
      <div class="moon-data-item">
        <span class="label">${label}</span>
        <div class="value">
          ${secondValue ? html`<span>(${secondValue}) </span>` : ''} ${value}
        </div>
      </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'lunar-base-data': LunarBaseData;
  }
}

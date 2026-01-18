import { html, css, TemplateResult, CSSResultGroup, unsafeCSS, nothing, PropertyValues } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import Swiper from 'swiper';
import { Pagination } from 'swiper/modules';
import swiperStyleCss from 'swiper/swiper-bundle.css';

import { CardArea } from '../../types/card-area';
import { MoonData, MoonDataItem } from '../../types/config/chart-config';
import { objectToChunks } from '../../utils/chunk-object';
// eslint-disable-next-line unused-imports/no-unused-imports
import { getObjectDifferences, logChangedValues } from '../../utils/object-differences';
import { LunarBaseCard } from '../base-card';

@customElement('lunar-moon-data-info')
export class LunarMoonDataInfo extends LunarBaseCard {
  @property({ attribute: false }) public moonData!: MoonData;
  @property({ attribute: false }) public chunkedLimit?: number;
  @state() swiper: Swiper | null = null;

  constructor() {
    super(CardArea.DATABOX);
    window.LunarDataBox = this;
  }

  protected firstUpdated(): void {
    this.initSwiper();
  }

  get isSwiperLocked(): boolean {
    if (!this.swiper) return true;
    return this.swiper.isLocked;
  }

  protected updated(changedProps: PropertyValues): void {
    super.updated(changedProps);
    if (changedProps.has('moonData')) {
      const oldMoonData = changedProps.get('moonData') as MoonData | undefined;
      if (oldMoonData && JSON.stringify(oldMoonData) !== JSON.stringify(this.moonData)) {
        // debug changed values from old to new
        let changed = {};
        changed = getObjectDifferences(oldMoonData, this.moonData);
        if (changed && Object.keys(changed).length !== 0) {
          // console.group('Moon Data Changes');
          // logChangedValues(changed);
          // console.groupEnd();
        }
      }
    }
  }

  protected render(): TemplateResult {
    // const chunkedData = this._chunkObject(this.moonData, this.chunkedLimit || 5);
    const chunkedData = objectToChunks<MoonDataItem>(this.moonData, this.chunkedLimit || 5);
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
    return html`
      <div>
        <div class="swiper-container">
          <div class="swiper-wrapper">${dataContainer}</div>
          <div class="swiper-pagination" ?locked=${this.isSwiperLocked}></div>
        </div>
      </div>
    `;
  }

  private renderItem(key: string): TemplateResult {
    const { label, value, secondValue } = this.moonData[key] as MoonDataItem;
    return html`
      <div class="moon-data-item">
        <span class="label">${label}</span>
        <div class="value">
          ${secondValue && key !== 'direction' ? html`<span>(${secondValue})</span>` : nothing} ${value}
          ${key === 'direction' && secondValue
            ? html`<span>(${secondValue})</span>
                <span class="direction-arrow" style="transform: rotate(${parseInt(value, 0)}deg);">
                  <ha-icon icon="mdi:arrow-up-thin"></ha-icon>
                </span>`
            : nothing}
        </div>
      </div>
    `;
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

  static get styles(): CSSResultGroup {
    return [
      // super.styles,
      unsafeCSS(swiperStyleCss),
      css`
        :host {
          display: block;
          width: 100%;
          padding: 0;
          margin: 0;
          overflow: hidden;
          --swiper-theme-color: var(--lpc-label-font-color, var(--primary-text-color));
        }
        section {
          display: block;
          width: 100%;
          height: auto;
          overflow: hidden;
        }

        .swiper-container {
          width: 100%;
          height: 100%;
          display: block;
          backdrop-filter: blur(4px);
        }
        .swiper-wrapper {
          width: 100%;
          height: 100%;
        }
        .swiper-slide {
          display: flex;
          height: auto;
          width: 100%;
        }

        .swiper-pagination {
          bottom: 0 !important;
          left: 0 !important;
          width: 100% !important;
          height: min-content !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          padding-block: 4px !important;
          position: relative !important;
        }

        .swiper-pagination-bullet {
          background-color: var(--swiper-theme-color);
          transition: all 0.3s ease-in-out !important;
        }

        .swiper-pagination-bullet-active {
          width: 12px !important;
          border-radius: 0.5rem !important;
          opacity: 0.7;
        }

        .moon-data {
          width: 100%;
          box-sizing: border-box;
          margin: 0;
          /* padding-inline: 0.5rem; */
        }

        .moon-data-item {
          display: inline-flex;
          border-bottom: 0.5px solid rgba(from var(--secondary-text-color) r g b / 0.2);
          padding-block: 3px;
          width: 100%;
          /* justify-content: space-between; */
        }

        .moon-data-item:last-child {
          border-bottom: none;
          padding-bottom: 0;
        }

        .moon-data-item span.label {
          display: inline-flex;
          color: var(--lpc-label-font-color, var(--primary-text-color));
          font-size: var(--lpc-label-font-size, auto);
          white-space: nowrap;
          margin-inline: 0 auto;
        }

        .moon-data-item .value {
          display: inline-flex;
          color: var(--lpc-label-font-color, var(--primary-text-color));
          white-space: nowrap !important;
          align-items: center;
          font-weight: 500;
          gap: 4px;
          margin-inline: auto 0;
        }

        .value span {
          font-weight: var(--ha-font-weight-normal, 400);
          font-size: var(--ha-font-size-s, 12px);
          line-height: 1;
          place-self: auto;
        }
        .value span.direction-arrow {
          transition: transform 0.3s ease-in-out;
          color: var(--lpc-label-font-color, var(--secondary-text-color));
        }
      `,
    ];
  }
}

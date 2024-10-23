/* eslint-disable @typescript-eslint/no-explicit-any */
import { LitElement, html, TemplateResult, CSSResultGroup, PropertyValues } from 'lit';
import { customElement, state } from 'lit/decorators.js';

import Swiper from 'swiper';
import { Pagination } from 'swiper/modules';
import { MoonData, MoonDataItem } from '../types';
import { Moon } from '../utils/moon';

import swipercss from '../css/swiper-bundle.css';
import style from '../css/style.css';

@customElement('lunar-base-data')
export class LunarBaseData extends LitElement {
  @state() moon!: Moon;
  @state() swiper: Swiper | null = null;

  protected firstUpdated(changedProps: PropertyValues): void {
    super.firstUpdated(changedProps);
    this.initSwiper();
    // console.log('moonData', this.moon);
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

  render(): TemplateResult {
    // const newMoonData = this.baseMoonData;
    const newMoonData = this.moon.moonData;
    const chunkedData = this._chunkObject(newMoonData, 5);
    const dataContainer = Object.keys(chunkedData).map((key) => {
      return html`
        <div class="swiper-slide">
          <div class="moon-data">${Object.keys(chunkedData[key]).map((key) => this.renderItem(key))}</div>
        </div>
      `;
    });

    return html`
      <section id="swiper">
        <div class="swiper-container">
          <div class="swiper-wrapper">${dataContainer}</div>
          <div class="swiper-pagination"></div>
        </div>
      </section>
    `;
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
    const { label, value, secondValue } = this.moon.moonData[key];
    return html`
      <div class="moon-data-item">
        <span class="label">${label}</span>
        <div class="value">
          ${secondValue ? html`<span class="second-value">(${secondValue}) </span>` : ''} ${value}
        </div>
      </div>
    `;
  }

  // https://lit.dev/docs/components/styles/
  static get styles(): CSSResultGroup {
    return [swipercss, style];
  }
}

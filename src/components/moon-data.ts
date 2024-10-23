/* eslint-disable @typescript-eslint/no-explicit-any */
import { LitElement, html, TemplateResult, CSSResultGroup, PropertyValues } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import swipercss from '../css/swiper-bundle.css';
import style from '../css/style.css';
import Swiper from 'swiper';
import { Pagination } from 'swiper/modules';
import { MoonDataItem } from '../types';
import { Moon } from '../utils/moon';

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

  // protected updated(changedProps: PropertyValues): void {
  //   super.updated(changedProps);
  //   if (changedProps.has('moon') && this.moon) {
  //     console.log('moonData', this.moon.moonData.moonRise);
  //   }
  // }

  protected shouldUpdate(_changedProperties: PropertyValues): boolean {
    if (_changedProperties.has('moon')) {
      return true;
    }
    return false;
  }

  render(): TemplateResult {
    // const newMoonData = this.baseMoonData;
    const newMoonData = this.moon.moonData;
    const createPage = (start: number, end: number) => html`
      <div class="swiper-slide">
        <div class="moon-data">
          ${Object.entries(newMoonData)
            .slice(start, end)
            .map(
              ([, data]) => html`
                <div class="moon-data-item">
                  <span class="label">${data.label}</span>
                  <div class="value">
                    ${data.secondValue ? html`<span class="second-value">(${data.secondValue}) </span>` : ''}
                    ${data.value}
                  </div>
                </div>
              `
            )}
        </div>
      </div>
    `;
    return html`
      <section id="swiper">
        <div class="swiper-container">
          <div class="swiper-wrapper">${createPage(0, 5)} ${createPage(5, 10)}</div>
          <div class="swiper-pagination"></div>
        </div>
      </section>
    `;
  }

  private _chunkObject = (obj: MoonDataItem, size: number): MoonDataItem => {
    const keys = Object.keys(obj);

    return keys.reduce((chunked: MoonDataItem, key: string, index: number) => {
      const chunkIndex = Math.floor(index / size);

      if (!chunked[chunkIndex]) {
        chunked[chunkIndex] = {} as MoonDataItem;
      }

      chunked[chunkIndex][key] = obj[key];

      // console.log('chunked', obj[key]);
      return chunked;
    }, {} as MoonDataItem);
  };

  private renderItem(item: MoonDataItem): TemplateResult {
    return html`
      <div class="moon-data-item">
        <span class="label">${item.label}</span>
        <div class="value">
          ${item.secondValue ? html`<span class="second-value">(${item.secondValue}) </span>` : ''} ${item.value}
        </div>
      </div>
    `;
  }

  // https://lit.dev/docs/components/styles/
  public static get styles(): CSSResultGroup {
    return [swipercss, style];
  }
}

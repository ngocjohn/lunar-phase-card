/* eslint-disable @typescript-eslint/no-explicit-any */
import { LitElement, html, TemplateResult, CSSResultGroup } from 'lit';
import { customElement, property } from 'lit/decorators';
import swipercss from '../css/swiper-bundle.css';
import style from '../css/style.css';
import Swiper from 'swiper';
import { Pagination } from 'swiper/modules';

@customElement('lunar-base-data')
export class LunarBaseData extends LitElement {
  @property({ type: Object }) private baseMoonData: Record<string, any> = {};

  @property({ type: Object })
  swiper: Swiper | null = null;

  firstUpdated(): void {
    if (!this.swiper) {
      this.initSwiper();
    }
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
      spaceBetween: 16,
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
    const moonData = this.baseMoonData;
    const createPage = (start: number, end: number) => html`
      <div class="swiper-slide">
        <div class="moon-data">
          ${Object.entries(moonData)
            .slice(start, end)
            .map(
              ([, data]) => html`
                <div class="moon-data-item">
                  <span class="label">${data.label}</span>
                  <div class="value">
                    ${data.secondValue ? html`<span class="second-value">(${data.secondValue}) </span>` : ''}
                    ${data.value} ${data.unit}
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

  // https://lit.dev/docs/components/styles/
  public static get styles(): CSSResultGroup {
    return [swipercss, style];
  }
}

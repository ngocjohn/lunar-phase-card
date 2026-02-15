import { html, TemplateResult, CSSResultGroup, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';

import './moon-data-info';
import { CardArea } from '../../types/card-area';
import { MoonData } from '../../types/config/chart-config';
import { LunarBaseCard } from '../base-card';

@customElement('lunar-moon-compact-view')
export class LunarMoonCompactView extends LunarBaseCard {
  @property({ attribute: false }) public moonData!: MoonData;
  @property({ attribute: false }) public moonImage!: TemplateResult;
  @property({ attribute: false }) public header!: TemplateResult;

  constructor() {
    super(CardArea.COMPACT);
  }
  protected render(): TemplateResult {
    if (this._configAppearance.compact_mode === 'minimal') {
      return this._renderMinimalCompactView();
    } else if (this._configAppearance.compact_mode === 'moon-only') {
      return html`<div
          id="compact-main"
          class="moon-only-container"
          style=${this._computeMoonOnlyStyle()}
          @click=${this._toggleMinimalData}
        >
          ${this.renderMoonImage()}
        </div>
        ${this._renderDataMinial()}`;
    }
    // default to standard
    return this._renderStandardCompactView();
  }

  private _renderStandardCompactView(): TemplateResult {
    const moonData = this.moonData;
    const items = {
      moonAge: 'mdi:progress-clock',
      moonRise: 'mdi:weather-moonset-up',
      moonSet: 'mdi:weather-moonset',
    };

    const renderCompactItem = (key: string): TemplateResult => {
      const { label, value } = moonData[key];
      const icon = items[key];
      return html`
        <div class="compact-item">
          <div class="icon-value">
            <ha-icon .icon=${icon}></ha-icon>
            ${value}
          </div>
          ${this._configAppearance?.hide_compact_label ? html`` : html` <span class="value">${label}</span>`}
        </div>
      `;
    };
    return html`
      <lunar-moon-base
        id="compact-main"
        .moon=${this.moon}
        .store=${this.store}
        .config=${this.config}
        .hass=${this.hass}
      >
        <div slot="moon-pic" @click=${this._toggleMinimalData} class="pic-con">${this.renderMoonImage()}</div>
        ${this.header}

        <div class="compact-view-container" slot="moon-info">
          <div class="moon-fraction">${moonData.moonFraction!.value} ${this.store.translate('card.illuminated')}</div>
          <div class="compact-view-items">${Object.keys(items).map((key) => renderCompactItem(key))}</div>
        </div>
      </lunar-moon-base>
      ${this._renderDataMinial()}
    `;
  }

  private _renderMinimalCompactView(): TemplateResult {
    const { phaseName } = this.moon;
    const timeRange = this.moon._getMinimalData();
    const moonImage = this.renderMoonImage();

    const renderCompactItem = (key: string, secondValue: boolean = false): TemplateResult => {
      const { label, value, secondValue: second } = timeRange[key];
      return html`
        <div class="compact-item-minimal">
          <div class="item-value">
            <span class="value">${label}</span>
            <span class="label">${value}</span>
          </div>
          <span class="second-value">${secondValue && second ? second : '\u00A0'}</span>
        </div>
      `;
    };
    return html`
      <div id="compact-main" class="compact-view-minimal">
        ${renderCompactItem('start', true)}
        <div class="minimal-moon-image-container" @click=${this._toggleMinimalData}>
          ${moonImage}
          <span class="minimal-title">${phaseName}</span>
        </div>
        ${renderCompactItem('end', true)}
      </div>
      ${this._renderDataMinial()}
    `;
  }

  private _renderDataMinial(): TemplateResult {
    const addedData = { ...this.moonData };

    return html`
      <div class="moon-data-minimal" ?hidden=${true} @click=${this._toggleMinimalData}>
        ${this.renderTimeClock()}

        <lunar-moon-data-info .moonData=${addedData} .chunkedLimit=${4}></lunar-moon-data-info>
      </div>
    `;
  }

  private _toggleMinimalData(): void {
    const root = this.shadowRoot;
    if (!root) return;

    const minimal = root.querySelector('#compact-main') as HTMLElement;
    const details = root.querySelector('.moon-data-minimal') as HTMLElement;
    // console.debug('Toggling minimal data view', { minimal, details });

    if (!minimal || !details) return;

    const showDetails = minimal.hasAttribute('hidden');

    if (showDetails) {
      details.setAttribute('hidden', '');
      minimal.removeAttribute('hidden');
      minimal.style.animation = 'fade-in 400ms ease-in-out';
      minimal.addEventListener(
        'animationend',
        () => {
          minimal.style.animation = '';
        },
        { once: true }
      );
    } else {
      minimal.setAttribute('hidden', '');
      details.removeAttribute('hidden');
      details.style.animation = 'fade-in 400ms ease-in-out';
      details.addEventListener(
        'animationend',
        () => {
          details.style.animation = '';
        },
        { once: true }
      );
    }
  }

  private _computeMoonOnlyStyle() {
    const moonSize = this._configAppearance.moon_size || 100;
    const position = this._configAppearance.moon_position || 'center';
    const justifyContent = position === 'left' ? 'flex-start' : position === 'right' ? 'flex-end' : 'center';
    return `--moon-justify-content: ${justifyContent}; --moon-size: ${moonSize}%`;
  }

  static get styles(): CSSResultGroup {
    return [
      super.styles,
      css`
        :host {
          display: inline-grid;
          display: -ms-inline-grid;
        }
        .pic-con {
          user-select: all;
          cursor: pointer;
          padding: calc(var(--lunar-card-gutter, 8px) / 2);
        }

        .compact-view-container {
          display: flex;
          width: 100%;
          gap: var(--lunar-card-padding);
          /* margin-inline: 8px; */
          overflow: hidden;
          --mdc-icon-size: 17px;
          flex-direction: column;
          align-items: flex-start;
          justify-content: space-between;
        }
        .moon-fraction {
          font-size: var(--ha-font-size-l);
          letter-spacing: 1px;
          color: rgba(from var(--primary-text-color) r g b / 0.8);
          margin-inline-start: var(--lunar-card-gutter);
        }
        .compact-view-items {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: var(--lunar-card-gutter);
          width: 100%;
        }

        .compact-item {
          display: flex;
          width: 100%;
          flex-direction: column;
          font-size: var(--lpc-label-font-size, var(--ha-font-size-m));
          color: var(--lunar-card-label-font-color, var(--primary-text-color));
          text-transform: var(--lunar-card-label-text-transform, none);
          align-items: center;
          justify-content: space-between;
        }
        .compact-item .icon-value {
          display: flex;
          align-items: flex-end;
          flex-direction: row;
        }

        .compact-item span.value {
          color: rgba(from var(--primary-text-color) r g b / 0.7);
        }

        .compact-view-minimal {
          display: inline-grid;
          grid-template-columns: 1fr 27% 1fr;
          /* width: 100%; */
          /* height: 100%;
            padding: var(--lunar-card-gutter);
            padding-block: initial; */
        }

        .moon-data-minimal {
          display: inline-grid;
          width: 100%;
          padding: var(--lunar-card-gutter);
          /* padding-bottom: initial; */
          transition: all 300ms ease-in-out;
          flex-direction: column;
          color: var(--lunar-card-label-font-color, var(--primary-text-color));
          justify-items: center;
        }

        .compact-item-minimal {
          display: flex;
          flex-direction: column;
          width: 100%;
          height: 100%;
          text-align: center;
          color: var(--lunar-card-label-font-color, var(--primary-text-color));
          transition: all 0.2s ease-in-out;
          align-items: center;
          justify-content: center;
        }

        .compact-item-minimal:hover {
          transform: scale(1.1);
          color: var(--accent-color);
        }

        .compact-item-minimal > .item-value {
          display: flex;
          flex-direction: column;
        }

        .compact-item-minimal .second-value {
          font-size: smaller;
          min-height: 1rem;
          display: block;
          word-wrap: nowrap;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          opacity: 0;
        }

        .compact-item-minimal:hover > .second-value {
          opacity: 0.6;
        }

        .compact-item-minimal span.value {
          font-size: var(--lunar-card-label-font-size, var(--ha-font-size-m));
          font-weight: 400;
          color: inherit;
          white-space: nowrap;
          overflow: hidden;
        }

        .compact-item-minimal span.label {
          font-weight: 600;
          color: var(--lunar-card-label-font-color, var(--primary-text-color));
          white-space: nowrap;
          overflow: hidden;
          font-size: 1.3rem;
          padding-block: 0.2rem;
        }

        .minimal-moon-image-container {
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          cursor: pointer;
          flex: 0 0 auto;
          margin-block: 8px;
        }

        .minimal-title {
          display: flex;
          width: 100%;
          justify-content: center;
          align-items: center;
          padding-top: 8px;
          text-transform: var(--lunar-card-header-text-transform, capitalize);
          color: var(--lunar-card-header-font-color, var(--primary-text-color));
          white-space: nowrap;
        }
        .moon-only-container {
          display: flex;
          justify-content: var(--moon-justify-content, center);
          align-items: center;
        }
        .moon-only-container > lunar-moon-image {
          width: var(--moon-size, 100%);
          height: auto;
          padding: var(--lunar-card-gutter, 8px);
        }
      `,
    ];
  }
}

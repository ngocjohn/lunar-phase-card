import { css, unsafeCSS } from 'lit';

import { BLUE_BG } from '../../const';
const DEFAULT_BG = {
  url: `
    :host {
      --lpc-bg-image: url(${BLUE_BG});
    }
  `,
};

export const DEFAULT_BG_URL = css`
  ${unsafeCSS(DEFAULT_BG.url)}
`;
export const style = css`
  :host {
    --lpc-scale: 1;
    --lpc-unit: calc(var(--lpc-scale) * 36px);
    --lunar-card-header-height: calc(var(--lpc-unit) + var(--lunar-card-gutter));
    --lunar-card-padding: 12px;
    --lunar-card-gutter: 8px;
    --mdc-icon-button-size: var(--lpc-unit);
    --mdc-icon-size: calc(var(--lpc-unit) * 0.6);
    --swiper-pagination-bullet-inactive-color: var(--secondary-text-color);
    --swiper-pagination-bottom: 0;
  }

  *,
  *::before,
  *::after {
    box-sizing: border-box;
  }

  ha-icon {
    width: calc(var(--lpc-unit) * 0.6);
    height: calc(var(--lpc-unit) * 0.6);
    display: flex;
    align-items: center;
  }

  ha-icon-button,
  .mdc-icon-button {
    width: var(--lpc-unit) !important;
    height: var(--lpc-unit) !important;
    color: var(--lpc-icon-color, var(--secondary-text-color));
    opacity: 0.5;
    transition: color 0.25s;
  }

  ha-icon-button[color] {
    color: var(--lpc-accent-color, var(--accent-color)) !important;
    opacity: 1 !important;
  }

  ha-icon-button[inactive] {
    opacity: 0.5;
  }

  ha-icon-button:hover,
  ha-icon-button[active] {
    color: var(--lpc-primary-color, var(--primary-color)) !important;
    opacity: 0.8 !important;
  }

  ha-icon-button ha-icon {
    display: flex;
  }

  @keyframes fade-in {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }
`;

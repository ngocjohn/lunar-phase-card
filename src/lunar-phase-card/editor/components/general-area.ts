import { CSSResultGroup, TemplateResult, css, html, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';

import { CARD_VERSION } from '../../../const';
import { fireEvent } from '../../../ha';
import { BaseEditor } from '../base-editor';
import { EditorArea } from '../editor-area-config';

declare global {
  interface HASSDomEvents {
    'area-changed': { area?: string };
  }
}

@customElement('lpc-general-area')
export class GeneralArea extends BaseEditor {
  constructor() {
    super();
  }

  @property() public value?: string;
  @state() private _open = false;

  protected render(): TemplateResult {
    const options = this.AreaMenuItems;
    const value = this.value;
    const isDefault = !value || value === EditorArea.DEFAULT;
    const selected = options[value as EditorArea];
    const menuIcon = this._open ? 'mdi:close' : 'mdi:menu';

    return html`
      <div class="config-menu-wrapper">
        <div class="left-icons">
          ${!isDefault
            ? html`<div class="menu-icon click-shrink" @click=${() => this._handleItemClick(EditorArea.DEFAULT)}>
                <div class="menu-icon-inner"><ha-icon icon="mdi:home"></ha-icon></div>
              </div>`
            : nothing}
          <ha-button-menu
            .fullWidth=${true}
            .fixed=${true}
            .activatable=${true}
            .naturalMenuWidth=${true}
            @closed=${(ev: Event) => {
              ev.stopPropagation();
              this._open = false;
            }}
            @opened=${(ev: Event) => {
              ev.stopPropagation();
              this._open = true;
            }}
            @action=${this._handleItemClick}
          >
            <div id="menu-trigger" class="menu-icon click-shrink" slot="trigger">
              <div class="menu-icon-inner"><ha-icon .icon=${menuIcon}></ha-icon></div>
            </div>
            ${Object.entries(options).map(
              ([key, item]) => html`
                <ha-list-item .value=${key} .activated=${this.value === key}> ${item.title} </ha-list-item>
              `
            )}
          </ha-button-menu>
        </div>
        <div class="menu-label">
          <span class="primary">${selected?.title}</span>
          <span class="secondary">${selected?.description}</span>
        </div>
      </div>
      ${isDefault ? this._renderTips() : nothing}
    `;
  }
  private _renderTips(): TemplateResult {
    const options = Object.entries(this.AreaMenuItems).filter(([key]) => key !== EditorArea.DEFAULT);
    return html`
      <div class="tip-content">
        ${options.map(([key, { title, description, icon }]) => {
          return html`
            <div class="tip-item" @click=${() => this._handleItemClick(key)} role="button" tabindex="0">
              <ha-icon icon=${icon}></ha-icon>
              <div>
                <div class="tip-title">${title}</div>
                <span>${description}</span>
              </div>
            </div>
          `;
        })}
      </div>
      <div class="version-footer">Version: ${CARD_VERSION}</div>
    `;
  }

  private _handleItemClick(ev: CustomEvent | string): void {
    const menuKeys = Object.keys(this.AreaMenuItems);
    const value = typeof ev === 'string' ? ev : menuKeys[ev.detail.index];
    console.log('Menu item clicked:', value);
    fireEvent(this, 'area-changed', { area: value });
  }

  static get styles(): CSSResultGroup {
    return [
      super.styles,
      css`
        :host {
          display: block;
          width: 100%;
          box-sizing: border-box;
          margin-bottom: var(--vic-gutter-gap);
        }
        .config-menu-wrapper {
          display: flex;
          align-items: center;
          height: 42px;
          margin-inline: 4px 8px;
          /* padding-block-end: 8px; */
        }
        .config-menu-wrapper .left-icons {
          display: inline-flex;
        }

        .config-menu-wrapper .menu-wrapper {
          display: inline-flex;
          width: 100%;
          height: 100%;
          position: relative;
        }

        .config-menu-wrapper .menu-info-icon-wrapper {
          display: inline-flex;
          /* gap: var(--vic-card-padding); */
          height: 100%;
          align-items: center;
          flex: 0;
        }
        .menu-info-icon-wrapper > .move-sec {
          display: flex;
          --mdc-icon-button-size: 36px;
          --mdc-icon-size: 18px;
          align-items: center;
        }
        ha-icon-button {
          color: var(--primary-text-color);
          /* width: 36px; */
          /* padding: 0; */
          margin: 0;
          /* --mdc-icon-size: 20px; */
          display: flex;
          height: 36px;
          align-items: center;
          align-content: stretch;
          justify-content: center;
        }

        ha-icon-button[disabled] {
          color: var(--disabled-text-color);
        }
        .menu-content-wrapper .menu-info-icon,
        .config-menu-wrapper .menu-icon {
          width: 36px;
          height: 36px;
          display: inline-flex;
          justify-content: center;
          align-items: center;
          border-radius: 50%;
          cursor: pointer;
          color: var(--secondary-text-color);
          padding-inline-end: var(--vic-card-padding);
          /* transition: color 400ms cubic-bezier(0.075, 0.82, 0.165, 1); */
          pointer-events: auto;
        }
        .config-menu-wrapper .menu-icon.active,
        .config-menu-wrapper .menu-icon:hover {
          color: var(--primary-color);
        }

        .config-menu-wrapper .menu-icon-inner {
          position: relative;
          width: var(--vic-icon-size);
          height: var(--vic-icon-size);
          font-size: var(--vic-icon-size);
          border-radius: var(--vic-icon-border-radius);
          display: flex;
          align-items: center;
          justify-content: center;
          background-color: var(--vic-icon-shape-color);
          transition-property: background-color, box-shadow;
          transition-duration: 280ms;
          transition-timing-function: ease-out;
        }

        .config-menu-wrapper .menu-content-wrapper {
          display: flex;
          justify-content: space-between;
          width: 100%;
          align-items: center;
          height: auto;
        }

        .menu-content-wrapper .menu-info-icon {
          padding-inline-end: 0;
        }

        .menu-content-wrapper .menu-info-icon:hover {
          color: var(--primary-color);
          background-color: rgba(var(--rgb-secondary-text-color), 0.1);
          transition: all 200ms ease-in-out;
        }

        ha-icon-button.add-btn {
          background-color: var(--app-header-edit-background-color, #455a64);
          border-radius: 50%;
          height: 24px;
          width: 24px;
        }
        .position-badge {
          display: block;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          line-height: var(--ha-line-height-normal);
          box-sizing: border-box;
          font-weight: var(--ha-font-weight-medium);
          text-align: center;
          font-size: var(--ha-font-size-m);
          background-color: var(--app-header-edit-background-color, #455a64);
          color: var(--app-header-edit-text-color, white);
          &:hover {
            background-color: var(--primary-color);
            color: white;
          }
        }

        .menu-content-wrapper.hidden {
          max-width: 0px;
          overflow: hidden;
          opacity: 0;
          transition: all 400ms cubic-bezier(0.075, 0.82, 0.165, 1);
          max-height: 0px;
        }

        .menu-label {
          display: flex;
          flex-direction: column;
          height: 100%;
          justify-content: space-evenly;
          flex: 1;
        }

        .menu-label .primary {
          font-weight: 500;
          font-size: 1rem;
          white-space: nowrap;
          position: relative;
          text-overflow: ellipsis;
          overflow: hidden;
          text-transform: uppercase;
          line-height: 1;
        }

        .menu-label .secondary {
          color: var(--secondary-text-color);
          /* text-transform: capitalize; */
          letter-spacing: 0.5px;
          font-size: smaller;
          line-height: 150%;
        }

        .menu-selector.hidden {
          max-width: 0;
          overflow: hidden;
          opacity: 0;
        }

        .menu-selector {
          max-width: 100%;
          width: 100%;
          opacity: 1;
          display: flex;
          transition: all 400ms cubic-bezier(0.075, 0.82, 0.165, 1);
        }

        .tip-content {
          display: flex;
          flex-direction: column;
          margin-top: var(--vic-gutter-gap);
          gap: var(--vic-gutter-gap);
        }

        [role='button'] {
          cursor: pointer;
          pointer-events: auto;
        }
        [role='button']:focus {
          outline: none;
        }
        [role='button']:hover {
          background-color: var(--secondary-background-color);
        }

        .tip-item {
          /* background-color: #ffffff; */
          padding: var(--vic-gutter-gap);
          border: 1px solid var(--divider-color);
          border-radius: 6px;
          transition: background-color 0.3s ease;
          display: inline-flex;
          align-items: center;
          &:hover {
            border-color: var(--primary-color);
          }
        }
        /* .tip-item:hover {
        background-color: var(--secondary-background-color);
      } */

        .tip-title {
          font-weight: bold;
          text-transform: capitalize;
          color: var(--rgb-primary-text-color);
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: 100%;
        }
        .tip-title > span {
          color: var(--primary-color) !important;
        }
        .tip-item ha-icon {
          margin-inline-end: var(--vic-gutter-gap);
          color: var(--secondary-text-color);
        }
        .tip-item span {
          color: var(--secondary-text-color);
        }

        .click-shrink {
          transition: transform 0.1s;
        }

        .click-shrink:active {
          transform: scale(0.9);
        }

        .version-footer {
          display: flex;
          justify-content: flex-end;
          align-items: center;
          padding: 0.5rem;
          margin-top: var(--vic-card-padding);
          color: var(--secondary-text-color);
        }
      `,
    ];
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'lpc-general-area': GeneralArea;
  }
}

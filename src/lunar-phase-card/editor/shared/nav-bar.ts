import { LitElement, html, TemplateResult, CSSResultGroup, css, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';

import { ICON } from '../../../const';
import { fireEvent } from '../../../ha';

declare global {
  interface HASSDomEvents {
    'go-back': undefined;
    'primary-action': undefined;
    'secondary-action': undefined;
  }
}

const PrimaryActionType = ['back', 'close'] as const;
type PrimaryActionType = (typeof PrimaryActionType)[number] | 'custom';

const PRIMARY_ICON: Record<PrimaryActionType | string, string> = {
  back: ICON.LEFT,
  close: ICON.CLOSE,
};

export const createSecondaryCodeLabel = (yamlMode: boolean, button: boolean = false): TemplateResult => {
  // const label = yamlMode ? 'Close code editor' : 'Edit YAML';
  const variant = yamlMode ? 'warning' : 'neutral';
  const icon = yamlMode ? 'mdi:table-edit' : 'mdi:code-json';
  const buttonLabel = yamlMode ? 'Close Editor' : 'Edit YAML';
  if (!button) {
    return html` <ha-button size="small" variant=${variant} appearance="filled"> ${buttonLabel} </ha-button> `;
  }
  return html`
    <ha-button size="small" variant=${variant} appearance="filled"><ha-icon .icon=${icon}></ha-icon></ha-button>
  `;
};

@customElement('lpc-nav-bar')
export class NavBar extends LitElement {
  @property({ type: Boolean, attribute: 'hide-primary', reflect: true }) public hidePrimary = false;
  @property({ type: Boolean, attribute: 'hide-secondary', reflect: true }) public hideSecondary = false;
  @property({ type: Boolean, attribute: 'hide-primary-icon', reflect: true }) public hidePrimaryIcon = false;

  @property({ attribute: false }) public primaryAction: string | PrimaryActionType = 'back';
  @property({ attribute: false }) public secondaryAction?: TemplateResult;
  @property({ attribute: false }) public extraActions?: TemplateResult;

  @property() public primaryLabel?: string;
  @property() public subPrimaryLabel?: string;
  @property() public secondaryLabel?: string;

  protected render(): TemplateResult {
    const primaryIcon = PRIMARY_ICON[this.primaryAction] || this.primaryAction;
    return html`
      <div class="header">
        <div class="primary-action">
          <slot name="primary-action">
            ${!this.hidePrimary
              ? html`
                  <div class="back-title">
                    ${!this.hidePrimaryIcon
                      ? html`<ha-icon-button .path=${primaryIcon} @click=${this._onPrimaryAction}></ha-icon-button>`
                      : nothing}
                  </div>
                  <slot name="title">
                    ${this.primaryLabel || this.subPrimaryLabel
                      ? html`<div class="title">
                          ${this.primaryLabel ? html`<span class="primary">${this.primaryLabel}</span>` : nothing}
                          ${this.subPrimaryLabel
                            ? html`<span class="secondary">${this.subPrimaryLabel}</span>`
                            : nothing}
                        </div>`
                      : nothing}
                  </slot>
                `
              : nothing}
          </slot>
        </div>
        <div class="spacer"></div>
        <div class="secondary-action">
          <slot name="secondary-action">
            ${this.extraActions ? this.extraActions : nothing}
            ${!this.hideSecondary
              ? html`
                  <span @click=${this._onSecondaryAction}>
                    ${this.secondaryAction
                      ? this.secondaryAction
                      : html`
                          <ha-button size="small" variant="neutral" appearance="filled">
                            ${this.secondaryLabel}
                          </ha-button>
                        `}
                  </span>
                `
              : nothing}
          </slot>
        </div>
      </div>
    `;
  }

  private _onPrimaryAction(): void {
    fireEvent(this, 'primary-action', undefined);
  }

  private _onSecondaryAction(): void {
    fireEvent(this, 'secondary-action', undefined);
  }

  static get styles(): CSSResultGroup {
    return css`
      :host {
        display: block;
        overflow: hidden;
        min-height: 42px;
        margin: 0.5em auto;
        place-content: center;
      }
      .header {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .primary-action,
      .secondary-action {
        display: flex;
        align-items: center;
        gap: 8px;
      }
      .primary-action {
        flex: auto;
        margin-inline-end: auto;
      }

      .secondary-action {
        max-width: fit-content;
        justify-content: flex-end;
        flex: 0 1 auto;
        flex-wrap: wrap;
      }
      .back-title {
        display: flex;
        align-items: center;
        margin-inline-end: auto;
      }
      .back-title > ha-icon-button {
        color: var(--secondary-text-color);
      }

      ha-icon-button {
        --mdc-icon-button-size: 36px;
        margin-inline-end: 0.5em;
      }
      ::slotted([slot='primary-action']) {
        margin-inline-end: auto;
      }

      ::slotted([slot='secondary-action']) {
        margin-inline-start: auto;
      }

      ha-icon-button[active],
      ha-icon-button:hover {
        color: var(--primary-color);
      }

      .title,
      ::slotted([slot='title']) {
        flex: 1;
        overflow-wrap: anywhere;
        /* line-height: 36px; */
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: flex-start;
      }
      .primary {
        font-size: var(--ha-font-size-l);
        color: var(--primary-text-color);
        font-weight: 500;
        line-height: 1.2;
      }
      .secondary {
        display: block;
        color: var(--secondary-text-color);
        font-size: var(--ha-font-size-m);
        line-height: 1.2;
      }
      .spacer {
        flex: 0 0 16px;
      }
    `;
  }
}

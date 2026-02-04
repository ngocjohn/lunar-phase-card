import { css, CSSResultGroup, html, TemplateResult, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';

import { ICON, SECTION } from '../../const';
import { fireEvent } from '../../ha';
import { CardArea } from '../../types/card-area';
import { LunarBaseCard } from '../base-card';

const SectionsList = [SECTION.BASE, SECTION.CALENDAR, SECTION.HORIZON];
const SECTION_ICON: Record<SECTION, string> = {
  [SECTION.BASE]: ICON.WEATHER,
  [SECTION.CALENDAR]: ICON.CALENDAR,
  [SECTION.HORIZON]: ICON.CHART,
  [SECTION.FULL_CALENDAR]: ICON.CALENDAR,
};

@customElement('lunar-phase-header')
export class LunarHeader extends LunarBaseCard {
  constructor() {
    super(CardArea.HEADER);
  }
  @property({ attribute: false }) public moonName?: string;
  @property({ type: Boolean, reflect: true, attribute: 'hide-buttons' }) public hideButtons?: boolean;
  @property({ attribute: false }) private _buttonDisabled?: boolean;
  @property() public activePage?: SECTION;
  @state() _open = false;

  protected render(): TemplateResult {
    const appearance = this._configAppearance || {};
    const activePage = this.activePage || SECTION.BASE;
    const isCompact =
      (appearance?.compact_view === true && activePage === SECTION.BASE) || appearance?.compact_menu_button === true;
    return html`
      <div class="header" ?compact=${isCompact}>
        <div class="title" ?button-hidden=${this.hideButtons}>${this.moonName}</div>
        ${!this.hideButtons
          ? isCompact
            ? this._renderButtonMenu(activePage)
            : this._renderButtonRow(activePage)
          : nothing}
      </div>
    `;
  }

  private _renderButtonRow(activePage: SECTION): TemplateResult {
    return html`
      <div class="actions">
        ${SectionsList.map((section) => {
          const isActive = section === activePage;
          return html`
            <ha-icon-button
              .path=${SECTION_ICON[section]}
              @click=${this._handleChangeSection}
              ?active=${isActive}
              .title=${section}
              .value=${section}
              ?disabled=${this._buttonDisabled}
            ></ha-icon-button>
          `;
        })}
      </div>
    `;
  }
  private _renderButtonMenu(activePage: SECTION) {
    return html`
      <div class="menu-actions">
        <ha-dropdown
          placement="bottom-end"
          @wa-hide=${(ev: Event) => {
            ev.stopPropagation();
            this._open = false;
          }}
          @wa-show=${(ev: Event) => {
            ev.stopPropagation();
            this._open = true;
          }}
          @wa-select=${this._handleChangeSection.bind(this)}
        >
          <ha-icon-button slot="trigger" class="trigger-icon" .path=${SECTION_ICON[activePage]}></ha-icon-button>
          ${SectionsList.filter((section) => section !== activePage).map((section) => {
            return html`
              <ha-dropdown-item .value=${section} .disabled=${this._buttonDisabled}>
                <ha-svg-icon .path=${SECTION_ICON[section]} slot="icon"></ha-svg-icon>
                ${section.toUpperCase()}
              </ha-dropdown-item>
            `;
          })}
        </ha-dropdown>
      </div>
    `;
  }

  private _handleChangeSection(ev: CustomEvent): void {
    ev.stopPropagation();
    const section: SECTION = (ev.detail as any).item?.value || (ev.target as any).value;
    if (section === this.activePage) {
      return;
    }
    fireEvent(this, 'change-section', { section });
  }
  static get styles(): CSSResultGroup {
    return [
      super.styles,
      css`
        :host {
          display: block;
          width: 100%;
          backdrop-filter: blur(2px);
          height: var(--lunar-card-header-height);
          z-index: 2;
        }
        .header {
          display: flex;
          height: inherit;
          align-items: center;
        }
        :host(:not([hide-buttons])) .header[compact] {
          place-items: anchor-center;
          height: min-content;
        }
        :host([hide-buttons]) .header {
          height: 100%;
        }

        .title {
          overflow: hidden;
          text-overflow: ellipsis;
          color: var(--lpc-header-font-color, var(--primary-text-color));
          text-transform: var(--lpc-header-font-style, none);
          font-size: var(--lpc-header-font-size, var(--ha-font-size-xl, 20px));
          white-space: nowrap;
          margin-inline-start: var(--lunar-card-gutter, 8px);
          margin-inline-end: auto;
          line-height: normal;
        }

        .title[button-hidden] {
          place-self: center;
          margin-inline-start: initial;
        }
        .actions,
        .menu-actions {
          --lpc-icon-color: var(--lpc-header-font-color, var(--secondary-text-color));
          flex-grow: 0;
          flex-shrink: 0;
        }
        .actions {
          display: flex;
        }
        .menu-actions {
          display: block;
        }

        ha-list {
          height: fit-content !important;
          z-index: 10;
        }
        ha-icon-button[active] {
          color: var(--lpc-accent-color, var(--primary-color));
        }
        ha-icon-button.trigger-icon {
          padding: 0 0 !important;
        }
      `,
    ];
  }
}

declare global {
  interface HASSDomEvents {
    'change-section': { section: SECTION };
  }
  interface HTMLElementTagNameMap {
    'lunar-phase-header': LunarHeader;
  }
}

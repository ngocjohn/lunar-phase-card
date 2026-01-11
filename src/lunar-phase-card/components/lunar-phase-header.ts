import { css, CSSResultGroup, html, TemplateResult, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';

import { ICON, SECTION } from '../../const';
import { fireEvent } from '../../ha';
import { CardArea } from '../../types/card-area';
import { CardAppareance } from '../../types/config/lunar-phase-card-config';
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
    window.LunarHeader = this;
  }
  @property({ attribute: false }) public moonName?: string;
  @property({ attribute: false }) public hideButtons?: boolean;
  @property({ attribute: false }) private _buttonDisabled?: boolean;
  @property() public activePage?: SECTION;
  @state() _open = false;

  protected render(): TemplateResult {
    const appearance: CardAppareance = this._configAppearance || {};
    const activePage = this.activePage || SECTION.BASE;
    const isCompact = appearance?.compact_view === true && activePage === SECTION.BASE;
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
              @click=${() => this._handleChangeSection(section)}
              ?active=${isActive}
              .title=${section}
              ?disabled=${this._buttonDisabled}
            ></ha-icon-button>
          `;
        })}
      </div>
    `;
  }
  private _renderButtonMenu(activePage: SECTION): TemplateResult {
    return html`
      <div class="menu-actions">
        <ha-button-menu
          .corner=${'TOP_START'}
          .menuCorner=${'END'}
          .naturalMenuWidth=${true}
          .fullWidth=${true}
          .activatable=${true}
          @closed=${(ev: Event) => {
            ev.stopPropagation();
            this._open = false;
          }}
          @opened=${(ev: Event) => {
            ev.stopPropagation();
            this._open = true;
          }}
        >
          <ha-icon-button slot="trigger" .path=${SECTION_ICON[activePage]}></ha-icon-button>
          ${SectionsList.filter((section) => section !== activePage).map((section) => {
            return html`
              <ha-list-item
                graphic="icon"
                .action=${section}
                @click=${this._handleChangeSection.bind(this, section)}
                .disabled=${this._buttonDisabled}
              >
                <ha-svg-icon .path=${SECTION_ICON[section]} slot="graphic"></ha-svg-icon>
                ${section.toUpperCase()}
              </ha-list-item>
            `;
          })}
        </ha-button-menu>
      </div>
    `;
  }

  private _handleChangeSection(section: SECTION) {
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
        .header[compact] {
          /* align-items: initial; */
          /* margin-inline-start: var(--lunar-card-gutter); */
          place-items: flex-start;
          height: min-content;
        }
        .title {
          overflow: hidden;
          text-overflow: ellipsis;
          font-size: var(--lpc-header-font-size, var(--ha-font-size-xl, 20px));
          white-space: nowrap;
          margin-inline-end: auto;
          margin-inline-start: var(--lunar-card-gutter);
        }

        .header:not([compact]) .title[button-hidden] {
          place-self: center;
          margin-inline-start: initial;
        }

        .actions {
          display: flex;
          flex-grow: 0;
          flex-shrink: 0;
        }
        .menu-actions {
          display: block;
          flex-grow: 0;
          flex-shrink: 0;
        }
        ha-list {
          height: fit-content !important;
          z-index: 10;
        }
        ha-icon-button[active] {
          color: var(--lpc-accent-color, var(--primary-color));
        }
      `,
    ];
  }
}

declare global {
  interface HASSDomEvents {
    'change-section': { section: SECTION };
  }
}

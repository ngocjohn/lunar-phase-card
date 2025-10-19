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
};

@customElement('lunar-phase-header')
export class LunarHeader extends LunarBaseCard {
  constructor() {
    super(CardArea.HEADER);
  }
  @property({ attribute: false }) public moonName?: string;
  @property({ attribute: false }) public hideButtons?: boolean;

  @property() public activePage?: SECTION;
  @state() private _open = false;

  protected render(): TemplateResult {
    const activePage = this.activePage || SECTION.BASE;
    return html`
      <div class="header">
        <div class="title">${this.moonName}</div>
        ${!this.hideButtons
          ? html`
              <div class="actions">
                ${SectionsList.map((section) => {
                  const isActive = section === activePage;
                  return html`
                    <ha-icon-button
                      .path=${SECTION_ICON[section]}
                      @click=${() => this._handleChangeSection(section)}
                      ?active=${isActive}
                      .title=${section}
                    ></ha-icon-button>
                  `;
                })}
              </div>
            `
          : nothing}
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
          box-sizing: border-box;
        }
        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          height: 100%;
          /* padding: 8px 0px 0px; */
          max-height: var(--lunar-card-header-height, 48px);
          box-sizing: border-box;
        }
        .title {
          display: flex;
          align-items: center;
          flex: 1;
          font-size: var(--ha-font-size-xl, 20px);
          /* line-height: 1; */
          /* margin-inline-start: var(--lunar-card-gutter); */
        }
        .actions {
          display: flex;
          align-items: center;
          flex-grow: 0;
          flex-shrink: 0;
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

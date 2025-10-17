import { css, CSSResultGroup, html, TemplateResult, LitElement, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';

import { ICON, SECTION } from '../../const';
import { fireEvent } from '../../ha';
import { COMPONENT } from '../const';

const SECTION_ICON: Record<SECTION, string> = {
  [SECTION.BASE]: ICON.WEATHER,
  [SECTION.CALENDAR]: ICON.CALENDAR,
  [SECTION.HORIZON]: ICON.CHART,
};
const SectionsList = [SECTION.BASE, SECTION.CALENDAR, SECTION.HORIZON];

@customElement(COMPONENT.HEADER)
export class LunarHeader extends LitElement {
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
                    <ha-svg-icon
                      .path=${SECTION_ICON[section]}
                      @click=${() => this._handleChangeSection(section)}
                      ?active=${isActive}
                      .title=${section}
                    ></ha-svg-icon>
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
    return css`
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
        padding: 8px 12px 0px;
        max-height: var(--lunar-card-header-height, 48px);
        box-sizing: border-box;
      }
      .title {
        display: flex;
        align-items: center;
        flex: 1;
        font-size: var(--ha-font-size-2xl, 24px);
        line-height: 1.2;
      }
      .actions {
        display: flex;
        align-items: center;
        gap: var(--lunar-card-gutter);
        flex-grow: 0;
        flex-shrink: 0;
      }
      ha-svg-icon {
        width: 24px;
        height: 24px;
        cursor: pointer;
        opacity: 0.6;
        transition: opacity 0.3s ease;
        color: var(--secondary-text-color);
      }
      ha-svg-icon:hover,
      ha-svg-icon[active] {
        opacity: 1;
        color: var(--primary-color);
      }
    `;
  }
}

declare global {
  interface HASSDomEvents {
    'change-section': { section: SECTION };
  }
  interface HTMLElementTagNameMap {
    [COMPONENT.HEADER]: LunarHeader;
  }
}

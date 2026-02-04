import { html, TemplateResult, CSSResultGroup, css, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';

import './moon-data-info';
import { ICON } from '../../const';
import { fireEvent } from '../../ha';
import { CardArea } from '../../types/card-area';
import { MoonData } from '../../types/config/chart-config';
import { dayFormatter } from '../../utils/helpers';
import { LunarBaseCard } from '../base-card';
import { LunarPhaseCard } from '../lunar-phase-card';

declare global {
  interface HASSDomEvents {
    'popup-show': undefined;
  }
}

@customElement('lunar-moon-calendar-footer')
export class LunarMoonCalendarFooter extends LunarBaseCard {
  constructor() {
    super(CardArea.FOOTER);
  }
  @property({ attribute: false }) public moonData!: MoonData;
  @property({ attribute: false }) private card!: LunarPhaseCard;
  @property({ type: Boolean }) public _footerActive = false;

  protected render(): TemplateResult {
    const isToday = this.card._date.toDateString() === new Date().toDateString();
    const todayToLocale = dayFormatter(0, this._configLocale.language);
    return html`
      <div class="calendar-footer" ?active=${this._footerActive}>
        <div class="inline-btns">
          <ha-icon-button .path=${ICON.CALENDAR} @click="${() => this._handleCalendarPopup()}"> </ha-icon-button>
          <ha-icon-button
            .disabled=${!this.card._selectedDate}
            .path=${ICON.RESTORE}
            @click=${() => (this.card._selectedDate = undefined)}
            style="visibility: ${!isToday ? 'visible' : 'hidden'}"
          >
          </ha-icon-button>
          <ha-icon-button .path=${ICON.LEFT} @click=${() => this.updateDate('prev')}> </ha-icon-button>
        </div>
        <div class="date-name">
          ${this._formatDate(this.card._date)} ${isToday ? html`<span>${todayToLocale}</span>` : nothing}
        </div>

        <div class="inline-btns">
          <ha-icon-button .path=${ICON.RIGHT} @click=${() => this.updateDate('next')}> </ha-icon-button>
          <ha-icon-button
            class="toggle-footer-btn"
            .path=${ICON.CHEVRON_DOWN}
            @click=${() => this._toggleFooter()}
            ?active=${this._footerActive}
          >
          </ha-icon-button>
        </div>
      </div>
      <div class="footer-content" ?active=${this._footerActive}>
        ${!this._footerActive
          ? nothing
          : html`<lunar-moon-data-info .moonData=${this.moonData}></lunar-moon-data-info>`}
      </div>
    `;
  }

  public _toggleFooter(): void {
    this._footerActive = !this._footerActive;
    this.requestUpdate();
  }

  private updateDate(action?: 'next' | 'prev') {
    const date = new Date(this.card._date);
    date.setHours(0, 0, 0, 0);
    if (action === 'next') {
      date.setDate(date.getDate() + 1);
    } else if (action === 'prev') {
      date.setDate(date.getDate() - 1);
    }
    this.card._selectedDate = date;
    this.requestUpdate();
  }

  private _handleCalendarPopup() {
    // Implement calendar popup logic here
    fireEvent(this, 'popup-show');
  }

  static get styles(): CSSResultGroup {
    return [
      super.styles,
      css`
        .calendar-footer {
          height: var(--lpc-unit);
          display: flex;
          flex-direction: row;
          align-items: center;
          background-color: rgba(0, 0, 0, 0.14);
        }
        .calendar-footer .inline-btns {
          display: flex;
          flex-direction: row;
          align-items: center;
          flex: 3;
          justify-content: space-between;
        }
        .calendar-footer .date-name {
          /* font-weight: bold; */
          display: flex;
          flex-direction: column;
          align-items: center;
          line-height: 1.1;
          flex: 3;
        }
        .calendar-footer .date-name span {
          color: var(--secondary-text-color);
          /* font-size: 0.75em; */
        }

        ha-icon-button.toggle-footer-btn[active] {
          transform: rotate(180deg);
          transition: transform 0.3s ease-in-out;
        }
        ha-icon-button.toggle-footer-btn {
          transition: transform 0.3s ease-in-out;
        }

        /* .calendar-footer[active] {
          margin-bottom: var(--lunar-card-gutter);
        } */

        .footer-content {
          display: grid;
          overflow: hidden;
          max-height: 0;
          padding-inline: 0;
          opacity: 0;
          transition: all 0.3s ease-out;
        }

        .footer-content[active] {
          max-height: 300px;
          opacity: 1;
          padding-inline: var(--lunar-card-padding);
          transition: all 0.5s ease-in;
          /* padding-top: var(--lunar-card-gutter); */

          /* margin-top: var(--lunar-card-gutter); */
        }
      `,
    ];
  }
}

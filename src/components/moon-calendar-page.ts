import { formatDate } from 'custom-card-helpers';
import { LitElement, html, CSSResultGroup, TemplateResult, nothing, PropertyValues, css } from 'lit';
import { customElement, state, property } from 'lit/decorators.js';

import { ICON } from '../const';
import styles from '../css/style.css';
import './moon-calendar-popup';
import { dayFormatter } from '../localize/localize';
import { LunarPhaseCard } from '../lunar-phase-card';
import { Moon } from '../utils/moon';

@customElement('lunar-calendar-page')
export class LunarCalendarPage extends LitElement {
  @property({ attribute: false }) card!: LunarPhaseCard;
  @property({ attribute: false }) moon!: Moon;
  @state() _calendarPopup: boolean = false;
  @state() _calendarInfo: boolean = false;

  protected firstUpdated(_changedProperties: PropertyValues): void {
    super.firstUpdated(_changedProperties);
  }

  protected shouldUpdate(_changedProperties: PropertyValues): boolean {
    if (_changedProperties.has('card')) {
      return true;
    }
    return true;
  }

  static get styles(): CSSResultGroup {
    return [
      styles,
      css`
        .title {
          padding-left: var(--lunar-card-padding);
        }

        /* CALENDAR */
        .calendar-container {
          display: block;
          position: relative;
          width: 100%;
          height: 100%;
          overflow: hidden;
        }

        .calendar-container > .calendar-mini-popup {
          display: block;
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 100%;
          height: 100%;
          z-index: 1;
          backdrop-filter: blur(2px);
          opacity: 1;
          transition: all 0.4s ease-in;
        }

        .calendar-mini-popup[hidden] {
          opacity: 0;
          pointer-events: none;
          z-index: -1;
        }

        .calendar-wrapper {
          position: relative;
          display: flex;
          width: 100%;
          flex-direction: column;
          /* gap: 1rem; */
          --calendar-background-color: #ffffff1f;
          z-index: 0;
          align-items: center;
          /* overflow: hidden; */
        }

        .calendar-wrapper > .calendar-info[show='false'] {
          max-height: 0px;
          overflow: hidden;
          transition: all 0.4s ease-in-out;
          opacity: 0;
        }

        .calendar-wrapper > .calendar-info[show='true'] {
          margin-top: 0.5rem;
          max-height: 500px;
          transition: all 0.4s ease-in-out;
          width: 100%;
          padding-inline: 1rem;
        }

        ha-icon-button.calendar-info-btn[active] {
          transform: rotate(180deg);
          transition: transform 0.4s ease-in-out;
        }

        .date-input-wrapper {
          display: flex;
          position: relative;
          align-items: center;
          justify-content: space-between;
          color: var(--lunar-card-label-font-color);
          /* backdrop-filter: blur(4px); */
          background-color: rgba(0, 0, 0, 0.14);
          width: -webkit-fill-available;
          /* --mdc-icon-button-size: 24px; */
          /* padding: 0.5rem; */
        }

        .inline-btns {
          display: flex;
          flex: 3;
          justify-content: space-between;
          color: var(--secondary-text-color);
        }

        .inline-btns > ha-icon-button:hover {
          color: var(--primary-text-color);
        }

        .date-name {
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          flex: 3;
          white-space: nowrap;
          font-size: 1rem;
          font-weight: 400;
        }

        .date-name > span {
          font-size: 0.9rem;
          color: var(--secondary-text-color);
        }

        .date-input-label {
          display: block;
          color: var(--lunar-card-label-font-color);
          font-size: 16px;
          font-weight: 600;
          margin-bottom: 8px;
        }

        .date-input {
          display: block;
          width: fit-content;
          padding: 0.5rem;
          border: 1px solid var(--divider-color);
          border-radius: var(--ha-card-border-radius, 12px);
          color: var(--lunar-card-label-font-color);
          background-color: var(--calendar-background-color);
          transition: all 0.3s ease;
          box-sizing: border-box;
          -webkit-appearance: none;
          -moz-appearance: none;
          appearance: none;
          cursor: pointer;
        }

        .date-input:focus {
          border-color: var(--primary-color);
          outline: none;
        }

        button.date-input-btn {
          cursor: pointer;
          background-color: var(--calendar-background-color);
          border: 1px solid var(--divider-color);
          border-radius: var(--ha-card-border-radius, 12px);
          /* padding: 0.5rem 1rem; */
          color: var(--primary-text-color);
          transition: all 0.3s ease;
          font-weight: 600;
        }

        button.date-input-btn:hover {
          background-color: var(--primary-color);
          color: var(--primary-background-color);
        }
      `,
    ];
  }

  protected render(): TemplateResult {
    const moon = this.card.moon;
    const isToday = this.card._date.toDateString() === new Date().toDateString();
    const todayToLocale = dayFormatter(0, this.card.selectedLanguage);
    const dateInput = html` <div class="date-input-wrapper">
      <div class="inline-btns">
        <ha-icon-button .path=${ICON.CALENDAR} @click="${() => this._handleCalendarPopup()}"> </ha-icon-button>
        <ha-icon-button
          .disabled=${!this.card.selectedDate}
          .path=${ICON.RESTORE}
          @click=${() => (this.card.selectedDate = undefined)}
          style="visibility: ${!isToday ? 'visible' : 'hidden'}"
        >
        </ha-icon-button>
        <ha-icon-button .path=${ICON.LEFT} @click=${() => this.updateDate('prev')}> </ha-icon-button>
      </div>
      <div class="date-name">
        ${formatDate(this.card._date, this.card._locale)} ${isToday ? html`<span>${todayToLocale}</span>` : nothing}
      </div>

      <div class="inline-btns">
        <ha-icon-button .path=${ICON.RIGHT} @click=${() => this.updateDate('next')}> </ha-icon-button>
        <ha-icon-button
          class="calendar-info-btn"
          .path=${ICON.CHEVRON_DOWN}
          @click=${() => (this._calendarInfo = !this._calendarInfo)}
          ?active=${this._calendarInfo}
        >
        </ha-icon-button>
      </div>
    </div>`;
    return html`
      <div class="calendar-container">
        ${this.card.config.hide_buttons ? nothing : this.card.renderHeader()}
        <div class="calendar-wrapper">
          ${this.card.renderMoonImage()}${dateInput}
          <div class="calendar-info" show=${this._calendarInfo}>${this.card.renderMoonData()}</div>
        </div>
        <div class="calendar-mini-popup" ?hidden=${!this._calendarPopup}>
          <lunar-calendar-popup
            .card=${this.card as any}
            .moon=${moon}
            @calendar-action=${this._handleCalAction}
          ></lunar-calendar-popup>
        </div>
      </div>
    `;
  }

  _handleCalAction(event: CustomEvent) {
    event.stopPropagation();
    const detail = event.detail;
    switch (detail.action) {
      case 'close':
        this._handleCalendarPopup();
        break;
      case 'date-select':
        this.card.selectedDate = detail.date;
        this._handleCalendarPopup();
        break;
    }
  }

  private _handleCalendarPopup() {
    if (this.card.config.calendar_modal) {
      this.card._dialogOpen = !this.card._dialogOpen;
    } else {
      if (!this._calendarInfo) {
        this._calendarInfo = true;
        setTimeout(() => {
          this._calendarPopup = !this._calendarPopup;
        }, 100);
      } else {
        this._calendarPopup = !this._calendarPopup;
      }
    }
  }

  private updateDate(action?: 'next' | 'prev') {
    const date = new Date(this.card._date);
    date.setHours(0, 0, 0, 0);
    if (action === 'next') {
      date.setDate(date.getDate() + 1);
    } else if (action === 'prev') {
      date.setDate(date.getDate() - 1);
    }
    this.card.selectedDate = date;
    this.requestUpdate();
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'lunar-calendar-page': LunarCalendarPage;
  }
}

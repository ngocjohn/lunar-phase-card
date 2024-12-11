import { LitElement, html, TemplateResult, CSSResultGroup, css, PropertyValues, nothing } from 'lit';
import { customElement, state, property } from 'lit/decorators.js';
import { DateTime, WeekdayNumbers } from 'luxon';
// Local
import { ICON } from '../const';
import { LunarPhaseCard } from '../lunar-phase-card';
import { Moon } from '../utils/moon';
// styles
import styles from '../css/style.css';

@customElement('lunar-calendar-popup')
export class LunarCalendarPopup extends LitElement {
  @property({ attribute: false }) card!: LunarPhaseCard;
  @property({ attribute: false }) moon!: Moon;
  @state() viewDate = DateTime.local().startOf('month');

  protected async firstUpdated(_changedProperties: PropertyValues): Promise<void> {
    super.firstUpdated(_changedProperties);
    await new Promise((resolve) => setTimeout(resolve, 0));
    this._setEventListeners();
  }

  static get styles(): CSSResultGroup {
    return [
      styles,
      css`
        #lunar-calendar {
          /* max-width: 500px; */
          margin: 0 auto;
          backdrop-filter: blur(10px);
          background: var(--ha-card-background-color, var(--secondary-background-color));
          width: 100%;
          height: 100%;
          border-radius: 8px;
        }
        #lunar-calendar.--background {
          background-image: var(--lunar-background-image);
          background-size: cover;
          background-position: center;
          background-repeat: no-repeat;
        }

        .calendar-header {
          /* padding: 0.25em 0.5em; */
          display: flex;
          flex-direction: row;
          justify-content: space-between;
          align-items: center;
          /* font-weight: 600; */
          font-size: initial;
        }

        .calendar-header__month {
          display: flex;
          align-items: center;
          justify-content: end;
          flex-grow: 1; /* Allows the month section to take up remaining space */
          text-align: center;
        }

        .calendar-header__month span {
          margin: 0 0.5rem; /* Adds spacing around the month name */
        }

        .calendar-header__year {
          display: flex;
          align-items: center;
          justify-content: flex-start;
        }

        #calendar-grid {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          /* grid-template-rows: repeat(7, 1fr); */
          padding: 0.3em;
          cursor: default;
          /* gap: 2px 4px; */
        }
        .day-of-week {
          text-align: center;
          font-weight: 500;
          display: flex;
          justify-content: center;
          align-items: center;
          text-transform: uppercase;
          color: var(--secondary-text-color);
        }

        .calendar-day {
          text-align: center;
          font-size: 1em;
          margin: 0 auto;
          padding: 0.35em 0 0.25em 0;
          border-radius: 0.25em;
          cursor: default !important;
          background-color: rgba(0, 0, 0, 0.14);
          width: 100%;
        }
        .calendar-day:hover {
          background-color: rgba(0, 0, 0, 0.2);
          outline: 2px solid var(--accent-color);
        }
        .calendar-day > .day-num {
          text-align: right;
          padding-inline-end: 0.2rem;
        }

        .calendar-day.today {
          outline: 2px solid var(--accent-color);
        }

        .calendar-day > .day-symbol {
          font-size: 1.5em;
          padding: 0.05em;
          text-align: center;
        }

        ha-icon-button {
          color: var(--secondary-text-color);
          &:hover {
            color: var(--primary-text-color);
          }
          &:active {
            color: var(--accent-color);
          }
        }
        @media screen and (max-width: 800px) {
          #calendar-grid {
            grid-template-rows: auto;
          }
          .calendar-header {
            font-size: 1rem;
            font-weight: 400;
          }
          .calendar-day > .day-symbol {
            font-size: 1rem;
            padding: 0;
          }
        }
      `,
    ];
  }

  protected render(): TemplateResult {
    const backgroundClass = this.card.config?.show_background ? '--background' : nothing;
    const viewDate = this.viewDate;
    const monthLocale = viewDate.setLocale(this.card._locale.language).toFormat('LLLL');

    const renderNavButton = (icon: string, action: () => void): TemplateResult => html`
      <ha-icon-button .path=${icon} @click=${action}></ha-icon-button>
    `;

    return html`
      <div id="lunar-calendar" class=${backgroundClass}>
        <div class="calendar-header">
          ${renderNavButton(ICON.CLOSE, () => {
            this._dispatchEvent('close', {});
            this.viewDate = DateTime.local().startOf('month');
          })}
          <div class="calendar-header__year">
            ${renderNavButton(ICON.LEFT, () => this._updateCalendarDate('years', 'prev'))}
            <span>${viewDate.year}</span>
            ${renderNavButton(ICON.RIGHT, () => this._updateCalendarDate('years', 'next'))}
          </div>
          <div class="calendar-header__month">
            ${renderNavButton(ICON.LEFT, () => this._updateCalendarDate('months', 'prev'))}
            <span>${monthLocale}</span>
            ${renderNavButton(ICON.RIGHT, () => this._updateCalendarDate('months', 'next'))}
          </div>
        </div>
        ${this._renderCalendarGrid()}
      </div>
    `;
  }

  private _renderCalendarGrid(): TemplateResult {
    const viewDate = this.viewDate;
    const daysOfWeek = this._getDaysOfWeek();
    const daysInMonth = viewDate.daysInMonth;

    const firstOfMonth = viewDate.startOf('month');
    const numberOfFillerDays = (firstOfMonth.weekday - 1 + 7) % 7;

    const dayOfWeek = daysOfWeek.map((day) => html`<div class="day-of-week">${day}</div>`);

    // Empty divs with total number of filler days

    const fillerDays = Array.from({ length: numberOfFillerDays }, () => html`<div></div>`);

    const renderDayItem = (day: number): TemplateResult => {
      const date = viewDate.set({ day });
      const dayClass = date.toISODate() === DateTime.local().toISODate() ? 'calendar-day today' : 'calendar-day';
      const label = day;
      const moonPhase = this.moon._getPhaseNameForPhase(date.toJSDate());
      const moonPhaseIcon = this.moon._getEmojiForPhase(date.toJSDate());

      return html`
        <div
          title="${moonPhase}"
          class=${dayClass}
          @click=${() => this._dispatchEvent('date-select', { date: date.toJSDate() })}
        >
          <div class="day-num">${label}</div>
          <div class="day-symbol">${moonPhaseIcon}</div>
        </div>
      `;
    };

    return html`
      <div id="calendar-grid">
        ${dayOfWeek} ${fillerDays} ${Array.from({ length: daysInMonth }, (_, i) => renderDayItem(i + 1))}
      </div>
    `;
  }

  private _dispatchEvent(action: string, detail: any): void {
    this.dispatchEvent(
      new CustomEvent('calendar-action', {
        detail: {
          action,
          ...detail,
        },
        bubbles: true,
        composed: true,
      })
    );
  }

  private _setEventListeners(): void {
    const grid = this.shadowRoot?.getElementById('calendar-grid');
    if (grid) {
      // close popup if is clicked to empty space
      grid.addEventListener('click', (e) => {
        if (e.target === grid) {
          this._dispatchEvent('close', {});
          this.viewDate = DateTime.local().startOf('month');
        }
      });
    }
  }

  private _getDaysOfWeek(): string[] {
    const lang = this.card._locale.language;
    const daysOfTheWeek = Array.from({ length: 7 }, (_, i) => {
      return DateTime.local()
        .set({ weekday: (i + 1) as WeekdayNumbers })
        .setLocale(lang)
        .toFormat('ccc');
    });
    return daysOfTheWeek;
  }

  private _updateCalendarDate(type: 'months' | 'years', action: 'prev' | 'next'): void {
    this.viewDate = action === 'prev' ? this.viewDate.minus({ [type]: 1 }) : this.viewDate.plus({ [type]: 1 });
    this.requestUpdate();
  }
}
declare global {
  interface HTMLElementTagNameMap {
    'lunar-calendar-popup': LunarCalendarPopup;
  }
}

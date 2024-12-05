import { LitElement, html, TemplateResult, CSSResultGroup, css, PropertyValues, nothing } from 'lit';
import { customElement, state, property } from 'lit/decorators.js';
import { DateTime, WeekdayNumbers } from 'luxon';
// Local
import { ICON } from '../const';
import { LunarPhaseCard } from '../lunar-phase-card';
import { Moon } from '../utils/moon';
// styles
import styles from '../css/style.css';

@customElement('moon-calendar-popup')
export class MoonCalendarPopup extends LitElement {
  @property({ attribute: false }) card!: LunarPhaseCard;
  @property({ attribute: false }) moon!: Moon;
  @state() viewDate = DateTime.local().startOf('month');

  protected firstUpdated(_changedProperties: PropertyValues): void {
    super.firstUpdated(_changedProperties);
  }

  static get styles(): CSSResultGroup {
    return [
      styles,
      css`
        #lunar-calendar {
          max-width: 500px;
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
          font-weight: 600;
          font-size: 1.3rem;
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
          justify-content: center;
        }

        #calendar-grid {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          grid-template-rows: repeat(7, 1fr);
          padding: 0.5em;
          cursor: default;
          gap: 2px 4px;
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
          padding-inline-end: 0.5rem;
        }

        .calendar-day.today {
          outline: 2px solid var(--accent-color);
        }

        ha-icon-button {
          color: var(--secondary-text-color);
        }
        ha-icon-button:hover {
          color: var(--primary-text-color);
        }
        ha-icon-button:active {
          color: var(--accent-color);
        }
      `,
    ];
  }

  protected render(): TemplateResult {
    const backgroundClass = this.card.config?.show_background ? '--background' : nothing;
    const viewDate = this.viewDate;
    return html`
      <div id="lunar-calendar" class=${backgroundClass}>
        <div class="calendar-header">
          <ha-icon-button
            .path=${ICON.CLOSE}
            @click=${() => {
              this.card._calendarPopup = false;
              this.viewDate = DateTime.local().startOf('month');
            }}
          ></ha-icon-button>
          <div class="calendar-header__month">
            <ha-icon-button .path=${ICON.LEFT} @click=${() => this._handleMonthChange('prev')}></ha-icon-button>
            <span>${viewDate.toFormat('MMMM')}</span>
            <ha-icon-button .path=${ICON.RIGHT} @click=${() => this._handleMonthChange('next')}></ha-icon-button>
          </div>
          <div class="calendar-header__year">
            <ha-icon-button .path=${ICON.LEFT} @click=${() => this._handleYearChange('prev')}></ha-icon-button>
            <span>${viewDate.year}</span>
            <ha-icon-button .path=${ICON.RIGHT} @click=${() => this._handleYearChange('next')}></ha-icon-button>
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

    const fillerDays = // eslint-disable-next-line unused-imports/no-unused-vars
      Array.from({ length: numberOfFillerDays }, (_) => html`<div></div>`);

    const renderDayItem = (day: number): TemplateResult => {
      const date = viewDate.set({ day });
      const dayClass = date.toISODate() === DateTime.local().toISODate() ? 'calendar-day today' : 'calendar-day';
      const label = day;
      const moonPhase = this.moon._getPhaseNameForPhase(date.toJSDate());
      const moonPhaseIcon = this.moon._getEmojiForPhase(date.toJSDate());

      return html`
        <div class=${dayClass} @click=${() => this._handleDateSelect(date.toJSDate())}>
          <div class="day-num">${label}</div>
          <div title=${moonPhase}>${moonPhaseIcon}</div>
        </div>
      `;
    };

    return html`
      <div id="calendar-grid">
        ${dayOfWeek} ${fillerDays} ${Array.from({ length: daysInMonth }, (_, i) => renderDayItem(i + 1))}
      </div>
    `;
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

  private _handleDateSelect(date: Date): void {
    // Update the selected date in the card
    this.card.selectedDate = date;
    setTimeout(() => {
      this.viewDate = DateTime.local().startOf('month');
      this.card._calendarPopup = false;
    }, 300);
  }

  private _handleMonthChange(type: 'prev' | 'next'): void {
    this.viewDate = type === 'prev' ? this.viewDate.minus({ months: 1 }) : this.viewDate.plus({ months: 1 });
    this.requestUpdate();
    console.log(this.viewDate);
  }

  private _handleYearChange(type: 'prev' | 'next'): void {
    this.viewDate = type === 'prev' ? this.viewDate.minus({ years: 1 }) : this.viewDate.plus({ years: 1 });
    this.requestUpdate();
    console.log(this.viewDate);
  }
}
declare global {
  interface HTMLElementTagNameMap {
    'moon-calendar-popup': MoonCalendarPopup;
  }
}

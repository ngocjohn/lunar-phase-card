import { html, TemplateResult, CSSResultGroup, css, PropertyValues } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { DateTime, WeekdayNumbers } from 'luxon';

import { ICON } from '../../const';
import { fireEvent } from '../../ha';
import { CardArea } from '../../types/card-area';
import { LunarBaseCard } from '../base-card';
import { LunarPhaseNewCard } from '../new-lunar-phase-card';

declare global {
  interface HASSDomEvents {
    'calendar-action': {
      action: 'close' | 'date-select';
      date?: Date;
    };
  }
}

@customElement('lunar-moon-calendar-popup')
export class LunarMoonCalendarPopup extends LunarBaseCard {
  constructor() {
    super(CardArea.POPUP);
    window.LunarPopup = this;
  }
  @property({ attribute: false }) public card!: LunarPhaseNewCard;
  @state() private viewDate = DateTime.local().startOf('month');

  protected async firstUpdated(_changedProperties: PropertyValues): Promise<void> {
    super.firstUpdated(_changedProperties);
    await new Promise((resolve) => setTimeout(resolve, 0));
    this._setEventListeners();
  }

  protected render(): TemplateResult {
    const backgroundClass = this._configAppearance?.hide_background ? '' : '--background';
    const viewDate = this.viewDate;
    const monthLocale = viewDate.setLocale(this.card._locale.language).toFormat('LLLL');
    const isThisMonth = viewDate.hasSame(DateTime.local(), 'month') && viewDate.hasSame(DateTime.local(), 'year');

    const renderNavButton = (icon: string, type: 'months' | 'years', action: 'prev' | 'next'): TemplateResult => html`
      <ha-icon-button .path=${icon} @click=${this._updateCalendarDate.bind(this, type, action)}></ha-icon-button>
    `;

    return html`
      <div id="lunar-calendar" class=${backgroundClass}>
        <div class="calendar-header">
          <ha-icon-button
            .path=${ICON.CLOSE}
            @click=${() => {
              this._dispatchEvent('close', {});
              this.viewDate = DateTime.local().startOf('month');
            }}
          >
          </ha-icon-button>
          <ha-icon-button
            .path=${ICON.RESTORE}
            ?disabled=${isThisMonth}
            @click=${() => (this.viewDate = DateTime.local().startOf('month'))}
          >
          </ha-icon-button>
          <div class="calendar-header__btns">
            ${renderNavButton(ICON.LEFT, 'years', 'prev')}
            <span>${viewDate.year}</span>
            ${renderNavButton(ICON.RIGHT, 'years', 'next')}
          </div>
          <div class="spacer"></div>
          <div class="calendar-header__btns">
            ${renderNavButton(ICON.LEFT, 'months', 'prev')}
            <span>${monthLocale}</span>
            ${renderNavButton(ICON.RIGHT, 'months', 'next')}
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

    const dayOfWeek = daysOfWeek.map((day) => html`<div class="day-of-week"><span>${day}</span></div>`);

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
          id="calendar-day-${day}"
          class=${dayClass}
          @click=${() => this._dispatchEvent('date-select', { date: date.toJSDate() })}
        >
          <span>${label}</span>
          <span class="day-symbol">${moonPhaseIcon}</span>
        </div>
        <ha-tooltip .for=${`calendar-day-${day}`}>${moonPhase}</ha-tooltip>
      `;
    };

    return html`
      <div id="calendar-grid">
        ${dayOfWeek} ${fillerDays} ${Array.from({ length: daysInMonth }, (_, i) => renderDayItem(i + 1))}
      </div>
    `;
  }

  private _dispatchEvent(action: string, detail: any): void {
    fireEvent(this, 'calendar-action', { action, ...detail });
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

  static get styles(): CSSResultGroup {
    return [
      super.styles,
      css`
        #lunar-calendar {
          /* max-width: 500px; */
          margin: 0 auto;
          backdrop-filter: blur(10px);
          /* background: var(--ha-card-background-color, var(--secondary-background-color)); */
          width: 100%;
          height: 100%;
          border-radius: inherit;
          box-sizing: border-box;
        }
        #lunar-calendar.--background {
          background-image: var(--lpc-bg-image);
          background-size: cover;
          background-position: center;
          background-repeat: no-repeat;
        }

        .calendar-header {
          display: inline-flex;
          justify-content: space-between;
          align-items: center;
          width: 100%;
          font-size: initial;
        }

        .calendar-header__btns {
          display: flex;
          flex-direction: row;
          align-items: center;
        }
        .calendar-header__btns span {
          flex: 0 0 auto;
          text-transform: capitalize;
        }

        .spacer {
          flex: 1;
        }

        #calendar-grid {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          /* grid-template-rows: repeat(7, 1fr); */
          padding: 4px;
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
          line-height: 2;
          margin-bottom: 4px;
        }
        .day-of-week span {
          background-color: rgba(from var(--secondary-text-color) r g b / 0.1);
          width: calc(100% - 1px);
        }

        .calendar-day {
          display: flex;
          width: calc(100% - 2px);
          height: calc(100% - 2px);
          border-radius: 0.25em;
          border: 1px solid transparent;
          background-color: rgba(0, 0, 0, 0.14);
          cursor: default !important;
          transition:
            background-color 0.3s,
            border 0.3s;
          flex-direction: column;
          justify-content: center;
          align-items: flex-end;
        }
        .calendar-day:hover {
          background-color: rgba(from var(--secondary-text-color) r g b / 0.1);
          border: 1px solid var(--accent-color);
        }

        .calendar-day.today {
          border: 1px solid var(--primary-color);
        }
        .calendar-day > span {
          padding-inline-end: 4px;
        }

        .calendar-day span.day-symbol {
          font-size: var(--ha-font-size-xl, 20px);
          place-self: center !important;
          min-height: 36px;
        }

        ha-icon-button[disabled] {
          opacity: 0.1;
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
}

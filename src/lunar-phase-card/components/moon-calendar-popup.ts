import { formatDate } from 'custom-card-helpers';
import { html, TemplateResult, CSSResultGroup, css } from 'lit';
import { customElement, property, queryAll, state } from 'lit/decorators.js';
import { DateTime, WeekdayNumbers } from 'luxon';

import { ICON } from '../../const';
import { fireEvent } from '../../ha';
import { CardArea } from '../../types/card-area';
import { MoonData } from '../../types/config/chart-config';
import './moon-calendar-tooltip';
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
  @property({ attribute: false }) public moonData!: MoonData;
  @property({ type: Boolean, reflect: true, attribute: 'tooltip-active' }) public tooltipActive = false;

  @state() private viewDate = DateTime.local().startOf('month');

  private _tooltipDate: Date | null = null;
  private _dateBoxRect: DOMRect | null = null;

  @queryAll('.calendar-day') private _dateBoxes!: NodeListOf<HTMLElement>;

  protected render(): TemplateResult {
    const backgroundClass = this._configAppearance?.hide_background ? '' : '--background';
    const viewDate = this.viewDate.setLocale(this._locale.language);
    const monthLocale = viewDate.toFormat('LLLL');
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
      ${this._renderDateTooltip()}
    `;
  }

  private _renderCalendarGrid(): TemplateResult {
    const viewDate = this.viewDate;
    const daysOfWeek = this._renderDaysOfWeek();
    const daysInMonth = viewDate.daysInMonth;

    const firstOfMonth = viewDate.startOf('month');
    const numberOfFillerDays = (firstOfMonth.weekday - 1 + 7) % 7;

    // Empty divs with total number of filler days

    const fillerDays = Array.from({ length: numberOfFillerDays }, () => html`<div></div>`);

    const renderDayItem = (day: number): TemplateResult => {
      const date = viewDate.set({ day });
      const dateObj = date.toJSDate();
      const isToday = Boolean(date.toISODate() === DateTime.local().toISODate());

      const { emoji, phaseName, isNewMoonOrFullMoon } = this.moon._getDataByDate(dateObj);
      return html`
        <div
          id="calendar-day-${day}"
          class="calendar-day"
          .jsdate=${dateObj}
          ?today=${isToday}
          ?new-full-moon=${isNewMoonOrFullMoon}
          @click=${this._handleDayClick}
        >
          <span>${date.day}</span>
          <span class="day-symbol">${emoji}</span>
        </div>
        <ha-tooltip .for=${`calendar-day-${day}`}>${phaseName}</ha-tooltip>
      `;
    };

    return html`
      <div id="calendar-grid">
        ${daysOfWeek} ${fillerDays} ${Array.from({ length: daysInMonth }, (_, i) => renderDayItem(i + 1))}
      </div>
    `;
  }

  private _renderDateTooltip(): TemplateResult {
    if (!this._dateBoxRect) {
      return html``;
    }
    return html`<lunar-moon-calendar-tooltip .dateBoxRect=${this._dateBoxRect} @closing=${this._handleTooltipClosing}>
      <div slot="moon-header">${formatDate(this._tooltipDate!, this._locale)}</div>
      <span slot="phase-name">${this.moon.phaseName}</span>
      ${this.renderMoonImage()}
      <lunar-moon-data-info slot="moon-info" .moonData=${this.moonData}></lunar-moon-data-info>
    </lunar-moon-calendar-tooltip>`;
  }

  private _handleDayClick(e: MouseEvent): void {
    e.stopPropagation();
    const target = e.currentTarget as HTMLElement;
    const dayBoxRect = target.getBoundingClientRect();
    this._tooltipDate = (target as any).jsdate as Date;
    this._dispatchEvent('date-select', { date: this._tooltipDate });
    target.toggleAttribute('selected', true);
    this._dateBoxRect = dayBoxRect;
    this.tooltipActive = true;
    this.requestUpdate();
  }

  private _handleTooltipClosing = (): void => {
    this._dateBoxes.forEach((box) => box.removeAttribute('selected'));
    this._dateBoxRect = null;
    this._tooltipDate = null;
    this.tooltipActive = false;
    this.requestUpdate();
  };
  private _renderDaysOfWeek(): TemplateResult {
    const daysArr = Array.from({ length: 7 }, (_, i) => {
      const lang = this.card._locale.language;
      const day = DateTime.local()
        .set({ weekday: (i + 1) as WeekdayNumbers })
        .setLocale(lang)
        .toFormat('ccc');
      return html`<div class="day-of-week"><span>${day}</span></div>`;
    });
    return html`${daysArr}`;
  }

  private _dispatchEvent(action: string, detail: any): void {
    fireEvent(this, 'calendar-action', { action, ...detail });
  }

  private _updateCalendarDate(type: 'months' | 'years', action: 'prev' | 'next'): void {
    this.viewDate = action === 'prev' ? this.viewDate.minus({ [type]: 1 }) : this.viewDate.plus({ [type]: 1 });
    this.requestUpdate();
  }

  public _getMoonDataForMoth(month: number): void | any[] {
    console.debug('Getting moon data for month:', month);
    // set month by parameter
    const viewDate = this.viewDate.set({ month });
    const daysInMonth = viewDate.daysInMonth;
    const moonDataArray: any[] = [];
    Array.from({ length: daysInMonth }, (_, i) => {
      const date = viewDate.set({ day: i + 1 });
      const isToday = Boolean(date.toISODate() === DateTime.local().toISODate());
      const moonData = this.moon._getDataByDate(date.toJSDate());
      moonDataArray.push({ date: date.toISODate(), ...moonData, isToday });
    });
    console.groupCollapsed(`Moon Data for ${viewDate.toFormat('LLLL yyyy')}`);
    console.table(moonDataArray);
    console.groupEnd();
    return moonDataArray;
  }

  static get styles(): CSSResultGroup {
    return [
      super.styles,
      css`
        :host([tooltip-active]) #lunar-calendar {
          pointer-events: none;
          /* filter: grayscale(1); */
        }

        #lunar-calendar {
          /* max-width: 500px; */
          margin: 0 auto;
          backdrop-filter: blur(10px);
          /* background: var(--ha-card-background-color, var(--secondary-background-color)); */
          width: 100%;
          height: 100%;
          border-radius: var(--ha-card-border-radius, var(--ha-border-radius-lg));
          box-sizing: border-box;
          overflow: hidden;
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
          padding: 2px;
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
          border-radius: 0.25em;
          border: 1px solid transparent;
          background-color: rgba(0, 0, 0, 0.14);
          transition:
            background-color 0.3s,
            border 0.3s ease-in-out;
          flex-direction: column;
          height: calc(100% - 2px);
          aspect-ratio: 1 / 1;
          cursor: default !important;
          outline: none;
          position: relative;
        }
        .calendar-day:hover {
          background-color: rgba(from var(--secondary-text-color) r g b / 0.1);
          border: 1px solid var(--accent-color);
        }

        .calendar-day[today] {
          border: 1px solid var(--primary-color);
        }
        .calendar-day > span:not(.day-symbol) {
          padding-inline-end: 4px;
          display: inline-flex;
          line-height: inherit;
          place-self: flex-end;
          height: fit-content;
        }

        .calendar-day span.day-symbol {
          font-size: 32px;
          line-height: 1;
          max-width: 100%;
          max-height: 100%;
          width: 36px;
          min-height: 36px;
          place-self: center center;
          aspect-ratio: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: auto;
          padding: 0;
        }
        :host([south]) .calendar-day:not([new-full-moon]) span.day-symbol {
          transform: rotate(180deg);
        }

        .calendar-day[selected]::before {
          content: '';
          background-color: var(--primary-color);
          opacity: 0.5;
          position: absolute;
          width: calc(100% - 2px);
          height: calc(100% - 2px);
          border-radius: 0.25em;
          top: 1px;
          left: 1px;
          pointer-events: none;
          transition: all 0.3s ease-in-out;
        }

        .calendar-day[selected] .day-symbol {
          filter: brightness(0.9) contrast(1.2);
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
            font-size: 1rem !important;
            width: 24px !important;
            height: 24px !important;
            padding: 0;
          }
        }
      `,
    ];
  }
}

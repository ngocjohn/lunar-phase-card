import { Calendar } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import { LitElement, html, TemplateResult, CSSResultGroup, css } from 'lit';
import { customElement, state, property } from 'lit/decorators.js';

import { LunarPhaseCard } from '../lunar-phase-card';
import { Moon } from '../utils/moon';

// styles
import styles from '../css/style.css';

@customElement('moon-phase-calendar')
export class MoonPhaseCalendar extends LitElement {
  @property({ attribute: false }) card!: LunarPhaseCard;
  @state() moon!: Moon;

  @state() calendar!: Calendar;
  @state() cardWidth = 500;
  static get styles(): CSSResultGroup {
    return [
      styles,
      css`
        :host {
          --fc-border-color: var(--divider-color);
          --fc-small-font-size: 1.2rem;
          --fc-event-bg-color: rgba(0, 0, 0, 0);
          --fc-event-border-color: auto;
          --fc-today-bg-color: rgba(76, 91, 106, 0.5);
          --fc-button-bg-color: var(--fc-event-selected-overlay-color);
        }
        #calendar {
          max-width: 500px;
          margin: 0 auto;
          backdrop-filter: blur(4px);
          background-color: #000000d8;
        }
        .fc-toolbar.fc-header-toolbar {
          margin-bottom: 1rem !important;
          padding-inline: 4px;
        }

        .fc-daygrid-day-top {
          display: flex;
          flex-direction: row-reverse;
          /* justify-content: center; */
          align-items: center;
          color: var(--secondary-text-color);
        }
        .fc-daygrid-day-events {
          justify-items: center;
        }
      `,
    ];
  }

  protected firstUpdated(): void {
    this.measureCard();
    this.initCalendar();
  }

  initCalendar(): void {
    // Initialize FullCalendar
    const calendarEl = this.shadowRoot?.getElementById('calendar') as HTMLElement;
    if (!calendarEl) return;
    this.calendar = new Calendar(calendarEl, {
      plugins: [dayGridPlugin, interactionPlugin],
      initialView: 'dayGridMonth',
      fixedWeekCount: false,
      locale: this.card.selectedLanguage,
      customButtons: {
        closeCalendar: {
          text: 'Close',
          click: () => {
            this.card._calendarPopup = false;
          },
        },
      },
      headerToolbar: {
        left: 'closeCalendar',
        center: 'title',
        right: 'prev,next',
      },
      eventClick: (info) => {
        const startStr = info.event.startStr;
        this.handleDateSelect(new Date(startStr));
      },
      dateClick: (info) => {
        this.handleDateSelect(info.date);
      },
      // Handle navigation events
      datesSet: (info) => {
        this.handleDateRangeChange(info.start, info.end);
      },
    });
    this.calendar.render();
  }

  handleDateSelect(date: Date): void {
    // Update the selected date in the card
    this.card.selectedDate = date;
    setTimeout(() => {
      this.card._calendarPopup = false;
    }, 300);
  }

  handleDateRangeChange(start: Date, end: Date): void {
    // Update the events based on the new date range
    const events = this.moon.getEventsForRange(start, end);
    this.calendar.removeAllEvents(); // Clear existing events
    this.calendar.addEventSource(events); // Add new events
  }

  private measureCard() {
    const card = this.parentElement;
    if (card) {
      this.cardWidth = card.clientWidth;
    }
  }
  protected render(): TemplateResult {
    return html` <div id="calendar" style="max-width: ${this.cardWidth}px;"></div> `;
  }
}

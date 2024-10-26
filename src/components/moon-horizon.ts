/* eslint-disable */
import { LitElement, html, CSSResultGroup, TemplateResult, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { Chart } from 'chart.js/auto';

import { Moon } from '../utils/moon';
import styles from '../css/style.css';

@customElement('moon-horizon')
export class MoonHorizon extends LitElement {
  @state() moon!: Moon;
  @state() moonChart: Chart | null = null;
  @state() cardWidth!: number;

  static get styles(): CSSResultGroup {
    return [
      css`
        .moon-horizon {
          display: flex;
          position: relative;
          margin: 0;
          width: 100%;
          height: 100%;
          box-shadow: 0 0 6px #00000082;
          max-width: 500px;
          backdrop-filter: blur(4px);
          border-radius: 4px;
          border: 1px solid var(--divider-color);
          box-sizing: border-box;
          padding: 4px;
        }
        .moon-horizon canvas {
          width: 100%;
          height: 100%;
        }
      `,
      styles,
    ];
  }

  connectedCallback(): void {
    super.connectedCallback();
    window.MoonCard = this;
  }

  get todayData() {
    return this.moon._getAltitudeToday();
  }

  protected firstUpdated(): void {
    this.initChart();
  }

  private initChart(): void {
    const options = {
      pointRadius: 2,
      pointHoverRadius: 5,
      pointHoverBackgroundColor: '#fff',
      pointHoverBorderWidth: 4,
    };

    const ticksOptions = {
      color: `rgba(255, 255, 255, 0.5)`,
    };

    // Generate time labels for the 24 hours
    const timeLabels: string[] = [];
    const today = new Date();
    const startTime = new Date(today.setHours(0, 0, 0, 0));
    for (let i = 0; i < 24; i++) {
      const time = new Date(startTime.getTime() + i * 60 * 60 * 1000);
      timeLabels.push(time.toLocaleString('en-US', { hour: 'numeric', minute: 'numeric', hour12: false }));
    }
    const todayData = this.todayData;

    // Generate altitude data for the 24 hours
    const altitudeData = Object.values(todayData.altitude) as number[];

    // Calculate current altitude based on the current time
    const currentMoon = this._getPosition(new Date(), altitudeData);

    // Calculate set time position
    const setTime = new Date(todayData.time.set);
    const setTimePosition = this._getPosition(new Date(todayData.time.set), altitudeData);

    // Calculate rise time position
    const riseTime = new Date(todayData.time.rise);
    const riseTimePosition = this._getPosition(new Date(todayData.time.rise), altitudeData);

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const showSetTime = setTime > todayStart && setTime < todayEnd;
    const showRiseTime = riseTime > todayStart && riseTime < todayEnd;
    console.log('showSetTime', showSetTime, 'showRiseTime', showRiseTime);
    // Suggested Y axis max and min values
    const sugestedYMax = Math.ceil(Math.max(...altitudeData) + 10);
    const sugestedYMin = Math.min(...altitudeData) - 10;

    console.log(sugestedYMax, sugestedYMin);
    // Create the chart
    const ctx = this.shadowRoot?.getElementById('moonPositionChart') as HTMLCanvasElement;
    if (ctx) {
      this.moonChart = new Chart(ctx, {
        type: 'line',
        data: {
          labels: timeLabels,
          datasets: [
            {
              label: 'Altitude',
              data: altitudeData,
              borderColor: '#e1e1e1c7',
              borderWidth: 1,
              fill: {
                target: { value: 0 }, // Fill area above 0° altitude
                above: 'rgba(255,255,255,0.12157)', // Above horizon color
                below: '#e1e0dd0f', // No fill below horizon
              },
              cubicInterpolationMode: 'monotone',
              tension: 0.2,
              ...options,
            },
            {
              label: 'Horizon (0° Altitude)',
              data: new Array(timeLabels.length).fill(0),
              borderColor: 'rgba(225, 225, 225, .12)',
              borderWidth: 1,
              fill: false,
              pointRadius: 0, // Disable points
              pointHoverRadius: 0, // Disable hover effect
            },
          ],
        },
        options: {
          responsive: true,
          scales: {
            y: {
              suggestedMax: sugestedYMax,
              suggestedMin: sugestedYMin,
              ticks: {
                stepSize: 30, // Step size of 30
                ...ticksOptions,
              },
              grid: {
                display: true,
              },
            },
            x: {
              title: {
                display: false,
                text: 'Time',
              },
              grid: {
                display: false,
              },
              min: 0,
              max: 24,
              ticks: {
                stepSize: 6, // Step size of 6 hours
                ...ticksOptions,
              },
            },
          },
          plugins: {
            legend: {
              display: false,
            },
          },
        },
        plugins: [
          {
            id: 'currentPositionMarker',
            afterDatasetsDraw(chart) {
              const {
                ctx,
                scales: { x, y },
              } = chart;
              const emoji = todayData.moonPhase.phase.emoji;
              const { index: currentHourIndex, fraction: nowFraction, altitude: nowAltitude } = currentMoon;
              // Calculate x and y position for the marker
              const xPosition = x.getPixelForValue(currentHourIndex + nowFraction);
              const yPosition = y.getPixelForValue(nowAltitude);

              ctx.save();
              ctx.font = '24px serif';
              ctx.fillText(emoji, xPosition - 12, yPosition + 8);
              ctx.restore();
            },
          },
          {
            id: 'setTimeMarker',
            afterDatasetsDraw(chart) {
              if (!showSetTime) return;
              const {
                ctx,
                scales: { x, y },
              } = chart;
              const { index: setIndex, fraction: setFraction, altitude: setAltitude } = setTimePosition;
              // Calculate x and y position for the marker
              const xPosition = x.getPixelForValue(setIndex + setFraction);
              const yPosition = y.getPixelForValue(setAltitude);

              ctx.save();
              ctx.font = '12px';
              ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
              ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
              ctx.beginPath();
              ctx.moveTo(xPosition, yPosition);
              ctx.lineTo(xPosition, yPosition + 20);
              ctx.stroke();
              ctx.fillText(todayData.lang.set, xPosition - 12, yPosition + 35);
              ctx.fillText(
                setTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric', hour12: false }),
                xPosition - 12,
                yPosition + 50
              );
              ctx.restore();
            },
          },
          {
            id: 'riseTimeMarker',
            afterDatasetsDraw(chart) {
              if (!showRiseTime) return;
              const {
                ctx,
                scales: { x, y },
              } = chart;
              const { index: riseIndex, fraction: riseFraction, altitude: riseAltitude } = riseTimePosition;
              // Calculate x and y position for the marker
              const xPosition = x.getPixelForValue(riseIndex + riseFraction);
              const yPosition = y.getPixelForValue(riseAltitude);

              ctx.save();
              ctx.font = '12px';
              ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
              ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
              ctx.beginPath();
              ctx.moveTo(xPosition, yPosition);
              ctx.lineTo(xPosition, yPosition - 30);
              ctx.stroke();
              ctx.fillText(todayData.lang.rise, xPosition - 12, yPosition - 40);
              ctx.fillText(
                riseTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric', hour12: false }),
                xPosition - 12,
                yPosition - 55
              );
              ctx.restore();
            },
          },
        ],
      });
    }
  }

  private _getPosition(time: Date, altitudeData: number[]): { index: number; fraction: number; altitude: number } {
    const hour = time.getHours() + time.getMinutes() / 60;
    const index = Math.floor(hour);
    const fraction = hour - index;
    const altitude = altitudeData[index] + (altitudeData[index + 1] - altitudeData[index]) * fraction;
    return { index, fraction, altitude };
  }

  protected render(): TemplateResult {
    return html`
      <div class="moon-horizon">
        <canvas id="moonPositionChart" width=${this.cardWidth}></canvas>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'moon-horizon': MoonHorizon;
  }
  interface Window {
    MoonCard: MoonHorizon;
  }
}

/* eslint-disable */
import { LitElement, html, CSSResultGroup, TemplateResult, css } from 'lit';
import { customElement, state, property } from 'lit/decorators.js';
import { formatTime, formatDateTimeNumeric, HomeAssistant } from 'custom-card-helpers';
import { Chart } from 'chart.js/auto';

import { Moon } from '../utils/moon';
import styles from '../css/style.css';

@customElement('moon-horizon')
export class MoonHorizon extends LitElement {
  @property({ attribute: false }) public hass!: HomeAssistant;
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
          /* box-shadow: 0 0 6px #00000082; */
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
        .direction-icon {
          /* --mdc-icon-size: 16px; */
          margin-inline: 4px;
        }
        .moon-data {
          margin-top: 1rem !important;
          backdrop-filter: blur(4px);
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

  get moonData() {
    return this.moon.moonData;
  }

  private get cssColors(): {
    primaryTextColor: string;
    secondaryTextColor: string;
    fillColor: string;
    fillBellowColor: string;
  } {
    const cssColors = getComputedStyle(this);
    return {
      primaryTextColor: cssColors.getPropertyValue('--lunar-card-label-font-color'),
      secondaryTextColor: cssColors.getPropertyValue('--secondary-text-color'),
      fillColor: cssColors.getPropertyValue('--lunar-fill-color'),
      fillBellowColor: cssColors.getPropertyValue('--lunar-fill-bellow-color'),
    };
  }

  protected firstUpdated(): void {
    this.initChart();
  }

  private initChart(): void {
    const { primaryTextColor, secondaryTextColor, fillColor, fillBellowColor } = this.cssColors;

    const todayData = this.todayData;
    // Generate time labels for the 24 hours
    const timeLabels = Object.keys(todayData.altitude);
    // Generate altitude data for the 24 hours
    const altitudeData = Object.values(todayData.altitude) as number[];

    // Calculate current altitude based on the current time
    const currentMoon = this._getPosition(new Date(), altitudeData);

    // Suggested Y axis max and min values
    const sugestedYMax = Math.ceil(Math.max(...altitudeData) + 10);
    const sugestedYMin = Math.min(...altitudeData) - 10;
    console.log(sugestedYMax, sugestedYMin);
    // Get the rise and set time for the moon
    const { formatedRiseTime, riseTimePosition, showRiseTime, label: riseLabel } = this.riseTimePlugin();
    const { formatedSetTime, setTimePosition, showSetTime, label: setLabel } = this.setTimePlugin();

    const drawTimeMarker = (
      ctx: CanvasRenderingContext2D,
      label: string,
      formatedTime: string,
      x: number,
      y: number,
      textOffset: number,
      lineOffset: number
    ) => {
      ctx.save();
      ctx.font = '12px';
      ctx.fillStyle = secondaryTextColor;
      ctx.strokeStyle = fillColor;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x, y - lineOffset);
      ctx.stroke();
      ctx.fillText(formatedTime, x - 12, y - textOffset);
      ctx.fillText(label, x - 12, y - textOffset + 15);
      ctx.restore();
    };

    const options = {
      radius: 1.1,
      pointHoverRadius: 5,
      pointHoverBackgroundColor: secondaryTextColor,
      pointHoverBorderWidth: 4,
    };

    const ticksOptions = {
      color: secondaryTextColor,
    };

    const { set, rise } = todayData.lang;
    const fillTopPlugin = this.fillTopPlugin();

    // Create the chart
    const ctx = this.shadowRoot?.getElementById('moonPositionChart') as HTMLCanvasElement;
    if (ctx) {
      this.moonChart = new Chart(ctx, {
        type: 'line',
        data: {
          labels: timeLabels,
          datasets: [
            {
              label: 'Elevation',
              data: altitudeData,
              borderColor: primaryTextColor,
              borderWidth: 1,
              fill: {
                target: { value: 0 }, // Fill area above 0° altitude
                above: fillColor,
                below: fillBellowColor,
              },
              cubicInterpolationMode: 'monotone',
              tension: 0.2,
              segment: {
                borderColor: (ctx) =>
                  ctx.p0.parsed.y >= 0 && ctx.p1.parsed.y >= 0 ? primaryTextColor : fillBellowColor,
                borderWidth: (ctx) => (ctx.p0.parsed.y <= 0 ? 1 : 1.2),
              },
              ...options,
            },
            {
              label: `${rise} / ${set}`,
              data: [],
            },
          ],
        },
        options: {
          responsive: true,
          interaction: {
            intersect: false,
            mode: 'index',
            axis: 'x',
          },
          scales: {
            y: {
              suggestedMax: sugestedYMax,
              suggestedMin: -60,
              ticks: {
                stepSize: 30, // Step size of 30
                ...ticksOptions,
              },
              grid: {
                display: true,
                drawTicks: true,
              },
              border: {
                display: false,
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
              ticks: {
                stepSize: 6, // Step size of 6 hours
                ...ticksOptions,
              },
              border: {
                display: false,
              },
            },
          },
          plugins: {
            legend: {
              display: true,
              labels: {
                usePointStyle: false,
                boxWidth: 0,
                boxHeight: 0,
                padding: 10,
                color: secondaryTextColor,
                font: {
                  size: 14,
                },
              },
            },
          },
        },
        plugins: [
          {
            id: 'currentPositionMarker',
            afterDatasetDraw(chart) {
              const dataSet = chart.getDatasetMeta(0);
              if (dataSet.hidden) return;
              const { ctx } = chart;
              const emoji = todayData.moonPhase.phase.emoji;
              const { index: currentHourIndex } = currentMoon;
              const dataset = chart.getDatasetMeta(0);
              const { x, y } = dataset.data[currentHourIndex].getProps(['x', 'y']);

              // Draw the emoji
              ctx.save();
              ctx.font = '24px serif';
              ctx.fillText(emoji, x - 12, y);
              ctx.restore();
            },
          },
          {
            id: 'setTimeMarker',
            afterDatasetDraw(chart) {
              const dataSet = chart.getDatasetMeta(1);
              if (dataSet.hidden) return;
              const {
                ctx,
                scales: { x, y },
              } = chart;
              if (showSetTime) {
                const { index: setIndex, fraction: setFraction, altitude: setAltitude } = setTimePosition;
                // Calculate x and y position for the marker
                const xPosition = x.getPixelForValue(setIndex + setFraction);
                const yPosition = y.getPixelForValue(setAltitude);
                ctx.save();
                drawTimeMarker(
                  ctx,
                  setLabel,
                  formatedSetTime,
                  xPosition,
                  yPosition,
                  sugestedYMin + 15,
                  sugestedYMin + 30
                );
                ctx.restore();
              }
              if (showRiseTime) {
                const { index: riseIndex, fraction: riseFraction, altitude: riseAltitude } = riseTimePosition;
                // Calculate x and y position for the marker
                const xRisePos = x.getPixelForValue(riseIndex + riseFraction);
                const yRisePos = y.getPixelForValue(riseAltitude);
                ctx.save();
                drawTimeMarker(ctx, riseLabel, formatedRiseTime, xRisePos, yRisePos, 55, 30);
                ctx.restore();
              }
            },
          },
          fillTopPlugin,
        ],
      });
    }
  }

  private fillTopPlugin = () => {
    const { secondaryTextColor, fillColor } = this.cssColors;
    return {
      id: 'filltop',
      beforeDraw(chart: Chart) {
        const {
          ctx,
          chartArea: { top, right },
          scales: { x, y },
        } = chart as Chart;
        const midX = x.getPixelForValue(0);
        const fillTop = y.getPixelForValue(0);
        const gradient = ctx.createLinearGradient(midX, top, midX, fillTop);
        gradient.addColorStop(0, 'rgba(255, 255, 255, 0)');
        gradient.addColorStop(1, fillColor);
        // Draw the fill color above the horizon
        ctx.save();
        ctx.fillStyle = gradient;
        ctx.fillRect(midX, top, right - midX, fillTop - top);
        ctx.restore();
        ctx.save();
        // Draw the line at horizon
        ctx.strokeStyle = secondaryTextColor;
        ctx.beginPath();
        ctx.lineWidth = 0.5;
        ctx.moveTo(midX, fillTop);
        ctx.lineTo(right, fillTop);
        ctx.stroke();
        ctx.restore();
      },
    };
  };

  private riseTimePlugin = () => {
    const riseTime = new Date(this.todayData.time.rise);
    const altitudes = Object.values(this.todayData.altitude) as number[];
    const formatedRiseTime = formatTime(riseTime, this.hass.locale);
    const riseTimePosition = this._getPosition(riseTime, altitudes);
    const showRiseTime = this.showOnChart(riseTime);
    const label = this.todayData.lang.rise;
    return { riseTime, formatedRiseTime, riseTimePosition, showRiseTime, label };
  };

  private setTimePlugin = () => {
    const setTime = new Date(this.todayData.time.set);
    const altitudes = Object.values(this.todayData.altitude) as number[];
    const formatedSetTime = formatTime(setTime, this.hass.locale);
    const setTimePosition = this._getPosition(setTime, altitudes);
    const showSetTime = this.showOnChart(setTime);
    const label = this.todayData.lang.set;
    return { setTime, formatedSetTime, setTimePosition, showSetTime, label };
  };

  private showOnChart = (time: Date): boolean => {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);
    return time > todayStart && time < todayEnd;
  };

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
      ${this._renderCurrentDate()}
    `;
  }

  private _renderCurrentDate(): TemplateResult {
    const dataItem = this.todayData.dataItem;
    return html`
      <div class="moon-data">
        <div class="moon-data-item">
          <span class="label">Current time</span>
          <div class="value">${formatDateTimeNumeric(new Date(), this.hass.locale)}</div>
        </div>
        ${Object.keys(dataItem).map((key) => {
          const { label, value, secondValue } = dataItem[key];
          return html`
            <div class="moon-data-item">
              <span class="label">${label}</span>
              <div class="value">
                ${value}
                ${secondValue
                  ? html`
                      <span>(${secondValue}) </span>
                      <ha-icon
                        class="direction-icon"
                        style=${`transform: rotate(${parseInt(value, 0)}deg)`}
                        icon="mdi:arrow-up-thin"
                      ></ha-icon>
                    `
                  : ''}
              </div>
            </div>
          `;
        })}
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

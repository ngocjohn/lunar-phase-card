import { LitElement, html, CSSResultGroup, TemplateResult, css } from 'lit';
import { customElement, state, property } from 'lit/decorators.js';
import { formatTime, formatDateTimeNumeric, HomeAssistant } from 'custom-card-helpers';
import { Chart, ChartData, ScriptableLineSegmentContext, ScaleChartOptions, ChartOptions, Plugin } from 'chart.js/auto';

import { Moon } from '../utils/moon';
import styles from '../css/style.css';
import { LunarPhaseCard } from '../lunar-phase-card';

@customElement('moon-horizon')
export class MoonHorizon extends LitElement {
  @property({ attribute: false }) public hass!: HomeAssistant;
  @property({ attribute: false }) moon!: Moon;
  @state() moonChart: Chart | null = null;
  @state() card!: LunarPhaseCard;
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
    console.log('MoonCard connected');
    window.MoonCard = this;
  }

  disconnectedCallback(): void {
    console.log('MoonCard disconnected');
    super.disconnectedCallback();
  }

  get todayData() {
    return this.moon.todayData;
  }

  private get plugins(): Plugin[] {
    const fillTopPlugin = this.fillTopPlugin();
    const timeMarkerPlugin = this.timeMarkerPlugin();
    const moonMarkerPlugin = this.moonMarkerPlugin();
    console.log('Plugins loaded');
    return [moonMarkerPlugin, timeMarkerPlugin, fillTopPlugin];
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
    console.time('Init chart');
    // Data
    const data = this._getDataset();
    const options = this._chartOptions();
    // Plugins

    const customPlugins = this.plugins;
    // Create the chart
    const ctx = this.shadowRoot?.getElementById('moonPositionChart') as HTMLCanvasElement;
    if (ctx) {
      this.moonChart = new Chart(ctx, {
        type: 'line',
        data: data,
        options: options,
        plugins: [...customPlugins],
      });
    }
    console.timeEnd('Init chart');
  }

  protected render(): TemplateResult {
    return html`
      <div class="moon-horizon">
        <canvas id="moonPositionChart" width=${this.card._cardWidth}></canvas>
      </div>
      ${this._renderDataItem()}
    `;
  }

  private _renderDataItem(): TemplateResult {
    const dataItem = this.moon.todayDataItem;
    return html`
      <div class="moon-data">
        <div class="moon-data-item">
          <span class="label">${this.card.localize('card.currentTime')}</span>
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

  /* -------------------------------- DATASETS -------------------------------- */

  private _getDataset = (): ChartData => {
    const { primaryTextColor, secondaryTextColor, fillColor, fillBellowColor } = this.cssColors;
    const todayData = this.todayData;
    const timeLabels = todayData.timeLabels;
    const altitudeData = todayData.altitudeData;
    const { set, rise } = todayData.lang;

    const pointsOptions = {
      radius: 1.1,
      pointHoverRadius: 5,
      pointHoverBackgroundColor: secondaryTextColor,
      pointHoverBorderWidth: 4,
    };

    const moonDataset = {
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
        borderColor: (ctx: ScriptableLineSegmentContext) =>
          ctx.p0.parsed.y >= 0 && ctx.p1.parsed.y >= 0 ? primaryTextColor : fillBellowColor,
        borderWidth: (ctx: ScriptableLineSegmentContext) => (ctx.p0.parsed.y <= 0 ? 1 : 1.2),
      },
      ...pointsOptions,
    };

    const timeDataset = {
      label: `${rise} / ${set}`,
      data: [],
    };

    const data = {
      labels: timeLabels,
      datasets: [moonDataset, timeDataset],
    };

    return data;
  };

  private _chartOptions = () => {
    const { secondaryTextColor } = this.cssColors;
    const { sugestedYMax } = this.todayData.minMaxY;
    const ticksOptions = {
      color: secondaryTextColor,
    };

    const scales = {} as ScaleChartOptions;
    scales['y'] = {
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
    };

    scales['x'] = {
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
    };

    const plugins = {
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
    };

    // Options
    const options = {} as ChartOptions;

    options.responsive = true;
    options.interaction = {
      intersect: false,
      mode: 'index',
      axis: 'x',
    };
    options.scales = scales;
    options.plugins = plugins;

    return options;
  };

  /* --------------------------------- PLUGINS -------------------------------- */
  private moonMarkerPlugin = (): Plugin => {
    const emoji = this.todayData.moonPhase.phase.emoji;
    const getIndex = () => {
      const now = new Date();
      const hour = now.getHours() + now.getMinutes() / 60;
      const index = Math.floor(hour);
      return index;
    };

    const currentHourIndex = getIndex();

    return {
      id: 'moonMarkerPlugin',
      afterDatasetDraw(chart: Chart) {
        const dataSet = chart.getDatasetMeta(0);
        if (dataSet.hidden) return;
        const { ctx } = chart as Chart;
        const dataset = chart.getDatasetMeta(0);
        const { x, y } = dataset.data[currentHourIndex].getProps(['x', 'y']);

        // Draw the emoji
        ctx.save();
        ctx.font = '24px serif';
        ctx.fillText(emoji, x - 12, y);
        ctx.restore();
      },
    };
  };

  private fillTopPlugin = (): Plugin => {
    const { secondaryTextColor, fillColor } = this.cssColors;
    return {
      id: 'fillTopPlugin',
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

  private getTimeMarkers() {
    const { sugestedYMin } = this.todayData.minMaxY;
    const altitudes = Object.values(this.todayData.altitude) as number[];

    const showOnChart = (time: Date): boolean => {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      const todayEnd = new Date();
      todayEnd.setHours(23, 59, 59, 999);
      return time > todayStart && time < todayEnd;
    };

    const _getPosition = (
      time: Date,
      altitudeData: number[]
    ): { index: number; fraction: number; altitude: number } => {
      const hour = time.getHours() + time.getMinutes() / 60;
      const index = Math.floor(hour);
      const fraction = hour - index;
      const altitude = altitudeData[index] + (altitudeData[index + 1] - altitudeData[index]) * fraction;
      return { index, fraction, altitude };
    };

    const generateData = (key: string) => {
      const time = new Date(this.todayData.time[key]);
      const formattedTime = formatTime(time, this.hass.locale);
      const position = _getPosition(time, altitudes);
      const show = showOnChart(time);
      const label = this.todayData.lang[key];
      const yMinOffset = key === 'set' ? sugestedYMin + 15 : 55;
      const yTextOffset = key === 'set' ? sugestedYMin + 30 : 30;
      return { show, position, label, formattedTime, yMinOffset, yTextOffset };
    };

    const markers = ['rise', 'set'].map((key) => generateData(key));

    return markers;
  }

  private timeMarkerPlugin = (): Plugin => {
    const timeMarkers = this.getTimeMarkers();
    const { secondaryTextColor, fillColor } = this.cssColors;
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

    return {
      id: 'timeMarkerPlugin',
      afterDatasetDraw(chart: Chart) {
        const dataSet = chart.getDatasetMeta(1);
        if (dataSet.hidden) return;

        const {
          ctx,
          scales: { x, y },
        } = chart;

        // Iterate over each time marker and draw if necessary
        timeMarkers.forEach(({ show, position, label, formattedTime, yMinOffset, yTextOffset }) => {
          if (show) {
            const { index, fraction, altitude } = position;
            const xPosition = x.getPixelForValue(index + fraction);
            const yPosition = y.getPixelForValue(altitude);

            ctx.save();
            drawTimeMarker(ctx, label, formattedTime, xPosition, yPosition, yMinOffset, yTextOffset);
            ctx.restore();
          }
        });
      },
    };
  };
}

declare global {
  interface HTMLElementTagNameMap {
    'moon-horizon': MoonHorizon;
  }
  interface Window {
    MoonCard: MoonHorizon;
  }
}

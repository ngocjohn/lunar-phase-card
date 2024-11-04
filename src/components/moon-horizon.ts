import { LitElement, html, CSSResultGroup, TemplateResult, css } from 'lit';
import { customElement, state, property } from 'lit/decorators.js';
import { formatTime, formatDateTime, HomeAssistant } from 'custom-card-helpers';
// Chart.js
import {
  Chart,
  ChartData,
  ScriptableLineSegmentContext,
  ScaleOptions,
  ChartOptions,
  Plugin,
  ScaleChartOptions,
} from 'chart.js/auto';
import annotationPlugin from 'chartjs-plugin-annotation';
import type { ChartDataset } from 'chart.js/auto';
Chart.register(annotationPlugin);

// Local imports
import { Moon } from '../utils/moon';
import { LunarPhaseCard } from '../lunar-phase-card';

// Styles
import styles from '../css/style.css';

const HOVER_TIMEOUT = 100;

@customElement('moon-horizon')
export class MoonHorizon extends LitElement {
  @property({ attribute: false }) public hass!: HomeAssistant;
  @property({ attribute: false }) moon!: Moon;
  @property({ attribute: false }) card!: LunarPhaseCard;

  @state() moonChart: Chart | null = null;
  @state() moreInfo = false;
  @state() tooltip = true;
  @state() private hoverTimeout: number | null = null;

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
        .moon-data-wrapper {
          display: flex;
          flex-direction: column;
          backdrop-filter: blur(4px);
        }
        .moon-data-header {
          display: inline-flex;
          justify-content: space-between;
          align-items: end;
          height: fit-content;
          padding: 0.5rem 0.5rem 0px;
          color: var(--lunar-card-label-font-color);
          font-weight: 600;
        }
        .moon-data[show='false'] {
          max-height: 0px;
          overflow: hidden;
          transition: all 0.4s ease-in-out;
          opacity: 0;
        }
        .moon-data[show='true'] {
          margin-top: 0.5rem;
          max-height: 500px;
          transition: all 0.4s ease-in-out;
          border-top: 1px solid var(--divider-color);
        }
        .direction-icon {
          display: inline-block;
          transition: transform 0.4s ease-in-out;
        }

        ha-icon[active] {
          transform: rotate(180deg);
          transition: transform 0.4s ease-in-out;
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
    // Data
    const data = this._getChartData();
    const options = this._chartOptions();
    // Plugins

    const customPlugins = this.plugins;
    // Create the chart
    const ctx = this.shadowRoot?.getElementById('moonPositionChart') as HTMLCanvasElement;
    if (ctx) {
      this.moonChart = new Chart(ctx, {
        type: 'line',
        data: data,
        options: {
          ...options,
          scales: {
            ...options.scales,
            x: {
              ...options?.scales?.x?.ticks,
              ticks: {
                callback: function (value, index) {
                  return index % 2 === 0 ? this.getLabelForValue(Number(value)) : '';
                },
                align: 'start',
              },
            },
            y: {
              ...options.scales?.y,
              ticks: {
                ...options.scales?.y?.ticks,
                callback: function (value) {
                  return value + '°';
                },
              },
              grid: {
                ...options.scales?.y?.grid,
                drawOnChartArea: false,
                display: true,
              },
            },
          },
          plugins: {
            ...options.plugins,
            tooltip: {
              ...options.plugins?.tooltip,
              usePointStyle: true,
              callbacks: {
                label: (context) => {
                  const { datasetIndex, dataIndex } = context;
                  const dataset = this.moonChart?.data.datasets?.[datasetIndex];
                  const label = dataset?.label;
                  const value = dataset?.data[dataIndex];
                  return `${label}: ${value}°`;
                },
                labelPointStyle: () => {
                  return {
                    pointStyle: 'triangle',
                    rotation: 0,
                  };
                },
              },
            },
          },
          // Hover on point
          onHover: (_event, elements) => {
            if (elements.length > 0) {
              // Clear the previous timeout if there is one
              if (this.hoverTimeout) {
                clearTimeout(this.hoverTimeout);
              }

              this.hoverTimeout = window.setTimeout(() => {
                const element = elements[0];
                const dataIndex = element.index;
                this.hoverCustomDate(dataIndex);
              }, HOVER_TIMEOUT); // Delay the hover event
            } else {
              // Clear the timeout if no element is hovered
              if (this.hoverTimeout) {
                clearTimeout(this.hoverTimeout);
                this.hoverTimeout = null;
              }
            }
          },
        },
        plugins: [...customPlugins],
      });
      // Add event listeners
      ctx.addEventListener('mouseout', () => {
        // Clear the hover timeout
        if (this.hoverTimeout) {
          clearTimeout(this.hoverTimeout);
          this.hoverTimeout = null;
        }

        // Reset the selected date
        if (this.card.selectedDate !== undefined) {
          this.card.selectedDate = undefined;
        }
      });

      ctx.addEventListener('mouseover', () => {
        console.log('Mouse over');
      });
    }
  }

  protected render(): TemplateResult {
    const locale = this.hass.locale;
    locale.language = this.card.selectedLanguage;
    return html`
      <div class="moon-horizon">
        <canvas id="moonPositionChart" width=${this.card._cardWidth}></canvas>
      </div>
      <div class="moon-data-wrapper">
        <div class="moon-data-header">
          ${this.card.selectedDate !== undefined
            ? formatDateTime(this.card.selectedDate, locale)
            : formatDateTime(new Date(), locale)}
          <ha-icon
            class="click-shrink"
            @click=${() => (this.moreInfo = !this.moreInfo)}
            icon=${'mdi:chevron-down'}
            ?active=${this.moreInfo}
          >
          </ha-icon>
        </div>
        <div class="moon-data" show=${this.moreInfo}>${this._renderDataItem()}</div>
      </div>
    `;
  }

  private _renderDataItem(): TemplateResult {
    if (!this.moreInfo) return html``;
    const dataItem = this.moon.todayDataItem;
    return html`
      ${Object.keys(dataItem).map((key) => {
        const { label, value, secondValue } = dataItem[key];
        return html`
          <div class="moon-data-item">
            <span class="label">${label}</span>
            <div class="value">
              ${value}
              ${secondValue
                ? html`
                    <span> (${secondValue}) </span>
                    <span class="direction-icon" style=${`transform: rotate(${parseInt(value, 0)}deg);`}>
                      <ha-icon icon="mdi:arrow-up-thin"></ha-icon>
                    </span>
                  `
                : ''}
            </div>
          </div>
        `;
      })}
    `;
  }

  async hoverCustomDate(dataIndex: number): Promise<void> {
    if (!this.moreInfo) return;
    const time = this.todayData.timeLabels[dataIndex];
    const hourMin = time.split(':');
    const today = new Date();
    const customDate = new Date(today.setHours(parseInt(hourMin[0], 0), parseInt(hourMin[1], 0), 0, 0));
    this.card.selectedDate = customDate;
  }

  /* -------------------------------- DATASETS -------------------------------- */

  private _getChartData = (): ChartData => {
    const { primaryTextColor, secondaryTextColor, fillColor, fillBellowColor } = this.cssColors;
    const todayData = this.todayData;
    const timeLabels = todayData.timeLabels;
    const altitudeData = todayData.altitudeData;
    const { set, rise } = todayData.lang;
    const langAltitude = this.card.localize('card.altitude');

    const pointsOptions = {
      radius: 1.1,
      pointHoverRadius: 5,
      pointHoverBackgroundColor: secondaryTextColor,
      pointHoverBorderWidth: 4,
    };

    const moonDataset = {
      label: langAltitude,
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
      labels: timeLabels as ChartData['labels'],
      datasets: [moonDataset, timeDataset] as ChartDataset[],
    };
    return data as ChartData;
  };

  private _chartOptions = (): ChartOptions => {
    const { secondaryTextColor } = this.cssColors;
    const { sugestedYMax, sugestedYMin } = this.todayData.minMaxY;
    const ticksOptions = {
      color: secondaryTextColor,
    };

    // Scales
    const scales = {} as ScaleOptions;
    scales['y'] = {
      suggestedMax: 60 + sugestedYMax,
      suggestedMin: sugestedYMin > -60 ? -60 : sugestedYMin,
      ticks: {
        stepSize: 15, // Step size of 30
        ...ticksOptions,
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
        ...ticksOptions,
      },
      border: {
        display: false,
      },
    };

    const plugins: ChartOptions['plugins'] = {};

    plugins['legend'] = {
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
    };

    plugins['annotation'] = {
      annotations: {
        line1: {
          type: 'line',
          borderColor: secondaryTextColor,
          borderWidth: 0.5,
          scaleID: 'y',
          value: 0,
        },
      },
    };

    plugins['tooltip'] = {
      enabled: this.tooltip !== false,
    };

    // Options
    const options = {} as ChartOptions;

    options.responsive = true;
    options.interaction = {
      intersect: false,
      mode: 'index',
      axis: 'x',
    };
    options.scales = scales as ScaleChartOptions;
    options.plugins = plugins;

    return options;
  };

  /* --------------------------------- PLUGINS -------------------------------- */
  private moonMarkerPlugin = (): Plugin => {
    const emoji = this.todayData.moonPhase.phase.emoji;
    const getIndex = () => {
      const now = new Date();
      const hour = now.getHours() + now.getMinutes() / 60;
      const index = Math.floor(hour) * 2;
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
    const { fillColor } = this.cssColors;
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
      },
    };
  };

  private getTimeMarkers() {
    const showOnChart = (time: Date): boolean => {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      const todayEnd = new Date();
      todayEnd.setHours(23, 59, 59, 999);
      return time > todayStart && time < todayEnd;
    };

    const generateData = (key: string) => {
      const time = new Date(this.todayData.time[key]);
      const formattedTime = formatTime(time, this.hass.locale);
      const position = this.moon._getRiseSetData(key);
      const show = showOnChart(time);
      const direction = this.moon.todayData.direction[key];
      const label = this.todayData.lang[key];
      const lineOffset = key === 'set' ? -20 : 20;
      const textOffset = key === 'set' ? -30 : 60;
      return { show, position, label, formattedTime, lineOffset, textOffset, direction };
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
      direction: string,
      x: number,
      y: number,
      lineOffset: number,
      textOffset: number
    ) => {
      ctx.save();
      ctx.font = '12px';
      ctx.fillStyle = secondaryTextColor;
      ctx.strokeStyle = fillColor;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x, y - lineOffset);
      ctx.stroke();
      ctx.fillText(label, x - 12, y - textOffset);
      ctx.fillText(formatedTime, x - 12, y - textOffset + 15);
      ctx.fillText(direction, x - 12, y - textOffset + 30);
      ctx.restore();
    };

    return {
      id: 'timeMarkerPlugin',
      afterDatasetDraw(chart: Chart) {
        const timeDdataSet = chart.getDatasetMeta(1);
        if (timeDdataSet.hidden) return;
        const {
          ctx,
          scales: { x, y },
        } = chart;

        // Iterate over each time marker and draw if necessary
        timeMarkers.forEach(({ show, position, label, formattedTime, lineOffset, textOffset, direction }) => {
          if (show) {
            const { index, altitude } = position;
            const xPosition = x.getPixelForValue(index);
            const yPosition = y.getPixelForValue(altitude);

            drawTimeMarker(ctx, label, formattedTime, direction, xPosition, yPosition, lineOffset, textOffset);
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

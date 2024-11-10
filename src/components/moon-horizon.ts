import { formatDateTime, HomeAssistant, formatDateTimeWithSeconds } from 'custom-card-helpers';
import { LitElement, html, CSSResultGroup, TemplateResult, css, PropertyValues } from 'lit';
import { customElement, state, property } from 'lit/decorators.js';

import type { ChartDataset } from 'chart.js/auto';

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
// import annotationPlugin from 'chartjs-plugin-annotation';
// Chart.register(annotationPlugin);

import { LunarPhaseCard } from '../lunar-phase-card';
// Local imports
import { Moon } from '../utils/moon';

// Styles
import styles from '../css/style.css';
import { ChartColors } from '../types';
import { MOON_RISE_ICON, MOON_SET_ICON } from '../utils/moon-pic';

const HOVER_TIMEOUT = 50;

@customElement('moon-horizon')
export class MoonHorizon extends LitElement {
  @property({ attribute: false }) public hass!: HomeAssistant;
  @property({ attribute: false }) moon!: Moon;
  @property({ attribute: false }) card!: LunarPhaseCard;

  @property({ type: Object }) private _chart: Chart | null = null;
  @state() moreInfo = false;
  @state() hoverOnChart = false;
  @state() hoverTimeout: number | null = null;

  @state() private _timeAnimationFrame: number | null = null;
  @state() private _lastTime: string | null = null;
  @state() _resizeInitiated = false;
  @state() _chartWidth = 0;
  @state() _resizeObserver: ResizeObserver | null = null;

  connectedCallback(): void {
    super.connectedCallback();
    if (!this._resizeInitiated && !this._resizeObserver) {
      this.delayedAttachResizeObserver();
    }
  }

  disconnectedCallback(): void {
    this.cancelTimeAnimationFrame();
    this.detachResizeObserver();
    this._resizeInitiated = false;
    super.disconnectedCallback();
  }

  delayedAttachResizeObserver(): void {
    setTimeout(() => {
      this.attachResizeObserver();
      this._resizeInitiated = true;
    }, 0);
  }

  attachResizeObserver(): void {
    if (this._resizeObserver) {
      return;
    }
    this._resizeObserver = new ResizeObserver(() => {
      this.measureCard();
    });

    const card = this.offsetParent as HTMLElement;
    if (card) {
      this._resizeObserver.observe(card);
    }
  }

  detachResizeObserver(): void {
    if (this._resizeObserver) {
      this._resizeObserver.disconnect();
      this._resizeObserver = null;
    }
  }

  private measureCard(): void {
    const card = this.offsetParent as HTMLElement;
    if (card) {
      this._chartWidth = card.offsetWidth;
    }
  }

  protected async firstUpdated(changedProps: PropertyValues): Promise<void> {
    super.firstUpdated(changedProps);

    await new Promise((resolve) => setTimeout(resolve, 50));
    this.setupChart();
  }

  static get styles(): CSSResultGroup {
    return [
      css`
        .moon-horizon {
          display: flex;
          position: relative;
          margin: 0;
          width: 100%;
          height: 100%;
          /* box-shadow: 0 0 6px #e1e0dd30; */
          max-width: 900px;
          backdrop-filter: blur(4px);
          border-radius: 0;
          /* border: 1px solid var(--divider-color); */
          box-sizing: border-box;
          padding: 0 2px;
        }

        .moon-horizon canvas {
          width: 100%;
          height: 100%;
        }

        .moon-data-wrapper {
          display: flex;
          flex-direction: column;
          backdrop-filter: blur(4px);
          padding-inline: 12px;
        }
        .moon-data-header {
          display: inline-flex;
          justify-content: space-between;
          align-items: end;
          height: fit-content;
          padding-left: 0.5rem;
          color: var(--lunar-card-label-font-color);
          /* font-weight: 600; */
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

  private get todayData() {
    return this.moon.todayData;
  }

  private get plugins(): Plugin[] {
    const fillTopPlugin = this.fillTopPlugin();
    const timeMarkerPlugin = this.timeMarkerPlugin();
    const moonMarkerPlugin = this.moonMarkerPlugin();

    return [moonMarkerPlugin, timeMarkerPlugin, fillTopPlugin];
  }

  private get chartData(): ChartData {
    return this._getChartData();
  }

  private get chartOptions(): ChartOptions {
    return this._chartOptions();
  }

  private cssColors(): ChartColors {
    const cssColors = getComputedStyle(this) as CSSStyleDeclaration;
    return {
      primaryTextColor: cssColors.getPropertyValue('--lunar-card-label-font-color'),
      secondaryTextColor: cssColors.getPropertyValue('--secondary-text-color'),
      fillColor: cssColors.getPropertyValue('--lunar-fill-color'),
      fillBelowColor: cssColors.getPropertyValue('--lunar-fill-bellow-color'),
      fillBelowLineColor: cssColors.getPropertyValue('--lunar-fill-line-bellow-color'),
    };
  }

  private setupChart(): void {
    if (this._chart) {
      this._chart.destroy();
    }

    // Data
    const data = this.chartData;
    const options = this.chartOptions;
    // Plugins
    const customPlugins = this.plugins;
    const ctx = this.shadowRoot?.querySelector('canvas') as HTMLCanvasElement;
    if (ctx) {
      this._chart = new Chart(ctx, {
        type: 'line',
        data: data,
        options: {
          ...options,
          resizeDelay: 1000,
          aspectRatio: 2,
          scales: {
            ...options.scales,
            x: {
              ...options.scales?.x,
              // reverse: true,
              ticks: {
                ...options.scales?.x?.ticks,

                callback: function (value, index) {
                  return (index + 1) % 2 === 0 ? this.getLabelForValue(Number(value)) : '';
                },
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
            },
          },

          // Hover on point
          onHover: (_event, elements) => {
            if (elements.length > 0) {
              this.hoverOnChart = true;
              const element = elements[0];
              const xTimeNum = element.element.getProps(['raw'], true).raw.x;
              this.handlePointHover(xTimeNum);

              this._chart?.update('default');
            }
          },
          onClick: (_event, elements) => {
            if (elements.length > 0) {
              const element = elements[0];
              const dataIndex = element.index;
              // console.log('Clicked on', dataIndex, element);
            }
          },
          onResize: (_chart, size) => {
            if (this._chartWidth !== size.width) {
              _chart.resize();
              _chart.update('none');
            }
          },
        },

        plugins: [...customPlugins],
      });
      // Add event listeners
      ctx.addEventListener('mouseout', () => {
        this.hoverTimeout = window.setTimeout(() => {
          this.hoverOnChart = false;
          this._chart?.update();
        }, HOVER_TIMEOUT);
        // Reset the selected date
        if (this.card.selectedDate !== undefined) {
          this.card.selectedDate = undefined;
        }
      });
    }
  }

  protected render(): TemplateResult {
    return html`
      <div class="moon-horizon">
        <canvas id="moonPositionChart" width=${this._chartWidth}></canvas>
      </div>
      <div class="moon-data-wrapper">
        <div class="moon-data-header">
          ${this.renderHeaderTime()}
          <ha-icon
            class="click-shrink"
            @click=${() => (this.moreInfo = !this.moreInfo)}
            icon=${'mdi:chevron-down'}
            ?active=${this.moreInfo}
          >
          </ha-icon>
        </div>
        <div class="moon-data" show=${this.moreInfo}>${this.renderDataItem()}</div>
      </div>
    `;
  }

  private renderHeaderTime(): TemplateResult {
    const locale = this.card._locale;

    // Start the animation frame loop if it hasn't started yet
    if (!this._timeAnimationFrame && this.card.selectedDate === undefined) {
      // console.log('Starting animation frame');
      const updateFrame = () => {
        this._timeAnimationFrame = requestAnimationFrame(updateFrame);

        const currentTime = new Date().toLocaleTimeString();
        // Only re-render if the seconds have changed
        if (currentTime !== this._lastTime) {
          this._lastTime = currentTime;
        }
      };
      this._timeAnimationFrame = requestAnimationFrame(updateFrame);
    }

    const timeStr =
      this.card.selectedDate !== undefined
        ? formatDateTime(this.card.selectedDate, locale)
        : formatDateTimeWithSeconds(new Date(), locale);

    return html` ${timeStr} `;
  }

  private renderDataItem(): TemplateResult {
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

  async handlePointHover(date: number): Promise<void> {
    if (!this.moreInfo) return;
    const time = new Date(date);
    this.card.selectedDate = time;
  }

  private cancelTimeAnimationFrame(): void {
    // Cancel the animation frame when the component is disconnected
    if (this._timeAnimationFrame) {
      cancelAnimationFrame(this._timeAnimationFrame);
      this._timeAnimationFrame = null;
    }
  }

  /* -------------------------------- DATASETS -------------------------------- */

  private _getChartData = (): ChartData => {
    const { primaryTextColor, secondaryTextColor, fillColor, fillBelowColor, fillBelowLineColor } = this.cssColors();
    const todayData = this.todayData;
    const timeLabels = todayData.timeLabels;

    const altitudeData = todayData.altitude;
    const { set, rise } = todayData.lang;
    const langAltitude = this.card.localize('card.altitude');

    const moonDataset = {
      label: langAltitude,
      data: altitudeData,
      borderColor: primaryTextColor,
      borderWidth: 1,
      fill: {
        target: { value: 0 }, // Fill area above 0° altitude
        above: fillColor,
        below: fillBelowColor,
      },
      cubicInterpolationMode: 'monotone',
      tension: 1,
      segment: {
        borderColor: (ctx: ScriptableLineSegmentContext) =>
          ctx.p0.parsed.y >= -0.001 && ctx.p1.parsed.y >= -0.001 ? primaryTextColor : fillBelowLineColor,
        borderWidth: (ctx: ScriptableLineSegmentContext) =>
          ctx.p0.parsed.y >= -0.001 && ctx.p1.parsed.y >= -0.001 ? 1.2 : 1,
      },
      radius: () => (this.hoverOnChart ? 1.1 : 0),
      pointHoverRadius: 3,
      pointHoverBackgroundColor: secondaryTextColor,
      pointHoverBorderWidth: 2,
    };

    const timeDataset = {
      label: `${rise} / ${set}`,
      data: [],
    };

    const datasets: ChartDataset[] = [];
    datasets.push(moonDataset);
    this.card.config?.graph_config?.show_time || this.card.config?.graph_config?.show_time === undefined
      ? datasets.push(timeDataset)
      : null;

    const data = {
      labels: timeLabels,
      datasets: datasets,
    };
    return data as ChartData;
  };

  private _chartOptions = (): ChartOptions => {
    const { secondaryTextColor } = this.cssColors();
    const { sugestedYMax, sugestedYMin } = this.todayData.minMaxY;
    const graphConfig = this.card.config?.graph_config;
    const currentMoon = this.moon._fetchtCurrentMoon();
    const ticksOptions = {
      color: secondaryTextColor,
    };

    // Scales
    const scales = {} as ScaleOptions;
    scales['y'] = {
      suggestedMax: sugestedYMax + 30,
      suggestedMin: sugestedYMin > -60 ? -60 : sugestedYMin,
      ticks: {
        ...ticksOptions,
        display: graphConfig?.y_ticks || false,
        stepSize: graphConfig?.y_ticks_step_size || 30,
      },
      bounds: 'data',
      border: {
        display: false,
      },
      grid: {
        drawOnChartArea: false,
        display: false,
      },
      position: graphConfig?.y_ticks_position || 'left',
    };

    scales['x'] = {
      grid: {
        display: false,
      },
      ticks: {
        ...ticksOptions,
        display: graphConfig?.x_ticks || false,
        maxRotation: 40,
      },
      border: {
        display: false,
      },
    };

    const plugins: ChartOptions['plugins'] = {};

    plugins['legend'] = {
      display: graphConfig?.show_legend ?? true,
      align: graphConfig?.legend_align || 'center',
      position: graphConfig?.legend_position || 'bottom',
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

    plugins['tooltip'] = {
      backgroundColor: (ctx) => {
        const index = ctx?.tooltipItems?.[0]?.dataIndex;
        return index === currentMoon.currentHourIndex ? 'black' : 'rgba(0, 0, 0, 0.8)';
      },
      titleColor: (ctx) => {
        const index = ctx?.tooltipItems?.[0]?.dataIndex;
        return index === currentMoon.currentHourIndex ? 'red' : secondaryTextColor;
      },
      callbacks: {
        title: (ctx) => (ctx[0].dataIndex === currentMoon.currentHourIndex ? currentMoon.title : ctx[0].label),
        label: (ctx) => (ctx.dataIndex === currentMoon.currentHourIndex ? currentMoon.body : `${ctx.formattedValue}°`),
      },
      bodyFont: {
        size: 14,
      },
      titleAlign: 'right',
      bodyAlign: 'right',
      displayColors: false,
      padding: 10,
    };

    const layout: ChartOptions['layout'] = {
      padding: {
        bottom: 10,
        left: 4,
        right: 4,
        top: 10,
      },
    };
    // Options
    const options = {} as ChartOptions;

    options.responsive = true;
    options.interaction = {
      intersect: false,
      mode: 'nearest',
      axis: 'xy',
    };
    options.scales = scales as ScaleChartOptions;
    options.plugins = plugins;
    options.layout = layout;

    return options;
  };

  /* --------------------------------- PLUGINS -------------------------------- */
  private moonMarkerPlugin = (): Plugin => {
    const emoji = this.todayData.moonPhase.phase.emoji;
    const { currentHourIndex, altitudeDegrees } = this.moon._fetchtCurrentMoon();
    const showCurrent = this.card.config?.graph_config?.show_current ?? true;
    if (!showCurrent) return { id: 'moonMarkerPlugin' };
    return {
      id: 'moonMarkerPlugin',
      afterDatasetsDraw(chart: Chart) {
        const dataSet = chart.getDatasetMeta(0);
        if (dataSet.hidden) return;
        const {
          ctx,
          scales: { x, y },
        } = chart;

        const xPosition = x.getPixelForValue(currentHourIndex);
        const yPosition = y.getPixelForValue(altitudeDegrees) + 6;
        if (emoji) {
          // Draw the emoji
          ctx.save();
          ctx.font = '24px serif';
          ctx.fillText(emoji, xPosition, yPosition);
          ctx.restore();
        }
      },
    };
  };

  private fillTopPlugin = (): Plugin => {
    const { fillColor, secondaryTextColor } = this.cssColors();
    return {
      id: 'fillTopPlugin',
      beforeDraw(chart: Chart) {
        const {
          ctx,
          chartArea: { top, right, left },
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
        ctx.beginPath();
        ctx.fillStyle = secondaryTextColor;
        ctx.strokeStyle = secondaryTextColor;
        ctx.lineWidth = 0.5;
        ctx.moveTo(left, fillTop);
        ctx.lineTo(right, fillTop);
        ctx.stroke();
      },
    };
  };

  private timeMarkerPlugin = (): Plugin => {
    const timeMarkers = this.todayData.timeMarkers;
    const { secondaryTextColor, fillColor } = this.cssColors();

    // Pre-load SVG images as Image objects
    const moonUpSvg = new Image();
    const moonDownSvg = new Image();

    moonUpSvg.src =
      'data:image/svg+xml;charset=utf-8,' +
      encodeURIComponent(MOON_RISE_ICON.replace('currentcolor', secondaryTextColor));
    moonDownSvg.src =
      'data:image/svg+xml;charset=utf-8,' +
      encodeURIComponent(MOON_SET_ICON.replace('currentcolor', secondaryTextColor));

    const getMaxValueText = (ctx: CanvasRenderingContext2D, isUp: string, formatedTime: string, direction: string) => {
      const setRiseWidth = ctx.measureText(isUp).width;
      const timeWidth = ctx.measureText(formatedTime).width;
      const directionWidth = ctx.measureText(direction).width;
      return Math.max(setRiseWidth, timeWidth, directionWidth);
    };

    const drawTimeMarker = (
      ctx: CanvasRenderingContext2D,
      isUp: boolean,
      formatedTime: string,
      direction: string,
      x: number,
      y: number,
      lineOffset: number,
      xOffset: number,
      textAlign: CanvasTextAlign
    ) => {
      ctx.save();

      // Draw the chevron arrow (up or down)
      ctx.beginPath();
      ctx.moveTo(x - 5, y); // Starting point for the left edge
      if (isUp) {
        // Chevron pointing up
        ctx.lineTo(x, y - 5); // Top point of the chevron
        ctx.lineTo(x + 5, y); // Right edge
      } else {
        // Chevron pointing down
        ctx.lineTo(x, y + 5); // Bottom point of the chevron
        ctx.lineTo(x + 5, y); // Right edge
      }
      ctx.closePath();
      ctx.fillStyle = secondaryTextColor;
      ctx.fill();

      // Draw the line
      ctx.beginPath();
      ctx.fillStyle = secondaryTextColor;
      ctx.strokeStyle = fillColor;
      ctx.beginPath();
      ctx.moveTo(x, y);
      if (isUp) {
        ctx.lineTo(x, y - lineOffset);
      } else {
        ctx.lineTo(x, y + lineOffset);
      }
      ctx.stroke();

      ctx.fillStyle = secondaryTextColor;
      ctx.textAlign = textAlign;
      ctx.font = '12px Arial';
      ctx.filter = this.hoverOnChart ? 'opacity(0.2)' : 'opacity(1)';
      // Load and draw the SVG based on `isUp`
      const imgToDraw = isUp ? moonUpSvg : moonDownSvg;
      const timeWidth = ctx.measureText(formatedTime).width;
      let iconOffset: number = 0;

      // Determine `iconOffset` based on `textAlign`
      if (textAlign === 'start') {
        iconOffset = xOffset + timeWidth + 5; // Icon placed to the right of the text
      } else if (textAlign === 'end') {
        iconOffset = xOffset - timeWidth - 22; // Icon placed to the left of the text (accounting for the icon width)
      }

      // Draw the time and direction text
      if (isUp) {
        ctx.fillText(direction, xOffset, y - lineOffset - 10);
        ctx.fillText(formatedTime, xOffset, y - lineOffset - 27);
      } else {
        ctx.fillText(direction, xOffset, y + lineOffset + 27);
        ctx.fillText(formatedTime, xOffset, y + lineOffset + 10);
      }
      // Draw the icon
      ctx.drawImage(imgToDraw, iconOffset, isUp ? y - lineOffset - 37 : y + lineOffset - 5, 18, 18);
      ctx.restore();
    };

    return {
      id: 'timeMarkerPlugin',
      beforeDatasetDraw(chart: Chart) {
        const timeDataSet = chart.getDatasetMeta(1);
        if (timeDataSet.type === null || timeDataSet.hidden) return;
        const {
          ctx,
          chartArea: { left, right, bottom, top },
          scales: { x, y },
        } = chart;
        // Iterate over each time marker and draw if necessary

        timeMarkers.map((timeMarker: any) => {
          const { show, position, isUp, formatedTime, direction } = timeMarker;
          if (show) {
            const { index } = position;

            const xPosition = x.getPixelForValue(index);
            const yPosition = y.getPixelForValue(0);

            const lineOffset = isUp ? Math.round((yPosition - top) / 2) : Math.round((bottom - yPosition) / 2);
            const maxTextWidth = getMaxValueText(ctx, isUp ? 'Rise' : 'Set', formatedTime, direction);

            let textAlign: CanvasTextAlign = 'start';
            let centerText = maxTextWidth / 2;
            let xOffset = xPosition;

            if (xPosition + centerText > right) {
              textAlign = 'end';
              xOffset = xPosition - 2;
            } else if (xPosition - centerText < left) {
              textAlign = 'start';
              xOffset = xPosition + 2;
            } else {
              xOffset = xPosition - centerText;
            }

            drawTimeMarker(ctx, isUp, formatedTime, direction, xPosition, yPosition, lineOffset, xOffset, textAlign);
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

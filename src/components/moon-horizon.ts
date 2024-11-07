import { formatDateTime, HomeAssistant, formatDateTimeWithSeconds } from 'custom-card-helpers';
import { LitElement, html, CSSResultGroup, TemplateResult, css } from 'lit';
import { customElement, state, property } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';

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
import annotationPlugin from 'chartjs-plugin-annotation';
Chart.register(annotationPlugin);

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

  @state() _chart!: Chart;
  @state() moreInfo = false;
  @state() hoverOnChart = false;
  @state() hoverTimeout: number | null = null;

  private _timeAnimationFrame: number | null = null;
  private _lastTime: string | null = null;
  private cardWidth = 500;

  connectedCallback(): void {
    super.connectedCallback();
    console.log('MoonCard connected');
    window.MoonCard = this;
    window.Chart = this._chart;
  }

  disconnectedCallback(): void {
    console.log('MoonCard disconnected');
    this.cancelTimeAnimationFrame();
    super.disconnectedCallback();
  }

  protected firstUpdated(): void {
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
          max-width: 500px;
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

  private get cssColors(): ChartColors {
    const cssColors = getComputedStyle(this);
    return {
      primaryTextColor: cssColors.getPropertyValue('--lunar-card-label-font-color'),
      secondaryTextColor: cssColors.getPropertyValue('--secondary-text-color'),
      fillColor: cssColors.getPropertyValue('--lunar-fill-color'),
      fillBelowColor: cssColors.getPropertyValue('--lunar-fill-bellow-color'),
      fillBelowLineColor: cssColors.getPropertyValue('--lunar-fill-line-bellow-color'),
    };
  }

  private setupChart(): void {
    // Data
    const data = this._getChartData();
    const options = this._chartOptions();
    // Plugins
    const customPlugins = this.plugins;
    // Create the chart
    const ctx = this.shadowRoot?.getElementById('moonPositionChart') as HTMLCanvasElement;
    if (ctx) {
      this._chart = new Chart(ctx, {
        type: 'line',
        data: data,
        options: {
          ...options,
          aspectRatio: 2,
          scales: {
            ...options.scales,
            x: {
              ...options.scales?.x,
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

              this._chart?.update();
            }
          },
          onClick: (_event, elements) => {
            if (elements.length > 0) {
              const element = elements[0];
              const dataIndex = element.index;
              // console.log('Clicked on', dataIndex, element);
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
      <div class="moon-horizon" style=${this.setStyle()}>
        <canvas id="moonPositionChart"></canvas>
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

  setStyle(): any {
    const card = this.parentElement;
    if (card) {
      this.cardWidth = card.clientWidth;
      return styleMap({ width: `${card.clientWidth}px` });
    }
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
          this.requestUpdate(); // Trigger a re-render
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

  cancelTimeAnimationFrame(): void {
    // Cancel the animation frame when the component is disconnected
    if (this._timeAnimationFrame) {
      cancelAnimationFrame(this._timeAnimationFrame);
      this._timeAnimationFrame = null;
    }
  }

  /* -------------------------------- DATASETS -------------------------------- */

  private _getChartData = (): ChartData => {
    const { primaryTextColor, secondaryTextColor, fillColor, fillBelowColor, fillBelowLineColor } = this.cssColors;
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
      tension: 0.2,
      segment: {
        borderColor: (ctx: ScriptableLineSegmentContext) =>
          ctx.p0.parsed.y >= 0 || ctx.p1.parsed.y >= 0 ? primaryTextColor : fillBelowLineColor,
        borderWidth: (ctx: ScriptableLineSegmentContext) => (ctx.p0.parsed.y <= 0 ? 1 : 1.2),
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

    const data = {
      labels: timeLabels,
      datasets: [moonDataset, timeDataset] as ChartDataset[],
    };
    return data as ChartData;
  };

  private _chartOptions = (): ChartOptions => {
    const { secondaryTextColor } = this.cssColors;
    const { sugestedYMax, sugestedYMin } = this.todayData.minMaxY;
    const { y_ticks, x_ticks } = this.card.config;

    const ticksOptions = {
      color: secondaryTextColor,
    };

    // Scales
    const scales = {} as ScaleOptions;
    scales['y'] = {
      suggestedMax: 60 + sugestedYMax,
      suggestedMin: sugestedYMin > -60 ? -60 : sugestedYMin,
      ticks: {
        ...ticksOptions,
        display: y_ticks || false,
      },
      border: {
        display: false,
      },
      grid: {
        drawOnChartArea: false,
        display: false,
      },
    };

    scales['x'] = {
      grid: {
        display: false,
      },
      ticks: {
        ...ticksOptions,
        display: x_ticks || false,
        maxRotation: 40,
      },
      border: {
        display: true,
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
          borderWidth: 0.4,
          scaleID: 'y',
          value: 0,
        },
      },
    };

    plugins['tooltip'] = {
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      bodyFont: {
        size: 14,
      },
      titleAlign: 'right',
      bodyAlign: 'right',
      displayColors: false,
      callbacks: {
        label: (context) => {
          return `${context.formattedValue}°`;
        },
      },
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
    let emoji = this.todayData.moonPhase.phase.emoji;
    let isHovered = false; // Flag to indicate hover state
    let storedPosition: { x: number; y: number } | null = null;
    const getIndex = () => {
      const now = new Date();
      const hour = now.getHours() + now.getMinutes() / 60;
      const index = Math.floor(hour) * 2;
      return index;
    };

    const currentHourIndex = getIndex();

    return {
      id: 'moonMarkerPlugin',
      afterDatasetDraw(chart: Chart, args) {
        const index = args.index;
        if (index !== 0) return;
        const dataSet = chart.getDatasetMeta(0);
        if (dataSet.hidden) return;

        const ctx = chart.ctx;
        const { x, y } = dataSet.data[currentHourIndex].getProps(['x', 'y']);
        if (emoji) {
          // Draw the emoji
          ctx.save();
          ctx.font = '24px serif';
          ctx.fillText(isHovered ? '' : emoji, x - 12, y);
          ctx.restore();

          // Store the emoji position for hover detection
          storedPosition = { x: x - 12, y };
        }
      },
      afterEvent(chart: Chart, args) {
        const ctx = chart.ctx;
        const inChartArea = args.inChartArea as boolean;
        const { x: mouseX, y: mouseY, type } = args.event;
        const { x, y } = storedPosition || { x: 0, y: 0 };
        const emojiWidth = ctx.measureText(emoji).width;
        const emojiHeight = 24; // Approximate height based on font size
        // Check if the mouse is hovering over the emoji area
        if (inChartArea && mouseX && mouseY && type === 'mousemove') {
          const isHovering =
            mouseX >= x - emojiWidth &&
            mouseX <= x + emojiWidth &&
            mouseY >= y - emojiHeight &&
            mouseY <= y + emojiHeight;

          if (isHovering !== isHovered) {
            isHovered = isHovering; // Update hover state
            chart.update('none'); // Update the chart without animating
            args.changed = true;
          }
        }
      },
    };
  };

  // private moonMarkerPlugin = (): Plugin => {
  //   const emoji = this.todayData.moonPhase.phase.emoji;
  //   const getIndex = () => {
  //     const now = new Date();
  //     const hour = now.getHours() + now.getMinutes() / 60;
  //     const index = Math.floor(hour) * 2;
  //     return index;
  //   };

  //   const currentHourIndex = getIndex();

  //   return {
  //     id: 'moonMarkerPlugin',
  //     afterDatasetsDraw(chart: Chart) {
  //       const dataSet = chart.getDatasetMeta(0);
  //       if (dataSet.hidden) return;
  //       const ctx = chart.ctx;
  //       const { x, y } = dataSet.data[currentHourIndex].getProps(['x', 'y']);

  //       // Draw the emoji
  //       ctx.save();
  //       ctx.font = '24px serif';
  //       ctx.fillText(emoji, x - 12, y);
  //       ctx.restore();

  //       // Add hover event to the chart's canvas
  //       chart.canvas.addEventListener('mousemove', (event) => {
  //         console.log('Mouse move event');
  //         const rect = chart.canvas.getBoundingClientRect();
  //         const mouseX = event.clientX - rect.left;
  //         const mouseY = event.clientY - rect.top;

  //         // Check if mouse is hovering over the emoji area
  //         const emojiWidth = ctx.measureText(emoji).width;
  //         const emojiHeight = 24; // Approximate height based on font size
  //         const isHovering =
  //           mouseX >= x - 12 && mouseX <= x - 12 + emojiWidth && mouseY >= y - emojiHeight && mouseY <= y;

  //         if (isHovering) {
  //           // Do something when hovering, e.g., change the emoji color or display a tooltip
  //           ctx.save();
  //           ctx.clearRect(x - 12, y - emojiHeight, emojiWidth, emojiHeight); // Clear the previous emoji
  //           ctx.fillStyle = 'red'; // Change color on hover
  //           ctx.fillText(emoji, x - 12, y); // Redraw the emoji
  //           ctx.restore();
  //         } else {
  //           // Optionally reset the emoji if not hovering
  //           ctx.save();
  //           ctx.clearRect(x - 12, y - emojiHeight, emojiWidth, emojiHeight); // Clear the hovered emoji
  //           ctx.fillStyle = 'black'; // Original color
  //           ctx.fillText(emoji, x - 12, y); // Redraw the emoji
  //           ctx.restore();
  //         }
  //       });
  //     },
  //   };
  // };

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
      },
    };
  };

  private timeMarkerPlugin = (): Plugin => {
    const timeMarkers = this.todayData.timeMarkers;
    const { secondaryTextColor, fillColor } = this.cssColors;

    // Pre-load SVG images as Image objects
    const moonUpSvg = new Image();
    const moonDownSvg = new Image();

    moonUpSvg.src =
      'data:image/svg+xml;charset=utf-8,' +
      encodeURIComponent(MOON_RISE_ICON.replace('currentcolor', secondaryTextColor));
    moonDownSvg.src =
      'data:image/svg+xml;charset=utf-8,' +
      encodeURIComponent(MOON_SET_ICON.replace('currentcolor', secondaryTextColor));

    const getMaxValueText = (ctx: CanvasRenderingContext2D, formatedTime: string, direction: string) => {
      const timeWidth = ctx.measureText(formatedTime).width;
      const directionWidth = ctx.measureText(direction).width;
      return Math.max(timeWidth, directionWidth);
    };

    const drawTimeMarker = (
      ctx: CanvasRenderingContext2D,
      isUp: boolean,
      formatedTime: string,
      direction: string,
      x: number,
      y: number,
      lineOffset: number,
      textOffset: number,
      xOffset: number,
      textAlign: CanvasTextAlign
    ) => {
      ctx.save();

      // Draw the line
      ctx.beginPath();
      ctx.fillStyle = secondaryTextColor;
      ctx.strokeStyle = fillColor;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x, y - lineOffset);
      ctx.stroke();

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

      // Load and draw the SVG based on isUp
      const imgToDraw = isUp ? moonUpSvg : moonDownSvg;
      // Draw the SVG image onto the canvas directly
      ctx.drawImage(imgToDraw, xOffset, y - textOffset + 5, 17, 17);

      // Draw the time and direction text
      ctx.fillStyle = secondaryTextColor;
      ctx.strokeStyle = fillColor;
      ctx.font = '12px';
      ctx.textAlign = textAlign;
      ctx.fillText(formatedTime, xOffset + 20, y - textOffset + 15);
      ctx.fillText(direction, xOffset, y - textOffset + 35);

      ctx.restore();
    };

    return {
      id: 'timeMarkerPlugin',
      beforeDatasetDraw(chart: Chart) {
        const timeDataSet = chart.getDatasetMeta(1);
        if (timeDataSet.hidden) return;
        const {
          ctx,
          chartArea: { left, right },
          scales: { x, y },
        } = chart;
        // Iterate over each time marker and draw if necessary

        timeMarkers.forEach((timeMarker: any) => {
          const { show, position, isUp, formatedTime, direction, lineOffset, textOffset } = timeMarker;
          if (show) {
            const { index, altitude } = position;
            const xPosition = x.getPixelForValue(index);
            const yPosition = y.getPixelForValue(altitude);
            const maxTextWidth = getMaxValueText(ctx, formatedTime, direction);
            let textAlign: CanvasTextAlign = 'start';
            let centerText = maxTextWidth / 2;
            let xOffset = xPosition - centerText;

            if (xPosition + centerText > right) {
              textAlign = 'end';
              xOffset = xPosition - 4;
            } else if (xPosition - centerText < left) {
              textAlign = 'start';
              xOffset = xPosition + 4;
            } else {
              xOffset = xPosition - centerText;
              textAlign = 'start';
            }

            drawTimeMarker(
              ctx,
              isUp,
              formatedTime,
              direction,
              xPosition,
              yPosition,
              lineOffset,
              textOffset,
              xOffset,
              textAlign
            );
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
    Chart: Chart;
  }
}

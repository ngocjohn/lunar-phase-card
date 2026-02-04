import type { ChartDataset } from 'chart.js/auto';

import {
  Chart,
  ChartData,
  ScriptableLineSegmentContext,
  ScaleOptions,
  ChartOptions,
  Plugin,
  ScaleChartOptions,
} from 'chart.js/auto';
import { html, CSSResultGroup, TemplateResult, css, PropertyValues } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';

import { ICON } from '../../const';
import { MOON_RISE_ICON, MOON_SET_ICON } from '../../shared/moon-pic';
import { CardArea } from '../../types/card-area';
import { ChartColors } from '../../types/config/chart-config';
import { CHART_FILL_COLORS } from '../../types/config/graph-config';
import { LunarBaseCard } from '../base-card';
import { LunarPhaseNewCard } from '../lunar-phase-card';

const HOVER_TIMEOUT = 150;

@customElement('lunar-moon-chart-horizon')
export class LunarMoonChartHorizon extends LunarBaseCard {
  constructor() {
    super(CardArea.HORIZON);
  }
  @property({ attribute: false }) public cardWidth!: number;
  @state() private card!: LunarPhaseNewCard;
  @state() private _chart!: Chart;
  @state() private moreInfo: boolean = false;
  @state() private hoverOnChart: boolean = false;
  @state() private hoverTimeout: number | null = null;
  @state() private cardHeight: number = 0;

  public connectedCallback(): void {
    super.connectedCallback();
    if (this.isConnected) {
      this._computeDynamicStyles();
    }
  }

  protected async firstUpdated(): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, 50));
    this.setupChart();
  }

  protected updated(_changedProperties: PropertyValues): void {
    if (!this.store.config || !this.moon) return;
    if (_changedProperties.has('cardWidth') && this.cardWidth > 0) {
      if (this._chart) {
        this._chart.resize(this.cardWidth, this.cardHeight);
        this._chart.update('none');
      }
    }
  }

  get todayData() {
    return this.moon.todayData;
  }
  get cssColors(): ChartColors {
    const cssColors = getComputedStyle(this) as CSSStyleDeclaration;
    const property = (name: string) => cssColors.getPropertyValue(name).trim();
    return {
      primaryTextColor: property('--lunar-card-label-font-color') || property('--primary-text-color'),
      secondaryTextColor: property('--secondary-text-color'),
      fillColor: property('--lunar-fill-color'),
      fillBelowColor: property('--lunar-fill-bellow-color'),
      fillBelowLineColor: property('--lunar-fill-line-bellow-color'),
      defaultPrimaryColor: property('--primary-color'),
      defaultAccentColor: property('--accent-color'),
    };
  }

  get chartData(): ChartData {
    return this._getChartData();
  }

  get chartOptions(): ChartOptions {
    return this._chartOptions();
  }

  get plugins(): Plugin[] {
    const fillTopPlugin = this.fillTopPlugin();
    const timeMarkerPlugin = this.timeMarkerPlugin();
    const moonMarkerPlugin = this.moonMarkerPlugin();
    const highestAltitudePlugin = this.highestAltitudePlugin();
    const expandChartArea = this.expandChartArea();
    return [fillTopPlugin, timeMarkerPlugin, moonMarkerPlugin, highestAltitudePlugin, expandChartArea];
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
    const ctx = this.shadowRoot!.getElementById('moonPositionChart') as HTMLCanvasElement;
    if (!ctx) return;
    this._chart = new Chart(ctx, {
      type: 'line',
      data: data,
      options: {
        ...options,
        scales: {
          ...options.scales,
          x: {
            ...options.scales?.x,
            alignToPixels: true,
            ticks: {
              ...options.scales?.x?.ticks,

              callback: function (value, index) {
                return index % 2 !== 0 ? this.getLabelForValue(Number(value)) : '';
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
            this._chart?.update('none');
          }
        },
        onClick: (_event, elements) => {
          console.log('onClick', elements);
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
      this.card._resetSelectedDate();
    });
    ctx.addEventListener('touchstart', this._onChartTouchStart.bind(this), { passive: false });
    ctx.addEventListener('touchmove', this._onChartTouchStart.bind(this), { passive: false });
    ctx.addEventListener('touchend', this._onChartTouchEnd.bind(this));
  }
  protected render(): TemplateResult {
    this.card = this.store.card as LunarPhaseNewCard;
    let height = this.cardWidth * 0.5 - 43;
    height = this._configAppearance?.hide_buttons ? height : height - 43;
    this.cardHeight = height;
    return html`
      <div id="moon-horizon">
        <canvas id="moonPositionChart" width="${this.cardWidth}" height="${this.cardHeight}"></canvas>
      </div>
      ${this._renderFooterDataSection()}
    `;
  }
  private _renderFooterDataSection(): TemplateResult {
    return html`
      <div class="moon-data-header">
        ${this.card._selectedDate !== undefined
          ? this._formatDateTime(this.card._selectedDate)
          : this.renderTimeClock()}
        <ha-icon-button
          .path=${ICON.CHEVRON_DOWN}
          @click=${() => (this.moreInfo = !this.moreInfo)}
          ?active=${this.moreInfo}
        ></ha-icon-button>
      </div>
      <div class="moon-data-wrapper">
        <div class="moon-data" show=${this.moreInfo}>${this._renderDataItem()}</div>
      </div>
    `;
  }

  private _renderDataItem(): TemplateResult {
    if (!this.moreInfo) return html``;
    const dataItem = this.moon.todayDataItem;
    return html` <lunar-moon-data-info .moonData=${dataItem}></lunar-moon-data-info>`;
  }

  async handlePointHover(date: number): Promise<void> {
    if (!this.moreInfo) return;
    const time = new Date(date);
    // Set the selected date in the store
    this.card._selectedDate = time;
  }

  private _getChartData = (): ChartData => {
    const { primaryTextColor, secondaryTextColor, fillColor, fillBelowColor, fillBelowLineColor } = this.cssColors;
    const todayData = this.todayData;
    const timeLabels = Object.values(todayData.altitude).map((item) => this.moon.formatTime(item.x));

    const altitudeData = todayData.altitude;
    const { set, rise } = todayData.lang;
    const langAltitude = this.store.translate('card.altitude');
    const graphConfig = this._configGraph;

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
          ctx.p0.parsed.y! >= -0.001 && ctx.p1.parsed.y! >= -0.001 ? primaryTextColor : fillBelowLineColor,
        borderWidth: (ctx: ScriptableLineSegmentContext) =>
          ctx.p0.parsed.y! >= -0.001 && ctx.p1.parsed.y! >= -0.001 ? 1.2 : 1,
      },
      // radius: () => (this.hoverOnChart ? 1.2 : 0),
      pointHoverRadius: 4,
      pointHoverBackgroundColor: secondaryTextColor,
      pointHoverBorderWidth: 2,
      pointRadius: 0,
    };

    const timeDataset = {
      label: `${rise} / ${set}`,
      data: [],
    };

    const datasets: ChartDataset[] = [];
    datasets.push(moonDataset);
    graphConfig?.show_time || graphConfig?.show_time === undefined ? datasets.push(timeDataset) : null;

    const data = {
      labels: timeLabels,
      datasets: datasets,
    };
    return data as ChartData;
  };

  private _chartOptions = (): ChartOptions => {
    const { secondaryTextColor, defaultPrimaryColor, defaultAccentColor } = this.cssColors;
    const { sugestedYMax, sugestedYMin } = this.todayData.minMaxY;
    const graphConfig = this._configGraph;
    const currentMoon = this.moon.currentMoonData;

    const timeMarkers = this.moon.timeMarkers;
    const riseObj = timeMarkers[0];
    const setObj = timeMarkers[1];

    const { moonHighest } = this.todayData;
    const highestBody = moonHighest.contentBody;
    const highestIndex =
      moonHighest.rawData.y >= 0 ? this.todayData.altitudeValues.indexOf(moonHighest.rawData.y) : null;
    const ticksOptions = {
      color: secondaryTextColor,
    };

    // Scales
    const scales = {} as ScaleOptions;
    scales['y'] = {
      suggestedMin: sugestedYMin - 10,
      suggestedMax: sugestedYMax + 10,
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
      display: false,
    };

    plugins['tooltip'] = {
      titleColor: (ctx) => {
        const index = ctx?.tooltipItems?.[0]?.dataIndex;
        switch (index) {
          case currentMoon.currentHourIndex:
            return defaultAccentColor;
          case highestIndex:
            return defaultPrimaryColor;
          case riseObj.position.index:
            return defaultPrimaryColor;
          case setObj.position.index:
            return defaultPrimaryColor;
          default:
            return secondaryTextColor;
        }
      },
      callbacks: {
        title: (ctx) => {
          switch (ctx[0].dataIndex) {
            case currentMoon.currentHourIndex:
              return currentMoon.title;
            case highestIndex:
              return 'Highest at ' + moonHighest.formatedTime;
            case riseObj.position.index:
              return 'Rise: ' + riseObj.formatedTime;
            case setObj.position.index:
              return 'Set: ' + setObj.formatedTime;
            default:
              return ctx[0].label;
          }
        },
        label: (ctx) => {
          switch (ctx.dataIndex) {
            case currentMoon.currentHourIndex:
              return currentMoon.body;
            case highestIndex:
              return highestBody;
            case riseObj.position.index:
              return riseObj.body;
            case setObj.position.index:
              return setObj.body;
            default:
              return `${ctx.formattedValue}°`;
          }
        },
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
      autoPadding: false,
      padding: {
        left: -8,
        right: -8,
      },
    };
    // Options
    const options = {} as ChartOptions;

    options.interaction = {
      intersect: false,
      mode: 'index',
      axis: 'x',
    };
    options.responsive = true;
    options.maintainAspectRatio = false;
    options.resizeDelay = 100;
    // options.devicePixelRatio = 2;
    options.scales = scales as ScaleChartOptions;
    options.plugins = plugins;
    options.layout = layout;
    options.events = ['mousemove', 'mouseout', 'touchstart', 'touchmove', 'click'];
    return options;
  };

  /* --------------------------------- PLUGINS -------------------------------- */
  private fillTopPlugin = (): Plugin => {
    const { fillColor, secondaryTextColor } = this.cssColors;
    return {
      id: 'fillTopPlugin',
      beforeDraw(chart: Chart) {
        const {
          ctx,
          chartArea: { top, right, left, bottom },
          scales: { x, y },
        } = chart as Chart;
        const midX = x.getPixelForValue(0);
        const fillTop = y.getPixelForValue(0);
        const gradientHeight = (bottom - top) * 0.2;
        const gradient = ctx.createLinearGradient(midX, top, midX, top - gradientHeight);
        gradient.addColorStop(0, 'rgba(255, 255, 255, 0)');
        gradient.addColorStop(1, fillColor);
        // Draw the fill color above the horizon
        ctx.save();
        ctx.fillStyle = gradient;
        ctx.fillRect(midX, top - gradientHeight, right - midX, gradientHeight);
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

  private moonMarkerPlugin = (): Plugin => {
    const emoji = this.todayData.moonPhase.phase.emoji;
    const emojiFontSize = '1rem Arial';
    const { currentHourIndex, altitudeDegrees } = this.moon.currentMoonData;
    const showCurrent = this._configGraph?.show_current ?? true;
    if (!showCurrent) return { id: 'moonMarkerPlugin' };
    const hoverOnChart = this.hoverOnChart;
    return {
      id: 'moonMarkerPlugin',
      afterDatasetsDraw(chart: Chart) {
        const dataSet = chart.getDatasetMeta(0);
        if (dataSet.hidden || hoverOnChart) return;
        const {
          ctx,
          scales: { x, y },
        } = chart;
        // Measure the emoji size
        ctx.font = emojiFontSize; // Set font size before measuring
        const emojiSize = ctx.measureText(emoji);

        // Center the emoji horizontally at the x-position
        const xPosition = x.getPixelForValue(currentHourIndex) - emojiSize.width / 2;

        // Center the emoji vertically at the y-position
        const totalHeight = emojiSize.actualBoundingBoxAscent + emojiSize.actualBoundingBoxDescent;
        const yPosition = y.getPixelForValue(altitudeDegrees) + emojiSize.actualBoundingBoxAscent - totalHeight / 2;
        if (emoji) {
          // Draw the emoji
          ctx.save();
          ctx.font = emojiFontSize;
          ctx.fillText(emoji, xPosition, yPosition);
          ctx.restore();
        }
      },
    };
  };
  private timeMarkerPlugin = (): Plugin => {
    const timeMarkers = this.moon.timeMarkers;
    const { secondaryTextColor, fillColor } = this.cssColors;
    const fontSize = {
      primary: '0.9rem Arial',
      secondary: '0.8rem Arial',
    };
    const minValue = this.todayData.minMaxY.sugestedYMin;
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
      ctx.font = fontSize.primary;
      const setRiseWidth = ctx.measureText(isUp).width;
      const timeWidth = ctx.measureText(formatedTime).width;
      ctx.font = fontSize.secondary;
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
      ctx.font = fontSize.primary;
      ctx.filter = this.hoverOnChart ? 'opacity(0.4)' : 'opacity(1)';
      // Load and draw the SVG based on `isUp`
      const imgToDraw = isUp ? moonUpSvg : moonDownSvg;
      const timeWidth = ctx.measureText(formatedTime).width;
      const iconOffset = textAlign === 'start' ? xOffset + timeWidth + 5 : xOffset - timeWidth - 22;

      // Draw the time and direction text
      if (isUp) {
        ctx.font = fontSize.secondary;
        ctx.fillText(direction, xOffset, y - lineOffset - 10);
        ctx.font = fontSize.primary;
        ctx.fillText(formatedTime, xOffset, y - lineOffset - 27);
      } else {
        ctx.font = fontSize.secondary;
        ctx.fillText(direction, xOffset, y + lineOffset + 27);
        ctx.font = fontSize.primary;
        ctx.fillText(formatedTime, xOffset, y + lineOffset + 10);
      }
      // Draw the icon
      ctx.drawImage(imgToDraw, iconOffset, isUp ? y - lineOffset - 40 : y + lineOffset - 5, 18, 18);
      ctx.restore();
    };

    return {
      id: 'timeMarkerPlugin',
      afterDatasetsDraw(chart: Chart) {
        const timeDataSet = chart.getDatasetMeta(1);
        if (timeDataSet.type === null || timeDataSet.hidden) return;
        const {
          ctx,
          chartArea: { left, right },
          scales: { x, y },
        } = chart;
        // Iterate over each time marker and draw if necessary

        timeMarkers.map((timeMarker: any) => {
          const { show, position, isUp, formatedTime, direction } = timeMarker;
          if (show) {
            const { index } = position;

            const xPosition = x.getPixelForValue(index) + 2;

            const yPosition = y.getPixelForValue(0);
            const minYposition = y.getPixelForValue(minValue);
            const lineOffset = Math.round((minYposition - yPosition) / 2);

            // const lineOffset = isUp ? Math.round((yPosition - top) / 4) : Math.round((bottom - yPosition) / 2);
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

  private highestAltitudePlugin = (): Plugin => {
    const showHighest = this._configGraph?.show_highest ?? true;
    const { rawData } = this.todayData.moonHighest;
    const { primaryTextColor } = this.cssColors;
    const yValue = rawData.y;
    const yIndex = this.todayData.altitudeValues.indexOf(yValue);
    return {
      id: 'highestAltitudePlugin',
      afterDatasetsDraw(chart: Chart) {
        const dataSet = chart.getDatasetMeta(0);
        if (!showHighest || dataSet.hidden || yValue <= 0) return;
        const point = dataSet.data[yIndex];
        point.options.pointHoverBorderWidth = 4;
        point.options.pointHoverRadius = 4;
        point.options.pointHoverBackgroundColor = primaryTextColor;
        point.options.radius = 4;
        chart.setActiveElements([{ datasetIndex: 0, index: yIndex }]);
        chart.update('default');
      },
    };
  };
  private expandChartArea = (): Plugin => {
    return {
      id: 'expandChartArea',
      beforeRender: (chart: Chart) => {
        chart.chartArea.right = this.cardWidth;
        chart.chartArea.bottom = this.cardHeight;
      },

      afterUpdate: (chart: Chart) => {
        chart.chartArea.right = this.cardWidth;
        chart.chartArea.bottom = this.cardHeight;
      },
    };
  };

  private _onChartTouchStart(event: TouchEvent): void {
    event.preventDefault();
  }

  private _onChartTouchEnd(event: TouchEvent): void {
    const touch = event.changedTouches[0];
    const canvas = this.shadowRoot!.getElementById('moonPositionChart') as HTMLCanvasElement;
    const chart = this._chart;

    if (touch && canvas && chart) {
      chart?.tooltip?.setActiveElements([], { x: 0, y: 0 });
      chart?.setActiveElements([]);
      chart?.update();
      // Reset the selected date
      this.card._resetSelectedDate();
    }
  }

  protected _computeDynamicStyles() {
    const appearance = this._configAppearance;
    const fillKey = appearance?.hide_background === true ? 'default' : 'with_background';
    const fillColors = CHART_FILL_COLORS[fillKey];
    const styles: Record<string, string> = {};
    Object.entries(fillColors).forEach(([key, value]) => {
      if (key === 'color') {
        styles[`--lunar-fill-color`] = value;
      } else {
        styles[`--lunar-fill-${key}-color`] = value;
      }
    });
    Object.entries(styles).forEach(([key, value]) => {
      this.style.setProperty(key, value);
    });
  }
  static get styles(): CSSResultGroup {
    return [
      super.styles,
      css`
        #moon-horizon {
          display: block;
          position: relative;
          margin: 0 auto;
          width: 100%;
          height: 100%;
          max-width: 1800px;
          backdrop-filter: blur(2px);
          box-sizing: border-box;
          border-radius: inherit;
          overflow: hidden;
        }

        #moonPositionChart {
          width: 100% !important;
          height: 100% !important;
          position: relative;
        }

        .moon-data-wrapper {
          display: flex;
          flex-direction: column;
        }

        .moon-data-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          width: inherit;
          height: auto;
          color: var(--lunar-card-label-font-color);
          padding-left: 12px;
          /* backdrop-filter: blur(4px); */
          background-color: rgba(0, 0, 0, 0.14);
        }

        .moon-data {
          box-sizing: border-box;
        }
        .moon-data[show='false'] {
          max-height: 0px;
          overflow: hidden;
          transition: all 0.4s ease-in-out;
          opacity: 0;
        }
        .moon-data[show='true'] {
          max-height: 500px;
          transition: all 0.6s ease-in-out;
          padding: 0px 12px;
          background-color: none;
          background: none;
          /* background-color: rgba(0, 0, 0, 0.14); */
          backdrop-filter: blur(10px);
        }
        .direction-icon {
          display: inline-block;
          transition: transform 0.4s ease-in-out;
        }

        ha-icon-button[active] {
          transform: rotate(180deg);
          transition: transform 0.4s ease-in-out;
        }
      `,
    ];
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'lunar-moon-chart-horizon': LunarMoonChartHorizon;
  }
}

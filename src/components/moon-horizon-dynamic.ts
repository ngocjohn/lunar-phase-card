// Lit
import { LitElement, html, CSSResultGroup, TemplateResult, css, PropertyValues, nothing } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import tinycolor from 'tinycolor2';
// Custom Card helpers
import { FrontendLocaleData, formatDateShort, formatTime } from 'custom-card-helpers';
// Chart.js
import { Chart, ChartData, ChartOptions, Plugin, ScriptableLineSegmentContext } from 'chart.js/auto';



// DateTime
import { DateTime } from 'luxon';
// Local imports

import { CHART_COLOR, CHART_DATA } from '../const';
import { LunarPhaseCard } from '../lunar-phase-card';
import { FILL_COLORS, HA as HomeAssistant } from '../types';
import extract_color from '../utils/extract_color';
import { hexToRgba } from '../utils/helpers';
import { Moon } from '../utils/moon';
// Styles
import styles from '../css/style.css';

@customElement('lunar-horizon-dynamic')
export class LunarHorizonDynamic extends LitElement {
  @property({ attribute: false }) public hass!: HomeAssistant;
  @property({ attribute: false }) moon!: Moon;
  @property({ attribute: false }) card!: LunarPhaseCard;
  @property({ type: Number }) public cardWidth!: number;

  @state() public fillColors!: FILL_COLORS;

  @state() dynamicChart!: Chart;
  @state() tinyColor = tinycolor;

  protected async firstUpdated(): Promise<void> {
    this.fillColors = await this.extractColorData();
    await new Promise((resolve) => setTimeout(resolve, 0));
    this.initChart();
  }

  protected shouldUpdate(_changedProperties: PropertyValues): boolean {
    if (_changedProperties.has('moon')) {
      if (this.dynamicChart) {
        this.dynamicChart.data = this.chartData;
        this.dynamicChart.update('none');
      }
    }
    return true;
  }

  protected updated(_changedProperties: PropertyValues): void {
    if (!this.card.config || !this.moon) return;
    if (_changedProperties.has('cardWidth')) {
      if (this.dynamicChart) {
        this.dynamicChart.resize(this.cardWidth, this.cardHeight);
      }
    }
  }

  get cardHeight(): number {
    let height = this.cardWidth * 0.5;
    height = this.card.config.hide_buttons ? height : height - 48;
    return height;
  }

  static get styles(): CSSResultGroup {
    return [
      styles,
      css`
        #horizon-dynamic-chart {
          display: block;
          position: relative;
          margin: 0 auto;
          width: 100%;
          height: 100%;
          max-width: 1800px;
          box-sizing: border-box;
          border-radius: inherit;
          overflow: hidden;
        }

        #blur-overlay {
          position: absolute;
          bottom: 0;
          left: 0;
          -webkit-backdrop-filter: blur(4px);
          backdrop-filter: blur(4px);
          background: transparent !important;
          width: 100%;
          height: 60%;
          pointer-events: none;
          overflow: hidden;
          z-index: 0;
          isolation: isolate;
          box-sizing: border-box;
          border-radius: 24px;
          will-change: backdrop-filter;
          margin: -2px;
        }

        #dynamic-chart {
          width: 100% !important;
          height: 100% !important;
          position: relative;
          z-index: 2;
        }
      `,
    ];
  }

  get _locale(): FrontendLocaleData {
    return this.moon.locale;
  }

  get _date(): Date {
    return this.moon._dynamicDate;
  }

  get todayData() {
    return this.moon._dynamicChartData;
  }

  get chartData(): ChartData {
    return this._getChartData();
  }

  get chartOptions(): ChartOptions {
    return this._getChartOptions();
  }

  get chartPlugins(): Plugin[] {
    const expandChartArea = this._expandChartArea();
    const nowPosition = this._nowPosition();
    const midnightPositon = this._midnightPosition();
    const timeMarkers = this._timesMarkersPlugin();
    return [nowPosition, midnightPositon, timeMarkers, expandChartArea];
  }

  private get CSS_COLOR() {
    const cssColors = getComputedStyle(this) as CSSStyleDeclaration;
    const property = (name: string) => cssColors.getPropertyValue(name).trim();
    return {
      PRIMARY_TEXT: property('--lunar-card-label-font-color'),
      SECONDARY_TEXT: property('--secondary-text-color'),
      DEFAULT_PRIMARY_COLOR: property('--primary-color'),
      MOON_LINE_LIGHT: property('--lunar-fill-line-bellow-color'),
      FILL_BELLOW: property('--lunar-fill-bellow-color'),
      fillColor: property('--lunar-fill-color'),
      fillBelowColor: property('--lunar-fill-bellow-color'),
      fillBelowLineColor: property('--lunar-fill-line-bellow-color'),
    };
  }

  private initChart(): void {
    if (this.dynamicChart) {
      this.dynamicChart.destroy();
    }

    const data = this.chartData;
    const options = this.chartOptions;
    const plugins = this.chartPlugins;

    const ctx = this.shadowRoot!.getElementById('dynamic-chart') as HTMLCanvasElement;
    if (!ctx) return;

    ctx.addEventListener('touchstart', this._onChartTouchStart.bind(this), { passive: false });
    ctx.addEventListener('touchmove', this._onChartTouchStart.bind(this), { passive: false });
    ctx.addEventListener('touchend', this._onChartTouchEnd.bind(this));

    this.dynamicChart = new Chart(ctx, {
      type: 'line',
      data: data,
      options: {
        ...options,
      },
      plugins: plugins,
    });
  }

  private _onChartTouchStart(event: TouchEvent): void {
    event.preventDefault();
  }
  private _onChartTouchEnd(event: TouchEvent): void {
    const touch = event.changedTouches[0];
    const canvas = this.shadowRoot!.getElementById('dynamic-chart') as HTMLCanvasElement;
    const chart = this.dynamicChart;
    if (touch && canvas && chart) {
      chart?.tooltip?.setActiveElements([], { x: 0, y: 0 });
      chart?.setActiveElements([]);
      chart?.update();
    }
  }

  protected render(): TemplateResult {
    const useBackground = this.card.config.show_background;
    return html`
      <div id="horizon-dynamic-chart">
        ${useBackground ? html` <div id="blur-overlay"></div>` : nothing}
        <canvas id="dynamic-chart" width="${this.cardWidth}" height="${this.cardHeight}"></canvas>
      </div>
    `;
  }

  private _getChartData(): ChartData {
    const isBackground = this.card.config.show_background;
    const SHARED_OPTIONS = {
      pointRadius: 0,
      pointHoverRadius: 4,
      pointHoverBackgroundColor: '#fff',
      pointHoverBorderWidth: 2,
      cubicInterpolationMode: 'monotone',
      tension: 0.2,
      borderWidth: 1,
    };
    const { PRIMARY_TEXT, SECONDARY_TEXT, fillBelowColor, fillBelowLineColor } = this.CSS_COLOR;
    const fillAbove = this.fillColors.fillAbove;
    const BORDER_COLORS = {
      BOLD: isBackground ? CHART_COLOR.MOON_LINE_BOLD : PRIMARY_TEXT,
      LIGHT: isBackground ? fillBelowLineColor : SECONDARY_TEXT,
    };
    const chartData = this.todayData.chartData;
    const labels = chartData.map((data) => formatTime(new Date(data.timeLabel), this._locale));
    const moonData = chartData.map((data) => data.moon.altitude);
    const moonDataset = {
      label: 'Moon',
      data: moonData,
      fill: {
        target: { value: 0 }, // Fill area above 0° altitude
        above: fillAbove,
        below: fillBelowColor,
      },
      segment: {
        borderColor: (ctx: ScriptableLineSegmentContext) =>
          ctx.p0.parsed.y >= -0.001 && ctx.p1.parsed.y >= -0.001 ? BORDER_COLORS.BOLD : BORDER_COLORS.LIGHT,
        borderWidth: (ctx: ScriptableLineSegmentContext) =>
          ctx.p0.parsed.y >= -0.001 && ctx.p1.parsed.y >= -0.001
            ? CHART_DATA.BORDER_WIDTH_BOLD
            : CHART_DATA.BORDER_WIDTH_LIGHT,
      },
      yAxisID: 'y',
      ...SHARED_OPTIONS,
    };

    return {
      labels,
      datasets: [moonDataset],
    };
  }

  private _getChartOptions(): ChartOptions {
    const elevationLabel = this.card.localize('card.altitude');
    const azimuthLabel = this.card.localize('card.azimuth');
    const { DEFAULT_PRIMARY_COLOR } = this.CSS_COLOR;
    const formatedTitle = (time: number) => {
      const dateStr = formatDateShort(new Date(time), this._locale);
      return `${dateStr}`;
    };
    const chartData = this.todayData.chartData;
    const direction = chartData.map((data) => data.moon.azimuth);
    const values = [...Object.values(chartData).map((data) => data.moon.altitude)];
    const minMax = {
      suggestedMin: Math.round(Math.min(...values) - 30),
      suggestedMax: Math.round(Math.max(...values) + 30),
    };
    const SHARED_TICKS_Y = {
      ...minMax,
      ticks: {
        display: false,
      },
      border: { display: false },
      grid: { display: false },
      padding: 0,
      z: -10,
    };

    const scales: ChartOptions['scales'] = {};
    scales['x'] = {
      grid: { display: false },
      ticks: {
        display: false,
      },
      border: { display: false },
    };
    scales['y'] = {
      ...SHARED_TICKS_Y,
      position: 'left',
    };

    const layout: ChartOptions['layout'] = {
      autoPadding: false,
      padding: {
        left: -8,
        right: -8,
      },
    };
    const plugins: ChartOptions['plugins'] = {};
    plugins['legend'] = {
      labels: {
        usePointStyle: false,
        boxWidth: 0,
        boxHeight: 0,
        padding: 20,
        color: CHART_COLOR.SECONDARY_TEXT,
        textAlign: 'left',
        font: {
          size: 14,
        },
      },
      position: 'bottom',
      align: 'end',
      display: false,
    };

    plugins['tooltip'] = {
      titleColor: DEFAULT_PRIMARY_COLOR,
      displayColors: false,
      // padding: 10,
      callbacks: {
        title: function (tooltipItem) {
          const time = chartData[tooltipItem[0].dataIndex].timeLabel;
          const formatedDate = formatedTitle(time);
          const formatedTime = tooltipItem[0].label;
          return `${formatedDate} - ${formatedTime}`;
        },

        label: function (tooltipItem) {
          const itemIndex = tooltipItem.parsed.x;
          const directionValue = direction[itemIndex];
          const value = Math.round(tooltipItem.parsed.y);
          const azimuth = `${azimuthLabel}: ${directionValue}`;
          const elevation = `${elevationLabel}: ${value}°`;
          const body = [elevation, azimuth];
          return body;
        },
      },
    };

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
    options.layout = layout;
    options.scales = scales;
    options.plugins = plugins;
    options.events = ['mousemove', 'mouseout', 'touchstart', 'touchmove', 'click'];

    return options;
  }

  private _nowPosition(): Plugin {
    const chartData = this.todayData.chartData;
    const emoji = this.todayData.moonIllumination.phase.emoji;
    const emojiFontSize = '14px Arial';
    const timeLabels = chartData.map((data) => data.timeLabel);
    const now = this._date;
    const closestTime = timeLabels.reduce((a, b) =>
      Math.abs(b - now.getTime()) < Math.abs(a - now.getTime()) ? b : a
    );

    const index = timeLabels.indexOf(closestTime);
    return {
      id: 'nowLine',
      beforeDatasetDraw: (chart: Chart) => {
        const now = this._date;
        const closestTime = timeLabels.reduce((a, b) =>
          Math.abs(b - now.getTime()) < Math.abs(a - now.getTime()) ? b : a
        );

        const index = timeLabels.indexOf(closestTime);
        let nowText = `${this.card.localize('card.common.now')} ${formatTime(now, this._locale)} `; // Update the text with current time
        const {
          ctx,
          chartArea: { bottom },
        } = chart;
        const xLabel = chart.scales.x.getPixelForValue(index);
        const yLabel = chart.scales.y.getPixelForValue(chartData[index].moon.altitude);
        // const lineColor = hexToRgba(CHART_COLOR.STROKE_LINE, 0.7);
        ctx.font = '12px Arial';
        const width = ctx.measureText(nowText).width;

        // Draw the dashed line and label for the current time
        ctx.save();
        ctx.beginPath();
        ctx.strokeStyle = CHART_COLOR.STROKE_LINE;
        ctx.setLineDash([2, 4]);
        ctx.lineWidth = 1;
        ctx.moveTo(xLabel, yLabel);
        ctx.lineTo(xLabel, bottom - 25);
        ctx.stroke();

        // Draw the time label below the line
        ctx.font = '12px Arial';
        ctx.fillStyle = CHART_COLOR.PRIMARY_TEXT;
        ctx.fillText(nowText, xLabel - width / 2, bottom - 5);
        ctx.restore();
      },

      afterDatasetDraw: (chart: Chart) => {
        const dataSet = chart.getDatasetMeta(0);
        const {
          ctx,
          scales: { x, y },
        } = chart;
        if (!dataSet.hidden) {
          ctx.font = emojiFontSize;
          const emojiSize = ctx.measureText(emoji);
          const xPosition = x.getPixelForValue(index) - emojiSize.width / 2;
          const totalHeight = emojiSize.actualBoundingBoxAscent + emojiSize.actualBoundingBoxDescent;
          const yPosition =
            y.getPixelForValue(chartData[index].moon.altitude) + emojiSize.actualBoundingBoxAscent - totalHeight / 2;

          ctx.save();
          ctx.font = emojiFontSize;
          ctx.fillStyle = CHART_COLOR.SECONDARY_TEXT;
          ctx.fillText(emoji, xPosition, yPosition);
          ctx.restore();
        }
      },
    };
  }

  private _midnightPosition(): Plugin {
    const { SECONDARY_TEXT } = this.CSS_COLOR;
    const { today: todayFill, nextDay: nextDayFill } = this.fillColors;
    const fontSize = '12px Arial';
    const { chartData } = this.todayData;
    const timeLabels = chartData.map((data) => data.timeLabel);
    const now = this._date;

    // Calculate today's and next day's labels and colors
    const dayOffset = now.getHours() <= CHART_DATA.OFFSET_TIME ? 0 : 1;
    const todayMidnight = new Date(now);
    todayMidnight.setHours(0, 0, 0, 0);
    todayMidnight.setDate(now.getDate() + dayOffset);

    let todayLabel: Date = new Date(now);
    if (dayOffset === 0) {
      todayLabel.setDate(todayLabel.getDate() - 1);
    }

    const labels = {
      today: formatDateShort(todayLabel, this._locale),
      nextDay: formatDateShort(todayMidnight, this._locale),
    };

    const fillColor = {
      today: dayOffset === 0 ? nextDayFill : todayFill,
      nextDay: dayOffset === 0 ? todayFill : nextDayFill,
    };

    const closestTimeIndex = timeLabels.findIndex(
      (time) =>
        Math.abs(time - todayMidnight.getTime()) ===
        Math.min(...timeLabels.map((t) => Math.abs(t - todayMidnight.getTime())))
    );

    const drawLabels = (ctx: CanvasRenderingContext2D, x: number, y: number) => {
      ctx.save();
      ctx.font = fontSize;
      ctx.fillStyle = SECONDARY_TEXT;

      const todayWidth = ctx.measureText(labels.today).width;
      const todayXAlign = x - todayWidth - 20;
      const arrowOffset = 7;
      const topOffset = 20;

      ctx.fillText(labels.today, todayXAlign, y + topOffset);
      ctx.fillText('→', todayXAlign + arrowOffset + todayWidth, y + topOffset);

      ctx.fillText('←', x + 2, y + topOffset);
      ctx.fillText(labels.nextDay, x + 20, y + topOffset);

      ctx.restore();
    };

    return {
      id: 'midnightLine',
      beforeDraw: (chart: Chart) => {
        const { ctx, chartArea, scales } = chart;

        // Ensure chartArea and scales are available
        if (!chartArea || !scales.x || !scales.y) {
          return;
        }

        const { left, right, bottom, top } = chartArea;
        const midX = scales.x.getPixelForValue(closestTimeIndex);
        const midY = scales.y.getPixelForValue(0);
        const gradientHeight = (bottom - top) * 0.5;

        // Create gradients
        const createGradient = (startX: number, color: string) => {
          const gradient = ctx.createLinearGradient(startX, bottom, startX, bottom - gradientHeight);
          gradient.addColorStop(0, hexToRgba(color, 1));
          gradient.addColorStop(1, hexToRgba(color, 0));
          return gradient;
        };

        ctx.save();

        // Draw left gradient
        ctx.fillStyle = createGradient(left, fillColor.today);
        ctx.fillRect(left, bottom - gradientHeight, midX - left, gradientHeight);

        // Draw right gradient
        ctx.fillStyle = createGradient(midX, fillColor.nextDay);
        ctx.fillRect(midX, bottom - gradientHeight, right - midX, gradientHeight);

        // Draw lines
        const lineColor = hexToRgba(CHART_COLOR.STROKE_LINE, 0.5);
        ctx.strokeStyle = lineColor;
        ctx.lineWidth = 0.5;

        // Vertical line at midnight
        ctx.beginPath();
        ctx.moveTo(midX, top);
        ctx.lineTo(midX, bottom);
        ctx.stroke();

        // Horizontal midline
        ctx.beginPath();
        ctx.moveTo(left, midY);
        ctx.lineTo(right, midY);
        ctx.stroke();

        ctx.restore();

        // Draw labels for the markers
        drawLabels(ctx, midX, top);
      },
    };
  }

  private _getReadAbleColor() {
    const todayColor = this.fillColors.today;

    const allColors: string[] = [];
    for (const color in tinycolor.names) {
      allColors.push(color);
    }
    const readAbleColors = tinycolor.mostReadable(todayColor, allColors);
    const baseColor = tinycolor(readAbleColors);
    const lightColor = baseColor.clone().setAlpha(0.2).toString();

    return { baseColor: baseColor.setAlpha(0.4).toString(), lightColor };
  }

  private _timesMarkersPlugin(): Plugin {
    const labelColors = this._getReadAbleColor();
    const fontSize = {
      primary: '0.9rem Arial',
      secondary: '0.8rem Arial',
    };
    const chartData = this.todayData.chartData;
    const values = [...Object.values(chartData).map((data) => data.moon.altitude)];
    const minValue = Math.min(...values);
    const isPast = (time: number): boolean => new Date(time) < this._date;

    const calculateDuration = (time: number): string => {
      const diff = DateTime.fromMillis(time).diffNow();
      return diff.toFormat("h 'hrs,' m 'min'");
    };

    const drawPoint = (
      ctx: CanvasRenderingContext2D,
      x: number,
      y: number,
      color: string,
      label: string,
      lineHeight: number,
      relativeTime: string
    ) => {
      ctx.save();
      ctx.beginPath();
      ctx.fillStyle = color;
      ctx.arc(x, y, 4, 0, 2 * Math.PI);
      ctx.fill();
      ctx.restore();

      ctx.save();
      ctx.strokeStyle = CHART_COLOR.STROKE_LINE;
      ctx.lineWidth = 1;
      ctx.moveTo(x, y + 5);
      ctx.lineTo(x, y + lineHeight);
      ctx.stroke();
      ctx.restore();

      const drawText = (text: string, offsetY: number, size: string) => {
        ctx.font = size;
        const textWidth = ctx.measureText(text).width;
        ctx.fillStyle = color;
        ctx.fillText(text, x - textWidth / 2, y + offsetY + lineHeight);
      };

      drawText(label, 20, fontSize.primary);
      if (relativeTime) drawText(relativeTime, 35, fontSize.secondary);
    };

    const drawMarkers = (chart: Chart, times: { time: string; index: number; originalTime: number }[]) => {
      const {
        ctx,
        scales: { x, y },
      } = chart;

      times.forEach((time) => {
        const xPos = x.getPixelForValue(time.index);
        const yPos = y.getPixelForValue(0);
        const color = isPast(time.originalTime) ? labelColors.lightColor : labelColors.baseColor;
        const relativeTime = isPast(time.originalTime) ? '' : calculateDuration(time.originalTime);
        const lineHeight = (y.getPixelForValue(minValue) - yPos) / 2;
        drawPoint(ctx, xPos, yPos, color, time.time, lineHeight, relativeTime);
      });
    };

    return {
      id: 'timesMarkers',
      beforeDatasetDraw: (chart: Chart) => {
        const moonTimes = this.moon.timeData.moon;
        drawMarkers(chart, moonTimes);
      },
    };
  }



  private _expandChartArea = (): Plugin => {
    return {
      id: 'expandChartArea',
      afterRender: (chart: Chart) => {
        chart.chartArea.left = 0;
        chart.chartArea.right = this.cardWidth;
        chart.chartArea.bottom = this.cardHeight;
        chart.chartArea.top = 0;
      },

      afterUpdate: (chart: Chart) => {
        chart.chartArea.left = 0;
        chart.chartArea.right = this.cardWidth;
        chart.chartArea.bottom = this.cardHeight;
        chart.chartArea.top = 0;
      },
    };
  };

  async extractColorData(): Promise<FILL_COLORS> {
    const defaultColors = {
      today: CHART_COLOR.TODAY_FILL,
      nextDay: CHART_COLOR.NEXTDAY_FILL,
      fillAbove: CHART_COLOR.FILL_ABOVE,
    };
    const custom_background = this.card.config?.custom_background;
    if (!custom_background || this.card.config.show_background === false) {
      return defaultColors;
    }

    try {
      const data = await extract_color(custom_background);
      return data;
    } catch (error) {
      return defaultColors;
    }
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'lunar-horizon-dynamic': LunarHorizonDynamic;
  }
}

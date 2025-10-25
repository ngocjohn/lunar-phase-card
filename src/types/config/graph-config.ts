export const Y_TICKS_POS = ['left', 'right'] as const;
export type YTicksPos = (typeof Y_TICKS_POS)[number];

export const LEGEND_POS = ['top', 'bottom'] as const;
export const LEGEND_ALIGN = ['start', 'center', 'end'] as const;
export type LegendPos = (typeof LEGEND_POS)[number];
export type LegendAlign = (typeof LEGEND_ALIGN)[number];

export type GraphType = 'default' | 'dynamic';

export interface GraphConfig {
  graph_type?: string;
  y_ticks?: boolean;
  x_ticks?: boolean;
  show_time?: boolean;
  show_current?: boolean;
  show_legend?: boolean;
  show_highest?: boolean;
  y_ticks_position?: YTicksPos;
  y_ticks_step_size?: number;
  legend_position?: LegendPos;
  legend_align?: LegendAlign;
  time_step_size?: number;
}

export const CHART_FILL_COLORS = {
  default: {
    color: 'var(--divider-color)',
    bellow: 'rgba(0,0,0,0.05)',
    'line-bellow': 'var(--divider-color)',
  },
  with_background: {
    color: 'rgba(255,255,255,0.12157)',
    bellow: '#e1e0dd0f',
    'line-bellow': '#e1e0dd30',
  },
};

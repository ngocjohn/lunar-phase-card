export const APPEARANCE_LABELS = [
  'compact_view',
  'hide_buttons',
  'calendar_modal',
  '12hr_format',
  'mile_unit',
] as const;

type AppearanceLabelKey = (typeof APPEARANCE_LABELS)[number];
export type LabelPathType = AppearanceLabelKey | string;

export const LABEL_PATH: Record<LabelPathType, string> = {
  compact_view: 'compactView',
  hide_buttons: 'hideButtons',
  calendar_modal: 'calendarModal',
  '12hr_format': 'timeFormat',
  mile_unit: 'mileUnit',
  hide_compact_label: 'fontOptions.hideLabel',
};

export const TITLE_PATH: Record<string, string> = {
  layout: 'layoutConfig',
  font_config: 'fontOptions',
  label_font_config: 'fontOptions.labelFontConfig',
  header_font_config: 'fontOptions.headerFontConfig',
  graph_chart_config: 'graphConfig',
};

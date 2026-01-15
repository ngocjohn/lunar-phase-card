import { LocalizeFunc } from '../../../ha';
import {
  FontSizes,
  FontTextTransforms,
  HeaderFontConfigKeys,
  LabelFontConfigKeys,
  FontConfigKey,
} from '../../../types/config/font-config';
import {
  GRAPH_TYPES,
  Y_TICKS_POS,
  LEGEND_ALIGN,
  LEGEND_POS,
  GraphConfigBooleanKeys,
  GraphConfigNumberKeys,
  GraphConfigDropdownKeys,
} from '../../../types/config/graph-config';
import { HIDDEN_ITEMS, HiddenItem, LayoutConfig } from '../../../types/config/lunar-phase-card-config';
import { TITLE_PATH } from '../translate-const';
import { computeBooleanItem, computeSelectorSchema } from './helper';
import { HaFormBaseSchemaExtended } from './types';

type GraphDropdownProperty = (typeof GraphConfigDropdownKeys)[number];

type DropdownItemType = GraphDropdownProperty | FontConfigKey | string;

const SECTIONS = ['base', 'calendar', 'full_calendar', 'horizon'] as const;

const SELECT: Record<DropdownItemType, HaFormBaseSchemaExtended> = {
  default_section: {
    name: 'default_section',
    default: 'base',
    options: SECTIONS as readonly string[],
  },
  graph_type: {
    name: 'graph_type',
    default: 'default',
    options: GRAPH_TYPES as readonly string[],
  },
  y_ticks_position: {
    name: 'y_ticks_position',
    default: 'left',
    options: Y_TICKS_POS as readonly string[],
  },
  legend_position: {
    name: 'legend_position',
    default: 'top',
    options: LEGEND_POS as readonly string[],
  },
  legend_align: {
    name: 'legend_align',
    default: 'start',
    options: LEGEND_ALIGN as readonly string[],
  },
  header_font_size: {
    name: 'header_font_size',
    options: FontSizes as readonly string[],
  },
  header_font_style: {
    name: 'header_font_style',
    options: FontTextTransforms as readonly string[],
  },
  label_font_size: {
    name: 'label_font_size',
    options: FontSizes as readonly string[],
  },
  label_font_style: {
    name: 'label_font_style',
    options: FontTextTransforms as readonly string[],
  },
};

const computeFontSchema = (type: 'header' | 'label') => {
  const keys = type === 'header' ? HeaderFontConfigKeys : LabelFontConfigKeys;
  const title = type === 'header' ? 'Header Font Settings' : 'Label Font Settings';
  return [
    {
      title,
      type: 'expandable',
      icon: 'mdi:format-font',
      flatten: true,
      schema: [
        ...keys
          .map((key: FontConfigKey) => {
            if (key === `${type}_font_color`) {
              return {
                name: key,
                required: false,
                type: 'string',
              };
            } else {
              return computeSelectorSchema(SELECT[key]);
            }
          })
          .flat(),
      ],
    },
  ] as const;
};

const FONT_CONFIG_SCHEMA = (localize: LocalizeFunc) =>
  [
    {
      title: localize('editor.fontOptions.title'),
      name: 'font_config',
      flatten: false,
      type: 'expandable',
      icon: 'mdi:format-font',
      schema: [...['header', 'label'].map((type) => computeFontSchema(type as 'header' | 'label')).flat()],
    },
  ] as const;

const HIDDEN_LABEL: Record<HiddenItem, string> = {
  moonAge: 'moonAge',
  moonFraction: 'illumination',
  azimuthDegress: 'azimuth',
  altitudeDegrees: 'altitude',
  distance: 'distance',
  position: 'position',
  moonRise: 'moonRise',
  moonSet: 'moonSet',
  moonHighest: 'moonHigh',
  nextFullMoon: 'fullMoon',
  nextNewMoon: 'newMoon',
  nextPhase: 'nextPhase',
};

const LAYOUT_BASE_SCHEMA = (localize: LocalizeFunc) =>
  [
    {
      title: localize('editor.layoutConfig.title'),
      type: 'expandable',
      icon: 'mdi:calendar-today',
      description: 'Configure how date, time, and numbers are displayed.',
      flatten: true,
      schema: [
        {
          type: 'grid',
          flatten: true,
          schema: [
            ...['12hr_format', 'mile_unit'].map((prop) => computeBooleanItem(prop)),
            {
              name: 'max_data_per_page',
              required: false,
              default: 6,
              selector: { number: { min: 1, max: 12, mode: 'box', step: 1 } },
            },
            {
              name: 'number_decimals',
              default: 2,
              required: false,
              selector: { number: { min: 0, max: 5, mode: 'box', step: 1 } },
            },
            {
              name: 'hide_items',
              required: false,
              type: 'multi_select',
              options: HIDDEN_ITEMS.map((item) => [item, localize(`card.${HIDDEN_LABEL[item]}`)] as const),
            },
          ],
        },
      ],
    },
  ] as const;

const GRAP_DEFAULT_SCHEMA = [
  {
    type: 'grid',
    flatten: true,
    schema: [
      ...GraphConfigBooleanKeys.map((prop) => computeBooleanItem(prop)),
      ...GraphConfigNumberKeys.map((prop) => ({
        name: prop,
        required: false,
        default: 30,
        selector:
          prop === 'y_ticks_step_size'
            ? { number: { max: 90, min: 5, mode: 'box', step: 5 } }
            : { number: { max: 60, min: 5, mode: 'box', step: 5 } },
      })),
      ...GraphConfigDropdownKeys.filter((prop) => prop !== 'graph_type')
        .map((prop) => computeSelectorSchema(SELECT[prop]))
        .flat(),
    ],
  },
] as const;

const GRAPH_SCHEMA = (isDynamicChart: boolean, title: string) => {
  return [
    {
      title,
      name: 'graph_chart_config',
      flatten: false,
      type: 'expandable',
      icon: 'mdi:chart-line',
      schema: [...computeSelectorSchema(SELECT['graph_type']), ...(!isDynamicChart ? GRAP_DEFAULT_SCHEMA : [])],
    },
  ] as const;
};

export const LAYOUT_SCHEMA = (data: LayoutConfig, localize: LocalizeFunc) => {
  const isDynamicChart = data?.graph_chart_config?.graph_type === 'dynamic';
  const getTitle = (path: string) => localize(`editor.${TITLE_PATH[path]}.title`);
  return [
    ...computeSelectorSchema(SELECT['default_section']),
    ...LAYOUT_BASE_SCHEMA(localize),
    ...FONT_CONFIG_SCHEMA(localize),
    ...GRAPH_SCHEMA(isDynamicChart, getTitle('graph_chart_config')),
  ] as const;
};

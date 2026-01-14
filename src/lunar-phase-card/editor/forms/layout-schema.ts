import {
  FontSizes,
  FontTextTransforms,
  HeaderFontConfigKeys,
  LabelFontConfigKeys,
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
import { LayoutConfig } from '../../../types/config/lunar-phase-card-config';
import { formatLabelUppercase } from '../../../utils/string-helper';

type GraphDropdownProperty = (typeof GraphConfigDropdownKeys)[number];

interface GraphDropdownSelectorOptions {
  name: GraphDropdownProperty;
  default: string;
  options: readonly string[];
}

const GRAPH_DROPDOWN_SELECTOR_OPTIONS: Record<GraphDropdownProperty, GraphDropdownSelectorOptions> = {
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
};

const computeGraphDropdownItem = (property: GraphDropdownProperty) => {
  const selectorOption = GRAPH_DROPDOWN_SELECTOR_OPTIONS[property];
  return [
    {
      name: selectorOption.name,
      required: false,
      default: selectorOption.default,
      selector: {
        select: {
          mode: 'dropdown',
          options: selectorOption.options.map((option) => ({
            value: option,
            label: formatLabelUppercase(option),
          })),
        },
      },
    },
  ] as const;
};

const computeBooleanItem = (property: string) => ({
  name: property,
  required: false,
  default: false,
  type: 'boolean',
});

const FontSizeOptions = FontSizes.map((size) => ({
  value: size,
  label: size,
}));
const FontTextTransformOptions = FontTextTransforms.map((transform) => ({
  value: transform,
  label: transform,
}));

const computeFontDropdownItem = (property: string) => {
  const options =
    property === 'header_font_size' || property === 'label_font_size' ? FontSizeOptions : FontTextTransformOptions;
  return [
    {
      name: property,
      required: false,
      selector: {
        select: {
          mode: 'dropdown',
          options: options,
        },
      },
    },
  ] as const;
};
const computeFontoColorItem = (property: string) => {
  return [
    {
      name: property,
      required: false,
      type: 'string',
    },
  ] as const;
};

export const LABEL_FONT_SCHEMA = [
  {
    title: 'Label Font Settings',
    type: 'expandable',
    icon: 'mdi:format-font',
    flatten: true,
    schema: [
      ...LabelFontConfigKeys.map((key) => {
        if (key === 'label_font_color') {
          return computeFontoColorItem(key);
        } else {
          return computeFontDropdownItem(key);
        }
      }).flat(),
    ],
  },
] as const;
export const HEADER_FONT_SCHEMA = [
  {
    title: 'Header Font Settings',
    type: 'expandable',
    icon: 'mdi:format-font',
    flatten: true,
    schema: [
      ...HeaderFontConfigKeys.map((key) => {
        if (key === 'header_font_color') {
          return computeFontoColorItem(key);
        } else {
          return computeFontDropdownItem(key);
        }
      }).flat(),
    ],
  },
] as const;
const FONT_CONFIG_SCHEMA = [
  {
    title: 'Font Settings',
    name: 'font_config',
    flatten: false,
    type: 'expandable',
    icon: 'mdi:format-font',
    schema: [...HEADER_FONT_SCHEMA, ...LABEL_FONT_SCHEMA],
  },
] as const;

const LAYOUT_BASE_SCHEMA = [
  {
    title: 'Data Format Options',
    type: 'expandable',
    icon: 'mdi:calendar-today',
    description: 'Configure how date, time, and numbers are displayed.',
    flatten: true,
    schema: [
      {
        type: 'grid',
        flatten: true,
        schema: [
          {
            name: '12hr_format',
            default: false,
            type: 'boolean',
          },
          {
            name: 'mile_unit',
            default: false,
            type: 'boolean',
          },
          {
            name: 'number_decimals',
            default: 2,
            required: false,
            selector: { number: { min: 0, max: 5, step: 1 } },
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
        default: prop === 'y_ticks_step_size' ? 10 : 60,
        selector: { number: { min: 1, step: 1 } },
      })),
      ...GraphConfigDropdownKeys.filter((prop) => prop !== 'graph_type')
        .map((prop) => computeGraphDropdownItem(prop))
        .flat(),
    ],
  },
] as const;

const GRAPH_SCHEMA = (isDynamicChart: boolean) => {
  return [
    {
      title: 'Graph Options',
      name: 'graph_chart_config',
      flatten: false,
      type: 'expandable',
      icon: 'mdi:chart-line',
      schema: [
        {
          name: 'graph_type',
          required: false,
          default: 'default',
          selector: {
            select: {
              mode: 'dropdown',
              options: GRAPH_TYPES.map((type) => ({
                value: type,
                label: type.charAt(0).toUpperCase() + type.slice(1),
              })),
            },
          },
        },
        ...(!isDynamicChart ? GRAP_DEFAULT_SCHEMA : []),
      ],
    },
  ] as const;
};

export const LAYOUT_SCHEMA = (data: LayoutConfig) => {
  const isDynamicChart = data?.graph_chart_config?.graph_type === 'dynamic';
  return [...LAYOUT_BASE_SCHEMA, ...FONT_CONFIG_SCHEMA, ...GRAPH_SCHEMA(isDynamicChart)] as const;
};

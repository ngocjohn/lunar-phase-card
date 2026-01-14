import { EDITOR_CUSTOM_BG } from '../../../const';
import { langKeys } from '../../../localize/languageImports';
import { CardAppearance, COMPACT_MODE, MOON_POSITION, THEME_MODE } from '../../../types/config/lunar-phase-card-config';
import { formatLabelUppercase } from '../../../utils/string-helper';

const SECTIONS = ['base', 'calendar', 'full_calendar', 'horizon'] as const;
const booleanProperties = ['compact_view', 'calendar_modal', 'hide_buttons'] as const;
const backgroundBooleans = ['hide_background', 'hide_starfield'] as const;

const CUSTOM_BG_OPTIONS = Array.from(EDITOR_CUSTOM_BG).map((bg, index) => ({
  value: bg,
  label: `BG #${index + 1}`,
  image: { src: bg },
}));
const DropdownProperty = ['default_section', 'compact_mode', 'moon_position', 'theme_mode'] as const;
type DropdownProperty = (typeof DropdownProperty)[number];

interface DropdownSelectorOptions {
  name: DropdownProperty;
  default: string;
  options: readonly string[];
}

const SELECTOR_OPTIONS: Record<DropdownProperty, DropdownSelectorOptions> = {
  default_section: {
    name: 'default_section',
    default: 'base',
    options: SECTIONS as readonly string[],
  },
  compact_mode: {
    name: 'compact_mode',
    default: 'default',
    options: COMPACT_MODE as readonly string[],
  },
  moon_position: {
    name: 'moon_position',
    default: 'left',
    options: MOON_POSITION as readonly string[],
  },
  theme_mode: {
    name: 'theme_mode',
    default: 'auto',
    options: THEME_MODE as readonly string[],
  },
};

const computeDropdownItem = (property: DropdownProperty) => {
  const selectorOption = SELECTOR_OPTIONS[property];
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

const COMPACT_MODE_SCHEMA = [
  {
    type: 'grid',
    flatten: true,
    schema: [computeBooleanItem('hide_compact_label'), ...computeDropdownItem('compact_mode')],
  },
] as const;

const THEME_CONFIG_SCHEMA = [
  {
    title: 'Theme Options',
    type: 'expandable',
    icon: 'mdi:palette',
    flatten: true,
    schema: [
      {
        type: 'grid',
        flatten: true,
        schema: [
          {
            name: 'custom_theme',
            default: 'default',
            required: false,
            selector: { theme: { include_default: true } },
          },
          ...computeDropdownItem('theme_mode'),
        ],
      },
    ],
  },
] as const;

const LANGUAGE_SCHEMA = [
  {
    name: 'language',
    required: false,
    selector: {
      language: {
        languages: Object.values(langKeys),
        native_name: true,
      },
    },
  },
] as const;

const ADDITIONAL_APPEARANCE_SCHEMA = (isCompact = false) =>
  [
    {
      title: 'Additional Appearance Options',
      type: 'expandable',
      icon: 'mdi:format-paint',
      flatten: true,
      schema: [
        {
          type: 'grid',
          flatten: true,
          schema: [...booleanProperties.map((prop) => computeBooleanItem(prop))],
        },
        ...(isCompact ? COMPACT_MODE_SCHEMA : computeDropdownItem('moon_position')),
      ],
    },
  ] as const;

const computeBgOption = (isBackgroundHidden: boolean, helper: boolean = false) => {
  return [
    {
      name: 'custom_background',
      helper: helper ? 'You can choose a custom background from the options or enter a custom URL.' : undefined,
      label: helper ? 'Custom Background (Options or URL)' : 'Preset Backgrounds',
      disabled: isBackgroundHidden,
      required: false,
      selector: {
        select: {
          mode: 'box',
          multiple: false,
          custom_value: helper,
          box_max_columns: 4,
          options: CUSTOM_BG_OPTIONS.map((option) => ({
            ...option,
            disabled: isBackgroundHidden,
          })),
        },
      },
    },
  ];
};

const BACKGROUND_CONFIG_SCHEMA = (isBackgroundHidden = false) =>
  [
    {
      title: 'Background Options',
      type: 'expandable',
      icon: 'mdi:image-outline',
      flatten: true,
      schema: [
        {
          type: 'grid',
          flatten: true,
          schema: backgroundBooleans.map((prop) => computeBooleanItem(prop)),
        },
        ...computeBgOption(isBackgroundHidden),
        ...computeBgOption(isBackgroundHidden, true),
      ],
    },
  ] as const;

export const APPEARANCE_FORM_SCHEMA = (data: CardAppearance) => {
  const isCompact = data?.compact_view === true;
  const isBackgroundHidden = data?.hide_background === true;
  return [
    ...LANGUAGE_SCHEMA,
    ...computeDropdownItem('default_section'),
    ...ADDITIONAL_APPEARANCE_SCHEMA(isCompact),
    ...BACKGROUND_CONFIG_SCHEMA(isBackgroundHidden),
    ...THEME_CONFIG_SCHEMA,
  ];
};

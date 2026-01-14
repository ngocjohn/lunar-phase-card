import { EDITOR_CUSTOM_BG } from '../../../const';
import { langKeys } from '../../../localize/languageImports';
import { CardAppearance, COMPACT_MODE, MOON_POSITION, THEME_MODE } from '../../../types/config/lunar-phase-card-config';
import { formatLabelUppercase } from '../../../utils/string-helper';

const sections = ['base', 'calendar', 'full_calendar', 'horizon'] as const;
const booleanProperties = ['compact_view', 'calendar_modal', 'hide_buttons'] as const;
const backgroundBooleans = ['hide_background', 'hide_starfield'] as const;

const CUSTOM_BG_OPTIONS = Array.from(EDITOR_CUSTOM_BG).map((bg, index) => ({
  value: bg,
  label: `BG #${index + 1}`,
  image: { src: bg },
}));

const computeBooleanIte = (property: string) => ({
  name: property,
  required: false,
  default: false,
  type: 'boolean',
});

const DEFAULT_SECTION_SCHEMA = [
  {
    name: 'default_section',
    default: 'base',
    required: false,
    selector: {
      select: {
        mode: 'dropdown',
        options: sections.map((section) => ({
          value: section,
          label: formatLabelUppercase(section),
        })),
      },
    },
  },
] as const;

const COMPACT_MODE_SCHEMA = [
  {
    name: 'compact_mode',
    required: false,
    default: 'default',
    selector: {
      select: {
        mode: 'dropdown',
        options: COMPACT_MODE.map((mode) => ({
          value: mode,
          label: formatLabelUppercase(mode),
        })),
      },
    },
  },
] as const;
const MOON_POSITION_SCHEMA = [
  {
    name: 'moon_position',
    required: false,
    default: 'left',
    selector: {
      select: {
        mode: 'dropdown',
        options: MOON_POSITION.map((position) => ({
          value: position,
          label: formatLabelUppercase(position),
        })),
      },
    },
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
          {
            name: 'theme_mode',
            required: false,
            default: 'auto',
            selector: {
              select: {
                mode: 'dropdown',
                options: THEME_MODE.map((mode) => ({
                  value: mode,
                  label: formatLabelUppercase(mode),
                })),
              },
            },
          },
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
          schema: [...booleanProperties.map((prop) => computeBooleanIte(prop))],
        },
        ...(isCompact ? COMPACT_MODE_SCHEMA : MOON_POSITION_SCHEMA),
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
          schema: backgroundBooleans.map((prop) => computeBooleanIte(prop)),
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
    ...DEFAULT_SECTION_SCHEMA,
    ...ADDITIONAL_APPEARANCE_SCHEMA(isCompact),
    ...THEME_CONFIG_SCHEMA,
    ...BACKGROUND_CONFIG_SCHEMA(isBackgroundHidden),
  ];
};

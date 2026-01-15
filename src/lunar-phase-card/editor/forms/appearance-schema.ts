import { EDITOR_CUSTOM_BG } from '../../../const';
import { LocalizeFunc } from '../../../ha';
import { langKeys } from '../../../localize/languageImports';
import { CardAppearance, COMPACT_MODE, MOON_POSITION, THEME_MODE } from '../../../types/config/lunar-phase-card-config';
import { computeBooleanItem, computeSelectorSchema } from './helper';
import { HaFormBaseSchemaExtended } from './types';

const booleanProperties = ['calendar_modal', 'hide_buttons', 'compact_view'] as const;
const backgroundBooleans = ['hide_background', 'hide_starfield'] as const;

const CUSTOM_BG_OPTIONS = Array.from(EDITOR_CUSTOM_BG).map((bg, index) => ({
  value: bg,
  label: `BG #${index + 1}`,
  image: { src: bg },
}));

const DropdownProperty = ['compact_mode', 'moon_position', 'theme_mode'] as const;
type DropdownProperty = (typeof DropdownProperty)[number];

const SELECTOR_OPTIONS: Record<DropdownProperty, HaFormBaseSchemaExtended> = {
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

const COMPACT_MODE_SCHEMA = [
  {
    type: 'grid',
    flatten: true,
    schema: [computeBooleanItem('hide_compact_label'), ...computeSelectorSchema(SELECTOR_OPTIONS['compact_mode'])],
  },
] as const;

const THEME_CONFIG_SCHEMA = (title: string) =>
  [
    {
      title,
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
            ...computeSelectorSchema(SELECTOR_OPTIONS['theme_mode']),
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

const ADDITIONAL_APPEARANCE_SCHEMA = (isCompact = false, isMinimal = false, title: string) =>
  [
    {
      title,
      type: 'expandable',
      icon: 'mdi:format-paint',
      flatten: true,
      schema: [
        {
          type: 'grid',
          flatten: true,
          schema: [...booleanProperties.map((prop) => computeBooleanItem(prop))],
        },
        ...(isMinimal
          ? COMPACT_MODE_SCHEMA
          : isCompact
            ? [...computeSelectorSchema(SELECTOR_OPTIONS['moon_position']), ...COMPACT_MODE_SCHEMA]
            : computeSelectorSchema(SELECTOR_OPTIONS['moon_position'])),
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

const BACKGROUND_CONFIG_SCHEMA = (isBackgroundHidden = false, title: string) =>
  [
    {
      title,
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

export const APPEARANCE_FORM_SCHEMA = (data: CardAppearance, customLocalize: LocalizeFunc) => {
  const isCompact = data?.compact_view === true;
  const isMinimal = isCompact && data?.compact_mode === 'minimal';

  const isBackgroundHidden = data?.hide_background === true;
  const getTitle = (key: string) => customLocalize(`editor.viewConfig.${key}.title`);

  return [
    ...LANGUAGE_SCHEMA,
    ...ADDITIONAL_APPEARANCE_SCHEMA(isCompact, isMinimal, getTitle('layout')),
    ...BACKGROUND_CONFIG_SCHEMA(isBackgroundHidden, getTitle('customBackground')),
    ...THEME_CONFIG_SCHEMA(getTitle('theme')),
  ];
};

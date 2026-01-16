import { EDITOR_CUSTOM_BG } from '../../../const';
import { LocalizeFunc } from '../../../ha';
import { langKeys } from '../../../localize/languageImports';
import { THEME_MODE, VisualBackgroundConfig } from '../../../types/config/lunar-phase-card-config';
import { computeBooleanItem, computeSelectorSchema } from './helper';
import { HaFormBaseSchemaExtended } from './types';

const backgroundBooleans = ['hide_background', 'hide_starfield'] as const;

const CUSTOM_BG_OPTIONS = Array.from(EDITOR_CUSTOM_BG).map((bg, index) => ({
  value: bg,
  label: `BG #${index + 1}`,
  image: { src: bg },
}));

const DropdownProperty = ['theme_mode'] as const;
type DropdownProperty = (typeof DropdownProperty)[number];

const SELECTOR_OPTIONS: Record<DropdownProperty, HaFormBaseSchemaExtended> = {
  theme_mode: {
    name: 'theme_mode',
    default: 'auto',
    options: THEME_MODE as readonly string[],
  },
};

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

export const VISUAL_SCHEMA = (data: VisualBackgroundConfig, customLocalize: LocalizeFunc) => {
  const isBackgroundHidden = data?.hide_background === true;
  const getTitle = (key: string) => customLocalize(`editor.viewConfig.${key}.title`);

  return [
    ...LANGUAGE_SCHEMA,
    ...BACKGROUND_CONFIG_SCHEMA(isBackgroundHidden, getTitle('customBackground')),
    ...THEME_CONFIG_SCHEMA(getTitle('theme')),
  ];
};

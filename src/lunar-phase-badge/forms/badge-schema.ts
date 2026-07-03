import { LocalizeFunc, UiAction } from '../../ha';
import { langKeys } from '../../localize/languageImports';
import { MOON_PHASE_FIELD_NAMES } from '../../lunar-phase-card/editor/forms';
import { computeBooleanItem, computeSelectorSchema } from '../../shared/schema-helper';
import { BADGE_ICON_TYPE, ContentBadgeConfig } from '../../types/config/lunar-phase-badge-config';
import { MOON_DATA_KEYS } from '../../types/config/lunar-phase-card-config';

export const DEFAULT_ACTIONS: UiAction[] = [
  'more-info',
  'toggle',
  'navigate',
  'url',
  'perform-action',
  'assist',
  'none',
];

export const computeOptionalActionSchema = () => {
  return [
    {
      name: 'tap_action',
      label: 'Tap Action',
      selector: {
        ui_action: {
          actions: DEFAULT_ACTIONS,
          default_action: 'none' as const,
        },
      },
    },
    {
      name: '',
      type: 'optional_actions',
      flatten: true,
      schema: (['hold_action', 'double_tap_action'] as const).map((action) => ({
        name: action,
        selector: {
          ui_action: {
            actions: DEFAULT_ACTIONS,
            default_action: 'none' as const,
          },
        },
      })),
    },
  ] as const;
};

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

export const BADGE_APPEARANCE_SCHEMA = (localize: LocalizeFunc) =>
  [
    {
      title: localize('editor.layoutConfig.title'),
      type: 'expandable',
      icon: 'mdi:format-paint',
      flatten: true,
      schema: [
        ...LANGUAGE_SCHEMA,
        {
          type: 'grid',
          flatten: true,
          schema: [
            ...['12hr_format', 'mile_unit'].map((prop) => computeBooleanItem(prop)),
            {
              name: 'number_decimals',
              default: 2,
              required: false,
              selector: { number: { min: 0, max: 5, mode: 'box', step: 1 } },
            },
            ...computeSelectorSchema({
              name: 'icon_type',
              default: 'image',
              options: BADGE_ICON_TYPE,
            }),
          ],
        },
      ],
    },
  ] as const;

const BADGE_NAME_SCHEMA = (localize: LocalizeFunc, customName: boolean = false) => {
  return [
    computeBooleanItem('custom_name'),
    ...(customName
      ? [
          {
            name: 'name',
            required: false,
            selector: { text: { type: 'text', placeholder: 'Lunar Phase' } },
          },
        ]
      : [
          ...computeSelectorSchema({
            name: 'name',
            options: [...MOON_DATA_KEYS, 'phaseName'].map((item) => ({
              value: item,
              label: localize(`card.${MOON_PHASE_FIELD_NAMES[item]}`),
            })),
          }),
        ]),
  ] as const;
};

export const BADGE_CONTENT_SCHEMA = (localize: LocalizeFunc, data: ContentBadgeConfig) =>
  [
    {
      title: 'Content',
      type: 'expandable',
      icon: 'mdi:format-list-bulleted',
      flatten: true,
      schema: [
        ...BADGE_NAME_SCHEMA(localize, data?.custom_name),
        {
          type: 'grid',
          flatten: true,
          schema: [...['show_name', 'show_icon', 'show_state'].map((prop) => computeBooleanItem(prop))],
        },
        ...computeSelectorSchema({
          name: 'state_content',
          label: 'State Content',
          default: 'phaseName',
          multiple: true,
          reorder: true,
          mode: 'dropdown',
          options: [...MOON_DATA_KEYS, 'phaseName'].map((item) => ({
            value: item,
            label: localize(`card.${MOON_PHASE_FIELD_NAMES[item]}`),
          })),
        }),
      ],
    },
  ] as const;

export const BADGE_ACTIONS_SCHEMA = [
  {
    title: 'Interactions',
    type: 'expandable',
    icon: 'mdi:gesture-tap',
    schema: [...computeOptionalActionSchema()],
  },
] as const;

import { LocalizeFunc } from '../../../ha';
import { AppearanceLayoutConfig, COMPACT_MODE, MOON_POSITION } from '../../../types/config/lunar-phase-card-config';
import { computeBooleanItem, computeSelectorSchema } from './helper';
import { HaFormBaseSchemaExtended } from './types';

const SECTIONS = ['base', 'calendar', 'full_calendar', 'horizon'] as const;
const booleanProperties = ['calendar_modal', 'hide_buttons', 'compact_menu_button', 'compact_view'] as const;

const DropdownProperty = ['default_section', 'compact_mode', 'moon_position'] as const;
type DropdownProperty = (typeof DropdownProperty)[number];

const SELECTOR_OPTIONS: Record<DropdownProperty, HaFormBaseSchemaExtended> = {
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
};

const COMPACT_MODE_SCHEMA = [
  {
    type: 'grid',
    flatten: true,
    schema: [computeBooleanItem('hide_compact_label'), ...computeSelectorSchema(SELECTOR_OPTIONS['compact_mode'])],
  },
] as const;
const COMPACT_MOON_SIZE_SCHEMA = [
  {
    type: 'grid',
    flatten: true,
    schema: [
      ...computeSelectorSchema(SELECTOR_OPTIONS['compact_mode']),
      {
        name: 'moon_size',
        default: 100,
        selector: {
          number: {
            min: 0,
            max: 100,
            mode: 'box',
            unit_of_measurement: '%',
          },
        },
      },
    ],
  },
] as const;

const ADDITIONAL_APPEARANCE_SCHEMA = (isCompact = false, isMinimal = false, title: string, isMoonOnly = false) =>
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
          : isMoonOnly
            ? [...COMPACT_MOON_SIZE_SCHEMA, ...computeSelectorSchema(SELECTOR_OPTIONS['moon_position'])]
            : isCompact
              ? [...computeSelectorSchema(SELECTOR_OPTIONS['moon_position']), ...COMPACT_MODE_SCHEMA]
              : computeSelectorSchema(SELECTOR_OPTIONS['moon_position'])),
      ],
    },
  ] as const;

export const APPEARANCE_FORM_SCHEMA = (data: AppearanceLayoutConfig, customLocalize: LocalizeFunc) => {
  const isCompact = data?.compact_view === true;
  const isMinimal = isCompact && data?.compact_mode === 'minimal';
  const isMoonOnly = isCompact && data?.compact_mode === 'moon-only';

  const getTitle = (key: string) => customLocalize(`editor.viewConfig.${key}.title`);

  return [
    ...computeSelectorSchema(SELECTOR_OPTIONS['default_section']),
    ...ADDITIONAL_APPEARANCE_SCHEMA(isCompact, isMinimal, getTitle('layout'), isMoonOnly),
  ];
};

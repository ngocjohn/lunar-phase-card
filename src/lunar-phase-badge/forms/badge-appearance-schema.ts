import { LocalizeFunc } from '../../ha';
import { langKeys } from '../../localize/languageImports';
import { computeBooleanItem, computeSelectorSchema } from '../../shared/schema-helper';
import { BADGE_ICON_TYPE } from '../../types/config/lunar-phase-badge-config';

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

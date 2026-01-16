import type { LocationConfig } from '../../../types/config/lunar-phase-card-config';

import { LOC_SOURCE } from '../../../types/config/lunar-phase-card-config';
import { computeBooleanItem, computeSelectorSchema } from './helper';

const COORDINATES_SCHEMA = [
  {
    name: '',
    type: 'grid',
    disabled: true,
    schema: [
      {
        name: 'latitude',
        required: false,
        selector: { number: { step: 'any', unit_of_measurement: '°' } },
      },
      {
        name: 'longitude',
        required: true,
        selector: { number: { step: 'any', unit_of_measurement: '°' } },
      },
    ],
  },
] as const;

const LAT_LON_SCHEMA = (isCustom: boolean = false) => {
  if (isCustom) {
    return [
      {
        name: 'location',
        label: ' ',
        selector: { location: { radius: false } },
      },
    ] as const;
  } else {
    return COORDINATES_SCHEMA;
  }
};

const LOCATION_SOURCE_SCHEMA = [
  ...computeSelectorSchema({
    name: 'location_source',
    default: 'default',
    options: LOC_SOURCE as readonly string[],
  }),
  computeBooleanItem('southern_hemisphere'),
] as const;

const LOCATION_ENTITY_SCHEMA = (entitiesInclude?: string[]) =>
  [
    {
      name: 'entity',
      label: 'Entity (optional)',
      helper: 'Only entity with latitude and longitude attributes are supported.',
      required: false,
      selector: { entity: { include_entities: entitiesInclude ?? [] } },
    },
  ] as const;

export const LOCATION_FORM_SCHEMA = (data: LocationConfig, entitiesInclude?: string[]) => {
  const isCustom = data.location_source === 'custom';
  const isEntity = data.location_source === 'entity';
  return [
    ...LOCATION_SOURCE_SCHEMA,
    ...(isEntity ? LOCATION_ENTITY_SCHEMA(entitiesInclude) : []),
    ...LAT_LON_SCHEMA(isCustom),
  ] as const;
};

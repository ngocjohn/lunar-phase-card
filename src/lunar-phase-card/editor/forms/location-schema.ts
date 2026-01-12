import type { LocationConfig } from '../../../types/config/lunar-phase-card-config';

import { LOC_SOURCE } from '../../../types/config/lunar-phase-card-config';

const COORDINATES_SCHEMA = [
  {
    name: '',
    type: 'grid',
    disabled: true,
    schema: [
      {
        name: 'latitude',
        required: true,
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
        selector: { location: { radius: false } },
      },
    ] as const;
  } else {
    return COORDINATES_SCHEMA;
  }
};

const LOCATION_SOURCE_SCHEMA = [
  {
    name: 'location_source',
    default: 'default',
    selector: {
      select: {
        mode: 'dropdown',
        options: [...LOC_SOURCE.map((source) => ({ value: source, label: source.toUpperCase() }))],
      },
    },
  },
  {
    name: 'southern_hemisphere',
    default: false,
    type: 'boolean',
  },
] as const;

const LOCATION_ENTITY_SCHEMA = [
  {
    name: 'entity',
    label: 'Entity (optional)',
    helper: 'Only entity with latitude and longitude attributes are supported.',
    required: false,
    selector: { entity: {} },
  },
] as const;

export const LOCATION_FORM_SCHEMA = (data: LocationConfig) => {
  const isCustom = data.location_source === 'custom';
  const isEntity = data.location_source === 'entity';
  return [...LOCATION_SOURCE_SCHEMA, ...(isEntity ? LOCATION_ENTITY_SCHEMA : []), ...LAT_LON_SCHEMA(isCustom)] as const;
};

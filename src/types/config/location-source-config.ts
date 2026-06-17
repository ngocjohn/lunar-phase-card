export const LOC_SOURCE = ['default', 'entity', 'custom'] as const;

export type LocationSource = (typeof LOC_SOURCE)[number];

export const LocationConfigKeys = [
  'location_source',
  'entity',
  'southern_hemisphere',
  'latitude',
  'longitude',
] as const;

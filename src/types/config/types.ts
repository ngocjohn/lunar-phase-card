import { FrontendLocaleData } from '../../ha';

export type LatLon = {
  latitude: number;
  longitude: number;
};

export interface FrontendLocaleDataExtended extends FrontendLocaleData {
  mile_unit?: boolean;
  location?: LatLon;
  number_decimals?: number;
}

export type LatLngTuple = [number, number, number?];

export interface LatLngLiteral {
  latitude: number;
  longitude: number;
  altitude?: number;
}

export type LatLngEntityExpression = LatLngTuple | LatLngLiteral;

export function isLatLngEntityExpression(value: any): value is LatLngEntityExpression {
  if (Array.isArray(value)) {
    return (
      (value.length === 2 || value.length === 3) &&
      typeof value[0] === 'number' &&
      typeof value[1] === 'number' &&
      (value.length === 2 || typeof value[2] === 'number')
    );
  } else if (typeof value === 'object' && value !== null) {
    return (
      'latitude' in value &&
      typeof value.latitude === 'number' &&
      'longitude' in value &&
      typeof value.longitude === 'number' &&
      ('altitude' in value ? typeof value.altitude === 'number' : true)
    );
  }
  return false;
}

export const parseLatLngEntityExpression = (value: LatLngEntityExpression): LatLon => {
  if (Array.isArray(value)) {
    return {
      latitude: value[0],
      longitude: value[1],
    };
  } else {
    return {
      latitude: value.latitude,
      longitude: value.longitude,
    };
  }
};

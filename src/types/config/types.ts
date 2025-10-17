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

import { FrontendLocaleData, TimeFormat, HomeAssistant } from '../ha';
import { LocationAddress, LunarPhaseCardConfig, SearchResults } from '../types/config/lunar-phase-card-config';

export const useAmPm = (locale: FrontendLocaleData): boolean => {
  if (locale.time_format === TimeFormat.language || locale.time_format === TimeFormat.system) {
    const testLanguage = locale.time_format === TimeFormat.language ? locale.language : undefined;
    const test = new Date().toLocaleString(testLanguage);
    return test.includes('AM') || test.includes('PM');
  }

  return locale.time_format === TimeFormat.am_pm;
};

export const convertKmToMiles = (km: number, useMiles: boolean): number => {
  return useMiles ? km / 1.609344 : km;
};

export function getDefaultConfig(hass: HomeAssistant) {
  console.log('getDefaultConfig');
  const {
    latitude,
    longitude,
    unit_system: { length },
  } = hass.config;
  const selected_language = hass.language;
  const timeFormat = useAmPm(hass.locale);
  const mile_unit = length !== 'km';
  console.log(
    'default config',
    'latitude:',
    latitude,
    'longitude:',
    longitude,
    'selected_language:',
    selected_language,
    'timeFormat:',
    timeFormat,
    'mile_unit:',
    mile_unit
  );
  return {
    latitude,
    longitude,
    selected_language,
    '12hr_format': timeFormat,
    mile_unit,
  };
}

// Compare time to show
export const compareTime = (time: Date): boolean => {
  const date = new Date(time);
  const now = new Date();

  const timeDifference = date.getTime() - now.getTime();
  const hoursDifference = Math.round(timeDifference / (1000 * 60 * 60)); // Convert milliseconds to hours

  // if time is between 24ago and 24h from now
  return hoursDifference >= -24 && hoursDifference <= 24;
};

// eslint-disable-next-line unused-imports/no-unused-vars
function compareChanges(oldConfig: LunarPhaseCardConfig, newConfig: Partial<LunarPhaseCardConfig>) {
  const changes: Record<string, any> = {};

  for (const key of Object.keys(newConfig)) {
    if (newConfig[key] instanceof Object && key in oldConfig) {
      const nestedChanges = compareChanges(oldConfig[key], newConfig[key]);
      // Only add nested changes if there are actual differences
      if (nestedChanges && Object.keys(nestedChanges).length > 0) {
        changes[key] = nestedChanges;
      }
    } else if (oldConfig[key] !== newConfig[key]) {
      // Only add the key if the values are different
      changes[key] = {
        oldValue: oldConfig[key],
        newValue: newConfig[key],
      };
    }
  }

  // Log the changes with old vs. new, only if there are changes
  if (Object.keys(changes).length > 0) {
    console.group('Configuration Changes');
    Object.entries(changes).forEach(([key, value]) => {
      if (typeof value === 'object' && value.oldValue !== undefined && value.newValue !== undefined) {
        console.log(`%c${key}:`, 'color: #1e88e5', 'Old:', value.oldValue, 'New:', value.newValue);
      } else {
        console.log(`%c${key}:`, 'color: #1e88e5', value);
      }
    });
    console.groupEnd();
  }

  return changes; // Ensure we return the changes object
}

export function compareConfig(refObj: any, configObj: any): boolean {
  let isValid = true;
  for (const key in refObj) {
    if (typeof refObj[key] === 'object' && refObj[key] !== null) {
      if (!(key in configObj)) {
        isValid = false;
      } else if (!compareConfig(refObj[key], configObj[key])) {
        isValid = false; // If any nested object is invalid
      }
    } else {
      // Check if the property exists in configObj
      if (!(key in configObj)) {
        isValid = false;
      }
    }
  }
  return isValid;
}

export async function getAddressFromOpenStreet(lat: number, lon: number): Promise<LocationAddress> {
  // console.log('getAddressFromOpenStreet', lat, lon);
  const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}`;
  try {
    const response = await fetch(url);
    const data = await response.json();

    if (response.ok) {
      // Extract address components from the response
      const address = {
        city: data.address.city || data.address.town || '',
        country: data.address.country || data.address.state || '',
      };
      console.log('Address fetched from OpenStreetMap:', address);
      return address;
    } else {
      // throw new Error('Failed to fetch address OpenStreetMap');
      return { city: '', country: '' };
    }
  } catch (error) {
    console.log('Error fetching address from OpenStreetMap:', error);
    return { city: '', country: '' };
  }
}

export async function getCoordinates(query: string): Promise<SearchResults[]> {
  const url = `https://nominatim.openstreetmap.org/search?q=${query}&format=jsonv2&limit=5&featureType=city`;

  try {
    const response = await fetch(url);
    const data = await response.json();
    console.log('getCoordinates', data);
    if (response.ok) {
      const results = data.map((result: any) => ({
        display_name: result.display_name,
        name: result.display_name,
        lat: parseFloat(result.lat),
        lon: parseFloat(result.lon),
      }));
      // console.log('Coordinates fetched:', results);
      return results;
    } else {
      // throw new Error('Failed to fetch coordinates');
      return [];
    }
  } catch (error) {
    console.log('Error fetching coordinates:', error);
    return [];
  }
}

export const hexToRgba = (hex: string, alpha: number): string => {
  const bigint = parseInt(hex.slice(1), 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;

  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

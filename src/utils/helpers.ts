import { FrontendLocaleData, TimeFormat, HomeAssistant } from 'custom-card-helpers';

import { LocationAddress, LunarPhaseCardConfig, SearchResults } from '../types';
import { MOON_IMAGES } from './moon-pic';

export function formatMoonTime(dateString: string): string {
  const date = new Date(dateString);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  const isToday = date.toDateString() === today.toDateString();
  const isYesterday = date.toDateString() === yesterday.toDateString();

  const timeString = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  if (isToday) {
    return `Today ${timeString}`;
  } else if (isYesterday) {
    return `Yesterday ${timeString}`;
  } else {
    return date.toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  }
}

export function formatRelativeTime(dateString: string): { key: string; value?: string } {
  const date = new Date(dateString);
  const now = new Date();

  const timeDifference = date.getTime() - now.getTime();
  const hoursDifference = Math.round(timeDifference / (1000 * 60 * 60)); // Convert milliseconds to hours
  const daysDifference = Math.round(timeDifference / (1000 * 60 * 60 * 36)); // Convert milliseconds to days

  if (Math.abs(daysDifference) < 1) {
    if (hoursDifference === 0) {
      const minutesDifference = Math.round(timeDifference / (1000 * 60));
      if (minutesDifference === 0) {
        return { key: 'card.relativeTime.justNow' };
      } else if (minutesDifference > 0) {
        return { key: 'card.relativeTime.inMinutes', value: minutesDifference.toString() };
      } else {
        return { key: 'card.relativeTime.minutesAgo', value: Math.abs(minutesDifference).toString() };
      }
    } else if (hoursDifference > 0) {
      return { key: 'card.relativeTime.inHours', value: hoursDifference.toString() };
    } else {
      return { key: 'card.relativeTime.hoursAgo', value: Math.abs(hoursDifference).toString() };
    }
  } else {
    // Handle longer timespans if necessary, otherwise return an empty key
    return { key: '' };
  }
}

export function formatTimeToHHMM(dateString: string, lang: string, timeFormat: boolean): string {
  if (!dateString || dateString === '') {
    return '';
  }
  // console.log(dateString, lang, timeFormat);

  const newLang = lang || 'en-US';
  const date = new Date(dateString);
  return date.toLocaleTimeString(newLang, { hour: '2-digit', minute: '2-digit', hour12: timeFormat });
}

export function formatDate(date: Date): string {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0'); // Months are zero-based
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export function compareVersions(version1, version2) {
  // Remove the leading 'v' if present
  version1 = version1.startsWith('v') ? version1.slice(1) : version1;
  version2 = version2.startsWith('v') ? version2.slice(1) : version2;

  // Split the version into parts: major, minor, patch, and pre-release
  const parts1 = version1.split(/[\.-]/).map((part) => (isNaN(part) ? part : parseInt(part, 10)));
  const parts2 = version2.split(/[\.-]/).map((part) => (isNaN(part) ? part : parseInt(part, 10)));

  // Compare each part
  for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
    const part1 = parts1[i] !== undefined ? parts1[i] : typeof parts2[i] === 'string' ? '' : 0;
    const part2 = parts2[i] !== undefined ? parts2[i] : typeof parts1[i] === 'string' ? '' : 0;

    if (typeof part1 === 'number' && typeof part2 === 'number') {
      if (part1 > part2) return 1;
      if (part1 < part2) return -1;
    } else {
      // Handle pre-release versions
      if (typeof part1 === 'string' && typeof part2 === 'string') {
        if (part1 > part2) return 1;
        if (part1 < part2) return -1;
      } else if (typeof part1 === 'string') {
        return -1; // Pre-release versions are considered lower
      } else if (typeof part2 === 'string') {
        return 1; // Release version is higher than pre-release
      }
    }
  }

  return 0; // Versions are equal
}

export const useAmPm = (locale: FrontendLocaleData): boolean => {
  if (locale.time_format === TimeFormat.language || locale.time_format === TimeFormat.system) {
    const testLanguage = locale.time_format === TimeFormat.language ? locale.language : undefined;
    const test = new Date().toLocaleString(testLanguage);
    return test.includes('AM') || test.includes('PM');
  }

  return locale.time_format === TimeFormat.am_pm;
};

export const formatedTime = (time: number | Date, amPm: boolean, lang: string): string => {
  return new Intl.DateTimeFormat(lang, { hour: '2-digit', minute: '2-digit', hour12: amPm }).format(time);
};

export const convertKmToMiles = (km: number, useMiles: boolean): number => {
  return useMiles ? km / 1.609344 : km;
};

const getBlob = async (data: string) => {
  const result = await fetch(data).then((response) => response.blob());
  console.log('Moon image fetched', result);
  return result;
};

export async function uploadMoonPics(hass: HomeAssistant) {
  const images = MOON_IMAGES as string[];
  const promises = images.map((image) => getBlob(image));
  const blobs = await Promise.all(promises);

  const imagesArray: string[] = [];

  for (let i = 0; i < blobs.length; i++) {
    const imageUrl = await upload(blobs[i] as File, hass);
    if (imageUrl) imagesArray.push(imageUrl);
  }
  console.log('Moon images uploaded');
  return imagesArray;
}

async function upload(file: File, hass: HomeAssistant): Promise<string | void> {
  const formData = new FormData();
  formData.append('file', file);
  try {
    const response = await hass.fetchWithAuth('/api/image/upload', {
      method: 'POST',
      body: formData,
    });
    const data = await response.json();
    const imageId = data.id;
    const imageUrl = `/api/image/serve/${imageId}/original`;
    return imageUrl;
  } catch (error) {
    console.error('Error uploading image:', error);
  }
}

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
  const cardId = `lmc-${Math.random().toString(36).substring(2, 9)}`;
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
    mile_unit,
    'cardId:',
    cardId
  );
  return {
    latitude,
    longitude,
    selected_language,
    '12hr_format': timeFormat,
    mile_unit,
    cardId,
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

export function compareChanges(oldConfig: LunarPhaseCardConfig, newConfig: Partial<LunarPhaseCardConfig>) {
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

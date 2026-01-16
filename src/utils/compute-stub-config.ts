import { HomeAssistant } from '../ha';
import { LunarPhaseCardConfig } from '../types/config/lunar-phase-card-config';
import { useAmPm } from './helpers';

export const computeStubConfig = (hass: HomeAssistant): Partial<LunarPhaseCardConfig> => {
  const {
    latitude,
    longitude,
    language,
    unit_system: { length },
  } = hass.config;
  const userLang = hass.selectedLanguage || language;
  const mile_unit = length === 'mi';
  const timeFormat = useAmPm(hass.locale);
  console.debug('Compute stub config', { latitude, longitude, userLang, mile_unit, timeFormat });
  return {
    location_source: 'default',
    latitude,
    longitude,
    mile_unit,
    '12hr_format': timeFormat,
    language: userLang,
  };
};

import type { HassEntity } from 'home-assistant-js-websocket';
import { isLatLngEntityExpression, parseLatLngEntityExpression } from '../../../types/config/types';
import type { LatLon } from '../../../types/config/types';

export const hasLocation = (stateObj: HassEntity) =>
  'latitude' in stateObj.attributes && 'longitude' in stateObj.attributes;

export const hasLatLongAttr = (stateObj: HassEntity) =>
  'location' in stateObj.attributes && isLatLngEntityExpression(stateObj.attributes.location);

export const hasEntityLocation = (stateObj: HassEntity): boolean => {
  return hasLocation(stateObj) || hasLatLongAttr(stateObj);
};

export const getLatLonFromEntity = (stateObj: HassEntity): LatLon => {
  return hasLatLongAttr(stateObj)
    ? parseLatLngEntityExpression(stateObj.attributes.location)
    : {
        latitude: stateObj.attributes.latitude,
        longitude: stateObj.attributes.longitude,
      };
};

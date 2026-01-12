import { omit, pick } from 'es-toolkit';
import { css, CSSResultGroup, TemplateResult, PropertyValues } from 'lit';
import { customElement, state } from 'lit/decorators.js';

import {
  LocationAddress,
  LocationConfig,
  LocationConfigKeys,
  LunarPhaseCardConfig,
} from '../../../types/config/lunar-phase-card-config';
import { getAddressFromOpenStreet } from '../../../utils/helpers';
import { BaseEditor } from '../base-editor';
import { EditorArea } from '../editor-area-config';
import { LOCATION_FORM_SCHEMA } from '../forms';
import './form-editor';

@customElement('lpc-location-area')
export class LocationArea extends BaseEditor {
  constructor() {
    super(EditorArea.LOCATION);
  }

  @state() private _configLocationAddress?: LocationAddress;
  @state() private _locationSource?: LunarPhaseCardConfig['location_source'];

  protected willUpdate(_changedProperties: PropertyValues): void {
    super.willUpdate(_changedProperties);
    if (_changedProperties.has('config') && this.config) {
      this._locationSource = this.config.location_source;
      if (!this.config.location && !!(this.config.latitude && this.config.longitude)) {
        this._getLocationFromLatLong(this.config.latitude!, this.config.longitude!);
      } else {
        this._configLocationAddress = this.config.location;
      }
    }
  }

  protected get CardLocationConfig(): LocationConfig {
    return pick(this.config, [...LocationConfigKeys]);
  }

  private async _getLocationFromLatLong(lat: number, lon: number): Promise<void> {
    const updatedLocation: LocationAddress = await getAddressFromOpenStreet(lat, lon);
    this._configLocationAddress = updatedLocation;
  }

  protected render(): TemplateResult {
    const configData: LocationConfig = this.CardLocationConfig;
    const baseData = omit(configData, ['latitude', 'longitude']);
    const locationObj = {
      latitude: configData.latitude,
      longitude: configData.longitude,
    };
    const DATA =
      configData.location_source === 'custom'
        ? {
            ...baseData,
            location: locationObj,
          }
        : { ...configData };

    const SCHEMA = LOCATION_FORM_SCHEMA(DATA);
    const locForm = this.createLpcForm(DATA, SCHEMA, 'location-area');

    return locForm;
  }

  static get styles(): CSSResultGroup {
    return [super.styles, css``];
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'lpc-location-area': LocationArea;
  }
}

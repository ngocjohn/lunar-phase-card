import { omit, pick } from 'es-toolkit';
import { css, CSSResultGroup, TemplateResult, PropertyValues, html } from 'lit';
import { customElement, state } from 'lit/decorators.js';

import { getLatLonFromEntity, hasEntityLocation } from '../../../ha/common/entity/has_location';
import {
  LocationConfig,
  LocationConfigKeys,
  LunarPhaseCardConfig,
} from '../../../types/config/lunar-phase-card-config';
import { getObjectDifferences } from '../../../utils/object-differences';
import { BaseEditor } from '../base-editor';
import { EditorArea } from '../editor-area-config';
import { LOCATION_FORM_SCHEMA } from '../forms';
import { createSecondaryCodeLabel } from '../shared/nav-bar';

@customElement('lpc-location-area')
export class LocationArea extends BaseEditor {
  constructor() {
    super(EditorArea.LOCATION);
    window.LunarLocationArea = this;
  }

  @state() private _locationConfig?: LocationConfig;
  @state() private _yamlActive: boolean = false;

  protected willUpdate(_changedProperties: PropertyValues): void {
    super.willUpdate(_changedProperties);
    if (_changedProperties.has('config') && this.config) {
      this._locationConfig = pick(this.config, [...LocationConfigKeys]);
    }
  }

  private _getEntitiesForLocation(): string[] {
    if (!this.hass) {
      return [];
    }

    const entities = Object.values(this.hass.states)
      .filter((stateObj) => hasEntityLocation(stateObj))
      .map((stateObj) => stateObj.entity_id);

    return entities;
  }

  protected render(): TemplateResult {
    const configData = { ...this._locationConfig };
    const source = configData.location_source || 'default';
    const baseData = omit(configData, ['latitude', 'longitude']);
    const locationObj = {
      latitude: configData.latitude,
      longitude: configData.longitude,
    };

    const DATA = configData.location_source === 'custom' ? { ...baseData, location: locationObj } : { ...configData };

    const hasLocationEntities = this._getEntitiesForLocation();
    const SCHEMA = LOCATION_FORM_SCHEMA(DATA, hasLocationEntities);
    const locForm = this.createLpcForm(DATA, SCHEMA, source);
    return html`
      ${this._yamlActive ? this.createYamlEditor(configData) : locForm}
      <lpc-nav-bar
        hide-primary
        .secondaryAction=${createSecondaryCodeLabel(this._yamlActive)}
        @secondary-action=${() => {
          this._yamlActive = !this._yamlActive;
        }}
      ></lpc-nav-bar>
    `;
  }

  protected override _onValueChanged(ev: CustomEvent): void {
    ev.stopPropagation();
    const locationConfig = { ...this._locationConfig };
    const baseConfig = omit(locationConfig, ['latitude', 'longitude']);
    const latLonConfig = {
      latitude: locationConfig.latitude,
      longitude: locationConfig.longitude,
    };

    const incoming = { ...ev.detail.value } as Partial<
      LocationConfig & { location?: { latitude: number; longitude: number } }
    >;

    if (JSON.stringify(locationConfig) === JSON.stringify(incoming)) {
      console.debug('No changes in location config detected, skipping update.');
      return;
    }

    const configToCompare =
      incoming.location_source === 'custom' ? { ...baseConfig, location: latLonConfig } : { ...locationConfig };

    // console.debug('Comparing configs:', { configToCompare, incoming });
    let changedValues = {};
    changedValues = getObjectDifferences(configToCompare, incoming);

    let hasChanges = Boolean(changedValues && Object.keys(changedValues).length > 0);
    if (!hasChanges) {
      return;
    }

    const changedMap = new Map(Object.entries(changedValues)) as Map<keyof LunarPhaseCardConfig, [old: any, new: any]>;

    const hasLocationSourceChanged =
      changedMap.has('location_source') &&
      changedMap.get('location_source')![0] !== changedMap.get('location_source')![1];

    const hasEntityChanged = changedMap.has('entity') && changedMap.get('entity')![0] !== changedMap.get('entity')![1];

    const updates: Partial<LunarPhaseCardConfig> = {};
    // handle location object if present
    if (incoming.location) {
      updates.latitude = incoming.location.latitude;
      updates.longitude = incoming.location.longitude;
      delete incoming.location;
    }

    if (hasLocationSourceChanged) {
      const newSource = changedMap.get('location_source')![1];
      if (newSource === 'default' || !newSource) {
        console.debug(`Source changed to default, using Home Assistant default location.`);
        updates.latitude = this._hass.config.latitude;
        updates.longitude = this._hass.config.longitude;
      } else if (newSource === 'entity' && incoming.entity) {
        console.debug(`Source changed to entity, checking entity for lat/lon...`);
        const newEntityState = this._hass.states[incoming.entity];
        if (hasEntityLocation(newEntityState)) {
          const entityLatLon = getLatLonFromEntity(newEntityState);
          // console.debug('Retrieved lat/lon from entity:', entityLatLon);
          updates.latitude = entityLatLon.latitude;
          updates.longitude = entityLatLon.longitude;
        } else {
          console.debug(`Selected entity ${incoming.entity} does not have location attributes.`);
          // remove entity from config
          incoming.entity = undefined;
          // if entity is invalid, fallback to default location
          console.debug('Falling back to Home Assistant default location.');
          updates.latitude = this._hass.config.latitude;
          updates.longitude = this._hass.config.longitude;
        }
      }
    } else if (hasEntityChanged) {
      const newEntity = changedMap.get('entity')![1];
      console.debug(`Entity changed to ${newEntity}, checking entity for lat/lon...`);
      const newEntityState = this._hass.states[newEntity];
      if (hasEntityLocation(newEntityState)) {
        const entityLatLon = getLatLonFromEntity(newEntityState);
        // console.debug('Retrieved lat/lon from entity:', entityLatLon);
        updates.latitude = entityLatLon.latitude;
        updates.longitude = entityLatLon.longitude;
        updates.entity = newEntity;
      } else {
        console.debug(`Selected entity ${newEntity} does not have location attributes.`);
        // remove entity from config
        incoming.entity = undefined;
        updates.entity = undefined;
        // if entity is invalid, fallback to default location
        console.debug('Falling back to Home Assistant default location.');
        updates.latitude = this._hass.config.latitude;
        updates.longitude = this._hass.config.longitude;
        delete incoming.entity;
      }
    }
    // final updates
    const newConfig = { ...incoming, ...updates };
    let changeValues = {};
    changeValues = getObjectDifferences(locationConfig, newConfig);
    if (changeValues && Object.keys(changeValues).length > 0) {
      console.group('Config changes in', this._editorArea);
      for (const [k, v] of Object.entries(changeValues)) {
        const [oldVal, newVal] = v as [any, any];
        console.log(`%c${k}:`, 'color: #2196F3; font-weight: bold;', oldVal, '→', newVal);
      }
      console.groupEnd();
      this.configChanged(newConfig as Partial<LunarPhaseCardConfig>);
      this.requestUpdate();
    }
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

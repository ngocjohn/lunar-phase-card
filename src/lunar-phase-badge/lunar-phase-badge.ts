import { pick } from 'es-toolkit';
import { css, CSSResultGroup, html, LitElement, nothing, TemplateResult } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';

import { STRINGS_SEPARATOR_DOT } from '../const';
import {
  ActionHandlerEvent,
  FrontendLocaleData,
  handleAction,
  HomeAssistant,
  LovelaceBadge,
  LovelaceBadgeEditor,
  TimeFormat,
} from '../ha';
import { getLatLonFromEntity, hasEntityLocation } from '../ha/common/entity/has_location';
import { Moon } from '../model/moon';
import { LocationConfigKeys } from '../types/config/location-source-config';
import {
  hasAction,
  hasInteraction,
  InteractionBadgeConfig,
  LocationBadgeConfig,
  LunarPhaseBadgeConfig,
} from '../types/config/lunar-phase-badge-config';
import { FrontendLocaleDataExtended, LatLon } from '../types/config/types';
import { actionHandler } from '../utils/action-handler';
import { ensureArray } from '../utils/chunk-object';
import { computeStubConfig } from '../utils/compute-stub-config';

const DEFAULT_CONFIG: LunarPhaseBadgeConfig = {
  type: `custom:lunar-phase-badge`,
  show_name: false,
  show_icon: true,
  show_state: true,
  icon_type: 'image',
};
@customElement('lunar-phase-badge')
export class LunarPhaseBadge extends LitElement implements LovelaceBadge {
  public static async getConfigElement(): Promise<LovelaceBadgeEditor> {
    await import('./editor/lunar-phase-badge-editor');
    return document.createElement('lunar-phase-badge-editor') as LovelaceBadgeEditor;
  }
  @property({ attribute: false }) public hass!: HomeAssistant;
  @property({ attribute: false }) protected moon!: Moon;
  @state() protected config!: LunarPhaseBadgeConfig;
  @property({ attribute: false }) public _selectedDate?: Date;

  public connectedCallback(): void {
    super.connectedCallback();
    window.LunarBadge = this;
  }

  public static async getStubConfig(hass: HomeAssistant): Promise<LunarPhaseBadgeConfig> {
    const initConfig = computeStubConfig(hass);
    return {
      ...DEFAULT_CONFIG,
      ...initConfig,
    };
  }

  setConfig(config: LunarPhaseBadgeConfig): void {
    this.config = {
      ...DEFAULT_CONFIG,
      ...config,
    };
  }

  get _configLanguage(): string {
    return this.config?.language || this.hass.selectedLanguage || this.hass.config.language;
  }

  get _configLatLong(): LatLon {
    const config = this._configLocation;
    const source = config?.location_source || 'default';
    if (source === 'entity' && config.entity) {
      const stateObj = this.hass.states[config.entity];
      if (hasEntityLocation(stateObj)) {
        return getLatLonFromEntity(stateObj);
      }
    } else if (source === 'custom' && config.latitude && config.longitude) {
      return { latitude: config.latitude, longitude: config.longitude };
    }
    // default to hass config
    return {
      latitude: this.hass.config.latitude,
      longitude: this.hass.config.longitude,
    };
  }

  get _locale(): FrontendLocaleData {
    const haLocale = this.hass.locale;
    const time_format = this.config?.['12hr_format'] ? TimeFormat.am_pm : TimeFormat.twenty_four;
    const language = this._configLanguage;
    const newLocale: FrontendLocaleData = {
      ...haLocale,
      language,
      time_format,
    };
    return newLocale;
  }

  get _configLocale(): FrontendLocaleDataExtended {
    const _locale = this._locale;
    const location = this._configLatLong;
    const number_decimals = this.config?.number_decimals;
    return {
      ..._locale,
      location,
      number_decimals,
    };
  }

  get _configLocation(): LocationBadgeConfig {
    const picked = pick(this.config, [...LocationConfigKeys]);
    return {
      location_source: (picked as any)?.location_source ?? 'default',
      ...picked,
    } as LocationBadgeConfig;
  }

  get _actionConfig(): InteractionBadgeConfig {
    const picked = pick(this.config, ['entity', 'tap_action', 'hold_action', 'double_tap_action']);
    return {
      ...picked,
    } as InteractionBadgeConfig;
  }

  get _date(): Date {
    return this._selectedDate ? new Date(this._selectedDate) : new Date();
  }

  protected render(): TemplateResult {
    if (!this.config || !this.hass) {
      return html``;
    }
    this.createMoon();
    const showState = this.config.show_state;
    const showName = this.config.show_name;
    const showIcon = this.config.show_icon;

    const name = this._computeName();
    const stateDisplay = this._computeContent(this.config?.state_content);

    const label = showState && showName ? name : undefined;
    const content = showState ? stateDisplay : showName ? name : undefined;
    const isAction = hasInteraction(this._actionConfig);

    return html` <ha-badge
      .type=${isAction ? 'button' : 'badge'}
      .actionHandler=${actionHandler({
        hasHold: true,
        hasDoubleClick: true,
      })}
      @action=${this._handleAction}
      .label=${label}
    >
      ${showIcon ? this._renderMoonImage() : nothing} ${content}</ha-badge
    >`;
  }

  private _renderMoonImage(): TemplateResult {
    const icon_type = this.config?.icon_type || 'image';
    const imageData = this.moon.moonImage;
    const fractionLow = imageData.fraction! <= 20;
    if (icon_type === 'icon') {
      return html`
        <ha-icon
          slot="icon"
          class="moon-icon"
          ?southern=${imageData.southernHemisphere}
          icon="${imageData.phaseMdi}"
        ></ha-icon>
      `;
    }
    if (icon_type === 'emoji') {
      return html`
        <span slot="icon" class="moon-icon" ?southern=${imageData.southernHemisphere}>${imageData.emoji}</span>
      `;
    }
    return html`
      <img
        class=${classMap({
          'moon-image': true,
          'low-fraction': fractionLow,
          'moon-icon': true,
        })}
        ?low-fraction=${fractionLow}
        slot="icon"
        src="${imageData.moonPic}"
        ?southern=${imageData.southernHemisphere}
        aria-hidden
      />
    `;
  }

  private createMoon() {
    const initData = {
      date: this._date,
      config: {
        ...this.config,
        ...this._configLatLong,
      },
      locale: this._configLocale,
    };
    this.moon = new Moon(initData);
  }

  private _computeContent(stateContent: LunarPhaseBadgeConfig['state_content']): TemplateResult {
    const contents = ensureArray(stateContent || []);
    const moonData = { ...this.moon.moonData, phaseName: { label: 'Phase', value: this.moon.phaseName } };
    const values = contents.map((content) => moonData[content]?.value).filter(Boolean);
    if (!values.length) {
      return html`${this.moon.phaseName}`;
    }
    return html`${values.join(STRINGS_SEPARATOR_DOT)}`;
  }

  private _computeName(): string {
    if (this.config.custom_name && this.config.name) {
      return this.config.name;
    }
    const moonData = { ...this.moon.moonData, phaseName: { label: 'Lunar Phase', value: this.moon.phaseName } };
    return this.config.name ? moonData[this.config.name]?.label || this.moon.phaseName : this.moon.phaseName;
  }

  private _handleAction(ev: ActionHandlerEvent): void {
    ev.stopPropagation();

    const action = ev.detail.action;
    const config = this._actionConfig;

    if (action === 'tap') {
      if (hasAction(config?.tap_action)) {
        handleAction(this, this.hass, config, 'tap');
      }
      return;
    }
    if (action === 'hold' || action === 'double_tap') {
      if (hasAction(config[`${action}_action`])) {
        handleAction(this, this.hass, config, action);
      }
      return;
    }
  }

  private updateDate(action?: 'next' | 'prev') {
    if (!action && this._selectedDate) {
      this._selectedDate = undefined;
      this.requestUpdate();
      return;
    }
    const moonImage = this.moon.moonImage;
    const date = new Date(this._date);
    date.setHours(0, 0, 0, 0);
    if (action === 'next') {
      date.setDate(date.getDate() + 1);
    } else if (action === 'prev') {
      date.setDate(date.getDate() - 1);
    }
    this._selectedDate = date;
    this.requestUpdate();
    console.log(this.moon.phaseName);
    console.log({
      ...moonImage.phase,
      fraction: moonImage.fraction,
    });
  }

  static get styles(): CSSResultGroup {
    return css`
      img.moon-image[low-fraction] {
        filter: brightness(2);
      }
      .moon-icon {
        &[southern] {
          transform: scaleX(-1) scaleY(-1);
        }
        transition: none;
      }
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'lunar-phase-badge': LunarPhaseBadge;
  }
  interface Window {
    LunarBadge: LunarPhaseBadge;
  }
}

(window as any).customBadges = (window as any).customBadges || [];
(window as any).customBadges.push({
  type: 'lunar-phase-badge',
  name: 'Lunar Phase Badge',
  preview: true,
  description: 'A badge to display lunar phases and related information.',
  documentationURL: 'https://github.com/ngocjohn/lunar-phase-card',
});

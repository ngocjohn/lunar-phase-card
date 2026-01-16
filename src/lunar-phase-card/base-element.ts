import { css, CSSResultGroup, LitElement, PropertyValues } from 'lit';
import { property } from 'lit/decorators.js';

import { HomeAssistant } from '../ha';
import { style } from './css/card-styles';

export function computeDarkMode(hass?: HomeAssistant): boolean {
  if (!hass) return false;
  return (hass.themes as any).darkMode as boolean;
}

export class LunarBaseElement extends LitElement {
  @property({ attribute: false }) public hass!: HomeAssistant;

  protected updated(changedProps: PropertyValues): void {
    super.updated(changedProps);
    if (changedProps.has('hass') && this.hass) {
      const currentDarkMode = computeDarkMode(changedProps.get('hass') as HomeAssistant | undefined);
      const newDarkMode = computeDarkMode(this.hass);
      if (currentDarkMode !== newDarkMode) {
        this.toggleAttribute('dark-mode', newDarkMode);
      }
    }
  }

  static get styles(): CSSResultGroup {
    return [style, css``];
  }
}

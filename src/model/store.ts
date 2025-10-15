import { HomeAssistant } from '../ha';
import { BaseEditor } from '../lunar-phase-card/editor/base-editor';
import { LunarPhaseNewCard } from '../lunar-phase-card/new-lunar-phase-card';
import { LunarPhaseNewCardConfig } from '../types/lunar-phase-card-config';

export class Store {
  public hass: HomeAssistant;
  public config: LunarPhaseNewCardConfig;

  public readonly card: LunarPhaseNewCard | BaseEditor;

  constructor(hass: HomeAssistant, config: LunarPhaseNewCardConfig, card: LunarPhaseNewCard | BaseEditor) {
    this.hass = hass;
    this.config = config;
    this.card = card;
  }
}

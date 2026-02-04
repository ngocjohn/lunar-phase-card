import { HomeAssistant, LocalizeFunc } from '../ha';
import setupTranslation from '../localize/translate';
import { BaseEditor } from '../lunar-phase-card/editor/base-editor';
import { LunarPhaseCard } from '../lunar-phase-card/lunar-phase-card';
import { LunarPhaseCardConfig } from '../types/config/lunar-phase-card-config';

export class Store {
  public hass: HomeAssistant;
  public config: LunarPhaseCardConfig;
  public readonly card: LunarPhaseCard | BaseEditor;
  public translate: LocalizeFunc;

  constructor(hass: HomeAssistant, config: LunarPhaseCardConfig, card: LunarPhaseCard | BaseEditor) {
    this.hass = hass;
    this.config = config;
    this.card = card;
    this.translate = setupTranslation(this.config?.language || hass?.selectedLanguage || hass.locale.language);
  }
}

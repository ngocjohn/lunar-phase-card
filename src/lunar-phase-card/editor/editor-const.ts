export enum ELEMENT {
  FORM_BOOLEAN = 'ha-form-boolean',
  FORM_GRID = 'ha-form-grid',
  FORM_EXPANDABLE = 'ha-form-expandable',
  FORM_OPTIONAL_ACTIONS = 'ha-form-optional_actions',
  HA_EXPANSION_PANEL = 'ha-expansion-panel',
  CHIP_INPUT = 'ha-input-chip',
  HA_BUTTON_MENU = 'ha-button-menu',
  HA_PICTURE_UPLOAD = 'ha-picture-upload',
}

export enum SELECTOR {
  OPTIONAL_BUTTON_TRIGGER = 'ha-form-optional_actions$ha-button[slot="trigger"]',
  HA_CHIP_SET = 'ha-selector$ha-selector-select$ha-chip-set',
  SECTION_ORDER_CHIPS = 'ha-selector$ha-selector-select$ha-chip-set ha-input-chip',
}

export enum HA_EVENT {
  EXPANSION_WILL_CHANGE = 'expanded-will-change',
  EXPANSION_CHANGED = 'expanded-changed',
}

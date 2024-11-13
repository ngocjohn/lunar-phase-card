/* eslint-disable @typescript-eslint/no-explicit-any */
import { LovelaceConfig } from 'custom-card-helpers';

import { REPOSITORY } from '../const';
import { LunarPhaseCardConfig } from '../types';
export interface HuiRootElement extends HTMLElement {
  lovelace: {
    config: LovelaceConfig;
    current_view: number;
    [key: string]: any;
  };
  ___curView: number;
}
// Hack to load ha-components needed for editor
export const loadHaComponents = () => {
  if (!customElements.get('ha-form')) {
    (customElements.get('hui-button-card') as any)?.getConfigElement();
  }
  if (!customElements.get('ha-entity-picker')) {
    (customElements.get('hui-entities-card') as any)?.getConfigElement();
  }
  if (!customElements.get('ha-card-conditions-editor')) {
    (customElements.get('hui-conditional-card') as any)?.getConfigElement();
  }
  if (!customElements.get('ha-form-multi_select')) {
    // Load the component by invoking a related component's method
    (customElements.get('hui-entities-card') as any)?.getConfigElement();
  }
};

export const loadCustomElement = async <T = any>(name: string) => {
  const Component = customElements.get(name) as T;
  if (Component) {
    return Component;
  }
  await customElements.whenDefined(name);
  return customElements.get(name) as T;
};

export const stickyPreview = () => {
  // Change the default preview element to be sticky
  const root = document.querySelector('body > home-assistant')?.shadowRoot;
  const dialog = root?.querySelector('hui-dialog-edit-card')?.shadowRoot;
  const previewElement = dialog?.querySelector('ha-dialog > div.content > div.element-preview') as HTMLElement;
  if (previewElement && previewElement.style.position !== 'sticky') {
    previewElement.style.position = 'sticky';
    previewElement.style.top = '0';
  }
};

export async function fetchLatestReleaseTag() {
  const apiUrl = `https://api.github.com/repos/${REPOSITORY}/releases/latest`;

  try {
    const response = await fetch(apiUrl);
    if (response.ok) {
      const data = await response.json();
      const releaseTag = data.tag_name;
      console.log('Latest release tag:', releaseTag);
      return releaseTag;
    } else {
      console.error('Failed to fetch the latest release tag:', response.statusText);
    }
  } catch (error) {
    console.error('Error fetching the latest release tag:', error);
  }
}

export function isCardInEditMode(cardElement: HTMLElement) {
  let parent1Class: string | undefined = undefined;
  let parent2Class: string | undefined = undefined;

  if (cardElement) {
    const parentElement = cardElement.offsetParent;
    if (parentElement) {
      parent1Class = ((parentElement as HTMLElement).className || '').trim();

      const parentParentElement = parentElement.parentElement;
      if (parentParentElement) {
        parent2Class = ((parentParentElement as HTMLElement).className || '').trim();
      }
    }
  } else {
    console.log('Card element not found');
  }

  let inEditMode = false;
  if (parent1Class === 'element-preview') {
    inEditMode = true;
  } else if (parent2Class === 'gui-editor') {
    inEditMode = true;
  }
  console.log('Card in edit mode:', inEditMode);
  return inEditMode;
}

export const getLovelace = () => {
  const root = document.querySelector('home-assistant')?.shadowRoot?.querySelector('home-assistant-main')?.shadowRoot;

  const resolver =
    root?.querySelector('ha-drawer partial-panel-resolver') ||
    root?.querySelector('app-drawer-layout partial-panel-resolver');

  const huiRoot = (resolver?.shadowRoot || resolver)
    ?.querySelector<HuiRootElement>('ha-panel-lovelace')
    ?.shadowRoot?.querySelector<HuiRootElement>('hui-root');

  if (huiRoot) {
    const ll = huiRoot.lovelace;
    ll.current_view = huiRoot.___curView;
    return ll;
  }

  return null;
};

export const getDialogEditor = () => {
  const root = document.querySelector('home-assistant')?.shadowRoot;
  const editor = root?.querySelector('hui-dialog-edit-card');
  if (editor) {
    return editor;
  }
  return null;
};

export async function _saveConfig(cardId: string, config: LunarPhaseCardConfig): Promise<void> {
  const lovelace = getLovelace();
  if (!lovelace) {
    console.log('Lovelace not found');
    return;
  }
  const dialogEditor = getDialogEditor() as any;
  const currentView = lovelace.current_view;

  const cardConfig = lovelace.config.views[currentView].cards;

  let cardIndex =
    cardConfig?.findIndex((card) => card.cardId === cardId) === -1 ? dialogEditor?._params?.cardIndex : -1;
  console.log('Card index:', cardIndex);
  if (cardIndex === -1) {
    console.log('Card not found in the config');
    return;
  }

  let newCardConfig = [...(cardConfig || [])];
  newCardConfig[cardIndex] = config;
  const newView = { ...lovelace.config.views[currentView], cards: newCardConfig };
  const newViews = [...lovelace.config.views];
  newViews[currentView] = newView;
  lovelace.saveConfig({ views: newViews });
  console.log('Saving new config:', newViews[currentView].cards![cardIndex]);
}

export function isEditorMode(card: HTMLElement) {
  return card.offsetParent?.classList.contains('element-preview');
}

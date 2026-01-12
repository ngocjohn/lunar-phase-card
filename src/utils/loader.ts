import { LovelaceConfig } from 'custom-card-helpers';
import { css } from 'lit';

import { LunarPhaseCardConfig } from '../types/config/lunar-phase-card-config';
import { selectTree } from './helpers-dom';

interface HuiRootElement extends HTMLElement {
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
  if (!customElements.get('hui-entity-editor')) {
    // Load the component by invoking a related component's method
    (customElements.get('hui-glance-card') as any)?.getConfigElement();
  }
};

let mql = window.matchMedia('(min-width: 1000px) and (max-width: 1440px)');

export const refactorEditDialog = async () => {
  const editorDialog = await selectTree(document.body, 'home-assistant$hui-dialog-edit-card');

  if (!editorDialog) return;
  // console.debug('Found editor dialog', editorDialog);
  // Add custom styles

  const newStyle = css`
    ha-dialog {
      --dialog-content-padding: 8px 4px !important;
    }
    @media (min-width: 1000px) {
      .content hui-section,
      .content hui-card {
        margin: 0 auto !important;
        padding: inherit !important;
      }
      .element-preview {
        flex: 0 0 50% !important;
        margin: 3em auto 1em !important;
      }
    }
  `;
  const styleEl = document.createElement('style');
  styleEl.textContent = newStyle.cssText;
  if (!editorDialog.shadowRoot?.querySelector('style[refactored]')) {
    styleEl.setAttribute('refactored', 'true');
    editorDialog.shadowRoot?.appendChild(styleEl);
  }
  if (mql.matches) {
    editorDialog.large = true;
  }
  // console.debug('Appended new styles to editor dialog', styleEl);
};

export const stickyPreview = () => {
  // Get the root and required elements
  const root = document.querySelector('body > home-assistant')?.shadowRoot;
  const dialog = root?.querySelector('hui-dialog-edit-card')?.shadowRoot;
  const content = dialog?.querySelector('ha-dialog')?.shadowRoot?.getElementById('content');
  const previewElement = dialog?.querySelector('div.element-preview') as HTMLElement;
  const editorElement = dialog?.querySelector('div.element-editor') as HTMLElement;

  // Exit early if any required element is missing
  if (!content || !editorElement || !previewElement) return;

  // Apply styles
  Object.assign(content.style, { padding: '8px' });
  Object.assign(editorElement.style, { margin: '0 4px' });
  Object.assign(previewElement.style, {
    position: 'sticky',
    top: '0',
    padding: '0',
  });
};

const getLovelace = () => {
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

const getDialogEditor = () => {
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

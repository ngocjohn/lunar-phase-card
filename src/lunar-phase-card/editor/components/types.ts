import * as EDITOR_COMPONENTS from './index';

declare global {
  interface Window {
    LunarAppearanceArea: EDITOR_COMPONENTS.AppearanceArea;
    LunarLocationArea: EDITOR_COMPONENTS.LocationArea;
    LunarLayoutArea: EDITOR_COMPONENTS.LayoutArea;
  }
}

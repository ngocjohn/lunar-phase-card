import { LocalizeFunc } from '../../ha';

export enum EditorArea {
  DEFAULT = 'default',
  LOCATION = 'location',
  APPEARANCE = 'appearance',
  LAYOUT = 'layout',
}

export const EditorAreaKeys: EditorArea[] = [
  EditorArea.DEFAULT,
  EditorArea.LOCATION,
  EditorArea.APPEARANCE,
  EditorArea.LAYOUT,
] as const;

export type EditorAreaKey = (typeof EditorAreaKeys)[number];

export interface EditorMenuItem {
  title: string;
  description?: string;
  icon?: string;
}

export type EditorMenuItems = Record<EditorAreaKey, EditorMenuItem>;

export const ICON: Record<EditorAreaKey, string> = {
  [EditorArea.LOCATION]: 'mdi:longitude',
  [EditorArea.APPEARANCE]: 'mdi:palette',
  [EditorArea.LAYOUT]: 'mdi:view-grid',
  [EditorArea.DEFAULT]: 'mdi:cog-outline',
};

const TRANSLATION_KEY: Record<string, string> = {
  [EditorArea.LOCATION]: 'baseConfig',
  [EditorArea.APPEARANCE]: 'viewConfig',
  [EditorArea.LAYOUT]: 'layoutConfig',
};

const createMenuItem = (localize: LocalizeFunc, key: EditorAreaKey): EditorMenuItem => {
  if (key === EditorArea.DEFAULT) {
    return {
      title: 'Config Overview',
      description: 'Select the type of configuration you want to edit.',
      icon: ICON[key],
    };
  }

  return {
    title: localize(`editor.${TRANSLATION_KEY[key]}.title`),
    description: localize(`editor.${TRANSLATION_KEY[key]}.description`),
    icon: ICON[key],
  };
};

export const createEditorMenuItems = (localize: LocalizeFunc): EditorMenuItems => {
  const items: Partial<EditorMenuItems> = {};
  EditorAreaKeys.forEach((key) => {
    items[key] = createMenuItem(localize, key);
  });
  return items as EditorMenuItems;
};

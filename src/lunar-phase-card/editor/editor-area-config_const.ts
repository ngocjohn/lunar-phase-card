import { EditorMenuItems } from './editor-area-config';

export const AreaMenu: EditorMenuItems = {
  default: {
    title: 'Config Overview',
    description: 'Select the type of configuration you want to edit.',
    icon: 'mdi:cog-outline',
  },
  location: {
    title: 'Latitude and Longitude',
    description: 'Set a configuration for latitude and longitude',
    icon: 'mdi:longitude',
  },
  appearance: {
    title: 'Language and view mode',
    description: 'Set a configuration for language and background',
    icon: 'mdi:palette',
  },
  layout: {
    title: 'Layout customization',
    description: 'Modify the layout of the card',
    icon: 'mdi:view-grid',
  },
};

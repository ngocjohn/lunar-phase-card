export const FontSizes = ['auto', 'small', 'medium', 'large', 'x-large', 'xx-large'] as const;
export type FontSize = (typeof FontSizes)[number];

export const FontTextTransforms = ['none', 'capitalize', 'uppercase', 'lowercase'] as const;
export type FontTextTransform = (typeof FontTextTransforms)[number];

export interface FontConfig {
  header_font_size?: FontSize;
  header_font_style?: FontTextTransform;
  header_font_color?: string;
  label_font_size?: FontSize;
  label_font_style?: FontTextTransform;
  label_font_color?: string;
  hide_label?: boolean;
}

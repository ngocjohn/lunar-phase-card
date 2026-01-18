export const FontSizes = ['small', 'medium', 'large', 'x-large', 'xx-large'] as const;
export type FontSizeOptions = (typeof FontSizes)[number];

export const FontTextTransforms = ['none', 'capitalize', 'uppercase', 'lowercase'] as const;
export type FontTextTransformOptions = (typeof FontTextTransforms)[number];

export interface HeaderFontConfig {
  header_font_size?: FontSizeOptions | string;
  header_font_style?: FontTextTransformOptions;
  header_font_color?: string;
}

export interface LabelFontConfig {
  label_font_size?: FontSizeOptions | string;
  label_font_style?: FontTextTransformOptions;
  label_font_color?: string;
}
export interface FontCustomStyles extends HeaderFontConfig, LabelFontConfig {
  /**
   * @deprecated use `hide_compact_label` in main config instead
   */
  hide_label?: boolean;
}

export const HeaderFontConfigKeys = ['header_font_size', 'header_font_style', 'header_font_color'] as const;
export const LabelFontConfigKeys = ['label_font_size', 'label_font_style', 'label_font_color'] as const;
export const FontConfigKeys = [...HeaderFontConfigKeys, ...LabelFontConfigKeys] as const;
export type FontConfigKey = (typeof FontConfigKeys)[number];
export type CardHeaderFontConfig = Pick<FontCustomStyles, (typeof HeaderFontConfigKeys)[number]>;
export type CardLabelFontConfig = Pick<FontCustomStyles, (typeof LabelFontConfigKeys)[number]>;

export const CSS_FONT_SIZE: Record<FontSizeOptions | string, string> = {
  small: 'var(--ha-font-size-s, 12px)',
  medium: 'var(--ha-font-size-m, 14px)',
  large: 'var(--ha-font-size-l, 16px)',
  'x-large': 'var(--ha-font-size-xl, 20px)',
  'xx-large': 'var(--ha-font-size-2xl, 24px)',
};

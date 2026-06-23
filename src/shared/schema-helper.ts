import { HaFormBaseSchemaExtended, BooleanItem } from '../lunar-phase-card/editor/forms/types';
import { formatLabelUppercase } from '../utils/string-helper';
export const computeSelectorSchema = <T extends HaFormBaseSchemaExtended>(selector: T) => {
  return [
    {
      name: selector.name,
      label: selector.label,
      default: selector.default,
      required: false,
      selector: {
        select: {
          mode: selector.mode || 'dropdown',
          multiple: selector.multiple || false,
          custom_value: selector.custom_value || false,
          options: selector.options!.map((option: any) => ({
            value: option.value || option,
            label: formatLabelUppercase(option?.label || option),
          })),
          reorder: selector.reorder || false,
        },
      },
    },
  ] as const;
};

export const computeBooleanItem = (property: string): BooleanItem<string> => ({
  name: property,
  required: false,
  default: false,
  type: 'boolean',
});

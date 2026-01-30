import { formatLabelUppercase } from '../../../utils/string-helper';
import { HaFormBaseSchemaExtended, BooleanItem } from './types';
export const computeSelectorSchema = <T extends HaFormBaseSchemaExtended>(selector: T) => {
  return [
    {
      name: selector.name,
      default: selector.default,
      required: false,
      selector: {
        select: {
          mode: selector.mode || 'dropdown',
          custom_value: selector.custom_value || false,
          options: selector.options!.map((option: any) => ({
            value: option,
            label: formatLabelUppercase(option),
          })),
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

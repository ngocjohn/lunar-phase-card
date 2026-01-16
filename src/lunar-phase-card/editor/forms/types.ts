import { SelectOption } from '../../../ha/data/ha-selector';
import { HaFormBaseSchema } from '../../../ha/panels/ha-form/types';

export interface HaFormBaseSchemaExtended extends HaFormBaseSchema {
  mode?: 'list' | 'dropdown' | 'box';
  options?: readonly string[] | readonly SelectOption[];
}
export type HaFormSchemaItem = Record<string, HaFormBaseSchemaExtended>;

export interface BooleanItem<T extends string> extends HaFormBaseSchemaExtended {
  name: T;
  label?: string;
  helper?: string;
  default?: boolean;
  type: 'boolean';
}

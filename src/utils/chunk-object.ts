export const chunkObjectToArrays = <T>(obj: Record<string, T>, size: number): T[][] => {
  const values = Object.values(obj);
  const chunkedArrays: T[][] = [];

  for (let i = 0; i < values.length; i += size) {
    chunkedArrays.push(values.slice(i, i + size));
  }
  return chunkedArrays;
};

export const objectToChunks = <T>(obj: Record<string, T>, size: number): Record<string, T>[] => {
  const values = Object.values(obj);
  const final: Record<string, T>[] = [];
  let counter = 0;
  let portion: Record<string, T> = {};

  for (const key in obj) {
    if (counter !== 0 && counter % size === 0) {
      final.push(portion);
      portion = {};
    }
    portion[key] = values[counter];
    counter++;
  }
  final.push(portion);

  return final;
};

type NonNullUndefined<T> = T extends undefined ? never : T extends null ? never : T;

/**
 * Ensure that the input is an array or wrap it in an array
 * @param value - The value to ensure is an array
 */
export function ensureArray(value: undefined): undefined;
export function ensureArray(value: null): null;
export function ensureArray<T>(value: T | T[] | readonly T[]): NonNullUndefined<T>[];
export function ensureArray(value) {
  if (value === undefined || value === null || Array.isArray(value)) {
    return value;
  }
  return [value];
}

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

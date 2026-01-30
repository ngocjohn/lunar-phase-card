export function getObjectDifferences(obj1: Record<string, any>, obj2: Record<string, any>) {
  if (typeof obj1 !== 'object' || typeof obj2 !== 'object') {
    return obj1 !== obj2 ? [obj1, obj2] : undefined;
  }

  const keys1 = Object.keys(obj1);
  const keys2 = Object.keys(obj2);
  const uniqueKeys = new Set([...keys1, ...keys2]);

  const differences: any = {};

  for (const key of uniqueKeys) {
    const value1 = obj1[key];
    const value2 = obj2[key];

    if (typeof value1 === 'object' && typeof value2 === 'object') {
      const nestedDifferences = getObjectDifferences(value1, value2);
      if (nestedDifferences) {
        differences[key] = nestedDifferences;
      }
    } else if (value1 !== value2) {
      differences[key] = [value1, value2];
    }
  }

  return Object.keys(differences).length > 0 ? differences : undefined;
}

export function hasObjectDifferences(obj1: Record<string, any>, obj2: Record<string, any>): boolean {
  return Boolean(getObjectDifferences(obj1, obj2));
}

export function logChangedValues(changedValues: Record<string, any>, table: boolean = false): void {
  const entries: [string, any][] = [];
  Object.entries(changedValues).forEach(([k, v]) => {
    if (!Array.isArray(v)) {
      Object.entries(v as Record<string, unknown>).forEach(([subK, subV]) => {
        const [oldValue, newValue] = subV as [any, any];
        entries.push([`${k}.${subK}`, { oldValue, newValue }]);
      });
      return;
    }
    const [oldValue, newValue] = v;
    entries.push([k, { oldValue, newValue }]);
  });
  if (table) {
    console.table(
      entries.map(([key, { oldValue, newValue }]) => ({
        Property: key,
        'Old Value': oldValue,
        'New Value': newValue,
      }))
    );
  } else {
    entries.forEach(([key, { oldValue, newValue }]) => {
      console.log(`%c${key}`, 'color: #2196F3; font-weight: bold;', oldValue, '→', newValue);
    });
  }
}

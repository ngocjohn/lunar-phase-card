export const capitalizeFirstLetter = (str: string) => str.charAt(0).toUpperCase() + str.slice(1);
export const formatLabelUppercase = (str: string) => str.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase());

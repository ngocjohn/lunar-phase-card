export const capitalizeFirstLetter = (str: string) => str.charAt(0).toUpperCase() + str.slice(1);
export const formatLabelUppercase = (str: string) => capitalizeFirstLetter(str.replace(/_/g, ' '));

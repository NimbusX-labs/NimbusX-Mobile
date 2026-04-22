export const truncate = (str: string, length: number) => {
  if (str.length <= length) return str;
  return str.substring(0, length) + '...';
};

export const getInitials = (name: string) => {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();
};

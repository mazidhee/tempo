export const validCover = (value: unknown): value is string | null =>
  value === null ||
  (typeof value === 'string' &&
    value.length <= 700000 &&
    /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/]+={0,2}$/.test(value));

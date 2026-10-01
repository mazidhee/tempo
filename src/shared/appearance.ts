/** Solid accents, with a contrasting action label and a functional heatmap ramp. */
export const accents = [
  { id: 'lavender', name: 'Lavender', color: '#5e6ad2', hover: '#828fff' },
  { id: 'cedar', name: 'Cedar', color: '#39745d', hover: '#70ad90' },
  { id: 'terracotta', name: 'Terracotta', color: '#a64d35', hover: '#d68e72' },
  { id: 'mulberry', name: 'Mulberry', color: '#955176', hover: '#ca91b0' },
  { id: 'ochre', name: 'Ochre', color: '#886422', hover: '#c8a45a' },
  { id: 'petrol', name: 'Petrol', color: '#326f7b', hover: '#74adb7' },
] as const;
export type AccentId = (typeof accents)[number]['id'];
export const validAccent = (value: unknown): value is AccentId =>
  accents.some((a) => a.id === value);
export const validAvatar = (value: unknown): value is string | null =>
  value === null ||
  (typeof value === 'string' &&
    value.length <= 500000 &&
    /^data:image\/(?:jpeg|png|webp);base64,[a-zA-Z0-9+/]+=*$/.test(value));
function blend(a: string, b: string, proportion: number) {
  const channels = [1, 3, 5].map((i) =>
    Math.round(
      parseInt(a.slice(i, i + 2), 16) * (1 - proportion) +
        parseInt(b.slice(i, i + 2), 16) * proportion,
    ),
  );
  return '#' + channels.map((c) => c.toString(16).padStart(2, '0')).join('');
}
export function accentTokens(id: AccentId = 'lavender', light = false) {
  const accent = accents.find((a) => a.id === id) ?? accents[0];
  const surface = light ? '#eceeef' : '#141516';
  return {
    '--primary': accent.color,
    '--primary-hover': accent.hover,
    '--primary-focus': accent.color,
    '--on-primary': '#ffffff',
    '--on-primary-hover': '#010102',
    '--heat-1': blend(surface, accent.color, light ? 0.2 : 0.25),
    '--heat-2': blend(surface, accent.color, 0.5),
    '--heat-3': blend(surface, accent.color, 0.8),
  };
}

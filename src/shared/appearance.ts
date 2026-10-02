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
export function accentTokens(id: AccentId = 'lavender', light = false, baseSurface?: string) {
  const accent = accents.find((a) => a.id === id) ?? accents[0];
  const surface = baseSurface ?? (light ? '#eceeef' : '#141516');
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
/** Solid surface palettes. Mode and accent remain independent preferences. */
export const themePalettes = [
  {
    id: 'default',
    name: 'Tempo',
    description: 'Original crisp neutrals',
    dark: ['#010102', '#0f1011', '#141516', '#18191a', '#23252a', '#34343a'],
    light: ['#ffffff', '#f5f6f6', '#f6f7f7', '#eceeef', '#dce0e4', '#b8bdc4'],
  },
  {
    id: 'graphite',
    name: 'Graphite',
    description: 'Soft charcoal, warm neutrals',
    dark: ['#171614', '#201f1c', '#272622', '#302f2a', '#3e3c36', '#56534b'],
    light: ['#faf8f4', '#f2efe8', '#ebe7de', '#e5dfd4', '#d6cebf', '#b3a897'],
  },
  {
    id: 'slate',
    name: 'Slate',
    description: 'Cool mineral surfaces',
    dark: ['#111820', '#19222c', '#202c38', '#293644', '#354557', '#4a5d70'],
    light: ['#f7f9fc', '#edf2f7', '#e5ecf3', '#dce5ee', '#ccd7e3', '#a6b5c5'],
  },
  {
    id: 'dusk',
    name: 'Dusk',
    description: 'Quiet plum and smoke',
    dark: ['#1b151e', '#251e29', '#302735', '#3a303f', '#493c50', '#61516b'],
    light: ['#fbf8fc', '#f3edf5', '#ece4ef', '#e5dce9', '#d8cadd', '#bba9c3'],
  },
  {
    id: 'forest',
    name: 'Forest',
    description: 'Deep evergreen surfaces',
    dark: ['#101b17', '#18251f', '#213029', '#2a3b32', '#364c40', '#4c6757'],
    light: ['#f7faf6', '#edf3ea', '#e4edde', '#dce7d5', '#ccd9c4', '#a6baa0'],
  },
] as const;
export type ThemePalette = (typeof themePalettes)[number]['id'];
export const validThemePalette = (value: unknown): value is ThemePalette =>
  themePalettes.some((p) => p.id === value);
export function themeTokens(id: ThemePalette = 'default', light = false) {
  const palette = themePalettes.find((p) => p.id === id) ?? themePalettes[0];
  const [canvas, surface1, surface2, surface3, hairline, strong] = light
    ? palette.light
    : palette.dark;
  return {
    '--canvas': canvas,
    '--surface-1': surface1,
    '--surface-2': surface2,
    '--surface-3': surface3,
    '--surface-4': id === 'default' ? (light ? '#e4e6e8' : '#191a1b') : surface3,
    '--hairline': hairline,
    '--hairline-strong': strong,
    '--hairline-tertiary': id === 'default' ? (light ? '#8a8f98' : '#3e3e44') : strong,
    '--ink': light ? (id === 'default' ? '#141516' : '#181b1a') : '#f7f8f8',
    '--ink-muted':
      id === 'default' ? (light ? '#34343a' : '#d0d6e0') : light ? '#353b39' : '#d5ddd9',
    '--ink-subtle':
      id === 'default' ? (light ? '#62666d' : '#8a8f98') : light ? '#535d58' : '#aab8b0',
    '--ink-tertiary': id === 'default' ? '#62666d' : light ? '#535d58' : '#aab8b0',
    '--heat-0': id === 'default' && light ? '#eceeef' : surface2,
  };
}

// mobile/src/theme/theme.ts

export const lightTheme = {
  background: '#FAFAFA', // Off-white to reduce eye strain
  surface: '#FFFFFF',    // Pure white for cards
  primary: '#000000',    // Matte Black for primary actions
  text: '#171717',       // Near-black for readable text
  subtext: '#737373',    // Muted grey
  border: '#E5E5E5',     // Subtle dividers
  danger: '#DC2626',     // Sharp red for errors/deletes
};

export const darkTheme = {
  background: '#0A0A0A', // Deep matte black
  surface: '#171717',    // Slightly elevated black for cards
  primary: '#FFFFFF',    // Pure white for high-contrast actions
  text: '#F5F5F5',       // Crisp white for reading
  subtext: '#A3A3A3',    // Metallic grey
  border: '#262626',     // Barely-there borders
  danger: '#EF4444',     // Bright red
};

export type ThemeColors = typeof lightTheme;
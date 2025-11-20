// Spacing tokens from UX_UI_설계서_v2.0

export const spacing = {
  // Base spacing (4px grid)
  0: 0,
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  8: 32,
  10: 40,
  12: 48,
  16: 64,
  20: 80,
  24: 96,
};

// Semantic spacing
export const layout = {
  // Screen padding
  screenPaddingHorizontal: spacing[4], // 16
  screenPaddingVertical: spacing[4], // 16

  // Section spacing
  sectionGap: spacing[6], // 24

  // Component spacing
  componentGap: spacing[3], // 12
  inputGap: spacing[4], // 16

  // Card
  cardPadding: spacing[4], // 16
  cardGap: spacing[3], // 12

  // Button
  buttonPaddingVertical: spacing[3], // 12
  buttonPaddingHorizontal: spacing[4], // 16
  buttonPaddingVerticalLarge: spacing[4], // 16
  buttonPaddingHorizontalLarge: spacing[6], // 24

  // Input
  inputPaddingVertical: spacing[3], // 12
  inputPaddingHorizontal: spacing[4], // 16

  // List
  listItemPadding: spacing[4], // 16
  listItemGap: spacing[2], // 8
};

// Border radius
export const borderRadius = {
  none: 0,
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999,
};

// Shadows
export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 5,
  },
};

// Z-index
export const zIndex = {
  base: 0,
  dropdown: 1000,
  sticky: 1100,
  fixed: 1200,
  modal: 1300,
  popover: 1400,
  tooltip: 1500,
  toast: 1600,
};

export default spacing;

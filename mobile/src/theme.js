// WingIt brand tokens — deep plum/black background with a fuchsia-to-violet
// accent story, matching the app icon and splash screen.
// Key names (cream/coral/etc.) are historical from earlier palette
// iterations — values below define the current fuchsia/violet look.

export const colors = {
  cream: '#120E17',      // app background (deep near-black plum)
  ink: '#F5EEF7',        // primary text (soft warm white)
  inkSoft: '#9C8CA6',    // secondary text (muted mauve-gray)
  coral: '#FF2D95',      // primary accent — fuchsia
  coralDark: '#D6009C',  // pressed/hover state for fuchsia
  pink: '#B026D6',       // secondary accent — magenta-violet (gradient midpoint)
  purple: '#7B2BE2',     // tertiary accent — violet (gradient end)
  card: '#1D1620',       // cards/inputs on top of the dark bg
  border: '#332839',     // hairline borders
  danger: '#FF5C7A',
  black: '#000000',
};

export const spacing = {
  xs: 6,
  sm: 12,
  md: 16,
  lg: 24,
  xl: 32,
};

export const radius = {
  sm: 10,
  md: 16,
  lg: 24,
  pill: 999,
};

export const type = {
  title: { fontSize: 28, fontWeight: '700', color: colors.ink },
  header: { fontSize: 22, fontWeight: '700', color: colors.ink },
  subheader: { fontSize: 15, fontWeight: '600', color: colors.inkSoft },
  body: { fontSize: 15, fontWeight: '400', color: colors.ink },
  caption: { fontSize: 13, fontWeight: '400', color: colors.inkSoft },
};

export const shared = {
  primaryButton: {
    backgroundColor: colors.coral,
    paddingVertical: 15,
    borderRadius: radius.pill,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
  },
  input: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.ink,
    padding: 14,
    borderRadius: radius.md,
    marginBottom: 12,
    fontSize: 15,
  },
};

// Friendship stage badges — used in Friends list and milestone alerts.
export const stageEmoji = {
  caterpillar: '🐛',
  butterfly: '🦋',
  social_butterfly: '🦋✨',
};

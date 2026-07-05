export const colors = {
  primary: '#125377',
  primaryDark: '#0c3c58',
  secondary: '#7077A0',
  slate: '#54707F',
  mist: '#8D99AE',
  sand: '#908170',

  background: '#F4F6F8',
  surface: '#FFFFFF',
  border: '#E1E5EA',

  text: '#1B2430',
  textMuted: '#54707F',
  textInverse: '#FFFFFF',

  success: '#2E8B57',
  warning: '#C98A2C',
  danger: '#B3432B',
  info: '#125377',
};

export const estadoColors = {
  abierta: colors.info,
  por_cobrar: colors.warning,
  pagada: colors.success,
  cancelada: colors.danger,

  pendiente: colors.mist,
  en_preparacion: colors.warning,
  listo: colors.success,
  entregado: colors.slate,
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

export const radius = {
  sm: 8,
  md: 14,
  lg: 22,
  pill: 999,
};

export const typography = {
  h1: { fontSize: 26, fontWeight: '700', color: colors.text },
  h2: { fontSize: 20, fontWeight: '700', color: colors.text },
  h3: { fontSize: 17, fontWeight: '600', color: colors.text },
  body: { fontSize: 15, color: colors.text },
  caption: { fontSize: 13, color: colors.textMuted },
};

export const shadow = {
  shadowColor: '#0c1e2b',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.08,
  shadowRadius: 10,
  elevation: 3,
};

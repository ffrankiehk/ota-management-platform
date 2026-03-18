// Platform constants
export const PLATFORMS = {
  IOS: 'ios',
  ANDROID: 'android',
  BOTH: 'both'
} as const;

export const PLATFORM_LABELS = {
  [PLATFORMS.IOS]: 'iOS',
  [PLATFORMS.ANDROID]: 'Android',
  [PLATFORMS.BOTH]: 'Both'
} as const;

const parseBooleanFlag = (value: string | undefined, defaultValue: boolean) => {
  if (value === undefined) {
    return defaultValue;
  }

  return value.toLowerCase() === "true";
};

export const isGoogleAuthEnabled = parseBooleanFlag(
  import.meta.env.VITE_GOOGLE_AUTH_ENABLED,
  true
);

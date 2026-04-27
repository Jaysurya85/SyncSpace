import { useEffect, useMemo, useState, type ReactNode } from "react";
import { ThemeContext, type ThemeMode } from "./themeContext";

const THEME_STORAGE_KEY = "syncspace-theme";

const readStoredTheme = (): ThemeMode => {
  const storedTheme = localStorage.getItem(THEME_STORAGE_KEY);

  return storedTheme === "light" || storedTheme === "dark"
    ? storedTheme
    : "dark";
};

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [theme, setTheme] = useState<ThemeMode>(readStoredTheme);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  const value = useMemo(
    () => ({
      theme,
      toggleTheme: () =>
        setTheme((currentTheme) =>
          currentTheme === "dark" ? "light" : "dark"
        ),
    }),
    [theme]
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
};

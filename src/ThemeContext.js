import { createContext, useContext, useState, useEffect } from "react";
import { darkTheme, lightTheme, getStyles } from "./theme";

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [themeMode, setThemeMode] = useState(() => {
    return localStorage.getItem("themeMode") || "system";
  });

  const getIsDark = (mode) => {
    if (mode === "dark") return true;
    if (mode === "light") return false;
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  };

  const [isDark, setIsDark] = useState(() => getIsDark(localStorage.getItem("themeMode") || "system"));

  useEffect(() => {
    localStorage.setItem("themeMode", themeMode);
    setIsDark(getIsDark(themeMode));

    if (themeMode === "system") {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      const handler = (e) => setIsDark(e.matches);
      mediaQuery.addEventListener("change", handler);
      return () => mediaQuery.removeEventListener("change", handler);
    }
  }, [themeMode]);

  const theme = isDark ? darkTheme : lightTheme;
  const styles = getStyles(theme);

  return (
    <ThemeContext.Provider value={{ isDark, themeMode, setThemeMode, theme, styles }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
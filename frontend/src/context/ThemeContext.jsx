import { createContext, useContext, useEffect, useState } from "react";

const ThemeContext = createContext(null);

// Default to light — BuildOra's "Bold Red on Light" identity. Dark is opt-in.
const getInitial = () => {
  try {
    return localStorage.getItem("buildora_theme") === "dark";
  } catch {
    return false;
  }
};

export const ThemeProvider = ({ children }) => {
  const [dark, setDark] = useState(getInitial);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    document.body.classList.add("app-shell");
    try {
      localStorage.setItem("buildora_theme", dark ? "dark" : "light");
    } catch {
      /* ignore storage failures */
    }
  }, [dark]);

  const value = { dark, setDark, toggle: () => setDark((v) => !v) };
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => useContext(ThemeContext);

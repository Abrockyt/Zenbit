import { createContext, useContext, useEffect, useMemo, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { setTheme, getThemeMode } from "../theme";

const KEY = "zenbit-pro:theme";
const ThemeContext = createContext({ mode: "dark", toggle: () => {}, setMode: () => {} });

/**
 * Owns the app's light/dark choice.
 *
 * The palette itself lives in theme.js as a mutated singleton, which is what
 * lets ~50 files keep their plain `import { colors }`. This provider's only
 * job is the React half: persist the choice, and force a re-render of the
 * whole tree when it changes so every component re-reads the new values.
 *
 * It sits ABOVE the navigator so a switch repaints screens that are mounted
 * but off-screen too — otherwise going back to a previously-visited tab
 * would show it still in the old theme.
 */
export function ThemeProvider({ children }) {
  const [mode, setModeState] = useState(getThemeMode());

  useEffect(() => {
    AsyncStorage.getItem(KEY)
      .then((saved) => {
        if (saved === "light" || saved === "dark") {
          setTheme(saved);
          setModeState(saved);
        }
      })
      .catch(() => {
        /* unreadable storage — stay on the default dark theme */
      });
  }, []);

  const value = useMemo(
    () => ({
      mode,
      isLight: mode === "light",
      setMode: (next) => {
        setTheme(next);
        setModeState(next);
        AsyncStorage.setItem(KEY, next).catch(() => {});
      },
      toggle: () => {
        const next = mode === "light" ? "dark" : "light";
        setTheme(next);
        setModeState(next);
        AsyncStorage.setItem(KEY, next).catch(() => {});
      },
    }),
    [mode]
  );

  // Deliberately NOT keyed here. Remounting at this level tears down the
  // NavigationContainer too, which threw the user all the way back to the
  // Welcome screen on every theme switch. The repaint is forced further
  // down instead — `Screen` consumes this context and keys its own children
  // (see ui/kit.jsx), so each screen's subtree re-reads the palette while
  // the navigator and the whole back stack stay intact.
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  return useContext(ThemeContext);
}

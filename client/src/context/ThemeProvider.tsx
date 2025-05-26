"use client"; // Add "use client" directive for Next.js App Router

import React, {
  createContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
  useContext,
} from "react"; // Add useContext

type Theme = "light" | "dark";

// Helper function to get initial theme (runs client-side only)
const getInitialClientTheme = (): Theme => {
  // Return default during SSR/build
  if (typeof window === "undefined") {
    return "light";
  }
  try {
    const persistedColorPreference = window.localStorage.getItem("theme");
    const hasPersistedPreference = typeof persistedColorPreference === "string";

    // Check localStorage first
    if (hasPersistedPreference) {
      return persistedColorPreference === "dark" ? "dark" : "light";
    }

    // Then check system preference
    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    const hasMediaQueryPreference = typeof mql.matches === "boolean";

    if (hasMediaQueryPreference) {
      return mql.matches ? "dark" : "light";
    }
  } catch (e) {
    console.error("Error getting initial theme:", e);
  }
  // Default fallback
  return "light";
};

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

// Export ThemeContext directly
export const ThemeContext = createContext<ThemeContextType>({
  theme: "light", // Default for context, overridden by provider
  toggleTheme: () => {},
});

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  // Initialize state SYNCHRONOUSLY with the correct client-side theme
  const [theme, setTheme] = useState<Theme>(getInitialClientTheme);

  // Apply theme class on initial mount and whenever theme state changes
  useEffect(() => {
    document.documentElement.classList.remove("light", "dark"); // Remove existing classes first
    document.documentElement.classList.add(theme); // Add the current theme class
  }, [theme]);

  // Memoize toggleTheme to prevent unnecessary context updates
  const toggleTheme = useCallback(() => {
    setTheme((prevTheme) => {
      const newTheme = prevTheme === "light" ? "dark" : "light";
      try {
        localStorage.setItem("theme", newTheme);
        // Effect hook will handle class update
      } catch (e) {
        console.error("Error setting theme in localStorage:", e);
      }
      return newTheme;
    });
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

// Export a hook for easy consumption
export const useTheme = () => useContext(ThemeContext);

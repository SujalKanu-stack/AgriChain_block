import React from "react";
import { MoonStar, SunMedium } from "lucide-react";

import { useTheme } from "./ThemeProvider";

export default function ThemeToggle({ compact = false }) {
  const { isDark, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      className={`theme-toggle${compact ? " compact" : ""}`}
      onClick={toggleTheme}
      aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
      title={isDark ? "Switch to light theme" : "Switch to dark theme"}
    >
      <span className="theme-toggle-icon">
        {isDark ? <SunMedium size={16} /> : <MoonStar size={16} />}
      </span>
      {!compact && <span>{isDark ? "Light mode" : "Dark mode"}</span>}
    </button>
  );
}

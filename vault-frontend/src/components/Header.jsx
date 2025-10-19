import React from "react";
import { useTheme } from "../context/ThemeContext";

export default function Header({ visible = true }) {
  const theme = useTheme() || { dark: false, toggle: undefined, setDark: undefined };
  const dark = !!theme.dark;

  if (!visible) return null;

  const onToggle = () => {
    if (typeof theme.toggle === "function") return theme.toggle();
    if (typeof theme.setDark === "function") return theme.setDark(!dark);
  };

  return (
    <div
      style={{ position: "fixed", top: 16, right: 16, left: "auto", zIndex: 9999 }}
      aria-hidden={false}
    >
      <button
        onClick={onToggle}
        title="Toggle Dark / Light Mode"
        className="p-2 rounded-full transition-all shadow-sm hover:shadow-md hover:scale-105
                   bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm"
        style={{ fontSize: 18 }}
      >
        {dark ? "☀️" : "🌙"}
      </button>
    </div>
  );
}

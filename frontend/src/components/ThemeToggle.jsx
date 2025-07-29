import { useTheme } from "../hooks/useTheme";

function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  const handleToggle = (newTheme) => {
    console.log("Toggling theme from", theme, "to", newTheme);
    console.log(
      "Document classes before:",
      document.documentElement.classList.toString()
    );

    toggleTheme(newTheme);

    // Check after a brief delay
    setTimeout(() => {
      console.log(
        "Document classes after:",
        document.documentElement.classList.toString()
      );
      console.log("Current theme state:", newTheme);
    }, 100);
  };

  return (
    <div className="flex gap-2 p-1 bg-surface-hover rounded-lg border border-border-primary">
      <button
        onClick={() => handleToggle("light")}
        className={`px-3 py-2 rounded-md text-sm font-medium transition-all ${
          theme === "light"
            ? "bg-brand-primary text-white shadow-sm"
            : "text-text-muted hover:text-text-secondary"
        }`}
      >
        ☀️ Light
      </button>
      <button
        onClick={() => handleToggle("dark")}
        className={`px-3 py-2 rounded-md text-sm font-medium transition-all ${
          theme === "dark"
            ? "bg-brand-primary text-white shadow-sm"
            : "text-text-muted hover:text-text-secondary"
        }`}
      >
        🌙 Dark
      </button>
    </div>
  );
}

export default ThemeToggle;

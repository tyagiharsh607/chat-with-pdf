import { useTheme } from "../hooks/useTheme";

function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  const handleToggle = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    console.log("Toggling theme from", theme, "to", newTheme);
    toggleTheme(newTheme);
  };

  return (
    <button
      onClick={handleToggle}
      className={`cursor-pointer w-10 h-10 flex items-center justify-center rounded-full transition-all border border-border-primary
        ${
          theme === "light"
            ? "bg-white text-white"
            : "bg-primary text-yellow-300"
        }
      `}
    >
      {theme === "light" ? "☀️" : "🌙"}
    </button>
  );
}

export default ThemeToggle;

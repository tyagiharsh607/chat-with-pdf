// src/components/TestCard.jsx
import { useTheme } from "../hooks/useTheme";

function Home() {
  const { theme } = useTheme();

  return (
    <div className="bg-surface hover:bg-surface-hover p-6 rounded-xl border border-border-primary shadow-lg transition-all duration-300 max-w-sm">
      {/* Theme Badge */}
      <div className="bg-surface-badge text-text-primary inline-block px-3 py-1 rounded-full text-sm mb-4 shadow-md shadow-shadow-badge">
        {theme === "dark" ? "🌙 Dark Mode" : "☀️ Light Mode"}
      </div>

      {/* Title */}
      <h3 className="text-text-primary text-xl font-semibold mb-2">
        Premium Plan
      </h3>

      {/* Price */}
      <div className="text-text-price text-3xl font-bold mb-4">$99.99</div>

      {/* Description */}
      <p className="text-text-secondary mb-6">
        Complete solution with all premium features included for your business
        needs.
      </p>

      {/* Features List */}
      <ul className="space-y-3 mb-6">
        <li className="flex items-center text-text-feature">
          <svg
            className="w-4 h-4 mr-3 text-brand-accent"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
          Unlimited Projects
        </li>
        <li className="flex items-center text-text-feature">
          <svg
            className="w-4 h-4 mr-3 text-brand-accent"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
          Priority Support
        </li>
        <li className="flex items-center text-text-feature">
          <svg
            className="w-4 h-4 mr-3 text-brand-accent"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
          Advanced Analytics
        </li>
        <li className="flex items-center text-text-feature">
          <svg
            className="w-4 h-4 mr-3 text-brand-accent"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
          Custom Integrations
        </li>
      </ul>

      {/* Action Button */}
      <button className="bg-brand-primary hover:bg-brand-hover w-full text-white py-3 rounded-lg font-medium transition-all duration-200 shadow-lg shadow-shadow-action mb-4">
        Choose Plan
      </button>

      {/* Compare Link */}
      <div className="text-center">
        <button className="text-brand-accent hover:bg-hover-brand px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 border border-border-brand">
          Compare Plans
        </button>
      </div>
    </div>
  );
}

export default Home;

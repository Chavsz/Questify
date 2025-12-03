import RouteSelect from "./routeSelect";
import * as fiIcons from "react-icons/fi";
import { doSignOut } from "./auth";
import { useNavigate } from "react-router-dom";
import { useTheme } from "./components/theme";

const Sidebar = () => {
  const navigate = useNavigate();
  const { isDarkMode } = useTheme();

  const logout = async () => {
    try {
      await doSignOut();
      navigate("/", { replace: true });
    } catch (e) {
      // no-op: Toaster in pages will show any errors triggered there if needed
    }
  };
  return (
    <div
      className={`pixel-border min-h-screen ${
        isDarkMode ? "dark-mode-card" : "bg-white"
      }`}
    >
      <div className="sticky top-0 flex h-screen flex-col justify-between p-4">
        <div>
          <h1
            className={`text-xl md:text-xl font-bold text-center mb-9 hidden md:block pixel-text ${
              isDarkMode ? "text-[#ffd700]" : "text-amber-600"
            }`}
          >
            ⚔ QUESTIFY
          </h1>
          <RouteSelect />
        </div>

        <button
          className={`pixel-button pixel-button-red flex items-center md:justify-start justify-center gap-2 w-full px-2 py-1.5 md:text-sm text-1xl transition-colors duration-300 ${
            isDarkMode ? "" : ""
          }`}
          onClick={logout}
        >
          <fiIcons.FiLogOut />
          <p className="text-sm font-semibold hidden md:block">Log out</p>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
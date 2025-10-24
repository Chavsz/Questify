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
    <div className={`p-4 sticky top-0 h-screen ${
      isDarkMode ? 'dark-mode-card' : 'bg-[#fafaff]'
    }`}>
      <div className="top-4 h-[calc(100vh-32px-50px)]">
        <h1 className={`text-xl md:text-2xl font-bold text-center mb-9 hidden md:block ${
          isDarkMode ? 'text-[#4f46e5]' : 'text-indigo-600'
        }`}>
          QUESTIFY
        </h1>
        <RouteSelect />
      </div>

      <div>
        <button
          className={`flex items-center md:justify-start justify-center gap-2 w-full rounded px-2 py-1.5 md:text-sm text-1xl shadow-none transition-colors duration-300 ${
            isDarkMode 
              ? 'hover:bg-gray-600 text-gray-300' 
              : 'hover:bg-[#e2e6fd] text-[#696969]'
          }`}
          onClick={logout}
        >
          <fiIcons.FiLogOut /> <p className="text-md font-semibold hidden md:block">Log out</p>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
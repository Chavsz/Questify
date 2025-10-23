import { useTheme } from "./components/theme";
import { IoSunnyOutline } from "react-icons/io5";
import { FaRegMoon } from "react-icons/fa";

function Dashboard() {
  const { isDarkMode, toggleDarkMode } = useTheme();

  return (
    <div className={`${isDarkMode ? 'dark-mode-bg' : 'bg-white'} min-h-screen`}>
      <div className="flex items-center justify-between p-6">
        <h1 className={`text-2xl font-bold ${isDarkMode ? 'dark-mode-text' : 'text-gray-900'}`}>
          Dashboard
        </h1>
        <button
          onClick={toggleDarkMode}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors duration-300 hover:scale-105 ${
            isDarkMode 
              ? 'bg-gray-700 hover:bg-gray-600 text-white' 
              : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
          }`}
        >
          {isDarkMode ? <IoSunnyOutline /> : <FaRegMoon />}
          <span>{isDarkMode ? 'Light' : 'Dark'}</span>
        </button>
      </div>
    </div>
  );
}

export default Dashboard;

import RouteSelect from "./routeSelect";
import * as fiIcons from "react-icons/fi";
import { doSignOut } from "./auth";
import { useNavigate } from "react-router-dom";
import { useTheme } from "./components/theme";

interface SidebarProps {
  isBgMusicMuted: boolean;
  toggleBgMusic: () => void;
}

const Sidebar = ({ isBgMusicMuted, toggleBgMusic }: SidebarProps) => {
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
      className={`sticky top-0 h-screen border-2 box-border ${
        isDarkMode
          ? "bg-gray-900 border-amber-400"
          : "bg-white border-amber-500"
      }`}
    >
      <div className="flex h-full flex-col justify-between p-4">
        <div>
          <h1
            className={`text-xl md:text-xl font-bold text-center mb-9 hidden md:block font-['Press_Start_2P',cursive] tracking-[0.12em] ${
              isDarkMode ? "text-[#ffd700]" : "text-amber-600"
            }`}
          >
            ⚔ QUESTIFY
          </h1>
          <RouteSelect />
        </div>

        <div className="flex flex-col gap-2">
          <button
            className="flex items-center md:justify-start justify-center gap-2 w-full px-2 py-1.5 md:text-sm text-1xl 
                      font-['Press_Start_2P',cursive] border-2 rounded-sm
                      transition-transform duration-300 hover:-translate-y-1"
            style={{
              background: isBgMusicMuted ? "#6b7280" : "#4f46e5",
              borderColor: isBgMusicMuted ? "#4b5563" : "#4338ca",
              color: "white",
            }}
            onClick={toggleBgMusic}
          >
            <span className="text-lg">{isBgMusicMuted ? "🔇" : "🔊"}</span>
            <p className="text-xs font-semibold hidden md:block">
              {isBgMusicMuted ? "Unmute" : "Mute"}
            </p>
          </button>

          <button
            className={`flex items-center md:justify-start justify-center gap-2 w-full px-2 py-1.5 md:text-sm text-1xl 
                      font-['Press_Start_2P',cursive] border-2 rounded-sm
                      transition-transform duration-300 hover:-translate-y-1 ]
                      bg-linear-to-b from-[#ff6348] to-[#ff4757] border-[#c0392b] text-white`}
            onClick={logout}
          >
            <fiIcons.FiLogOut />
            <p className="text-sm font-semibold hidden md:block">Log out</p>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;

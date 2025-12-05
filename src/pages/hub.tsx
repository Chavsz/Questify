import knightWalkGif from "../assets/walking avatar.gif";
import { useTheme } from "../components/theme";
import { IoSunnyOutline } from "react-icons/io5";
import { FaRegMoon } from "react-icons/fa";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/authContexts/auth";
import { useEffect, useState } from "react";

import { getUser, type User } from "../services/users";
import { getUserQuestStats } from "../services/questStats";
import type { QuestStats } from "../services/questStats";

function Hub() {
  const { isDarkMode, toggleDarkMode } = useTheme();
  const authContext = useAuth();
  const user = authContext?.currentUser;
  const [streak, setStreak] = useState<number | null>(null);
  const [loadingStreak, setLoadingStreak] = useState(true);
  const [questStats, setQuestStats] = useState<QuestStats>({});
  const [loadingStats, setLoadingStats] = useState(true);
  const [userData, setUserData] = useState<User | null>(null);

  useEffect(() => {
    const fetchStreakAndStats = async () => {
      if (!user) {
        setStreak(null);
        setLoadingStreak(false);
        setQuestStats({});
        setLoadingStats(false);
        setUserData(null);
        return;
      }
      try {
        const uData = await getUser(user.uid);
        setUserData(uData);
        setStreak(uData && typeof uData.streak === "number" ? uData.streak : 0);
      } catch (e) {
        setStreak(0);
        setUserData(null);
      } finally {
        setLoadingStreak(false);
      }
      try {
        const stats = await getUserQuestStats(user.uid);
        setQuestStats(stats);
      } catch (e) {
        setQuestStats({});
      } finally {
        setLoadingStats(false);
      }
    };
    fetchStreakAndStats();
  }, [user]);

  // EXP/Level logic
  const exp = userData?.exp ?? 0;
  const level = userData?.level ?? 1;
  const expToNext = 100 + (level - 1) * 50; // Example: 100, 150, 200, ...
  const expProgress = Math.min(100, Math.round((exp / expToNext) * 100));
  const questsCompleted = Object.values(questStats).reduce((a, b) => a + b, 0);

  return (
    <div className="min-h-screen">
      <div className="">
        {/* Header */}
        <header className={`flex justify-between items-center mb-6`}>
          <div>
            <div
              className={`font-bold text-lg ml-5 ${
                isDarkMode ? "text-white" : " text-orange-600"
              }`}
            >
              Streak:{" "}
              {loadingStreak
                ? "..."
                : `${streak ?? 0} day${streak === 1 ? "" : "s"}`}
            </div>
          </div>
          <div className="flex items-center gap-4">
            {/* Toggle Theme */}
            <button
              onClick={toggleDarkMode}
              className={`relative w-14 h-7 rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                isDarkMode
                  ? "bg-gray-700 focus:ring-gray-500"
                  : "bg-yellow-400 focus:ring-yellow-500"
              }`}
            >
              <span
                className={`absolute top-1 left-1 w-5 h-5 rounded-full bg-white shadow-md transform transition-transform duration-300 flex items-center justify-center ${
                  isDarkMode ? "translate-x-8" : "translate-x-0"
                }`}
              >
                {isDarkMode ? (
                  <FaRegMoon className="text-gray-700 text-xs" />
                ) : (
                  <IoSunnyOutline className="text-yellow-500 text-xs" />
                )}
              </span>
            </button>
            
            <span
              className={`text-2xl ${
                isDarkMode ? "text-gray-400" : "text-gray-600"
              }`}
            >
              |
            </span>
            {/* Profile Picture */}
            <div
              className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xl bg-linear-to-r from-orange-500 to-red-500 ${
                isDarkMode ? " text-white" : " text-white"
              }`}
            >
              {user?.email ? user.email.charAt(0).toUpperCase() : "?"}
            </div>
          </div>
        </header>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-[250px_1fr] gap-8 mb-10">
          {/* Left Sidebar */}
          <aside className="flex flex-col gap-6">
            {/* Important Info Cards */}
            <div className="flex flex-col gap-4">
              <div
                className={`p-4 font-bold text-lg text-center border-2 transition-transform duration-200 ${
                  isDarkMode
                    ? "bg-gray-800 text-white border-amber-400"
                    : "bg-gray-50 text-gray-600 border-amber-500"
                }`}
              >
                Level:{" "}
                <span
                  className={isDarkMode ? "text-[#ffd700]" : "text-amber-600"}
                >
                  {level}
                </span>
              </div>
              <div
                className={`p-4 font-bold text-lg text-center border-2 transition-transform duration-200 ${
                  isDarkMode
                    ? "bg-gray-800 text-white border-amber-400"
                    : "bg-gray-50 text-gray-600 border-amber-500"
                }`}
              >
                EXP: {exp} / {expToNext}
                <div
                  className={`relative w-full mt-2 h-5 border-2 rounded-sm overflow-hidden ${
                    isDarkMode
                      ? "bg-gray-900 border-gray-600"
                      : "bg-gray-200 border-gray-400"
                  }`}
                >
                  <div
                    className="h-full bg-linear-to-r from-[#ffd700] to-[#ffed4e] transition-[width] duration-300"
                    style={{ width: `${expProgress}%` }}
                  ></div>
                  <div
                    className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-xs font-bold text-white"
                    style={{ textShadow: "1px 1px 0 black", zIndex: 1 }}
                  >
                    {expProgress}%
                  </div>
                </div>
              </div>
              <div
                className={`p-4 font-bold text-lg text-center border-2 transition-transform duration-200 ${
                  isDarkMode
                    ? "bg-gray-800 text-white border-amber-400"
                    : "bg-gray-50 text-gray-600 border-amber-500"
                }`}
              >
                Quests: {questsCompleted}
              </div>
            </div>
            <div className="flex flex-col items-center gap-6">
              <Link
                to="/avatar"
                className="px-6 py-4 font-bold cursor-pointer text-center w-full text-xs
                            font-['Press_Start_2P',cursive] tracking-[0.12em] border-2 rounded-sm
                            transition-transform duration-100
                            bg-linear-to-b from-[#ffd700] to-[#ffb700] border-[#8b6914] text-[#1a1a2e]"
              >
                EDIT AVATAR
              </Link>
            </div>
          </aside>

          <main className="flex flex-col gap-8">
            <div
              className={`p-10 flex justify-center items-center min-h-[400px] relative border-2 transition-transform duration-200 ${
                isDarkMode
                  ? "bg-gray-900 border-amber-400"
                  : "bg-white border-amber-500"
              }`}
            >
              {/* === REPLACED SHIELD WITH GIF === */}
              <div className="w-64 h-80 flex items-center justify-center overflow-hidden">
                <img
                  src={knightWalkGif}
                  alt="Walking Avatar"
                  className="object-contain w-full h-full"
                  style={{ transform: "scale(5)", imageRendering: "pixelated" }}
                />
              </div>
              {/* === END REPLACEMENT === */}
            </div>

            {/* Weekly quest completion activity */}
            <div
              className={`p-8 min-h-[300px] border-2 ${
                isDarkMode
                  ? "bg-gray-900 text-white border-amber-400"
                  : "bg-white text-gray-600 border-amber-500"
              }`}
            >
              <h3
                className={`mb-6 text-lg font-bold font-['Press_Start_2P',cursive] ${
                  isDarkMode ? "text-[#ffd700]" : "text-amber-600"
                }`}
              >
                Weekly quest completion activity
              </h3>
              <div
                className={`h-64 flex flex-col items-center justify-center gap-4 shadow-inner ${
                  isDarkMode
                    ? "bg-gray-700 text-gray-300"
                    : "bg-gray-100 text-gray-600"
                }`}
              >
                {/* Dynamic Bar Graph */}
                <div className="flex items-end gap-4 h-40">
                  {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(
                    (day) => {
                      const val = questStats[day] || 0;
                      // Max bar height 140px, scale by max value in week
                      const max = Math.max(1, ...Object.values(questStats));
                      const height = 40 + (max ? (100 * val) / max : 0); // min 40px
                      return (
                        <div
                          key={day}
                          className={`w-10 rounded-t relative flex flex-col items-center ${
                            isDarkMode ? "bg-indigo-600" : "bg-indigo-500"
                          }`}
                          style={{ height: `${height}px` }}
                        >
                          <span
                            className={`absolute -bottom-6 left-1/2 transform -translate-x-1/2 text-xs ${
                              isDarkMode ? "text-gray-300" : "text-gray-600"
                            }`}
                          >
                            {day}
                          </span>
                          <span
                            className="absolute top-2 left-1/2 transform -translate-x-1/2 text-xs font-bold text-white"
                            style={{ textShadow: "1px 1px 0 black" }}
                          >
                            {loadingStats ? "..." : val}
                          </span>
                        </div>
                      );
                    }
                  )}
                </div>
                <p className="mt-10 text-sm">
                  {loadingStats ? "Loading..." : ""}
                </p>
              </div>
            </div>
          </main>
        </div>

        {/* Bottom Navigation */}
        <nav className="flex justify-end">
          <Link
            to="/quest"
            className="px-7 py-4 font-bold text-xs cursor-pointer text-center
font-['Press_Start_2P',cursive] uppercase tracking-[0.12em] border-2 rounded-sm
transition-transform duration-300 hover:-translate-y-1
bg-linear-to-b from-[#ff6348] to-[#ff4757] border-[#c0392b] text-white"
          >
            ⚔️ GO ON A QUEST!
          </Link>
        </nav>
      </div>
    </div>
  );
}

export default Hub;

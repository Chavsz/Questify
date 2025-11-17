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

  const handleEditAvatar = () => {
    console.log("Navigate to Avatar");
  };

  // EXP/Level logic
  const exp = userData?.exp ?? 0;
  const level = userData?.level ?? 1;
  const expToNext = 100 + (level - 1) * 50; // Example: 100, 150, 200, ...
  const expProgress = Math.min(100, Math.round((exp / expToNext) * 100));
  const questsCompleted = Object.values(questStats).reduce((a, b) => a + b, 0);

  return (
    <div className="min-h-screen" >
      <div className="">
        {/* Header */}
        <header
          className={`flex justify-between items-center mb-10 p-6 rounded-2xl ${
            isDarkMode
              ? "bg-gray-800 border border-gray-700"
              : "bg-white border border-gray-300"
          }`}
        >
          <div className="flex items-center">
            <div
              className={`px-6 py-4 rounded-xl font-bold text-lg ${
                isDarkMode
                  ? "bg-orange-600 text-white"
                  : "bg-gradient-to-r from-orange-500 to-red-500 text-white"
              }`}
            >
              Streak:{" "}
              {loadingStreak
                ? "..."
                : `${streak ?? 0} day${streak === 1 ? "" : "s"}`}
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={toggleDarkMode}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium hover:scale-105 shadow-md ${
                isDarkMode
                  ? "bg-gray-700 hover:bg-gray-600 text-white border border-gray-600"
                  : "bg-white hover:bg-gray-50 text-gray-600 border border-gray-300"
              }`}
            >
              {isDarkMode ? <IoSunnyOutline /> : <FaRegMoon />}
              <span>{isDarkMode ? "Light" : "Dark"}</span>
            </button>
          </div>
        </header>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-[250px_1fr] gap-8 mb-10">
          {/* Left Sidebar */}
          <aside className="flex flex-col gap-6">
            {/* Important Info Cards */}
            <div className="flex flex-col gap-4">
              <div
                className={`p-4 rounded-xl font-bold text-lg text-center ${
                  isDarkMode
                    ? "bg-gray-800 text-white border border-gray-700"
                    : "bg-white text-gray-600 border border-gray-300"
                }`}
              >
                Level: <span className="text-indigo-600">{level}</span>
              </div>
              <div
                className={`p-4 rounded-xl font-bold text-lg text-center ${
                  isDarkMode
                    ? "bg-gray-800 text-white border border-gray-700"
                    : "bg-white text-gray-600 border border-gray-300"
                }`}
              >
                EXP: {exp} / {expToNext}
                <div className="w-full h-2 bg-gray-200 rounded-full mt-2">
                  <div
                    className="h-2 rounded-full bg-indigo-600"
                    style={{ width: `${expProgress}%` }}
                  ></div>
                </div>
              </div>
              <div
                className={`p-4 rounded-xl font-bold text-lg text-center ${
                  isDarkMode
                    ? "bg-gray-800 text-white border border-gray-700"
                    : "bg-white text-gray-600 border border-gray-300"
                }`}
              >
                Quests: {questsCompleted}
              </div>
            </div>
            <div className="flex flex-col items-center gap-6">
              <div
                className={`w-36 h-36 rounded-full flex items-center justify-center text-6xl shadow-2xl ${
                  isDarkMode
                    ? "bg-gradient-to-br from-purple-600 to-indigo-700"
                    : "bg-gradient-to-br from-indigo-400 to-purple-600"
                }`}
              >
                ⚔️
              </div>
              <Link
                to="/avatar"
                onClick={handleEditAvatar}
                className={`px-6 py-4 rounded-xl font-bold cursor-pointer hover:-translate-y-1 hover:shadow-xl text-center w-full shadow-lg ${
                  isDarkMode
                    ? "bg-gray-800 hover:bg-gray-700 text-white border border-gray-700"
                    : "bg-white hover:bg-gray-50 text-gray-600 border border-gray-300"
                }`}
              >
                Edit Avatar
              </Link>
            </div>
          </aside>

          <main className="flex flex-col gap-8">
            <div
              className={`rounded-2xl p-10 flex justify-center items-center min-h-[400px] relative shadow-lg ${
                isDarkMode
                  ? "bg-gray-800 border border-gray-700"
                  : "bg-white border border-gray-300"
              }`}
            >
              <div className="w-64 h-80 rounded-2xl flex items-center justify-center text-8xl shadow-2xl bg-linear-to-br from-purple-600 to-indigo-700">
                🛡️
              </div>
            </div>

            {/* Weekly quest completion activity */}
            <div
              className={`rounded-2xl p-8 min-h-[300px] shadow-lg ${
                isDarkMode
                  ? "bg-gray-800 text-white border border-gray-700"
                  : "bg-white border border-gray-300"
              }`}
            >
              <h3
                className={`mb-6 text-xl font-bold ${
                  isDarkMode ? "text-white" : "text-gray-600"
                }`}
              >
                Weekly quest completion activity
              </h3>
              <div
                className={`h-64 rounded-xl flex flex-col items-center justify-center gap-4 shadow-inner ${
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
                          className="w-10 bg-indigo-600 rounded-t relative flex flex-col items-center"
                          style={{ height: `${height}px` }}
                        >
                          <span className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 text-xs text-gray-600">
                            {day}
                          </span>
                          <span className="absolute top-2 left-1/2 transform -translate-x-1/2 text-xs font-bold text-white">
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
            className="bg-red-600  text-white border-none px-7 py-4 rounded-xl font-bold text-lg cursor-pointer hover:bg-red-700 hover:shadow-xl text-center shadow-lg"
          >
            ⚔️ Go on A Quest!
          </Link>
        </nav>
      </div>
    </div>
  );
}

export default Hub;

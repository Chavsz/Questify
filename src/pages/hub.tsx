
import { useTheme } from "../components/theme";
import { IoSunnyOutline } from "react-icons/io5";
import { FaRegMoon } from "react-icons/fa";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/authContexts/auth";
import { useEffect, useState } from "react";
import { getUser } from "../services/users";


function Hub() {
  const { isDarkMode, toggleDarkMode } = useTheme();
  const authContext = useAuth();
  const user = authContext?.currentUser;
  const [streak, setStreak] = useState<number | null>(null);
  const [loadingStreak, setLoadingStreak] = useState(true);

  useEffect(() => {
    const fetchStreak = async () => {
      if (!user) {
        setStreak(null);
        setLoadingStreak(false);
        return;
      }
      try {
        const userData = await getUser(user.uid);
        setStreak(userData && typeof userData.streak === 'number' ? userData.streak : 0);
      } catch (e) {
        setStreak(0);
      } finally {
        setLoadingStreak(false);
      }
    };
    fetchStreak();
  }, [user]);

  const handleEditAvatar = () => {
    console.log("Navigate to Avatar");
  };

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gradient-to-br from-purple-50 to-indigo-100'} transition-colors duration-300`}>
      <div className="max-w-7xl mx-auto p-5">
        {/* Header */}
        <header className={`flex justify-between items-center mb-10 p-6 rounded-2xl shadow-lg ${
          isDarkMode 
            ? 'bg-gray-800 border border-gray-700' 
            : 'bg-white border border-purple-200'
        }`}>
          <div className="flex items-center gap-8">
            <div className={`px-6 py-4 rounded-xl font-bold text-lg shadow-md ${
              isDarkMode 
                ? 'bg-purple-600 text-white' 
                : 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white'
            }`}>
              🎮 Questify
            </div>
            <div className={`px-6 py-4 rounded-xl font-bold text-lg shadow-md ${
              isDarkMode 
                ? 'bg-orange-600 text-white' 
                : 'bg-gradient-to-r from-orange-500 to-red-500 text-white'
            }`}>
              🔥 Streak: {loadingStreak ? '...' : `${streak ?? 0} day${streak === 1 ? '' : 's'}`}
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={toggleDarkMode}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-300 hover:scale-105 shadow-md ${
                isDarkMode
                  ? "bg-gray-700 hover:bg-gray-600 text-white border border-gray-600"
                  : "bg-white hover:bg-gray-50 text-purple-900 border border-purple-300"
              }`}
            >
              {isDarkMode ? <IoSunnyOutline /> : <FaRegMoon />}
              <span>{isDarkMode ? 'Light' : 'Dark'}</span>
            </button>
          </div>
        </header>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-[250px_1fr] gap-8 mb-10">
          {/* Left Sidebar */}
          <aside className="flex flex-col gap-6">
            <div className={`p-6 rounded-2xl text-center font-bold text-lg shadow-lg ${
              isDarkMode 
                ? 'bg-gray-800 text-yellow-400 border border-gray-700' 
                : 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white'
            }`}>
              💰 1,250 Coins
            </div>
            <div className="flex flex-col items-center gap-6">
              <div className={`w-36 h-36 rounded-full flex items-center justify-center text-6xl shadow-2xl ${
                isDarkMode 
                  ? 'bg-gradient-to-br from-purple-600 to-indigo-700' 
                  : 'bg-gradient-to-br from-indigo-400 to-purple-600'
              }`}>
                ⚔️
              </div>
              <Link to="/avatar"
                onClick={handleEditAvatar}
                className={`px-6 py-4 rounded-xl font-bold cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-xl text-center w-full shadow-lg ${
                  isDarkMode 
                    ? 'bg-gray-800 hover:bg-gray-700 text-white border border-gray-600' 
                    : 'bg-white hover:bg-gray-50 text-purple-900 border border-purple-300'
                }`}
              >
                Edit Avatar
              </Link>
            </div>
          </aside>

          {/* Center and Right Area */}
          <main className="flex flex-col gap-8">
            <div className={`rounded-2xl p-10 flex justify-center items-center min-h-[400px] relative shadow-lg ${
              isDarkMode 
                ? 'bg-gray-800 border border-gray-700' 
                : 'bg-gradient-to-br from-purple-100 to-indigo-100 border border-purple-200'
            }`}>
              <div className={`w-64 h-80 rounded-2xl flex items-center justify-center text-8xl shadow-2xl ${
                isDarkMode 
                  ? 'bg-gradient-to-br from-purple-600 to-indigo-700' 
                  : 'bg-gradient-to-br from-indigo-400 to-purple-600'
              }`}>
                🛡️
              </div>
            </div>
            <div className={`rounded-2xl p-8 min-h-[300px] shadow-lg ${
              isDarkMode 
                ? 'bg-gray-800 text-white border border-gray-700' 
                : 'bg-white text-purple-900 border border-purple-200'
            }`}>
              <h3 className={`mb-6 text-2xl font-bold ${
                isDarkMode ? 'text-white' : 'text-purple-900'
              }`}>📊 Quests Completed</h3>
              <div className={`h-64 rounded-xl flex flex-col items-center justify-center gap-4 shadow-inner ${
                isDarkMode 
                  ? 'bg-gray-700 text-gray-300' 
                  : 'bg-gray-100 text-gray-600'
              }`}>
                <div className="flex items-end gap-4 h-40">
                  <div
                    className="w-10 bg-gradient-to-t from-indigo-400 to-purple-600 rounded-t-lg relative"
                    style={{ height: "80px" }}
                  >
                    <span className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 text-xs text-gray-600">
                      Mon
                    </span>
                  </div>
                  <div
                    className="w-10 bg-gradient-to-t from-indigo-400 to-purple-600 rounded-t-lg relative"
                    style={{ height: "120px" }}
                  >
                    <span className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 text-xs text-gray-600">
                      Tue
                    </span>
                  </div>
                  <div
                    className="w-10 bg-gradient-to-t from-indigo-400 to-purple-600 rounded-t-lg relative"
                    style={{ height: "60px" }}
                  >
                    <span className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 text-xs text-gray-600">
                      Wed
                    </span>
                  </div>
                  <div
                    className="w-10 bg-gradient-to-t from-indigo-400 to-purple-600 rounded-t-lg relative"
                    style={{ height: "140px" }}
                  >
                    <span className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 text-xs text-gray-600">
                      Thu
                    </span>
                  </div>
                  <div
                    className="w-10 bg-gradient-to-t from-indigo-400 to-purple-600 rounded-t-lg relative"
                    style={{ height: "100px" }}
                  >
                    <span className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 text-xs text-gray-600">
                      Fri
                    </span>
                  </div>
                  <div
                    className="w-10 bg-gradient-to-t from-indigo-400 to-purple-600 rounded-t-lg relative"
                    style={{ height: "90px" }}
                  >
                    <span className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 text-xs text-gray-600">
                      Sat
                    </span>
                  </div>
                  <div
                    className="w-10 bg-gradient-to-t from-indigo-400 to-purple-600 rounded-t-lg relative"
                    style={{ height: "110px" }}
                  >
                    <span className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 text-xs text-gray-600">
                      Sun
                    </span>
                  </div>
                </div>
                <p className="mt-10 text-sm">
                  Weekly quest completion activity
                </p>
              </div>
            </div>
          </main>
        </div>

        {/* Bottom Navigation */}
        <nav className="flex justify-between gap-6">
          <Link
            to="/shop"
            className={`px-10 py-5 rounded-xl font-bold text-lg cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-xl flex-1 max-w-sm text-center shadow-lg ${
              isDarkMode 
                ? 'bg-gray-800 hover:bg-gray-700 text-white border border-gray-600' 
                : 'bg-white hover:bg-gray-50 text-purple-900 border border-purple-300'
            }`}
          >
            🛒 Shop
          </Link>
          <Link
            to="/quest"
            className="bg-gradient-to-r from-red-500 to-red-600 text-white border-none px-10 py-5 rounded-xl font-bold text-lg cursor-pointer transition-all duration-300 hover:from-red-600 hover:to-red-700 hover:-translate-y-1 hover:shadow-xl flex-1 max-w-sm text-center shadow-lg"
          >
            ⚔️ Go on A Quest!
          </Link>
        </nav>
      </div>
    </div>
  );
}

export default Hub;

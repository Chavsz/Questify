import { useTheme } from "../components/theme";
import { IoSunnyOutline } from "react-icons/io5";
import { FaRegMoon } from "react-icons/fa";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/authContexts/auth";
import { useEffect, useState, useRef } from "react";
import MiniCavalierWalk from "../assets/MiniCavalierWalk.gif";
import FireGif from "../assets/Fire.gif";
import jumpSfx from "../assets/jump.mp3";
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
  const [playerY, setPlayerY] = useState(300);
  const [playerVelocity, setPlayerVelocity] = useState(0);
  const [gameActive, setGameActive] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [obstacles, setObstacles] = useState<Array<{ id: number; x: number; height: number }>>([]);
  const gameLoopRef = useRef<NodeJS.Timeout | null>(null);
  const obstacleIdRef = useRef(0);
  const [highScore, setHighScore] = useState(0);
  const jumpSoundRef = useRef<HTMLAudioElement | null>(null);

  // Jump sound effect setup
  useEffect(() => {
    const audio = new Audio(jumpSfx);
    audio.volume = 0.5;
    jumpSoundRef.current = audio;
    return () => {
      audio.pause();
      audio.src = "";
      jumpSoundRef.current = null;
    };
  }, []);

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

  // Jumper Game Logic
  useEffect(() => {
    if (!gameActive || gameOver) return;

    const gameLoop = setInterval(() => {
      // Apply gravity
      setPlayerVelocity((v) => v + 0.8);
      setPlayerY((y) => {
        const newY = y + playerVelocity;
        const groundLevel = 296; // 380 - 64 - 20 (gap above ground)
        if (newY >= groundLevel) {
          setPlayerVelocity(0);
          return groundLevel;
        }
        return Math.max(0, newY);
      });

      // Move obstacles and check collision
      setObstacles((prevObstacles) => {
        const gameSpeed = 6 + Math.floor(score / 500);
        const updated = prevObstacles
          .map((obs) => ({ ...obs, x: obs.x - gameSpeed }))
          .filter((obs) => obs.x > -60);

        // Better collision detection
        updated.forEach((obs) => {
          const playerLeft = 16;
          const playerRight = 80; // 16 + 64
          const playerTop = playerY;
          const playerBottom = playerY + 64;
          
          const obsLeft = obs.x;
          const obsRight = obs.x + 50;
          const obsTop = 340 - obs.height;
          const obsBottom = 356;

          if (
            playerRight > obsLeft &&
            playerLeft < obsRight &&
            playerBottom > obsTop &&
            playerTop < obsBottom
          ) {
            setGameOver(true);
            setGameActive(false);
            if (Math.floor(score / 10) > highScore) {
              setHighScore(Math.floor(score / 10));
            }
          }
        });

        return updated;
      });

      // Spawn new obstacles with variable heights
      const spawnChance = 0.015 + Math.min(score / 100000, 0.01);
      if (Math.random() < spawnChance) {
        const heights = [16, 24, 32, 40];
        const randomHeight = heights[Math.floor(Math.random() * heights.length)];
        setObstacles((prev) => [
          ...prev,
          { id: obstacleIdRef.current++, x: 1200, height: randomHeight },
        ]);
      }

      // Increase score
      setScore((s) => s + 1);
    }, 30);

    gameLoopRef.current = gameLoop;
    return () => clearInterval(gameLoop);
  }, [gameActive, gameOver, playerVelocity, playerY, score, highScore]);

  const handleJump = () => {
    if (!gameActive) {
      setPlayerY(296); // Start at ground level with gap
      setPlayerVelocity(0);
      setGameActive(true);
      setGameOver(false);
      setScore(0);
      setObstacles([]);
      obstacleIdRef.current = 0;
    } else if (playerY >= 280 && !gameOver) {
      setPlayerVelocity(-15);
      // Play jump sound
      if (jumpSoundRef.current) {
        jumpSoundRef.current.currentTime = 0;
        jumpSoundRef.current.play().catch(() => {});
      }
    }
  };

  // EXP/Level logic
  const exp = userData?.exp ?? 0;
  const level = userData?.level ?? 1;
  const expToNext = 100 + (level - 1) * 50; // Example: 100, 150, 200, ...
  const expProgress = Math.min(100, Math.round((exp / expToNext) * 100));
  const questsCompleted = Object.values(questStats).reduce((a, b) => a + b, 0);

  // Keyboard handler for jumping
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        e.preventDefault();
        handleJump();
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [gameActive, gameOver, playerY]);

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
              <div className="flex items-center">
                {!loadingStreak && (streak ?? 0) > 0 && (
                  <img
                    src={FireGif}
                    alt="Streak fire"
                    className="w-7 h-7 object-contain mb-1.5"
                  />
                )}
                <span>
                  Streak:{" "}
                  {loadingStreak
                    ? "..."
                    : `${streak ?? 0} day${streak === 1 ? "" : "s"}`}
                </span>
              </div>
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
              className={`p-10 flex flex-col justify-center items-center min-h-[400px] relative border-2 transition-transform duration-200 ${
                isDarkMode
                  ? "bg-gray-900 border-amber-400"
                  : "bg-white border-amber-500"
              }`}
            >
              {/* Jumper Game */}
              <h3 className={`text-xl font-bold font-['Press_Start_2P',cursive] mb-4 ${
                isDarkMode ? "text-[#ffd700]" : "text-amber-600"
              }`}>
                JUMPER GAME
              </h3>
              
              <div className={`w-full relative overflow-hidden border-4 bg-linear-to-b ${
                isDarkMode
                  ? "from-sky-900 to-sky-700 border-blue-500"
                  : "from-sky-400 to-sky-200 border-blue-400"
              }`} style={{ height: "380px" }}>
                {/* Clouds */}
                <div className="absolute top-8 left-10 text-2xl opacity-50">☁️</div>
                <div className="absolute top-16 left-40 text-xl opacity-40">☁️</div>
                <div className="absolute top-12 right-16 text-3xl opacity-30">☁️</div>

                {/* Player */}
                <div
                  className="absolute transition-all duration-75"
                  style={{ 
                    left: "16px", 
                    top: `${playerY}px`,
                    transform: playerVelocity < 0 ? "rotate(-10deg)" : "rotate(5deg)"
                  }}
                >
                  <img 
                    src={MiniCavalierWalk} 
                    alt="Player" 
                    className="w-16 h-16 object-contain filter drop-shadow-lg"
                    style={{ imageRendering: "pixelated" }}
                  />
                </div>

                {/* Obstacles */}
                {obstacles.map((obs) => (
                  <div
                    key={obs.id}
                    className={`absolute rounded-sm shadow-lg ${
                      isDarkMode ? "bg-linear-to-t from-gray-800 to-gray-700 border-2 border-gray-600" : "bg-linear-to-t from-gray-700 to-gray-600 border-2 border-gray-500"
                    }`}
                    style={{ 
                      left: `${obs.x}px`, 
                      bottom: "16px",
                      width: "50px",
                      height: `${obs.height}px`
                    }}
                  >
                  </div>
                ))}

                {/* Ground */}
                <div className={`absolute bottom-0 w-full h-4 border-t-2 ${
                  isDarkMode ? "bg-green-900 border-green-700" : "bg-green-700 border-green-600"
                }`}>
                </div>

                {/* Score Display */}
                <div className={`absolute top-4 left-4 font-bold font-['Press_Start_2P',cursive] ${
                  isDarkMode ? "text-white" : "text-gray-900"
                }`}>
                  <div className="text-xs">SCORE</div>
                  <div className="text-2xl">{Math.floor(score / 10)}</div>
                </div>

                {/* High Score */}
                {highScore > 0 && (
                  <div className={`absolute top-4 right-4 font-bold font-['Press_Start_2P',cursive] text-right ${
                    isDarkMode ? "text-yellow-300" : "text-yellow-600"
                  }`}>
                    <div className="text-xs">BEST</div>
                    <div className="text-2xl">{highScore}</div>
                  </div>
                )}

                {/* Game Over Overlay */}
                {gameOver && (
                  <div className="absolute inset-0 bg-black bg-opacity-70 flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-4xl mb-2">💀</div>
                      <div className={`text-2xl font-bold font-['Press_Start_2P',cursive] mb-2 ${
                        isDarkMode ? "text-red-400" : "text-red-500"
                      }`}>
                        GAME OVER
                      </div>
                      <div className="text-white text-lg">Score: {Math.floor(score / 10)}</div>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex flex-col items-center gap-4 mt-6">
                <button
                  onClick={handleJump}
                  className={`px-8 py-3 text-sm font-bold font-['Press_Start_2P',cursive] border-2 rounded-sm transition-all duration-200 hover:-translate-y-1 active:scale-95 ${
                    gameActive && !gameOver
                      ? isDarkMode
                        ? "bg-green-700 border-green-500 text-white hover:bg-green-600"
                        : "bg-green-600 border-green-400 text-white hover:bg-green-500"
                      : isDarkMode
                      ? "bg-blue-700 border-blue-500 text-white hover:bg-blue-600"
                      : "bg-blue-600 border-blue-400 text-white hover:bg-blue-500"
                  }`}
                >
                  {!gameActive ? "START GAME" : gameOver ? "🔄 PLAY AGAIN" : "⬆️ JUMP (SPACE)"}
                </button>
                
                {!gameActive && !gameOver && highScore > 0 && (
                  <div className={`text-sm font-bold ${
                    isDarkMode ? "text-gray-400" : "text-gray-600"
                  }`}>
                    Your Best: {highScore}
                  </div>
                )}
              </div>
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

import { Routes, Route } from "react-router-dom";
import { useEffect, useRef } from "react";
import Sidebar from "./sidebar";
import Hub from "./pages/hub";
import Shop from "./pages/shop";
import Avatar from "./pages/avatar";
import Quest from "./pages/quest";
import Quiz from "./pages/quiz";
import Login from "./auth/login";
import Register from "./auth/register";
import { useAuth } from "./contexts/authContexts/auth";
import { useTheme } from "./components/theme";
import type { AuthContextType } from "./contexts/authContexts/auth";
import clickSfx from "./assets/Select.mp3";
import { MusicProvider, useMusic } from "./contexts/musicContext";

const AppContent = () => {
  const { userLoggedIn } = (useAuth() as AuthContextType);
  const { isDarkMode } = useTheme();
  const clickSoundRef = useRef<HTMLAudioElement | null>(null);
  const { isMuted, toggleMute } = useMusic();

  useEffect(() => {
    const audio = new Audio(clickSfx);
    audio.volume = 0.3;
    clickSoundRef.current = audio;

    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      // Play on common click targets (buttons, links, elements marked as clickable)
      const clickable = target.closest(
        "button, a, [role='button'], [data-click-sound], [data-clickable]"
      );
      if (!clickable) return;
      const sound = clickSoundRef.current;
      if (!sound) return;
      try {
        sound.currentTime = 0;
        sound.play();
      } catch {
        /* ignore playback errors */
      }
    };

    document.addEventListener("click", handleClick, true);

    return () => {
      document.removeEventListener("click", handleClick, true);
      audio.pause();
      audio.src = "";
      clickSoundRef.current = null;
    };
  }, []);
  
  const containerClass = userLoggedIn
    ? `grid grid-cols-[80px_1fr] md:grid-cols-[240px_1fr] transition-[width] duration-300 min-h-screen app-main-container ${isDarkMode ? 'dark-mode-bg' : 'bg-[#fafaff]'}`
    : `min-h-screen app-main-container ${isDarkMode ? 'dark-mode-bg' : 'bg-white'}`;
    
  return (
    <div className={containerClass}>
      {userLoggedIn && <Sidebar isBgMusicMuted={isMuted} toggleBgMusic={toggleMute} />}
      <div className="p-4">
        <Routes>
          <Route path="/" element={userLoggedIn ? <Hub /> : <Login />} />
          <Route path="/quest" element={userLoggedIn ? <Quest /> : <Login />} />
          <Route path="/quiz/:quizId" element={userLoggedIn ? <Quiz /> : <Login />} />
          <Route path="/shop" element={userLoggedIn ? <Shop /> : <Login />} />
          <Route path="/avatar" element={userLoggedIn ? <Avatar /> : <Login />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Routes>
      </div>
    </div>
  )
}

const App = () => {
  return (
    <MusicProvider>
      <AppContent />
    </MusicProvider>
  );
};

export default App
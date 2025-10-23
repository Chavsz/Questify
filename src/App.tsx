import { Routes, Route } from "react-router-dom";
import Sidebar from "./sidebar";
import Dashboard from "./dashboard";
import Login from "./auth/login";
import Register from "./auth/register";
import { useAuth } from "./contexts/authContexts/auth";
import { useTheme } from "./components/theme";
import type { AuthContextType } from "./contexts/authContexts/auth";

const App = () => {
  const { userLoggedIn } = (useAuth() as AuthContextType);
  const { isDarkMode } = useTheme();
  
  const containerClass = userLoggedIn
    ? `grid grid-cols-[80px_1fr] md:grid-cols-[240px_1fr] transition-width duration-300 min-h-screen ${isDarkMode ? 'dark-mode-bg' : 'bg-white'}`
    : `min-h-screen ${isDarkMode ? 'dark-mode-bg' : 'bg-white'}`;
    
  return (
    <div className={containerClass}>
      {userLoggedIn && <Sidebar />}
      <div className="p-4">
        <Routes>
          <Route path="/" element={userLoggedIn ? <Dashboard /> : <Login />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Routes>
      </div>
    </div>
  )
}

export default App
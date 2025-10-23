import { Routes, Route } from "react-router-dom";
import Sidebar from "./sidebar";
import Hub from "./pages/Hub";
import Shop from "./pages/shop";
import Avatar from "./pages/avatar";
import Quest from "./pages/Quest";
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
          <Route path="/" element={userLoggedIn ? <Hub /> : <Login />} />
          <Route path="/quest" element={userLoggedIn ? <Quest /> : <Login />} />
          <Route path="/shop" element={userLoggedIn ? <Shop /> : <Login />} />
          <Route path="/avatar" element={userLoggedIn ? <Avatar /> : <Login />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Routes>
      </div>
    </div>
  )
}

export default App
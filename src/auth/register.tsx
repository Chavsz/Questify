import { useState } from "react";
import { Navigate, Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/authContexts/auth";
import { doCreateUserWithEmailAndPassword } from "../auth";
import { type AuthContextType } from "../contexts/authContexts/auth";
import { createUser } from "../services/users";
import { useTheme } from "../components/theme";
import toast from "react-hot-toast";

const Register = () => {
  const navigate = useNavigate();
  const { userLoggedIn } = useAuth() as AuthContextType;
  const { isDarkMode } = useTheme();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isRegistering) return;

    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    setIsRegistering(true);
    try {
      // Create user with Firebase Auth
      const userCredential = await doCreateUserWithEmailAndPassword(email, password);
      const user = userCredential.user;
      
      // Save user data to Firestore collection
      await createUser({
        uid: user.uid,
        email: user.email || email,
        displayName: name || null,
        photoURL: user.photoURL || null,
        isActive: true,
        role: 'user', // Default role
        preferences: {
          theme: 'light',
          notifications: true
        }
      });
      
      toast.success("Account created successfully");
      navigate("/", { replace: true });
    } catch (err: unknown) {
      console.error("Registration error:", err);
      toast.error("Registration failed");
    } finally {
      setIsRegistering(false);
    }
  };

  if (userLoggedIn) return <Navigate to={"/"} replace={true} />;

  return (
    <div className={`min-h-screen w-full flex items-center justify-center p-4 ${
      isDarkMode ? 'bg-gray-900' : 'bg-[#fafaff]'
    }`}>
      <div className={`w-full max-w-md border-2 p-6 ${
        isDarkMode 
          ? 'bg-gray-800 border-amber-400' 
          : 'bg-white border-amber-500'
      }`}>
        <h2 className={`text-xl md:text-2xl font-bold text-center mb-6 font-['Press_Start_2P',cursive] tracking-[0.12em] ${
          isDarkMode ? 'text-[#ffd700]' : 'text-amber-600'
        }`}>
          ⚔ CREATE ACCOUNT
        </h2>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className={`block text-sm font-medium font-['Press_Start_2P',cursive] text-xs ${
              isDarkMode ? 'text-gray-300' : 'text-gray-600'
            }`}>
              FULL NAME
            </label>
            <input
              type="text"
              className={`w-full border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500 rounded-sm ${
                isDarkMode 
                  ? 'bg-gray-700 border-amber-400 text-white' 
                  : 'bg-white border-amber-500 text-gray-900'
              }`}
              placeholder="John Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="space-y-1">
            <label className={`block text-sm font-medium font-['Press_Start_2P',cursive] text-xs ${
              isDarkMode ? 'text-gray-300' : 'text-gray-600'
            }`}>
              EMAIL
            </label>
            <input
              type="email"
              className={`w-full border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500 rounded-sm ${
                isDarkMode 
                  ? 'bg-gray-700 border-amber-400 text-white' 
                  : 'bg-white border-amber-500 text-gray-900'
              }`}
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-1">
            <label className={`block text-sm font-medium font-['Press_Start_2P',cursive] text-xs ${
              isDarkMode ? 'text-gray-300' : 'text-gray-600'
            }`}>
              PASSWORD
            </label>
            <input
              type="password"
              className={`w-full border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500 rounded-sm ${
                isDarkMode 
                  ? 'bg-gray-700 border-amber-400 text-white' 
                  : 'bg-white border-amber-500 text-gray-900'
              }`}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <div className="space-y-1">
            <label className={`block text-sm font-medium font-['Press_Start_2P',cursive] text-xs ${
              isDarkMode ? 'text-gray-300' : 'text-gray-600'
            }`}>
              CONFIRM PASSWORD
            </label>
            <input
              type="password"
              className={`w-full border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500 rounded-sm ${
                isDarkMode 
                  ? 'bg-gray-700 border-amber-400 text-white' 
                  : 'bg-white border-amber-500 text-gray-900'
              }`}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>
          <button
            type="submit"
            disabled={isRegistering}
            className="w-full bg-linear-to-b from-[#ff6348] to-[#ff4757] border-2 border-[#c0392b] text-white rounded-sm py-2 font-['Press_Start_2P',cursive] text-xs disabled:opacity-60 transition-transform duration-300 hover:-translate-y-1"
          >
            {isRegistering ? "CREATING ACCOUNT..." : "CREATE ACCOUNT"}
          </button>
        </form>
        <p className={`text-sm text-center mt-4 font-['Press_Start_2P',cursive] text-xs ${
          isDarkMode ? 'text-gray-400' : 'text-gray-600'
        }`}>
          ALREADY HAVE AN ACCOUNT?{" "}
          <Link
            to="/login"
            className={`hover:underline font-medium ${
              isDarkMode ? 'text-[#ffd700]' : 'text-amber-600'
            }`}
          >
            LOGIN
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;

import { useState } from "react";
import { useAuth } from "../contexts/authContexts/auth";
import { doSignInWithEmailAndPassword, doSignInWithGoogle } from "../auth";
import { Navigate, Link } from "react-router-dom";
import { type AuthContextType } from "../contexts/authContexts/auth";
import { useTheme } from "../components/theme";
import toast from "react-hot-toast";

const Login = () => {
  const { userLoggedIn } = useAuth() as AuthContextType;
  const { isDarkMode } = useTheme();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    try {
      await doSignInWithEmailAndPassword(email, password);
      toast.success("Logged in successfully");
    } catch (err: unknown) {
      toast.error("Failed to login. Check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    if (loading) return;
    setLoading(true);
    try {
      await doSignInWithGoogle();
      toast.success("Logged in with Google");
    } catch (err: unknown) {
      toast.error("Google sign-in failed");
    } finally {
      setLoading(false);
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
        <h2 className={`text-xl md:text-2xl font-bold flex items-center justify-center mb-6 font-['Press_Start_2P',cursive] tracking-[0.12em] ${
          isDarkMode ? 'text-[#ffd700]' : 'text-amber-600'
        }`}>
          ⚔ QUESTIFY
        </h2>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className={`block text-sm font-medium font-['Press_Start_2P',cursive] ${
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
            <label className={`block text-sm font-medium font-['Press_Start_2P',cursive] ${
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
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-linear-to-b from-[#ff6348] to-[#ff4757] border-2 border-[#c0392b] text-white rounded-sm py-2 font-['Press_Start_2P',cursive] text-xs disabled:opacity-60 transition-transform duration-300 hover:-translate-y-1"
          >
            {loading ? "SIGNING IN..." : "SIGN IN"}
          </button>
        </form>

        <div className="my-4 flex items-center gap-3">
          <div className={`h-px flex-1 border-t-2 ${
            isDarkMode ? 'border-amber-400' : 'border-amber-500'
          }`} />
          <span className={`text-xs font-['Press_Start_2P',cursive] ${
            isDarkMode ? 'text-gray-400' : 'text-gray-600'
          }`}>OR</span>
          <div className={`h-px flex-1 border-t-2 ${
            isDarkMode ? 'border-amber-400' : 'border-amber-500'
          }`} />
        </div>

        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          className={`w-full border rounded-sm py-2 font-['Press_Start_2P',cursive] text-xs disabled:opacity-60 transition-transform duration-300 hover:-translate-y-1 ${
            isDarkMode 
              ? 'border-amber-400 bg-gray-700 hover:bg-gray-600 text-white' 
              : 'border-amber-500 bg-white hover:bg-gray-50 text-gray-900'
          }`}
        >
          CONTINUE WITH GOOGLE
        </button>

        <p className={`text-sm text-center mt-4 font-['Press_Start_2P',cursive] ${
          isDarkMode ? 'text-gray-400' : 'text-gray-600'
        }`}>
          DON&apos;T HAVE AN ACCOUNT?{" "}
          <Link
            to="/register"
            className={`hover:underline font-medium ${
              isDarkMode ? 'text-[#ffd700]' : 'text-amber-600'
            }`}
          >
            REGISTER
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;

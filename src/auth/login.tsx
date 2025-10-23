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
    <div className={`min-h-screen w-full flex items-center justify-center ${isDarkMode ? 'dark-mode-bg' : 'bg-[#fafaff]'}`}>
      <div className={`w-full max-w-md rounded-xl border p-6 shadow-sm ${
        isDarkMode 
          ? 'dark-mode-card dark-mode-border' 
          : 'bg-white border-[#e8f6e5]'
      }`}>
        <h2 className={`text-2xl font-bold text-center mb-6 ${
          isDarkMode ? 'text-[#4f46e5]' : 'text-indigo-600'
        }`}>
          Questify
        </h2>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className={`block text-sm font-medium ${
              isDarkMode ? 'dark-mode-text-secondary' : 'text-[#4b5563]'
            }`}>
              Email
            </label>
            <input
              type="email"
              className={`w-full rounded-md border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                isDarkMode 
                  ? 'dark-mode-input dark-mode-border dark-mode-text' 
                  : 'border-gray-300'
              }`}
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-1">
            <label className={`block text-sm font-medium ${
              isDarkMode ? 'dark-mode-text-secondary' : 'text-[#4b5563]'
            }`}>
              Password
            </label>
            <input
              type="password"
              className={`w-full rounded-md border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                isDarkMode 
                  ? 'dark-mode-input dark-mode-border dark-mode-text' 
                  : 'border-gray-300'
              }`}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white rounded-md py-2 font-semibold"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <div className="my-4 flex items-center gap-3">
          <div className={`h-px flex-1 ${isDarkMode ? 'bg-gray-600' : 'bg-gray-200'}`} />
          <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>OR</span>
          <div className={`h-px flex-1 ${isDarkMode ? 'bg-gray-600' : 'bg-gray-200'}`} />
        </div>

        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          className={`w-full border rounded-md py-2 font-medium disabled:opacity-60 ${
            isDarkMode 
              ? 'dark-mode-border dark-mode-input hover:bg-gray-600 dark-mode-text' 
              : 'border-gray-300 hover:bg-gray-50 text-[#374151]'
          }`}
        >
          Continue with Google
        </button>

        <p className={`text-sm text-center mt-4 ${
          isDarkMode ? 'dark-mode-text-secondary' : 'text-[#6b7280]'
        }`}>
          Don&apos;t have an account?{" "}
          <Link
            to="/register"
            className="text-indigo-600 hover:underline font-medium"
          >
            Register
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;

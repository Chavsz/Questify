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
    <div className={`min-h-screen w-full flex items-center justify-center ${isDarkMode ? 'dark-mode-bg' : 'bg-[#fafaff]'}`}>
      <div className={`w-full max-w-md rounded-xl border p-6 shadow-sm ${
        isDarkMode 
          ? 'dark-mode-card dark-mode-border' 
          : 'bg-white border-[#e8f6e5]'
      }`}>
        <h2 className={`text-2xl font-bold text-center mb-6 ${
          isDarkMode ? 'text-[#4f46e5]' : 'text-indigo-600'
        }`}>
          Create account
        </h2>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className={`block text-sm font-medium ${
              isDarkMode ? 'dark-mode-text-secondary' : 'text-[#4b5563]'
            }`}>
              Full Name
            </label>
            <input
              type="text"
              className={`w-full rounded-md border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                isDarkMode 
                  ? 'dark-mode-input dark-mode-border dark-mode-text' 
                  : 'border-gray-300'
              }`}
              placeholder="John Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
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
          <div className="space-y-1">
            <label className={`block text-sm font-medium ${
              isDarkMode ? 'dark-mode-text-secondary' : 'text-[#4b5563]'
            }`}>
              Confirm Password
            </label>
            <input
              type="password"
              className={`w-full rounded-md border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                isDarkMode 
                  ? 'dark-mode-input dark-mode-border dark-mode-text' 
                  : 'border-gray-300'
              }`}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>
          <button
            type="submit"
            disabled={isRegistering}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white rounded-md py-2 font-semibold"
          >
            {isRegistering ? "Creating account..." : "Create account"}
          </button>
        </form>
        <p className={`text-sm text-center mt-4 ${
          isDarkMode ? 'dark-mode-text-secondary' : 'text-[#6b7280]'
        }`}>
          Already have an account?{" "}
          <Link
            to="/login"
            className="text-indigo-600 hover:underline font-medium"
          >
            Login
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;

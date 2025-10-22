import { useState } from "react";
import { useAuth } from "../contexts/authContexts/auth";
import { doSignInWithEmailAndPassword, doSignInWithGoogle } from "../auth";
import { Navigate, Link } from "react-router-dom";
import { type AuthContextType } from "../contexts/authContexts/auth";
import toast from "react-hot-toast";

const Login = () => {
  const { userLoggedIn } = useAuth() as AuthContextType;
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
    <div className="min-h-screen w-full flex items-center justify-center bg-[#f7fffa]">
      <div className="w-full max-w-md bg-white rounded-xl border border-[#e8f6e5] p-6 shadow-sm">
        <h2 className="text-2xl font-bold text-center text-green-600 mb-6">PROJECT SAMSON</h2>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="block text-sm font-medium text-[#4b5563]">Email</label>
            <input
              type="email"
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-1">
            <label className="block text-sm font-medium text-[#4b5563]">Password</label>
            <input
              type="password"
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"

              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white rounded-md py-2 font-semibold"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <div className="my-4 flex items-center gap-3">
          <div className="h-px bg-gray-200 flex-1" />
          <span className="text-xs text-gray-500">OR</span>
          <div className="h-px bg-gray-200 flex-1" />
        </div>

        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full border border-gray-300 hover:bg-gray-50 disabled:opacity-60 text-[#374151] rounded-md py-2 font-medium"
        >
          Continue with Google
        </button>

        <p className="text-sm text-center text-[#6b7280] mt-4">
          Don&apos;t have an account?{" "}
          <Link to="/register" className="text-green-700 hover:underline font-medium">
            Register
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
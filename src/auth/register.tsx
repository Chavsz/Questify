import { useState } from "react";
import { Navigate, Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/authContexts/auth";
import { doCreateUserWithEmailAndPassword } from "../auth";
import { type AuthContextType } from "../contexts/authContexts/auth";
import toast from "react-hot-toast";

const Register = () => {
  const navigate = useNavigate();
  const { userLoggedIn } = useAuth() as AuthContextType;
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
      await doCreateUserWithEmailAndPassword(email, password);
      toast.success("Account created");
      navigate("/", { replace: true });
    } catch (err: unknown) {
      toast.error("Registration failed");
    } finally {
      setIsRegistering(false);
    }
  };

  if (userLoggedIn) return <Navigate to={"/"} replace={true} />;

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#f7fffa]">
      <div className="w-full max-w-md bg-white rounded-xl border border-[#e8f6e5] p-6 shadow-sm">
        <h2 className="text-2xl font-bold text-center text-green-600 mb-6">Create account</h2>
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
          <div className="space-y-1">
            <label className="block text-sm font-medium text-[#4b5563]">Confirm Password</label>
            <input
              type="password"
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
             
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>
          <button
            type="submit"
            disabled={isRegistering}
            className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white rounded-md py-2 font-semibold"
          >
            {isRegistering ? "Creating account..." : "Create account"}
          </button>
        </form>
        <p className="text-sm text-center text-[#6b7280] mt-4">
          Already have an account?{" "}
          <Link to="/login" className="text-green-700 hover:underline font-medium">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
import { useState } from "react";
import { Brain, Eye, EyeOff, ArrowRight, Loader2 } from "lucide-react";
import { useLogin } from "../hooks/useLogin";
import { motion } from "motion/react";
import { BackButton } from "../components/ui/BackButton";
import { Button } from "../components/ui/Button";
import { Heading } from "../components/ui/Heading";

export function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const { login, loading, error, isSuccess } = useLogin();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    login({
      email: formData.email,
      password: formData.password,
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-[480px] bg-white rounded-2xl shadow-xl border border-gray-100 p-8 relative z-10"
      >
        <BackButton className="mb-6" />
        <div className="flex items-center mb-8">
          <div className="w-12 h-12  rounded-xl flex items-center justify-center">
            <Brain className="w-7 h-7 text-[#2563EB]" />
          </div>
          <span className="text-[#111827] text-[26px] font-bold tracking-tight">
            SmartShift
          </span>
        </div>

        <div className="mb-8">
          <Heading
            level="h1"
            className="text-[28px] font-bold text-[#111827] mb-2 tracking-tight"
          >
            Welcome back
          </Heading>
          <p className="text-[#6B7280] text-[15px]">
            Sign in to your account to continue
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label
              htmlFor="email"
              className="block text-[#374151] text-[14px] font-semibold mb-2"
            >
              Email Address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              value={formData.email}
              onChange={handleChange}
              placeholder="name@company.com"
              className="w-full px-4 py-3.5 text-[15px] text-[#111827] bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] focus:bg-white transition-all placeholder:text-[#9CA3AF]"
              autoComplete="off"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label
                htmlFor="password"
                className="block text-[#374151] text-[14px] font-semibold"
              >
                Password
              </label>
            </div>
            <div className="relative">
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                required
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter your password"
                className="w-full px-4 py-3.5 pr-12 text-[15px] text-[#111827] bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] focus:bg-white transition-all placeholder:text-[#9CA3AF]"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#2563EB] transition-colors"
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 bg-red-50/50 border border-red-100 rounded-xl flex items-center gap-3"
            >
              <div className="w-2 h-2 bg-red-500 rounded-full" />
              <p className="text-red-600 text-[14px] font-medium">{error}</p>
            </motion.div>
          )}

          {isSuccess && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 bg-green-50/50 border border-green-100 rounded-xl flex items-center gap-3"
            >
              <div className="w-2 h-2 bg-green-500 rounded-full" />
              <p className="text-green-600 text-[14px] font-medium">
                Login successful!
              </p>
            </motion.div>
          )}

          <Button
            type="submit"
            disabled={loading}
            size="lg"
            variant="primary"
            className="w-full h-12 mt-2 text-[15px] font-semibold shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 transition-all rounded-xl flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Signing in...
              </>
            ) : (
              <>
                Sign In
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </Button>
        </form>
      </motion.div>
    </div>
  );
}

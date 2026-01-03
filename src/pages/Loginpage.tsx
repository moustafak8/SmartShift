import { useState } from "react";
import { Brain, Eye, EyeOff, ArrowRight, Loader2, Check } from "lucide-react";
import { motion } from "motion/react";
import { BackButton } from "../components/ui/BackButton";
import { Button } from "../components/ui/Button";
import { Heading } from "../components/ui/Heading";
import { Card } from "../components/ui/Card";
import { IconText } from "../components/ui/IconText";

export function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));
    console.log("Login attempt:", formData);
    setIsLoading(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  return (
    <div className="min-h-screen bg-white flex">
      <div className="flex-1 flex items-center justify-center px-4 py-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-[420px]"
        >
          <BackButton className="mb-6" />
          <div className="flex items-center gap-3 mb-8">
            <Brain className="w-10 h-10 text-[#2563EB]" />
            <span className="text-black text-[24px] font-bold">SmartShift</span>
          </div>
          <div className="mb-6">
            <Heading level="h1" className="text-[32px] mb-2">
              Welcome back
            </Heading>
            <p className="text-[#6B7280] text-[16px]">
              Sign in to your account to continue
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label
                htmlFor="email"
                className="block text-[#111827] text-[14px] font-medium mb-2"
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
                className="w-full px-4 py-3 text-[14px] text-[#111827] border border-[#D1D5DB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent transition-all placeholder:text-[#9CA3AF]"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-[#111827] text-[14px] font-medium mb-2"
              >
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
                  className="w-full px-4 py-3 pr-12 text-[14px] text-[#111827] border border-[#D1D5DB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent transition-all placeholder:text-[#9CA3AF]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#6B7280] hover:text-[#2563EB] transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              size="lg"
              variant="primary"
              className="disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 group"
            >
              {isLoading ? (
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
          <div className="text-center mt-6">
            <p className="text-[#6B7280] text-[14px]">
              Don't have an account?{" "}
              <a
                href="#signup"
                className="text-[#2563EB] font-medium hover:text-[#1D4ED8] transition-colors"
              >
                Start free trial
              </a>
            </p>
          </div>
        </motion.div>
      </div>
      {/* Right Side - Info Card */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="hidden lg:flex flex-1 bg-gradient-to-br from-[#2563EB] to-[#1D4ED8] items-center justify-center p-12"
      >
        <div className="max-w-[500px]">
          <Card className="bg-white/10 backdrop-blur-sm border border-white/20">
            <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center mb-6">
              <Brain className="w-10 h-10 text-white" />
            </div>
            <Heading level="h2" className="text-white text-[32px] mb-4">
              AI-Powered Shift Management
            </Heading>
            <p className="text-white/90 text-[16px] leading-relaxed mb-8">
              Optimize your workforce scheduling with intelligent automation.
              SmartShift reduces scheduling conflicts by 90% and saves managers
              15+ hours per week.
            </p>
            <div className="space-y-4">
              {[
                "Real-time shift updates and notifications",
                "Predictive analytics for optimal staffing",
                "Wellness monitoring and burnout prevention",
              ].map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: 0.6 + index * 0.1 }}
                >
                  <IconText
                    icon={Check}
                    layout="horizontal"
                    iconSize="sm"
                    iconClassName="text-white bg-white/20 rounded-full p-1"
                    contentClassName="text-white text-[15px]"
                  >
                    {feature}
                  </IconText>
                </motion.div>
              ))}
            </div>
          </Card>
          <div className="grid grid-cols-3 gap-6 mt-10">
            {[
              { number: "90%", label: "Less Conflicts" },
              { number: "15h", label: "Time Saved/Week" },
              { number: "500+", label: "Happy Clients" },
            ].map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 1 + index * 0.1 }}
                className="text-center"
              >
                <Heading level="h3" className="text-white text-[28px] mb-1">
                  {stat.number}
                </Heading>
                <div className="text-white/80 text-[13px]">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
}

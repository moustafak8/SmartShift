import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { Menu, X } from "lucide-react";
import { Container, Button } from "../ui";
import logo2 from "../../assets/logo2.png";

export function Navigation() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  const navLinks = [
    { name: "Solutions", href: "#solutions" },
    { name: "Features", href: "#features" },
    { name: "Use Cases", href: "#healthcare" },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white shadow-navbar">
      <Container className="md:px-5">
        <div className="flex items-center justify-between h-navbar md:h-16">
          <div className="flex items-center ">
            <img
              src={logo2}
              alt="SmartShift logo"
              className="h-17 w-17 object-contain"
              draggable={false}
            />
            <span className="text-[20px] font-bold text-black">SmartShift</span>
          </div>

          <div className="hidden lg:flex items-center gap-8">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                className="text-[14px] font-medium text-[#6B7280] hover:text-[#2563EB] transition-colors"
              >
                {link.name}
              </a>
            ))}
          </div>
          <div className="flex items-center gap-4">
            <Button
              size="sm"
              className="hidden md:inline"
              onClick={() => navigate("/login")}
            >
              Sign In
            </Button>
            <button
              className="lg:hidden text-[#6B7280] hover:text-[#2563EB] p-2"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>
      </Container>
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "tween", duration: 0.3 }}
            className="fixed top-[64px] right-0 bottom-0 w-full shadow-lg lg:hidden z-40 bg-white"
          >
            <div className="p-6 space-y-4">
              {navLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  className="block text-[16px] font-medium py-2 text-[#6B7280] hover:text-[#2563EB] transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link.name}
                </a>
              ))}
              <Button size="lg" onClick={() => navigate("/login")}>
                Sign In
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}

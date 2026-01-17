import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Brain,
  Users,
  Calendar,
  Heart,
  RefreshCw,
  Lightbulb,
  FileText,
  Settings,
  Bell,
  LogOut,
  MessageSquare,
  X,
  Menu,
  Home,
  User,
} from "lucide-react";
import { Badge } from "./ui/Badge";
import { useAuth } from "../hooks/context/AuthContext";
import { useLogout } from "../hooks/useLogout";
import { cn } from "./ui/utils";

interface LayoutProps {
  children: React.ReactNode;
  notificationCount?: number;
}

interface NavigationItem {
  id: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  badge?: number | null;
  path: string;
}

const ManagerNavigationItems: NavigationItem[] = [
  {
    id: "dashboard",
    icon: LayoutDashboard,
    label: "Dashboard",
    badge: null,
    path: "/manager/dashboard",
  },
  {
    id: "team",
    icon: Users,
    label: "Team",
    badge: null,
    path: "/manager/team",
  },
  {
    id: "schedule",
    icon: Calendar,
    label: "Schedule",
    badge: null,
    path: "/manager/schedule",
  },
  {
    id: "wellness",
    icon: Heart,
    label: "Wellness",
    badge: null,
    path: "/manager/team-wellness",
  },
  {
    id: "rag-query",
    icon: MessageSquare,
    label: "AI Query",
    badge: null,
    path: "/manager/query",
  },
  {
    id: "swaps",
    icon: RefreshCw,
    label: "Shift Swaps",
    badge: 5,
    path: "/manager/swaps",
  },
  {
    id: "insights",
    icon: Lightbulb,
    label: "AI Insights",
    badge: 2,
    path: "/manager/insights",
  },
  {
    id: "reports",
    icon: FileText,
    label: "Reports",
    badge: null,
    path: "/manager/reports",
  },
  {
    id: "settings",
    icon: Settings,
    label: "Settings",
    badge: null,
    path: "/manager/settings",
  },
];

const EmployeeNavigationItems: NavigationItem[] = [
  {
    id: "dashboard",
    icon: Home,
    label: "Dashboard",
    badge: null,
    path: "/employee/dashboard",
  },
  {
    id: "schedule",
    icon: Calendar,
    label: "Schedule",
    badge: null,
    path: "/employee/schedule",
  },
  {
    id: "swaps",
    icon: RefreshCw,
    label: "Shift Swaps",
    badge: null,
    path: "/employee/swap-request",
  },
  {
    id: "wellness",
    icon: Heart,
    label: "Wellness",
    badge: null,
    path: "/employee/wellness",
  },
  {
    id: "fatigue",
    icon: Heart,
    label: "Wellness Score",
    badge: null,
    path: "/employee/score",
  },
  {
    id: "profile",
    icon: User,
    label: "Profile",
    badge: null,
    path: "/employee/profile",
  },
];

export function Layout({ children, notificationCount = 8 }: LayoutProps) {
  const [isOpen, setIsOpen] = useState(true);
  const { isManager, user } = useAuth();
  const { logout, loading: logoutLoading } = useLogout();
  const location = useLocation();

  const navigationItems = isManager()
    ? ManagerNavigationItems
    : EmployeeNavigationItems;
  const getUserInitials = () => {
    if (!user?.full_name) return "U";

    const nameParts = user.full_name.trim().split(" ");
    if (nameParts.length === 1) {
      return nameParts[0].charAt(0).toUpperCase();
    }
    const firstInitial = nameParts[0].charAt(0).toUpperCase();
    const lastInitial = nameParts[nameParts.length - 1].charAt(0).toUpperCase();
    return firstInitial + lastInitial;
  };

  const handleToggle = () => {
    setIsOpen(!isOpen);
  };

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="flex h-screen bg-white">
      <button
        onClick={handleToggle}
        className="fixed top-4 left-4 z-50 lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
        aria-label="Open menu"
      >
        <Menu className="w-6 h-6 text-black" />
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={handleToggle}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:relative top-0 left-0 h-full bg-white border-r border-[#E5E7EB] z-50 transition-all duration-300 flex flex-col overflow-hidden ${isOpen
            ? "translate-x-0 lg:w-64"
            : "-translate-x-full lg:translate-x-0 lg:w-0 lg:border-r-0"
          } w-64`}
      >
        <div
          className={`${isOpen ? "opacity-100" : "lg:opacity-0"
            } transition-opacity duration-300 flex flex-col h-full w-64`}
        >
          <button
            onClick={handleToggle}
            className="absolute top-4 right-4 lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Close menu"
          >
            <X className="w-6 h-6 text-black" />
          </button>

          <div className="p-6 border-b border-border">
            <div className="flex items-center gap-3">
              <Brain className="w-10 h-10 text-[#2563EB]" />
              <div>
                <h1 className="font-bold text-lg">SmartShift</h1>
              </div>
            </div>
          </div>

          <nav className="flex-1 p-4 overflow-y-auto">
            <div className="space-y-1">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.id}
                    to={item.path}
                    onClick={() => {
                      if (window.innerWidth < 1024) {
                        handleToggle();
                      }
                    }}
                    className={cn(
                      "w-full flex items-center justify-between px-4 py-3 rounded-lg transition-colors text-left relative",
                      isActive
                        ? "bg-[#EFF6FF] text-[#3B82F6] font-medium"
                        : "text-[#6B7280] hover:bg-[#F0F9FF]"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="w-5 h-5 flex-shrink-0" />
                      <span>{item.label}</span>
                    </div>
                    {item.badge && (
                      <Badge className="bg-[#3B82F6] text-white text-xs px-2 py-0 h-5">
                        {item.badge}
                      </Badge>
                    )}
                  </Link>
                );
              })}
            </div>
          </nav>

          <div className="p-4 border-t border-[#E5E7EB]">
            <button
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-lg text-[#6B7280] hover:bg-[#F0F9FF] transition-colors text-left",
                "disabled:opacity-50 disabled:cursor-not-allowed"
              )}
              onClick={handleLogout}
              disabled={logoutLoading}
            >
              <LogOut className="w-5 h-5 flex-shrink-0" />
              <span>{logoutLoading ? "Logging out..." : "Logout"}</span>
            </button>
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b border-[#E5E7EB] px-6 py-4 flex items-center justify-between">
          <button
            onClick={handleToggle}
            className="hidden lg:flex p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Toggle sidebar"
          >
            <Menu className="w-6 h-6 text-black" />
          </button>

          <div className="flex items-center gap-4 ml-auto">
            <button className="relative p-2 hover:bg-[#F0F9FF] rounded-lg transition-colors">
              <Bell className="w-5 h-5 text-[#6B7280]" />
              {notificationCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-[#EF4444] text-white text-xs rounded-full flex items-center justify-center">
                  {notificationCount}
                </span>
              )}
            </button>

            <button className="w-10 h-10 bg-[#6366F1] rounded-full flex items-center justify-center text-white font-medium hover:bg-[#4F46E5] transition-colors">
              {getUserInitials()}
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-auto bg-[#F9FAFB]">{children}</main>
      </div>
    </div>
  );
}

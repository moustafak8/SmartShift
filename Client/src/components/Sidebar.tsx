import React, { useState, useMemo } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Calendar,
  Heart,
  RefreshCw,
  Lightbulb,
  FileText,
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
import { usePendingSwapsCount } from "../hooks/Manager/useManagerSwaps";
import { useUnreadCount } from "../hooks/useNotification";
import { cn } from "./ui/utils";
import logo2 from "../assets/logo2.png";

interface LayoutProps {
  children: React.ReactNode;
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
    badge: null,
    path: "/manager/swaps",
  },
  {
    id: "insights",
    icon: Lightbulb,
    label: "AI Insights",
    badge: null,
    path: "/manager/insights",
  },
  {
    id: "reports",
    icon: FileText,
    label: "Reports",
    badge: null,
    path: "/manager/reports",
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

export function Layout({ children }: LayoutProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const { isManager, user, departmentId } = useAuth();
  const { logout, loading: logoutLoading } = useLogout();
  const location = useLocation();
  const navigate = useNavigate();

  const { count: notificationCount } = useUnreadCount(user?.id);

  const { count: pendingSwapsCount } = usePendingSwapsCount(
    isManager() ? departmentId || undefined : undefined,
  );

  const navigationItems = useMemo(() => {
    if (isManager()) {
      return ManagerNavigationItems.map((item) => {
        if (item.id === "swaps") {
          return {
            ...item,
            badge: pendingSwapsCount > 0 ? pendingSwapsCount : null,
          };
        }
        return item;
      });
    }
    return EmployeeNavigationItems;
  }, [isManager, pendingSwapsCount]);
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

  const toggleProfileMenu = () => {
    setIsProfileOpen((prev) => !prev);
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
        className={`fixed lg:relative top-0 left-0 h-full bg-white border-r border-[#E5E7EB] shadow-sm z-50 transition-all duration-300 flex flex-col overflow-hidden ${
          isOpen
            ? "translate-x-0 lg:w-68"
            : "-translate-x-full lg:translate-x-0 lg:w-0 lg:border-r-0"
        } w-68`}
      >
        <div
          className={`${
            isOpen ? "opacity-100" : "lg:opacity-0"
          } transition-opacity duration-300 flex flex-col h-full w-68`}
        >
          <button
            onClick={handleToggle}
            className="absolute top-4 right-4 lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Close menu"
          >
            <X className="w-6 h-6 text-black" />
          </button>

          <div className="px-6 py-4 border-b border-[#E5E7EB] bg-white">
            <div className="flex items-center -ml-1">
              <img
                src={logo2}
                alt="SmartShift logo"
                className="h-15 w-15 object-contain"
                draggable={false}
              />
              <div className="-ml-2">
                <h1 className="font-bold text-[18px] text-[#0F172A]">
                  SmartShift
                </h1>
                <p className="text-sm text-[#4B5563] leading-snug">
                  Schedule, wellness, clarity
                </p>
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
                      "w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all text-left relative border",
                      isActive
                        ? "bg-[#EFF6FF] text-[#1D4ED8] border-[#DBEAFE] shadow-sm"
                        : "text-[#6B7280] border-transparent hover:bg-[#F8FAFC] hover:border-[#E5E7EB] hover:text-[#111827]",
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          "w-8 h-8 rounded-lg flex items-center justify-center",
                          isActive
                            ? "bg-[#DBEAFE] text-[#1D4ED8]"
                            : "bg-[#F3F4F6] text-[#6B7280]",
                        )}
                      >
                        <Icon className="w-4 h-4 flex-shrink-0" />
                      </div>
                      <span className="font-semibold text-[15px] text-[#0F172A]">
                        {item.label}
                      </span>
                    </div>
                    {item.badge && (
                      <Badge className="bg-[#1D4ED8] text-white text-[11px] px-2 py-0 h-5">
                        {item.badge}
                      </Badge>
                    )}
                  </Link>
                );
              })}
            </div>
          </nav>
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

          <div className="flex items-center gap-4 ml-auto relative">
            <button
              onClick={() => navigate("/notifications")}
              className="relative p-2 hover:bg-[#F0F9FF] rounded-lg transition-colors"
              aria-label="Notifications"
            >
              <Bell className="w-5 h-5 text-[#6B7280]" />
              {notificationCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-[#EF4444] text-white text-xs rounded-full flex items-center justify-center">
                  {notificationCount > 9 ? "9+" : notificationCount}
                </span>
              )}
            </button>

            <div className="relative">
              <button
                onClick={toggleProfileMenu}
                className="w-10 h-10 bg-[#1D4ED8] rounded-full flex items-center justify-center text-white font-semibold hover:bg-[#1E40AF] transition-colors shadow-sm"
                aria-label="Profile menu"
              >
                {getUserInitials()}
              </button>

              {isProfileOpen && (
                <div className="absolute right-0 mt-2 w-52 rounded-lg border border-[#E5E7EB] bg-white shadow-lg p-3 z-50">
                  <div className="mb-3">
                    <p className="text-sm font-semibold text-[#111827]">
                      {user?.full_name || "Account"}
                    </p>
                    <p className="text-xs text-[#6B7280] truncate">
                      {user?.email || ""}
                    </p>
                  </div>
                  <button
                    onClick={handleLogout}
                    disabled={logoutLoading}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-[#EF4444] hover:bg-[#FEF2F2] text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <LogOut className="w-4 h-4" />
                    {logoutLoading ? "Logging out..." : "Logout"}
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-auto bg-[#F9FAFB]">{children}</main>
      </div>
    </div>
  );
}

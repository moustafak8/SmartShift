import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Clock,
  Heart,
  RefreshCw,
  Calendar,
  Activity,
  Moon,
  Sun,
  Sunset,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  Loader2,
  Zap,
  BarChart3,
  CalendarDays,
  CheckSquare,
  Timer,
  Coffee,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import { Layout } from "../../components/Sidebar";
import { useAuth } from "../../hooks/context/AuthContext";
import {
  useScoreDetails,
  useMonthlyScores,
} from "../../hooks/Employee/useScoreDetails";
import { useScheduleAssignments } from "../../hooks/Employee/useScheduleAssignments";
import { useIncomingSwaps } from "../../hooks/Employee/useShiftSwap";

export function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { scoreData, isLoading: isScoreLoading } = useScoreDetails();
  const { monthlyScores, isLoading: isMonthlyScoresLoading } =
    useMonthlyScores();
  const { swaps: incomingSwaps, isLoading: isSwapsLoading } =
    useIncomingSwaps();
  const getWeekStart = (date: Date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff));
  };

  const formatDateForAPI = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const currentWeekStart = getWeekStart(new Date());
  const { weekAssignments, isLoading: isScheduleLoading } =
    useScheduleAssignments(formatDateForAPI(currentWeekStart));

  
  const isLoading =
    isScoreLoading ||
    isScheduleLoading ||
    isSwapsLoading ||
    isMonthlyScoresLoading;


  const firstName = user?.full_name?.split(" ")[0] || "there";

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  
  const nextShift = useMemo(() => {
    if (!weekAssignments?.days) return null;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const sortedDates = Object.keys(weekAssignments.days).sort();

    for (const dateStr of sortedDates) {
      const shiftDate = new Date(dateStr);
      shiftDate.setHours(0, 0, 0, 0);

      if (shiftDate >= today) {
        const dayData = weekAssignments.days[dateStr];

       
        if (dayData.day.length > 0) {
          return {
            date: shiftDate,
            type: "day",
            label: dayData.labels.day,
            department: dayData.day[0].department_name,
          };
        }
        if (dayData.evening.length > 0) {
          return {
            date: shiftDate,
            type: "evening",
            label: dayData.labels.evening,
            department: dayData.evening[0].department_name,
          };
        }
        if (dayData.night.length > 0) {
          return {
            date: shiftDate,
            type: "night",
            label: dayData.labels.night,
            department: dayData.night[0].department_name,
          };
        }
      }
    }
    return null;
  }, [weekAssignments]);

  
  const getHoursUntilShift = () => {
    if (!nextShift) return null;
    const now = new Date();
    const shiftDateTime = new Date(nextShift.date);
    const startTimeMatch = nextShift.label.match(
      /^(\d{1,2}):(\d{2})\s*(AM|PM)/i,
    );
    if (startTimeMatch) {
      let hours = parseInt(startTimeMatch[1]);
      const minutes = parseInt(startTimeMatch[2]);
      const ampm = startTimeMatch[3].toUpperCase();
      if (ampm === "PM" && hours !== 12) hours += 12;
      if (ampm === "AM" && hours === 12) hours = 0;
      shiftDateTime.setHours(hours, minutes, 0, 0);
    }
    const diff = shiftDateTime.getTime() - now.getTime();
    if (diff < 0) return null;
    return Math.floor(diff / (1000 * 60 * 60));
  };
  const weekOverview = useMemo(() => {
    const days: Array<{
      day: string;
      date: string;
      shift: string | null;
      hours: number;
      status: "completed" | "upcoming" | "off";
      fullDate: Date;
    }> = [];

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    for (let i = 0; i < 7; i++) {
      const date = new Date(currentWeekStart);
      date.setDate(date.getDate() + i);
      const dateStr = formatDateForAPI(date);
      const dayData = weekAssignments?.days?.[dateStr];

      let shift: string | null = null;
      let hours = 0;

      if (dayData) {
        if (dayData.day.length > 0) {
          shift = "day";
          hours = 8;
        } else if (dayData.evening.length > 0) {
          shift = "evening";
          hours = 8;
        } else if (dayData.night.length > 0) {
          shift = "night";
          hours = 8;
        }
      }

      let status: "completed" | "upcoming" | "off" = "off";
      if (shift) {
        status = date < today ? "completed" : "upcoming";
      }

      days.push({
        day: dayNames[date.getDay()],
        date: String(date.getDate()),
        shift,
        hours,
        status,
        fullDate: date,
      });
    }

    return days;
  }, [weekAssignments, currentWeekStart]);

  const weekStats = useMemo(() => {
    let totalHours = 0;
    let completedShifts = 0;
    let upcomingShifts = 0;
    let daysOff = 0;

    weekOverview.forEach((day) => {
      if (day.status === "completed") {
        completedShifts++;
        totalHours += day.hours;
      } else if (day.status === "upcoming") {
        upcomingShifts++;
        totalHours += day.hours;
      } else {
        daysOff++;
      }
    });

    return { totalHours, completedShifts, upcomingShifts, daysOff };
  }, [weekOverview]);

  const wellnessTrend = useMemo(() => {
    if (
      !monthlyScores ||
      !Array.isArray(monthlyScores.scores) ||
      monthlyScores.scores.length === 0
    ) {
      const today = new Date();
      return Array.from({ length: 7 }, (_, i) => {
        const d = new Date(today);
        d.setDate(d.getDate() - (6 - i));
        return {
          day: d.toLocaleDateString("en-US", { weekday: "short" }),
          fullDate: d.toISOString(),
          score: Math.max(
            0,
            Math.min(
              100,
              (scoreData?.total_score || 50) + (Math.random() * 10 - 5),
            ),
          ),
          risk: scoreData?.risk_level || "low",
        };
      });
    }

    const sortedScores = [...monthlyScores.scores].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    );
    return sortedScores.slice(-7).map((item) => ({
      day: new Date(item.date).toLocaleDateString("en-US", {
        weekday: "short",
      }),
      fullDate: item.date,
      score: item.total_score,
      risk: item.risk_level,
    }));
  }, [monthlyScores, scoreData]);

  const getShiftIcon = (shift: string | null) => {
    if (!shift) return null;
    if (shift === "day") return <Sun className="w-4 h-4" />;
    if (shift === "evening") return <Sunset className="w-4 h-4" />;
    if (shift === "night") return <Moon className="w-4 h-4" />;
    return null;
  };

  const getShiftColor = (shift: string | null, status: string) => {
    if (status === "completed") return "bg-[#F3F4F6] text-[#6B7280]";
    if (status === "off")
      return "bg-white border-2 border-dashed border-[#E5E7EB] text-[#9CA3AF]";
    if (shift === "day") return "bg-[#3B82F6] text-white";
    if (shift === "evening") return "bg-[#8B5CF6] text-white";
    if (shift === "night") return "bg-[#6366F1] text-white";
    return "bg-[#F3F4F6]";
  };

  const wellnessScore = scoreData?.total_score ?? 0;

  const getWellnessStatus = (score: number) => {
    if (score < 30)
      return {
        label: "Low Risk",
        color: "#10B981",
        bgColor: "bg-[#DCFCE7]",
        textColor: "text-[#166534]",
        icon: CheckCircle,
      };
    if (score < 70)
      return {
        label: "Medium Risk",
        color: "#F59E0B",
        bgColor: "bg-[#FEF3C7]",
        textColor: "text-[#92400E]",
        icon: AlertTriangle,
      };
    return {
      label: "High Risk",
      color: "#EF4444",
      bgColor: "bg-[#FEE2E2]",
      textColor: "text-[#991B1B]",
      icon: AlertTriangle,
    };
  };

  const wellnessStatus = getWellnessStatus(wellnessScore);
  const hoursUntilShift = getHoursUntilShift();

  const pendingSwapsCount =
    incomingSwaps?.filter((swap) => swap.status === "pending").length ?? 0;

  const handleViewSchedule = () => navigate("/employee/schedule");
  const handleViewFatigueDetail = () => navigate("/employee/score");
  const handleBrowseSwaps = () => navigate("/employee/swap-request");

  const formatNextShiftDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      month: "short",
      day: "numeric",
    });
  };

  const upcomingShiftsList = useMemo(() => {
    return weekOverview
      .filter((day) => day.status === "upcoming" && day.shift)
      .slice(0, 2)
      .map((day) => ({
        ...day,
        timeLabel:
          day.shift === "day"
            ? "8:00 AM - 4:00 PM"
            : day.shift === "evening"
              ? "4:00 PM - 12:00 AM"
              : "12:00 AM - 8:00 AM",
      }));
  }, [weekOverview]);

  return (
    <Layout>
      <div className="bg-white min-h-screen">
        <div className="border-b border-[#E5E7EB] bg-white">
          <div className="px-6 py-4">
            <h1 className="text-2xl font-semibold text-[#111827]">
              {getGreeting()}, {firstName}
            </h1>
            <p className="text-sm text-[#6B7280] mt-1">
              Here's what's happening with your schedule and wellness
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="p-6">
            <Card className="p-12 text-center">
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-[#3B82F6] mb-4" />
              <p className="text-sm text-[#6B7280]">
                Loading your dashboard...
              </p>
            </Card>
          </div>
        ) : (
         
      </div>
    </Layout>
  );
}

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
          <div className="p-6 space-y-6">
            {nextShift ? (
              <div className="bg-gradient-to-br from-[#3B82F6] to-[#2563EB] rounded-2xl p-6 text-white shadow-lg">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-blue-100 text-sm mb-1">
                      Your Next Shift
                    </p>
                    <h2 className="text-2xl font-bold mb-1">
                      {formatNextShiftDate(nextShift.date)}
                    </h2>
                    <p className="text-lg text-blue-50">{nextShift.label}</p>
                  </div>
                  {hoursUntilShift !== null && (
                    <Badge className="bg-white/20 text-white border-white/30 text-sm px-3 py-1.5">
                      <Clock className="w-4 h-4 mr-1.5" />
                      in {hoursUntilShift}h
                    </Badge>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3">
                    <p className="text-blue-100 text-xs mb-0.5">Department</p>
                    <p className="font-semibold text-sm">
                      {nextShift.department}
                    </p>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3">
                    <p className="text-blue-100 text-xs mb-0.5">Duration</p>
                    <p className="font-semibold text-sm">8 hours</p>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3">
                    <p className="text-blue-100 text-xs mb-0.5">Type</p>
                    <p className="font-semibold text-sm flex items-center gap-1.5 capitalize">
                      {nextShift.type === "day" && <Sun className="w-4 h-4" />}
                      {nextShift.type === "evening" && (
                        <Sunset className="w-4 h-4" />
                      )}
                      {nextShift.type === "night" && (
                        <Moon className="w-4 h-4" />
                      )}
                      {nextShift.type}
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleViewSchedule}
                  className="w-full flex items-center justify-center gap-2 bg-white text-[#3B82F6] hover:bg-blue-50 h-11 text-sm font-semibold rounded-xl transition-all shadow-sm hover:shadow-md"
                >
                  View Full Schedule
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <Card className="p-6 bg-gradient-to-br from-[#F9FAFB] to-white border border-[#E5E7EB]">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-[#DBEAFE] flex items-center justify-center">
                    <Calendar className="w-6 h-6 text-[#3B82F6]" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-[#111827]">
                      No Upcoming Shifts
                    </h3>
                    <p className="text-sm text-[#6B7280]">
                      You don't have any shifts scheduled this week
                    </p>
                  </div>
                  <Button
                    onClick={handleViewSchedule}
                    variant="secondary"
                    size="sm"
                  >
                    View Schedule
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </Card>
            )}
          
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#3B82F6] to-[#2563EB] flex items-center justify-center">
                  <Zap className="w-4 h-4 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-[#111827]">
                  Quick Actions
                </h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button
                  onClick={handleViewFatigueDetail}
                  className="bg-white border-2 border-[#E5E7EB] rounded-xl p-4 text-left hover:border-[#3B82F6] hover:shadow-md transition-all group"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="w-10 h-10 rounded-full bg-[#EFF6FF] flex items-center justify-center">
                      <Heart className="w-5 h-5 text-[#3B82F6]" />
                    </div>
                    <ArrowRight className="w-4 h-4 text-[#9CA3AF] group-hover:text-[#3B82F6] transition-colors" />
                  </div>
                  <h4 className="font-semibold text-[#111827] text-sm mb-0.5">
                    Log Wellness
                  </h4>
                  <p className="text-xs text-[#6B7280]">
                    How are you feeling today?
                  </p>
                </button>

                <button
                  onClick={handleBrowseSwaps}
                  className="bg-white border-2 border-[#E5E7EB] rounded-xl p-4 text-left hover:border-[#3B82F6] hover:shadow-md transition-all group"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="w-10 h-10 rounded-full bg-[#EFF6FF] flex items-center justify-center">
                      <RefreshCw className="w-5 h-5 text-[#3B82F6]" />
                    </div>
                    {pendingSwapsCount > 0 && (
                      <Badge className="bg-[#EF4444] text-white text-xs">
                        {pendingSwapsCount} New
                      </Badge>
                    )}
                  </div>
                  <h4 className="font-semibold text-[#111827] text-sm mb-0.5">
                    Swap Requests
                  </h4>
                  <p className="text-xs text-[#6B7280]">
                    Review colleague requests
                  </p>
                </button>

                <button
                  onClick={() => navigate("/employee/score")}
                  className="bg-white border-2 border-[#E5E7EB] rounded-xl p-4 text-left hover:border-[#3B82F6] hover:shadow-md transition-all group"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="w-10 h-10 rounded-full bg-[#EFF6FF] flex items-center justify-center">
                      <Activity className="w-5 h-5 text-[#3B82F6]" />
                    </div>
                    <ArrowRight className="w-4 h-4 text-[#9CA3AF] group-hover:text-[#3B82F6] transition-colors" />
                  </div>
                  <h4 className="font-semibold text-[#111827] text-sm mb-0.5">
                    View Your Score
                  </h4>
                  <p className="text-xs text-[#6B7280]">
                    Check your wellness metrics
                  </p>
                </button>
              </div>
            </div>
             
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <Card className="p-5 lg:col-span-2 border border-[#E5E7EB]">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#3B82F6] to-[#2563EB] flex items-center justify-center">
                      <BarChart3 className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-[#111827]">
                        Your Wellness Trend
                      </h3>
                      <p className="text-xs text-[#6B7280]">Last 7 days</p>
                    </div>
                  </div>
                  <Button 
                    onClick={handleViewFatigueDetail}
                    variant="secondary"
                    size="sm"
                    className="flex items-center"
                  >
                    View Details
                    <ArrowRight className="w-3 h-3 ml-1" />
                  </Button>
                </div>

                
                <div
                  className={`mb-4 p-4 rounded-xl ${wellnessStatus.bgColor}`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p
                        className={`text-xs ${wellnessStatus.textColor} opacity-80 mb-0.5`}
                      >
                        Current Wellness Score
                      </p>
                      <div className="flex items-baseline gap-2">
                        <span
                          className={`text-4xl font-bold ${wellnessStatus.textColor}`}
                        >
                          {wellnessScore}
                        </span>
                        <span
                          className={`text-sm ${wellnessStatus.textColor} opacity-70`}
                        >
                          / 100
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge
                        className="mb-1 text-white text-xs"
                        style={{ backgroundColor: wellnessStatus.color }}
                      >
                        <wellnessStatus.icon className="w-3 h-3 mr-1" />
                        {wellnessStatus.label}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div style={{ width: "100%", height: "300px" }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={wellnessTrend}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="#E5E7EB"
                        vertical={false}
                      />
                      <XAxis
                        dataKey="day"
                        tick={{ fontSize: 11, fill: "#6B7280" }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fontSize: 11, fill: "#6B7280" }}
                        axisLine={false}
                        tickLine={false}
                        domain={[0, 100]}
                        width={30}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "white",
                          border: "1px solid #E5E7EB",
                          borderRadius: "8px",
                          fontSize: "12px",
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="score"
                        stroke={wellnessStatus.color}
                        strokeWidth={2}
                        dot={{ fill: wellnessStatus.color, r: 3 }}
                        activeDot={{ r: 5 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

            
                {wellnessScore >= 30 && (
                  <div
                    className={`mt-3 p-3 border-l-4 rounded-lg ${wellnessScore >= 70 ? "bg-[#FEF2F2] border-l-[#EF4444]" : "bg-[#FFFBEB] border-l-[#F59E0B]"}`}
                  >
                    <div className="flex gap-2">
                      <AlertTriangle
                        className={`w-4 h-4 flex-shrink-0 mt-0.5 ${wellnessScore >= 70 ? "text-[#EF4444]" : "text-[#F59E0B]"}`}
                      />
                      <div>
                        <p
                          className={`font-semibold text-xs mb-0.5 ${wellnessScore >= 70 ? "text-[#991B1B]" : "text-[#92400E]"}`}
                        >
                          {wellnessScore >= 70
                            ? "High fatigue risk detected"
                            : "Moderate fatigue risk"}
                        </p>
                        <p
                          className={`text-xs ${wellnessScore >= 70 ? "text-[#7F1D1D]" : "text-[#92400E]"}`}
                        >
                          {wellnessScore >= 70
                            ? "Your fatigue score is high. Please consult with your supervisor and take necessary rest."
                            : "Your fatigue levels are rising. Monitor your rest patterns."}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </Card>

              
              <Card className="p-5 border border-[#E5E7EB]">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#3B82F6] to-[#2563EB] flex items-center justify-center">
                    <Timer className="w-4 h-4 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-[#111827]">
                    This Week
                  </h3>
                </div>

                  
                <div className="mb-4 p-4 bg-gradient-to-br from-[#EFF6FF] to-[#DBEAFE] rounded-xl">
                  <div className="flex items-center gap-2 mb-1">
                    <Activity className="w-4 h-4 text-[#1E40AF]" />
                    <span className="text-xs text-[#1E3A8A]">Total Hours</span>
                  </div>
                  <p className="text-3xl font-bold text-[#1E3A8A] mb-0.5">
                    {weekStats.totalHours}
                  </p>
                  <p className="text-xs text-[#1E40AF] flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" />
                    {weekStats.upcomingShifts} shifts remaining
                  </p>
                </div>

                  
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-2 rounded-lg hover:bg-[#F9FAFB] transition-colors">
                    <div className="flex items-center gap-2">
                      <CheckSquare className="w-4 h-4 text-[#3B82F6]" />
                      <span className="text-sm text-[#6B7280]">
                        Shifts completed
                      </span>
                    </div>
                    <span className="font-semibold text-[#111827]">
                      {weekStats.completedShifts}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-lg hover:bg-[#F9FAFB] transition-colors">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-[#3B82F6]" />
                      <span className="text-sm text-[#6B7280]">
                        Shifts remaining
                      </span>
                    </div>
                    <span className="font-semibold text-[#111827]">
                      {weekStats.upcomingShifts}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-lg hover:bg-[#F9FAFB] transition-colors">
                    <div className="flex items-center gap-2">
                      <Coffee className="w-4 h-4 text-[#3B82F6]" />
                      <span className="text-sm text-[#6B7280]">Days off</span>
                    </div>
                    <span className="font-semibold text-[#111827]">
                      {weekStats.daysOff}
                    </span>
                  </div>
                </div>

                {upcomingShiftsList.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-[#E5E7EB]">
                    <p className="text-xs text-[#6B7280] mb-2">
                      Upcoming shifts
                    </p>
                    <div className="space-y-2">
                      {upcomingShiftsList.map((shift, idx) => (
                        <div
                          key={idx}
                          className="flex items-center gap-2 p-2 bg-[#F9FAFB] rounded-lg"
                        >
                          {shift.shift === "day" && (
                            <Sun className="w-4 h-4 text-[#3B82F6]" />
                          )}
                          {shift.shift === "evening" && (
                            <Sunset className="w-4 h-4 text-[#3B82F6]" />
                          )}
                          {shift.shift === "night" && (
                            <Moon className="w-4 h-4 text-[#3B82F6]" />
                          )}
                          <div className="flex-1">
                            <p className="font-medium text-xs text-[#111827] capitalize">
                              {shift.day} {shift.shift} Shift
                            </p>
                            <p className="text-[10px] text-[#6B7280]">
                              {shift.timeLabel}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </Card>
            </div>

            
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#3B82F6] to-[#2563EB] flex items-center justify-center">
                  <CalendarDays className="w-4 h-4 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-[#111827]">
                  Week at a Glance
                </h3>
              </div>
              <div className="grid grid-cols-7 gap-2">
                {weekOverview.map((day, idx) => (
                  <div
                    key={idx}
                    className={`rounded-xl p-3 text-center transition-all ${getShiftColor(day.shift, day.status)} ${
                      day.status === "upcoming" &&
                      nextShift &&
                      day.fullDate.toDateString() ===
                        nextShift.date.toDateString()
                        ? "ring-2 ring-[#3B82F6] ring-offset-2"
                        : ""
                    }`}
                  >
                    <p className="text-[10px] opacity-80 mb-0.5">{day.day}</p>
                    <p className="text-xl font-bold mb-1">{day.date}</p>
                    {day.shift && (
                      <div className="flex justify-center mb-0.5">
                        {getShiftIcon(day.shift)}
                      </div>
                    )}
                    <p className="text-[10px] font-semibold">
                      {day.hours > 0 ? `${day.hours}h` : "Off"}
                    </p>
                    {day.status === "upcoming" &&
                      nextShift &&
                      day.fullDate.toDateString() ===
                        nextShift.date.toDateString() && (
                        <Badge className="mt-1 bg-white text-[#3B82F6] text-[10px] px-1.5 py-0.5">
                          Next
                        </Badge>
                      )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}

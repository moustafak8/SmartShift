import {
  CircleAlert,
  TrendingUp,
  Users as UsersIcon,
  TriangleAlert,
  Clock,
  AlertCircle,
  Loader2,
  Calendar,
  Brain,
  Zap,
  BarChart3,
  Activity,
} from "lucide-react";
import { Card } from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Layout } from "../../components/Sidebar";
import { useNavigate } from "react-router-dom";
import { useEmployees } from "../../hooks/Manager/useEmployee";
import {
  useInsights,
  useInsightUnreadCount,
} from "../../hooks/Manager/useInsights";
import { usePendingSwapsCount } from "../../hooks/Manager/useManagerSwaps";
import { useShiftAssignments, useShifts } from "../../hooks/Manager/useShifts";
import { useAuth } from "../../hooks/context/AuthContext";
import { useMemo } from "react";

const getTodayDate = () => {
  const today = new Date();
  return today.toISOString().split("T")[0];
};

export function Dashboard() {
  const navigate = useNavigate();
  const { departmentId } = useAuth();
  const {
    employees,
    isLoading: employeesLoading,
    isError: employeesError,
  } = useEmployees();
  const { insights, isLoading: insightsLoading } = useInsights(
    departmentId || undefined,
  );
  const { count: unreadInsightsCount } = useInsightUnreadCount(
    departmentId || undefined,
  );
  const { count: pendingSwaps } = usePendingSwapsCount(
    departmentId || undefined,
  );

  const todayDate = getTodayDate();
  const { assignments, isLoading: assignmentsLoading } = useShiftAssignments(
    todayDate,
    departmentId || 0,
  );
  const { shifts, isLoading: shiftsLoading } = useShifts(departmentId || 0);

  const teamSize = employees.length;

  const avgFatigue = useMemo(() => {
    if (teamSize === 0) return 0;
    const totalScore = employees.reduce((sum, emp) => {
      return sum + (emp.fatigue_score?.total_score || 0);
    }, 0);
    return Math.round(totalScore / teamSize);
  }, [employees, teamSize]);

  const highRiskCount = useMemo(() => {
    return employees.filter((emp) => {
      const score = emp.fatigue_score?.total_score || 0;
      return score >= 70;
    }).length;
  }, [employees]);

  const onLeaveCount = useMemo(() => {
    return employees.filter((emp) => emp.is_active === 0).length;
  }, [employees]);

  const criticalAlerts = useMemo(() => {
    return employees
      .filter((emp) => (emp.fatigue_score?.total_score || 0) >= 70)
      .map((emp) => ({
        ...emp,
        fatigueScore: emp.fatigue_score?.total_score || 0,
        riskLevel: emp.fatigue_score?.risk_level || "low",
      }));
  }, [employees]);

  const employeesNeedingAttention = useMemo(() => {
    return employees
      .filter((emp) => {
        const score = emp.fatigue_score?.total_score || 0;
        return score >= 65;
      })
      .sort((a, b) => {
        const scoreA = a.fatigue_score?.total_score || 0;
        const scoreB = b.fatigue_score?.total_score || 0;
        return scoreB - scoreA;
      })
      .slice(0, 5);
  }, [employees]);

  const upcomingCoverage = useMemo(() => {
    if (!assignments?.days || !shifts) return [];

    const today = new Date(todayDate);
    today.setHours(0, 0, 0, 0);

    const coverageData: Array<{
      shift: string;
      coverage: string;
      status: "success" | "warning" | "critical";
      date: string;
    }> = [];

    const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const shiftTypes: Array<{
      key: "day" | "evening" | "night";
      label: string;
    }> = [
      { key: "day", label: "Day" },
      { key: "evening", label: "Evening" },
      { key: "night", label: "Night" },
    ];

    const sortedDates = Object.keys(assignments.days).sort();

    sortedDates.forEach((dateKey) => {
      const shiftDate = new Date(dateKey);
      shiftDate.setHours(0, 0, 0, 0);

      if (shiftDate < today) return;

      const dayData = assignments.days[dateKey];
      const dayOfWeek = daysOfWeek[shiftDate.getDay()];
      const monthDay = shiftDate.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
      const dayName = `${dayOfWeek} ${monthDay}`;

      shiftTypes.forEach(({ key, label }) => {
        const shiftAssignments = dayData[key] || [];
        const assignedCount = shiftAssignments.length;

        const shiftForDate = shifts.find(
          (s) =>
            s.shift_date === dateKey &&
            (s.shift_type === key || s.shift_type === "rotating"),
        );

        const requiredCount = shiftForDate?.required_staff_count || 0;

        if (requiredCount === 0 && assignedCount === 0) return;

        const fillRate = requiredCount > 0 ? assignedCount / requiredCount : 1;
        let status: "success" | "warning" | "critical";

        if (fillRate >= 1) status = "success";
        else if (fillRate >= 0.7) status = "warning";
        else status = "critical";

        coverageData.push({
          shift: `${label} Shift (${dayName})`,
          coverage: `${assignedCount}/${requiredCount}`,
          status,
          date: dateKey,
        });
      });
    });

    return coverageData.slice(0, 6);
  }, [assignments, shifts, todayDate]);

  const latestInsight = useMemo(() => {
    return insights.find((insight) => !insight.is_read) || insights[0];
  }, [insights]);

  if (employeesLoading || shiftsLoading) {
    return (
      <div className="bg-white min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#3B82F6] mx-auto mb-4" />
          <p className="text-[#6B7280]">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (employeesError) {
    return (
      <div className="bg-white min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-[#EF4444] mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-[#111827] mb-2">
            Failed to Load Dashboard
          </h2>
          <p className="text-[#6B7280] mb-4">
            There was an error loading your dashboard data.
          </p>
          <Button
            onClick={() => window.location.reload()}
            className="bg-[#3B82F6] hover:bg-[#2563EB] text-white"
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
   
  );
}

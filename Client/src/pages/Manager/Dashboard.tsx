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
    <Layout>
      <div className="bg-white min-h-screen">
        <div className="border-b border-[#E5E7EB] bg-white">
          <div className="px-6 py-4">
            <h1 className="text-2xl font-semibold text-[#111827]">Dashboard</h1>
            <p className="text-sm text-[#6B7280] mt-1">
              Monitor and control your team in the most convenient way
            </p>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {criticalAlerts.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <CircleAlert className="w-5 h-5 text-[#EF4444]" />
                <h2 className="text-lg font-semibold text-[#111827]">
                  Critical Alerts ({criticalAlerts.length})
                </h2>
              </div>
              {criticalAlerts.map((emp) => (
                <div
                  key={emp.employee_id}
                  className="rounded-lg border-l-4 border-[#EF4444] bg-white p-4 shadow-sm"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h3 className="font-semibold text-[#111827]">
                          {emp.employee_name}
                        </h3>
                        <Badge className="bg-[#FEE2E2] text-[#EF4444] font-semibold">
                          CRITICAL
                        </Badge>
                        <span className="text-sm text-[#6B7280]">
                          Fatigue: {emp.fatigueScore}/100
                        </span>
                      </div>
                      <p className="mt-2 text-sm text-[#374151]">
                        {emp.position} • High fatigue level detected
                      </p>
                      <div className="mt-3 flex gap-4 flex-wrap">
                        <span className="text-sm text-[#6B7280]">
                          Status:{" "}
                          <span className="font-medium text-[#111827]">
                            {emp.is_active ? "Active" : "Inactive"}
                          </span>
                        </span>
                        <span className="text-sm text-[#6B7280]">
                          Level:{" "}
                          <span className="font-medium text-[#EF4444]">
                            {emp.riskLevel.toUpperCase()}
                          </span>
                        </span>
                        <span className="text-sm text-[#6B7280]">
                          Score Date:{" "}
                          <span className="font-medium">
                            {emp.fatigue_score?.score_date || "N/A"}
                          </span>
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => navigate("/manager/team")}
                        className="bg-[#3B82F6] hover:bg-[#2563EB] text-white"
                      >
                        Review Profile
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => navigate("/manager/team-wellness")}
                        className="border-[#E5E7EB]"
                      >
                        Take Action
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="grid grid-cols-4 gap-4">
            <div
              className="cursor-pointer"
              onClick={() => navigate("/manager/team")}
            >
              <Card className="p-5 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div className="text-sm text-[#6B7280]">Team Size</div>
                  <div className="h-6 w-6 flex items-center justify-center text-[#6B7280]">
                    <UsersIcon className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-3xl font-bold mb-2 text-[#111827]">
                  {teamSize}
                </div>
                <div className="flex items-center gap-1 text-sm text-[#3B82F6]">
                  <TrendingUp className="w-4 h-4" />
                  <span>{onLeaveCount} on leave</span>
                </div>
              </Card>
            </div>

            <div
              className="cursor-pointer"
              onClick={() => navigate("/manager/team-wellness")}
            >
              <Card className="p-5 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div className="text-sm text-[#6B7280]">
                    Team Fatigue Score
                  </div>
                  <div className="h-6 w-6 flex items-center justify-center text-[#6B7280]">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-3xl font-bold mb-2 text-[#111827]">
                  {avgFatigue}/100
                </div>
                <div
                  className={`flex items-center gap-1 text-sm ${
                    avgFatigue >= 70
                      ? "text-[#EF4444]"
                      : avgFatigue >= 50
                        ? "text-[#F59E0B]"
                        : "text-[#10B981]"
                  }`}
                >
                  <TrendingUp className="w-4 h-4" />
                  <span>
                    {avgFatigue >= 70
                      ? "High Risk"
                      : avgFatigue >= 50
                        ? "Medium Risk"
                        : "Low Risk"}
                  </span>
                </div>
              </Card>
            </div>

            <div
              className="cursor-pointer"
              onClick={() => navigate("/manager/team-wellness")}
            >
              <Card className="p-5 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div className="text-sm text-[#6B7280]">High Risk</div>
                  <div className="h-6 w-6 flex items-center justify-center text-[#6B7280]">
                    <TriangleAlert className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-3xl font-bold mb-2 text-[#111827]">
                  {highRiskCount}
                </div>
                <div className="flex items-center gap-1 text-sm text-[#EF4444]">
                  <TrendingUp className="w-4 h-4" />
                  <span>
                    {teamSize > 0
                      ? `${Math.round((highRiskCount / teamSize) * 100)}% of team`
                      : "No team members"}
                  </span>
                </div>
              </Card>
            </div>

            <div
              className="cursor-pointer"
              onClick={() => navigate("/manager/swaps")}
            >
              <Card className="p-5 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div className="text-sm text-[#6B7280]">Pending Swaps</div>
                  <div className="h-6 w-6 flex items-center justify-center text-[#6B7280]">
                    <Clock className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-3xl font-bold mb-2 text-[#111827]">
                  {pendingSwaps}
                </div>
                <div className="flex items-center gap-1 text-sm text-[#3B82F6]">
                  <TrendingUp className="w-4 h-4" />
                  <span>Review pending</span>
                </div>
              </Card>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-6">
            <div className="col-span-2 space-y-6">
              {/* Upcoming Coverage */}
              <Card className="p-6 bg-white border border-[#E5E7EB] rounded-xl">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-[#3B82F6]" />
                    <h2 className="text-lg font-semibold text-[#111827]">
                      Upcoming Schedule Coverage
                    </h2>
                  </div>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => navigate("/manager/schedule")}
                    className="text-[#3B82F6] hover:bg-[#EFF6FF]"
                  >
                    View Schedule →
                  </Button>
                </div>
                <div className="space-y-3">
                  {upcomingCoverage.length > 0 ? (
                    upcomingCoverage.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-3 bg-[#F9FAFB] rounded-lg"
                      >
                        <span className="text-sm font-medium text-[#111827]">
                          {item.shift}
                        </span>
                        <div className="flex items-center gap-2">
                          <Badge
                            className={
                              item.status === "critical"
                                ? "bg-[#FEE2E2] text-[#EF4444]"
                                : item.status === "warning"
                                  ? "bg-[#FEF3C7] text-[#F59E0B]"
                                  : "bg-[#DCFCE7] text-[#10B981]"
                            }
                          >
                            {item.coverage}
                          </Badge>
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => navigate("/manager/schedule")}
                            className="text-[#3B82F6] hover:bg-[#EFF6FF]"
                          >
                            Optimize
                          </Button>
                        </div>
                      </div>
                    ))
                  ) : assignmentsLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin text-[#3B82F6]" />
                    </div>
                  ) : (
                    <div className="text-center py-8 text-[#6B7280]">
                      <p className="text-sm">No upcoming shifts scheduled</p>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => navigate("/manager/schedule")}
                        className="mt-2 text-[#3B82F6] hover:bg-[#EFF6FF]"
                      >
                        Create Schedule
                      </Button>
                    </div>
                  )}
                </div>
              </Card>

              <Card className="p-6 bg-white border border-[#E5E7EB] rounded-xl">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <UsersIcon className="w-5 h-5 text-[#F59E0B]" />
                    <h2 className="text-lg font-semibold text-[#111827]">
                      Team Members Needing Attention
                    </h2>
                  </div>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => navigate("/manager/team")}
                    className="text-[#3B82F6] hover:bg-[#EFF6FF]"
                  >
                    View All →
                  </Button>
                </div>
                <div className="space-y-2">
                  {employeesNeedingAttention.length > 0 ? (
                    employeesNeedingAttention.map((emp) => (
                      <div
                        key={emp.employee_id}
                        className="flex items-center justify-between p-3 bg-[#F9FAFB] rounded-lg hover:bg-[#F0F9FF] cursor-pointer transition-colors"
                        onClick={() => navigate("/manager/team")}
                      >
                        <div className="flex-1">
                          <p className="text-sm font-medium text-[#111827]">
                            {emp.employee_name}
                          </p>
                          <p className="text-xs text-[#6B7280]">
                            {emp.position || "Staff"}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="text-right">
                            <p className="text-sm font-semibold text-[#111827]">
                              {emp.fatigue_score?.total_score || 0}
                            </p>
                            <p className="text-xs text-[#6B7280]">Fatigue</p>
                          </div>
                          <Badge
                            className={
                              (emp.fatigue_score?.risk_level || "low") ===
                              "high"
                                ? "bg-[#FEE2E2] text-[#EF4444]"
                                : (emp.fatigue_score?.risk_level || "low") ===
                                    "medium"
                                  ? "bg-[#FEF3C7] text-[#F59E0B]"
                                  : "bg-[#DCFCE7] text-[#10B981]"
                            }
                          >
                            {emp.fatigue_score?.risk_level || "low"}
                          </Badge>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-[#6B7280]">
                      <p className="text-sm flex items-center justify-center gap-2">
                        {teamSize === 0 ? (
                          "No employees in your team"
                        ) : (
                          <>
                            <Activity className="w-4 h-4 text-[#10B981]" />
                            All team members are healthy!
                          </>
                        )}
                      </p>
                    </div>
                  )}
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

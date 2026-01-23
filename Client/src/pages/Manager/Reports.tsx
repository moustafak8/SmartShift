import { useMemo } from "react";
import { useAuth } from "../../hooks/context/AuthContext";
import { useShiftAssignments, useShifts } from "../../hooks/Manager/useShifts";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Download } from "lucide-react";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { useToast } from "../../components/ui/Toast";

import { Layout } from "../../components/Sidebar";

const Reports = () => {
  const { departmentId } = useAuth();
  const { success } = useToast();

  const getStartOfWeek = () => {
    const d = new Date();
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(d.setDate(diff));
    return monday.toISOString().split("T")[0];
  };

  const startDate = getStartOfWeek();
  const { assignments, isLoading: assignmentsLoading } = useShiftAssignments(
    startDate,
    departmentId!,
  );
  const { shifts, isLoading: shiftsLoading } = useShifts(departmentId!);

  const calculateHours = (start: string, end: string) => {
    const [startH, startM] = start.split(":").map(Number);
    const [endH, endM] = end.split(":").map(Number);
    let duration = endH + endM / 60 - (startH + startM / 60);
    if (duration < 0) duration += 24;
    return duration;
  };

  const stats = useMemo(() => {
    if (!assignments?.days || !shifts)
      return {
        fairnessData: [],
        avgHours: 0,
        maxHours: 0,
        minHours: 0,
        stdDev: 0,
      };

    const employeeHours: Record<string, number> = {};

    Object.entries(assignments.days).forEach(([date, daySchedule]) => {
      const processList = (list: any[], type: "day" | "evening" | "night") => {
        const shiftDef = shifts.find(
          (s) => s.shift_date === date && s.shift_type === type,
        );
        const hours =
          shiftDef && shiftDef.start_time && shiftDef.end_time
            ? calculateHours(shiftDef.start_time, shiftDef.end_time)
            : 8; // Fallback to 8 if shift def not found

        list.forEach((assignment) => {
          const name = assignment.full_name;
          employeeHours[name] = (employeeHours[name] || 0) + hours;
        });
      };

      processList(daySchedule.day || [], "day");
      processList(daySchedule.evening || [], "evening");
      processList(daySchedule.night || [], "night");
    });

    const fairnessData = Object.entries(employeeHours)
      .map(([name, hours]) => ({
        name: name.split(" ")[0],
        fullName: name,
        hours,
      }))
      .sort((a, b) => a.hours - b.hours);

    const hoursValues = fairnessData.map((d) => d.hours);
    const totalHours = hoursValues.reduce((a, b) => a + b, 0);
    const count = hoursValues.length;

    const avgHours = count > 0 ? totalHours / count : 0;
    const maxHours = count > 0 ? Math.max(...hoursValues) : 0;
    const minHours = count > 0 ? Math.min(...hoursValues) : 0;

    const variance =
      count > 0
        ? hoursValues.reduce((sum, h) => sum + Math.pow(h - avgHours, 2), 0) /
          count
        : 0;
    const stdDev = Math.sqrt(variance);

    return { fairnessData, avgHours, maxHours, minHours, stdDev };
  }, [assignments]);

  const { fairnessData, avgHours, maxHours, minHours, stdDev } = stats;

  const handleDownloadReport = () => {
    const headers = ["Employee,Hours\n"];
    const rows = fairnessData.map((d) => `${d.fullName},${d.hours}`);
    const csvContent =
      "data:text/csv;charset=utf-8," + headers + rows.join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "hour_distribution_report.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    success("Report downloaded successfully");
  };

  if (assignmentsLoading || shiftsLoading) {
    return (
      <Layout>
        <div className="p-8 text-center text-gray-500">
          Loading report data...
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="bg-white min-h-screen">
        <div className="border-b border-[#E5E7EB] bg-white">
          <div className="px-6 py-4 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-[#111827]">Report</h1>
              <p className="text-sm text-[#6B7280] mt-1">
                Team distribution hours analysis
              </p>
            </div>
            <Button
              className="bg-[#3B82F6] hover:bg-[#2563EB] text-white flex items-center"
              onClick={handleDownloadReport}
              size="sm"
            >
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </div>

        <div className="p-6">
          <Card className="p-6 bg-white border border-[#E5E7EB] rounded-xl shadow-none">
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-[#111827] mb-2">
                Hour Distribution
              </h2>
              <p className="text-sm text-[#6B7280]">
                current week ({startDate})
              </p>
            </div>

            <div className="mb-6">
              <ResponsiveContainer width="100%" height={400}>
                <BarChart
                  data={fairnessData}
                  margin={{ top: 20, right: 30, left: 0, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#E5E7EB"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="name"
                    stroke="#6B7280"
                    axisLine={false}
                    tickLine={false}
                    dy={10}
                  />
                  <YAxis stroke="#6B7280" axisLine={false} tickLine={false} />
                  <Tooltip
                    cursor={{ fill: "#F9FAFB" }}
                    contentStyle={{
                      borderRadius: "8px",
                      border: "none",
                      boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                    }}
                  />
                  <Bar
                    dataKey="hours"
                    fill="#3B82F6"
                    radius={[8, 8, 0, 0]}
                    barSize={40}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="p-4 bg-[#F9FAFB] rounded-lg">
                <div className="text-sm text-[#6B7280] mb-1">Average Hours</div>
                <div className="text-2xl font-bold text-[#111827]">
                  {avgHours.toFixed(0)}h
                </div>
              </div>
              <div className="p-4 bg-[#F9FAFB] rounded-lg">
                <div className="text-sm text-[#6B7280] mb-1">Highest</div>
                <div className="text-2xl font-bold text-[#111827]">
                  {maxHours}h
                </div>
                <div className="text-xs text-[#6B7280] mt-1">
                  {fairnessData.find((e) => e.hours === maxHours)?.fullName}
                </div>
              </div>
              <div className="p-4 bg-[#F9FAFB] rounded-lg">
                <div className="text-sm text-[#6B7280] mb-1">Lowest</div>
                <div className="text-2xl font-bold text-[#111827]">
                  {minHours}h
                </div>
                <div className="text-xs text-[#6B7280] mt-1">
                  {fairnessData.find((e) => e.hours === minHours)?.fullName}
                </div>
              </div>
            </div>

            <div className="p-4 bg-[#F9FAFB] rounded-lg border border-[#E5E7EB]">
              <h3 className="font-semibold text-[#111827] mb-2">
                Distribution Quality
              </h3>
              <p className="text-sm text-[#4B5563]">
                <span className="font-medium">Standard Deviation:</span>{" "}
                {stdDev.toFixed(1)}h (
                <span
                  className={
                    stdDev < 5
                      ? "text-[#10B981] font-medium"
                      : "text-[#F59E0B] font-medium"
                  }
                >
                  {stdDev < 5 ? "Good" : "Needs Attention"}
                </span>
                ) -
                {stdDev < 5
                  ? " Hours are fairly distributed across the team"
                  : " There is a significant disparity in workload"}
              </p>
            </div>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default Reports;

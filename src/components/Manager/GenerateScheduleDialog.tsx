import { useState, useMemo } from "react";
import {
  Calendar,
  Users,
  TrendingUp,
  AlertCircle,
  AlertTriangle,
  Clock,
  Loader2,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../ui/Dialog";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { useGenerateSchedule } from "../../hooks/Manager/useSchedule";
import { useAuth } from "../../hooks/context/AuthContext";
import type {
  GenerateScheduleResponse,
  ShiftDetail,
} from "../../hooks/types/schedule";
import { useToast } from "../ui/Toast";

interface GenerateScheduleDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function GenerateScheduleDialog({
  isOpen,
  onClose,
  onSuccess,
}: GenerateScheduleDialogProps) {
  const { departmentId } = useAuth();
  const toast = useToast();
  const { mutate: generateSchedule, isPending } = useGenerateSchedule();

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [scheduleData, setScheduleData] =
    useState<GenerateScheduleResponse | null>(null);
  const [isSaving, setIsSaving] = useState(false);

      
  const today = new Date().toISOString().split("T")[0];

  const setDatePreset = (preset: "week" | "2weeks" | "month") => {
    const start = new Date();
    const end = new Date();

    switch (preset) {
      case "week":
        end.setDate(start.getDate() + 7);
        break;
      case "2weeks":
        end.setDate(start.getDate() + 14);
        break;
      case "month":
        end.setDate(start.getDate() + 30);
        break;
    }

    setStartDate(start.toISOString().split("T")[0]);
    setEndDate(end.toISOString().split("T")[0]);
  };

  const shiftsByDate = useMemo(() => {
    if (!scheduleData) return {};

    const grouped: Record<string, ShiftDetail[]> = {};
    scheduleData.debug.shift_details.forEach((shift) => {
      const date = shift.date;
      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push(shift);
    });

    
    Object.keys(grouped).forEach((date) => {
      grouped[date].sort((a, b) => a.start_time.localeCompare(b.start_time));
    });

    return grouped;
  }, [scheduleData]);

  const handleGenerate = () => {
    if (!startDate || !endDate) {
      toast.error("Please select both start and end dates");
      return;
    }

    if (!departmentId) {
      toast.error("Department ID not found");
      return;
    }

    generateSchedule(
      {
        department_id: departmentId,
        start_date: startDate,
        end_date: endDate,
      },
      {
        onSuccess: (response) => {
          setScheduleData(response.payload);
          toast.success("Schedule generated successfully!");
        },
        onError: (error: any) => {
          toast.error(
            error.response?.data?.message || "Failed to generate schedule"
          );
        },
      }
    );
  };

  const handleConfirm = async () => {
    setIsSaving(true);
    try {
      
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500));
      toast.success("Schedule confirmed and saved!");
      onSuccess();
      handleClose();
    } catch (error) {
      toast.error("Failed to save schedule");
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    setScheduleData(null);
    setStartDate("");
    setEndDate("");
    onClose();
  };

  const getShiftTypeColor = (shiftType: string) => {
    switch (shiftType) {
      case "day":
        return "bg-teal-100 text-teal-800 border-teal-200";
      case "evening":
        return "bg-amber-100 text-amber-800 border-amber-200";
      case "night":
        return "bg-indigo-100 text-indigo-800 border-indigo-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-[#3B82F6]" />
            Generate Schedule
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
            
          {!scheduleData && (
            <div className="space-y-4">
                
              <div>
                <label className="block text-sm font-medium text-[#111827] mb-2">
                  Quick Select
                </label>
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setDatePreset("week")}
                    className="flex-1"
                  >
                    Next 7 Days
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setDatePreset("2weeks")}
                    className="flex-1"
                  >
                    Next 2 Weeks
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setDatePreset("month")}
                    className="flex-1"
                  >
                    Next Month
                  </Button>
                </div>
              </div>

              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#111827] mb-2">
                    Start Date <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Input
                      type="date"
                      value={startDate}
                      min={today}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#111827] mb-2">
                    End Date <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Input
                      type="date"
                      value={endDate}
                      min={startDate || today}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-blue-800">
                    <p className="font-medium mb-1">How it works:</p>
                    <ul className="list-disc list-inside space-y-1 text-blue-700">
                      <li>Select a date range to generate assignments</li>
                      <li>AI will automatically assign employees to shifts</li>
                      <li>Preview assignments before confirming</li>
                      <li>
                        Assignments consider employee availability and
                        qualifications
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

            
          {scheduleData && (
            <div className="space-y-4">
              
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <Users className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-medium text-green-900">
                      Total Assignments
                    </span>
                  </div>
                  <p className="text-2xl font-bold text-green-700">
                    {scheduleData.assignments_count}
                  </p>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <Calendar className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-medium text-blue-900">
                      Shifts Covered
                    </span>
                  </div>
                  <p className="text-2xl font-bold text-blue-700">
                    {
                      Object.keys(scheduleData.debug.assignments_by_shift)
                        .length
                    }
                  </p>
                </div>
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <TrendingUp className="w-4 h-4 text-purple-600" />
                    <span className="text-sm font-medium text-purple-900">
                      Coverage Rate
                    </span>
                  </div>
                  <p className="text-2xl font-bold text-purple-700">
                    {Math.round(
                      (scheduleData.assignments_count /
                        scheduleData.debug.total_position_slots) *
                        100
                    )}
                    %
                  </p>
                </div>
              </div>

                  
              {scheduleData.debug.unfilled_count > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-amber-900 mb-1">
                        {scheduleData.debug.unfilled_count} Position
                        {scheduleData.debug.unfilled_count > 1 ? "s" : ""}{" "}
                        Unfilled
                      </p>
                      <p className="text-xs text-amber-700">
                        Some shifts don't have enough employees assigned. Review
                        the assignments below.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div>
                <h3 className="text-sm font-semibold text-[#111827] mb-3">
                  Schedule Preview
                </h3>
                <div
                  className={`grid gap-4 max-h-[500px] overflow-y-auto pr-2 ${
                    Object.keys(shiftsByDate).length === 1
                      ? "grid-cols-1"
                      : "grid-cols-1 md:grid-cols-2"
                  }`}
                >
                  {Object.entries(shiftsByDate).map(([date, shifts]) => {
                    const totalAssignments = shifts.reduce((sum, shift) => {
                      return (
                        sum +
                        scheduleData.assignments.filter(
                          (a) => a.shift_id === shift.shift_id
                        ).length
                      );
                    }, 0);

                    const totalNeeded = shifts.reduce((sum, shift) => {
                      return (
                        sum +
                        shift.positions.reduce(
                          (s, p) => s + p.required_count,
                          0
                        )
                      );
                    }, 0);

                    const coveragePercent =
                      totalNeeded > 0
                        ? Math.round((totalAssignments / totalNeeded) * 100)
                        : 0;

                    return (
                      <div
                        key={date}
                        className="border border-[#E5E7EB] rounded-lg overflow-hidden"
                      >
                        <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4">
                          <div className="flex items-center justify-between mb-1">
                            <p className="text-lg font-bold">
                              {new Date(date).toLocaleDateString("en-US", {
                                weekday: "short",
                                month: "short",
                                day: "numeric",
                              })}
                            </p>
                            <span
                              className={`px-2 py-1 rounded text-xs font-medium ${
                                coveragePercent === 100
                                  ? "bg-green-500"
                                  : coveragePercent >= 80
                                  ? "bg-yellow-500"
                                  : "bg-red-500"
                              }`}
                            >
                              {coveragePercent}%
                            </span>
                          </div>
                          <p className="text-sm opacity-90">
                            {totalAssignments} / {totalNeeded} positions filled
                          </p>
                        </div>
                        <div className="p-3 space-y-3 bg-gray-50">
                          {shifts.map((shift) => {
                            const shiftAssignments =
                              scheduleData.assignments.filter(
                                (a) => a.shift_id === shift.shift_id
                              );

                            return (
                              <div
                                key={shift.shift_id}
                                className="bg-white border border-[#E5E7EB] rounded-lg p-3 hover:shadow-md transition-shadow"
                              >
                                <div className="flex items-center justify-between mb-2">
                                  <div className="flex items-center gap-2">
                                    <span
                                      className={`px-2 py-1 rounded text-xs font-medium border ${getShiftTypeColor(
                                        shift.shift_type
                                      )}`}
                                    >
                                      {shift.shift_type}
                                    </span>
                                    <div className="flex items-center gap-1 text-xs text-[#6B7280]">
                                      <Clock className="w-3 h-3" />
                                      {shift.start_time.substring(0, 5)} -{" "}
                                      {shift.end_time.substring(0, 5)}
                                    </div>
                                  </div>
                                </div>

                                {shiftAssignments.length > 0 ? (
                                  <div className="space-y-2">
                                    {shiftAssignments.map((assignment, idx) => {
                                      const position = shift.positions.find(
                                        (p) =>
                                          p.position_id ===
                                          assignment.position_id
                                      );
                                      return (
                                        <div
                                          key={idx}
                                          className="flex items-center gap-2 bg-gray-50 rounded px-2 py-1.5"
                                        >
                                          <div className="w-6 h-6 rounded-full bg-[#3B82F6] text-white flex items-center justify-center text-xs font-medium flex-shrink-0">
                                            {assignment.employee_name
                                              .split(" ")
                                              .map((n) => n[0])
                                              .join("")
                                              .toUpperCase()
                                              .substring(0, 2)}
                                          </div>
                                          <div className="flex-1 min-w-0">
                                            <p className="text-xs font-medium text-[#111827] truncate">
                                              {assignment.employee_name}
                                            </p>
                                            <p className="text-xs text-[#6B7280] truncate">
                                              {position?.position_name}
                                            </p>
                                          </div>
                                          <span className="text-xs px-1.5 py-0.5 bg-green-100 text-green-700 rounded flex-shrink-0">
                                            {assignment.status}
                                          </span>
                                        </div>
                                      );
                                    })}
                                  </div>
                                ) : (
                                  <p className="text-xs text-gray-500 italic">
                                    No assignments
                                  </p>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="secondary"
            size="sm"
            onClick={handleClose}
            disabled={isPending || isSaving}
          >
            Cancel
          </Button>
          {!scheduleData ? (
            <Button
              onClick={handleGenerate}
              size="sm"
              disabled={isPending || !startDate || !endDate}
              className="bg-[#3B82F6] hover:bg-[#2563EB] text-white flex items-center gap-2"
            >
              {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>{isPending ? "Generating..." : "Generate Preview"}</span>
            </Button>
          ) : (
            <Button
              onClick={handleConfirm}
              size="sm"
              disabled={isSaving}
              className="bg-[#10B981] hover:bg-[#059669] text-white flex items-center gap-2"
            >
              {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>{isSaving ? "Saving..." : "Confirm & Save Schedule"}</span>
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

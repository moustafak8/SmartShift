import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, CheckCircle } from "lucide-react";
import { Button } from "../ui/Button";
import { ManageAssignmentsDialog } from "./ManageAssignmentsDialog";
import type { Shift, ShiftAssignmentsPayload } from "../../hooks/types/shifts";

interface ShiftCalendarProps {
  shifts: Shift[];
  isLoading: boolean;
  assignments: ShiftAssignmentsPayload | null;
  onWeekChange?: (startDate: string) => void;
  onAssignmentChange?: () => void;
}

export function ShiftCalendar({ shifts, isLoading, assignments, onWeekChange, onAssignmentChange }: ShiftCalendarProps) {
  const [currentWeekStart, setCurrentWeekStart] = useState(() => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const monday = new Date(today);
    monday.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
    monday.setHours(0, 0, 0, 0);
    return monday;
  });


  const [selectedShift, setSelectedShift] = useState<Shift | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedAssignments, setSelectedAssignments] = useState<any[]>([]);
  const [isManageDialogOpen, setIsManageDialogOpen] = useState(false);


  useEffect(() => {
    const year = currentWeekStart.getFullYear();
    const month = String(currentWeekStart.getMonth() + 1).padStart(2, '0');
    const day = String(currentWeekStart.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    onWeekChange?.(dateStr);
  }, [currentWeekStart, onWeekChange]);

  const getWeekDays = (startDate: Date) => {
    const days = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      days.push(date);
    }
    return days;
  };

  const weekDays = getWeekDays(currentWeekStart);

  const goToPreviousWeek = () => {
    const newDate = new Date(currentWeekStart);
    newDate.setDate(currentWeekStart.getDate() - 7);
    setCurrentWeekStart(newDate);
  };

  const goToNextWeek = () => {
    const newDate = new Date(currentWeekStart);
    newDate.setDate(currentWeekStart.getDate() + 7);
    setCurrentWeekStart(newDate);
  };

  const goToToday = () => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const monday = new Date(today);
    monday.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
    monday.setHours(0, 0, 0, 0);
    setCurrentWeekStart(monday);
  };

  const formatDateRange = () => {
    const endDate = new Date(currentWeekStart);
    endDate.setDate(currentWeekStart.getDate() + 6);

    const options: Intl.DateTimeFormatOptions = {
      month: "short",
      day: "numeric",
      year: "numeric",
    };
    return `${currentWeekStart.toLocaleDateString(
      "en-US",
      options
    )} - ${endDate.toLocaleDateString("en-US", options)}`;
  };

  const getShiftsForDay = (date: Date) => {
    // Use local date string to avoid timezone issues
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    return shifts.filter((shift) => shift.shift_date.startsWith(dateStr));
  };

  const getUniqueShiftTimes = () => {
    const timesMap = new Map<string, string>();
    shifts.forEach((shift) => {
      const timeKey = `${shift.start_time} - ${shift.end_time}`;
      if (!timesMap.has(timeKey)) {
        timesMap.set(timeKey, shift.shift_type);
      }
    });
    return Array.from(timesMap.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  };

  const shiftTimes = getUniqueShiftTimes();

  const getShiftColor = (shiftType: string) => {
    switch (shiftType) {
      case "day":
        return "bg-teal-50 border-teal-200";
      case "evening":
        return "bg-amber-50 border-amber-200";
      case "night":
        return "bg-indigo-50 border-indigo-200";
      default:
        return "bg-gray-50 border-gray-200";
    }
  };

  const getShiftsForTime = (day: Date, timeRange: string) => {
    const dayShifts = getShiftsForDay(day);
    return dayShifts.filter(
      (shift) => `${shift.start_time} - ${shift.end_time}` === timeRange
    );
  };

  const handleShiftClick = (shift: Shift, day: Date, shiftTypeAssignments: any[]) => {
    const year = day.getFullYear();
    const month = String(day.getMonth() + 1).padStart(2, '0');
    const dayNum = String(day.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${dayNum}`;

    setSelectedShift(shift);
    setSelectedDate(dateStr);
    setSelectedAssignments(shiftTypeAssignments);
    setIsManageDialogOpen(true);
  };

  const handleDialogClose = () => {
    setIsManageDialogOpen(false);
    setSelectedShift(null);
    setSelectedDate("");
    setSelectedAssignments([]);
  };

  const handleAssignmentChange = () => {
    onAssignmentChange?.();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-[#6B7280]">Loading shifts...</p>
      </div>
    );
  }

  return (
    <div className="bg-white">
      <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-gray-50 to-white border-b border-[#E5E7EB]">
        <div className="flex items-center gap-4">
          <div className="flex items-center bg-white rounded-lg border border-[#E5E7EB] shadow-sm overflow-hidden">
            <button
              onClick={goToPreviousWeek}
              className="px-3 py-2 hover:bg-gray-50 transition-colors border-r border-[#E5E7EB]"
            >
              <ChevronLeft className="w-4 h-4 text-[#6B7280]" />
            </button>
            <button
              onClick={goToNextWeek}
              className="px-3 py-2 hover:bg-gray-50 transition-colors"
            >
              <ChevronRight className="w-4 h-4 text-[#6B7280]" />
            </button>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
              <span className="text-sm font-bold text-[#3B82F6]">
                {currentWeekStart.getDate()}
              </span>
            </div>
            <div>
              <h2 className="text-base font-semibold text-[#111827]">
                {formatDateRange()}
              </h2>
              <p className="text-xs text-[#6B7280]">Week view</p>
            </div>
          </div>
        </div>
        <Button 
          variant="secondary" 
          size="sm" 
          onClick={goToToday}
          className="border-[#3B82F6] text-[#3B82F6] hover:bg-blue-50 font-medium"
        >
          Today
        </Button>
      </div>
      <div className="overflow-x-auto">
        <div className="min-w-[1200px]">
          <div className="grid grid-cols-8 border-b border-[#E5E7EB]">
            <div className="p-4 text-sm font-medium text-[#6B7280] border-r border-[#E5E7EB]">
              Time
            </div>
            {weekDays.map((day, index) => {
              const isToday = day.toDateString() === new Date().toDateString();
              return (
                <div
                  key={index}
                  className={`p-4 text-center border-r border-[#E5E7EB] last:border-r-0 ${isToday ? "bg-blue-50" : ""
                    }`}
                >
                  <div className="text-xs font-medium text-[#6B7280] uppercase">
                    {day.toLocaleDateString("en-US", { weekday: "short" })}
                  </div>
                  <div
                    className={`text-lg font-semibold mt-1 ${isToday ? "text-[#3B82F6]" : "text-[#111827]"
                      }`}
                  >
                    {day.getDate()}
                  </div>
                </div>
              );
            })}
          </div>

          {shiftTimes.length > 0 ? (
            shiftTimes.map(([timeRange, shiftType]) => (
              <div
                key={timeRange}
                className="grid grid-cols-8 border-b border-[#E5E7EB]"
              >
                <div className="p-4 border-r border-[#E5E7EB]">
                  <div className="text-sm font-medium text-[#111827]">
                    {timeRange}
                  </div>
                  <div className="text-xs text-[#6B7280] mt-1 capitalize">
                    {shiftType}
                  </div>
                </div>

                {weekDays.map((day, dayIndex) => {
                  const shiftsForTime = getShiftsForTime(day, timeRange);
                  const isToday =
                    day.toDateString() === new Date().toDateString();

                  return (
                    <div
                      key={dayIndex}
                      className={`p-2 border-r border-[#E5E7EB] last:border-r-0 min-h-[100px] ${isToday ? "bg-blue-50/30" : ""
                        }`}
                    >
                      {shiftsForTime.length > 0 ? (
                        <div className="space-y-2">
                          {shiftsForTime.map((shift) => {
                            const year = day.getFullYear();
                            const month = String(day.getMonth() + 1).padStart(2, '0');
                            const dayNum = String(day.getDate()).padStart(2, '0');
                            const dateStr = `${year}-${month}-${dayNum}`;
                            const dayAssignments = assignments?.days[dateStr];

                            const shiftType = shift.shift_type as "day" | "evening" | "night";
                            const shiftTypeAssignments = (shift.shift_type !== "rotating" && dayAssignments)
                              ? dayAssignments[shiftType] || []
                              : [];

                            const assignedCount = shiftTypeAssignments.length;
                            const requiredCount = shift.required_staff_count;
                            const isFilled = assignedCount >= requiredCount;
                            const fillPercentage = requiredCount > 0 ? (assignedCount / requiredCount) * 100 : 0;

                            // Check if this shift is in the past
                            const shiftDate = new Date(dateStr);
                            shiftDate.setHours(23, 59, 59, 999);
                            const isPastShift = shiftDate < new Date();

                            return (
                              <div
                                key={shift.id}
                                onClick={() => handleShiftClick(shift, day, shiftTypeAssignments)}
                                className={`p-3 rounded-lg border-2 ${getShiftColor(
                                  shift.shift_type
                                )} cursor-pointer hover:shadow-lg hover:scale-[1.02] transition-all duration-200 ${isPastShift ? 'opacity-75' : ''}`}
                              >

                                <div className="flex items-center justify-between mb-2">
                                  <div className="text-xs font-semibold text-[#111827]">
                                    <span className={isFilled ? "text-green-600" : "text-amber-600"}>
                                      {assignedCount}/{requiredCount}
                                    </span>
                                    <span className="text-[#6B7280] ml-1">filled</span>
                                  </div>


                                  {isPastShift ? (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 border border-gray-300">
                                      <CheckCircle className="w-3 h-3 mr-1" />
                                      Completed
                                    </span>
                                  ) : !isFilled ? (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 border border-amber-200">
                                      {shift.status}
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                                      filled
                                    </span>
                                  )}
                                </div>


                                <div className="w-full bg-gray-200 rounded-full h-1.5 mb-2">
                                  <div
                                    className={`h-1.5 rounded-full transition-all ${isFilled ? "bg-green-500" : fillPercentage >= 50 ? "bg-amber-500" : "bg-red-500"
                                      }`}
                                    style={{ width: `${Math.min(fillPercentage, 100)}%` }}
                                  ></div>
                                </div>


                                {shiftTypeAssignments.length > 0 ? (
                                  <div className="space-y-1">
                                    {shiftTypeAssignments.map((assignment) => (
                                      <div
                                        key={assignment.assignment_id}
                                        className="text-xs font-medium text-[#111827]"
                                      >
                                        {assignment.full_name}
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <div className="flex items-center justify-center py-2 border border-dashed border-gray-300 rounded bg-gray-50/50">
                                    <p className="text-xs text-gray-400 italic">No assignments</p>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <p className="text-xs text-gray-400 italic">No shift</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))
          ) : (
            <div className="p-8 text-center text-[#6B7280]">
              No shifts scheduled for this week
            </div>
          )}
        </div>
      </div>


      <ManageAssignmentsDialog
        isOpen={isManageDialogOpen}
        onClose={handleDialogClose}
        shift={selectedShift}
        assignments={selectedAssignments}
        date={selectedDate}
        onAssignmentChange={handleAssignmentChange}
      />
    </div>
  );
}

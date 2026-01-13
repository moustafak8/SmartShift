import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "../ui/Button";
import type { Shift } from "../../hooks/types/shifts";

interface ShiftCalendarProps {
  shifts: Shift[];
  isLoading: boolean;
}

export function ShiftCalendar({ shifts, isLoading }: ShiftCalendarProps) {
  const [currentWeekStart, setCurrentWeekStart] = useState(() => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const monday = new Date(today);
    monday.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
    monday.setHours(0, 0, 0, 0);
    return monday;
  });

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
    const dateStr = date.toISOString().split("T")[0];
    return shifts.filter((shift) => shift.shift_date.startsWith(dateStr));
  };

  const getUniqueShiftTimes = () => {
    const timesSet = new Set<string>();
    shifts.forEach((shift) => {
      const timeKey = `${shift.start_time} - ${shift.end_time}`;
      timesSet.add(timeKey);
    });
    return Array.from(timesSet).sort();
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-[#6B7280]">Loading shifts...</p>
      </div>
    );
  }

  return (
    <div className="bg-white">
      <div className="flex items-center justify-between px-6 py-4 border-b border-[#E5E7EB]">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              className="px-2"
              onClick={goToPreviousWeek}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="secondary"
              size="sm"
              className="px-2"
              onClick={goToNextWeek}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
          <h2 className="text-lg font-semibold text-[#111827]">
            {formatDateRange()}
          </h2>
        </div>
        <Button variant="secondary" size="sm" onClick={goToToday}>
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
                  className={`p-4 text-center border-r border-[#E5E7EB] last:border-r-0 ${
                    isToday ? "bg-blue-50" : ""
                  }`}
                >
                  <div className="text-xs font-medium text-[#6B7280] uppercase">
                    {day.toLocaleDateString("en-US", { weekday: "short" })}
                  </div>
                  <div
                    className={`text-lg font-semibold mt-1 ${
                      isToday ? "text-[#3B82F6]" : "text-[#111827]"
                    }`}
                  >
                    {day.getDate()}
                  </div>
                </div>
              );
            })}
          </div>

          {shiftTimes.length > 0 ? (
            shiftTimes.map((timeRange) => (
              <div
                key={timeRange}
                className="grid grid-cols-8 border-b border-[#E5E7EB]"
              >
                <div className="p-4 border-r border-[#E5E7EB] flex items-start">
                  <span className="text-sm font-medium text-[#111827]">
                    {timeRange}
                  </span>
                </div>

                {weekDays.map((day, dayIndex) => {
                  const shiftsForTime = getShiftsForTime(day, timeRange);
                  const isToday =
                    day.toDateString() === new Date().toDateString();

                  return (
                    <div
                      key={dayIndex}
                      className={`p-2 border-r border-[#E5E7EB] last:border-r-0 min-h-[100px] ${
                        isToday ? "bg-blue-50/30" : ""
                      }`}
                    >
                      {shiftsForTime.length > 0 ? (
                        <div className="space-y-2">
                          {shiftsForTime.map((shift) => (
                            <div
                              key={shift.id}
                              className={`p-3 rounded-lg border-2 ${getShiftColor(
                                shift.shift_type
                              )} cursor-pointer hover:shadow-md transition-shadow`}
                            >
                              <div className="text-xs text-[#6B7280]">
                                {shift.required_staff_count} staff needed
                              </div>
                              <div className="text-xs text-[#6B7280] mt-1">
                                Status: {shift.status}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="p-3 rounded-lg border-2 border-gray-200 bg-white min-h-[60px]"></div>
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
    </div>
  );
}

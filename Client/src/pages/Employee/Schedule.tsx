import { useState, useMemo, useEffect } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Sunrise,
  Sunset,
  Moon,
  Coffee,
  Clock,
  X,
  Zap,
  Loader2,
  AlertCircle,
  BarChart3,
  Building2,
  Tag,
  Calendar,
} from "lucide-react";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { Layout } from "../../components/Sidebar";
import { useScheduleAssignments } from "../../hooks/Employee/useScheduleAssignments";
import type { ShiftAssignment } from "../../hooks/Employee/useScheduleAssignments";
import { SwapDialog } from "../../components/Employee/SwapDialog";

type SelectedShiftDetails = {
  date: Date;
  assignments: (ShiftAssignment & { type: string; label: string })[];
};

export function Schedule() {
  const getWeekStart = (date: Date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff));
  };

  const [currentWeekStart, setCurrentWeekStart] = useState(
    getWeekStart(new Date())
  );
  const [selectedShift, setSelectedShift] =
    useState<SelectedShiftDetails | null>(null);
  const [isSwapDialogOpen, setIsSwapDialogOpen] = useState(false);
  const [swapShiftDetails, setSwapShiftDetails] = useState<{
    date: string;
    time: string;
    type: string;
    department: string;
  } | null>(null);

  const formatDateForAPI = (date: Date) => {
    return date.toISOString().split("T")[0];
  };

  const { weekAssignments, isLoading, isError } = useScheduleAssignments(
    formatDateForAPI(currentWeekStart)
  );

  const weekDays = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];

 
  const navigateWeek = (direction: "prev" | "next") => {
    const newDate = new Date(currentWeekStart);
    newDate.setDate(newDate.getDate() + (direction === "next" ? 7 : -7));
    setCurrentWeekStart(newDate);
    setSelectedShift(null);
  };

  
  const weekDates = useMemo(() => {
    const dates = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(currentWeekStart);
      date.setDate(date.getDate() + i);
      dates.push(date);
    }
    return dates;
  }, [currentWeekStart]);

 
  const getAssignmentsForDate = (date: Date) => {
    const dateStr = formatDateForAPI(date);
    const dayData = weekAssignments?.days[dateStr];
    if (!dayData) return [];

    const assignments = [];
    if (dayData.day.length > 0)
      assignments.push({
        type: "day",
        ...dayData.day[0],
        label: dayData.labels.day,
      });
    if (dayData.evening.length > 0)
      assignments.push({
        type: "evening",
        ...dayData.evening[0],
        label: dayData.labels.evening,
      });
    if (dayData.night.length > 0)
      assignments.push({
        type: "night",
        ...dayData.night[0],
        label: dayData.labels.night,
      });

    return assignments;
  };

 
  const isToday = (date: Date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

     
  useEffect(() => {
    if (weekAssignments && !selectedShift) {
      const today = new Date();
      const todayAssignments = getAssignmentsForDate(today);
      if (todayAssignments.length > 0) {
        setSelectedShift({ date: today, assignments: todayAssignments });
      }
    }
    
  }, [weekAssignments]);

  const handleDateClick = (date: Date) => {
    const assignments = getAssignmentsForDate(date);
    if (assignments.length > 0) {
      setSelectedShift({ date, assignments });
    } else {
      setSelectedShift(null);
    }
  };

  const getShiftIcon = (type: string) => {
    switch (type) {
      case "day":
        return <Sunrise className="w-5 h-5" />;
      case "evening":
        return <Sunset className="w-5 h-5" />;
      case "night":
        return <Moon className="w-5 h-5" />;
      default:
        return <Coffee className="w-5 h-5" />;
    }
  };

  const formatWeekRange = () => {
    if (!weekAssignments) return "";
    const start = new Date(weekAssignments.start_date);
    const end = new Date(weekAssignments.end_date);
    return `Week of ${start.toLocaleDateString("en-US", { month: "short", day: "numeric" })} - ${end.toLocaleDateString("en-US", { day: "numeric" })}`;
  };

  const formatShiftDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <Layout>
      <div className="bg-white min-h-screen">
        
        <div className="border-b border-[#E5E7EB] bg-white">
          <div className="px-6 py-4">
            <h1 className="text-2xl font-semibold text-[#111827]">My Schedule</h1>
            <p className="text-sm text-[#6B7280] mt-1">
              View your weekly shift assignments
            </p>
          </div>
        </div>

        <div className="p-6 space-y-6">
          <Card className="p-5 border border-[#E5E7EB] bg-gradient-to-r from-white to-[#F9FAFB]">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-semibold text-[#3B82F6] uppercase tracking-wide mb-1">
                  Current Week
                </div>
                <div className="text-xl font-bold text-[#111827]">
                  {formatWeekRange()}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => navigateWeek("prev")}
                  className="flex items-center gap-2 px-4 py-2 border border-[#E5E7EB] bg-white hover:bg-[#F9FAFB] rounded-lg transition-all shadow-sm hover:shadow-md"
                >
                  <ChevronLeft className="w-4 h-4 text-[#6B7280]" />
                  <span className="text-sm font-medium text-[#6B7280]">Previous</span>
                </button>
                <button
                  onClick={() => navigateWeek("next")}
                  className="flex items-center gap-2 px-4 py-2 border border-[#E5E7EB] bg-white hover:bg-[#F9FAFB] rounded-lg transition-all shadow-sm hover:shadow-md"
                >
                  <span className="text-sm font-medium text-[#6B7280]">Next</span>
                  <ChevronRight className="w-4 h-4 text-[#6B7280]" />
                </button>
              </div>
            </div>
          </Card>

            
          {isLoading && (
            <Card className="p-12 text-center">
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-[#3B82F6] mb-4" />
              <p className="text-sm text-[#6B7280]">Loading your schedule...</p>
            </Card>
          )}

          
          {isError && (
            <Card className="p-12 text-center">
              <AlertCircle className="w-12 h-12 mx-auto text-[#EF4444] mb-4" />
              <h3 className="text-lg font-semibold text-[#EF4444] mb-2">
                Failed to load schedule
              </h3>
              <p className="text-sm text-[#6B7280]">
                Please try again later or contact support if the issue persists.
              </p>
            </Card>
          )}

            
          {!isLoading && !isError && weekAssignments && (
            <>
              
              <Card className="p-6 border border-[#E5E7EB] shadow-sm">
                <div className="grid grid-cols-7 gap-4">
                  {weekDays.map((day, index) => {
                    const date = weekDates[index];
                    const assignments = getAssignmentsForDate(date);
                    const today = isToday(date);
                    const isSelected =
                      selectedShift &&
                      formatDateForAPI(selectedShift.date) ===
                        formatDateForAPI(date);
                    const hasShifts = assignments.length > 0;

                    return (
                      <button
                        key={day}
                        onClick={() => handleDateClick(date)}
                        disabled={!hasShifts}
                        className={`relative flex flex-col items-center p-5 rounded-xl transition-all duration-200 ${
                          hasShifts 
                            ? "hover:shadow-lg hover:-translate-y-0.5 cursor-pointer" 
                            : "cursor-default opacity-50"
                        } ${
                          isSelected
                            ? "bg-gradient-to-br from-[#3B82F6] to-[#2563EB] shadow-lg scale-105"
                            : today
                            ? "bg-gradient-to-br from-[#EFF6FF] to-[#DBEAFE] border-2 border-[#3B82F6] shadow-md"
                            : "bg-white border-2 border-[#E5E7EB] hover:border-[#3B82F6]"
                        }`}
                      >
                       
                        {hasShifts && (
                          <div className={`absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shadow-md ${
                            isSelected 
                              ? "bg-white text-[#3B82F6]" 
                              : "bg-[#3B82F6] text-white"
                          }`}>
                            {assignments.length}
                          </div>
                        )}
                        
                        <div className={`text-xs font-semibold mb-2 tracking-wide ${
                          isSelected 
                            ? "text-white" 
                            : "text-[#6B7280]"
                        }`}>
                          {day.charAt(0) + day.slice(1).toLowerCase()}
                        </div>
                        <div
                          className={`text-3xl font-bold ${
                            isSelected
                              ? "text-white"
                              : today
                              ? "text-[#3B82F6]"
                              : "text-[#111827]"
                          }`}
                        >
                          {date.getDate()}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </Card>

                
              {selectedShift && selectedShift.assignments.length > 0 && (
                <Card className="p-6 border border-[#E5E7EB]">
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex items-center gap-2">
                      <div className="text-lg font-semibold text-[#111827]">
                        Shift Details
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        onClick={() => {
                          if (selectedShift && selectedShift.assignments.length > 0) {
                            const assignment = selectedShift.assignments[0];
                            setSwapShiftDetails({
                              date: formatShiftDate(selectedShift.date),
                              time: assignment.label,
                              type: assignment.type,
                              department: assignment.department_name,
                            });
                            setIsSwapDialogOpen(true);
                          }
                        }}
                        className="bg-gradient-to-r from-[#3B82F6] to-[#2563EB] hover:from-[#2563EB] hover:to-[#1D4ED8] text-white inline-flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all"
                      >
                        <Zap className="w-4 h-4" />
                        Request Swap
                      </Button>
                      <button
                        onClick={() => setSelectedShift(null)}
                        className="w-10 h-10 flex items-center justify-center border border-[#E5E7EB] hover:bg-[#F3F4F6] rounded-lg transition-colors bg-white"
                      >
                        <X className="w-4 h-4 text-[#6B7280]" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="font-semibold text-[#111827] text-base">
                      {formatShiftDate(selectedShift.date).toUpperCase()}
                    </div>

                    {selectedShift.assignments.map((assignment, idx) => (
                      <div
                        key={idx}
                        className="pb-6 border-b border-[#E5E7EB] last:border-b-0 last:pb-0"
                      >
                        
                        <div className="flex items-center gap-3 mb-5">
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#EFF6FF] to-[#DBEAFE] flex items-center justify-center shadow-sm">
                            {getShiftIcon(assignment.type)}
                          </div>
                          <div>
                            <div className="font-bold text-[#111827] text-xl capitalize">
                              {assignment.type} Shift
                            </div>
                            <div className="text-xs text-[#6B7280] mt-0.5">
                              {formatShiftDate(selectedShift.date)}
                            </div>
                          </div>
                        </div>

                        
                        <div className="grid grid-cols-2 gap-3 mb-4">
                          
                          <div className="bg-[#F9FAFB] rounded-lg p-3 space-y-2.5 border border-[#E5E7EB]">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-md bg-white flex items-center justify-center">
                                <Clock className="w-3.5 h-3.5 text-[#3B82F6]" />
                              </div>
                              <div>
                                <div className="text-xs text-[#6B7280] font-medium">Time</div>
                                <div className="text-sm font-semibold text-[#111827]">
                                  {assignment.label}
                                </div>
                              </div>
                            </div>

                            <div className="h-px bg-[#E5E7EB]"></div>

                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-md bg-white flex items-center justify-center">
                                <Building2 className="w-3.5 h-3.5 text-[#3B82F6]" />
                              </div>
                              <div>
                                <div className="text-xs text-[#6B7280] font-medium">Department</div>
                                <div className="text-sm font-semibold text-[#111827]">
                                  {assignment.department_name}
                                </div>
                              </div>
                            </div>
                          </div>

                          
                          <div className="bg-[#F9FAFB] rounded-lg p-3 space-y-2.5 border border-[#E5E7EB]">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-md bg-white flex items-center justify-center">
                                <Tag className="w-3.5 h-3.5 text-[#3B82F6]" />
                              </div>
                              <div>
                                <div className="text-xs text-[#6B7280] font-medium">Type</div>
                                <div className="text-sm font-semibold text-[#111827] capitalize">
                                  {assignment.assignment_type}
                                </div>
                              </div>
                            </div>

                            <div className="h-px bg-[#E5E7EB]"></div>

                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-md bg-white flex items-center justify-center">
                                <span className="text-xs">
                                  {assignment.status === "confirmed" ? "✓" : 
                                   assignment.status === "pending" ? "⏱" : "✕"}
                                </span>
                              </div>
                              <div>
                                <div className="text-xs text-[#6B7280] font-medium">Status</div>
                                <div
                                  className={`text-sm font-bold ${
                                    assignment.status === "confirmed"
                                      ? "text-[#10B981]"
                                      : assignment.status === "pending"
                                      ? "text-[#F59E0B]"
                                      : "text-[#EF4444]"
                                  }`}
                                >
                                  {assignment.status.charAt(0).toUpperCase() +
                                    assignment.status.slice(1)}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>


                      </div>
                    ))}
                  </div>
                </Card>
              )}
              {/* Enhanced Week Summary */}
              <Card className="p-6 bg-gradient-to-br from-white to-[#F9FAFB] border border-[#E5E7EB] shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#3B82F6] to-[#2563EB] flex items-center justify-center shadow-md">
                    <BarChart3 className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-[#111827]">
                      Week Summary
                    </h3>
                    <p className="text-xs text-[#6B7280]">Your weekly overview</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-4">
                 
                  <div className="relative overflow-hidden p-5 rounded-xl bg-white border-2 border-[#3B82F6]/30 shadow-sm hover:shadow-md transition-all">
                    <div className="flex items-center justify-between mb-3">
                      <div className="w-10 h-10 rounded-lg bg-[#EFF6FF] flex items-center justify-center shadow-sm">
                        <Clock className="w-5 h-5 text-[#3B82F6]" />
                      </div>
                      <div className="text-xs font-bold text-[#3B82F6] bg-[#EFF6FF] px-2 py-1 rounded-md">
                        Hours
                      </div>
                    </div>
                    <div className="text-xs font-semibold text-[#3B82F6]/70 mb-1 uppercase tracking-wide">
                      Total Hours
                    </div>
                    <div className="text-4xl font-bold text-[#3B82F6] mb-2">
                      {(() => {
                        let totalShifts = 0;
                        Object.values(weekAssignments.days).forEach((day) => {
                          totalShifts += day.day.length + day.evening.length + day.night.length;
                        });
                        return totalShifts * 8;
                      })()}
                      <span className="text-xl ml-1">hrs</span>
                    </div>
                    <div className="h-1.5 bg-white/60 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-[#3B82F6] to-[#2563EB] rounded-full"
                        style={{ width: `${Math.min(((() => {
                          let totalShifts = 0;
                          Object.values(weekAssignments.days).forEach((day) => {
                            totalShifts += day.day.length + day.evening.length + day.night.length;
                          });
                          return totalShifts * 8;
                        })() / 40) * 100, 100)}%` }}
                      ></div>
                    </div>
                  </div>

                 
                  <div className="relative overflow-hidden p-5 rounded-xl bg-white border-2 border-[#10B981]/30 shadow-sm hover:shadow-md transition-all">
                    <div className="flex items-center justify-between mb-3">
                      <div className="w-10 h-10 rounded-lg bg-[#DCFCE7] flex items-center justify-center shadow-sm">
                        <Calendar className="w-5 h-5 text-[#10B981]" />
                      </div>
                      <div className="text-xs font-bold text-[#10B981] bg-[#DCFCE7] px-2 py-1 rounded-md">
                        Shifts
                      </div>
                    </div>
                    <div className="text-xs font-semibold text-[#10B981]/70 mb-1 uppercase tracking-wide">
                      Total Shifts
                    </div>
                    <div className="text-4xl font-bold text-[#10B981] mb-2">
                      {(() => {
                        let totalShifts = 0;
                        Object.values(weekAssignments.days).forEach((day) => {
                          totalShifts += day.day.length + day.evening.length + day.night.length;
                        });
                        return totalShifts;
                      })()}
                      <span className="text-xl ml-1">shifts</span>
                    </div>
                    <div className="h-1.5 bg-white/60 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-[#10B981] to-[#059669] rounded-full"
                        style={{ width: `${Math.min(((() => {
                          let totalShifts = 0;
                          Object.values(weekAssignments.days).forEach((day) => {
                            totalShifts += day.day.length + day.evening.length + day.night.length;
                          });
                          return totalShifts;
                        })() / 7) * 100, 100)}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="relative overflow-hidden p-5 rounded-xl bg-white border-2 border-[#A855F7]/30 shadow-sm hover:shadow-md transition-all">
                    <div className="flex items-center justify-between mb-3">
                      <div className="w-10 h-10 rounded-lg bg-[#F3E8FF] flex items-center justify-center shadow-sm">
                        <Moon className="w-5 h-5 text-[#A855F7]" />
                      </div>
                      <div className="text-xs font-bold text-[#A855F7] bg-[#F3E8FF] px-2 py-1 rounded-md">
                        Rest
                      </div>
                    </div>
                    <div className="text-xs font-semibold text-[#A855F7]/70 mb-1 uppercase tracking-wide">
                      Days Off
                    </div>
                    <div className="text-4xl font-bold text-[#A855F7] mb-2">
                      {(() => {
                        let daysOff = 7;
                        Object.values(weekAssignments.days).forEach((day) => {
                          const hasShift = day.day.length > 0 || day.evening.length > 0 || day.night.length > 0;
                          if (hasShift) daysOff--;
                        });
                        return daysOff;
                      })()}
                      <span className="text-xl ml-1">days</span>
                    </div>
                    <div className="h-1.5 bg-[#F3F4F6] rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-[#A855F7] to-[#9333EA] rounded-full"
                        style={{ width: `${((() => {
                          let daysOff = 7;
                          Object.values(weekAssignments.days).forEach((day) => {
                            const hasShift = day.day.length > 0 || day.evening.length > 0 || day.night.length > 0;
                            if (hasShift) daysOff--;
                          });
                          return daysOff;
                        })() / 7) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </Card>
            </>
          )}
        </div>
      </div>

      
      {swapShiftDetails && (
        <SwapDialog
          isOpen={isSwapDialogOpen}
          onClose={() => setIsSwapDialogOpen(false)}
          shiftDetails={swapShiftDetails}
        />
      )}
    </Layout>
  );
}

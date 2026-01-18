import { useState } from "react";
import { Calendar, Plus } from "lucide-react";
import { Button } from "../../components/ui/Button";
import { Layout } from "../../components/Sidebar";
import { AddShiftDialog } from "../../components/Manager/AddShiftDialog";
import {GenerateScheduleDialog} from "../../components/Manager/GenerateScheduleDialog";
import { ShiftCalendar } from "../../components/Manager/ShiftCalendar";
import { useShiftTemplates, useShifts, useShiftAssignments } from "../../hooks/Manager/useShifts";
import { useAuth } from "../../hooks/context/AuthContext";

export function Shifts() {
  const [isAddShiftOpen, setIsAddShiftOpen] = useState(false);
  const [isGenerateScheduleOpen, setIsGenerateScheduleOpen] = useState(false);
  const { refetch } = useShiftTemplates();
  const { departmentId } = useAuth();
  const { shifts, isLoading, refetch: refetchShifts } = useShifts(departmentId || 0);

  const [startDate, setStartDate] = useState(() => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const monday = new Date(today);
    monday.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
    const year = monday.getFullYear();
    const month = String(monday.getMonth() + 1).padStart(2, '0');
    const day = String(monday.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  });
  
  const { assignments, isLoading: assignmentsLoading, refetch: refetchAssignments } = useShiftAssignments(
    startDate,
    departmentId || 0
  );

  const handleRefresh = () => {
    refetch();
    refetchShifts();
    refetchAssignments();
  };

  return (
    <Layout notificationCount={8}>
      <div className="bg-white min-h-screen">
        {/* Header Section */}
        <div className="bg-gradient-to-r from-slate-50 via-blue-50/30 to-slate-50 border-b border-[#E5E7EB]">
          <div className="px-6 py-5">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-[#111827] flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#3B82F6] to-[#2563EB] flex items-center justify-center shadow-lg">
                    <Calendar className="w-5 h-5 text-white" />
                  </div>
                  Shift Schedule
                </h1>
                <p className="text-sm text-[#6B7280] mt-1.5 ml-[52px]">
                  View and manage shift schedules for your team
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Button
                  onClick={() => setIsGenerateScheduleOpen(true)}
                  className="bg-gradient-to-r from-[#3B82F6] to-[#2563EB] hover:from-[#2563EB] hover:to-[#1D4ED8] text-white flex items-center shadow-md hover:shadow-lg transition-all"
                  size="sm"
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  Generate Schedule
                </Button>
                <Button
                  onClick={() => setIsAddShiftOpen(true)}
                  className="bg-gradient-to-r from-[#10B981] to-[#059669] hover:from-[#059669] hover:to-[#047857] text-white flex items-center shadow-md hover:shadow-lg transition-all"
                  size="sm"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Shift
                </Button>
              </div>
            </div>
          </div>
        </div>

       
        <ShiftCalendar 
          shifts={shifts} 
          isLoading={isLoading || assignmentsLoading} 
          assignments={assignments}
          onWeekChange={setStartDate}
          onAssignmentChange={refetchAssignments}
        />
      </div>

      <AddShiftDialog
        isOpen={isAddShiftOpen}
        onClose={() => setIsAddShiftOpen(false)}
        onRefresh={handleRefresh}
      />

      <GenerateScheduleDialog
        isOpen={isGenerateScheduleOpen}
        onClose={() => setIsGenerateScheduleOpen(false)}
        onSuccess={handleRefresh}
      />
    </Layout>
  );
}

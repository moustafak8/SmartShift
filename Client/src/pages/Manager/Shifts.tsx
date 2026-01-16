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
        <div className="border-b border-[#E5E7EB] bg-white">
          <div className="px-6 py-4">
            <h1 className="text-2xl font-semibold text-[#111827]">
              Shift Schedule
            </h1>
            <p className="text-sm text-[#6B7280] mt-1">
              View and manage shift schedules for your team
            </p>
          </div>
        </div>
        <div className="flex items-center justify-between px-6 py-4">
          <div />
          <div className="flex gap-2">
            <Button
              onClick={() => setIsGenerateScheduleOpen(true)}
              className="bg-[#3B82F6] hover:bg-[#2563EB] text-white flex items-center"
              size="sm"
            >
              <Calendar className="w-4 h-4 mr-2" />
              Generate Schedule
            </Button>
            <Button
              onClick={() => setIsAddShiftOpen(true)}
              className="bg-[#10B981] hover:bg-[#059669] text-white flex items-center"
              size="sm"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create New Shift
            </Button>
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

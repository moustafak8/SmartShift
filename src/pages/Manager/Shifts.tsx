import { useState } from "react";
import { Calendar, Plus } from "lucide-react";
import { Button } from "../../components/ui/Button";
import { Layout } from "../../components/Sidebar";
import { AddShiftDialog } from "../../components/Manager/AddShiftDialog";
import { ShiftCalendar } from "../../components/Manager/ShiftCalendar";
import { useShiftTemplates, useShifts } from "../../hooks/Manager/useShifts";
import { useAuth } from "../../hooks/context/AuthContext";

export function Shifts() {
  const [isAddShiftOpen, setIsAddShiftOpen] = useState(false);
  const { refetch } = useShiftTemplates();
  const { departmentId } = useAuth();
  const { shifts, isLoading, refetch: refetchShifts } = useShifts(departmentId || 0);

  const handleRefresh = () => {
    refetch();
    refetchShifts();
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

        {/* Shift Calendar */}
        <ShiftCalendar shifts={shifts} isLoading={isLoading} />
      </div>

      <AddShiftDialog
        isOpen={isAddShiftOpen}
        onClose={() => setIsAddShiftOpen(false)}
        onRefresh={handleRefresh}
      />
    </Layout>
  );
}

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../ui/Dialog";
import { Button } from "../ui/Button";
import { Calendar, Clock, User, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { useSwapCandidates, useCreateSwap, useSwappableShifts } from "../../hooks/Employee/useShiftSwap";

interface TargetShiftDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onBack: () => void;
  requesterShiftId: number;
  requesterAssignmentId: number | null;
  swapReason: string;
}

export function TargetShiftDialog({
  isOpen,
  onClose,
  onBack,
  requesterShiftId,
  requesterAssignmentId,
  swapReason,
}: TargetShiftDialogProps) {
  const [selectedShiftId, setSelectedShiftId] = useState<number | null>(null);
  const [selectedEmployee, setSelectedEmployee] = useState<number | null>(null);
  const [step, setStep] = useState<"shift" | "employee" | "confirm">("shift");

  const { shifts: availableShifts, isLoading: loadingShifts, isError: shiftsError } = useSwappableShifts(requesterAssignmentId);
  const { candidates, isLoading: loadingCandidates, isError: candidatesError } = useSwapCandidates(selectedShiftId);
  const createSwap = useCreateSwap();

  useEffect(() => {
    if (!isOpen) {
      setSelectedShiftId(null);
      setSelectedEmployee(null);
      setStep("shift");
    }
  }, [isOpen]);

  const handleShiftSelect = (shiftId: number) => {
    setSelectedShiftId(shiftId);
    setSelectedEmployee(null);
    setStep("employee");
  };

  const handleEmployeeSelect = (employeeId: number) => {
    setSelectedEmployee(employeeId);
    setStep("confirm");
  };

  const handleSubmit = async () => {
    if (!selectedShiftId || !selectedEmployee) return;

    try {
      await createSwap.mutateAsync({
        requester_shift_id: requesterShiftId,
        target_employee_id: selectedEmployee,
        target_shift_id: selectedShiftId,
        swap_reason: swapReason,
      });
      onClose();
    } catch (error) {
      console.error("Failed to create swap:", error);
    }
  };

  const selectedShift = availableShifts.find((s) => s.shift_id === selectedShiftId);
  const selectedCandidateData = candidates.find((c) => c.employee_id === selectedEmployee);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-[#111827]">
            {step === "shift" && "Select Target Shift"}
            {step === "employee" && "Select Employee to Swap With"}
            {step === "confirm" && "Confirm Swap Request"}
          </DialogTitle>
          <DialogDescription className="text-sm text-[#6B7280]">
            {step === "shift" && "Choose which shift you'd like to take"}
            {step === "employee" && "Choose an eligible colleague for the swap"}
            {step === "confirm" && "Review and submit your swap request"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
         
          {step === "shift" && (
            <div className="space-y-3">
              {loadingShifts && (
                <div className="text-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto text-[#3B82F6] mb-3" />
                  <p className="text-sm text-[#6B7280]">Loading available shifts...</p>
                </div>
              )}

              {shiftsError && (
                <div className="text-center py-8">
                  <AlertCircle className="w-12 h-12 mx-auto text-[#EF4444] mb-3" />
                  <p className="text-sm text-[#EF4444]">Failed to load shifts</p>
                </div>
              )}

              {!loadingShifts && !shiftsError && availableShifts.length === 0 && (
                <div className="text-center py-8 text-[#6B7280]">
                  <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No available shifts to swap with on this date</p>
                </div>
              )}

              {!loadingShifts && !shiftsError && availableShifts.length > 0 && (
                availableShifts.map((shift) => (
                  <button
                    key={shift.shift_id}
                    onClick={() => handleShiftSelect(shift.shift_id)}
                    className={`w-full p-4 rounded-lg border-2 text-left transition-all hover:shadow-md ${
                      selectedShiftId === shift.shift_id
                        ? "border-[#3B82F6] bg-[#EFF6FF]"
                        : "border-[#E5E7EB] hover:border-[#3B82F6]"
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-[#3B82F6] to-[#2563EB] flex items-center justify-center">
                        <Calendar className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <div className="font-semibold text-[#111827]">
                          {formatDate(shift.shift_date)}
                        </div>
                        <div className="text-sm text-[#6B7280] flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          <span className="capitalize">{shift.shift_type} Shift</span>
                        </div>
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          )}

          
          {step === "employee" && (
            <div className="space-y-4">
              <div className="p-3 rounded-lg bg-[#F9FAFB] border border-[#E5E7EB]">
                <div className="text-xs text-[#6B7280] mb-1">Selected Shift</div>
                <div className="font-semibold text-[#111827]">
                  {selectedShift && formatDate(selectedShift.shift_date)} - {selectedShift?.shift_type} Shift
                </div>
              </div>

              {loadingCandidates && (
                <div className="text-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto text-[#3B82F6] mb-3" />
                  <p className="text-sm text-[#6B7280]">Loading eligible employees...</p>
                </div>
              )}

              {candidatesError && (
                <div className="text-center py-8">
                  <AlertCircle className="w-12 h-12 mx-auto text-[#EF4444] mb-3" />
                  <p className="text-sm text-[#EF4444]">Failed to load employees</p>
                </div>
              )}

              {!loadingCandidates && !candidatesError && candidates.length === 0 && (
                <div className="text-center py-8 text-[#6B7280]">
                  <User className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No eligible employees found for this shift</p>
                  <p className="text-xs mt-1">Only employees with the same position can swap</p>
                </div>
              )}

              {!loadingCandidates && candidates.length > 0 && (
                <div className="space-y-3">
                  {candidates.map((candidate) => (
                    <button
                      key={candidate.employee_id}
                      onClick={() => handleEmployeeSelect(candidate.employee_id)}
                      className={`w-full p-4 rounded-lg border-2 text-left transition-all hover:shadow-md ${
                        selectedEmployee === candidate.employee_id
                          ? "border-[#3B82F6] bg-[#EFF6FF]"
                          : "border-[#E5E7EB] hover:border-[#3B82F6]"
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#10B981] to-[#059669] flex items-center justify-center">
                          <User className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <div className="font-semibold text-[#111827]">
                            {candidate.full_name}
                          </div>
                          <div className="text-sm text-[#6B7280]">
                            {candidate.email}
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

         
          {step === "confirm" && (
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-[#F0FDF4] border border-[#10B981]/30">
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle2 className="w-5 h-5 text-[#10B981]" />
                  <span className="font-semibold text-[#111827]">Swap Summary</span>
                </div>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-[#6B7280]">Target Shift:</span>
                    <span className="font-medium text-[#111827]">
                      {selectedShift && formatDate(selectedShift.shift_date)} ({selectedShift?.shift_type})
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#6B7280]">Swap With:</span>
                    <span className="font-medium text-[#111827]">
                      {selectedCandidateData?.full_name}
                    </span>
                  </div>
                  {swapReason && (
                    <div className="flex justify-between">
                      <span className="text-[#6B7280]">Reason:</span>
                      <span className="font-medium text-[#111827] capitalize">
                        {swapReason}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="p-3 rounded-lg bg-[#FEF3C7] border border-[#F59E0B]/30">
                <p className="text-sm text-[#92400E]">
                  Your request will be automatically validated by our AI system. 
                  You'll receive a notification once it's processed.
                </p>
              </div>
            </div>
          )}
        </div>

        
        <div className="flex items-center justify-between pt-4 border-t border-[#E5E7EB]">
          <Button
            variant="secondary"
            onClick={step === "shift" ? onBack : () => setStep(step === "confirm" ? "employee" : "shift")}
            className="px-6"
          >
            Back
          </Button>
          
          {step === "confirm" ? (
            <Button
              onClick={handleSubmit}
              disabled={createSwap.isPending}
              className="px-6 bg-gradient-to-r from-[#10B981] to-[#059669] hover:from-[#059669] hover:to-[#047857] text-white shadow-md hover:shadow-lg transition-all"
            >
              {createSwap.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Submitting...
                </>
              ) : (
                "Submit Swap Request"
              )}
            </Button>
          ) : (
            <Button
              onClick={onClose}
              variant="secondary"
              className="px-6"
            >
              Cancel
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

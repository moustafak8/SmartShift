import { useState, useMemo } from "react";
import {
  UserPlus,
  Trash2,
  Users,
  Clock,
  Calendar,
  CheckCircle,
  Lock,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/Dialog";
import { Button } from "../ui/Button";
import { useToast } from "../ui/Toast";
import { ConfirmDialog } from "../ui/ConfirmDialog";
import {
  useCreateAssignment,
  useDeleteAssignment,
  useAvailableEmployees,
} from "../../hooks/Manager/useAssignments";
import { useAuth } from "../../hooks/context/AuthContext";
import type { Shift, ShiftAssignment } from "../../hooks/types/shifts";

interface ManageAssignmentsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  shift: Shift | null;
  assignments: ShiftAssignment[];
  date: string;
  onAssignmentChange: () => void;
}

export function ManageAssignmentsDialog({
  isOpen,
  onClose,
  shift,
  assignments,
  date,
  onAssignmentChange,
}: ManageAssignmentsDialogProps) {
  const { departmentId } = useAuth();
  const toast = useToast();
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>("");
  const [assignmentType, setAssignmentType] = useState<
    "regular" | "overtime" | "cover"
  >("regular");
  const [assignmentStatus, setAssignmentStatus] = useState<
    "assigned" | "confirmed"
  >("assigned");

  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [assignmentToDelete, setAssignmentToDelete] = useState<{
    id: number;
    name: string;
  } | null>(null);

  const { mutate: createAssignment, isPending: isCreating } =
    useCreateAssignment();
  const { mutate: deleteAssignment, isPending: isDeleting } =
    useDeleteAssignment();
  const { employees, isLoading: loadingEmployees } = useAvailableEmployees(
    departmentId || 0,
    date,
  );

  const isPastShift = useMemo(() => {
    if (!date) return false;
    const shiftDate = new Date(date);
    shiftDate.setHours(23, 59, 59, 999);
    const today = new Date();
    return shiftDate < today;
  }, [date]);

  const positionStats = useMemo<
    Array<{
      position_id: number;
      position_name: string;
      required: number;
      filled: number;
    }>
  >(() => {
    if (!shift) return [];

    const requirements = (shift as any).position_requirements || [];

    if (requirements.length === 0) {
      return [];
    }

    const assignmentsByPosition = assignments.reduce(
      (acc, assignment) => {
        const posId = assignment.position_id;
        if (posId) {
          if (!acc[posId]) acc[posId] = [];
          acc[posId].push(assignment);
        }
        return acc;
      },
      {} as Record<number, typeof assignments>,
    );

    return requirements.map((req: any) => ({
      position_id: req.position_id,
      position_name: req.position_name || "Unknown Position",
      required: req.required_count,
      filled: assignmentsByPosition[req.position_id]?.length || 0,
    }));
  }, [shift, assignments]);

  const filledPositionIds = useMemo(() => {
    return positionStats
      .filter((stat) => stat.filled >= stat.required)
      .map((stat) => stat.position_id);
  }, [positionStats]);

  if (!shift) return null;

  const assignedCount = assignments.length;
  const requiredCount = shift.required_staff_count;
  const canAddMore = assignedCount < requiredCount && !isPastShift;
  const assignedEmployeeIds = assignments.map((a) => a.employee_id);

  const availableEmployees = employees.filter(
    (emp) =>
      !assignedEmployeeIds.includes(emp.id) &&
      !filledPositionIds.includes(emp.position_id || 0),
  );

  const handleAddAssignment = () => {
    if (!selectedEmployeeId) {
      toast.error("Please select an employee");
      return;
    }

    const employeeId = parseInt(selectedEmployeeId);
    const selectedEmployee = employees.find((emp) => emp.id === employeeId);

    if (!selectedEmployee) {
      toast.error("Selected employee not found");
      return;
    }

    createAssignment(
      {
        shift_id: shift.id,
        employee_id: employeeId,
        position_id: selectedEmployee.position_id,
        assignment_type: assignmentType,
        status: assignmentStatus,
      },
      {
        onSuccess: () => {
          toast.success("Assignment added successfully");
          setSelectedEmployeeId("");
          setAssignmentType("regular");
          setAssignmentStatus("assigned");
          onAssignmentChange();
          onClose();
        },
        onError: (error: any) => {
          toast.error(
            error.response?.data?.payload?.message ||
              error.response?.data?.message ||
              "Failed to add assignment",
          );
        },
      },
    );
  };

  const handleRemoveAssignment = (
    assignmentId: number,
    employeeName: string,
  ) => {
    setAssignmentToDelete({ id: assignmentId, name: employeeName });
    setIsConfirmOpen(true);
  };

  const confirmDelete = () => {
    if (!assignmentToDelete) return;

    deleteAssignment(assignmentToDelete.id, {
      onSuccess: () => {
        toast.success(`Removed ${assignmentToDelete.name} from shift`);
        onAssignmentChange();
        setIsConfirmOpen(false);
        setAssignmentToDelete(null);
        onClose();
      },
      onError: (error: any) => {
        toast.error(
          error.response?.data?.payload?.message ||
            error.response?.data?.message ||
            "Failed to remove assignment",
        );
        setIsConfirmOpen(false);
        setAssignmentToDelete(null);
      },
    });
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

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      weekday: "long",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-[#3B82F6]" />
            Manage Shift Assignments
          </DialogTitle>
          <DialogDescription>
            Add or remove employees for this shift
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-900">
                  {formatDate(date)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {isPastShift && (
                  <span className="px-3 py-1 rounded-full text-xs font-medium border bg-gray-100 text-gray-600 border-gray-300 flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" />
                    Completed
                  </span>
                )}
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium border ${getShiftTypeColor(
                    shift.shift_type,
                  )}`}
                >
                  {shift.shift_type}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm text-blue-800">
              <Clock className="w-4 h-4" />
              <span>
                {shift.start_time.substring(0, 5)} -{" "}
                {shift.end_time.substring(0, 5)}
              </span>
            </div>
            <div className="mt-3">
              {positionStats.length > 0 ? (
                <div className="space-y-2">
                  {positionStats.map((stat) => (
                    <div
                      key={stat.position_id}
                      className="flex items-center justify-between"
                    >
                      <span className="text-sm text-blue-900">
                        <span
                          className={`font-semibold ${stat.filled >= stat.required ? "text-green-600" : "text-amber-600"}`}
                        >
                          {stat.filled}/{stat.required}
                        </span>{" "}
                        {stat.position_name} filled
                      </span>
                      <div className="w-24 bg-blue-200 rounded-full h-1.5">
                        <div
                          className={`h-1.5 rounded-full transition-all ${
                            stat.filled >= stat.required
                              ? "bg-green-500"
                              : stat.filled >= stat.required / 2
                                ? "bg-amber-500"
                                : "bg-red-500"
                          }`}
                          style={{
                            width: `${Math.min((stat.filled / stat.required) * 100, 100)}%`,
                          }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-blue-900">
                    <span className="font-semibold">
                      {assignedCount}/{requiredCount}
                    </span>{" "}
                    positions filled
                  </span>
                  <div className="w-32 bg-blue-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all ${
                        assignedCount >= requiredCount
                          ? "bg-green-500"
                          : assignedCount >= requiredCount / 2
                            ? "bg-amber-500"
                            : "bg-red-500"
                      }`}
                      style={{
                        width: `${Math.min((assignedCount / requiredCount) * 100, 100)}%`,
                      }}
                    ></div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-[#111827] mb-3">
              Current Assignments ({assignedCount})
            </h3>
            {assignments.length > 0 ? (
              <div className="space-y-2">
                {assignments.map((assignment) => (
                  <div
                    key={assignment.assignment_id}
                    className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#3B82F6] text-white flex items-center justify-center text-sm font-medium">
                        {assignment.full_name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .toUpperCase()
                          .substring(0, 2)}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-[#111827]">
                          {assignment.full_name}
                        </p>
                        <p className="text-xs text-[#6B7280]">
                          {assignment.position_name && (
                            <span className="font-medium text-[#3B82F6]">
                              {assignment.position_name}
                            </span>
                          )}
                          {assignment.position_name && " • "}
                          <span className="capitalize">
                            {assignment.assignment_type} • {assignment.status}
                          </span>
                        </p>
                      </div>
                    </div>
                    {isPastShift ? (
                      <span className="text-xs text-gray-400 flex items-center gap-1">
                        <Lock className="w-3 h-3" />
                        Locked
                      </span>
                    ) : (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() =>
                          handleRemoveAssignment(
                            assignment.assignment_id,
                            assignment.full_name,
                          )
                        }
                        disabled={isDeleting}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50">
                <Users className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-500">No assignments yet</p>
                <p className="text-xs text-gray-400 mt-1">
                  Add employees to this shift below
                </p>
              </div>
            )}
          </div>

          {canAddMore && (
            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-sm font-semibold text-[#111827] mb-3 flex items-center gap-2">
                <UserPlus className="w-4 h-4" />
                Add Employee to Shift
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Employee
                  </label>
                  <select
                    value={selectedEmployeeId}
                    onChange={(e) => setSelectedEmployeeId(e.target.value)}
                    disabled={loadingEmployees || isCreating}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent"
                  >
                    <option value="">
                      {loadingEmployees
                        ? "Loading employees..."
                        : "Select an employee"}
                    </option>
                    {availableEmployees.map((employee) => (
                      <option key={employee.id} value={employee.id}>
                        {employee.full_name} - {employee.position_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Assignment Type
                  </label>
                  <select
                    value={assignmentType}
                    onChange={(e) =>
                      setAssignmentType(
                        e.target.value as "regular" | "overtime" | "cover",
                      )
                    }
                    disabled={isCreating}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent"
                  >
                    <option value="regular">Regular</option>
                    <option value="overtime">Overtime</option>
                    <option value="cover">Cover</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    value={assignmentStatus}
                    onChange={(e) =>
                      setAssignmentStatus(
                        e.target.value as "assigned" | "confirmed",
                      )
                    }
                    disabled={isCreating}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent"
                  >
                    <option value="assigned">Assigned</option>
                    <option value="confirmed">Confirmed</option>
                  </select>
                </div>

                <Button
                  onClick={handleAddAssignment}
                  disabled={!selectedEmployeeId || isCreating}
                  className="w-full bg-[#10B981] hover:bg-[#059669] text-white !py-2 !px-4 text-sm h-10 flex items-center justify-center gap-2"
                  size="sm"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Add Assignment</span>
                </Button>
              </div>
              {availableEmployees.length === 0 && !loadingEmployees && (
                <p className="text-xs text-amber-600 mt-2">
                  All available employees are already assigned to this shift
                </p>
              )}
            </div>
          )}

          {isPastShift && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
              <p className="text-sm text-gray-700 font-medium flex items-center gap-2">
                <Lock className="w-4 h-4" />
                This shift has been completed
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Past shifts cannot be modified. View only mode.
              </p>
            </div>
          )}

          {!isPastShift && !canAddMore && assignedCount >= requiredCount && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <p className="text-sm text-green-800 font-medium">
                ✓ This shift is fully staffed
              </p>
              <p className="text-xs text-green-600 mt-1">
                All required positions have been filled
              </p>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t border-gray-200">
          <Button variant="secondary" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>

      <ConfirmDialog
        open={isConfirmOpen}
        onOpenChange={setIsConfirmOpen}
        onConfirm={confirmDelete}
        title="Remove Assignment"
        description={`Are you sure you want to remove ${assignmentToDelete?.name} from this shift? This action cannot be undone.`}
        confirmText="Remove"
        cancelText="Cancel"
        variant="danger"
      />
    </Dialog>
  );
}

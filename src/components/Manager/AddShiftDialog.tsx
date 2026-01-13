import { useState } from "react";
import { Calendar, Clock, Users, FileText, Repeat, Briefcase } from "lucide-react";
import {
  Button,
  Input,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "../ui";
import { useShiftTemplates, useCreateShift } from "../../hooks/Manager/useShifts";
import { usePositions } from "../../hooks/Manager/usePositions";
import { useAuth } from "../../hooks/context/AuthContext";
import { useToast } from "../ui/Toast";
import type { ShiftFormData, PositionRequirement } from "../../hooks/types/shifts";

interface AddShiftDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onRefresh: () => void;
}


export function AddShiftDialog({
  isOpen,
  onClose,
  onRefresh,
}: AddShiftDialogProps) {
  const { shiftTemplates, isLoading: templatesLoading } = useShiftTemplates();
  const { positions, isLoading: positionsLoading } = usePositions();
  const { departmentId } = useAuth();
  const toast = useToast();
  const { mutate: createShift, isPending } = useCreateShift();

  const [positionRequirements, setPositionRequirements] = useState<PositionRequirement[]>([]);

  const [formData, setFormData] = useState<ShiftFormData>({
    department_id: departmentId || 0,
    shift_template_id: null,
    shift_date: new Date().toISOString().split("T")[0],
    start_time: "08:00",
    end_time: "16:00",
    shift_type: "day",
    required_staff_count: 1,
    notes: "",
    status: "open",
    is_recurring: false,
    recurrence_type: null,
    recurrence_end_date: "",
  });

  const [formErrors, setFormErrors] = useState<Partial<Record<keyof ShiftFormData, string>>>({});

  // Auto-fill form when template is selected
  const handleTemplateChange = (templateId: string) => {
    const template = shiftTemplates.find((t) => t.id === Number(templateId));
    if (template) {
      setFormData((prev) => ({
        ...prev,
        shift_template_id: template.id,
        start_time: template.start_time.substring(0, 5), // HH:MM format
        end_time: template.end_time.substring(0, 5),
        shift_type: template.shift_type,
      }));
      
      if (template.position_requirements && template.position_requirements.length > 0) {
        setPositionRequirements(template.position_requirements);
      } else {
        setPositionRequirements([]);
      }
    } else {
      setFormData((prev) => ({
        ...prev,
        shift_template_id: null,
      }));
      setPositionRequirements([]);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    
    setFormData((prev) => ({
      ...prev,
      [name]:
        type === "number"
          ? Number(value)
          : type === "checkbox"
          ? (e.target as HTMLInputElement).checked
          : value,
    }));

    // Clear error for this field
    if (formErrors[name as keyof ShiftFormData]) {
      setFormErrors((prev) => ({
        ...prev,
        [name]: undefined,
      }));
    }
  };

  const handleRecurringChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const isRecurring = e.target.checked;
    let endDate = "";
    if (isRecurring && formData.shift_date) {
      const shiftDate = new Date(formData.shift_date);
      shiftDate.setDate(shiftDate.getDate() + 7);
      endDate = shiftDate.toISOString().split("T")[0];
    }
    
    setFormData((prev) => ({
      ...prev,
      is_recurring: isRecurring,
      recurrence_type: isRecurring ? "weekly" : null,
      recurrence_end_date: endDate,
    }));
  };

  const validateForm = (): boolean => {
    const errors: Partial<Record<keyof ShiftFormData, string>> = {};

    if (!formData.shift_date) {
      errors.shift_date = "Shift date is required";
    }

    if (!formData.start_time) {
      errors.start_time = "Start time is required";
    }

    if (!formData.end_time) {
      errors.end_time = "End time is required";
    }

    if (formData.required_staff_count < 1) {
      errors.required_staff_count = "At least 1 staff member is required";
    }

    if (formData.is_recurring && !formData.recurrence_end_date) {
      errors.recurrence_end_date = "End date is required for recurring shifts";
    }

    if (
      formData.is_recurring &&
      formData.recurrence_end_date &&
      formData.recurrence_end_date <= formData.shift_date
    ) {
      errors.recurrence_end_date = "End date must be after start date";
    }

    if (positionRequirements.length === 0) {
      toast.error("Please select at least one position");
      return false;
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    const submitData = {
      ...formData,
      position_requirements: positionRequirements,
    };

    createShift(submitData, {
      onSuccess: () => {
        toast.success(
          formData.is_recurring
            ? "Recurring shifts created successfully!"
            : "Shift created successfully!"
        );
        handleCloseModal();
        onRefresh();
      },
      onError: (error: any) => {
        const errorMessage =
          error?.response?.data?.message || "Failed to create shift. Please try again.";
        toast.error(errorMessage);
      },
    });
  };

  const handleCloseModal = () => {
    setFormData({
      department_id: departmentId || 0,
      shift_template_id: null,
      shift_date: new Date().toISOString().split("T")[0],
      start_time: "08:00",
      end_time: "16:00",
      shift_type: "day",
      required_staff_count: 1,
      notes: "",
      status: "open",
      is_recurring: false,
      recurrence_type: null,
      recurrence_end_date: "",
    });
    setFormErrors({});
    setPositionRequirements([]);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleCloseModal}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Shift</DialogTitle>
          <DialogDescription>
            Create a new shift or use a template. You can set it to recur automatically.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
          
          <div>
            <label
              htmlFor="shift_template_id"
              className="block text-sm font-medium text-[#111827] mb-2"
            >
              Use Template (Optional)
            </label>
            <select
              id="shift_template_id"
              name="shift_template_id"
              value={formData.shift_template_id || ""}
              onChange={(e) => handleTemplateChange(e.target.value)}
              className="w-full px-3 py-2 border border-[#E5E7EB] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
              disabled={templatesLoading}
            >
              <option value="">Custom Shift</option>
              {shiftTemplates.map((template) => (
                <option key={template.id} value={template.id}>
                  {template.name} ({template.start_time.substring(0, 5)} -{" "}
                  {template.end_time.substring(0, 5)})
                </option>
              ))}
            </select>
          </div>

         
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="shift_date"
                className="block text-sm font-medium text-[#111827] mb-2"
              >
                Shift Date <span className="text-[#EF4444]">*</span>
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B7280]" />
                <Input
                  id="shift_date"
                  name="shift_date"
                  type="date"
                  value={formData.shift_date}
                  onChange={handleInputChange}
                  className={`pl-10 ${formErrors.shift_date ? "border-[#EF4444]" : ""}`}
                />
              </div>
              {formErrors.shift_date && (
                <p className="text-xs text-[#EF4444] mt-1">{formErrors.shift_date}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="shift_type"
                className="block text-sm font-medium text-[#111827] mb-2"
              >
                Shift Type <span className="text-[#EF4444]">*</span>
              </label>
              <select
                id="shift_type"
                name="shift_type"
                value={formData.shift_type}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-[#E5E7EB] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
              >
                <option value="day">Day</option>
                <option value="evening">Evening</option>
                <option value="night">Night</option>
                <option value="rotating">Rotating</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="start_time"
                className="block text-sm font-medium text-[#111827] mb-2"
              >
                Start Time <span className="text-[#EF4444]">*</span>
              </label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B7280]" />
                <Input
                  id="start_time"
                  name="start_time"
                  type="time"
                  value={formData.start_time}
                  onChange={handleInputChange}
                  className={`pl-10 ${formErrors.start_time ? "border-[#EF4444]" : ""}`}
                />
              </div>
              {formErrors.start_time && (
                <p className="text-xs text-[#EF4444] mt-1">{formErrors.start_time}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="end_time"
                className="block text-sm font-medium text-[#111827] mb-2"
              >
                End Time <span className="text-[#EF4444]">*</span>
              </label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B7280]" />
                <Input
                  id="end_time"
                  name="end_time"
                  type="time"
                  value={formData.end_time}
                  onChange={handleInputChange}
                  className={`pl-10 ${formErrors.end_time ? "border-[#EF4444]" : ""}`}
                />
              </div>
              {formErrors.end_time && (
                <p className="text-xs text-[#EF4444] mt-1">{formErrors.end_time}</p>
              )}
            </div>
          </div>

          
          <div>
            <label
              htmlFor="required_staff_count"
              className="block text-sm font-medium text-[#111827] mb-2"
            >
              Required Staff Count <span className="text-[#EF4444]">*</span>
            </label>
            <div className="relative">
              <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B7280]" />
              <Input
                id="required_staff_count"
                name="required_staff_count"
                type="number"
                min="1"
                value={formData.required_staff_count}
                onChange={handleInputChange}
                className={`pl-10 ${formErrors.required_staff_count ? "border-[#EF4444]" : ""}`}
              />
            </div>
            {formErrors.required_staff_count && (
              <p className="text-xs text-[#EF4444] mt-1">
                {formErrors.required_staff_count}
              </p>
            )}
          </div>

         
          <div>
            <label
              htmlFor="notes"
              className="block text-sm font-medium text-[#111827] mb-2"
            >
              Notes (Optional)
            </label>
            <div className="relative">
              <FileText className="absolute left-3 top-3 w-4 h-4 text-[#6B7280]" />
              <textarea
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                placeholder="Add any additional notes..."
                className="w-full pl-10 px-3 py-2 border border-[#E5E7EB] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#3B82F6] min-h-[80px]"
              />
            </div>
          </div>

          
          <div className="border-t border-[#E5E7EB] pt-4">
            <label className="block text-sm font-medium text-[#111827] mb-2 flex items-center gap-2">
              <Briefcase className="w-4 h-4" />
              Position Requirements
              {formData.shift_template_id && positionRequirements.length > 0 && (
                <span className="text-xs text-[#6B7280]">
                  (from template)
                </span>
              )}
            </label>
            
            {positionsLoading ? (
              <p className="text-sm text-[#6B7280]">Loading positions...</p>
            ) : (
              <div className="space-y-2 max-h-[200px] overflow-y-auto">
                {positions.map((position) => {
                  const requirement = positionRequirements.find(r => r.position_id === position.id);
                  const isSelected = !!requirement;
                  
                  return (
                    <div key={position.id} className="flex items-center gap-3 p-2 rounded hover:bg-[#F9FAFB] transition-colors">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setPositionRequirements([...positionRequirements, {
                              position_id: position.id,
                              required_count: 1
                            }]);
                          } else {
                            setPositionRequirements(positionRequirements.filter(
                              r => r.position_id !== position.id
                            ));
                          }
                        }}
                        className="w-4 h-4 text-[#3B82F6] border-[#E5E7EB] rounded focus:ring-[#3B82F6]"
                      />
                      <span className="flex-1 text-sm text-[#111827]">{position.name}</span>
                      {isSelected && (
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            min="1"
                            value={requirement.required_count}
                            onChange={(e) => {
                              setPositionRequirements(positionRequirements.map(r =>
                                r.position_id === position.id
                                  ? { ...r, required_count: Number(e.target.value) }
                                  : r
                              ));
                            }}
                            className="w-20 text-center"
                          />
                          <span className="text-xs text-[#6B7280]">required</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
            
            {positionRequirements.length === 0 && !positionsLoading && (
              <p className="text-xs text-[#EF4444] mt-2">
                At least one position is required
              </p>
            )}
          </div>

         
          <div className="border-t border-[#E5E7EB] pt-4">
            <div className="flex items-center gap-2 mb-4">
              <input
                type="checkbox"
                id="is_recurring"
                name="is_recurring"
                checked={formData.is_recurring}
                onChange={handleRecurringChange}
                className="w-4 h-4 text-[#3B82F6] border-[#E5E7EB] rounded focus:ring-[#3B82F6]"
              />
              <label
                htmlFor="is_recurring"
                className="text-sm font-medium text-[#111827] flex items-center gap-2"
              >
                <Repeat className="w-4 h-4" />
                Make this a recurring shift
              </label>
            </div>

            {formData.is_recurring && (
              <div className="space-y-4 pl-6 border-l-2 border-[#3B82F6]/20">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="recurrence_type"
                      className="block text-sm font-medium text-[#111827] mb-2"
                    >
                      Repeat <span className="text-[#EF4444]">*</span>
                    </label>
                    <select
                      id="recurrence_type"
                      name="recurrence_type"
                      value={formData.recurrence_type || ""}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-[#E5E7EB] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
                    >
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="recurrence_end_date"
                      className="block text-sm font-medium text-[#111827] mb-2"
                    >
                      Until <span className="text-[#EF4444]">*</span>
                    </label>
                    <Input
                      id="recurrence_end_date"
                      name="recurrence_end_date"
                      type="date"
                      value={formData.recurrence_end_date}
                      onChange={handleInputChange}
                      className={formErrors.recurrence_end_date ? "border-[#EF4444]" : ""}
                    />
                    {formErrors.recurrence_end_date && (
                      <p className="text-xs text-[#EF4444] mt-1">
                        {formErrors.recurrence_end_date}
                      </p>
                    )}
                  </div>
                </div>

                <div className="bg-[#EFF6FF] border border-[#3B82F6]/20 p-3 rounded-lg">
                  <p className="text-xs text-[#1E40AF]">
                    This shift will be created {formData.recurrence_type} from{" "}
                    {formData.shift_date} until {formData.recurrence_end_date || "end date"}.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="secondary" size="sm" onClick={handleCloseModal}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            size="sm"
            disabled={isPending}
            className="bg-[#3B82F6] hover:bg-[#2563EB] text-white"
          >
            {isPending
              ? "Creating..."
              : formData.is_recurring
              ? "Create Recurring Shifts"
              : "Create Shift"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

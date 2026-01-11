import { useState } from "react";
import { useAuth } from "../../hooks/context/AuthContext";
import { useStoreEmployeeAvailability } from "../../hooks/Employee/useEmployeeAvailability";
import type { StoreAvailabilityPayload } from "../../hooks/types/availability";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { Textarea } from "../ui/Textarea";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "../ui/Dialog";
import { useToast } from "../ui/Toast";

interface SetAvailabilityDialogProps {
    trigger?: React.ReactNode;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
}

const DAYS_OF_WEEK = [
    { value: 0, label: 'Sunday' },
    { value: 1, label: 'Monday' },
    { value: 2, label: 'Tuesday' },
    { value: 3, label: 'Wednesday' },
    { value: 4, label: 'Thursday' },
    { value: 5, label: 'Friday' },
    { value: 6, label: 'Saturday' },
];

export function SetAvailabilityDialog({
    trigger,
    open,
    onOpenChange,
}: SetAvailabilityDialogProps) {
    const { user } = useAuth();
    const toast = useToast();
    const { mutate: storeAvailability, isPending } = useStoreEmployeeAvailability();
    const [isOpen, setIsOpen] = useState(false);

    // Form state
    const [formData, setFormData] = useState({
        availability_type: "recurring" as "recurring" | "specific_date",
        specific_date: "",
        selected_days: [] as number[],
        is_available: true,
        preferred_shift_type: "any" as "day" | "evening" | "night" | "any",
        reason: "" as "vacation" | "sick" | "personal" | "appointment" | "other" | "",
        notes: "",
    });

    const handleOpenChange = (newOpen: boolean) => {
        setIsOpen(newOpen);
        onOpenChange?.(newOpen);
        // Reset form when closing
        if (!newOpen) {
            setFormData({
                availability_type: "recurring",
                specific_date: "",
                selected_days: [],
                is_available: true,
                preferred_shift_type: "any",
                reason: "",
                notes: "",
            });
        }
    };

    const handleDayToggle = (day: number) => {
        setFormData((prev) => ({
            ...prev,
            selected_days: prev.selected_days.includes(day)
                ? prev.selected_days.filter((d) => d !== day)
                : [...prev.selected_days, day],
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        if (formData.availability_type === "recurring") {
            // Create recurring availability for all week
            const payload: StoreAvailabilityPayload = {
                employee_id: user.id,
                is_recurring: true,
                is_available: formData.is_available,
                preferred_shift_type: formData.preferred_shift_type,
            };

            storeAvailability(payload, {
                onSuccess: () => {
                    toast.success("Recurring availability saved for all week");
                    handleOpenChange(false);
                },
                onError: () => {
                    toast.error("Failed to save availability. Please try again.");
                },
            });
        } else if (formData.specific_date) {
            // Single date availability (typically for unavailability)
            const payload: StoreAvailabilityPayload = {
                employee_id: user.id,
                specific_date: formData.specific_date,
                is_available: formData.is_available,
                reason: formData.reason || undefined,
                notes: formData.notes || undefined,
            };

            // Only include preferred_shift_type if available
            if (formData.is_available && formData.preferred_shift_type) {
                payload.preferred_shift_type = formData.preferred_shift_type;
            }

            storeAvailability(payload, {
                onSuccess: () => {
                    toast.success(
                        formData.is_available
                            ? "Availability saved successfully"
                            : "Unavailability saved successfully"
                    );
                    handleOpenChange(false);
                },
                onError: () => {
                    toast.error("Failed to save availability. Please try again.");
                },
            });
        } else {
            toast.error("Please select a date");
        }
    };

    return (
        <Dialog open={open !== undefined ? open : isOpen} onOpenChange={handleOpenChange}>
            {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
            <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Set Availability</DialogTitle>
                    <DialogDescription>
                        Set your availability for the entire week or mark specific dates as unavailable.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-5 mt-2">
                    {/* Availability Type */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Availability Type</label>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                type="button"
                                onClick={() => setFormData({ ...formData, availability_type: "recurring" })}
                                className={`px-4 py-2.5 text-sm rounded-lg border transition-all ${formData.availability_type === "recurring"
                                        ? "bg-blue-600 text-white border-blue-600"
                                        : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                                    }`}
                            >
                                All Week (Recurring)
                            </button>
                            <button
                                type="button"
                                onClick={() => setFormData({ ...formData, availability_type: "specific_date" })}
                                className={`px-4 py-2.5 text-sm rounded-lg border transition-all ${formData.availability_type === "specific_date"
                                        ? "bg-blue-600 text-white border-blue-600"
                                        : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                                    }`}
                            >
                                Specific Date
                            </button>
                        </div>
                    </div>

                    {/* Specific Date (shown when specific_date is selected) */}
                    {formData.availability_type === "specific_date" && (
                        <div className="space-y-2">
                            <label className="text-sm font-medium">
                                Date <span className="text-red-500">*</span>
                            </label>
                            <Input
                                type="date"
                                value={formData.specific_date}
                                onChange={(e) => setFormData({ ...formData, specific_date: e.target.value })}
                                required
                            />
                        </div>
                    )}

                    {/* Available/Unavailable Toggle */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Status</label>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                type="button"
                                onClick={() => setFormData({ ...formData, is_available: true })}
                                className={`px-4 py-2.5 text-sm rounded-lg border transition-all ${formData.is_available
                                        ? "bg-emerald-600 text-white border-emerald-600"
                                        : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                                    }`}
                            >
                                Available
                            </button>
                            <button
                                type="button"
                                onClick={() => setFormData({ ...formData, is_available: false })}
                                className={`px-4 py-2.5 text-sm rounded-lg border transition-all ${!formData.is_available
                                        ? "bg-red-600 text-white border-red-600"
                                        : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                                    }`}
                            >
                                Unavailable
                            </button>
                        </div>
                    </div>

                    {/* Preferred Shift Type (only shown when available) */}
                    {formData.is_available && (
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Preferred Shift Type</label>
                            <select
                                value={formData.preferred_shift_type}
                                onChange={(e) => setFormData({ ...formData, preferred_shift_type: e.target.value as any })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="any">Any</option>
                                <option value="day">Day</option>
                                <option value="evening">Evening</option>
                                <option value="night">Night</option>
                            </select>
                        </div>
                    )}

                    {/* Reason (only shown when unavailable and specific date) */}
                    {!formData.is_available && formData.availability_type === "specific_date" && (
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Reason</label>
                            <select
                                value={formData.reason}
                                onChange={(e) => setFormData({ ...formData, reason: e.target.value as any })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">Select reason</option>
                                <option value="vacation">Vacation</option>
                                <option value="sick">Sick</option>
                                <option value="personal">Personal</option>
                                <option value="appointment">Appointment</option>
                                <option value="other">Other</option>
                            </select>
                        </div>
                    )}

                    {/* Notes (only shown for specific dates) */}
                    {formData.availability_type === "specific_date" && (
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Notes</label>
                            <Textarea
                                placeholder="Any additional information..."
                                value={formData.notes}
                                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                className="resize-y min-h-[80px]"
                            />
                        </div>
                    )}

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={() => handleOpenChange(false)}
                            disabled={isPending}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isPending}>
                            {isPending ? "Saving..." : "Save Availability"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

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

const RECURRENCE_OPTIONS = [
    { value: 'once', label: 'Once' },
    { value: 'weekly', label: 'Weekly' },
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
        specific_date: "",
        start_time: "09:00",
        end_time: "17:00",
        repeat: false,
        recurrence: "weekly",
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
                specific_date: "",
                start_time: "09:00",
                end_time: "17:00",
                repeat: false,
                recurrence: "weekly",
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

        // If repeat is enabled, create availability for each selected day
        if (formData.repeat && formData.selected_days.length > 0) {
            formData.selected_days.forEach((day) => {
                const payload: StoreAvailabilityPayload = {
                    employee_id: user.id,
                    day_of_week: day,
                    is_available: formData.is_available,
                    preferred_shift_type: formData.preferred_shift_type,
                    reason: formData.reason || undefined,
                    notes: formData.notes || undefined,
                };

                storeAvailability(payload);
            });

            toast.success("Recurring availability saved successfully");
            handleOpenChange(false);
        } else if (formData.specific_date) {
            // Single date availability
            const payload: StoreAvailabilityPayload = {
                employee_id: user.id,
                specific_date: formData.specific_date,
                is_available: formData.is_available,
                preferred_shift_type: formData.preferred_shift_type,
                reason: formData.reason || undefined,
                notes: formData.notes || undefined,
            };

            storeAvailability(payload, {
                onSuccess: () => {
                    toast.success("Availability saved successfully");
                    handleOpenChange(false);
                },
                onError: () => {
                    toast.error("Failed to save availability. Please try again.");
                },
            });
        } else {
            toast.error("Please select a date or enable recurring availability");
        }
    };

    return (
        <Dialog open={open !== undefined ? open : isOpen} onOpenChange={handleOpenChange}>
            {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>New Availability</DialogTitle>
                    <DialogDescription>
                        Set your availability for specific dates or recurring schedules.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-5 mt-2">
                    <div className="grid grid-cols-2 gap-4">
                        {/* Date/Start Date */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Date/Start Date</label>
                            <Input
                                type="date"
                                value={formData.specific_date}
                                onChange={(e) => setFormData({ ...formData, specific_date: e.target.value })}
                                disabled={formData.repeat}
                            />
                        </div>

                        {/* Time Window */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Time Window</label>
                            <div className="flex items-center gap-2">
                                <Input
                                    type="time"
                                    value={formData.start_time}
                                    onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                                    className="flex-1"
                                />
                                <span className="text-gray-500">-</span>
                                <Input
                                    type="time"
                                    value={formData.end_time}
                                    onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                                    className="flex-1"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Repeat Toggle */}
                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={() => setFormData({ ...formData, repeat: !formData.repeat })}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${formData.repeat ? 'bg-blue-600' : 'bg-gray-200'
                                }`}
                        >
                            <span
                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${formData.repeat ? 'translate-x-6' : 'translate-x-1'
                                    }`}
                            />
                        </button>
                        <label className="text-sm font-medium">Repeat this availability</label>
                    </div>

                    {/* Recurrence (shown when repeat is enabled) */}
                    {formData.repeat && (
                        <>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">
                                    Recurrence <span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={formData.recurrence}
                                    onChange={(e) => setFormData({ ...formData, recurrence: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    {RECURRENCE_OPTIONS.map((option) => (
                                        <option key={option.value} value={option.value}>
                                            {option.label}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Days of the week */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Days of the week</label>
                                <div className="grid grid-cols-4 gap-2">
                                    {DAYS_OF_WEEK.map((day) => {
                                        const isSelected = formData.selected_days.includes(day.value);
                                        return (
                                            <button
                                                key={day.value}
                                                type="button"
                                                onClick={() => handleDayToggle(day.value)}
                                                className={`px-3 py-2 text-sm rounded-md border transition-colors ${isSelected
                                                        ? 'bg-blue-600 text-white border-blue-600'
                                                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                                                    }`}
                                            >
                                                {day.label}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </>
                    )}

                    {/* Preferred Shift Type */}
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

                    {/* Reason (Optional) */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Reason (Optional)</label>
                        <select
                            value={formData.reason}
                            onChange={(e) => setFormData({ ...formData, reason: e.target.value as any })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">None</option>
                            <option value="vacation">Vacation</option>
                            <option value="sick">Sick</option>
                            <option value="personal">Personal</option>
                            <option value="appointment">Appointment</option>
                            <option value="other">Other</option>
                        </select>
                    </div>

                    {/* Notes */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Notes</label>
                        <Textarea
                            placeholder="Any additional information..."
                            value={formData.notes}
                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                            className="resize-y min-h-[80px]"
                        />
                    </div>

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

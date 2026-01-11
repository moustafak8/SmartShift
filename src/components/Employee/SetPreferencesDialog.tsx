import { useState } from "react";
import { useAuth } from "../../hooks/context/AuthContext";
import { useStoreEmployeePreferences } from "../../hooks/Employee/useEmployeePreferences";
import type { StorePreferencePayload } from "../../hooks/types/prefrence"; // Fix typo in import path if needed, user has 'prefrence.ts'
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
import { Briefcase, Calendar, Clock } from "lucide-react";

interface SetPreferencesDialogProps {
    trigger?: React.ReactNode;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    isEdit?: boolean;
    initialData?: StorePreferencePayload;
}

export function SetPreferencesDialog({
    trigger,
    open,
    onOpenChange,
    isEdit = false,
    initialData,
}: SetPreferencesDialogProps) {
    const { user } = useAuth();
    const { mutate: storePreferences, isPending } = useStoreEmployeePreferences();
    const [isOpen, setIsOpen] = useState(false);

    // Form state
    // We initialize with defaults or initialData
    const [formData, setFormData] = useState<Partial<StorePreferencePayload>>(
        initialData || {
            employee_id: user?.id || 0,
            preferred_shift_types: [],
            max_shifts_per_week: 5,
            max_hours_per_week: 40,
            max_consecutive_days: 5,
            prefers_weekends: false,
            notes: "",
        }
    );

    const handleOpenChange = (newOpen: boolean) => {
        setIsOpen(newOpen);
        onOpenChange?.(newOpen);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        const payload: StorePreferencePayload = {
            ...formData,
            employee_id: user.id,
        } as StorePreferencePayload;

        storePreferences(payload, {
            onSuccess: () => {
                handleOpenChange(false);
                // Optionally show toast success
            },
        });
    };

    const handleShiftTypeToggle = (type: string) => {
        setFormData((prev) => {
            const currentTypes = prev.preferred_shift_types || [];
            const exists = currentTypes.includes(type);
            return {
                ...prev,
                preferred_shift_types: exists
                    ? currentTypes.filter((t) => t !== type)
                    : [...currentTypes, type],
            };
        });
    };

    return (
        <Dialog open={open !== undefined ? open : isOpen} onOpenChange={handleOpenChange}>
            {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{isEdit ? "Edit Preferences" : "Set Preferences"}</DialogTitle>
                    <DialogDescription>
                        Customize your shift preferences and availability constraints.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-5 mt-2">
                    {/* Shift Types */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                            Preferred Shift Types
                        </label>
                        <div className="grid grid-cols-3 gap-3">
                            {["day", "evening", "night"].map((type) => {
                                const isSelected = formData.preferred_shift_types?.includes(type);
                                return (
                                    <button
                                        key={type}
                                        type="button"
                                        onClick={() => handleShiftTypeToggle(type)}
                                        className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border text-sm transition-all ${isSelected
                                            ? "bg-blue-50 border-blue-500 text-blue-700 font-medium"
                                            : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                                            }`}
                                    >
                                        {type === "day" && <Briefcase className="w-4 h-4" />}
                                        {type === "evening" && <Calendar className="w-4 h-4" />}
                                        {type === "night" && <Clock className="w-4 h-4" />}
                                        <span className="capitalize">{type}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                        {/* Max Shifts */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Max Shifts/Week</label>
                            <Input
                                type="number"
                                min={1}
                                max={7}
                                value={formData.max_shifts_per_week}
                                onChange={(e) =>
                                    setFormData({ ...formData, max_shifts_per_week: parseInt(e.target.value) || 0 })
                                }
                            />
                        </div>

                        {/* Max Hours */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Max Hours/Week</label>
                            <Input
                                type="number"
                                min={1}
                                max={168}
                                value={formData.max_hours_per_week}
                                onChange={(e) =>
                                    setFormData({ ...formData, max_hours_per_week: parseInt(e.target.value) || 0 })
                                }
                            />
                        </div>

                        {/* Max Consecutive Days */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Max Consec Days</label>
                            <Input
                                type="number"
                                min={1}
                                max={14}
                                value={formData.max_consecutive_days}
                                onChange={(e) =>
                                    setFormData({ ...formData, max_consecutive_days: parseInt(e.target.value) || 0 })
                                }
                            />
                        </div>
                    </div>

                    {/* Weekend Preference */}
                    <div className="flex items-center gap-2 pb-2">
                        <input
                            type="checkbox"
                            id="weekend-pref"
                            className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            checked={formData.prefers_weekends}
                            onChange={(e) =>
                                setFormData({ ...formData, prefers_weekends: e.target.checked })
                            }
                        />
                        <label htmlFor="weekend-pref" className="text-sm font-medium cursor-pointer">
                            I prefer working weekends
                        </label>
                    </div>

                    {/* Notes */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Additional Notes</label>
                        <Textarea
                            placeholder="Any specific constraints or preferences..."
                            value={formData.notes || ""}
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
                            {isPending ? "Saving..." : "Save Preferences"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

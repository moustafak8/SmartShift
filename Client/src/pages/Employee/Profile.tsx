import { useState } from 'react';
import { User, Settings, Calendar, Clock, Briefcase, Trash2, Pencil, ChevronDown, ChevronUp } from 'lucide-react';
import { Layout } from '../../components/Sidebar';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { useAuth } from '../../hooks/context/AuthContext';
import { useEmployeePreferences } from '../../hooks/Employee/useEmployeePreferences';
import { useEmployeeAvailability, useDeleteEmployeeAvailability } from '../../hooks/Employee/useEmployeeAvailability';
import { SetPreferencesDialog } from '../../components/Employee/SetPreferencesDialog';
import { SetAvailabilityDialog } from '../../components/Employee/SetAvailabilityDialog';
import { useToast } from '../../components/ui/Toast';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';

export function Profile() {

    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [availabilityToDelete, setAvailabilityToDelete] = useState<number | null>(null);
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [availabilityToEdit, setAvailabilityToEdit] = useState<any>(null);
    const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

    const { user } = useAuth();
    const toast = useToast();
    const { data: preferencesData, isLoading: preferencesLoading } = useEmployeePreferences(user?.id);
    const { data: availabilityData, isLoading: availabilityLoading } = useEmployeeAvailability(user?.id);
    const { mutate: deleteAvailability, isPending: isDeleting } = useDeleteEmployeeAvailability();

    const preferences = preferencesData?.payload;
    const availability = availabilityData?.payload;



    const handleDeleteAvailability = (id: number) => {
        setAvailabilityToDelete(id);
        setDeleteConfirmOpen(true);
    };

    const confirmDelete = () => {
        if (availabilityToDelete !== null) {
            deleteAvailability(availabilityToDelete, {
                onSuccess: () => {
                    toast.success('Availability deleted successfully');
                    setAvailabilityToDelete(null);
                },
                onError: () => {
                    toast.error('Failed to delete availability. Please try again.');
                    setAvailabilityToDelete(null);
                },
            });
        }
    };

    const handleEditAvailability = (avail: any) => {
        setAvailabilityToEdit(avail);
        setEditDialogOpen(true);
    };

    const toggleGroupExpansion = (groupKey: string) => {
        setExpandedGroups(prev => {
            const newSet = new Set(prev);
            if (newSet.has(groupKey)) {
                newSet.delete(groupKey);
            } else {
                newSet.add(groupKey);
            }
            return newSet;
        });
    };

    return (
        <Layout notificationCount={3}>
            <div className="bg-white">
                <div className="px-7 py-4 border-b border-gray-200">
                    <h1 className="text-2xl font-semibold text-gray-900 mb-1">
                        Profile & Settings
                    </h1>
                    <p className="text-sm text-gray-600">
                        Manage your preferences and availability
                    </p>
                </div>

                <div className="p-8">

                    <Card className="p-4 mb-6 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                                <User className="w-7 h-7 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h2 className="text-lg font-semibold text-gray-900 truncate">
                                    {user?.full_name}
                                </h2>
                                <p className="text-sm text-gray-600 truncate">
                                    {user?.email}
                                </p>
                            </div>
                        </div>
                    </Card>


                    <Card className="shadow-sm hover:shadow-md transition-shadow overflow-hidden">
                        <div className="px-6 pt-6 pb-4 flex items-center justify-between border-b border-gray-100">
                            <h3 className="text-xl font-semibold text-gray-900">Shift Preferences</h3>
                            {preferences && (
                                <SetPreferencesDialog
                                    isEdit
                                    initialData={{
                                        ...preferences,
                                        preferred_shift_types: preferences.preferred_shift_types || [],
                                        notes: preferences.notes || "",
                                    }}
                                    trigger={
                                        <Button size="sm" variant="secondary">
                                            Edit Preferences
                                        </Button>
                                    }
                                />
                            )}
                        </div>

                        {preferencesLoading ? (
                            <div className="text-center py-12 text-gray-500">
                                <div className="animate-pulse">Loading preferences...</div>
                            </div>
                        ) : preferences ? (
                            <div className="p-6 space-y-4">

                                <div className="flex items-start gap-3">
                                    <Briefcase className="w-5 h-5 text-blue-600 mt-0.5" />
                                    <div>
                                        <p className="font-medium text-gray-900">Preferred Shift Types</p>
                                        <p className="text-sm text-gray-600">
                                            {preferences.preferred_shift_types && preferences.preferred_shift_types.length > 0
                                                ? preferences.preferred_shift_types.join(', ')
                                                : 'No preference set'}
                                        </p>
                                    </div>
                                </div>


                                <div className="flex items-start gap-3">
                                    <Calendar className="w-5 h-5 text-blue-600 mt-0.5" />
                                    <div>
                                        <p className="font-medium text-gray-900">Maximum Shifts Per Week</p>
                                        <p className="text-sm text-gray-600">
                                            {preferences.max_shifts_per_week} shifts
                                        </p>
                                    </div>
                                </div>


                                <div className="flex items-start gap-3">
                                    <Clock className="w-5 h-5 text-blue-600 mt-0.5" />
                                    <div>
                                        <p className="font-medium text-gray-900">Maximum Hours Per Week</p>
                                        <p className="text-sm text-gray-600">
                                            {preferences.max_hours_per_week} hours
                                        </p>
                                    </div>
                                </div>


                                <div className="flex items-start gap-3">
                                    <Calendar className="w-5 h-5 text-blue-600 mt-0.5" />
                                    <div>
                                        <p className="font-medium text-gray-900">Maximum Consecutive Days</p>
                                        <p className="text-sm text-gray-600">
                                            {preferences.max_consecutive_days} days
                                        </p>
                                    </div>
                                </div>


                                <div className="flex items-start gap-3">
                                    <Calendar className="w-5 h-5 text-blue-600 mt-0.5" />
                                    <div>
                                        <p className="font-medium text-gray-900">Weekend Preference</p>
                                        <p className="text-sm text-gray-600">
                                            {preferences.prefers_weekends ? 'Prefers weekends' : 'No weekend preference'}
                                        </p>
                                    </div>
                                </div>


                                {preferences.notes && (
                                    <div className="flex items-start gap-3">
                                        <Settings className="w-5 h-5 text-blue-600 mt-0.5" />
                                        <div>
                                            <p className="font-medium text-gray-900">Additional Notes</p>
                                            <p className="text-sm text-gray-600">
                                                {preferences.notes}
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="text-center py-16 px-6">
                                <div className="mb-6">
                                    <div className="w-24 h-24 bg-gradient-to-br from-blue-50 to-blue-100 rounded-full flex items-center justify-center mx-auto mb-5 shadow-sm">
                                        <Settings className="w-12 h-12 text-blue-600" />
                                    </div>
                                    <h4 className="text-xl font-semibold text-gray-900 mb-3">
                                        You haven't set your preferences yet
                                    </h4>
                                    <p className="text-gray-600 max-w-md mx-auto leading-relaxed">
                                        Help us create better schedules by setting your shift preferences, availability, and work-life balance needs.
                                    </p>
                                </div>
                                <SetPreferencesDialog
                                    trigger={
                                        <Button size="lg" className="shadow-md hover:shadow-lg">
                                            Set Preferences
                                        </Button>
                                    }
                                />
                            </div>
                        )}
                    </Card>

                    {/* Availability Section */}
                    <Card className="mt-6 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
                        <div className="px-6 pt-6 pb-4 flex items-center justify-between border-b border-gray-100">
                            <h3 className="text-xl font-semibold text-gray-900">Availability</h3>
                            <SetAvailabilityDialog
                                trigger={
                                    <Button size="sm" variant="secondary">
                                        Add Availability
                                    </Button>
                                }
                            />
                        </div>

                        {availabilityLoading ? (
                            <div className="text-center py-12 text-gray-500">
                                <div className="animate-pulse">Loading availability...</div>
                            </div>
                        ) : availability && availability.length > 0 ? (
                            <div className="p-6">
                                <div className="space-y-3">
                                    {(() => {
                                        const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];


                                        const specificDates = availability.filter(a => a.specific_date);
                                        const recurringDays = availability.filter(a => a.day_of_week !== null && !a.specific_date);


                                        const availableGroups = new Map<string, typeof availability>();
                                        const unavailableGroups = new Map<string, typeof availability>();

                                        recurringDays.forEach(avail => {
                                            if (avail.day_of_week === null) return;

                                            const shiftType = avail.preferred_shift_type || 'any';
                                            const key = `${shiftType}`;

                                            if (avail.is_available) {
                                                if (!availableGroups.has(key)) {
                                                    availableGroups.set(key, []);
                                                }
                                                availableGroups.get(key)!.push(avail);
                                            } else {
                                                const reasonKey = avail.reason ? `${avail.reason}` : 'no-reason';
                                                if (!unavailableGroups.has(reasonKey)) {
                                                    unavailableGroups.set(reasonKey, []);
                                                }
                                                unavailableGroups.get(reasonKey)!.push(avail);
                                            }
                                        });

                                        const displayItems: React.ReactElement[] = [];

                                        availableGroups.forEach((availRecords, shiftType) => {
                                            const days = availRecords.map(a => a.day_of_week!).sort((a, b) => a - b);
                                            const isAllWeek = days.length === 7;
                                            const dayNames = isAllWeek ? 'All week' : days.map(d => DAYS[d]).join(', ');
                                            const groupKey = `available-${shiftType}`;
                                            const isExpanded = expandedGroups.has(groupKey);

                                            displayItems.push(
                                                <div key={groupKey} className="bg-emerald-50 rounded-lg border border-emerald-200">
                                                    <div className="flex items-center justify-between p-4">
                                                        <div className="flex items-center gap-3 flex-1">
                                                            <Calendar className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                                                            <div className="flex-1">
                                                                <p className="font-medium text-gray-900">{dayNames}</p>
                                                                <p className="text-sm text-gray-600">
                                                                    Available
                                                                    {shiftType !== 'any' && <span> • {shiftType} shift</span>}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <button
                                                            onClick={() => toggleGroupExpansion(groupKey)}
                                                            className="p-2 text-gray-600 hover:bg-emerald-100 rounded-md transition-colors"
                                                            title={isExpanded ? "Hide options" : "Show options"}
                                                        >
                                                            {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                                                        </button>
                                                    </div>
                                                    {isExpanded && (
                                                        <div className="px-4 pb-4 pt-2 border-t border-emerald-200 space-y-2">
                                                            {availRecords.map(avail => (
                                                                <div key={avail.id} className="flex items-center justify-between py-2 px-3 bg-white rounded-md">
                                                                    <span className="text-sm font-medium text-gray-700">{DAYS[avail.day_of_week!]}</span>
                                                                    <div className="flex items-center gap-2">
                                                                        <button
                                                                            onClick={() => handleEditAvailability(avail)}
                                                                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                                                                            title="Edit"
                                                                        >
                                                                            <Pencil className="w-4 h-4" />
                                                                        </button>
                                                                        <button
                                                                            onClick={() => handleDeleteAvailability(avail.id)}
                                                                            disabled={isDeleting}
                                                                            className="p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                                            title="Delete"
                                                                        >
                                                                            <Trash2 className="w-4 h-4" />
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        });

                                        unavailableGroups.forEach((availRecords, reasonKey) => {
                                            const days = availRecords.map(a => a.day_of_week!).sort((a, b) => a - b);
                                            const dayNames = days.map(d => DAYS[d]).join(', ');
                                            const groupKey = `unavailable-${reasonKey}`;
                                            const isExpanded = expandedGroups.has(groupKey);

                                            displayItems.push(
                                                <div key={groupKey} className="bg-red-50 rounded-lg border border-red-200">
                                                    <div className="flex items-center justify-between p-4">
                                                        <div className="flex items-center gap-3 flex-1">
                                                            <Calendar className="w-5 h-5 text-red-600 flex-shrink-0" />
                                                            <div className="flex-1">
                                                                <p className="font-medium text-gray-900">{dayNames}</p>
                                                                <p className="text-sm text-gray-600">
                                                                    Unavailable
                                                                    {reasonKey !== 'no-reason' && <span> • {reasonKey}</span>}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <button
                                                            onClick={() => toggleGroupExpansion(groupKey)}
                                                            className="p-2 text-gray-600 hover:bg-red-100 rounded-md transition-colors"
                                                            title={isExpanded ? "Hide options" : "Show options"}
                                                        >
                                                            {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                                                        </button>
                                                    </div>
                                                    {isExpanded && (
                                                        <div className="px-4 pb-4 pt-2 border-t border-red-200 space-y-2">
                                                            {availRecords.map(avail => (
                                                                <div key={avail.id} className="flex items-center justify-between py-2 px-3 bg-white rounded-md">
                                                                    <span className="text-sm font-medium text-gray-700">{DAYS[avail.day_of_week!]}</span>
                                                                    <div className="flex items-center gap-2">
                                                                        <button
                                                                            onClick={() => handleEditAvailability(avail)}
                                                                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                                                                            title="Edit"
                                                                        >
                                                                            <Pencil className="w-4 h-4" />
                                                                        </button>
                                                                        <button
                                                                            onClick={() => handleDeleteAvailability(avail.id)}
                                                                            disabled={isDeleting}
                                                                            className="p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                                            title="Delete"
                                                                        >
                                                                            <Trash2 className="w-4 h-4" />
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        });

                                        specificDates.forEach(avail => {
                                            const dateStr = new Date(avail.specific_date!).toLocaleDateString('en-US', {
                                                month: 'short',
                                                day: 'numeric',
                                                year: 'numeric'
                                            });

                                            displayItems.push(
                                                <div
                                                    key={avail.id}
                                                    className={`flex items-center justify-between p-4 rounded-lg border ${avail.is_available
                                                        ? 'bg-blue-50 border-blue-200'
                                                        : 'bg-red-50 border-red-200'
                                                        }`}
                                                >
                                                    <div className="flex items-center gap-3 flex-1">
                                                        <Calendar className={`w-5 h-5 flex-shrink-0 ${avail.is_available ? 'text-blue-600' : 'text-red-600'
                                                            }`} />
                                                        <div className="flex-1">
                                                            <p className="font-medium text-gray-900">{dateStr}</p>
                                                            <p className="text-sm text-gray-600">
                                                                {avail.is_available ? 'Available' : 'Unavailable'}
                                                                {avail.preferred_shift_type && avail.preferred_shift_type !== 'any' && (
                                                                    <span> • {avail.preferred_shift_type} shift</span>
                                                                )}
                                                                {avail.reason && <span> • {avail.reason}</span>}
                                                            </p>
                                                            {avail.notes && (
                                                                <p className="text-xs text-gray-500 mt-1">{avail.notes}</p>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            onClick={() => handleEditAvailability(avail)}
                                                            className="p-2 text-blue-600 hover:bg-blue-100 rounded-md transition-colors"
                                                            title="Edit availability"
                                                        >
                                                            <Pencil className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteAvailability(avail.id)}
                                                            disabled={isDeleting}
                                                            className="p-2 text-red-600 hover:bg-red-100 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                            title="Delete availability"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </div>
                                            );
                                        });

                                        return displayItems;
                                    })()}
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-16 px-6">
                                <div className="mb-6">
                                    <div className="w-24 h-24 bg-gradient-to-br from-blue-50 to-blue-100 rounded-full flex items-center justify-center mx-auto mb-5 shadow-sm">
                                        <Calendar className="w-12 h-12 text-blue-600" />
                                    </div>
                                    <h4 className="text-xl font-semibold text-gray-900 mb-3">
                                        No availability set
                                    </h4>
                                    <p className="text-gray-600 max-w-md mx-auto leading-relaxed">
                                        Let us know when you're available to work by adding your schedule.
                                    </p>
                                </div>
                                <SetAvailabilityDialog
                                    trigger={
                                        <Button size="lg" className="shadow-md hover:shadow-lg">
                                            Add Availability
                                        </Button>
                                    }
                                />
                            </div>
                        )}
                    </Card>
                </div>
            </div>

            <ConfirmDialog
                open={deleteConfirmOpen}
                onOpenChange={setDeleteConfirmOpen}
                onConfirm={confirmDelete}
                title="Delete Availability"
                description="Are you sure you want to delete this availability record? This action cannot be undone."
                confirmText="Delete"
                cancelText="Cancel"
                variant="danger"
            />

            <SetAvailabilityDialog
                open={editDialogOpen}
                onOpenChange={(open) => {
                    setEditDialogOpen(open);
                    if (!open) setAvailabilityToEdit(null);
                }}
                initialData={availabilityToEdit}
            />
        </Layout>
    );
}

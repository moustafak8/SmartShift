import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Settings, Calendar, Clock, Briefcase } from 'lucide-react';
import { Layout } from '../../components/Sidebar';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { useAuth } from '../../hooks/context/AuthContext';
import { useEmployeePreferences } from '../../hooks/Employee/useEmployeePreferences';
import { useEmployeeAvailability } from '../../hooks/Employee/useEmployeeAvailability';
import { SetPreferencesDialog } from '../../components/Employee/SetPreferencesDialog';
import { SetAvailabilityDialog } from '../../components/Employee/SetAvailabilityDialog';

export function Profile() {
    const [activePage, setActivePage] = useState('profile');
    const navigate = useNavigate();
    const { user } = useAuth();
    const { data: preferencesData, isLoading: preferencesLoading } = useEmployeePreferences(user?.id);
    const { data: availabilityData, isLoading: availabilityLoading } = useEmployeeAvailability(user?.id);

    const preferences = preferencesData?.payload;
    const availability = availabilityData?.payload;

    const handleNavigate = (page: string) => {
        setActivePage(page);

        switch (page) {
            case "wellness":
                navigate("/employee/wellness");
                break;
            case "fatigue":
                navigate("/employee/score");
                break;
            case "dashboard":
                navigate("/employee/dashboard");
                break;
            case "profile":
                navigate("/employee/profile");
                break;
            default:
                console.log("Navigating to:", page);
        }
    };

    return (
        <Layout
            activePage={activePage}
            onNavigate={handleNavigate}
            notificationCount={3}
        >
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
                    <Card className="shadow-sm hover:shadow-md transition-shadow overflow-hidden">
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
                                    {availability.map((avail) => (
                                        <div
                                            key={avail.id}
                                            className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200"
                                        >
                                            <div className="flex items-center gap-3">
                                                <Calendar className="w-5 h-5 text-blue-600" />
                                                <div>
                                                    <p className="font-medium text-gray-900">
                                                        {avail.specific_date
                                                            ? new Date(avail.specific_date).toLocaleDateString()
                                                            : avail.day_of_week !== null
                                                                ? ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][avail.day_of_week]
                                                                : 'Unknown'}
                                                    </p>
                                                    <p className="text-sm text-gray-600">
                                                        {avail.is_available ? 'Available' : 'Unavailable'}
                                                        {avail.preferred_shift_type && avail.preferred_shift_type !== 'any' && (
                                                            <span> • {avail.preferred_shift_type}</span>
                                                        )}
                                                        {avail.reason && <span> • {avail.reason}</span>}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
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
        </Layout>
    );
}

import { X, User, Calendar, AlertCircle, AlertTriangle, CheckCircle, CalendarDays } from "lucide-react";
import { Button } from "../ui/Button";
import { Badge } from "../ui/Badge";
import { useEmployeeDetails } from "../../hooks/Manager/useEmployeeDetails";

interface EmployeeDetailProps {
    employeeId: number;
    onClose: () => void;
}

export function EmployeeDetail({ employeeId, onClose }: EmployeeDetailProps) {
    const { employeeDetails, isLoading, isError } = useEmployeeDetails(employeeId);

    if (isLoading) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/50">
                <div className="w-[600px] h-full bg-white shadow-2xl overflow-y-auto flex items-center justify-center">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#3B82F6] mx-auto mb-4"></div>
                        <p className="text-[#6B7280]">Loading employee details...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (isError || !employeeDetails) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/50">
                <div className="w-[600px] h-full bg-white shadow-2xl overflow-y-auto flex items-center justify-center">
                    <div className="text-center">
                        <p className="text-[#EF4444] mb-4">Failed to load employee details</p>
                        <Button onClick={onClose}>Close</Button>
                    </div>
                </div>
            </div>
        );
    }

    const hasFatigueScore = employeeDetails.fatigue_score !== null;
    const fatigueScore = employeeDetails.fatigue_score;

    const getRiskLevelColor = (level: string) => {
        switch (level) {
            case "high":
                return {
                    bg: "bg-[#FEE2E2]",
                    border: "border-[#EF4444]",
                    badge: "bg-[#EF4444]",
                    icon: AlertCircle,
                };
            case "medium":
                return {
                    bg: "bg-[#FEF3C7]",
                    border: "border-[#F59E0B]",
                    badge: "bg-[#F59E0B]",
                    icon: AlertTriangle,
                };
            case "low":
                return {
                    bg: "bg-[#DCFCE7]",
                    border: "border-[#10B981]",
                    badge: "bg-[#10B981]",
                    icon: CheckCircle,
                };
            default:
                return {
                    bg: "bg-[#F3F4F6]",
                    border: "border-[#9CA3AF]",
                    badge: "bg-[#6B7280]",
                    icon: User,
                };
        }
    };

    const riskColors = hasFatigueScore && fatigueScore
        ? getRiskLevelColor(fatigueScore.risk_level)
        : getRiskLevelColor("none");

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/50">
            <div className="w-[600px] h-full bg-white shadow-2xl overflow-y-auto animate-in slide-in-from-right">
                <div className="sticky top-0 bg-white border-b border-[#E5E7EB] px-6 py-4 flex items-center justify-between z-10">
                    <div className="flex items-center gap-3">
                    </div>
                    <Button size="sm" onClick={onClose} className="p-0 hover:bg-transparent" variant="secondary">
                        <X className="w-5 h-5" />
                    </Button>
                </div>


                <div className="p-6 space-y-6">
                    <div className="text-center">
                        <div className="w-32 h-32 bg-[#3B82F6] rounded-full flex items-center justify-center mx-auto mb-4">
                            <User className="w-16 h-16 text-white" />
                        </div>
                        <h3 className="text-xl font-semibold text-[#111827]">
                            {employeeDetails.employee_name}
                        </h3>
                        <p className="text-[#6B7280] mt-1">{employeeDetails.department}</p>
                        <p className="text-[#6B7280]">{employeeDetails.email}</p>
                        {employeeDetails.phone && (
                            <p className="text-[#6B7280]">{employeeDetails.phone}</p>
                        )}
                    </div>


                    <div className="border-t border-[#E5E7EB] pt-6">
                        {hasFatigueScore ? (
                            <div className={`p-4 rounded-lg ${riskColors.bg} border-2 ${riskColors.border}`}>
                                <div className="flex items-center justify-between mb-2">
                                    <span className="font-medium text-[#111827] flex items-center gap-2">
                                        {riskColors.icon && <riskColors.icon className="w-5 h-5" />}
                                        Fatigue Score
                                    </span>
                                    <Badge className={`${riskColors.badge} text-white`}>
                                        {fatigueScore.risk_level.toUpperCase()} RISK
                                    </Badge>
                                </div>
                                <div className="text-3xl font-bold text-[#111827] mb-3">
                                    {fatigueScore.total_score}/100
                                </div>


                                <div className="mt-4 space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-[#6B7280]">Quantitative</span>
                                        <span className="font-medium text-[#111827]">{fatigueScore.breakdown.quantitative}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-[#6B7280]">Qualitative</span>
                                        <span className="font-medium text-[#111827]">{fatigueScore.breakdown.qualitative}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-[#6B7280]">Psychological</span>
                                        <span className="font-medium text-[#111827]">{fatigueScore.breakdown.psychological}</span>
                                    </div>
                                </div>
                                <p className="text-xs text-[#6B7280] mt-3">
                                    Last updated: {new Date(fatigueScore.score_date).toLocaleDateString()}
                                </p>
                            </div>
                        ) : (
                            <div className="p-4 rounded-lg bg-[#F3F4F6] border-2 border-[#E5E7EB]">
                                <div className="text-center py-6">
                                    <p className="text-[#6B7280] font-medium mb-2">No Fatigue Score Available</p>
                                    <p className="text-sm text-[#9CA3AF]">
                                        This employee hasn't submitted a fatigue assessment yet.
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>


                    <div className="border-t border-[#E5E7EB] pt-6">
                        <h4 className="font-semibold text-[#111827] mb-4 flex items-center gap-2">
                            <Calendar className="w-5 h-5" />
                            This Month Stats
                        </h4>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 bg-[#F9FAFB] rounded-lg">
                                <div className="text-2xl font-bold text-[#111827]">
                                    {employeeDetails.this_month_stats.total_shifts}
                                </div>
                                <div className="text-sm text-[#6B7280]">Shifts</div>
                            </div>
                            <div className="p-4 bg-[#F9FAFB] rounded-lg">
                                <div className="text-2xl font-bold text-[#111827]">
                                    {employeeDetails.this_month_stats.total_hours}h
                                </div>
                                <div className="text-sm text-[#6B7280]">Hours</div>
                            </div>
                            <div className="p-4 bg-[#F9FAFB] rounded-lg">
                                <div className="text-2xl font-bold text-[#111827]">
                                    {employeeDetails.this_month_stats.night_shifts}
                                </div>
                                <div className="text-sm text-[#6B7280]">Night shifts</div>
                            </div>
                            <div className="p-4 bg-[#F9FAFB] rounded-lg">
                                <div className="text-2xl font-bold text-[#111827]">
                                    {employeeDetails.this_month_stats.consecutive_days}
                                </div>
                                <div className="text-sm text-[#6B7280]">Consecutive days</div>
                            </div>
                        </div>
                    </div>


                    <div className="border-t border-[#E5E7EB] pt-6">
                        <h4 className="font-semibold text-[#111827] mb-4 flex items-center gap-2">
                            <CalendarDays className="w-5 h-5" />
                            Upcoming Shifts ({employeeDetails.upcoming_shifts.length})
                        </h4>
                        {employeeDetails.upcoming_shifts.length > 0 ? (
                            <div className="space-y-3">
                                {employeeDetails.upcoming_shifts.map((shift) => (
                                    <div
                                        key={shift.shift_id}
                                        className="flex items-center justify-between p-3 bg-[#F9FAFB] rounded-lg"
                                    >
                                        <div>
                                            <p className="text-sm font-medium text-[#111827]">
                                                {shift.shift_date_formatted}
                                            </p>
                                            <p className="text-xs text-[#6B7280] mt-1">
                                                {shift.shift_type} • {shift.assignment_type}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm text-[#6B7280]">
                                                {shift.start_time.slice(0, 5)} - {shift.end_time.slice(0, 5)}
                                            </p>
                                            <Badge
                                                className={`mt-1 ${shift.status === "assigned"
                                                    ? "bg-[#10B981]"
                                                    : "bg-[#6B7280]"
                                                    } text-white text-xs`}
                                            >
                                                {shift.status}
                                            </Badge>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-6 bg-[#F9FAFB] rounded-lg">
                                <p className="text-[#6B7280]">No upcoming shifts scheduled</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

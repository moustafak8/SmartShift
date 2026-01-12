import { useState } from "react";
import {
    Search,
    ListFilter,
    User,
    UserPlus,
} from "lucide-react";
import {
    Button,
    Input,
    Badge,
    Card,
} from "../../components/ui";
import { AddEmployeeDialog } from "../../components/Manager/AddEmployeeDialog";
import type {
    TeamOverviewProps,
    Employee,
    AddEmployeeFormData,
} from "../../hooks/types/teamOverview";

export function TeamOverview({ onNavigate }: TeamOverviewProps) {
    const [searchTerm, setSearchTerm] = useState("");
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);

    //  actual API call using useEmployee hook
    const employees: Employee[] = [];
    const isLoading = false;

    const filteredEmployees = employees.filter(
        (emp) =>
            emp.employee_name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleAddEmployee = (data: AddEmployeeFormData) => {
        // API call to add employee
        console.log("Adding employee:", data);
        setIsAddModalOpen(false);
    };

    return (
        <div className="bg-white min-h-screen">

            <div className="border-b border-[#E5E7EB] bg-white">
                <div className="px-6 py-4">
                    <h1 className="text-2xl font-semibold text-[#111827]">
                        Team Management
                    </h1>
                    <p className="text-sm text-[#6B7280] mt-1">
                        Monitor and manage your team members
                    </p>
                </div>
            </div>


            <div className="flex items-center justify-between px-6 py-4">
                <div className="flex items-center gap-4 flex-1">

                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#6B7280]" />
                        <Input
                            placeholder="Search employees..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10"
                        />
                    </div>


                    <Button variant="secondary" size="sm" className="flex items-center">
                        <ListFilter className="w-4 h-4 mr-2" />
                        Filter
                    </Button>
                </div>


                <Button
                    onClick={() => setIsAddModalOpen(true)}
                    size="sm"
                    className="bg-[#3B82F6] hover:bg-[#2563EB] text-white flex items-center"
                >
                    <UserPlus className="w-4 h-4 mr-2" />
                    Add Employee
                </Button>
            </div>


            <div className="p-6">
                {isLoading ? (
                    <Card className="p-12 text-center">
                        <p className="text-[#6B7280]">Loading employees...</p>
                    </Card>
                ) : filteredEmployees.length === 0 ? (
                    <Card className="p-12 text-center">
                        <User className="w-12 h-12 mx-auto text-[#9CA3AF] mb-4" />
                        <h3 className="text-lg font-medium text-[#111827] mb-2">
                            {searchTerm ? "No employees found" : "No employees yet"}
                        </h3>
                        <p className="text-sm text-[#6B7280] mb-6">
                            {searchTerm
                                ? "Try adjusting your search terms"
                                : "Get started by adding your first team member"}
                        </p>
                        {!searchTerm && (
                            <div className="flex justify-center">
                                <Button
                                    onClick={() => setIsAddModalOpen(true)}
                                    size="sm"
                                    className="bg-[#3B82F6] hover:bg-[#2563EB] text-white flex items-center"
                                >
                                    <UserPlus className="w-4 h-4 mr-2" />
                                    Add Employee
                                </Button>
                            </div>
                        )}
                    </Card>
                ) : (
                    <>
                        {/* Employee Table */}
                        <Card variant="bordered" className="overflow-hidden p-0">
                            {/* Table Header */}
                            <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-[#F9FAFB] border-b border-[#E5E7EB] text-sm font-medium text-[#6B7280]">
                                <div className="col-span-4">EMPLOYEE</div>
                                <div className="col-span-3">FATIGUE SCORE</div>
                                <div className="col-span-3">RISK LEVEL</div>
                                <div className="col-span-2 text-right">ACTIONS</div>
                            </div>

                            {/* Table Rows */}
                            <div className="divide-y divide-[#E5E7EB]">
                                {filteredEmployees.map((employee) => (
                                    <div
                                        key={employee.employee_id}
                                        className="grid grid-cols-12 gap-4 px-6 py-4 hover:bg-[#F9FAFB] transition-colors"
                                    >
                                        {/* Employee Info */}
                                        <div className="col-span-4 flex items-center gap-3">
                                            <div className="w-10 h-10 bg-[#3B82F6] rounded-full flex items-center justify-center flex-shrink-0">
                                                <User className="w-5 h-5 text-white" />
                                            </div>
                                            <div>
                                                <div className="font-medium text-[#111827]">
                                                    {employee.employee_name}
                                                </div>
                                                <div className="text-sm text-[#6B7280]">
                                                    {employee.fatigue_score.score_date}
                                                </div>
                                            </div>
                                        </div>


                                        <div className="col-span-3 flex items-center">
                                            <span className="text-sm font-semibold text-[#111827]">
                                                {employee.fatigue_score.total_score}
                                            </span>
                                        </div>


                                        <div className="col-span-3 flex items-center">
                                            <Badge
                                                className={`${employee.fatigue_score.risk_level === "low"
                                                        ? "bg-[#DCFCE7] text-[#10B981]"
                                                        : employee.fatigue_score.risk_level === "medium"
                                                            ? "bg-[#FEF3C7] text-[#F59E0B]"
                                                            : "bg-[#FEE2E2] text-[#EF4444]"
                                                    } border-0 capitalize`}
                                            >
                                                {employee.fatigue_score.risk_level}
                                            </Badge>
                                        </div>


                                        <div className="col-span-2 flex items-center justify-end gap-2">
                                            <Button
                                                size="sm"
                                                variant="secondary"
                                                onClick={() =>
                                                    onNavigate("employee-details", {
                                                        employeeId: employee.employee_id,
                                                    })
                                                }
                                            >
                                                View
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </Card>


                        <div className="mt-4 text-sm text-[#6B7280]">
                            Showing {filteredEmployees.length} of {employees.length}{" "}
                            employees
                        </div>
                    </>
                )}
            </div>


            <AddEmployeeDialog
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                onSubmit={handleAddEmployee}
            />
        </div>
    );
}

import { useState } from "react";
import {
    Search,
    ListFilter,
    User,
    Mail,
    Lock,
    UserPlus,
} from "lucide-react";
import {
    Button,
    Input,
    Badge,
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
    Card,
} from "../../components/ui";
import { useEmployees } from "../../hooks/Manager/useEmployee";
import type {
    TeamOverviewProps,
    Employee,
    AddEmployeeFormData,
} from "../../hooks/types/teamOverview";

export function TeamOverview({ onNavigate }: TeamOverviewProps) {
    const [searchTerm, setSearchTerm] = useState("");
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [formData, setFormData] = useState<AddEmployeeFormData>({
        name: "",
        email: "",
        password: "",
    });
    const [formErrors, setFormErrors] = useState<Partial<AddEmployeeFormData>>({});

    //  actual API call using useEmployee hook
    const employees: Employee[] = [];
    const isLoading = false;

    const filteredEmployees = employees.filter(
        (emp) =>
            emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            emp.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
        // Clear error for this field when user starts typing
        if (formErrors[name as keyof AddEmployeeFormData]) {
            setFormErrors((prev) => ({
                ...prev,
                [name]: undefined,
            }));
        }
    };

    const validateForm = (): boolean => {
        const errors: Partial<AddEmployeeFormData> = {};

        if (!formData.name.trim()) {
            errors.name = "Name is required";
        }

        if (!formData.email.trim()) {
            errors.email = "Email is required";
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            errors.email = "Please enter a valid email address";
        }

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleAddEmployee = async () => {
        if (!validateForm()) {
            return;
        }

        // API call to add employee
        console.log("Adding employee:", formData);

        // Reset form and close modal
        setFormData({
            name: "",
            email: "",
            password: "",
        });
        setFormErrors({});
        setIsAddModalOpen(false);
    };

    const handleCloseModal = () => {
        setIsAddModalOpen(false);
        setFormData({
            name: "",
            email: "",
            password: "",
        });
        setFormErrors({});
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
                                <div className="col-span-5">EMPLOYEE</div>
                                <div className="col-span-3">EMAIL</div>
                                <div className="col-span-2">STATUS</div>
                                <div className="col-span-2 text-right">ACTIONS</div>
                            </div>

                            {/* Table Rows */}
                            <div className="divide-y divide-[#E5E7EB]">
                                {filteredEmployees.map((employee) => (
                                    <div
                                        key={employee.id}
                                        className="grid grid-cols-12 gap-4 px-6 py-4 hover:bg-[#F9FAFB] transition-colors"
                                    >
                                        {/* Employee Info */}
                                        <div className="col-span-5 flex items-center gap-3">
                                            <div className="w-10 h-10 bg-[#3B82F6] rounded-full flex items-center justify-center flex-shrink-0">
                                                <User className="w-5 h-5 text-white" />
                                            </div>
                                            <div>
                                                <div className="font-medium text-[#111827]">
                                                    {employee.name}
                                                </div>
                                                {employee.role && (
                                                    <div className="text-sm text-[#6B7280]">
                                                        {employee.role}
                                                    </div>
                                                )}
                                            </div>
                                        </div>


                                        <div className="col-span-3 flex items-center">
                                            <span className="text-sm text-[#6B7280]">
                                                {employee.email}
                                            </span>
                                        </div>


                                        <div className="col-span-2 flex items-center">
                                            <Badge
                                                className={`${employee.status === "active"
                                                    ? "bg-[#DCFCE7] text-[#10B981]"
                                                    : "bg-[#F3F4F6] text-[#6B7280]"
                                                    } border-0`}
                                            >
                                                {employee.status || "Pending"}
                                            </Badge>
                                        </div>


                                        <div className="col-span-2 flex items-center justify-end gap-2">
                                            <Button
                                                size="sm"
                                                variant="secondary"
                                                onClick={() =>
                                                    onNavigate("employee-details", {
                                                        employeeId: employee.id,
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


            <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>Add New Employee</DialogTitle>
                        <DialogDescription>
                            Add a new team member. They'll receive an
                            email to join The Department.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div>
                            <label
                                htmlFor="name"
                                className="block text-sm font-medium text-[#111827] mb-2"
                            >
                                Full Name <span className="text-[#EF4444]">*</span>
                            </label>
                            <Input
                                id="name"
                                name="name"
                                value={formData.name}
                                onChange={handleInputChange}
                                placeholder="John Doe"
                                aria-invalid={!!formErrors.name}
                                className={formErrors.name ? "border-[#EF4444]" : ""}
                            />
                            {formErrors.name && (
                                <p className="text-xs text-[#EF4444] mt-1">
                                    {formErrors.name}
                                </p>
                            )}
                        </div>
                        <div>
                            <label
                                htmlFor="email"
                                className="block text-sm font-medium text-[#111827] mb-2"
                            >
                                Email Address <span className="text-[#EF4444]">*</span>
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B7280]" />
                                <Input
                                    id="email"
                                    name="email"
                                    type="email"
                                    value={formData.email}
                                    onChange={handleInputChange}
                                    placeholder="john.doe@example.com"
                                    className={`pl-10 ${formErrors.email ? "border-[#EF4444]" : ""
                                        }`}
                                    aria-invalid={!!formErrors.email}
                                />
                            </div>
                            {formErrors.email && (
                                <p className="text-xs text-[#EF4444] mt-1">
                                    {formErrors.email}
                                </p>
                            )}
                        </div>
                        <div>
                            <label
                                htmlFor="password"
                                className="block text-sm font-medium text-[#111827] mb-2"
                            >
                                Password <span className="text-[#EF4444]">*</span>
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B7280]" />
                                <Input
                                    id="password"
                                    name="password"
                                    type="password"
                                    value={formData.password}
                                    onChange={handleInputChange}
                                    placeholder="********"
                                    className={`pl-10 ${formErrors.password ? "border-[#EF4444]" : ""
                                        }`}
                                    aria-invalid={!!formErrors.password}
                                />
                            </div>
                            {formErrors.password && (
                                <p className="text-xs text-[#EF4444] mt-1">
                                    {formErrors.password}
                                </p>
                            )}
                        </div>


                        <div className="bg-[#EFF6FF] border border-[#3B82F6]/20 p-3 rounded-lg">
                            <p className="text-xs text-[#1E40AF]">
                                An invitation email will be sent to the employee. They'll
                                need to login and complete their profile to access the
                                system.
                            </p>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="secondary" size="sm" onClick={handleCloseModal}>
                            Cancel
                        </Button>
                        <Button
                            onClick={handleAddEmployee}
                            size="sm"
                            className="bg-[#3B82F6] hover:bg-[#2563EB] text-white"
                        >
                            Send Invitation
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

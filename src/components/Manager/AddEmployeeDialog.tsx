import { useState } from "react";
import { Mail, Lock, Phone } from "lucide-react";
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
import { usePositions } from "../../hooks/Manager/usePositions";
import { useAuth } from "../../hooks/context/AuthContext";
import type { AddEmployeeFormData } from "../../hooks/types/teamOverview";

interface AddEmployeeDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: AddEmployeeFormData) => void;
}

export function AddEmployeeDialog({
    isOpen,
    onClose,
    onSubmit,
}: AddEmployeeDialogProps) {
    const { positions, isLoading: positionsLoading } = usePositions();
    const { departmentId } = useAuth();
    const [formData, setFormData] = useState<AddEmployeeFormData>({
        full_name: "",
        email: "",
        password: "",
        phone: "",
        user_type_id: 2,
        department_id: departmentId || 0,
        position_id: null,
    });
    const [formErrors, setFormErrors] = useState<Partial<AddEmployeeFormData>>({});

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: name === "position_id" ? (value ? Number(value) : null) : value,
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

        if (!formData.full_name.trim()) {
            errors.full_name = "Name is required" as any;
        }

        if (!formData.email.trim()) {
            errors.email = "Email is required";
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            errors.email = "Please enter a valid email address";
        }

        if (!formData.password.trim()) {
            errors.password = "Password is required";
        }

        if (!formData.position_id) {
            errors.position_id = "Position is required" as any;
        }

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleAddEmployee = async () => {
        if (!validateForm()) {
            return;
        }

        onSubmit(formData);

        // Reset form
        setFormData({
            full_name: "",
            email: "",
            password: "",
            phone: "",
            user_type_id: 2,
            department_id: departmentId || 0,
            position_id: null,
        });
        setFormErrors({});
    };

    const handleCloseModal = () => {
        onClose();
        setFormData({
            full_name: "",
            email: "",
            password: "",
            phone: "",
            user_type_id: 2,
            department_id: departmentId || 0,
            position_id: null,
        });
        setFormErrors({});
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleCloseModal}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Add New Employee</DialogTitle>
                    <DialogDescription>
                        Add a new team member. They'll receive an email to join
                        The Department.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div>
                        <label
                            htmlFor="full_name"
                            className="block text-sm font-medium text-[#111827] mb-2"
                        >
                            Full Name <span className="text-[#EF4444]">*</span>
                        </label>
                        <Input
                            id="full_name"
                            name="full_name"
                            value={formData.full_name}
                            onChange={handleInputChange}
                            placeholder="John Doe"
                            aria-invalid={!!formErrors.full_name}
                            className={formErrors.full_name ? "border-[#EF4444]" : ""}
                        />
                        {formErrors.full_name && (
                            <p className="text-xs text-[#EF4444] mt-1">
                                {String(formErrors.full_name)}
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
                            htmlFor="phone"
                            className="block text-sm font-medium text-[#111827] mb-2"
                        >
                            Phone Number
                        </label>
                        <div className="relative">
                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B7280]" />
                            <Input
                                id="phone"
                                name="phone"
                                type="tel"
                                value={formData.phone}
                                onChange={handleInputChange}
                                placeholder="81661399"
                                className="pl-10"
                            />
                        </div>
                    </div>
                    <div>
                        <label
                            htmlFor="position_id"
                            className="block text-sm font-medium text-[#111827] mb-2"
                        >
                            Position <span className="text-[#EF4444]">*</span>
                        </label>
                        <select
                            id="position_id"
                            name="position_id"
                            value={formData.position_id || ""}
                            onChange={handleInputChange}
                            className={`w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#3B82F6] ${
                                formErrors.position_id ? "border-[#EF4444]" : "border-[#E5E7EB]"
                            }`}
                            disabled={positionsLoading}
                        >
                            <option value="">Select a position</option>
                            {positions.map((position) => (
                                <option key={position.id} value={position.id}>
                                    {position.name}
                                </option>
                            ))}
                        </select>
                        {formErrors.position_id && (
                            <p className="text-xs text-[#EF4444] mt-1">
                                {String(formErrors.position_id)}
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
    );
}

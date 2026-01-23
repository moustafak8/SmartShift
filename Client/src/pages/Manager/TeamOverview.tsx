import { useState } from "react";
import { Search, User, UserPlus } from "lucide-react";
import { Button, Input, Badge, Card } from "../../components/ui";
import { AddEmployeeDialog } from "../../components/Manager/AddEmployeeDialog";
import { EmployeeDetail } from "../../components/Manager/EmployeeDetails";
import { EmployeeFilter } from "../../components/Manager/EmployeeFilter";
import { useEmployees } from "../../hooks/Manager/useEmployee";
import { Layout } from "../../components/Sidebar";

export function TeamOverview() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | null>(
    null,
  );
  const [statusFilter, setStatusFilter] = useState<
    "all" | "active" | "inactive"
  >("all");
  const [riskFilter, setRiskFilter] = useState<
    "all" | "high" | "medium" | "low" | "none"
  >("all");
  const { employees, isLoading, isError, error, refetch } = useEmployees();

  
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 7;

  const filteredEmployees = employees.filter((emp) => {
    const matchesSearch = emp.employee_name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && emp.is_active === 1) ||
      (statusFilter === "inactive" && emp.is_active === 0);

    const matchesRisk =
      riskFilter === "all" ||
      (riskFilter === "none" && !emp.fatigue_score) ||
      (emp.fatigue_score && emp.fatigue_score.risk_level === riskFilter);

    return matchesSearch && matchesStatus && matchesRisk;
  });

  const totalPages = Math.ceil(filteredEmployees.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = Math.min(
    startIndex + ITEMS_PER_PAGE,
    filteredEmployees.length,
  );
  const paginatedEmployees = filteredEmployees.slice(
    startIndex,
    startIndex + ITEMS_PER_PAGE,
  );

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const clearFilters = () => {
    setStatusFilter("all");
    setRiskFilter("all");
    setCurrentPage(1); 
  };

 
  if (currentPage > 1 && paginatedEmployees.length === 0 && totalPages > 0) {
    setCurrentPage(1);
  }

  return (
    <Layout>
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
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-10"
              />
            </div>

            <EmployeeFilter
              statusFilter={statusFilter}
              riskFilter={riskFilter}
              onStatusChange={(val) => {
                setStatusFilter(val);
                setCurrentPage(1);
              }}
              onRiskChange={(val) => {
                setRiskFilter(val);
                setCurrentPage(1);
              }}
              onClearFilters={clearFilters}
            />
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
          ) : isError ? (
            <Card className="p-12 text-center">
              <p className="text-[#EF4444] mb-2">Failed to load employees</p>
              <p className="text-sm text-[#6B7280]">
                {error?.message || "An error occurred while fetching employees"}
              </p>
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
              <div className="bg-white border border-[#E5E7EB] rounded-xl overflow-hidden">
                <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-[#F9FAFB] border-b border-[#E5E7EB] text-sm font-medium text-[#6B7280]">
                  <div className="col-span-4">NAME</div>
                  <div className="col-span-2 text-center">FATIGUE SCORE</div>
                  <div className="col-span-2 text-center">RISK LEVEL</div>
                  <div className="col-span-2 text-center">STATUS</div>
                  <div className="col-span-2 text-right">ACTIONS</div>
                </div>
                <div className="divide-y divide-[#E5E7EB]">
                  {paginatedEmployees.map((employee) => (
                    <div
                      key={employee.employee_id}
                      className="grid grid-cols-12 gap-4 px-6 py-4 hover:bg-[#F9FAFB] transition-colors"
                    >
                      <div className="col-span-4 flex items-center gap-3">
                        <div className="w-10 h-10 bg-[#3B82F6] rounded-full flex items-center justify-center flex-shrink-0">
                          <User className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <div className="font-medium text-[#111827]">
                            {employee.employee_name}
                          </div>
                          <div className="text-sm text-[#6B7280]">
                            {employee.position}
                          </div>
                        </div>
                      </div>
                      <div className="col-span-2 flex flex-col items-center justify-center">
                        {employee.fatigue_score ? (
                          <>
                            <div className="text-2xl font-bold text-[#111827]">
                              {employee.fatigue_score.total_score}
                            </div>
                            <div className="text-xs text-[#6B7280] mt-1">
                              Score
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="text-2xl font-bold text-[#9CA3AF]">
                              -
                            </div>
                            <div className="text-xs text-[#6B7280] mt-1">
                              No data
                            </div>
                          </>
                        )}
                      </div>
                      <div className="col-span-2 flex items-center justify-center">
                        {employee.fatigue_score ? (
                          <Badge
                            className={`${
                              employee.fatigue_score.risk_level === "low"
                                ? "bg-[#DCFCE7] text-[#10B981]"
                                : employee.fatigue_score.risk_level === "medium"
                                  ? "bg-[#FEF3C7] text-[#F59E0B]"
                                  : "bg-[#FEE2E2] text-[#EF4444]"
                            } border-0 capitalize`}
                          >
                            {employee.fatigue_score.risk_level}
                          </Badge>
                        ) : (
                          <Badge className="bg-[#F3F4F6] text-[#6B7280] border-0">
                            N/A
                          </Badge>
                        )}
                      </div>
                      <div className="col-span-2 flex items-center justify-center">
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-2 h-2 rounded-full ${
                              employee.is_active === 1
                                ? "bg-[#10B981]"
                                : "bg-[#6B7280]"
                            }`}
                          />
                          <span className="text-sm text-[#111827]">
                            {employee.is_active === 1 ? "Active" : "Inactive"}
                          </span>
                        </div>
                      </div>

                      <div className="col-span-2 flex items-center justify-end gap-2">
                        <Button
                          size="sm"
                          onClick={() =>
                            setSelectedEmployeeId(employee.employee_id)
                          }
                          className="border border-[#E5E7EB]"
                          variant="secondary"
                        >
                          View
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="mt-6 flex items-center justify-between">
                <div className="text-sm text-[#6B7280]">
                  Showing {startIndex + 1} to {endIndex} of{" "}
                  {filteredEmployees.length} employees
                </div>
                {totalPages > 1 && (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      disabled={currentPage === 1}
                      onClick={() => handlePageChange(currentPage - 1)}
                      className="border-[#E5E7EB]"
                      variant="secondary"
                    >
                      Previous
                    </Button>

                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                      (page) => (
                        <Button
                          key={page}
                          size="sm"
                          onClick={() => handlePageChange(page)}
                          className={`border-[#E5E7EB] ${
                            currentPage === page
                              ? "bg-[#3B82F6] text-white hover:bg-[#2563EB]"
                              : ""
                          }`}
                          variant={
                            currentPage === page ? "primary" : "secondary"
                          }
                        >
                          {page}
                        </Button>
                      ),
                    )}

                    <Button
                      size="sm"
                      disabled={currentPage === totalPages}
                      onClick={() => handlePageChange(currentPage + 1)}
                      className="border-[#E5E7EB]"
                      variant="secondary"
                    >
                      Next
                    </Button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        <AddEmployeeDialog
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onRefresh={refetch}
        />

        {selectedEmployeeId && (
          <EmployeeDetail
            employeeId={selectedEmployeeId}
            onClose={() => setSelectedEmployeeId(null)}
          />
        )}
      </div>
    </Layout>
  );
}

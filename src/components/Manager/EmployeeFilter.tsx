import { useState } from "react";
import { ListFilter } from "lucide-react";
import { Button } from "../ui";

interface EmployeeFilterProps {
  statusFilter: "all" | "active" | "inactive";
  riskFilter: "all" | "high" | "medium" | "low" | "none";
  onStatusChange: (status: "all" | "active" | "inactive") => void;
  onRiskChange: (risk: "all" | "high" | "medium" | "low" | "none") => void;
  onClearFilters: () => void;
}

export function EmployeeFilter({
  statusFilter,
  riskFilter,
  onStatusChange,
  onRiskChange,
  onClearFilters,
}: EmployeeFilterProps) {
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const activeFilterCount =
    (statusFilter !== "all" ? 1 : 0) + (riskFilter !== "all" ? 1 : 0);

  const handleClearFilters = () => {
    onClearFilters();
    setIsFilterOpen(false);
  };

  return (
    <div className="relative">
      <Button
        variant="secondary"
        size="sm"
        className="flex items-center"
        onClick={() => setIsFilterOpen(!isFilterOpen)}
      >
        <ListFilter className="w-4 h-4 mr-2" />
        Filter
        {activeFilterCount > 0 && (
          <span className="ml-2 bg-[#3B82F6] text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {activeFilterCount}
          </span>
        )}
      </Button>

      {isFilterOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsFilterOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-[#E5E7EB] z-20">
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#111827] mb-2">
                  Status
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) =>
                    onStatusChange(e.target.value as "all" | "active" | "inactive")
                  }
                  className="w-full px-3 py-2 border border-[#E5E7EB] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
                >
                  <option value="all">All</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#111827] mb-2">
                  Risk Level
                </label>
                <select
                  value={riskFilter}
                  onChange={(e) =>
                    onRiskChange(
                      e.target.value as "all" | "high" | "medium" | "low" | "none"
                    )
                  }
                  className="w-full px-3 py-2 border border-[#E5E7EB] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
                >
                  <option value="all">All</option>
                  <option value="high">High Risk</option>
                  <option value="medium">Medium Risk</option>
                  <option value="low">Low Risk</option>
                  <option value="none">No Data</option>
                </select>
              </div>

              {activeFilterCount > 0 && (
                <Button
                  size="sm"
                  onClick={handleClearFilters}
                  className="w-full border border-[#E5E7EB]"
                >
                  Clear Filters
                </Button>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

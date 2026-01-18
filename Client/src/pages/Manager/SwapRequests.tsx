import { useState } from "react";
import type {  ManagerSwapRequest , ValidationCheck} from "../../hooks/types/swaprequests";
import {
  Loader2,
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
  ArrowLeftRight,
  Brain,
  Lightbulb,
  TrendingUp,
  Users,
  Shield,
  Activity,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { Badge } from "../../components/ui";
import { Layout } from "../../components/Sidebar";
import { useAuth } from "../../hooks/context/AuthContext";
import {
  useManagerSwaps,
  useReviewSwap,
} from "../../hooks/Manager/useManagerSwaps";

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

function formatShiftType(type: string) {
  const types: Record<string, { label: string; time: string }> = {
    day: { label: "Day", time: "8:00 AM - 4:00 PM" },
    evening: { label: "Evening", time: "4:00 PM - 12:00 AM" },
    night: { label: "Night", time: "12:00 AM - 8:00 AM" },
  };
  return types[type] || { label: type, time: "" };
}

function getCheckIcon(checkName: string) {
  switch (checkName.toLowerCase()) {
    case "availability":
      return Users;
    case "fatigue":
      return Activity;
    case "staffing":
      return TrendingUp;
    case "compliance":
      return Shield;
    default:
      return CheckCircle2;
  }
}

function ValidationCheckItem({ check }: { check: ValidationCheck }) {
  const [expanded, setExpanded] = useState(false);
  const passed = check.passed;
  const Icon = getCheckIcon(check.check_name);
  const StatusIcon = passed ? CheckCircle2 : AlertTriangle;
  const statusColor = passed ? "text-[#10B981]" : "text-[#F59E0B]";
  const bgColor = passed ? "bg-[#F0FDF4]" : "bg-[#FFFBEB]";
  const borderColor = passed ? "border-[#10B981]/20" : "border-[#F59E0B]/20";

  const hasDetails = check.details && Object.keys(check.details).length > 0;

  return (
    <div
      className={`rounded-lg border ${borderColor} ${bgColor} overflow-hidden`}
    >
      <div
        className={`px-4 py-3 flex items-start justify-between ${hasDetails ? "cursor-pointer hover:bg-black/5" : ""}`}
        onClick={() => hasDetails && setExpanded(!expanded)}
      >
        <div className="flex items-start gap-3">
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center ${passed ? "bg-[#10B981]/10" : "bg-[#F59E0B]/10"}`}
          >
            <Icon className={`w-4 h-4 ${statusColor}`} />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="font-medium text-[#111827] capitalize">
                {check.check_name}
              </span>
              <StatusIcon className={`w-4 h-4 ${statusColor}`} />
            </div>
            <p className="text-sm text-[#6B7280] mt-0.5">{check.message}</p>
          </div>
        </div>
        {hasDetails && (
          <div className="text-[#6B7280]">
            {expanded ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </div>
        )}
      </div>

      {expanded && hasDetails && (
        <div className="px-4 py-3 border-t border-[#E5E7EB] bg-white/50">
          {check.details?.ai_analysis && (
            <p className="text-sm text-[#374151] mb-3">
              {String(check.details.ai_analysis)}
            </p>
          )}
          <div className="grid grid-cols-2 gap-3 text-xs">
            {Object.entries(check.details || {})
              .filter(([key]) => key !== "ai_analysis")
              .map(([key, value]) => (
                <div key={key} className="flex justify-between">
                  <span className="text-[#6B7280] capitalize">
                    {key.replace(/_/g, " ")}:
                  </span>
                  <span className="font-medium text-[#111827]">
                    {String(value)}
                  </span>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}

function parseValidationNotes(
  notes: unknown,
): import("../../hooks/types/swaprequests").ValidationNotes | null {
  if (!notes) return null;

  if (typeof notes === "object" && notes !== null && "decision" in notes) {
    return notes as import("../../hooks/types/swaprequests").ValidationNotes;
  }

  if (typeof notes === "string") {
    try {
      const parsed = JSON.parse(notes);
      if (
        typeof parsed === "object" &&
        parsed !== null &&
        "decision" in parsed
      ) {
        return parsed;
      }
    } catch {
      // Not valid JSON
    }
  }

  return null;
}

function SwapRequestCard({
  swap,
  onApprove,
  onReject,
  isReviewing,
}: {
  swap: ManagerSwapRequest;
  onApprove: () => void;
  onReject: () => void;
  isReviewing: boolean;
}) {
  const requesterName = swap.requester?.full_name || "Unknown";
  const targetName = swap.target_employee?.full_name || "Unknown";
  const requesterShift = swap.requester_shift;
  const targetShift = swap.target_shift;
  const validation = parseValidationNotes(swap.validation_notes);
  const hasRiskFactors =
    validation?.risk_factors && validation.risk_factors.length > 0;
  const hasSuggestions =
    validation?.suggestions && validation.suggestions.length > 0;

  const requesterShiftInfo = formatShiftType(
    requesterShift?.shift_type || "day",
  );
  const targetShiftInfo = formatShiftType(targetShift?.shift_type || "day");

  const confidencePercent = validation?.confidence
    ? Math.round(validation.confidence * 100)
    : 0;
  const confidenceColor =
    confidencePercent >= 80
      ? "text-[#10B981]"
      : confidencePercent >= 50
        ? "text-[#F59E0B]"
        : "text-[#EF4444]";

  return (
    <Card className="overflow-hidden border border-[#E5E7EB] hover:shadow-lg transition-all">
      <div className="px-6 py-4 border-b border-[#E5E7EB] bg-white">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#3B82F6] to-[#8B5CF6] flex items-center justify-center text-white font-bold">
              {requesterName.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-[#111827]">
                  {requesterName}
                </span>
                <Badge className="bg-[#FEF3C7] text-[#D97706] border-0 text-xs">
                  Pending
                </Badge>
              </div>
              <div className="text-sm text-[#6B7280]">
                wants to swap shift with{" "}
                <span className="font-medium">{targetName}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={onApprove}
              disabled={isReviewing}
              size="sm"
              className="bg-[#10B981] hover:bg-[#059669] text-white font-medium px-4 flex items-center justify-center"
            >
              {isReviewing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "Approve"
              )}
            </Button>
            <Button
              variant="secondary"
              onClick={onReject}
              disabled={isReviewing}
              size="sm"
              className="border border-[#EF4444] text-[#EF4444] hover:bg-[#FEF2F2] font-medium px-4 flex items-center justify-center"
            >
              {isReviewing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "Reject"
              )}
            </Button>
          </div>
        </div>
      </div>

      <div className="px-6 py-5 bg-white space-y-5">
        <div className="grid grid-cols-2 gap-6">
          <div className="p-3 rounded-lg bg-[#F9FAFB] border border-[#E5E7EB]">
            <div className="text-xs font-medium text-[#6B7280] uppercase tracking-wide mb-1">
              From:
            </div>
            <div className="text-[#111827] font-medium">
              {requesterShift ? formatDate(requesterShift.shift_date) : "N/A"}
            </div>
            <div className="text-sm text-[#6B7280]">
              {requesterShiftInfo.time} ({requesterShiftInfo.label})
            </div>
          </div>
          <div className="p-3 rounded-lg bg-[#F9FAFB] border border-[#E5E7EB]">
            <div className="text-xs font-medium text-[#6B7280] uppercase tracking-wide mb-1">
              To:
            </div>
            <div className="text-[#111827] font-medium">
              {targetShift ? formatDate(targetShift.shift_date) : "N/A"}
            </div>
            <div className="text-sm text-[#6B7280]">
              {targetShiftInfo.time} ({targetShiftInfo.label})
            </div>
          </div>
        </div>

        {swap.swap_reason && (
          <div className="p-4 rounded-lg bg-[#F9FAFB] border border-[#E5E7EB]">
            <div className="text-xs font-medium text-[#6B7280] uppercase tracking-wide mb-1">
              Reason for Request:
            </div>
            <div className="text-[#111827]">{swap.swap_reason}</div>
          </div>
        )}

        {validation && (
          <div className="rounded-xl border-2 border-[#8B5CF6]/20 bg-gradient-to-br from-[#8B5CF6]/5 to-white overflow-hidden">
            <div className="px-4 py-3 border-b border-[#E5E7EB] bg-white/80 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#8B5CF6] to-[#6366F1] flex items-center justify-center">
                  <Brain className="w-4 h-4 text-white" />
                </div>
                <div>
                  <span className="font-semibold text-[#111827]">
                    AI Analysis
                  </span>
                  <span className="text-xs text-[#6B7280] ml-2">
                    Automated validation
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="text-xs text-[#6B7280]">Confidence</div>
                  <div className={`font-bold ${confidenceColor}`}>
                    {confidencePercent}%
                  </div>
                </div>
                <Badge
                  className={`${validation.decision === "requires_review" ? "bg-[#FEF3C7] text-[#D97706]" : validation.decision === "auto_approve" ? "bg-[#DCFCE7] text-[#10B981]" : "bg-[#FEE2E2] text-[#EF4444]"} border-0 text-xs uppercase`}
                >
                  {validation.decision?.replace("_", " ")}
                </Badge>
              </div>
            </div>

            {validation.reasoning && (
              <div className="px-4 py-4 border-b border-[#E5E7EB] bg-white/50">
                <div className="text-xs font-medium text-[#8B5CF6] uppercase tracking-wide mb-2">
                  Why Review Needed
                </div>
                <p className="text-sm text-[#374151] leading-relaxed">
                  {validation.reasoning}
                </p>
              </div>
            )}

            {validation.checks && validation.checks.length > 0 && (
              <div className="px-4 py-4 space-y-3">
                <div className="text-xs font-medium text-[#6B7280] uppercase tracking-wide">
                  Validation Checks
                </div>
                {validation.checks.map((check, index) => (
                  <ValidationCheckItem key={index} check={check} />
                ))}
              </div>
            )}

            {hasRiskFactors && (
              <div className="px-4 py-4 border-t border-[#E5E7EB] bg-[#FEF3C7]/30">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-4 h-4 text-[#D97706]" />
                  <span className="text-xs font-semibold text-[#D97706] uppercase tracking-wide">
                    Risk Factors
                  </span>
                </div>
                <ul className="space-y-1">
                  {validation.risk_factors.map((risk, index) => (
                    <li
                      key={index}
                      className="text-sm text-[#92400E] flex items-start gap-2"
                    >
                      <span className="text-[#D97706] mt-1">•</span>
                      {risk}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {hasSuggestions && (
              <div className="px-4 py-4 border-t border-[#E5E7EB] bg-[#EFF6FF]/50">
                <div className="flex items-center gap-2 mb-2">
                  <Lightbulb className="w-4 h-4 text-[#3B82F6]" />
                  <span className="text-xs font-semibold text-[#3B82F6] uppercase tracking-wide">
                    Suggestions
                  </span>
                </div>
                <ul className="space-y-1">
                  {validation.suggestions.map((suggestion, index) => (
                    <li
                      key={index}
                      className="text-sm text-[#1E40AF] flex items-start gap-2"
                    >
                      <span className="text-[#3B82F6] mt-1">•</span>
                      {suggestion}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}

export function SwapRequests() {
  const { departmentId } = useAuth();
  const { swaps, isLoading, isError, refetch } = useManagerSwaps(
    departmentId || undefined,
  );
  const reviewMutation = useReviewSwap();
  const [reviewingId, setReviewingId] = useState<number | null>(null);

  const handleReview = async (
    swapId: number,
    decision: "approve" | "reject",
  ) => {
    setReviewingId(swapId);
    try {
      await reviewMutation.mutateAsync({ swapId, decision });
    } catch (error) {
      console.error("Failed to review swap:", error);
    } finally {
      setReviewingId(null);
    }
  };

  return (
    <Layout>
      <div className="bg-[#F9FAFB] min-h-screen">
        <div className="border-b border-[#E5E7EB] bg-white sticky top-0 z-10">
          <div className="px-6 py-5">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-[#111827]">
                  Swap Requests
                </h1>
                <p className="text-sm text-[#6B7280] mt-1">
                  Review and approve shift swap requests requiring manager
                  attention
                </p>
              </div>
              {swaps.length > 0 && (
                <div className="px-4 py-2 rounded-full bg-[#FEF3C7] text-[#D97706] font-semibold">
                  {swaps.length} awaiting review
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="p-6">
          {isLoading && (
            <Card className="p-16 text-center bg-white">
              <div className="inline-block h-10 w-10 animate-spin rounded-full border-4 border-solid border-[#3B82F6] border-r-transparent"></div>
              <p className="mt-4 text-[#6B7280] font-medium">
                Loading swap requests...
              </p>
            </Card>
          )}

          {isError && (
            <Card className="p-16 text-center border-2 border-[#EF4444]/30 bg-[#FEF2F2]">
              <AlertCircle className="w-14 h-14 mx-auto text-[#EF4444] mb-4" />
              <h3 className="text-xl font-bold text-[#111827] mb-2">
                Failed to Load Requests
              </h3>
              <p className="text-[#6B7280] mb-6 max-w-md mx-auto">
                Something went wrong while fetching swap requests.
              </p>
              <Button
                onClick={() => refetch()}
                variant="secondary"
                className="border-2"
              >
                Try Again
              </Button>
            </Card>
          )}

          {!isLoading && !isError && swaps.length === 0 && (
            <Card className="p-16 text-center border border-[#E5E7EB] bg-white">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#F3F4F6] to-[#E5E7EB] flex items-center justify-center mx-auto mb-5">
                <ArrowLeftRight className="w-10 h-10 text-[#9CA3AF]" />
              </div>
              <h3 className="text-xl font-bold text-[#111827] mb-2">
                No Pending Requests
              </h3>
              <p className="text-[#6B7280] max-w-md mx-auto">
                There are no swap requests awaiting your review. When employees
                request swaps that need manager approval, they will appear here.
              </p>
            </Card>
          )}

          {!isLoading && !isError && swaps.length > 0 && (
            <div className="space-y-6">
              {swaps.map((swap) => (
                <SwapRequestCard
                  key={swap.id}
                  swap={swap}
                  onApprove={() => handleReview(swap.id, "approve")}
                  onReject={() => handleReview(swap.id, "reject")}
                  isReviewing={reviewingId === swap.id}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}

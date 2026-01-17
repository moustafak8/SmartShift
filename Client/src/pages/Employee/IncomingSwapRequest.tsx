import { useState } from "react";
import {
  ArrowLeftRight,
  Calendar,
  Clock,
  Loader2,
  AlertCircle,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { Layout } from "../../components/Sidebar";
import {
  useIncomingSwaps,
  useRespondToSwap,
  type IncomingSwap,
} from "../../hooks/Employee/useShiftSwap";

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
  });
}

function formatShiftType(type: string) {
  const types: Record<string, { label: string; time: string }> = {
    day: { label: "Day Shift", time: "8:00 AM - 4:00 PM" },
    evening: { label: "Evening Shift", time: "4:00 PM - 12:00 AM" },
    night: { label: "Night Shift", time: "12:00 AM - 8:00 AM" },
  };
  return types[type] || { label: type, time: "" };
}

function getTimeAgo(dateStr: string) {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);

  if (diffDays > 0) return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
  if (diffHours > 0) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
  return "Just now";
}

function SwapRequestCard({
  swap,
  onAccept,
  onDecline,
  isResponding,
}: {
  swap: IncomingSwap;
  onAccept: () => void;
  onDecline: () => void;
  isResponding: boolean;
}) {
  const requesterName = swap.requester?.full_name || "Unknown";
  const requesterInitials = requesterName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const targetShift = swap.target_shift;
  const requesterShift = swap.requester_shift;

  const targetShiftInfo = formatShiftType(targetShift?.shift_type || "day");
  const requesterShiftInfo = formatShiftType(
    requesterShift?.shift_type || "day"
  );

  return (
    <Card className="p-6 border border-[#E5E7EB] hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#3B82F6] to-[#2563EB] flex items-center justify-center text-white font-semibold">
            {requesterInitials}
          </div>
          <div>
            <div className="font-semibold text-[#111827] text-lg">
              {requesterName}
            </div>
            <div className="text-sm text-[#6B7280]">Swap Request</div>
          </div>
        </div>
        <div className="px-3 py-1.5 rounded-full bg-[#3B82F6]/10 text-[#3B82F6] text-sm font-medium flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5" />
          {getTimeAgo(swap.created_at)}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="p-4 rounded-xl border-2 border-[#EF4444]/20 bg-[#FEF2F2]">
          <div className="text-xs font-medium text-[#EF4444] mb-2 uppercase tracking-wide">
            You Give Up
          </div>
          <div className="font-semibold text-[#111827] mb-1">
            {targetShift ? formatDate(targetShift.shift_date) : "N/A"}
          </div>
          <div className="text-sm text-[#6B7280] flex items-center gap-2">
            <Clock className="w-4 h-4" />
            {targetShiftInfo.time}
          </div>
          <div className="text-sm text-[#6B7280] flex items-center gap-2 mt-1">
            <Calendar className="w-4 h-4" />
            {targetShiftInfo.label}
          </div>
        </div>

        <div className="p-4 rounded-xl border-2 border-[#10B981]/20 bg-[#F0FDF4]">
          <div className="text-xs font-medium text-[#10B981] mb-2 uppercase tracking-wide">
            You Receive
          </div>
          <div className="font-semibold text-[#111827] mb-1">
            {requesterShift ? formatDate(requesterShift.shift_date) : "N/A"}
          </div>
          <div className="text-sm text-[#6B7280] flex items-center gap-2">
            <Clock className="w-4 h-4" />
            {requesterShiftInfo.time}
          </div>
          <div className="text-sm text-[#6B7280] flex items-center gap-2 mt-1">
            <Calendar className="w-4 h-4" />
            {requesterShiftInfo.label}
          </div>
        </div>
      </div>

      {swap.swap_reason && (
        <div className="p-4 rounded-lg bg-[#F9FAFB] border border-[#E5E7EB] mb-6">
          <div className="text-xs font-medium text-[#6B7280] mb-1 uppercase tracking-wide">
            Reason
          </div>
          <p className="text-[#111827]">{swap.swap_reason}</p>
        </div>
      )}

      <div className="flex gap-3">
        <Button
          variant="secondary"
          onClick={onDecline}
          disabled={isResponding}
          className="flex-1 border-2 border-[#EF4444] text-[#EF4444] hover:bg-[#FEF2F2] bg-white"
        >
          {isResponding ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              <XCircle className="w-4 h-4 mr-2" />
              Decline
            </>
          )}
        </Button>
        <Button
          onClick={onAccept}
          disabled={isResponding}
          className="flex-1 bg-gradient-to-r from-[#3B82F6] to-[#2563EB] hover:from-[#2563EB] hover:to-[#1D4ED8] text-white shadow-md hover:shadow-lg transition-all"
        >
          {isResponding ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Accept
            </>
          )}
        </Button>
      </div>
    </Card>
  );
}

export function IncomingSwapRequest() {
  const { swaps, isLoading, isError, refetch } = useIncomingSwaps();
  const respondMutation = useRespondToSwap();
  const [respondingId, setRespondingId] = useState<number | null>(null);

  const handleResponse = async (
    swapId: number,
    response: "accept" | "decline"
  ) => {
    setRespondingId(swapId);
    try {
      await respondMutation.mutateAsync({ swapId, response });
    } catch (error) {
      console.error("Failed to respond to swap:", error);
    } finally {
      setRespondingId(null);
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#111827]">
              Incoming Swap Requests
            </h1>
            <p className="text-[#6B7280] mt-1">
              Review and respond to shift swap requests from your colleagues
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              onClick={() => refetch()}
              disabled={isLoading}
              className="border-[#E5E7EB]"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "Refresh"
              )}
            </Button>
          </div>
        </div>

        {isLoading && (
          <div className="flex flex-col items-center justify-center py-16">
            <Loader2 className="w-10 h-10 animate-spin text-[#3B82F6] mb-4" />
            <p className="text-[#6B7280]">Loading swap requests...</p>
          </div>
        )}

        {isError && (
          <Card className="p-8 text-center border border-[#EF4444]/30 bg-[#FEF2F2]">
            <AlertCircle className="w-12 h-12 mx-auto text-[#EF4444] mb-4" />
            <h3 className="text-lg font-semibold text-[#111827] mb-2">
              Failed to Load Requests
            </h3>
            <p className="text-[#6B7280] mb-4">
              Something went wrong while fetching swap requests.
            </p>
            <Button onClick={() => refetch()} variant="secondary">
              Try Again
            </Button>
          </Card>
        )}

        {!isLoading && !isError && swaps.length === 0 && (
          <Card className="p-12 text-center border border-[#E5E7EB]">
            <div className="w-16 h-16 rounded-full bg-[#F3F4F6] flex items-center justify-center mx-auto mb-4">
              <ArrowLeftRight className="w-8 h-8 text-[#9CA3AF]" />
            </div>
            <h3 className="text-lg font-semibold text-[#111827] mb-2">
              No Pending Requests
            </h3>
            <p className="text-[#6B7280] max-w-md mx-auto">
              You don't have any incoming swap requests at the moment. Check
              back later or refresh to see new requests.
            </p>
          </Card>
        )}

        {!isLoading && !isError && swaps.length > 0 && (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">
            {swaps.map((swap) => (
              <SwapRequestCard
                key={swap.id}
                swap={swap}
                onAccept={() => handleResponse(swap.id, "accept")}
                onDecline={() => handleResponse(swap.id, "decline")}
                isResponding={respondingId === swap.id}
              />
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}

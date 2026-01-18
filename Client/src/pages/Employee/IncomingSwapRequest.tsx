import { useState } from "react";
import {
  ArrowLeftRight,
  Calendar,
  Clock,
  Loader2,
  AlertCircle,
  CheckCircle2,
  XCircle,
  ArrowRight,
  User,
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
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function formatShiftType(type: string) {
  const types: Record<string, { label: string; time: string; color: string }> = {
    day: { label: "Day Shift", time: "8:00 AM - 4:00 PM", color: "#F59E0B" },
    evening: { label: "Evening Shift", time: "4:00 PM - 12:00 AM", color: "#8B5CF6" },
    night: { label: "Night Shift", time: "12:00 AM - 8:00 AM", color: "#3B82F6" },
  };
  return types[type] || { label: type, time: "", color: "#6B7280" };
}

function getTimeAgo(dateStr: string) {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);

  if (diffDays > 0) return `${diffDays}d ago`;
  if (diffHours > 0) return `${diffHours}h ago`;
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
  const requesterShiftInfo = formatShiftType(requesterShift?.shift_type || "day");

  return (
    <Card className="overflow-hidden border border-[#E5E7EB] hover:shadow-xl transition-all duration-300 hover:border-[#3B82F6]/30">
      
      <div className="bg-gradient-to-r from-[#3B82F6]/5 to-[#8B5CF6]/5 px-6 py-4 border-b border-[#E5E7EB]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#3B82F6] to-[#8B5CF6] flex items-center justify-center text-white font-bold text-lg shadow-lg">
              {requesterInitials}
            </div>
            <div>
              <div className="font-semibold text-[#111827] text-lg">
                {requesterName}
              </div>
              <div className="text-sm text-[#6B7280] flex items-center gap-1">
                <User className="w-3.5 h-3.5" />
                wants to swap shifts with you
              </div>
            </div>
          </div>
          <div className="px-3 py-1.5 rounded-full bg-white text-[#6B7280] text-sm font-medium flex items-center gap-1.5 border border-[#E5E7EB] shadow-sm">
            <Clock className="w-3.5 h-3.5" />
            {getTimeAgo(swap.created_at)}
          </div>
        </div>
      </div>

      
      <div className="px-6 py-5">
        <div className="flex items-stretch gap-4">
          
          <div className="flex-1 p-4 rounded-xl border-2 border-[#EF4444]/20 bg-gradient-to-br from-[#FEF2F2] to-white">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2 h-2 rounded-full bg-[#EF4444]"></div>
              <span className="text-xs font-semibold text-[#EF4444] uppercase tracking-wider">
                You Give Up
              </span>
            </div>
            <div className="font-bold text-[#111827] text-lg mb-2">
              {targetShift ? formatDate(targetShift.shift_date) : "N/A"}
            </div>
            <div className="space-y-1.5">
              <div className="text-sm text-[#374151] flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#6B7280]" />
                {targetShiftInfo.time}
              </div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium" 
                   style={{ backgroundColor: `${targetShiftInfo.color}15`, color: targetShiftInfo.color }}>
                <Calendar className="w-3.5 h-3.5" />
                {targetShiftInfo.label}
              </div>
            </div>
          </div>

       
          <div className="flex items-center justify-center">
            <div className="w-10 h-10 rounded-full bg-[#F3F4F6] flex items-center justify-center">
              <ArrowRight className="w-5 h-5 text-[#6B7280]" />
            </div>
          </div>

          
          <div className="flex-1 p-4 rounded-xl border-2 border-[#10B981]/20 bg-gradient-to-br from-[#F0FDF4] to-white">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2 h-2 rounded-full bg-[#10B981]"></div>
              <span className="text-xs font-semibold text-[#10B981] uppercase tracking-wider">
                You Receive
              </span>
            </div>
            <div className="font-bold text-[#111827] text-lg mb-2">
              {requesterShift ? formatDate(requesterShift.shift_date) : "N/A"}
            </div>
            <div className="space-y-1.5">
              <div className="text-sm text-[#374151] flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#6B7280]" />
                {requesterShiftInfo.time}
              </div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
                   style={{ backgroundColor: `${requesterShiftInfo.color}15`, color: requesterShiftInfo.color }}>
                <Calendar className="w-3.5 h-3.5" />
                {requesterShiftInfo.label}
              </div>
            </div>
          </div>
        </div>
  
        {swap.swap_reason && (
          <div className="mt-5 p-4 rounded-xl bg-[#F9FAFB] border border-[#E5E7EB]">
            <div className="text-xs font-semibold text-[#6B7280] mb-2 uppercase tracking-wider">
              Reason for Request
            </div>
            <p className="text-[#374151] leading-relaxed">{swap.swap_reason}</p>
          </div>
        )}
      </div>

      
      <div className="px-6 py-4 bg-[#F9FAFB] border-t border-[#E5E7EB] flex gap-3">
        <Button
          variant="secondary"
          onClick={onDecline}
          disabled={isResponding}
          className="flex-1 h-11 border-2 border-[#EF4444] text-[#EF4444] hover:bg-[#FEF2F2] bg-white font-medium transition-all flex items-center justify-center"
        >
          {isResponding ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <span className="flex items-center justify-center">
              <XCircle className="w-5 h-5 mr-2" />
              Decline Request
            </span>
          )}
        </Button>
        <Button
          onClick={onAccept}
          disabled={isResponding}
          className="flex-1 h-11 bg-gradient-to-r from-[#10B981] to-[#059669] hover:from-[#059669] hover:to-[#047857] text-white font-medium shadow-lg hover:shadow-xl transition-all flex items-center justify-center"
        >
          {isResponding ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <span className="flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 mr-2" />
              Accept Swap
            </span>
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
      <div className="bg-[#F9FAFB] min-h-screen">
       
        <div className="border-b border-[#E5E7EB] bg-white sticky top-0 z-10">
          <div className="px-6 py-5">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-[#111827]">
                  Incoming Swap Requests
                </h1>
                <p className="text-sm text-[#6B7280] mt-1">
                  Review and respond to shift swap requests from your colleagues
                </p>
              </div>
              {swaps.length > 0 && (
                <div className="px-4 py-2 rounded-full bg-[#3B82F6]/10 text-[#3B82F6] font-semibold">
                  {swaps.length} pending
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
                Something went wrong while fetching swap requests. Please try again.
              </p>
              <Button onClick={() => refetch()} variant="secondary" className="border-2">
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
                You don't have any incoming swap requests at the moment. 
                When a colleague requests to swap shifts with you, it will appear here.
              </p>
            </Card>
          )}

          {!isLoading && !isError && swaps.length > 0 && (
            <div className="space-y-6">
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
      </div>
    </Layout>
  );
}

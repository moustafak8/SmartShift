import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/Dialog";
import { Button, Badge } from "../ui";
import { Copy, Check, Calendar, User } from "lucide-react";
import { useState } from "react";
import type { FlaggedWellnessEntry } from "../../hooks/types/managerWellness";

interface ViewEntryDialogProps {
  isOpen: boolean;
  onClose: () => void;
  entry: FlaggedWellnessEntry | null;
}

export function ViewEntryDialog({
  isOpen,
  onClose,
  entry,
}: ViewEntryDialogProps) {
  const [copied, setCopied] = useState(false);

  const handleCopyEntry = () => {
    if (entry) {
      navigator.clipboard.writeText(entry.entry_text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (!entry) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Wellness Entry Details</DialogTitle>
          <DialogDescription>
            Complete wellness entry information
          </DialogDescription>
        </DialogHeader>

        
        <div className="space-y-4">
          <div className="flex items-center gap-4 p-4 rounded-lg bg-[#F9FAFB] border border-[#E5E7EB]">
            <div className="w-12 h-12 bg-[#3B82F6] rounded-full flex items-center justify-center flex-shrink-0">
              <User className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-[#111827]">
                {entry.employee_name}
              </h3>
              <p className="text-sm text-[#6B7280]">
                Employee ID: {entry.employee_id}
              </p>
            </div>
            <div className="flex gap-2">
              <Badge
                className={`${
                  entry.sentiment_label === "positive"
                    ? "bg-[#DCFCE7] text-[#10B981]"
                    : entry.sentiment_label === "negative"
                    ? "bg-[#FEE2E2] text-[#EF4444]"
                    : "bg-[#F3F4F6] text-[#6B7280]"
                } border-0 capitalize`}
              >
                {entry.sentiment_label}
              </Badge>
              <Badge
                className={`${
                  entry.flag_severity === "high"
                    ? "bg-[#FEE2E2] text-[#EF4444]"
                    : entry.flag_severity === "medium"
                    ? "bg-[#FEF3C7] text-[#F59E0B]"
                    : "bg-[#F3F4F6] text-[#6B7280]"
                } border-0 uppercase`}
              >
                {entry.flag_severity}
              </Badge>
            </div>
          </div>

          
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-medium text-[#111827]">
                Wellness Entry
              </h4>
              <Button
                size="sm"
                variant="secondary"
                onClick={handleCopyEntry}
                className="border border-[#E5E7EB] flex items-center gap-2"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    Copy Text
                  </>
                )}
              </Button>
            </div>
            <div className="p-4 rounded-lg bg-white border border-[#E5E7EB]">
              <p className="text-[#374151] leading-relaxed whitespace-pre-wrap">
                {entry.entry_text}
              </p>
            </div>
          </div>

          
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-lg bg-white border border-[#E5E7EB]">
              <div className="text-sm text-[#6B7280] mb-1">Submitted</div>
              <div className="flex items-center gap-2 text-[#111827]">
                <Calendar className="w-4 h-4 text-[#6B7280]" />
                <span className="text-sm">{formatDate(entry.created_at)}</span>
              </div>
            </div>

            <div className="p-4 rounded-lg bg-white border border-[#E5E7EB]">
              <div className="text-sm text-[#6B7280] mb-1">Word Count</div>
              <div className="text-lg font-semibold text-[#111827]">
                {entry.word_count} words
              </div>
            </div>

            <div className="p-4 rounded-lg bg-white border border-[#E5E7EB]">
              <div className="text-sm text-[#6B7280] mb-1">
                Sentiment Score
              </div>
              <div className="text-lg font-semibold text-[#111827]">
                {entry.sentiment_score}
              </div>
            </div>

            <div className="p-4 rounded-lg bg-white border border-[#E5E7EB]">
              <div className="text-sm text-[#6B7280] mb-1">Flag Reason</div>
              <div className="text-sm text-[#111827]">{entry.flag_reason}</div>
            </div>
          </div>
        </div>

        
        <div className="flex justify-end pt-4 border-t border-[#E5E7EB]">
          <Button variant="secondary" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

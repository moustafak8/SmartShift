import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../ui/Dialog";
import { Button } from "../ui/Button";
import { Textarea } from "../ui/Textarea";
import { Calendar, Clock } from "lucide-react";

interface SwapDialogProps {
  isOpen: boolean;
  onClose: () => void;
  shiftDetails: {
    date: string;
    time: string;
    type: string;
    shiftId?: number;
  };
  onContinue: (reason: string, additionalDetails: string) => void;
}

export function SwapDialog({ isOpen, onClose, shiftDetails, onContinue }: SwapDialogProps) {
  const [selectedReason, setSelectedReason] = useState<string>("family");
  const [additionalDetails, setAdditionalDetails] = useState<string>("");

  const reasons = [
    { id: "family", label: "Family emergency" },
    { id: "medical", label: "Medical appointment" },
    { id: "personal", label: "Personal commitment" },
    { id: "notwell", label: "Not feeling well" },
    { id: "other", label: "Other (please explain)" },
  ];

  const handleSubmit = () => {
    const reasonLabel = reasons.find(r => r.id === selectedReason)?.label || selectedReason;
    const fullReason = additionalDetails 
      ? `${reasonLabel}: ${additionalDetails}` 
      : reasonLabel;
    onContinue(fullReason, additionalDetails);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-[#111827]">
            Request Shift Swap
          </DialogTitle>
          <DialogDescription className="text-sm text-[#6B7280]">
            Step 1: Tell us why you need to swap
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          
          <div>
            <h3 className="text-sm font-semibold text-[#111827] mb-3">
              You want to swap:
            </h3>
            <div className="p-4 rounded-lg bg-[#F9FAFB] border border-[#E5E7EB] space-y-2">
              <div className="font-semibold text-[#111827]">{shiftDetails.date}</div>
              <div className="flex items-center gap-4 text-sm text-[#6B7280]">
                <div className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4" />
                  <span>{shiftDetails.time}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4" />
                  <span className="capitalize">{shiftDetails.type} Shift</span>
                </div>
              </div>
            </div>
          </div>

          
          <div>
            <h3 className="text-sm font-semibold text-[#111827] mb-3">
              Why do you need to swap?
            </h3>
            <div className="space-y-2">
              {reasons.map((reason) => (
                <label
                  key={reason.id}
                  className="flex items-center gap-3 p-3 rounded-lg border border-[#E5E7EB] hover:bg-[#F9FAFB] cursor-pointer transition-colors"
                >
                  <input
                    type="radio"
                    name="reason"
                    value={reason.id}
                    checked={selectedReason === reason.id}
                    onChange={(e) => setSelectedReason(e.target.value)}
                    className="w-4 h-4 text-[#3B82F6] border-[#D1D5DB] focus:ring-2 focus:ring-[#3B82F6] focus:ring-offset-0 cursor-pointer"
                  />
                  <span className="text-sm text-[#111827]">{reason.label}</span>
                </label>
              ))}
            </div>
          </div>

        
          <div>
            <h3 className="text-sm font-semibold text-[#111827] mb-3">
              Additional details (optional)
            </h3>
            <Textarea
              placeholder="Any additional information..."
              value={additionalDetails}
              onChange={(e) => setAdditionalDetails(e.target.value)}
              className="min-h-[100px] resize-none"
            />
          </div>
        </div>

        
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#E5E7EB]">
          <Button
            variant="secondary"
            onClick={onClose}
            className="px-6"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            className="px-6 bg-gradient-to-r from-[#3B82F6] to-[#2563EB] hover:from-[#2563EB] hover:to-[#1D4ED8] text-white shadow-md hover:shadow-lg transition-all"
          >
            Continue
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}


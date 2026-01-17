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
import { Calendar, Clock, Users } from "lucide-react";

interface SwapDialogProps {
  isOpen: boolean;
  onClose: () => void;
  shiftDetails: {
    date: string;
    time: string;
    type: string;
  };
}

export function SwapDialog({ isOpen, onClose, shiftDetails }: SwapDialogProps) {
  const [selectedReason, setSelectedReason] = useState<string>("family");
  const [additionalDetails, setAdditionalDetails] = useState<string>("");
  const [whoCanCover, setWhoCanCover] = useState<string>("anyone");

  const reasons = [
    { id: "family", label: "Family emergency" },
    { id: "medical", label: "Medical appointment" },
    { id: "personal", label: "Personal commitment" },
    { id: "notwell", label: "Not feeling well" },
    { id: "other", label: "Other (please explain)" },
  ];

  const coverOptions = [
    { id: "anyone", label: "Find anyone available" },
    { id: "specific", label: "Request specific person" },
  ];

  const handleSubmit = () => {
    
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-[#111827]">
            Request Shift Swap
          </DialogTitle>
          <DialogDescription className="text-sm text-[#6B7280]">
            Find someone to cover your shift
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

         
          <div>
            <h3 className="text-sm font-semibold text-[#111827] mb-3 flex items-center gap-2">
              <Users className="w-4 h-4" />
              Who can cover?
            </h3>
            <div className="space-y-2">
              {coverOptions.map((option) => (
                <label
                  key={option.id}
                  className="flex items-center gap-3 p-3 rounded-lg border border-[#E5E7EB] hover:bg-[#F9FAFB] cursor-pointer transition-colors"
                >
                  <input
                    type="radio"
                    name="cover"
                    value={option.id}
                    checked={whoCanCover === option.id}
                    onChange={(e) => setWhoCanCover(e.target.value)}
                    className="w-4 h-4 text-[#3B82F6] focus:ring-[#3B82F6] focus:ring-2"
                  />
                  <span className="text-sm text-[#111827]">{option.label}</span>
                </label>
              ))}
            </div>
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

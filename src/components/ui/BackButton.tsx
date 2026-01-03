import { ArrowLeft } from "lucide-react";

interface BackButtonProps {
  onClick?: () => void;
  label?: string;
  className?: string;
}

export function BackButton({
  onClick,
  label = "Back",
  className = "",
}: BackButtonProps) {
  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      window.history.back();
    }
  };

  return (
    <button
      onClick={handleClick}
      className={`flex items-center gap-2 text-[#6B7280] hover:text-[#2563EB] transition-colors group ${className}`}
    >
      <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
      <span className="text-[14px] font-medium">{label}</span>
    </button>
  );
}

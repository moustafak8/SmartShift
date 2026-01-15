import type { ReactNode } from "react";
import { Heading } from "./Heading";

interface SectionHeaderProps {
  title: ReactNode;
  description?: ReactNode;
  centered?: boolean;
  className?: string;
}

export function SectionHeader({
  title,
  description,
  centered = true,
  className = "",
}: SectionHeaderProps) {
  return (
    <div className={`${centered ? "text-center" : ""} mb-16 ${className}`}>
      <Heading level="h2" size="lg">
        {title}
      </Heading>
      {description && (
        <p className="text-[16px] text-[#6B7280] mt-4">{description}</p>
      )}
    </div>
  );
}

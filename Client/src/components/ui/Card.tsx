import type { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
  variant?: "default" | "elevated" | "bordered";
}

export function Card({
  children,
  className = "",
  variant = "default",
}: CardProps) {
  const baseClasses = "rounded-xl";

  const variantClasses = {
    default: "bg-white p-10 shadow-card",
    elevated:
      "bg-white p-10 shadow-card hover:shadow-card-hover transition-shadow",
    bordered: "bg-white border border-[#E5E7EB] p-4",
  };

  return (
    <div className={`${baseClasses} ${variantClasses[variant]} ${className}`}>
      {children}
    </div>
  );
}

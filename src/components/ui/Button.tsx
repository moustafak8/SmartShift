import type { ButtonHTMLAttributes } from "react";

type ButtonSize = "sm" | "md" | "lg";
type ButtonVariant = "primary" | "secondary";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  size?: ButtonSize;
  variant?: ButtonVariant;
}

export function Button({
  children,
  size = "md",
  variant = "primary",
  className = "",
  ...props
}: ButtonProps) {
  const baseClasses = "rounded-lg transition-all cursor-pointer font-medium";

  const sizeClasses: Record<ButtonSize, string> = {
    sm: "text-[14px] px-6 py-2",
    md: "text-[16px] px-8 py-3.5",
    lg: "text-[14px] px-6 py-3 w-full",
  };

  const variantClasses: Record<ButtonVariant, string> = {
    primary: "bg-[#2563EB] text-white hover:bg-[#1D4ED8] hover:shadow-lg",
    secondary:
      "bg-white text-[#2563EB] border-2 border-[#2563EB] hover:bg-blue-50",
  };

  return (
    <button
      className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

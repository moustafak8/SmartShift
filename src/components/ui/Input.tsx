import * as React from "react";

import { cn } from "./utils";
export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> { }

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = "text", ...props }, ref) => {
    return (
      <input
        type={type}
        ref={ref}
        data-slot="input"
        className={cn(
          "flex h-9 w-full min-w-0 rounded-md border px-3 py-1 text-base outline-none transition-[color,box-shadow]",
          "border-[#E5E7EB] bg-white dark:bg-input/30",
          "focus-visible:border-[#3B82F6] focus-visible:ring-[3px] focus-visible:ring-[#3B82F6]/20",
          "placeholder:text-[#9CA3AF]",
          "selection:bg-[#3B82F6] selection:text-white",
          "aria-invalid:border-[#EF4444] aria-invalid:ring-[#EF4444]/20 dark:aria-invalid:ring-[#EF4444]/40",
          "disabled:cursor-not-allowed disabled:opacity-50 disabled:pointer-events-none",
          "file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-[#111827]",
          "md:text-sm",
          className,
        )}
        {...props}
      />
    );
  }
);

Input.displayName = "Input";

export { Input };

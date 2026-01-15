import type { HTMLAttributes } from "react";
import React from "react";

type HeadingLevel = "h1" | "h2" | "h3" | "h4";
type HeadingSize = "xl" | "lg" | "md" | "sm";

interface HeadingProps extends HTMLAttributes<HTMLHeadingElement> {
  children: React.ReactNode;
  level?: HeadingLevel;
  size?: HeadingSize;
}

export function Heading({
  children,
  level = "h2",
  size,
  className = "",
  ...props
}: HeadingProps) {
  // Default size based on level if not explicitly provided
  const defaultSize: Record<HeadingLevel, HeadingSize> = {
    h1: "xl",
    h2: "lg",
    h3: "md",
    h4: "sm",
  };

  const finalSize = size || defaultSize[level];

  const baseClasses = "font-bold text-black";

  const sizeClasses: Record<HeadingSize, string> = {
    xl: "text-[52px] md:text-[36px] sm:text-[28px] leading-[1.2]",
    lg: "text-[36px] md:text-[28px]",
    md: "text-[20px]",
    sm: "text-[16px]",
  };

  const finalClassName = `${baseClasses} ${sizeClasses[finalSize]} ${className}`;

  // Render appropriate heading element based on level
  if (level === "h1") {
    return (
      <h1 className={finalClassName} {...props}>
        {children}
      </h1>
    );
  }
  if (level === "h3") {
    return (
      <h3 className={finalClassName} {...props}>
        {children}
      </h3>
    );
  }
  if (level === "h4") {
    return (
      <h4 className={finalClassName} {...props}>
        {children}
      </h4>
    );
  }

  // Default to h2
  return (
    <h2 className={finalClassName} {...props}>
      {children}
    </h2>
  );
}

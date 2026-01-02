import type { ReactNode } from "react";

interface ContainerProps {
  children: ReactNode;
  className?: string;
  as?: "div" | "section";
}

export function Container({
  children,
  className = "",
  as = "div",
}: ContainerProps) {
  const Component = as;

  return (
    <Component className={`max-w-layout mx-auto px-10 md:px-6 ${className}`}>
      {children}
    </Component>
  );
}

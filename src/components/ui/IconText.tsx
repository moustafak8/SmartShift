import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

type IconSize = "sm" | "md" | "lg";
type IconColor = "default" | "error" | "accent";
type Layout = "horizontal" | "vertical";

interface IconTextProps {
  icon: LucideIcon;
  title?: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
  iconSize?: IconSize;
  iconColor?: IconColor;
  layout?: Layout;
  className?: string;
  iconClassName?: string;
  contentClassName?: string;
}

export function IconText({
  icon: Icon,
  title,
  description,
  children,
  iconSize = "md",
  iconColor = "default",
  layout = "vertical",
  className = "",
  iconClassName = "",
  contentClassName = "",
}: IconTextProps) {
  const iconSizeClasses: Record<IconSize, string> = {
    sm: "w-6 h-6",
    md: "w-8 h-8",
    lg: "w-12 h-12",
  };

  const iconColorClasses: Record<IconColor, string> = {
    default: "text-[#2563EB]",
    error: "text-[#EF4444]",
    accent: "text-[#F59E0B]",
  };

  const layoutClasses = layout === "horizontal" ? "flex gap-4" : "space-y-3";

  return (
    <div className={`${layoutClasses} ${className}`}>
      <Icon
        className={`${iconSizeClasses[iconSize]} ${iconColorClasses[iconColor]} flex-shrink-0 ${iconClassName}`}
      />
      <div className={contentClassName}>
        {title && <div className="font-bold text-black">{title}</div>}
        {description && (
          <div className="text-[14px] leading-[1.6] text-[#6B7280]">
            {description}
          </div>
        )}
        {children}
      </div>
    </div>
  );
}

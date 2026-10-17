"use client";

import React, { forwardRef } from "react";
import { useTheme } from "@/context/ThemeContext";
import { Loader2 } from "lucide-react";

export type ButtonVariant = "default" | "primary" | "secondary" | "outline" | "danger";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  icon?: React.ReactNode;
  iconPosition?: "left" | "right";
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "default",
      icon,
      iconPosition = "left",
      loading = false,
      disabled,
      className = "",
      children,
      ...rest
    },
    ref,
  ) => {
    const { theme } = useTheme();
    const isLight = theme === "light";

    // Style variants matching DAWH inventory toolbar specifications
    let variantStyles = "";

    switch (variant) {
      case "primary":
        // Theme-adaptive Black/White Primary CTA
        variantStyles = isLight
          ? "bg-[#222222] hover:bg-black text-white font-semibold shadow-xs"
          : "bg-white hover:bg-[#F4F4F5] text-[#222222] font-semibold shadow-xs";
        break;

      case "danger":
        variantStyles = isLight
          ? "bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-100 font-medium"
          : "bg-rose-500/10 text-rose-400 border border-rose-500/30 hover:bg-rose-500/20 font-medium";
        break;

      case "secondary":
        variantStyles = isLight
          ? "bg-zinc-100 border border-zinc-300 text-[#222222] hover:bg-zinc-200 font-medium"
          : "bg-[#444444] border border-[#555555] text-[#F8FAFC] hover:bg-[#4d4d4d] font-medium";
        break;

      case "default":
      case "outline":
      default:
        // Default standard toolbar button (e.g. export, import, filter buttons)
        variantStyles = isLight
          ? "bg-white border-[#E4E4E7] text-[#222222] hover:bg-slate-100 border font-normal"
          : "bg-[#383838] border-[#444444] text-[#F8FAFC] hover:bg-[#444444] border font-normal";
        break;
    }

    const isDisabled = disabled || loading;

    return (
      <button
        ref={ref}
        type="button"
        disabled={isDisabled}
        className={`flex items-center justify-center px-4 py-2 gap-1.5 h-[33px] rounded-[6px] text-[13px] transition-colors cursor-pointer select-none ${variantStyles} ${
          isDisabled ? "opacity-50 cursor-not-allowed pointer-events-none" : ""
        } ${className}`}
        {...rest}
      >
        {loading ? (
          <Loader2 size={14} className="animate-spin shrink-0" />
        ) : (
          icon && iconPosition === "left" && <span className="shrink-0">{icon}</span>
        )}
        {children && <span>{children}</span>}
        {!loading && icon && iconPosition === "right" && (
          <span className="shrink-0">{icon}</span>
        )}
      </button>
    );
  },
);

Button.displayName = "Button";

export default Button;

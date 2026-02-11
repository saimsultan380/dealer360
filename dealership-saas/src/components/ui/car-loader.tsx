"use client";

import * as React from "react";
import { Car } from "lucide-react";
import { cn } from "@/lib/utils";

type CarLoaderProps = {
  className?: string;
  label?: string;
  size?: "sm" | "md" | "lg";
};

export function CarLoader({
  className,
  label = "Loading…",
  size = "md",
}: CarLoaderProps) {
  const sizeConfig = {
    sm: { icon: 28, bar: "w-24", text: "text-xs", gap: "gap-3" },
    md: { icon: 36, bar: "w-32", text: "text-sm", gap: "gap-4" },
    lg: { icon: 44, bar: "w-40", text: "text-sm", gap: "gap-5" },
  }[size];

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "flex flex-col items-center justify-center",
        sizeConfig.gap,
        className
      )}
    >
      {/* Car icon with subtle pulse glow */}
      <div className="dealer-loader__icon-wrap">
        <Car
          className="dealer-loader__icon"
          aria-hidden="true"
          width={sizeConfig.icon}
          height={sizeConfig.icon}
        />
      </div>

      {/* Shimmer progress bar */}
      <div className={cn("dealer-loader__track", sizeConfig.bar)}>
        <div className="dealer-loader__shimmer" />
      </div>

      {/* Label */}
      {label && (
        <span
          className={cn(
            "dealer-loader__label text-muted-foreground font-medium tracking-wide",
            sizeConfig.text
          )}
        >
          {label}
        </span>
      )}
    </div>
  );
}

"use client";

import * as React from "react";
import { Car } from "lucide-react";

import { cn } from "@/lib/utils";

type CarLoaderProps = {
  className?: string;
  label?: string;
  size?: "sm" | "md" | "lg";
};

const sizeToTrackClass: Record<NonNullable<CarLoaderProps["size"]>, string> = {
  sm: "car-loader--sm",
  md: "car-loader--md",
  lg: "car-loader--lg",
};

export function CarLoader({
  className,
  label = "Loading…",
  size = "md",
}: CarLoaderProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "car-loader text-foreground",
        sizeToTrackClass[size],
        className
      )}
    >
      <div className="car-loader__track" aria-hidden="true">
        <div className="car-loader__car">
          <span className="car-loader__smoke car-loader__smoke--1" />
          <span className="car-loader__smoke car-loader__smoke--2" />
          <span className="car-loader__smoke car-loader__smoke--3" />
          <span className="car-loader__wheels" aria-hidden="true">
            <span className="car-loader__wheel car-loader__wheel--left" />
            <span className="car-loader__wheel car-loader__wheel--right" />
          </span>
          <Car className="car-loader__icon" />
        </div>
      </div>
      {label ? <div className="car-loader__label">{label}</div> : null}
    </div>
  );
}

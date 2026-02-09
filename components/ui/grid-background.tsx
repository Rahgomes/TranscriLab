"use client";

import { cn } from "@/lib/utils";

export function GridBackground({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("relative w-full", className)}>
      {/* Grid pattern */}
      <div className="absolute inset-0 dark:bg-dot-white/[0.15] bg-dot-black/[0.08] pointer-events-none" />
      {/* Radial fade */}
      <div className="absolute inset-0 pointer-events-none bg-background [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)]" />
      {/* Content */}
      <div className="relative z-10">{children}</div>
    </div>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/store";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Icon } from "@/components/ui/icon";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { RecordButton } from "@/features/realtime";

const navItems = [
  {
    href: "/",
    label: "Home",
    icon: "home",
  },
  {
    href: "/history",
    label: "Histórico",
    icon: "history",
  },
];

const bottomNavItems = [
  {
    href: "/settings",
    label: "Configurações",
    icon: "settings",
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const sidebarOpen = useUIStore((state) => state.sidebarOpen);
  const setSidebarOpen = useUIStore((state) => state.setSidebarOpen);

  return (
    <TooltipProvider delayDuration={0}>
      <motion.aside
        className="hidden md:flex fixed left-0 top-0 z-40 h-screen flex-col border-r bg-background/80 backdrop-blur-sm"
        animate={{
          width: sidebarOpen ? 224 : 64,
        }}
        transition={{
          duration: 0.3,
          ease: "easeInOut",
        }}
        onMouseEnter={() => setSidebarOpen(true)}
        onMouseLeave={() => setSidebarOpen(false)}
      >
        {/* Logo */}
        <div
          className={cn(
            "flex h-16 items-center border-b overflow-hidden",
            sidebarOpen ? "justify-between px-4" : "justify-center",
          )}
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground font-bold text-lg shadow-lg flex-shrink-0">
              T
            </div>
            <motion.span
              animate={{
                display: sidebarOpen ? "inline-block" : "none",
                opacity: sidebarOpen ? 1 : 0,
              }}
              transition={{ duration: 0.2 }}
              className="font-semibold text-lg whitespace-pre"
            >
              TranscriLab
            </motion.span>
          </div>
        </div>

        {/* Navigation */}
        <nav
          className={cn(
            "flex flex-1 flex-col gap-2 p-3 pt-6",
            sidebarOpen ? "items-stretch" : "items-center",
          )}
        >
          {navItems.map((item) => {
            const isActive = pathname === item.href;

            const linkContent = (
              <Link
                href={item.href}
                className={cn(
                  "relative flex items-center rounded-xl transition-all duration-200 group/sidebar",
                  "hover:bg-accent",
                  isActive && "bg-accent text-primary shadow-sm",
                  sidebarOpen ? "h-11 px-3 gap-3" : "h-11 w-11 justify-center",
                )}
              >
                <Icon
                  name={item.icon}
                  size="lg"
                  fill={isActive ? 1 : 0}
                  weight={isActive ? 500 : 400}
                  className={cn(
                    "transition-colors flex-shrink-0",
                    isActive ? "text-primary" : "text-muted-foreground",
                  )}
                />
                <motion.span
                  animate={{
                    display: sidebarOpen ? "inline-block" : "none",
                    opacity: sidebarOpen ? 1 : 0,
                  }}
                  transition={{ duration: 0.2 }}
                  className={cn(
                    "text-sm font-medium whitespace-pre group-hover/sidebar:translate-x-1 transition duration-150",
                    isActive ? "text-primary" : "text-muted-foreground",
                  )}
                >
                  {item.label}
                </motion.span>
                {!sidebarOpen && <span className="sr-only">{item.label}</span>}
              </Link>
            );

            if (sidebarOpen) {
              return <div key={item.href}>{linkContent}</div>;
            }

            return (
              <Tooltip key={item.href}>
                <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
                <TooltipContent side="right">{item.label}</TooltipContent>
              </Tooltip>
            );
          })}

          {/* Record button */}
          <div className="mt-2 pt-2 border-t border-border/50">
            <RecordButton variant={sidebarOpen ? "sidebar" : "sidebar-collapsed"} />
          </div>
        </nav>

        {/* Footer */}
        <div
          className={cn(
            "p-3 border-t flex flex-col gap-2",
            sidebarOpen ? "items-stretch" : "items-center",
          )}
        >
          {/* Settings link */}
          {bottomNavItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);

            const linkContent = (
              <Link
                href={item.href}
                className={cn(
                  "relative flex items-center rounded-xl transition-all duration-200 group/sidebar",
                  "hover:bg-accent",
                  isActive && "bg-accent text-primary shadow-sm",
                  sidebarOpen ? "h-11 px-3 gap-3" : "h-11 w-11 justify-center",
                )}
              >
                <Icon
                  name={item.icon}
                  size="lg"
                  fill={isActive ? 1 : 0}
                  weight={isActive ? 500 : 400}
                  className={cn(
                    "transition-colors flex-shrink-0",
                    isActive ? "text-primary" : "text-muted-foreground",
                  )}
                />
                <motion.span
                  animate={{
                    display: sidebarOpen ? "inline-block" : "none",
                    opacity: sidebarOpen ? 1 : 0,
                  }}
                  transition={{ duration: 0.2 }}
                  className={cn(
                    "text-sm font-medium whitespace-pre group-hover/sidebar:translate-x-1 transition duration-150",
                    isActive ? "text-primary" : "text-muted-foreground",
                  )}
                >
                  {item.label}
                </motion.span>
                {!sidebarOpen && <span className="sr-only">{item.label}</span>}
              </Link>
            );

            if (sidebarOpen) {
              return <div key={item.href}>{linkContent}</div>;
            }

            return (
              <Tooltip key={item.href}>
                <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
                <TooltipContent side="right">{item.label}</TooltipContent>
              </Tooltip>
            );
          })}

          {/* Theme toggle */}
          <Tooltip>
            <TooltipTrigger asChild>
              <div
                className={cn(
                  "flex",
                  sidebarOpen ? "px-3 py-2" : "justify-center",
                )}
              >
                <ThemeToggle />
              </div>
            </TooltipTrigger>
          </Tooltip>
        </div>
      </motion.aside>
    </TooltipProvider>
  );
}

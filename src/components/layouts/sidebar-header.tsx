"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import {
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "ui/sidebar";
import { PanelLeft } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { isShortcutEvent, Shortcuts } from "lib/keyboard-shortcuts";
import { useTheme } from "next-themes";

interface SidebarHeaderSharedProps {
  title: string | React.ReactNode;
  href: string;
  showMobileToggle?: boolean;
  onLinkClick?: () => void;
  enableShortcuts?: boolean;
}

export function SidebarHeaderShared({
  title,
  href,
  showMobileToggle = true,
  onLinkClick,
  enableShortcuts = false,
}: SidebarHeaderSharedProps) {
  const { toggleSidebar, setOpenMobile, open } = useSidebar();
  const isMobile = useIsMobile();
  const pathname = usePathname();
  const currentPath = useRef<string | null>(null);
  const { theme, resolvedTheme } = useTheme();
  const currentTheme = resolvedTheme || theme;

  // Handle shortcuts (only for main app sidebar)
  useEffect(() => {
    if (!enableShortcuts) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (isShortcutEvent(e, Shortcuts.toggleSidebar)) {
        e.preventDefault();
        toggleSidebar();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [toggleSidebar, enableShortcuts]);

  useEffect(() => {
    if (pathname === currentPath.current) return;
    if (isMobile) {
      setOpenMobile(false);
    }
    currentPath.current = pathname;
  }, [pathname, isMobile]);

  const handleLinkClick = (e: React.MouseEvent) => {
    if (onLinkClick) {
      e.preventDefault();
      onLinkClick();
    }
  };

  return (
    <SidebarHeader>
      <SidebarMenu>
        <SidebarMenuItem className="flex items-center gap-0.5 mb-1">
          <SidebarMenuButton 
            asChild 
            className="hover:bg-transparent group-data-[collapsible=icon]:!p-0"
          >
            <Link href={href} onClick={handleLinkClick} className="flex items-center gap-2">
              <Image 
                src="/aj-logo.jpg" 
                alt="TOMO Logo" 
                width={32} 
                height={32} 
                className="rounded-full flex-shrink-0"
              />
              <Image 
                src={currentTheme === "dark" ? "/tomo-brand-name-dark.png" : "/tomo-brand-name-light.png"} 
                alt="TOMO" 
                width={80} 
                height={24} 
                className="object-contain group-data-[collapsible=icon]:hidden"
              />
              {showMobileToggle && (
                <button
                  className="ml-auto hidden sm:block p-1.5 hover:bg-accent rounded-md transition-colors"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    toggleSidebar();
                  }}
                  data-state={open ? "open" : "closed"}
                  data-testid="sidebar-header-toggle"
                  title="Toggle Sidebar"
                >
                  <PanelLeft className="size-4" />
                </button>
              )}
              {showMobileToggle && (
                <div
                  className="ml-auto block sm:hidden"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setOpenMobile(false);
                  }}
                  data-state={open ? "open" : "closed"}
                  data-testid="sidebar-header-toggle-mobile"
                >
                  <PanelLeft className="size-4" />
                </div>
              )}
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarHeader>
  );
}

"use client";
import { Sidebar, SidebarContent, SidebarFooter } from "ui/sidebar";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { AppSidebarMenus } from "./app-sidebar-menus";
import { AppSidebarAgents } from "./app-sidebar-agents";
import { AppSidebarThreads } from "./app-sidebar-threads";
import { SidebarHeaderShared } from "./sidebar-header";

import { isShortcutEvent, Shortcuts } from "lib/keyboard-shortcuts";
import { AppSidebarUser } from "./app-sidebar-user";
import { BasicUser } from "app-types/user";

export function AppSidebar({
  user,
}: {
  user?: BasicUser;
}) {
  const userRole = user?.role;
  const router = useRouter();

  // Handle new chat shortcut (specific to main app)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isShortcutEvent(e, Shortcuts.openNewChat)) {
        e.preventDefault();
        router.push("/");
        router.refresh();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [router]);

  return (
    <Sidebar
      collapsible="icon"
      className="border-r border-sidebar-border/80"
    >
      <SidebarHeaderShared
        title="TOMO"
        href="/"
        enableShortcuts={true}
        onLinkClick={() => {
          router.push("/");
          router.refresh();
        }}
      />

      <SidebarContent className="mt-2 overflow-hidden relative">
        <div className="flex flex-col overflow-y-auto">
          <AppSidebarMenus user={user} />
          <AppSidebarAgents userRole={userRole} />
          <AppSidebarThreads />
        </div>
      </SidebarContent>
      <SidebarFooter className="flex flex-col items-stretch space-y-2">
        <AppSidebarUser user={user} />
        
        {/* AJ STUDIOZ Branding */}
        <div className="px-3 py-2 border-t border-sidebar-border/50">
          <div className="flex items-center justify-center gap-2 text-xs text-sidebar-foreground/60">
            <span>Designed by</span>
            <span className="animate-pulse text-red-500">♥</span>
            <div className="flex items-center gap-1">
              <img src="/AJ.svg" alt="AJ" className="w-4 h-4" />
              <span className="font-semibold text-sidebar-foreground/80">AJ STUDIOZ</span>
            </div>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}

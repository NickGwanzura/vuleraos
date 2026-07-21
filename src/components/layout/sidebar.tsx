"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetTitle,
} from "@/components/ui/sheet";
import { useMobileSidebar } from "@/hooks/use-mobile-sidebar";
import {
  LayoutDashboard,
  ShoppingCart,
  ShoppingBag,
  Package,
  BookOpen,
  Users,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
} from "lucide-react";
import { useState } from "react";

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

const navItems: NavItem[] = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: <LayoutDashboard className="h-4 w-4" />,
  },
  {
    label: "Sales",
    href: "/sales",
    icon: <ShoppingCart className="h-4 w-4" />,
  },
  {
    label: "Buying",
    href: "/buying",
    icon: <ShoppingBag className="h-4 w-4" />,
  },
  {
    label: "Stock",
    href: "/stock",
    icon: <Package className="h-4 w-4" />,
  },
  {
    label: "Accounting",
    href: "/accounting",
    icon: <BookOpen className="h-4 w-4" />,
  },
  {
    label: "HR",
    href: "/hr",
    icon: <Users className="h-4 w-4" />,
  },
  {
    label: "Reports",
    href: "/reports",
    icon: <BarChart3 className="h-4 w-4" />,
  },
  {
    label: "Settings",
    href: "/settings",
    icon: <Settings className="h-4 w-4" />,
  },
];

function SidebarNav({
  collapsed,
  onNavigate,
}: {
  collapsed: boolean;
  onNavigate?: () => void;
}) {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <>
      <ScrollArea className="flex-1">
        <nav className={cn("p-2 space-y-1", collapsed && "px-2")}>
          {navItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Button
                key={item.href}
                variant={isActive ? "secondary" : "ghost"}
                size={collapsed ? "icon" : "sm"}
                className={cn(
                  "w-full justify-start gap-2",
                  collapsed && "justify-center px-0",
                  isActive && "bg-sidebar-accent font-medium"
                )}
                onClick={() => {
                  router.push(item.href);
                  onNavigate?.();
                }}
              >
                {item.icon}
                {!collapsed && <span className="text-sm">{item.label}</span>}
              </Button>
            );
          })}
        </nav>
      </ScrollArea>
      {/* Logout at bottom */}
      <div className={cn("border-t p-2", collapsed && "px-2")}>
        <Button
          variant="ghost"
          size={collapsed ? "icon" : "sm"}
          className={cn(
            "w-full justify-start gap-2 text-destructive hover:text-destructive hover:bg-destructive/10",
            collapsed && "justify-center px-0"
          )}
          onClick={() => signOut({ callbackUrl: "/login" })}
        >
          <LogOut className="h-4 w-4" />
          {!collapsed && <span className="text-sm">Sign out</span>}
        </Button>
      </div>
    </>
  );
}

function SidebarLogo({
  collapsed,
  onCollapse,
}: {
  collapsed: boolean;
  onCollapse?: () => void;
}) {
  return (
    <div className="flex items-center h-14 border-b px-3">
      <Link
        href="/dashboard"
        className={cn(
          "flex items-center gap-2 font-semibold",
          collapsed ? "justify-center w-full" : ""
        )}
      >
        <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center flex-shrink-0">
          <span className="text-primary-foreground font-bold text-sm">
            V
          </span>
        </div>
        {!collapsed && <span className="text-sm">VuleraOS</span>}
      </Link>
      {onCollapse && (
        <Button
          variant="ghost"
          size="icon"
          className={cn("h-6 w-6 ml-auto flex-shrink-0", collapsed && "ml-0")}
          onClick={onCollapse}
        >
          {collapsed ? (
            <ChevronRight className="h-3 w-3" />
          ) : (
            <ChevronLeft className="h-3 w-3" />
          )}
        </Button>
      )}
    </div>
  );
}

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const mobileOpen = useMobileSidebar((state) => state.open);
  const setMobileOpen = useMobileSidebar((state) => state.setOpen);

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className={cn(
          "hidden md:flex border-r bg-sidebar flex-col transition-all duration-200",
          collapsed ? "w-16" : "w-56"
        )}
      >
        <SidebarLogo collapsed={collapsed} onCollapse={() => setCollapsed(!collapsed)} />
        <SidebarNav collapsed={collapsed} />
      </aside>

      {/* Mobile sidebar drawer */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-64 p-0 gap-0 md:hidden">
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <SidebarLogo collapsed={false} />
          <SidebarNav collapsed={false} onNavigate={() => setMobileOpen(false)} />
        </SheetContent>
      </Sheet>
    </>
  );
}

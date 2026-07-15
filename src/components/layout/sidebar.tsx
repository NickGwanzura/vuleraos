"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
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

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        "border-r bg-sidebar flex flex-col transition-all duration-200",
        collapsed ? "w-16" : "w-56"
      )}
    >
      {/* Logo area */}
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
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "h-6 w-6 ml-auto flex-shrink-0",
            collapsed && "ml-0"
          )}
          onClick={() => setCollapsed(!collapsed)}
        >
          {collapsed ? (
            <ChevronRight className="h-3 w-3" />
          ) : (
            <ChevronLeft className="h-3 w-3" />
          )}
        </Button>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1">
        <nav className={cn("p-2 space-y-1", collapsed && "px-2")}>
          {navItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link key={item.href} href={item.href}>
                <Button
                  variant={isActive ? "secondary" : "ghost"}
                  size={collapsed ? "icon" : "sm"}
                  className={cn(
                    "w-full justify-start gap-2",
                    collapsed && "justify-center px-0",
                    isActive && "bg-sidebar-accent font-medium"
                  )}
                >
                  {item.icon}
                  {!collapsed && <span className="text-sm">{item.label}</span>}
                </Button>
              </Link>
            );
          })}
        </nav>
      </ScrollArea>
    </aside>
  );
}

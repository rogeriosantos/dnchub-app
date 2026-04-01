"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  LayoutDashboard,
  Truck,
  Users,
  Fuel,
  Wrench,
  MapPin,
  Building2,
  BarChart,
  Settings,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  List,
  Layers,
  Plus,
  TrendingUp,
  UserPlus,
  BarChart3,
  Calendar,
  ClipboardList,
  History,
  DollarSign,
  Map,
  Route,
  MapPinned,
  Bell,
  PiggyBank,
  Share2,
  FileText,
  FileEdit,
  Clock,
  Building,
  Puzzle,
  Receipt,
  Container,
  Package,
  PackageOpen,
  ClipboardCheck,
  Briefcase,
  FolderTree,
  Plug,
  UserCircle,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";
import type { NavItem } from "@/types";

// Icon mapping
const iconMap: Record<string, LucideIcon> = {
  LayoutDashboard,
  Truck,
  Users,
  Fuel,
  Wrench,
  MapPin,
  Building2,
  BarChart,
  Settings,
  HelpCircle,
  List,
  Layers,
  Plus,
  TrendingUp,
  UserPlus,
  BarChart3,
  Calendar,
  ClipboardList,
  History,
  DollarSign,
  Map,
  Route,
  MapPinned,
  Bell,
  PiggyBank,
  Share2,
  FileText,
  FileEdit,
  Clock,
  Building,
  Puzzle,
  Receipt,
  Container,
  Package,
  PackageOpen,
  ClipboardCheck,
  Briefcase,
  FolderTree,
  Plug,
  UserCircle,
  ShieldCheck,
};

interface SidebarProps {
  navigation: NavItem[];
  isCollapsed: boolean;
  onToggle: () => void;
  moduleName?: string;
  moduleIcon?: LucideIcon;
}

interface NavItemComponentProps {
  item: NavItem;
  isCollapsed: boolean;
  isActive: boolean;
  isExpanded: boolean;
  onToggle: () => void;
  pathname: string;
  t: (key: string) => string;
}

function NavItemComponent({
  item,
  isCollapsed,
  isActive,
  isExpanded,
  onToggle,
  pathname,
  t,
}: NavItemComponentProps) {
  const Icon = iconMap[item.icon] || LayoutDashboard;
  const hasChildren = item.children && item.children.length > 0;
  const translatedLabel = t(item.label);

  const content = (
    <div
      className={cn(
        "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150 ease-out",
        isActive
          ? "bg-primary text-primary-foreground shadow-sm"
          : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
        isCollapsed && "justify-center px-2"
      )}
    >
      <Icon className={cn("h-5 w-5 shrink-0", isActive && "drop-shadow-sm")} />
      {!isCollapsed && (
        <>
          <span className="flex-1 text-left">{translatedLabel}</span>
          {item.badge && item.badge.value && item.badge.value > 0 && (
            <Badge
              variant={
                item.badge.color === "danger"
                  ? "destructive"
                  : item.badge.color === "warning"
                  ? "secondary"
                  : "default"
              }
              className="h-5 min-w-5 justify-center px-1.5 text-xs font-semibold"
            >
              {item.badge.value}
            </Badge>
          )}
          {hasChildren && (
            <ChevronDown
              className={cn(
                "h-4 w-4 shrink-0 transition-transform duration-150 ease-out",
                isExpanded && "rotate-180"
              )}
            />
          )}
        </>
      )}
    </div>
  );

  if (isCollapsed) {
    return (
      <Tooltip delayDuration={0}>
        <TooltipTrigger asChild>
          <Link href={item.url} className="block">
            {content}
          </Link>
        </TooltipTrigger>
        <TooltipContent side="right" className="flex items-center gap-2">
          {translatedLabel}
          {item.badge && item.badge.value && item.badge.value > 0 && (
            <Badge
              variant={
                item.badge.color === "danger"
                  ? "destructive"
                  : item.badge.color === "warning"
                  ? "secondary"
                  : "default"
              }
              className="h-5 min-w-5 justify-center px-1.5 text-xs"
            >
              {item.badge.value}
            </Badge>
          )}
        </TooltipContent>
      </Tooltip>
    );
  }

  if (hasChildren) {
    return (
      <div>
        <button onClick={onToggle} className="w-full text-left">
          {content}
        </button>
        {isExpanded && (
          <div className="ml-6 mt-1 space-y-0.5 border-l-2 border-sidebar-border pl-3">
            {item.children?.map((child) => {
              const ChildIcon = iconMap[child.icon] || List;
              // Check if this child is active - exact match OR a sub-path that isn't another sibling
              const isExactMatch = pathname === child.url;
              const isSubPath = pathname.startsWith(child.url + "/");
              // Check if any OTHER sibling has a more specific match
              const hasMoreSpecificSibling = item.children?.some(
                (sibling) =>
                  sibling.id !== child.id &&
                  (pathname === sibling.url || pathname.startsWith(sibling.url + "/"))
              );
              const isChildActive = isExactMatch || (isSubPath && !hasMoreSpecificSibling);
              return (
                <Link
                  key={child.id}
                  href={child.url}
                  className={cn(
                    "flex items-center gap-2 rounded-md px-3 py-1.5 text-sm transition-all duration-150 ease-out",
                    isChildActive
                      ? "bg-primary/10 text-primary font-medium"
                      : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  )}
                >
                  <ChildIcon className="h-4 w-4 shrink-0" />
                  <span>{t(child.label)}</span>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  return (
    <Link href={item.url} className="block">
      {content}
    </Link>
  );
}

export function Sidebar({ navigation, isCollapsed, onToggle, moduleName = 'DNC Manager', moduleIcon: ModuleIcon = Wrench }: SidebarProps) {
  const pathname = usePathname();
  const { t } = useTranslation();
  const [expandedItems, setExpandedItems] = React.useState<Set<string>>(new Set());

  // Auto-expand active parent items
  React.useEffect(() => {
    const newExpanded = new Set<string>();
    navigation.forEach((item) => {
      if (item.children?.some((child) => pathname.startsWith(child.url))) {
        newExpanded.add(item.id);
      }
    });
    setExpandedItems(newExpanded);
  }, [pathname, navigation]);

  const toggleItem = (id: string) => {
    setExpandedItems((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const isItemActive = (item: NavItem): boolean => {
    if (pathname === item.url) return true;
    if (item.children?.some((child) => pathname.startsWith(child.url))) return true;
    return false;
  };

  // Split navigation into main and footer sections
  const mainNavItems = navigation.filter(
    (item) => item.id !== "nav-settings" && item.id !== "nav-help"
  );
  const footerNavItems = navigation.filter(
    (item) => item.id === "nav-settings" || item.id === "nav-help"
  );

  return (
    <TooltipProvider>
      <aside
        className={cn(
          "relative flex h-screen flex-col border-r border-sidebar-border bg-sidebar transition-all duration-200 ease-out",
          isCollapsed ? "w-[72px]" : "w-[260px]"
        )}
      >
        {/* Header */}
        <div className="flex h-16 items-center border-b border-sidebar-border px-4">
          {!isCollapsed && (
            <Link href="/dashboard" className="flex items-center gap-3 group">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary shadow-sm transition-all duration-150 group-hover:shadow-md group-hover:scale-105">
                <ModuleIcon className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="text-lg font-bold tracking-tight text-foreground">{moduleName}</span>
            </Link>
          )}
          {isCollapsed && (
            <Link href="/dashboard" className="mx-auto group">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary shadow-sm transition-all duration-150 group-hover:shadow-md group-hover:scale-105">
                <ModuleIcon className="h-5 w-5 text-primary-foreground" />
              </div>
            </Link>
          )}
        </div>

        {/* Toggle Button - Always visible */}
        <Button
          variant="outline"
          size="icon"
          onClick={onToggle}
          className={cn(
            "absolute -right-3 top-20 z-50 h-6 w-6 rounded-full border border-sidebar-border bg-sidebar shadow-sm hover:bg-sidebar-accent hover:shadow-md transition-all duration-150",
          )}
        >
          {isCollapsed ? (
            <ChevronRight className="h-3 w-3" />
          ) : (
            <ChevronLeft className="h-3 w-3" />
          )}
        </Button>

        {/* Main Navigation */}
        <ScrollArea className="flex-1 px-3 py-4">
          <nav className="space-y-1">
            {mainNavItems.map((item) => (
              <NavItemComponent
                key={item.id}
                item={item}
                isCollapsed={isCollapsed}
                isActive={isItemActive(item)}
                isExpanded={expandedItems.has(item.id)}
                onToggle={() => toggleItem(item.id)}
                pathname={pathname}
                t={t}
              />
            ))}
          </nav>
        </ScrollArea>

        {/* Footer Navigation */}
        <div className="mt-auto border-t px-3 py-4">
          <nav className="space-y-1">
            {footerNavItems.map((item) => (
              <NavItemComponent
                key={item.id}
                item={item}
                isCollapsed={isCollapsed}
                isActive={isItemActive(item)}
                isExpanded={expandedItems.has(item.id)}
                onToggle={() => toggleItem(item.id)}
                pathname={pathname}
                t={t}
              />
            ))}
          </nav>
        </div>
      </aside>
    </TooltipProvider>
  );
}

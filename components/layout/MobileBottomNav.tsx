"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Clock, LayoutGrid, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/", label: "Sheet", icon: Clock, match: (path: string) => path === "/" },
  {
    href: "/templates",
    label: "Templates",
    icon: LayoutGrid,
    match: (path: string) => path.startsWith("/templates"),
  },
  {
    href: "/settings",
    label: "Settings",
    icon: Settings,
    match: (path: string) => path.startsWith("/settings"),
  },
] as const;

export function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <nav className="transit-bottom-nav lg:hidden" aria-label="Primary">
      {NAV_ITEMS.map(({ href, label, icon: Icon, match }) => {
        const active = match(pathname);
        return (
          <Link
            key={href}
            href={href}
            className={cn("transit-bottom-nav__item", active && "is-active")}
            aria-current={active ? "page" : undefined}
          >
            <Icon className="transit-bottom-nav__icon" strokeWidth={active ? 2.5 : 2} />
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

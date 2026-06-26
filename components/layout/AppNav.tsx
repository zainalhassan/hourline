import Link from "next/link";
import { Settings } from "lucide-react";
import { signOutUser } from "@/actions/auth";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";

const NAV_LINKS = [
  { href: "/", label: "Timesheet" },
  { href: "/templates", label: "Templates" },
  { href: "/settings", label: "Settings" },
] as const;

export function AppNav() {
  return (
    <>
      <header className="sticky top-0 z-30 border-b border-border/80 bg-card/95 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-card/80">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 lg:h-[var(--component-nav-height)]">
          <Link href="/" className="text-lg font-bold tracking-tight text-primary">
            Hourline
          </Link>

          <nav className="hidden items-center gap-1 lg:flex lg:gap-2">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                {link.label}
              </Link>
            ))}
            <ThemeToggle />
            <form action={signOutUser}>
              <Button type="submit" variant="ghost" size="sm">
                Sign out
              </Button>
            </form>
          </nav>

          <div className="flex items-center gap-1 lg:hidden">
            <ThemeToggle />
          </div>
        </div>
      </header>
      <MobileBottomNav />
    </>
  );
}
